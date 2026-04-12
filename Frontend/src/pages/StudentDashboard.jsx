import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import {
    ArrowLeft,
    BookBookmark,
    Buildings,
    CalendarBlank,
    CheckCircle,
    Clock,
    ClockCounterClockwise,
    FunnelSimple,
    GearSix,
    House,
    IdentificationCard,
    Lightning,
    MapPin,
    Phone,
    SignOut,
    SpinnerGap,
    TrendUp,
    User as UserIcon,
    Warning,
} from "@phosphor-icons/react";

function getDistance(lat1, lon1, lat2, lon2) {
    const r = 6371e3;
    const p1 = (lat1 * Math.PI) / 180;
    const p2 = (lat2 * Math.PI) / 180;
    const dp = ((lat2 - lat1) * Math.PI) / 180;
    const dl = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    return r * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function formatDateTime(value) {
    if (!value) return "Time unavailable";
    return new Date(value).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatDateLabel(value) {
    if (!value) return "";
    return new Date(value).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
    });
}

function formatMonthLabel(value) {
    return new Date(value).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
    });
}

function formatTime(value) {
    if (!value) return "--:--";
    return new Date(value).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatDayHeading(value) {
    if (!value) return "RECENT";
    return new Date(value)
        .toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "short",
        })
        .toUpperCase();
}

function getTeacherName(session) {
    return session?.teacherName || session?.teacherId?.name || "Session details unavailable";
}

function getDeviceId() {
    return `${navigator.userAgent.slice(0, 40)}_${window.screen.width}x${window.screen.height}`;
}

function getHistoryCode(record) {
    return record?.sessionId?.sessionCode || "Active session";
}

