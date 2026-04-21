import { useMemo } from "react";
import DataTableSection from "./DataTableSection";
import UserCreateForm from "./UserCreateForm";
import { formatDateTime } from "./adminUtils";

export function TeachersSection({
  teachers,
  teacherForm,
  onTeacherFormChange,
  onAddTeacher,
  onUpdateUserRole,
  onDeleteUser,
}) {
  const rows = useMemo(
    () =>
      teachers.map((teacher) => ({
        key: teacher.id || teacher._id,
        cells: [
          <div key="name">
            <p className="font-semibold text-white">{teacher.name}</p>
            <p className="mt-1 text-xs text-slate-500">{teacher.email}</p>
          </div>,
          teacher.dept || "-",
          teacher.subject || "-",
          <select
            key="role"
            value={teacher.role}
            onChange={(event) => onUpdateUserRole(teacher.id || teacher._id, event.target.value)}
            className="rounded-xl border border-white/10 bg-[#0f1217] px-3 py-2 text-sm text-white outline-none"
          >
            <option value="student">student</option>
            <option value="teacher">teacher</option>
            <option value="admin">admin</option>
          </select>,
          <button
            key="delete"
            type="button"
            onClick={() => onDeleteUser(teacher.id || teacher._id)}
            className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200"
          >
            Delete
          </button>,
        ],
      })),
    [teachers, onDeleteUser, onUpdateUserRole]
  );

  return (
    <div className="space-y-5">
      <UserCreateForm
        title="Teacher management"
        description="Add new teachers yahin se continue hoga. Existing create flow same API ke saath reuse ho raha hai."
        buttonLabel="Add Teacher"
        form={teacherForm}
        onChange={onTeacherFormChange}
        onSubmit={onAddTeacher}
      />

      <DataTableSection
        title="Teachers list"
        description="Teacher accounts, role aur basic metadata."
        columns={[
          { key: "identity", label: "Teacher" },
          { key: "dept", label: "Department" },
          { key: "subject", label: "Subject" },
          { key: "role", label: "Role" },
          { key: "action", label: "Action", align: "right" },
        ]}
        rows={rows}
        emptyMessage="No teachers found."
      />
    </div>
  );
}

export function SessionsSection({
  sessions,
  sessionForm,
  teachers,
  onSessionFormChange,
  onAddSession,
  onCloseSession,
  onDeleteSession,
}) {
  const rows = useMemo(
    () =>
      sessions.map((session) => ({
        key: session.id || session._id,
        cells: [
          session.subject || "-",
          session.sessionCode || "-",
          formatDateTime(session.startTime),
          session.isActive ? "Active" : "Closed",
          <div key="actions" className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => onCloseSession(session.id || session._id)}
              className="rounded-xl border border-sky-400/20 bg-sky-500/10 px-3 py-2 text-sm text-sky-200"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => onDeleteSession(session.id || session._id)}
              className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200"
            >
              Delete
            </button>
          </div>,
        ],
      })),
    [sessions, onCloseSession, onDeleteSession]
  );

  return (
    <div className="space-y-5">
      <form onSubmit={onAddSession} className="grid gap-4 rounded-[28px] border border-white/8 bg-[#16191f]/92 p-5 shadow-[0_16px_44px_rgba(0,0,0,0.24)] md:grid-cols-5">
        <div className="md:col-span-5">
          <h2 className="font-['Space_Grotesk'] text-xl font-bold text-white">Create session</h2>
          <p className="mt-2 text-sm text-slate-400">Teacher assign karke nayi attendance session create kijiye.</p>
        </div>
        <select
          required
          value={sessionForm.teacherId}
          onChange={(event) => onSessionFormChange("teacherId", event.target.value)}
          className="rounded-2xl border border-white/10 bg-[#11141a] px-4 py-3 text-sm text-white outline-none"
        >
          <option value="">Teacher</option>
          {teachers.map((teacher) => (
            <option key={teacher.id || teacher._id} value={teacher.id || teacher._id}>
              {teacher.name}
            </option>
          ))}
        </select>
        <input
          required
          value={sessionForm.subject}
          onChange={(event) => onSessionFormChange("subject", event.target.value)}
          placeholder="Subject"
          className="rounded-2xl border border-white/10 bg-[#11141a] px-4 py-3 text-sm text-white outline-none"
        />
        <input
          type="number"
          min="1"
          value={sessionForm.timeLimit}
          onChange={(event) => onSessionFormChange("timeLimit", Number(event.target.value))}
          placeholder="Time limit"
          className="rounded-2xl border border-white/10 bg-[#11141a] px-4 py-3 text-sm text-white outline-none"
        />
        <input
          type="number"
          min="1"
          value={sessionForm.radius}
          onChange={(event) => onSessionFormChange("radius", Number(event.target.value))}
          placeholder="Radius"
          className="rounded-2xl border border-white/10 bg-[#11141a] px-4 py-3 text-sm text-white outline-none"
        />
        <button
          type="submit"
          className="rounded-2xl bg-[#7b61ff] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(123,97,255,0.32)] transition hover:bg-[#8b73ff]"
        >
          Create Session
        </button>
      </form>

      <DataTableSection
        title="Sessions"
        description="Existing sessions aur quick actions."
        columns={[
          { key: "subject", label: "Subject" },
          { key: "code", label: "Code" },
          { key: "start", label: "Start" },
          { key: "status", label: "Status" },
          { key: "actions", label: "Actions", align: "right" },
        ]}
        rows={rows}
        emptyMessage="No sessions found."
      />
    </div>
  );
}

