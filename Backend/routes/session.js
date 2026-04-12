// routes/session.js
const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const Session = require("../models/Session");
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const { verifyToken } = require("../middleware/auth");

function getSessionEndTime(startTime, timeLimit, existingEndTime) {
  if (existingEndTime) {
    return new Date(existingEndTime);
  }

  const durationMinutes =
    Number.isFinite(Number(timeLimit)) && Number(timeLimit) > 0
      ? Number(timeLimit)
      : 60;

  return new Date(new Date(startTime).getTime() + durationMinutes * 60 * 1000);
}

function isSessionWithinWindow(session, now = new Date()) {
  const startTime = new Date(session.startTime);
  const endTime = getSessionEndTime(
    session.startTime,
    session.timeLimit,
    session.endTime
  );

  return now >= startTime && now <= endTime;
}

function getDistance(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  return earthRadius * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

async function closeExpiredSessions(filter = {}) {
  const now = new Date();

  await Session.updateMany(
    {
      isActive: true,
      endTime: { $lt: now },
      ...filter,
    },
    { $set: { isActive: false } }
  );
}

/**
 * POST /api/session/create
 * Teacher creates a new attendance session
 */
router.post("/create", verifyToken, async (req, res) => {
  try {
    // Verify user is a teacher
    const teacher = await User.findOne({ firebaseUid: req.firebaseUser.uid });
    if (!teacher || teacher.role !== "teacher") {
      return res.status(403).json({ msg: "Only teachers can create sessions" });
    }

    const { subject, timeLimit } = req.body;

    if (!subject) {
      return res.status(400).json({ msg: "Subject is required" });
    }

    // Force strict hardcoded college location
    const lat = 20.217426;
    const lng = 85.682104;

    const durationMinutes =
      Number.isFinite(Number(timeLimit)) && Number(timeLimit) > 0
        ? Number(timeLimit)
        : 60;

    // Only one active session is allowed per teacher.
    await Session.updateMany(
      { teacherId: teacher._id, isActive: true },
      { $set: { isActive: false, endTime: new Date() } }
    );

    // Generate unique session code for backward compatibility with the schema.
    const sessionCode = uuidv4().slice(0, 8).toUpperCase();
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    const session = await Session.create({
      teacherId: teacher._id,
      subject,
      sessionCode,
      startTime,
      endTime,
      timeLimit: durationMinutes,
      location: { lat, lng },
      radius: 100,
      isActive: true,
    });

    res.json(session);
  } catch (err) {
    console.error("Create session error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * GET /api/session/teacher/sessions
 * Get all sessions created by the logged-in teacher
 */
router.get("/teacher/sessions", verifyToken, async (req, res) => {
  try {
    const teacher = await User.findOne({ firebaseUid: req.firebaseUser.uid });
    if (!teacher) return res.status(404).json({ msg: "User not found" });

    await closeExpiredSessions({ teacherId: teacher._id });

    const sessions = await Session.find({ teacherId: teacher._id })
      .sort({ createdAt: -1 })
      .lean();

    // Fetch attendance count for each session
    const sessionsWithStats = await Promise.all(sessions.map(async (session) => {
      const attendees = await Attendance.countDocuments({ sessionId: session._id, status: { $in: ["present", "flagged"] } });
      return {
        ...session,
        attendees
      };
    }));

    res.json(sessionsWithStats);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * GET /api/session/active
 * Get the latest live active session for students
 */
router.get("/active", verifyToken, async (req, res) => {
  try {
    await closeExpiredSessions();

    const now = new Date();
    const activeSession = await Session.findOne({
      isActive: true,
      startTime: { $lte: now },
      endTime: { $gte: now },
    })
      .populate("teacherId", "name")
      .sort({ startTime: -1 })
      .lean();

    if (!activeSession || !isSessionWithinWindow(activeSession, now)) {
      return res.json(null);
    }

    const totalMarked = await Attendance.countDocuments({
      sessionId: activeSession._id,
    });

    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const hasLocation =
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      activeSession.location &&
      Number.isFinite(activeSession.location.lat) &&
      Number.isFinite(activeSession.location.lng);

    let isWithinRadius = null;
    if (hasLocation) {
      const distance = getDistance(
        lat,
        lng,
        activeSession.location.lat,
        activeSession.location.lng
      );
      isWithinRadius = distance <= (activeSession.radius || 100);
    }

    let alreadyMarked = false;
    const currentUser = await User.findOne({ firebaseUid: req.firebaseUser.uid }).lean();
    if (currentUser?.role === "student") {
      alreadyMarked = !!(await Attendance.findOne({
        studentId: currentUser._id,
        sessionId: activeSession._id,
      }).lean());
    }

    res.json({
      _id: activeSession._id,
      sessionId: activeSession._id,
      teacherName: activeSession.teacherId?.name || "Teacher",
      subject: activeSession.subject,
      startTime: activeSession.startTime,
      endTime: activeSession.endTime,
      location: activeSession.location,
      radius: activeSession.radius || 100,
      totalMarked,
      isWithinRadius,
      alreadyMarked,
      isActive: true,
    });
  } catch (err) {
    console.error("Active session error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * GET /api/session/code/:sessionCode
 * Backward-compatible session lookup
 */
router.get("/code/:sessionCode", verifyToken, async (req, res) => {
  try {
    const session = await Session.findOne({
      sessionCode: req.params.sessionCode,
    });
    if (!session) return res.status(404).json({ msg: "Session not found" });

    // Session auto-close logic removed - managed manually now
    
    res.json(session);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * GET /api/session/:id
 * Get session by MongoDB ID
 */
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ msg: "Session not found" });
    res.json(session);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * PATCH /api/session/:id/end
 * Teacher manually ends a session
 */
router.patch("/:id/end", verifyToken, async (req, res) => {
  try {
    const teacher = await User.findOne({ firebaseUid: req.firebaseUser.uid });
    const session = await Session.findById(req.params.id);

    if (!session) return res.status(404).json({ msg: "Session not found" });
    if (session.teacherId.toString() !== teacher._id.toString()) {
      return res.status(403).json({ msg: "Not your session" });
    }

    session.isActive = false;
    session.endTime = new Date(); // Using endTime to mark when session actually ended
    await session.save();

    res.json(session);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