export default function StudentDashboard() {
    const navigate = useNavigate();
    const { user, updateProfile, logout } = useAuth();

    const [activeTab, setActiveTab] = useState("home");
    const [stats, setStats] = useState(null);
    const [history, setHistory] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [location, setLocation] = useState(null);
    const [distanceVal, setDistanceVal] = useState(null);
    const [locationStatus, setLocationStatus] = useState("checking");
    const [loadingSession, setLoadingSession] = useState(true);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [marking, setMarking] = useState(false);
    const [historyFilter, setHistoryFilter] = useState("all");

    const [name, setName] = useState(user?.name || "");
    const [regNo, setRegNo] = useState(user?.regNo || "");
    const [branch, setBranch] = useState(user?.branch || "");
    const [semester, setSemester] = useState(user?.semester || "");
    const [mobileNo, setMobileNo] = useState(user?.mobileNo || "");

    const isProfileComplete = user && user.regNo && user.branch && user.semester && user.mobileNo;
    const [isEditingProfile, setIsEditingProfile] = useState(!isProfileComplete);

    useEffect(() => {
        setName(user?.name || "");
        setRegNo(user?.regNo || "");
        setBranch(user?.branch || "");
        setSemester(user?.semester || "");
        setMobileNo(user?.mobileNo || "");
    }, [user]);

    useEffect(() => {
        if (!isProfileComplete) {
            setIsEditingProfile(true);
            setActiveTab("profile");
        }

        fetchStats();
        fetchHistory();
        refreshLocationAndSession(false);
    }, [user, isProfileComplete]);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchActiveSession(location, false);
        }, 20000);

        return () => clearInterval(interval);
    }, [location]);

    const attendancePercentage = stats?.percentage || 0;
    const attendedSessions = stats?.attendedSessions || 0;
    const totalSessions = stats?.totalSessions || 0;
    const absentSessions = Math.max(totalSessions - attendedSessions, 0);
    const recentSessions = useMemo(() => history.slice(0, 5), [history]);
    const streakValue = stats?.streak || Math.min(attendedSessions, 5);

    const isWithinRadius = useMemo(() => {
        if (typeof activeSession?.isWithinRadius === "boolean") return activeSession.isWithinRadius;
        if (!location || !activeSession?.location) return null;
        return getDistance(location.lat, location.lng, activeSession.location.lat, activeSession.location.lng) <= (activeSession.radius || 100);
    }, [activeSession, location]);

    const canMarkAttendance = Boolean(activeSession) && !activeSession?.alreadyMarked && isWithinRadius === true && !marking;

    const filteredHistory = useMemo(() => {
        const now = new Date();

        return history.filter((record) => {
            if (historyFilter === "all") return true;

            const ts = new Date(record.timestamp || record.sessionId?.startTime || Date.now());
            const diffDays = Math.floor((now - ts) / (1000 * 60 * 60 * 24));

            if (historyFilter === "this_week") return diffDays <= 7;
            if (historyFilter === "last_month") return diffDays <= 30;
            if (historyFilter === "subject_ai") {
                return (record.sessionId?.subject || "").toLowerCase().includes("ai");
            }

            return true;
        });
    }, [history, historyFilter]);

    const groupedHistory = useMemo(() => {
        const groups = [];
        const map = new Map();

        filteredHistory.forEach((record) => {
            const keySource = record.timestamp || record.sessionId?.startTime || record.createdAt || new Date();
            const key = new Date(keySource).toDateString();

            if (!map.has(key)) {
                const group = {
                    key,
                    title: formatDayHeading(keySource),
                    records: [],
                };
                map.set(key, group);
                groups.push(group);
            }

            map.get(key).records.push(record);
        });

        return groups;
    }, [filteredHistory]);

    async function fetchStats() {
        try {
            const res = await api.get("/attendance/student/stats");
            setStats(res.data);
        } catch (err) {
            console.error("Stats fetch failed:", err);
        }
    }

    async function fetchHistory() {
        try {
            const res = await api.get("/attendance/student/history");
            setHistory(res.data || []);
        } catch (err) {
            console.error("History fetch failed:", err);
        } finally {
            setLoadingHistory(false);
        }
    }

    async function fetchActiveSession(currentLocation = location, withLoader = true) {
        if (withLoader) setLoadingSession(true);
        try {
            const params = {};
            if (currentLocation?.lat != null && currentLocation?.lng != null) {
                params.lat = currentLocation.lat;
                params.lng = currentLocation.lng;
            }

            const res = await api.get("/session/active", { params });
            setActiveSession(res.data || null);

            if (res.data?.location && currentLocation) {
                setDistanceVal(getDistance(currentLocation.lat, currentLocation.lng, res.data.location.lat, res.data.location.lng));
            } else {
                setDistanceVal(null);
            }
        } catch (err) {
            console.error("Active session fetch failed:", err);
            setActiveSession(null);
        } finally {
            if (withLoader) setLoadingSession(false);
        }
    }

    function refreshLocationAndSession(showToast) {
        if (!navigator.geolocation) {
            setLocationStatus("error");
            fetchActiveSession(null, true);
            return;
        }

        setLocationStatus("checking");
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const nextLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setLocation(nextLocation);
                setLocationStatus("ready");
                await fetchActiveSession(nextLocation, true);
            },
            async () => {
                setLocation(null);
                setLocationStatus("error");
                await fetchActiveSession(null, true);
                if (showToast) toast.error("Please enable location access to mark attendance");
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }

    async function handleMarkAttendance() {
        if (!activeSession?.sessionId || !location) {
            toast.error("Location not available");
            refreshLocationAndSession(true);
            return;
        }

        setMarking(true);
        try {
            const res = await api.post("/attendance/mark", {
                sessionId: activeSession.sessionId,
                lat: location.lat,
                lng: location.lng,
                deviceId: getDeviceId(),
            });

            toast.success(res.data.message);
            await Promise.all([fetchStats(), fetchHistory(), fetchActiveSession(location, false)]);
        } catch (err) {
            toast.error(err.response?.data?.msg || "Failed to mark attendance");
            await fetchActiveSession(location, false);
        } finally {
            setMarking(false);
        }
    }

    async function handleProfileUpdate(e) {
        e.preventDefault();
        try {
            await updateProfile({ name, regNo, branch, semester, mobileNo });
            setIsEditingProfile(false);
            toast.success("Profile updated");
        } catch (err) {
            toast.error("Failed to update profile");
        }
    }

    async function handleLogout() {
        await logout();
        navigate("/login", { replace: true });
    }

    function renderAttendanceTab() {
        return (
            <div className="space-y-5 animate-fade-in">
                <section className="flex items-center gap-3">
                    <button
                        onClick={() => setActiveTab("home")}
                        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-[#161d2d] text-slate-300"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-[32px] font-semibold leading-none text-white">Attendance</h1>
                        <p className="mt-2 text-sm text-slate-400">Mark attendance from the current active session.</p>
                    </div>
                </section>

                {loadingSession ? (
                    <div className="flex justify-center rounded-[26px] border border-white/6 bg-[#171d2a] p-12">
                        <SpinnerGap size={26} className="animate-spin text-[#33d1ff]" />
                    </div>
                ) : !activeSession ? (
                    <div className="rounded-[30px] border border-white/8 bg-[#171d2a] p-8 shadow-[0_22px_50px_rgba(0,0,0,0.2)]">
                        <p className="text-[11px] uppercase tracking-[0.32em] text-slate-500">No Active Session</p>
                        <h2 className="mt-4 text-3xl font-semibold text-white">Nothing to mark right now</h2>
                        <p className="mt-3 max-w-2xl text-sm text-slate-400">
                            When your teacher starts a live session, the attendance card will appear here automatically.
                        </p>
                        <button
                            onClick={() => refreshLocationAndSession(true)}
                            className="mt-6 rounded-2xl bg-[#2dbdf3] px-5 py-3 text-sm font-semibold text-[#07141e]"
                        >
                            Refresh Attendance
                        </button>
                    </div>
                ) : (
                    <>
                        <section className="rounded-[30px] border border-emerald-500/30 bg-[linear-gradient(180deg,rgba(4,31,40,0.98),rgba(7,27,40,0.98))] p-6 shadow-[0_22px_50px_rgba(0,0,0,0.24)]">
                            <div className="flex items-center justify-between gap-3">
                                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/14 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-300">
                                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                                    Active Session
                                </span>
                                <span className="text-sm font-medium text-slate-400">
                                    {activeSession.alreadyMarked ? "Attendance already submitted" : "Tap to mark attendance"}
                                </span>
                            </div>

                            <div className="mt-6">
                                <h2 className="text-4xl font-semibold text-white">{activeSession.subject}</h2>
                                <p className="mt-3 text-2xl text-slate-300">{getTeacherName(activeSession)}</p>
                                <p className="mt-2 text-base text-slate-400">{activeSession.location ? "Campus geofence enabled" : "Session details unavailable"}</p>
                                <p className="mt-2 text-lg text-slate-400">Code {activeSession.sessionCode || activeSession.sessionId?.slice?.(-8) || "LIVE"}</p>
                            </div>

                            <div className="mt-8 flex items-center justify-between gap-4">
                                <div className="flex -space-x-2">
                                    {["A", "B", "C", "D"].map((label, index) => (
                                        <span
                                            key={label}
                                            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#08232d] text-xs font-semibold text-white ${index === 0 ? "bg-[#f59e0b]" : index === 1 ? "bg-[#ec4899]" : index === 2 ? "bg-[#4f7cff]" : "bg-[#0fb6b9]"
                                                }`}
                                        >
                                            {label}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-2xl text-slate-300">{activeSession.totalMarked || 0} check-ins tracked</p>
                            </div>
                        </section>

                        <button
                            onClick={handleMarkAttendance}
                            disabled={!canMarkAttendance}
                            className="w-full rounded-[28px] bg-[#2da8e7] px-6 py-8 text-center shadow-[0_20px_45px_rgba(45,168,231,0.3)] disabled:cursor-not-allowed disabled:opacity-55"
                        >
                            <div className="flex items-center justify-center gap-3 text-[18px] font-semibold text-[#05131d]">
                                {marking ? <SpinnerGap size={22} className="animate-spin" /> : <CheckCircle size={22} weight="fill" />}
                                {activeSession.alreadyMarked ? "Attendance Marked" : "Mark Attendance"}
                            </div>
                            <p className="mt-4 text-sm text-[#083047]">
                                {activeSession.alreadyMarked
                                    ? "You have already marked attendance for this session."
                                    : isWithinRadius === false
                                        ? "You are outside the allowed radius."
                                        : locationStatus === "error"
                                            ? "Enable location to continue."
                                            : "Current no-QR attendance logic remains unchanged."}
                            </p>
                        </button>
                    </>
                )}
            </div>
        );
    }

    function renderHomeTab() {
        return (
            <div className="space-y-6 animate-fade-in">
                <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
                    <div>
                        <h1 className="text-5xl font-semibold leading-[0.95] tracking-[-0.04em] text-white">
                            Hi, {user?.name?.split(" ")[0] || "Student"}
                        </h1>
                        <p className="mt-2 text-base text-slate-300">Let&apos;s get you marked for today&apos;s classes.</p>

                        <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-300">
                            <span className="rounded-full bg-white/5 px-4 py-2">{formatDateLabel(new Date())}</span>
                            <span className="rounded-full bg-white/5 px-4 py-2">
                                {isWithinRadius === false ? "Outside campus" : locationStatus === "error" ? "Location blocked" : "On campus"}
                            </span>
                        </div>

                        <div className="mt-8 rounded-[30px] border border-emerald-500/30 bg-[linear-gradient(180deg,rgba(4,31,40,0.98),rgba(7,27,40,0.98))] p-6 shadow-[0_22px_50px_rgba(0,0,0,0.24)]">
                            <div className="flex items-center justify-between gap-3">
                                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/14 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-300">
                                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                                    Active Session
                                </span>
                                <span className="text-sm font-medium text-slate-400">Open Attendance to mark attendance</span>
                            </div>

                            <div className="mt-4">
                                <h2 className="text-2xl font-semibold text-white">{activeSession?.subject || "No active session"}</h2>
                                <p className="mt-2 text-xl text-slate-300">{activeSession ? getTeacherName(activeSession) : "Session details unavailable"}</p>
                                <p className="mt-1 text-sm text-slate-400">{activeSession?.location ? "Campus geofence enabled" : "Session details unavailable"}</p>
                                <p className="mt-1 text-base text-slate-400">Code {activeSession?.sessionCode || getHistoryCode(recentSessions[0])}</p>
                            </div>

                            <div className="mt-6 flex items-center justify-between gap-4">
                                <div className="flex -space-x-2">
                                    {["A", "B", "C", "D"].map((label, index) => (
                                        <span
                                            key={label}
                                            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#08232d] text-[10px] font-semibold text-white ${index === 0 ? "bg-[#f59e0b]" : index === 1 ? "bg-[#ec4899]" : index === 2 ? "bg-[#4f7cff]" : "bg-[#0fb6b9]"
                                                }`}
                                        >
                                            {label}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-lg text-slate-300">{activeSession?.totalMarked || 0} check-ins tracked</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setActiveTab("attendance")}
                            className="mt-6 w-full rounded-2xl bg-[#2da8e7] px-5 py-5 text-center shadow-[0_15px_30px_rgba(45,168,231,0.25)]"
                        >
                            <div className="flex items-center justify-center gap-2 text-base font-semibold text-[#05131d]">
                                <CheckCircle size={20} weight="fill" />
                                Mark Attendance
                            </div>
                            <p className="mt-2 text-xs text-[#083047]">Click to open the attendance page and mark attendance.</p>
                        </button>
                    </div>
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-2xl border border-white/8 bg-[#171d2a] p-4">
                                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Attendance</p>
                                <p className="mt-3 text-3xl font-semibold text-white">{attendancePercentage}%</p>
                            </div>
                            <div className="rounded-2xl border border-white/8 bg-[#171d2a] p-4">
                                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Attended</p>
                                <p className="mt-3 text-3xl font-semibold text-white">{attendedSessions}</p>
                            </div>
                            <div className="rounded-2xl border border-white/8 bg-[#171d2a] p-4">
                                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Missed</p>
                                <p className="mt-3 text-3xl font-semibold text-white">{absentSessions}</p>
                            </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="rounded-2xl border border-white/8 bg-[#171d2a] p-5">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#123341] text-[#32d7ff]">
                                    <Clock size={20} />
                                </div>
                                <p className="mt-4 text-3xl font-semibold text-white">
                                    {attendedSessions}/{Math.max(totalSessions, attendedSessions || 1)}
                                </p>
                                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">This Week</p>
                            </div>

                            <div className="rounded-2xl border border-white/8 bg-[#171d2a] p-5">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#123341] text-[#6be8ff]">
                                    <TrendUp size={20} />
                                </div>
                                <div className="mt-4 flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-3xl font-semibold text-white">{attendancePercentage}%</p>
                                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Attendance</p>
                                    </div>
                                    <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-slate-300">{absentSessions} absent</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-end justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
                                    <p className="mt-1 text-sm text-slate-400">Latest attendance records</p>
                                </div>
                                <button onClick={() => setActiveTab("history")} className="text-lg font-semibold text-[#33cfff]">
                                    View History
                                </button>
                            </div>

                            <div className="mt-4 space-y-4">
                                {recentSessions.length === 0 ? (
                                    <div className="rounded-[26px] border border-white/8 bg-[#171d2a] p-6 text-slate-400">
                                        No recent activity available yet.
                                    </div>
                                ) : (
                                    recentSessions.slice(0, 2).map((record) => (
                                        <div key={record._id} className="rounded-[28px] border border-white/8 bg-[#171d2a] p-5">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-slate-300">
                                                        <Clock size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xl font-semibold text-white">{record.sessionId?.subject || "Unknown"}</p>
                                                        <p className="mt-1 text-xs text-slate-400">{formatDateTime(record.timestamp || record.sessionId?.startTime)}</p>
                                                        <p className="mt-1 text-xs text-slate-500">Code {getHistoryCode(record)}</p>
                                                    </div>
                                                </div>
                                                <span className={`rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] ${record.status?.toLowerCase() === 'absent' ? "bg-red-500/14 text-red-400" : "bg-emerald-500/14 text-emerald-300"}`}>
                                                    {record.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        );
    }

    function renderHistoryTab() {
        const filterChips = [
            { key: "all", label: "All" },
            { key: "this_week", label: "This Week" },
            { key: "last_month", label: "Last Month" },
            { key: "subject_ai", label: "Mathematics" },
        ];

        return (
            <div className="space-y-6 animate-fade-in">
                <section className="grid gap-6 xl:grid-cols-[0.42fr_0.58fr]">
                    <div>
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <button
                                    onClick={() => setActiveTab("home")}
                                    className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl text-slate-300"
                                >
                                    <ArrowLeft size={22} />
                                </button>
                                <div>
                                    <h1 className="text-3xl font-semibold leading-none text-white">History</h1>
                                    <p className="mt-2 text-sm text-slate-400">Track your recent attendance sessions</p>
                                </div>
                            </div>

                            <div className="hidden items-center gap-3 md:flex">
                                <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-[#171d2a] text-slate-400">
                                    <CalendarBlank size={20} />
                                </button>
                                <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-[#171d2a] text-slate-400">
                                    <FunnelSimple size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="mt-10">
                            <p className="text-[12px] font-semibold uppercase tracking-[0.32em] text-slate-500">Statistics</p>

                            <div className="mt-5 grid gap-4 md:grid-cols-3 xl:grid-cols-1">
                                <div className="rounded-[28px] border border-cyan-500/30 bg-[linear-gradient(180deg,rgba(23,118,132,0.95),rgba(18,106,121,0.95))] p-5">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#b6f3ff]">
                                        <TrendUp size={24} />
                                    </div>
                                    <p className="mt-3 text-3xl font-semibold text-white">{attendancePercentage}%</p>
                                    <p className="mt-2 text-[13px] font-semibold uppercase tracking-[0.28em] text-cyan-50/80">Attendance</p>
                                </div>

                                <div className="rounded-[28px] border border-white/8 bg-[#171d2a] p-5">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.05] text-slate-300">
                                        <CalendarBlank size={22} />
                                    </div>
                                    <p className="mt-3 text-3xl font-semibold text-white">{streakValue} Days</p>
                                    <p className="mt-2 text-[13px] font-semibold uppercase tracking-[0.28em] text-slate-500">Streak</p>
                                </div>

                                <div className="rounded-[28px] border border-white/8 bg-[#171d2a] p-5">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.05] text-slate-300">
                                        <Clock size={22} />
                                    </div>
                                    <p className="mt-3 text-3xl font-semibold text-white">{absentSessions}</p>
                                    <p className="mt-2 text-[13px] font-semibold uppercase tracking-[0.28em] text-slate-500">Missed</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3">
                            {filterChips.map((chip) => (
                                <button
                                    key={chip.key}
                                    onClick={() => setHistoryFilter(chip.key)}
                                    className={`rounded-full px-5 py-3 text-sm font-semibold transition ${historyFilter === chip.key
                                            ? "bg-[#2dc6ef] text-[#07131d]"
                                            : "border border-white/8 bg-[#171d2a] text-slate-400"
                                        }`}
                                >
                                    {chip.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-semibold text-white">Recent Sessions</h2>
                            </div>
                            <p className="mt-2 text-base text-slate-500">{formatMonthLabel(new Date())}</p>
                        </div>

                        {loadingHistory ? (
                            <div className="mt-10 flex justify-center py-10">
                                <SpinnerGap size={24} className="animate-spin text-[#33d1ff]" />
                            </div>
                        ) : groupedHistory.length === 0 ? (
                            <div className="mt-8 rounded-[28px] border border-white/8 bg-[#171d2a] p-6 text-slate-400">
                                No attendance records available yet.
                            </div>
                        ) : (
                            <div className="mt-6 space-y-8">
                                {groupedHistory.map((group) => (
                                    <div key={group.key}>
                                        <p className="text-[15px] font-semibold uppercase tracking-[0.28em] text-slate-500">{group.title}</p>

                                        <div className="mt-5 space-y-5 border-l border-white/10 pl-8">
                                            {group.records.map((record) => (
                                                <div key={record._id} className="relative rounded-[30px] border border-white/8 bg-[#171d2a] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.14)]">
                                                    <span className="absolute -left-[41px] top-4 h-3.5 w-3.5 rounded-full bg-slate-500" />

                                                    <div className="flex items-start justify-between gap-4">
                                                        <div>
                                                            <h3 className="text-xl font-semibold text-white">{record.sessionId?.subject || "Unknown subject"}</h3>
                                                            <p className="mt-1 text-sm text-slate-400">{getTeacherName(record.sessionId)}</p>
                                                        </div>
                                                        <span className={`rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] ${record.status?.toLowerCase() === 'absent' ? "bg-red-500/14 text-red-400" : "bg-emerald-500/14 text-emerald-300"}`}>
                                                            {record.status}
                                                        </span>
                                                    </div>

                                                    <div className="mt-6 grid gap-4 text-base text-slate-400 md:grid-cols-2">
                                                        <div className="flex items-center gap-3">
                                                            <Clock size={18} />
                                                            <span>{formatTime(record.timestamp || record.sessionId?.startTime)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <MapPin size={18} />
                                                            <span>Code {getHistoryCode(record)}</span>
                                                        </div>
                                                    </div>

                                                    <div className="mt-6 flex items-center justify-between border-t border-white/8 pt-5">
                                                        <p className="text-sm text-slate-500">Captured via active session</p>
                                                        <button
                                                            onClick={() => setActiveTab("attendance")}
                                                            className="text-[18px] font-semibold text-[#33cfff]"
                                                        >
                                                            Details
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        );
    }

    function renderProfileTab() {
        return (
            <div className="space-y-4 animate-fade-in lg:grid lg:grid-cols-[1.06fr_0.94fr] lg:gap-5 lg:space-y-0">
                <div className="rounded-[28px] border border-white/6 bg-[#171b24] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
                    <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold text-white">Profile</h2>
                            <p className="mt-1 text-sm text-slate-400">Keep these details updated for attendance verification.</p>
                        </div>
                        {!isEditingProfile && (
                            <button onClick={() => setIsEditingProfile(true)} className="text-xs font-semibold text-[#33c3ff]">
                                Edit
                            </button>
                        )}
                    </div>

                    {!isEditingProfile ? (
                        <div className="space-y-3">
                            {[
                                { icon: <UserIcon size={16} />, label: "Full Name", value: user?.name || "Not set" },
                                { icon: <IdentificationCard size={16} />, label: "Registration No.", value: user?.regNo || "Not set" },
                                { icon: <Buildings size={16} />, label: "Branch", value: user?.branch || "Not set" },
                                { icon: <BookBookmark size={16} />, label: "Semester", value: user?.semester || "Not set" },
                                { icon: <Phone size={16} />, label: "Mobile", value: user?.mobileNo || "Not set" },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center gap-3 rounded-[20px] border border-white/6 bg-[#141925] px-4 py-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#102833] text-[#61d7ff]">{item.icon}</div>
                                    <div>
                                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                                        <p className="mt-1 text-sm font-semibold text-white">{item.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-[24px] border border-white/6 bg-[#141925] p-4">
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <Warning size={18} weight="fill" className="text-amber-300" />
                                    <p className="text-sm font-semibold text-amber-200">
                                        {isProfileComplete ? "Edit your profile" : "Complete your profile"}
                                    </p>
                                </div>
                                {isProfileComplete && (
                                    <button
                                        onClick={() => {
                                            setIsEditingProfile(false);
                                            setName(user?.name || "");
                                            setRegNo(user?.regNo || "");
                                            setBranch(user?.branch || "");
                                            setSemester(user?.semester || "");
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
                                <input type="text" value={regNo} onChange={(e) => setRegNo(e.target.value)} required placeholder="Registration number" className="w-full rounded-[16px] border border-white/8 bg-[#0f1420] px-4 py-3 text-sm text-white outline-none transition focus:border-[#33c3ff]" />
                                <input type="text" value={branch} onChange={(e) => setBranch(e.target.value)} required placeholder="Branch" className="w-full rounded-[16px] border border-white/8 bg-[#0f1420] px-4 py-3 text-sm text-white outline-none transition focus:border-[#33c3ff]" />
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="text" value={semester} onChange={(e) => setSemester(e.target.value)} required placeholder="Semester" className="w-full rounded-[16px] border border-white/8 bg-[#0f1420] px-4 py-3 text-sm text-white outline-none transition focus:border-[#33c3ff]" />
                                    <input type="text" value={mobileNo} onChange={(e) => setMobileNo(e.target.value)} required placeholder="Mobile number" className="w-full rounded-[16px] border border-white/8 bg-[#0f1420] px-4 py-3 text-sm text-white outline-none transition focus:border-[#33c3ff]" />
                                </div>
                                <button type="submit" className="w-full rounded-[18px] bg-[#1daaf2] px-4 py-3 text-sm font-semibold text-[#04131f] shadow-[0_16px_36px_rgba(29,170,242,0.24)]">
                                    Save Profile
                                </button>
                            </form>
                        </div>
                    )}

                    <button onClick={handleLogout} className="mt-4 flex w-full items-center justify-center gap-2 rounded-[18px] border border-white/8 bg-[#171c27] px-4 py-3 text-sm font-semibold text-white">
                        <SignOut size={18} />
                        Logout
                    </button>
                </div>

                <div className="rounded-[24px] border border-white/6 bg-[#171b24] p-5 shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Profile status</p>
                    <p className="mt-3 text-2xl font-semibold text-white">{isProfileComplete ? "Ready for class" : "Needs update"}</p>
                    <p className="mt-2 text-sm text-slate-400">
                        Accurate details help keep location-based attendance validation smooth.
                    </p>
                </div>
            </div>
        );
    }

    const navItems = [
        { key: "home", label: "Home" },
        { key: "attendance", label: "Attendance" },
        { key: "history", label: "History" },
        { key: "profile", label: "Profile" },
    ];

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(20,31,55,0.96),rgba(5,10,24,1)_58%)] text-slate-200">
            <main className="mx-auto min-h-screen w-full max-w-[1540px] px-5 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-10">
                <section className="mb-9">
                    <div className="flex items-center justify-between rounded-[24px] border border-white/6 bg-[#191e2a]/96 px-5 py-4 shadow-[0_14px_36px_rgba(0,0,0,0.22)]">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#111827]">
                                <Lightning size={20} weight="fill" />
                            </div>
                            <div>
                                <p className="text-base font-semibold text-white">Student Dashboard</p>
                                <p className="mt-0.5 text-xs text-slate-500">Track live attendance, history, and profile in one place.</p>
                            </div>
                        </div>

                        <div className="hidden items-center gap-3 lg:flex">
                            <div className="flex items-center gap-1 rounded-[16px] border border-white/6 bg-[#141a26] p-1">
                                {navItems.map((item) => (
                                    <button
                                        key={item.key}
                                        onClick={() => setActiveTab(item.key)}
                                        className={`rounded-[12px] px-5 py-2 text-sm font-semibold transition ${activeTab === item.key ? "bg-[#2dc6ef] text-[#05131d]" : "text-slate-400 hover:text-white"
                                            }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setActiveTab("profile")}
                                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-white/5 transition"
                            >
                                <GearSix size={18} weight="bold" />
                            </button>
                        </div>
                    </div>
                </section>

                {activeTab === "home" && renderHomeTab()}
                {activeTab === "attendance" && renderAttendanceTab()}
                {activeTab === "history" && renderHistoryTab()}
                {activeTab === "profile" && renderProfileTab()}
            </main>

            <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-5 lg:hidden">
                <div className="mx-auto flex w-full max-w-xl items-center justify-between rounded-[24px] border border-white/6 bg-[#0e1320]/94 px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                    <button onClick={() => setActiveTab("home")} className={`flex flex-col items-center gap-1 text-[10px] font-medium ${activeTab === "home" ? "text-[#2fc6ff]" : "text-slate-500"}`}>
                        <House size={22} weight={activeTab === "home" ? "fill" : "regular"} />
                        Home
                    </button>
                    <button onClick={() => setActiveTab("attendance")} className={`flex flex-col items-center gap-1 text-[10px] font-medium ${activeTab === "attendance" ? "text-[#2fc6ff]" : "text-slate-500"}`}>
                        <CheckCircle size={22} weight={activeTab === "attendance" ? "fill" : "regular"} />
                        Attendance
                    </button>
                    <button onClick={() => setActiveTab("history")} className={`flex flex-col items-center gap-1 text-[10px] font-medium ${activeTab === "history" ? "text-[#2fc6ff]" : "text-slate-500"}`}>
                        <ClockCounterClockwise size={22} weight={activeTab === "history" ? "fill" : "regular"} />
                        History
                    </button>
                    <button onClick={() => setActiveTab("profile")} className={`flex flex-col items-center gap-1 text-[10px] font-medium ${activeTab === "profile" ? "text-[#2fc6ff]" : "text-slate-500"}`}>
                        <UserIcon size={22} weight={activeTab === "profile" ? "fill" : "regular"} />
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
