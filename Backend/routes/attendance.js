// routes/attendance.js
const express = require("express");
const router = express.Router();
const Attendance = require("../models/Attendance");
const Session = require("../models/Session");
const User = require("../models/User");
const { verifyToken } = require("../middleware/auth");

/**
 * Haversine formula - returns distance in meters
 */
function getDistance(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);

  return earthRadius * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function getSessionEndTime(session) {
  if (session.endTime) {
    return new Date(session.endTime);
  }

  const durationMinutes =
    Number.isFinite(Number(session.timeLimit)) && Number(session.timeLimit) > 0
      ? Number(session.timeLimit)
      : 60;

  return new Date(new Date(session.startTime).getTime() + durationMinutes * 60 * 1000);
}

function isSessionActiveNow(session, now = new Date()) {
  const startTime = new Date(session.startTime);
  const endTime = getSessionEndTime(session);

  return Boolean(session.isActive) && now >= startTime && now <= endTime;
}

/**
 * POST /api/attendance/mark
 * Student marks attendance for an active session
 */
router.post("/mark", verifyToken, async (req, res) => {
  try {
    const { sessionId, lat, lng, deviceId } = req.body;

    const student = await User.findOne({ firebaseUid: req.firebaseUser.uid });
    if (!student || student.role !== "student") {
      return res.status(403).json({ msg: "Only students can mark attendance" });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ msg: "Session not found" });
    }

    const now = new Date();
    if (!isSessionActiveNow(session, now)) {
      if (session.isActive && getSessionEndTime(session) < now) {
        session.isActive = false;
        await session.save();
      }

      return res.status(400).json({
        success: false,
        msg: "Session is not active right now",
      });
    }

    const existing = await Attendance.findOne({
      studentId: student._id,
      sessionId,
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        msg: "Attendance already marked",
      });
    }

    const numericLat = Number(lat);
    const numericLng = Number(lng);
    if (!Number.isFinite(numericLat) || !Number.isFinite(numericLng)) {
      return res.status(400).json({
        success: false,
        msg: "Location is required to mark attendance",
      });
    }

    const distance = getDistance(
      numericLat,
      numericLng,
      session.location.lat,
      session.location.lng
    );
    const allowedRadius = session.radius || 100;
    if (distance > allowedRadius) {
      return res.status(400).json({
        success: false,
        msg: "You are outside the allowed attendance radius",
      });
    }

    const flags = [];
    let score = 100;

    if (deviceId) {
      const sameDevice = await Attendance.findOne({ sessionId, deviceId });
      if (sameDevice && sameDevice.studentId.toString() !== student._id.toString()) {
        flags.push("SHARED_DEVICE");
        score -= 40;
      }

      if (!student.deviceIds.includes(deviceId)) {
        student.deviceIds.push(deviceId);
        await student.save();
      }
    }

    const status = score < 70 ? "flagged" : "present";

    const attendance = await Attendance.create({
      studentId: student._id,
      sessionId,
      studentName: student.name,
      studentEmail: student.email,
      timestamp: now,
      location: { lat: numericLat, lng: numericLng },
      deviceId: deviceId || "",
      score,
      status,
      flags,
    });

    res.json({
      success: true,
      status,
      attendance,
      message:
        status === "present"
          ? "Attendance marked successfully"
          : "Attendance marked with flags",
    });
  } catch (err) {
    console.error("Mark attendance error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * GET /api/attendance/session/:sessionId
 * Get all attendance records for a session (teacher dashboard)
 */
router.get("/session/:sessionId", verifyToken, async (req, res) => {
  try {
    const records = await Attendance.find({ sessionId: req.params.sessionId })
      .populate("studentId", "name email regNo branch semester profilePicture")
      .sort({ timestamp: 1 })
      .lean();

    res.json(records);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/session/:sessionId/roster", verifyToken, async (req, res) => {
  try {
    const teacher = await User.findOne({ firebaseUid: req.firebaseUser.uid });
    if (!teacher || teacher.role !== "teacher") {
      return res.status(403).json({ msg: "Only teachers can view this roster" });
    }

    const session = await Session.findById(req.params.sessionId).lean();
    if (!session) {
      return res.status(404).json({ msg: "Session not found" });
    }

    if (session.teacherId.toString() !== teacher._id.toString()) {
      return res.status(403).json({ msg: "Not your session" });
    }

    const [students, rawRecords] = await Promise.all([
      User.find({ role: "student" })
        .select("name email regNo branch semester profilePicture")
        .sort({ name: 1 })
        .lean(),
      Attendance.find({ sessionId: req.params.sessionId })
        .populate("studentId", "name email regNo branch semester profilePicture")
        .sort({ timestamp: 1 })
        .lean(),
    ]);

    const recordByStudentId = new Map(
      rawRecords
        .filter((record) => record.studentId?._id)
        .map((record) => [record.studentId._id.toString(), record])
    );

    const absentRecords = students
      .filter((student) => !recordByStudentId.has(student._id.toString()))
      .map((student) => ({
        _id: `absent-${req.params.sessionId}-${student._id}`,
        studentId: student,
        studentName: student.name,
        studentEmail: student.email,
        status: "absent",
        score: 0,
        flags: [],
        synthetic: true,
        timestamp: session.endTime || session.startTime || session.createdAt,
      }));

    const records = [...rawRecords, ...absentRecords];
    const presentCount = rawRecords.filter((record) => record.status === "present").length;
    const flaggedCount = rawRecords.filter((record) => record.status === "flagged").length;
    const absentCount = absentRecords.length;
    const attendedCount = presentCount + flaggedCount;
    const totalStudents = students.length;
    const attendancePercentage =
      totalStudents === 0 ? 0 : Math.round((attendedCount / totalStudents) * 100);

    res.json({
      records,
      presentCount,
      flaggedCount,
      absentCount,
      attendedCount,
      totalStudents,
      attendancePercentage,
    });
  } catch (err) {
    console.error("Session roster error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * GET /api/attendance/teacher/stats
 * Get analytics for the logged-in teacher
 */
router.get("/teacher/stats", verifyToken, async (req, res) => {
  try {
    const teacher = await User.findOne({ firebaseUid: req.firebaseUser.uid });
    if (!teacher) return res.status(404).json({ msg: "User not found" });

    const totalStudents = await User.countDocuments({ role: "student" });
    const sessions = await Session.find({ teacherId: teacher._id }).sort({ createdAt: -1 });
    const totalSessions = sessions.length;

    let totalAttendancePercentage = 0;
    const trendData = [];
    const recentSessions = sessions.slice(0, 5).reverse();

    for (const session of recentSessions) {
      const attendees = await Attendance.countDocuments({
        sessionId: session._id,
        status: { $in: ["present", "flagged"] },
      });

      const sessionPct =
        totalStudents === 0 ? 0 : Math.round((attendees / totalStudents) * 100);

      trendData.push({
        label: `${session.subject.substring(0, 5)} ${new Date(session.createdAt).getDate()}`,
        percentage: sessionPct,
        attendees,
      });
    }

    if (totalSessions > 0 && totalStudents > 0) {
      const allAttendees = await Attendance.countDocuments({
        sessionId: { $in: sessions.map((session) => session._id) },
        status: { $in: ["present", "flagged"] },
      });
      const maxPossibleAttendees = totalSessions * totalStudents;
      totalAttendancePercentage = Math.round(
        (allAttendees / maxPossibleAttendees) * 100
      );
    }

    res.json({
      totalStudents,
      totalSessions,
      overallAvgPercentage: totalAttendancePercentage,
      trendData,
    });
  } catch (err) {
    console.error("Teacher stats error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * GET /api/attendance/student/stats
 * Get attendance statistics for the logged-in student
 */
router.get("/student/stats", verifyToken, async (req, res) => {
  try {
    const student = await User.findOne({ firebaseUid: req.firebaseUser.uid });
    if (!student) return res.status(404).json({ msg: "User not found" });

    const totalSessions = await Session.countDocuments({});
    const attendedSessions = await Attendance.countDocuments({
      studentId: student._id,
      status: { $in: ["present", "flagged"] },
    });

    const percentage =
      totalSessions === 0 ? 0 : Math.round((attendedSessions / totalSessions) * 100);

    const allSessions = await Session.find({}).sort({ startTime: -1 }).lean();
    const studentAttendance = await Attendance.find({
      studentId: student._id,
      status: { $in: ["present", "flagged"] },
    }).lean();

    const attendedSessionIds = new Set(
      studentAttendance.map((attendance) => attendance.sessionId.toString())
    );

    let streak = 0;
    for (const session of allSessions) {
      if (attendedSessionIds.has(session._id.toString())) {
        streak += 1;
      } else {
        break;
      }
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayAttendance = await Attendance.findOne({
      studentId: student._id,
      timestamp: { $gte: todayStart, $lte: todayEnd },
      status: { $in: ["present", "flagged"] },
    }).lean();

    const checkedInToday = !!todayAttendance;
    const now = new Date();
    const activeSessions = await Session.find({
      isActive: true,
      startTime: { $lte: now },
      endTime: { $gte: now },
    }).lean();

    res.json({
      totalSessions,
      attendedSessions,
      percentage,
      streak,
      checkedInToday,
      activeSessionCount: activeSessions.length,
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * GET /api/attendance/student/history
 * Get attendance history for the logged-in student
 */
router.get("/student/history", verifyToken, async (req, res) => {
  try {
    const student = await User.findOne({ firebaseUid: req.firebaseUser.uid });
    if (!student) return res.status(404).json({ msg: "User not found" });

    const attendanceRecords = await Attendance.find({ studentId: student._id })
      .populate({
        path: "sessionId",
        select: "subject startTime endTime sessionCode location radius teacherId isActive createdAt",
        populate: {
          path: "teacherId",
          select: "name",
        },
      })
      .sort({ timestamp: -1 })
      .lean();

    const attendedSessionIds = attendanceRecords
      .map((record) => record.sessionId?._id?.toString())
      .filter(Boolean);

    const unattendedSessions = await Session.find({
      isActive: false,
      _id: { $nin: attendedSessionIds },
    })
      .populate("teacherId", "name")
      .sort({ endTime: -1, startTime: -1, createdAt: -1 })
      .lean();

    const absentRecords = unattendedSessions.map((session) => ({
      _id: `absent-${session._id}-${student._id}`,
      studentId: student._id,
      sessionId: session,
      status: "absent",
      timestamp: session.endTime || session.startTime || session.createdAt,
      synthetic: true,
    }));

    const records = [...attendanceRecords, ...absentRecords]
      .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
      .slice(0, 50);

    res.json(records);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * GET /api/attendance/export/:sessionId
 * Export CSV of attendance for a session
 */
router.get("/export/:sessionId", verifyToken, async (req, res) => {
  try {
    const records = await Attendance.find({ sessionId: req.params.sessionId })
      .populate("studentId", "name email regNo branch")
      .sort({ timestamp: 1 })
      .lean();

    const session = await Session.findById(req.params.sessionId);

    const headers = "Name,Email,Reg No,Branch,Time,Status,Score,Flags\n";
    const rows = records
      .map((record) => {
        const student = record.studentId || {};
        return [
          `"${student.name || record.studentName || ""}"`,
          `"${student.email || record.studentEmail || ""}"`,
          `"${student.regNo || ""}"`,
          `"${student.branch || ""}"`,
          `"${new Date(record.timestamp).toLocaleString()}"`,
          record.status,
          record.score,
          `"${(record.flags || []).join(", ")}"`,
        ].join(",");
      })
      .join("\n");

    const csv = headers + rows;
    const filename = `attendance_${
      session ? session.subject : "export"
    }_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    console.error("Export error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * GET /api/attendance/count/:sessionId
 * Get live attendance count for a session (polling)
 */
router.get("/count/:sessionId", verifyToken, async (req, res) => {
  try {
    const totalRegistered = await User.countDocuments({ role: "student" });
    const present = await Attendance.countDocuments({
      sessionId: req.params.sessionId,
      status: "present",
    });
    const flagged = await Attendance.countDocuments({
      sessionId: req.params.sessionId,
      status: "flagged",
    });

    const absent = Math.max(0, totalRegistered - (present + flagged));

    res.json({ total: totalRegistered, present, flagged, absent });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
