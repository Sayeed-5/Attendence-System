import { SpinnerGap } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AdminOverview from "../components/admin/AdminOverview";
import AdminShell from "../components/admin/AdminShell";
import { adminNavItems } from "../components/admin/AdminSidebar";
import SessionManagement from "../components/admin/SessionManagement";
import StudentManagement from "../components/admin/StudentManagement";
import TeacherManagement from "../components/admin/TeacherManagement";
import { AttendanceSection } from "../components/admin/SimpleAdminSections";
import { useAuth } from "../context/AuthContext";
import { adminApi } from "../services/adminApi";

const emptyAttendanceForm = {
  studentId: "",
  sessionId: "",
  status: "present",
  score: 100,
  adminNote: "",
};

function normalizeItems(items) {
  return (items || []).map((item) => ({
    ...item,
    id: item.id || item._id,
  }));
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [creatingStudent, setCreatingStudent] = useState(false);
  const [creatingTeacher, setCreatingTeacher] = useState(false);

  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [records, setRecords] = useState([]);

  const [attendanceForm, setAttendanceForm] = useState(emptyAttendanceForm);

  const summary = useMemo(
    () => ({
      students: students.length,
      teachers: teachers.length,
      sessions: sessions.length,
      attendance: records.length,
    }),
    [students.length, teachers.length, sessions.length, records.length]
  );

  async function loadAll() {
    setLoading(true);

    try {
      const [studentRes, teacherRes, sessionRes, attendanceRes] = await Promise.all([
        adminApi.listUsers({ role: "student", page: 1, limit: 100 }),
        adminApi.listUsers({ role: "teacher", page: 1, limit: 100 }),
        adminApi.listSessions({ page: 1, limit: 100 }),
        adminApi.listAttendance({ page: 1, limit: 100 }),
      ]);

      const nextStudents = normalizeItems(studentRes.data.data);
      const nextTeachers = normalizeItems(teacherRes.data.data);
      const nextSessions = normalizeItems(sessionRes.data.data);
      const nextRecords = normalizeItems(attendanceRes.data.data);

      setStudents(nextStudents);
      setTeachers(nextTeachers);
      setSessions(nextSessions);
      setRecords(nextRecords);

      setAttendanceForm((current) => ({
        ...current,
        studentId: current.studentId || nextStudents[0]?.id || "",
        sessionId: current.sessionId || nextSessions[0]?.id || "",
      }));
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  async function createUser(payload) {
    await adminApi.createUser(payload);
    await loadAll();
  }

  async function handleAddStudent(form) {
    setCreatingStudent(true);

    try {
      await createUser({ ...form, role: "student" });
      toast.success("Student created");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.msg || "Student create failed");
      return false;
    } finally {
      setCreatingStudent(false);
    }
  }

  async function handleAddTeacher(form) {
    setCreatingTeacher(true);

    try {
      await createUser({ ...form, role: "teacher" });
      toast.success("Teacher created");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.msg || "Teacher create failed");
      return false;
    } finally {
      setCreatingTeacher(false);
    }
  }

  async function handleDeleteUser(id) {
    if (!window.confirm("Delete this user?")) return;

    try {
      await adminApi.deleteUser(id);
      toast.success("User deleted");
      await loadAll();
    } catch (error) {
      toast.error(error.response?.data?.msg || "Delete failed");
    }
  }

  async function handleCreateSession(payload) {
    try {
      await adminApi.createSession(payload);
      toast.success("Session created");
      await loadAll();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.msg || "Create session failed");
      return false;
    }
  }

  async function handleCloseSession(id) {
    try {
      await adminApi.updateSession(id, { isActive: false });
      toast.success("Session closed");
      await loadAll();
    } catch (error) {
      toast.error(error.response?.data?.msg || "Update failed");
    }
  }

  async function handleUpdateSession(id, payload) {
    try {
      await adminApi.updateSession(id, payload);
      toast.success("Session updated");
      await loadAll();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.msg || "Update failed");
      return false;
    }
  }

  async function handleDeleteSession(id) {
    if (!window.confirm("Delete this session?")) return;

    try {
      await adminApi.deleteSession(id);
      toast.success("Session deleted");
      await loadAll();
    } catch (error) {
      toast.error(error.response?.data?.msg || "Delete failed");
    }
  }

  async function handleAddAttendance(event) {
    event.preventDefault();

    try {
      await adminApi.createAttendance(attendanceForm);
      toast.success("Attendance added");
      await loadAll();
    } catch (error) {
      toast.error(error.response?.data?.msg || "Create attendance failed");
    }
  }

  async function handleUpdateAttendance(id, status) {
    try {
      await adminApi.updateAttendance(id, { status });
      toast.success("Attendance updated");
      await loadAll();
    } catch (error) {
      toast.error(error.response?.data?.msg || "Update failed");
    }
  }

  async function handleDeleteAttendance(id) {
    if (!window.confirm("Delete this attendance record?")) return;

    try {
      await adminApi.deleteAttendance(id);
      toast.success("Attendance deleted");
      await loadAll();
    } catch (error) {
      toast.error(error.response?.data?.msg || "Delete failed");
    }
  }

  const pageContent = loading ? (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="inline-flex items-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-5 py-4 text-slate-200">
        <SpinnerGap size={22} className="animate-spin text-[#8e7dff]" />
        Loading admin data...
      </div>
    </div>
  ) : (
    <div className="space-y-6">
      {tab === "overview" ? (
        <AdminOverview
          students={students}
          teachers={teachers}
          sessions={sessions}
          records={records}
          onOpenSessions={() => setTab("sessions")}
        />
      ) : null}

      {tab === "students" ? (
        <StudentManagement
          students={students}
          onAddStudent={handleAddStudent}
          onDeleteStudent={handleDeleteUser}
          creatingStudent={creatingStudent}
        />
      ) : null}

      {tab === "teachers" ? (
        <TeacherManagement
          teachers={teachers}
          sessions={sessions}
          onAddTeacher={handleAddTeacher}
          onDeleteTeacher={handleDeleteUser}
          creatingTeacher={creatingTeacher}
        />
      ) : null}

      {tab === "sessions" ? (
        <SessionManagement
          sessions={sessions}
          teachers={teachers}
          students={students}
          records={records}
          onCreateSession={handleCreateSession}
          onUpdateSession={handleUpdateSession}
          onCloseSession={handleCloseSession}
          onDeleteSession={handleDeleteSession}
        />
      ) : null}

      {tab === "attendance" ? (
        <AttendanceSection
          records={records}
          students={students}
          sessions={sessions}
          attendanceForm={attendanceForm}
          onAttendanceFormChange={(key, value) => setAttendanceForm((current) => ({ ...current, [key]: value }))}
          onAddAttendance={handleAddAttendance}
          onUpdateAttendance={handleUpdateAttendance}
          onDeleteAttendance={handleDeleteAttendance}
        />
      ) : null}
    </div>
  );

  return (
    <AdminShell
      user={user}
      navItems={adminNavItems}
      activeTab={tab}
      onTabChange={setTab}
      onLogout={handleLogout}
    >
      {pageContent}
    </AdminShell>
  );
}
