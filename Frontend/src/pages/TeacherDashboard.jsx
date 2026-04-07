import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import QRDisplay from "../components/QRDisplay";
import toast from "react-hot-toast";
import {
    Plus,
    ClockCountdown,
    MapPin,
    Users,
    CaretRight,
    CaretLeft,
    SpinnerGap,
    CheckCircle,
    XCircle,
    Warning,
    User,
    Phone,
    BookBookmark,
    IdentificationCard,
    ChartBar,
    House,
} from "@phosphor-icons/react";

export default function TeacherDashboard() {
    const { user, updateProfile } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState("home");
    const [stats, setStats] = useState(null);

    const [sessions, setSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [activeSession, setActiveSession] = useState(null);
    const [attendanceCount, setAttendanceCount] = useState(null);

    // Session detail state
    const [selectedSession, setSelectedSession] = useState(null);
    const [sessionRecords, setSessionRecords] = useState([]);
    const [loadingRecords, setLoadingRecords] = useState(false);

    // Create form state
    const [subject, setSubject] = useState("");
    const [creating, setCreating] = useState(false);

    // Profile form state
    const [name, setName] = useState(user?.name || "");
    const [dept, setDept] = useState(user?.dept || "");
    const [profileSubject, setProfileSubject] = useState(user?.subject || "");
    const [mobileNo, setMobileNo] = useState(user?.mobileNo || "");

    const isProfileComplete = user && user.dept && user.subject && user.mobileNo;
    const [isEditingProfile, setIsEditingProfile] = useState(!isProfileComplete);

    useEffect(() => {
        if (!isProfileComplete) {
            setIsEditingProfile(true);
            setActiveTab("profile");
        }
        fetchSessions();
        fetchStats();
    }, [user]);

    const fetchStats = async () => {
        try {
            const res = await api.get("/attendance/teacher/stats");
            setStats(res.data);
        } catch (err) {
            console.error("Stats fetch failed:", err);
        }
    };

    const fetchSessionDetail = async (session) => {
        setSelectedSession(session);
        setLoadingRecords(true);
        try {
            const res = await api.get(`/attendance/session/${session._id}`);
            setSessionRecords(res.data);
        } catch (err) {
            console.error("Session detail fetch failed:", err);
            setSessionRecords([]);
        } finally {
            setLoadingRecords(false);
        }
    };

    // Poll attendance count for active session
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

    const fetchSessions = async () => {
        try {
            const res = await api.get("/session/teacher/sessions");
            setSessions(res.data);
            const active = res.data.find((s) => s.isActive);
            if (active) setActiveSession(active);
        } catch (err) {
            console.error("Sessions fetch failed:", err);
        } finally {
            setLoadingSessions(false);
        }
    };

    const handleCreateSession = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await api.post("/session/create", { subject });
            toast.success("Session created! Show the QR code to students.");
            setActiveSession(res.data);
            setShowCreate(false);
            setSubject("");
            fetchSessions();
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
            <Navbar />

            <main className="max-w-lg mx-auto px-4 pt-20 pb-24">
                {/* Welcome */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-white">
                        Hello, {user?.name?.split(" ")[0]} 👋
                    </h1>
                    <p className="text-indigo-300/60 text-sm mt-1">
                        Manage your class attendance
                    </p>
                </div>

                {/* ========== HOME TAB ========== */}
                {activeTab === "home" && (
                    <>
                        {/* Active Session / QR Display */}
                        {activeSession && activeSession.isActive && (
                            <div className="mb-6">
                                <QRDisplay
                                    session={activeSession}
                                    attendanceCount={attendanceCount}
                                    onEnd={handleEndSession}
                                />
                            </div>
                        )}

                        {/* Create Session Button */}
                        {!activeSession?.isActive && !showCreate && (
                            <button
                                onClick={() => setShowCreate(true)}
                                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 shadow-lg shadow-purple-500/20 hover:shadow-xl active:scale-[0.98] mb-6 cursor-pointer"
                            >
                                <Plus size={24} weight="bold" />
                                <span className="text-lg">Create Attendance Session</span>
                            </button>
                        )}

                        {/* Create Session Form */}
                        {showCreate && (
                            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 mb-6">
                                <h3 className="text-white font-semibold mb-4">New Session</h3>
                                <form onSubmit={handleCreateSession} className="space-y-4">
                                    <div>
                                        <label className="text-white/60 text-xs mb-1 block">Subject</label>
                                        <input
                                            type="text"
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            required
                                            placeholder="e.g., Data Structures"
                                            className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-400 transition"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 text-indigo-300/60 text-xs justify-center">
                                        <MapPin size={14} />
                                        College geofencing strict radius (50m) enabled
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowCreate(false)}
                                            className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-xl transition text-sm font-medium cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={creating}
                                            className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-2.5 rounded-xl transition text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            {creating ? (
                                                <>
                                                    <SpinnerGap size={16} className="animate-spin" />
                                                    Creating...
                                                </>
                                            ) : (
                                                "Start Session"
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Session History */}
                        <div>
                            <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                                <ClockCountdown size={18} className="text-indigo-400" />
                                Session History
                            </h2>
                            {loadingSessions ? (
                                <div className="text-center py-8">
                                    <SpinnerGap size={24} className="animate-spin text-indigo-400 mx-auto" />
                                </div>
                            ) : sessions.length === 0 ? (
                                <div className="text-center py-8 text-white/30 text-sm">
                                    No sessions yet. Create your first one!
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {sessions.map((session) => (
                                        <button
                                            key={session._id}
                                            onClick={() => navigate(`/session/${session._id}`)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition cursor-pointer text-left"
                                        >
                                            <div>
                                                <p className="text-white text-sm font-medium">{session.subject}</p>
                                                <p className="text-white/40 text-xs mt-0.5 flex items-center gap-2">
                                                    <ClockCountdown size={12} />
                                                    {new Date(session.startTime).toLocaleDateString("en-IN", {
                                                        day: "numeric",
                                                        month: "short",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5">
                                                <span
                                                    className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${session.isActive
                                                        ? "bg-green-500/20 text-green-400"
                                                        : "bg-white/10 text-white/50"
                                                        }`}
                                                >
                                                    {session.isActive && (
                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                                    )}
                                                    {session.isActive ? "Live" : "Ended"}
                                                </span>
                                                {session.attendees !== undefined && (
                                                    <span className="text-[11px] text-blue-300 flex items-center gap-1">
                                                        <Users size={11} />
                                                        {session.attendees} present
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* ========== ANALYTICS TAB ========== */}
                {activeTab === "analytics" && (
                    <>
                        {/* Stat Cards */}
                        {stats ? (
                            <div className="grid grid-cols-2 gap-3 mb-5">
                                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 flex flex-col justify-between">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Users size={18} className="text-blue-400" />
                                        <span className="text-white/70 text-xs">Total Students</span>
                                    </div>
                                    <span className="text-2xl font-bold text-white">{stats.totalStudents}</span>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 flex flex-col justify-between">
                                    <div className="flex items-center gap-2 mb-2">
                                        <ClockCountdown size={18} className="text-purple-400" />
                                        <span className="text-white/70 text-xs">Total Sessions</span>
                                    </div>
                                    <span className="text-2xl font-bold text-white">{stats.totalSessions ?? sessions.length}</span>
                                </div>
                                <div className="col-span-2 bg-indigo-500/20 backdrop-blur-sm border border-indigo-500/30 rounded-2xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <ChartBar size={18} className="text-green-400" />
                                        <span className="text-indigo-200/70 text-xs">Overall Avg Attendance</span>
                                    </div>
                                    <span className="text-2xl font-bold text-white">{stats.overallAvgPercentage}%</span>
                                    <div className="w-full bg-white/10 rounded-full h-1.5 mt-2">
                                        <div
                                            className="bg-green-400 h-1.5 rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min(stats.overallAvgPercentage, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Bar Chart */}
                                <div className="col-span-2 bg-slate-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
                                    <h3 className="text-white text-sm font-semibold mb-6">Recent Session Trends</h3>
                                    {stats.trendData && stats.trendData.length > 0 ? (
                                        <div className="flex items-end gap-2 h-32 w-full justify-between">
                                            {stats.trendData.map((data, idx) => (
                                                <div key={idx} className="flex flex-col justify-end items-center group relative h-full w-full">
                                                    <div className="absolute -top-6 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                                        {data.percentage}% ({data.attendees} att.)
                                                    </div>
                                                    <div
                                                        className="w-full max-w-[20px] bg-indigo-500 hover:bg-indigo-400 transition-colors rounded-t"
                                                        style={{ height: `${Math.max(data.percentage, 5)}%` }}
                                                    />
                                                    <span className="text-[9px] text-white/40 mt-1 truncate w-full text-center">{data.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-white/40 text-xs text-center py-10">No trend data yet</div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-center my-10">
                                <SpinnerGap size={32} className="text-white animate-spin" />
                            </div>
                        )}

                        {/* Session list in Analytics */}
                        {!selectedSession ? (
                            <>
                                <h2 className="text-white font-semibold text-base mb-3">All Sessions</h2>
                                {loadingSessions ? (
                                    <div className="flex justify-center my-6">
                                        <SpinnerGap size={24} className="text-indigo-400 animate-spin" />
                                    </div>
                                ) : sessions.length === 0 ? (
                                    <div className="text-center text-white/40 text-sm py-8">No sessions found.</div>
                                ) : (
                                    <div className="space-y-2">
                                        {sessions.map((session) => (
                                            <button
                                                key={session._id}
                                                onClick={() => fetchSessionDetail(session)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center hover:bg-white/10 transition cursor-pointer text-left"
                                            >
                                                <div>
                                                    <p className="text-white font-medium text-sm">{session.subject}</p>
                                                    <p className="text-white/40 text-xs mt-0.5">
                                                        {new Date(session.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end gap-1.5">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${session.isActive ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/50"}`}>
                                                        {session.isActive ? "Active" : "Closed"}
                                                    </span>
                                                    {session.attendees !== undefined && (
                                                        <span className="text-[11px] text-blue-300 flex items-center gap-1">
                                                            <Users size={11} />
                                                            {session.attendees} present
                                                        </span>
                                                    )}
                                                    <CaretRight size={14} className="text-white/30" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            /* ===== SESSION DETAIL VIEW ===== */
                            <div>
                                <button
                                    onClick={() => { setSelectedSession(null); setSessionRecords([]); }}
                                    className="flex items-center gap-1.5 text-indigo-400 text-sm mb-4 hover:text-indigo-300 cursor-pointer transition"
                                >
                                    <CaretLeft size={16} />
                                    Back to Sessions
                                </button>

                                {/* Session Info Header */}
                                <div className="bg-indigo-500/15 border border-indigo-500/30 rounded-2xl p-4 mb-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-white font-semibold text-lg">{selectedSession.subject}</h3>
                                            <p className="text-white/40 text-xs mt-1">
                                                {new Date(selectedSession.startTime || selectedSession.createdAt).toLocaleDateString("en-IN", {
                                                    day: "numeric", month: "short", year: "numeric",
                                                    hour: "2-digit", minute: "2-digit"
                                                })}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${selectedSession.isActive ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/50"}`}>
                                                {selectedSession.isActive ? "Active" : "Closed"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 mt-4">
                                        <div className="bg-white/5 rounded-xl p-3 text-center">
                                            <p className="text-xl font-bold text-white">{sessionRecords.length}</p>
                                            <p className="text-white/40 text-[10px] mt-0.5">Attended</p>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-3 text-center">
                                            <p className="text-xl font-bold text-white">{stats?.totalStudents || 0}</p>
                                            <p className="text-white/40 text-[10px] mt-0.5">Total Students</p>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-3 text-center">
                                            <p className="text-xl font-bold text-green-400">
                                                {stats?.totalStudents ? Math.round((sessionRecords.length / stats.totalStudents) * 100) : 0}%
                                            </p>
                                            <p className="text-white/40 text-[10px] mt-0.5">Percentage</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Student List */}
                                <h3 className="text-white font-semibold text-sm mb-3">Attendance List</h3>
                                {loadingRecords ? (
                                    <div className="flex justify-center py-8">
                                        <SpinnerGap size={24} className="text-indigo-400 animate-spin" />
                                    </div>
                                ) : sessionRecords.length === 0 ? (
                                    <div className="text-center text-white/40 text-sm py-8">
                                        No students attended this session.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {sessionRecords.map((record, idx) => {
                                            const student = record.studentId || {};
                                            return (
                                                <div
                                                    key={record._id}
                                                    className="bg-white/5 border border-white/10 rounded-xl p-3.5"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-indigo-500/30 flex items-center justify-center text-white font-bold text-xs">
                                                                {idx + 1}
                                                            </div>
                                                            <div>
                                                                <p className="text-white text-sm font-medium">
                                                                    {student.name || record.studentName || "Unknown"}
                                                                </p>
                                                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                                                                    {student.regNo && (
                                                                        <span className="text-white/40 text-[11px]">Reg: {student.regNo}</span>
                                                                    )}
                                                                    {student.branch && (
                                                                        <span className="text-white/40 text-[11px]">Branch: {student.branch}</span>
                                                                    )}
                                                                    {student.semester && (
                                                                        <span className="text-white/40 text-[11px]">Sem: {student.semester}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${record.status === "present" ? "bg-green-500/20 text-green-400" :
                                                            record.status === "flagged" ? "bg-yellow-500/20 text-yellow-400" :
                                                                "bg-red-500/20 text-red-400"
                                                            }`}>
                                                            {record.status === "present" ? "Present" : record.status === "flagged" ? "Flagged" : record.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 mt-2 ml-11">
                                                        <ClockCountdown size={11} className="text-white/30" />
                                                        <span className="text-white/30 text-[10px]">
                                                            {new Date(record.timestamp).toLocaleString("en-IN", {
                                                                day: "numeric", month: "short",
                                                                hour: "2-digit", minute: "2-digit", second: "2-digit"
                                                            })}
                                                        </span>
                                                        {record.flags && record.flags.length > 0 && (
                                                            <span className="text-yellow-400/70 text-[10px] ml-2">⚠ {record.flags.join(", ")}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* ========== PROFILE TAB ========== */}
                {activeTab === "profile" && (
                    <div className="bg-indigo-900/40 border border-indigo-500/30 rounded-2xl p-5 mb-6 backdrop-blur-sm">
                        {!isEditingProfile ? (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-white font-semibold flex items-center gap-2">
                                        <User size={20} className="text-indigo-400" />
                                        My Profile
                                    </h3>
                                    <button
                                        onClick={() => setIsEditingProfile(true)}
                                        className="text-indigo-400 text-xs hover:text-indigo-300 cursor-pointer"
                                    >
                                        Edit
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between border-b border-white/5 pb-2">
                                        <span className="text-white/50 text-sm">Full Name</span>
                                        <span className="text-white text-sm font-medium">{user?.name}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/5 pb-2">
                                        <span className="text-white/50 text-sm">Department</span>
                                        <span className="text-white text-sm font-medium">{user?.dept}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/5 pb-2">
                                        <span className="text-white/50 text-sm">Main Subject</span>
                                        <span className="text-white text-sm font-medium">{user?.subject}</span>
                                    </div>
                                    <div className="flex justify-between pb-1">
                                        <span className="text-white/50 text-sm">Mobile No.</span>
                                        <span className="text-white text-sm font-medium">{user?.mobileNo}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Warning size={20} className="text-yellow-400" />
                                        <h3 className="text-yellow-300 font-semibold text-sm">
                                            {isProfileComplete ? "Edit Profile" : "Complete Your Profile"}
                                        </h3>
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
                                            className="text-white/50 hover:text-white text-xs cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                                <form onSubmit={handleProfileUpdate} className="space-y-3">
                                    <div>
                                        <label className="text-white/60 text-xs mb-1 flex items-center gap-1">
                                            <User size={14} /> Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            placeholder="Your full name"
                                            className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-400 transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-white/60 text-xs mb-1 flex items-center gap-1">
                                            <IdentificationCard size={14} /> Department
                                        </label>
                                        <input
                                            type="text"
                                            value={dept}
                                            onChange={(e) => setDept(e.target.value)}
                                            required
                                            placeholder="e.g., Computer Science"
                                            className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-400 transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-white/60 text-xs mb-1 flex items-center gap-1">
                                            <BookBookmark size={14} /> Main Subject
                                        </label>
                                        <input
                                            type="text"
                                            value={profileSubject}
                                            onChange={(e) => setProfileSubject(e.target.value)}
                                            required
                                            placeholder="e.g., Data Structures"
                                            className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-400 transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-white/60 text-xs mb-1 flex items-center gap-1">
                                            <Phone size={14} /> Mobile No.
                                        </label>
                                        <input
                                            type="text"
                                            value={mobileNo}
                                            onChange={(e) => setMobileNo(e.target.value)}
                                            required
                                            placeholder="Your number"
                                            className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-400 transition"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-semibold py-2.5 rounded-xl transition text-sm cursor-pointer"
                                    >
                                        Save Profile
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                )}
            </main>

            {/* ========== BOTTOM NAV BAR ========== */}
            <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-t border-white/10 pt-2 px-6 pb-4 z-50">
                <div className="max-w-lg mx-auto flex justify-between items-center">
                    <button
                        onClick={() => setActiveTab("home")}
                        className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all w-16 cursor-pointer ${activeTab === "home" ? "text-indigo-400" : "text-white/40 hover:text-white/70"}`}
                    >
                        <House size={24} weight={activeTab === "home" ? "fill" : "regular"} />
                        <span className="text-[10px] font-medium">Home</span>
                    </button>

                    <button
                        onClick={() => { setActiveTab("analytics"); fetchStats(); fetchSessions(); }}
                        className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all w-16 cursor-pointer ${activeTab === "analytics" ? "text-indigo-400" : "text-white/40 hover:text-white/70"}`}
                    >
                        <ChartBar size={24} weight={activeTab === "analytics" ? "fill" : "regular"} />
                        <span className="text-[10px] font-medium">Stats</span>
                    </button>

                    <button
                        onClick={() => setActiveTab("profile")}
                        className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all w-16 cursor-pointer ${activeTab === "profile" ? "text-indigo-400" : "text-white/40 hover:text-white/70"}`}
                    >
                        <User size={24} weight={activeTab === "profile" ? "fill" : "regular"} />
                        <span className="text-[10px] font-medium">Profile</span>
                    </button>
                </div>
            </nav>
        </div>
    );
}