export function AttendanceSection({
  records,
  students,
  sessions,
  attendanceForm,
  onAttendanceFormChange,
  onAddAttendance,
  onUpdateAttendance,
  onDeleteAttendance,
}) {
  const mobileRecords = useMemo(
    () =>
      records.map((record) => ({
        id: record.id || record._id,
        student: record.studentId?.name || record.studentName || "-",
        session: typeof record.sessionId === "object" ? record.sessionId?.subject : record.sessionId,
        status: record.status,
        score: record.score ?? 0,
        timestamp: formatDateTime(record.timestamp),
      })),
    [records]
  );

  const rows = useMemo(
    () =>
      records.map((record) => ({
        key: record.id || record._id,
        cells: [
          record.studentId?.name || record.studentName || "-",
          typeof record.sessionId === "object" ? record.sessionId?.subject : record.sessionId,
          <select
            key="status"
            value={record.status}
            onChange={(event) => onUpdateAttendance(record.id || record._id, event.target.value)}
            className="rounded-xl border border-white/10 bg-[#0f1217] px-3 py-2 text-sm text-white outline-none"
          >
            <option value="present">present</option>
            <option value="absent">absent</option>
            <option value="flagged">flagged</option>
          </select>,
          record.score ?? 0,
          formatDateTime(record.timestamp),
          <button
            key="delete"
            type="button"
            onClick={() => onDeleteAttendance(record.id || record._id)}
            className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200"
          >
            Delete
          </button>,
        ],
      })),
    [records, onDeleteAttendance, onUpdateAttendance]
  );

  return (
    <div className="space-y-5">
      <form onSubmit={onAddAttendance} className="grid gap-4 rounded-[28px] border border-white/8 bg-[#16191f]/92 p-5 shadow-[0_16px_44px_rgba(0,0,0,0.24)] md:grid-cols-6">
        <div className="md:col-span-6">
          <h2 className="font-['Space_Grotesk'] text-xl font-bold text-white">Add attendance record</h2>
          <p className="mt-2 text-sm text-slate-400">Manual attendance correction ya insertion ke liye.</p>
        </div>
        <select
          required
          value={attendanceForm.studentId}
          onChange={(event) => onAttendanceFormChange("studentId", event.target.value)}
          className="rounded-2xl border border-white/10 bg-[#11141a] px-4 py-3 text-sm text-white outline-none"
        >
          <option value="">Student</option>
          {students.map((student) => (
            <option key={student.id || student._id} value={student.id || student._id}>
              {student.name}
            </option>
          ))}
        </select>
        <select
          required
          value={attendanceForm.sessionId}
          onChange={(event) => onAttendanceFormChange("sessionId", event.target.value)}
          className="rounded-2xl border border-white/10 bg-[#11141a] px-4 py-3 text-sm text-white outline-none"
        >
          <option value="">Session</option>
          {sessions.map((session) => (
            <option key={session.id || session._id} value={session.id || session._id}>
              {session.subject}
            </option>
          ))}
        </select>
        <select
          value={attendanceForm.status}
          onChange={(event) => onAttendanceFormChange("status", event.target.value)}
          className="rounded-2xl border border-white/10 bg-[#11141a] px-4 py-3 text-sm text-white outline-none"
        >
          <option value="present">present</option>
          <option value="absent">absent</option>
          <option value="flagged">flagged</option>
        </select>
        <input
          type="number"
          value={attendanceForm.score}
          onChange={(event) => onAttendanceFormChange("score", Number(event.target.value))}
          className="rounded-2xl border border-white/10 bg-[#11141a] px-4 py-3 text-sm text-white outline-none"
          placeholder="Score"
        />
        <input
          value={attendanceForm.adminNote}
          onChange={(event) => onAttendanceFormChange("adminNote", event.target.value)}
          className="rounded-2xl border border-white/10 bg-[#11141a] px-4 py-3 text-sm text-white outline-none"
          placeholder="Admin note"
        />
        <button
          type="submit"
          className="rounded-2xl bg-[#7b61ff] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(123,97,255,0.32)] transition hover:bg-[#8b73ff]"
        >
          Add Record
        </button>
      </form>

      <div className="lg:hidden space-y-3">
        {mobileRecords.map((record) => (
          <div key={record.id} className="rounded-[22px] border border-white/8 bg-[#11141a] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-white">{record.student}</p>
                <p className="mt-1 text-sm text-slate-400">{record.session || "-"}</p>
              </div>
              <button
                type="button"
                onClick={() => onDeleteAttendance(record.id)}
                className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200"
              >
                Delete
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Status</p>
                <select
                  value={record.status}
                  onChange={(event) => onUpdateAttendance(record.id, event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f1217] px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="present">present</option>
                  <option value="absent">absent</option>
                  <option value="flagged">flagged</option>
                </select>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Score</p>
                <p className="mt-3 text-slate-200">{record.score}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Time</p>
                <p className="mt-1 text-slate-200">{record.timestamp}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden lg:block">
      <DataTableSection
        title="Attendance records"
        description="Attendance list aur quick status updates."
        columns={[
          { key: "student", label: "Student" },
          { key: "session", label: "Session" },
          { key: "status", label: "Status" },
          { key: "score", label: "Score" },
          { key: "time", label: "Time" },
          { key: "action", label: "Action", align: "right" },
        ]}
        rows={rows}
        emptyMessage="No attendance records found."
      />
      </div>
    </div>
  );
}
