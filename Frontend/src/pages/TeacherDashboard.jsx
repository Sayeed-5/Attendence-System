import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import QRDisplay from "../components/QRDisplay";
import toast from "react-hot-toast";
import {
    ArrowLeft,
    CalendarBlank,
    ChartBar,
    CheckCircle,
    ClockCountdown,
    DownloadSimple,
    Export,
    FunnelSimple,
    GearSix,
    GraduationCap,
    House,
    IdentificationCard,
    MapPin,
    MagnifyingGlass,
    Phone,
    Plus,
    Prohibit,
    SignOut,
    SpinnerGap,
    User,
    Users,
    UsersThree,
    Warning,
    XCircle,
    BookBookmark,
} from "@phosphor-icons/react";

function formatDateTime(value) {
    if (!value) return "Time unavailable";
    return new Date(value).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function TeacherDashboard() {
    const { user, updateProfile, logout } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState("home");
    const [stats, setStats] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [activeSession, setActiveSession] = useState(null);
    const [attendanceCount, setAttendanceCount] = useState(null);
    const [selectedSession, setSelectedSession] = useState(null);
    const [sessionRecords, setSessionRecords] = useState([]);
    const [selectedSessionSummary, setSelectedSessionSummary] = useState({
        presentCount: 0,
        flaggedCount: 0,
        absentCount: 0,
        attendedCount: 0,
        totalStudents: 0,
        attendancePercentage: 0,
    });
    const [loadingRecords, setLoadingRecords] = useState(false);
    const [analyticsSearch, setAnalyticsSearch] = useState("");
    const [analyticsStatusFilter, setAnalyticsStatusFilter] = useState("all");
    const [subject, setSubject] = useState("");
    const [creating, setCreating] = useState(false);
    const [name, setName] = useState(user?.name || "");
    const [dept, setDept] = useState(user?.dept || "");
    const [profileSubject, setProfileSubject] = useState(user?.subject || "");
    const [mobileNo, setMobileNo] = useState(user?.mobileNo || "");
    const isProfileComplete = user && user.dept && user.subject && user.mobileNo;
    const [isEditingProfile, setIsEditingProfile] = useState(!isProfileComplete);

    useEffect(() => {
        setName(user?.name || "");
        setDept(user?.dept || "");
        setProfileSubject(user?.subject || "");
        setMobileNo(user?.mobileNo || "");
    }, [user]);

    useEffect(() => {
        if (!isProfileComplete) {
            setIsEditingProfile(true);
            setActiveTab("profile");
        }
        fetchSessions();
        fetchStats();
    }, [user, isProfileComplete]);

    useEffect(() => {
        if (!activeSession || !activeSession.isActive) return;

        const fetchCount = async () => {
            try {
                const res = await api.get(`/attendance/count/${activeSession._id}`);
                setAttendanceCount(res.data);
            } catch (err) {
                console.error("Count fetch failed:", err);
            }
        };

        fetchCount();
        const interval = setInterval(fetchCount, 15000);
        return () => clearInterval(interval);
    }, [activeSession]);

    const overviewStats = useMemo(() => {
        const totalStudents = stats?.totalStudents || 0;
        const presentToday = attendanceCount?.present ?? activeSession?.attendees ?? 0;
        const absentToday = Math.max(totalStudents - presentToday, 0);
        return { totalStudents, presentToday, absentToday };
    }, [activeSession, attendanceCount, stats]);

    const fetchStats = async () => {
        try {
            const res = await api.get("/attendance/teacher/stats");
            setStats(res.data);
        } catch (err) {
            console.error("Stats fetch failed:", err);
        }
    };

    const fetchSessions = async () => {
        try {
            const res = await api.get("/session/teacher/sessions");
            setSessions(res.data);
            const active = res.data.find((session) => session.isActive);
            setActiveSession(active || null);
        } catch (err) {
            console.error("Sessions fetch failed:", err);
        } finally {
            setLoadingSessions(false);
        }
    };

    const fetchSessionDetail = async (session) => {
        setSelectedSession(session);
        setLoadingRecords(true);
        try {
            const res = await api.get(`/attendance/session/${session._id}/roster`);
            setSessionRecords(res.data.records || []);
            setSelectedSessionSummary({
                presentCount: res.data.presentCount || 0,
                flaggedCount: res.data.flaggedCount || 0,
                absentCount: res.data.absentCount || 0,
                attendedCount: res.data.attendedCount || 0,
                totalStudents: res.data.totalStudents || 0,
                attendancePercentage: res.data.attendancePercentage || 0,
            });
            setAnalyticsSearch("");
            setAnalyticsStatusFilter("all");
        } catch (err) {
            console.error("Session detail fetch failed:", err);
            setSessionRecords([]);
            setSelectedSessionSummary({
                presentCount: 0,
                flaggedCount: 0,
                absentCount: 0,
                attendedCount: 0,
                totalStudents: 0,
                attendancePercentage: 0,
            });
        } finally {
            setLoadingRecords(false);
        }
    };

    const handleSelectedSessionExport = async () => {
        if (!selectedSession?._id) return;

        try {
            const res = await api.get(`/attendance/export/${selectedSession._id}`, {
                responseType: "blob",
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute(
                "download",
                `attendance_${selectedSession?.subject || "export"}.csv`
            );
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success("CSV downloaded!");
        } catch (err) {
            toast.error("Export failed");
        }
    };

    const filteredAnalyticsRecords = useMemo(() => {
        const query = analyticsSearch.trim().toLowerCase();

        return sessionRecords.filter((record) => {
            const student = record.studentId || {};
            const name = (student.name || record.studentName || "").toLowerCase();
            const regNo = (student.regNo || "").toLowerCase();
            const branch = (student.branch || "").toLowerCase();
            const matchesSearch =
                !query ||
                name.includes(query) ||
                regNo.includes(query) ||
                branch.includes(query);

            const matchesStatus =
                analyticsStatusFilter === "all"
                    ? true
                    : record.status === analyticsStatusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [analyticsSearch, analyticsStatusFilter, sessionRecords]);

    const handleCreateSession = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await api.post("/session/create", { subject });
            toast.success("Session created! Students can now see it on their dashboard.");
            setActiveSession(res.data);
            setShowCreate(false);
            setSubject("");
            fetchSessions();
            fetchStats();
        } catch (err) {
            toast.error(err.response?.data?.msg || "Failed to create session");
        } finally {
            setCreating(false);
        }
    };

    const handleEndSession = async () => {
        if (!activeSession) return;
        try {
            await api.patch(`/session/${activeSession._id}/end`);
            toast.success("Session ended");
            setActiveSession(null);
            setAttendanceCount(null);
            fetchSessions();
            fetchStats();
        } catch (err) {
            toast.error("Failed to end session");
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            await updateProfile({ name, dept, subject: profileSubject, mobileNo });
            setIsEditingProfile(false);
            toast.success("Profile updated!");
        } catch (err) {
            toast.error("Failed to update profile");
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate("/login", { replace: true });
    };

    const exportCurrentSession = () => {
        if (activeSession?._id) {
            navigate(`/session/${activeSession._id}`);
            return;
        }

        if (sessions[0]?._id) {
            navigate(`/session/${sessions[0]._id}`);
            return;
        }

        toast.error("No session available to export");
    };

    const openNewSession = () => {
        setShowCreate(true);
        setActiveTab("home");
    };

    const renderHomeTab = () => (
        <div className="space-y-5 animate-fade-in">
            <section className="rounded-[28px] border border-white/6 bg-[#171b24] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold text-white">Overview</h2>
                        <p className="mt-1 text-sm text-slate-400">
                            Manage your active sessions and track student participation.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                            onClick={exportCurrentSession}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#171b24] px-4 py-3 text-sm font-semibold text-white"
                        >
                            <Export size={18} />
                            Export Report
                        </button>
                        <button
                            onClick={openNewSession}
                            disabled={!!activeSession?.isActive}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#29d8ff] px-4 py-3 text-sm font-semibold text-[#04131f] shadow-[0_16px_34px_rgba(41,216,255,0.22)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Plus size={18} weight="bold" />
                            New Session
                        </button>
                    </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <div className="rounded-[20px] border border-white/6 bg-[#1a1f29] p-4">
                        <Users size={20} className="mb-3 text-[#33c3ff]" />
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Total Students</p>
                        <p className="mt-1 text-3xl font-semibold text-white">{overviewStats.totalStudents}</p>
                    </div>
                    <div className="rounded-[20px] border border-white/6 bg-[#1a1f29] p-4">
                        <CheckCircle size={20} className="mb-3 text-emerald-400" />
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Present Today</p>
                        <p className="mt-1 text-3xl font-semibold text-white">{overviewStats.presentToday}</p>
                    </div>
                    <div className="rounded-[20px] border border-white/6 bg-[#1a1f29] p-4">
                        <XCircle size={20} className="mb-3 text-rose-400" />
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Absent</p>
                        <p className="mt-1 text-3xl font-semibold text-white">{overviewStats.absentToday}</p>
                    </div>
                </div>
            </section>

            {activeSession?.isActive && (
                <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                    <div className="rounded-[28px] border border-white/6 bg-[#171b24] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-white">{activeSession.subject}</h3>
                                <p className="mt-1 text-xs text-slate-500">
                                    {formatDateTime(activeSession.startTime || activeSession.createdAt)}
                                </p>
                            </div>
                            <span className="rounded-full bg-emerald-500/12 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
                                Session Active
                            </span>
                        </div>
                        <QRDisplay session={activeSession} attendanceCount={attendanceCount} onEnd={handleEndSession} />
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-[24px] border border-indigo-400/12 bg-[linear-gradient(180deg,rgba(29,37,76,0.95),rgba(22,24,45,0.95))] p-4">
                            <p className="text-sm font-semibold text-white">Pending Requests</p>
                            <p className="mt-1 text-xs text-slate-400">
                                Manual attendance reviews for missed check-ins can be handled from session detail.
                            </p>
                            <button
                                onClick={() => navigate(`/session/${activeSession._id}`)}
                                className="mt-4 w-full rounded-2xl bg-[#121722] px-4 py-3 text-sm font-semibold text-white"
                            >
                                Review Requests
                            </button>
                        </div>

                        <div className="rounded-[24px] border border-cyan-400/12 bg-[linear-gradient(180deg,rgba(6,96,106,0.95),rgba(8,71,80,0.95))] p-4">
                            <p className="text-sm font-semibold text-white">Class Insights</p>
                            <p className="mt-1 text-xs text-cyan-50/70">
                                Overall attendance for this class is {stats?.overallAvgPercentage ?? 0}% across recent sessions.
                            </p>
                            <button
                                onClick={() => setActiveTab("analytics")}
                                className="mt-4 w-full rounded-2xl bg-[#121722] px-4 py-3 text-sm font-semibold text-white"
                            >
                                View Analytics
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {!activeSession?.isActive && (
                <section className="rounded-[28px] border border-dashed border-[#2bd3ff]/25 bg-[linear-gradient(180deg,rgba(20,26,39,0.98),rgba(15,19,30,0.98))] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
                    {!showCreate ? (
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-lg font-semibold text-white">Create a new attendance session</p>
                                <p className="mt-1 text-sm text-slate-400">
                                    Start a live attendance session and let students mark attendance from the active session card.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowCreate(true)}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#29d8ff] px-5 py-3 text-sm font-semibold text-[#04131f] shadow-[0_16px_34px_rgba(41,216,255,0.22)]"
                            >
                                <Plus size={18} weight="bold" />
                                Create Session
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleCreateSession} className="space-y-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-semibold text-white">New Session</h3>
                                    <p className="mt-1 text-sm text-slate-400">
                                        Enter a subject name and the session will start instantly for students.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreate(false);
                                        setSubject("");
                                    }}
                                    className="text-xs font-semibold text-slate-400"
                                >
                                    Cancel
                                </button>
                            </div>

                            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                                <label className="block">
                                    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Subject
                                    </span>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        required
                                        placeholder="e.g., Advanced Physics"
                                        className="w-full rounded-[18px] border border-white/8 bg-[#111722] px-4 py-3 text-sm text-white outline-none transition focus:border-[#29d8ff]"
                                    />
                                </label>

                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="inline-flex items-center justify-center gap-2 rounded-[18px] bg-[#29d8ff] px-5 py-3 text-sm font-semibold text-[#04131f] shadow-[0_16px_34px_rgba(41,216,255,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {creating ? <SpinnerGap size={18} className="animate-spin" /> : <Plus size={18} weight="bold" />}
                                    {creating ? "Creating..." : "Start Session"}
                                </button>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <MapPin size={14} />
                                College geofencing strict radius (50m) remains enabled.
                            </div>
                        </form>
                    )}
                </section>
            )}

            <section className="rounded-[28px] border border-white/6 bg-[#171b24] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-white">
                            {activeSession?.subject || sessions[0]?.subject || "Recent Sessions"}
                        </h3>
                        <p className="mt-1 text-sm text-slate-400">
                            Review live and completed sessions without changing your current session flow.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="rounded-2xl border border-white/8 bg-[#141925] px-4 py-3 text-sm text-slate-500">
                            Search sessions by subject
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-[#141925] px-4 py-3 text-sm text-slate-300">
                            {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                    </div>
                </div>

                {loadingSessions ? (
                    <div className="flex justify-center py-10">
                        <SpinnerGap size={24} className="animate-spin text-[#33c3ff]" />
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="rounded-[20px] border border-white/6 bg-[#141925] px-4 py-10 text-center text-sm text-slate-400">
                        No sessions yet. Create your first one.
                    </div>
                ) : (
                    <>
                        <div className="hidden overflow-hidden rounded-[22px] border border-white/6 lg:block">
                            <div className="grid grid-cols-[1.6fr_0.7fr_0.8fr_1.1fr] bg-[#1b202a] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                <span>Session</span>
                                <span>Status</span>
                                <span>Time</span>
                                <span>Actions</span>
                            </div>
                            {sessions.slice(0, 5).map((session) => (
                                <div key={session._id} className="grid grid-cols-[1.6fr_0.7fr_0.8fr_1.1fr] items-center border-t border-white/6 bg-[#141925] px-4 py-4 text-sm">
                                    <div>
                                        <p className="font-semibold text-white">{session.subject}</p>
                                        <p className="mt-1 text-[11px] text-slate-500">{session.attendees ?? 0} students checked in</p>
                                    </div>
                                    <span className={`w-fit rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${session.isActive ? "bg-emerald-500/14 text-emerald-300" : "bg-white/6 text-slate-400"}`}>
                                        {session.isActive ? "Live" : "Ended"}
                                    </span>
                                    <span className="text-slate-400">{new Date(session.startTime || session.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => navigate(`/session/${session._id}`)}
                                            className="rounded-xl border border-white/8 bg-[#121722] px-3 py-2 text-xs font-semibold text-white"
                                        >
                                            Open
                                        </button>
                                        <button
                                            onClick={() => fetchSessionDetail(session)}
                                            className="rounded-xl border border-cyan-400/20 bg-cyan-400/8 px-3 py-2 text-xs font-semibold text-cyan-200"
                                        >
                                            Inspect
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3 lg:hidden">
                            {sessions.slice(0, 5).map((session) => (
                                <div key={session._id} className="rounded-[22px] border border-white/6 bg-[#141925] px-4 py-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-white">{session.subject}</p>
                                            <p className="mt-1 text-[11px] text-slate-500">{formatDateTime(session.startTime || session.createdAt)}</p>
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${session.isActive ? "bg-emerald-500/14 text-emerald-300" : "bg-white/6 text-slate-400"}`}>
                                            {session.isActive ? "Live" : "Ended"}
                                        </span>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between">
                                        <p className="text-[11px] text-slate-500">{session.attendees ?? 0} present</p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => navigate(`/session/${session._id}`)}
                                                className="rounded-xl border border-white/8 bg-[#121722] px-3 py-2 text-[11px] font-semibold text-white"
                                            >
                                                Open
                                            </button>
                                            <button
                                                onClick={() => fetchSessionDetail(session)}
                                                className="rounded-xl border border-cyan-400/20 bg-cyan-400/8 px-3 py-2 text-[11px] font-semibold text-cyan-200"
                                            >
                                                Inspect
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </section>
        </div>
    );

    const renderAnalyticsTab = () => (
        <div className="space-y-5 animate-fade-in">
            {!selectedSession ? (
                <>
                    <section className="rounded-[28px] border border-white/6 bg-[#171b24] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-white">Analytics</h2>
                                <p className="mt-1 text-sm text-slate-400">Attendance performance across your recent classes.</p>
                            </div>
                            <button
                                onClick={fetchStats}
                                className="rounded-2xl border border-white/8 bg-[#121722] px-4 py-2 text-sm font-semibold text-white"
                            >
                                Refresh
                            </button>
                        </div>

                        {stats ? (
                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="rounded-[20px] border border-white/6 bg-[#1a1f29] p-4">
                                    <Users size={20} className="mb-3 text-[#33c3ff]" />
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Total Students</p>
                                    <p className="mt-1 text-3xl font-semibold text-white">{stats.totalStudents || 0}</p>
                                </div>
                                <div className="rounded-[20px] border border-white/6 bg-[#1a1f29] p-4">
                                    <ClockCountdown size={20} className="mb-3 text-[#33c3ff]" />
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Total Sessions</p>
                                    <p className="mt-1 text-3xl font-semibold text-white">{stats.totalSessions ?? sessions.length}</p>
                                </div>
                                <div className="rounded-[22px] border border-emerald-400/15 bg-[linear-gradient(180deg,rgba(14,53,48,0.95),rgba(18,31,34,0.95))] p-4 md:col-span-2">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100/70">
                                                Overall Avg Attendance
                                            </p>
                                            <p className="mt-1 text-3xl font-semibold text-white">{stats.overallAvgPercentage || 0}%</p>
                                        </div>
                                        <ChartBar size={22} className="text-emerald-300" />
                                    </div>
                                    <div className="mt-4 h-2 rounded-full bg-white/8">
                                        <div
                                            className="h-2 rounded-full bg-emerald-400 transition-all duration-500"
                                            style={{ width: `${Math.min(stats.overallAvgPercentage || 0, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-center py-10">
                                <SpinnerGap size={28} className="animate-spin text-[#33c3ff]" />
                            </div>
                        )}
                    </section>

                    <section className="rounded-[28px] border border-white/6 bg-[#171b24] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-white">All Sessions</h3>
                                <p className="mt-1 text-sm text-slate-400">Open a session to inspect attendance records.</p>
                            </div>
                            <button
                                onClick={fetchSessions}
                                className="rounded-2xl border border-white/8 bg-[#121722] px-4 py-2 text-sm font-semibold text-white"
                            >
                                Reload
                            </button>
                        </div>

                        {loadingSessions ? (
                            <div className="flex justify-center py-10">
                                <SpinnerGap size={24} className="animate-spin text-[#33c3ff]" />
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="rounded-[20px] border border-white/6 bg-[#141925] px-4 py-10 text-center text-sm text-slate-400">
                                No sessions found.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {sessions.map((session) => (
                                    <button
                                        key={session._id}
                                        onClick={() => fetchSessionDetail(session)}
                                        className="flex w-full items-center justify-between rounded-[20px] border border-white/6 bg-[#141925] px-4 py-4 text-left shadow-[0_10px_24px_rgba(0,0,0,0.18)]"
                                    >
                                        <div>
                                            <p className="text-sm font-semibold text-white">{session.subject}</p>
                                            <p className="mt-1 text-[11px] text-slate-500">{formatDateTime(session.startTime || session.createdAt)}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${session.isActive ? "bg-emerald-500/14 text-emerald-300" : "bg-white/6 text-slate-400"}`}>
                                                {session.isActive ? "Active" : "Closed"}
                                            </span>
                                            <p className="mt-2 text-[11px] text-[#33c3ff]">{session.attendees ?? 0} present</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>
                </>
            ) : (
                <section className="space-y-4 rounded-[28px] border border-white/6 bg-[#171b24] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
                    <button
                        onClick={() => {
                            setSelectedSession(null);
                            setSessionRecords([]);
                            setSelectedSessionSummary({
                                presentCount: 0,
                                flaggedCount: 0,
                                absentCount: 0,
                                attendedCount: 0,
                                totalStudents: 0,
                                attendancePercentage: 0,
                            });
                            setAnalyticsSearch("");
                            setAnalyticsStatusFilter("all");
                        }}
                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-400"
                    >
                        <ArrowLeft size={16} />
                        Back to Sessions
                    </button>

                    <div className="rounded-[28px] border border-cyan-400/15 bg-[linear-gradient(180deg,rgba(8,96,106,0.95),rgba(16,27,37,0.95))] p-5">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                            <div>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-cyan-100">
                                        <GraduationCap size={22} weight="duotone" />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-semibold text-white">{selectedSession.subject}</h3>
                                        <p className="mt-1 text-sm text-cyan-50/70">{formatDateTime(selectedSession.startTime || selectedSession.createdAt)}</p>
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-cyan-50/70">
                                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
                                        <CalendarBlank size={14} />
                                        Code: {selectedSession.sessionCode || "Unavailable"}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col items-start gap-3 xl:items-end">
                                <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${selectedSession.isActive ? "bg-emerald-500/14 text-emerald-300" : "bg-white/10 text-slate-200"}`}>
                                    {selectedSession.isActive ? "Active" : "Closed"}
                                </span>
                                <button
                                    onClick={handleSelectedSessionExport}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#121722] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#161d29]"
                                >
                                    <DownloadSimple size={18} />
                                    Export CSV
                                </button>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-[22px] bg-[#121722] p-4 text-center">
                                <p className="text-3xl font-semibold text-white">{selectedSessionSummary.attendedCount}</p>
                                <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">Attended</p>
                            </div>
                            <div className="rounded-[22px] bg-[#121722] p-4 text-center">
                                <p className="text-3xl font-semibold text-white">{selectedSessionSummary.totalStudents}</p>
                                <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">Total Students</p>
                            </div>
                            <div className="rounded-[22px] bg-[#121722] p-4 text-center">
                                <p className="text-3xl font-semibold text-rose-300">{selectedSessionSummary.absentCount}</p>
                                <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">Absent</p>
                            </div>
                            <div className="rounded-[22px] bg-[#121722] p-4 text-center">
                                <p className="text-3xl font-semibold text-emerald-300">
                                    {selectedSessionSummary.attendancePercentage}%
                                </p>
                                <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">Percentage</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                        <div className="relative w-full xl:max-w-xl">
                            <MagnifyingGlass
                                size={18}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                            />
                            <input
                                type="text"
                                value={analyticsSearch}
                                onChange={(e) => setAnalyticsSearch(e.target.value)}
                                placeholder="Search by name, reg no, or branch..."
                                className="w-full rounded-[20px] border border-white/8 bg-[#141925] py-3 pl-11 pr-4 text-sm text-white outline-none transition focus:border-[#33c3ff]"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-[#141925] px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                <FunnelSimple size={16} />
                                Filter
                            </span>
                            {[
                                { key: "all", label: "All", count: sessionRecords.length },
                                { key: "present", label: "Present", count: selectedSessionSummary.presentCount },
                                { key: "flagged", label: "Flagged", count: selectedSessionSummary.flaggedCount },
                                { key: "absent", label: "Absent", count: selectedSessionSummary.absentCount },
                            ].map((chip) => (
                                <button
                                    key={chip.key}
                                    type="button"
                                    onClick={() => setAnalyticsStatusFilter(chip.key)}
                                    className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                                        analyticsStatusFilter === chip.key
                                            ? "bg-[#29d8ff] text-[#04131f]"
                                            : "border border-white/8 bg-[#141925] text-slate-300"
                                    }`}
                                >
                                    {chip.label} ({chip.count})
                                </button>
                            ))}
                        </div>
                    </div>

                    {loadingRecords ? (
                        <div className="flex justify-center py-10">
                            <SpinnerGap size={24} className="animate-spin text-[#33c3ff]" />
                        </div>
                    ) : filteredAnalyticsRecords.length === 0 ? (
                        <div className="rounded-[20px] border border-white/6 bg-[#141925] px-4 py-10 text-center text-sm text-slate-400">
                            {sessionRecords.length === 0
                                ? "No student records found for this session."
                                : "No students matched your current search or filter."}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredAnalyticsRecords.map((record, idx) => {
                                const student = record.studentId || {};
                                const isAbsent = record.status === "absent";
                                const statusClass =
                                    record.status === "present"
                                        ? "bg-emerald-500/14 text-emerald-300"
                                        : record.status === "flagged"
                                          ? "bg-amber-400/14 text-amber-200"
                                          : "bg-rose-500/14 text-rose-300";

                                return (
                                    <div key={record._id} className="rounded-[20px] border border-white/6 bg-[#141925] px-4 py-4 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1f2d39] text-sm font-semibold text-white">
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <p className="text-2xl font-semibold text-white">
                                                        {student.name || record.studentName || "Unknown"}
                                                    </p>
                                                    <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-500">
                                                        {student.regNo && <span>Reg: {student.regNo}</span>}
                                                        {student.branch && <span>Branch: {student.branch}</span>}
                                                        {student.semester && <span>Sem: {student.semester}</span>}
                                                    </div>
                                                    <p className="mt-3 text-sm text-slate-500">
                                                        {isAbsent
                                                            ? "Not marked for this session"
                                                            : formatDateTime(record.timestamp)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-start gap-2 lg:items-end">
                                                <span className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${statusClass}`}>
                                                    {record.status === "present" ? "Present" : record.status === "flagged" ? "Flagged" : "Absent"}
                                                </span>
                                                {!isAbsent && (
                                                    <p className="text-xs text-slate-500">
                                                        Score: {record.score ?? 0}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {record.flags && record.flags.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {record.flags.map((flag) => (
                                                    <span
                                                        key={flag}
                                                        className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[11px] text-amber-200"
                                                    >
                                                        {flag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-[24px] border border-white/6 bg-[#171b24]/96 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
                            <UsersThree size={20} className="text-cyan-300" />
                            <p className="mt-4 text-2xl font-semibold text-white">
                                {selectedSessionSummary.presentCount}
                            </p>
                            <p className="mt-1 text-sm text-slate-400">
                                Students marked present normally.
                            </p>
                        </div>
                        <div className="rounded-[24px] border border-white/6 bg-[#171b24]/96 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
                            <Warning size={20} className="text-amber-300" />
                            <p className="mt-4 text-2xl font-semibold text-white">
                                {selectedSessionSummary.flaggedCount}
                            </p>
                            <p className="mt-1 text-sm text-slate-400">
                                Students flagged for review or unusual checks.
                            </p>
                        </div>
                        <div className="rounded-[24px] border border-white/6 bg-[#171b24]/96 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
                            <Prohibit size={20} className="text-rose-300" />
                            <p className="mt-4 text-2xl font-semibold text-white">
                                {selectedSessionSummary.absentCount}
                            </p>
                            <p className="mt-1 text-sm text-slate-400">
                                Students missing from the final session roster.
                            </p>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );

    const renderProfileTab = () => (
        <div className="space-y-4 animate-fade-in">
            <div className="rounded-[28px] border border-white/6 bg-[#171b24] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
                <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-white">Profile</h2>
                        <p className="mt-1 text-sm text-slate-400">Keep your teaching details updated for sessions and reports.</p>
                    </div>
                    {!isEditingProfile && (
                        <button
                            onClick={() => setIsEditingProfile(true)}
                            className="text-xs font-semibold text-[#33c3ff]"
                        >
                            Edit
                        </button>
                    )}
                </div>

                {!isEditingProfile ? (
                    <div className="space-y-3">
                        {[
                            { icon: <User size={16} />, label: "Full Name", value: user?.name || "Not set" },
                            { icon: <IdentificationCard size={16} />, label: "Department", value: user?.dept || "Not set" },
                            { icon: <BookBookmark size={16} />, label: "Main Subject", value: user?.subject || "Not set" },
                            { icon: <Phone size={16} />, label: "Mobile", value: user?.mobileNo || "Not set" },
                        ].map((item) => (
                            <div key={item.label} className="flex items-center gap-3 rounded-[20px] border border-white/6 bg-[#141925] px-4 py-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#102833] text-[#61d7ff]">
                                    {item.icon}
                                </div>
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                                    <p className="mt-1 text-sm font-semibold text-white">{item.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-[24px] border border-white/6 bg-[#141925] p-4">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Warning size={18} weight="fill" className="text-amber-300" />
                                <p className="text-sm font-semibold text-amber-200">
                                    {isProfileComplete ? "Edit profile" : "Complete your profile"}
                                </p>
                            </div>
                            {isProfileComplete && (
                                <button
                                    onClick={() => {
                                        setIsEditingProfile(false);
                                        setName(user?.name || "");
                                        setDept(user?.dept || "");
                                        setProfileSubject(user?.subject || "");
                                        setMobileNo(user?.mobileNo || "");
                                    }}
                                    className="text-xs font-semibold text-slate-400"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleProfileUpdate} className="space-y-3">
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Full name" className="w-full rounded-[16px] border border-white/8 bg-[#0f1420] px-4 py-3 text-sm text-white outline-none transition focus:border-[#33c3ff]" />
                            <input type="text" value={dept} onChange={(e) => setDept(e.target.value)} required placeholder="Department" className="w-full rounded-[16px] border border-white/8 bg-[#0f1420] px-4 py-3 text-sm text-white outline-none transition focus:border-[#33c3ff]" />
                            <input type="text" value={profileSubject} onChange={(e) => setProfileSubject(e.target.value)} required placeholder="Main subject" className="w-full rounded-[16px] border border-white/8 bg-[#0f1420] px-4 py-3 text-sm text-white outline-none transition focus:border-[#33c3ff]" />
                            <input type="text" value={mobileNo} onChange={(e) => setMobileNo(e.target.value)} required placeholder="Mobile number" className="w-full rounded-[16px] border border-white/8 bg-[#0f1420] px-4 py-3 text-sm text-white outline-none transition focus:border-[#33c3ff]" />
                            <button type="submit" className="w-full rounded-[18px] bg-[#29d8ff] px-4 py-3 text-sm font-semibold text-[#04131f] shadow-[0_16px_34px_rgba(41,216,255,0.22)]">
                                Save Profile
                            </button>
                        </form>
                    </div>
                )}
            </div>

            <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-[18px] border border-white/8 bg-[#171c27] px-4 py-3 text-sm font-semibold text-white"
            >
                <SignOut size={18} />
                Logout
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(23,34,56,0.92),rgba(5,8,18,1)_58%)] text-slate-200">
            <main className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-28 pt-5 sm:px-6 lg:px-8">
                <section className="mb-6">
                    <div className="flex items-center justify-between rounded-[24px] border border-white/6 bg-[#171b24]/96 px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
                        <div>
                            <p className="text-sm font-semibold text-white">Teacher Dashboard</p>
                            <p className="mt-1 text-xs text-slate-500">Manage live attendance sessions from one place.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={openNewSession}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/6 bg-[#121722] text-slate-300"
                            >
                                <Plus size={18} />
                            </button>
                            <button
                                onClick={() => setActiveTab("profile")}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/6 bg-[#121722] text-slate-300"
                            >
                                <GearSix size={18} />
                            </button>
                        </div>
                    </div>
                </section>

                <section className="mb-6">
                    <h1 className="text-[30px] font-semibold leading-none text-white">
                        Hello, {user?.name?.split(" ")[0] || "Teacher"}
                    </h1>
                    <p className="mt-2 text-sm text-slate-400">Keep classes flowing and attendance records organized.</p>
                </section>

                {activeTab === "home" && renderHomeTab()}
                {activeTab === "analytics" && renderAnalyticsTab()}
                {activeTab === "profile" && renderProfileTab()}
            </main>

            <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-5">
                <div className="mx-auto flex w-full max-w-md items-center justify-between rounded-[24px] border border-white/6 bg-[#0e1320]/94 px-5 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                    <button
                        onClick={() => setActiveTab("home")}
                        className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
                            activeTab === "home" ? "text-[#2fc6ff]" : "text-slate-500"
                        }`}
                    >
                        <House size={22} weight={activeTab === "home" ? "fill" : "regular"} />
                        Home
                    </button>

                    <button
                        onClick={openNewSession}
                        className="flex flex-col items-center gap-1 text-[10px] font-medium text-slate-300"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#2fc6ff]/30 bg-[#101a2e] text-[#2fc6ff]">
                            <Plus size={20} weight="bold" />
                        </div>
                        Session
                    </button>

                    <button
                        onClick={() => {
                            setActiveTab("analytics");
                            fetchStats();
                            fetchSessions();
                        }}
                        className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
                            activeTab === "analytics" ? "text-[#2fc6ff]" : "text-slate-500"
                        }`}
                    >
                        <ChartBar size={22} weight={activeTab === "analytics" ? "fill" : "regular"} />
                        Stats
                    </button>

                    <button
                        onClick={() => setActiveTab("profile")}
                        className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
                            activeTab === "profile" ? "text-[#2fc6ff]" : "text-slate-500"
                        }`}
                    >
                        <User size={22} weight={activeTab === "profile" ? "fill" : "regular"} />
                        Profile
                    </button>
                </div>
            </div>

            <style jsx="true">{`
                .animate-fade-in {
                    animation: fadeIn 0.35s ease-out forwards;
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }

                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}
