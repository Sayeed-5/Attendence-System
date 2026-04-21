import {
  clampPercentage,
  formatDayLabel,
  formatShortDateTime,
  getSessionStatus,
} from "./adminUtils";

function sameDate(dateA, dateB) {
  return new Date(dateA).toDateString() === new Date(dateB).toDateString();
}

export function buildSessionLookup(records) {
  return records.reduce((acc, record) => {
    const key = typeof record.sessionId === "object" ? record.sessionId?.id || record.sessionId?._id : record.sessionId;
    if (!key) return acc;

    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(record);
    return acc;
  }, {});
}

export function enrichSessions(sessions, teachers, records, totalStudents) {
  const teacherMap = teachers.reduce((acc, teacher) => {
    acc[teacher.id || teacher._id] = teacher;
    return acc;
  }, {});

  const recordsBySessionId = buildSessionLookup(records);

  return sessions.map((session, index) => {
    const teacher = teacherMap[session.teacherId] || null;
    const sessionRecords = recordsBySessionId[session.id || session._id] || [];
    const attendedCount = sessionRecords.filter((record) => ["present", "flagged"].includes(record.status)).length;
    const absentCount = Math.max(0, totalStudents - attendedCount);
    const occupancyPercentage = totalStudents ? clampPercentage((attendedCount / totalStudents) * 100) : 0;

    return {
      ...session,
      rowId: session.id || session._id || `session-${index}`,
      teacher,
      sessionRecords,
      attendedCount,
      absentCount,
      occupancyPercentage,
      statusLabel: getSessionStatus(session),
      locationLabel:
        session.location?.label ||
        session.locationLabel ||
        teacher?.branch ||
        "Campus Block",
    };
  });
}

export function buildOverviewInsights({ students, teachers, sessions, records }) {
  const today = new Date();
  const totalStudents = students.length;
  const totalTeachers = teachers.length;
  const enrichedSessions = enrichSessions(sessions, teachers, records, totalStudents);

  const todayRecords = records.filter((record) => record.timestamp && sameDate(record.timestamp, today));
  const todayPresent = todayRecords.filter((record) => ["present", "flagged"].includes(record.status)).length;
  const todayAbsences = Math.max(0, totalStudents - todayPresent);

  const upcomingSessions = enrichedSessions
    .filter((session) => ["Scheduled", "Starting Soon", "In Progress"].includes(session.statusLabel))
    .sort((left, right) => new Date(left.startTime || 0) - new Date(right.startTime || 0))
    .slice(0, 5);

  const weeklyTrend = Array.from({ length: 7 }).map((_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (6 - index));

    const daySessions = enrichedSessions.filter((session) => session.startTime && sameDate(session.startTime, day));
    const attended = daySessions.reduce((sum, session) => sum + session.attendedCount, 0);
    const maxPossible = daySessions.length * Math.max(totalStudents, 1);
    const percentage = daySessions.length ? clampPercentage((attended / maxPossible) * 100) : 0;

    return {
      label: formatDayLabel(day),
      percentage,
    };
  });

  const absenceBreakdown = {
    medical: records.filter((record) => record.adminNote && /medical/i.test(record.adminNote)).length,
    personal: records.filter((record) => record.adminNote && /personal|family/i.test(record.adminNote)).length,
    unexcused: records.filter((record) => record.status === "absent" || record.status === "flagged").length,
    other: records.filter((record) => record.adminNote && !/medical|personal|family/i.test(record.adminNote)).length,
  };

  const totalBreakdown = Object.values(absenceBreakdown).reduce((sum, value) => sum + value, 0);

  const sessionOccupancy = enrichedSessions
    .slice()
    .sort((left, right) => right.occupancyPercentage - left.occupancyPercentage)
    .slice(0, 5)
    .map((session) => ({
      label: session.subject?.slice(0, 6)?.toUpperCase() || "CLASS",
      value: session.occupancyPercentage,
    }));

  const recentActivity = [
    ...enrichedSessions.slice(0, 3).map((session) => ({
      id: `session-${session.rowId}`,
      title: `${session.subject} scheduled`,
      meta: session.teacher?.name || "Faculty",
      time: formatShortDateTime(session.startTime),
      accent: "session",
    })),
    ...records.slice(0, 4).map((record, index) => ({
      id: `record-${record.id || record._id || index}`,
      title: `${record.studentName || record.studentId?.name || "Student"} marked ${record.status}`,
      meta: typeof record.sessionId === "object" ? record.sessionId?.subject || "Session" : "Attendance update",
      time: formatShortDateTime(record.timestamp),
      accent: "attendance",
    })),
  ]
    .sort((left, right) => new Date(right.time || 0) - new Date(left.time || 0))
    .slice(0, 5);

  const attendanceRate = totalStudents
    ? clampPercentage((records.filter((record) => ["present", "flagged"].includes(record.status)).length / Math.max(sessions.length * totalStudents, 1)) * 100)
    : 0;

  return {
    totalStudents,
    totalTeachers,
    upcomingCount: upcomingSessions.length,
    attendanceRate,
    todayAbsences,
    weeklyTrend,
    absenceBreakdown,
    totalBreakdown,
    sessionOccupancy,
    recentActivity,
    upcomingSessions,
    enrichedSessions,
  };
}
