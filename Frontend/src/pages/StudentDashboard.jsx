import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import QRScanner from "../components/QRScanner";
import toast from "react-hot-toast";
import {
    ArrowLeft,
    BookBookmark,
    Buildings,
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
    QrCode,
    CalendarBlank,
    ChartLineUp,
    SignOut,
    SpinnerGap,
    TrendUp,
    User as UserIcon,
    Warning,
} from "@phosphor-icons/react";

const COLLEGE_LAT = 20.217426;
const COLLEGE_LNG = 85.682104;
const MAX_RADIUS = 50;

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
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

function formatShortDate(value) {
    if (!value) return "Today";
    return new Date(value).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
    });
}

function getDayKey(value) {
    if (!value) return "";
    const date = new Date(value);
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatDayHeading(value) {
    if (!value) return "Recent";
    const date = new Date(value);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const currentKey = getDayKey(date);
    if (currentKey === getDayKey(today)) {
        return `Today, ${date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }).toUpperCase()}`;
    }

    if (currentKey === getDayKey(yesterday)) {
        return `Yesterday, ${date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }).toUpperCase()}`;
    }

    return date.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "short",
    }).toUpperCase();
}

function formatTimeOnly(value) {
    if (!value) return "--:--";
    return new Date(value).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getStatusTone(status) {
    if (status === "present" || status === "verified") {
        return {
            label: "Present",
            badge: "bg-emerald-500/14 text-emerald-300 border border-emerald-400/15",
        };
    }

    if (status === "late") {
        return {
            label: "Late",
            badge: "bg-amber-400/16 text-amber-200 border border-amber-300/15",
        };
    }

    return {
        label: "Absent",
        badge: "bg-rose-500/14 text-rose-300 border border-rose-400/15",
    };
}

export default function StudentDashboard() {
    const navigate = useNavigate();
    const { user, updateProfile, logout } = useAuth();
    const [activeTab, setActiveTab] = useState("home");
    const [stats, setStats] = useState(null);
    const [distanceVal, setDistanceVal] = useState(null);
    const [showScanner, setShowScanner] = useState(false);
    const [scannedSession, setScannedSession] = useState(null);
    const [location, setLocation] = useState(null);
    const [marking, setMarking] = useState(false);
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [locationStatus, setLocationStatus] = useState("checking");
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
        fetchHistory();
        fetchStats();
        checkLocationOnLoad();
    }, [user, isProfileComplete]);

    const recentHistory = useMemo(() => history.slice(0, 4), [history]);
    const attendancePercentage = stats?.percentage || 0;
    const attendedSessions = stats?.attendedSessions || 0;
    const totalSessions = stats?.totalSessions || 0;
    const absentSessions = Math.max(totalSessions - attendedSessions, 0);
    const isInRange = distanceVal !== null && distanceVal <= MAX_RADIUS;
    const streakDays = history.length ? Math.min(history.length, 12) : 0;
    const historySections = useMemo(() => {
        const grouped = history.reduce((acc, record) => {
            const key = getDayKey(record.timestamp || record.createdAt);
            if (!acc[key]) acc[key] = [];
            acc[key].push(record);
            return acc;
        }, {});

        return Object.entries(grouped).map(([key, records]) => ({
            key,
            title: formatDayHeading(records[0]?.timestamp || records[0]?.createdAt),
            records,
        }));
    }, [history]);

    const activeSessionCard = useMemo(() => {
        if (scannedSession) {
            return {
                title: scannedSession.subject || "Scanned Session",
                faculty: scannedSession.teacherName || "Teacher details unavailable",
                room: scannedSession.room || scannedSession.location || "Campus",
                attendees: attendedSessions,
                endsIn: "Ready to check in",
            };
        }

        const latestRecord = history.find((record) => record?.sessionId);
        return {
            title: latestRecord?.sessionId?.subject || "No live session detected",
            faculty: latestRecord?.sessionId?.teacherName || "Scan the QR when class starts",
            room: latestRecord?.sessionId?.room || latestRecord?.sessionId?.location || "Room info will appear here",
            attendees: attendedSessions,
            endsIn: locationStatus === "in-range" ? "You're on campus" : "Scan to mark attendance",
        };
    }, [attendedSessions, history, locationStatus, scannedSession]);

    const checkLocationOnLoad = () => {
        if (!navigator.geolocation) {
            setLocationStatus("error");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                const dist = getDistance(lat, lng, COLLEGE_LAT, COLLEGE_LNG);
                setDistanceVal(dist);
                setLocation({ lat, lng });
                setLocationStatus(dist <= MAX_RADIUS ? "in-range" : "out-of-range");
            },
            () => {
                setLocationStatus("error");
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const fetchStats = async () => {
        try {
            const res = await api.get("/attendance/student/stats");
            setStats(res.data);
        } catch (err) {
            console.error("Stats fetch failed:", err);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await api.get("/attendance/student/history");
            setHistory(res.data);
        } catch (err) {
            console.error("History fetch failed:", err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            await updateProfile({ name, regNo, branch, semester, mobileNo });
            setIsEditingProfile(false);
            toast.success("Profile updated!");
        } catch (err) {
            toast.error("Failed to update profile");
        }
    };

    const handleScan = async (sessionCode) => {
        setShowScanner(false);
        try {
            const res = await api.get(`/session/code/${sessionCode}`);
            setScannedSession(res.data);
            getCurrentLocation();
            setActiveTab("home");
        } catch (err) {
            toast.error("Session not found or invalid QR code");
        }
    };

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation not supported by your browser");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setLocation({ lat, lng });
                const dist = getDistance(lat, lng, COLLEGE_LAT, COLLEGE_LNG);
                setDistanceVal(dist);
                setLocationStatus(dist <= MAX_RADIUS ? "in-range" : "out-of-range");
            },
            (err) => {
                toast.error("Please enable location access to mark attendance");
                setLocationStatus("error");
                console.error("Location error:", err);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleMarkAttendance = async () => {
        if (!scannedSession || !location) {
            toast.error("Location not available. Please allow location access.");
            getCurrentLocation();
            return;
        }

        setMarking(true);
        try {
            const deviceId = `${navigator.userAgent.slice(0, 50)}_${screen.width}x${screen.height}`;
            const res = await api.post("/attendance/mark", {
                sessionId: scannedSession._id,
                lat: location.lat,
                lng: location.lng,
                deviceId,
            });

            toast.success(res.data.message);
            setScannedSession(null);
            setLocation(null);
            fetchHistory();
            fetchStats();
        } catch (err) {
            toast.error(err.response?.data?.msg || "Failed to mark attendance");
        } finally {
            setMarking(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate("/login", { replace: true });
    };

    const renderHomeTab = () => (
        <div className="space-y-4 animate-fade-in">
            <section className="rounded-[26px] border border-emerald-400/45 bg-[linear-gradient(180deg,rgba(7,28,36,0.96),rgba(7,20,33,0.98))] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.24)]">
                <div className="mb-4 flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-300">
                        <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(74,222,128,0.8)]" />
                        {scannedSession ? "Session Ready" : "Active Session"}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">{activeSessionCard.endsIn}</span>
                </div>

                <div className="space-y-1">
                    <h2 className="text-[21px] font-semibold leading-tight text-white">{activeSessionCard.title}</h2>
                    <p className="text-sm text-slate-300">{activeSessionCard.faculty}</p>
                    <p className="text-xs text-slate-400">{activeSessionCard.room}</p>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-slate-300">
                    <div className="flex -space-x-2">
                        {["A", "B", "C", "D"].map((label, index) => (
                            <div
                                key={label}
                                className={`flex h-7 w-7 items-center justify-center rounded-full border border-[#06101c] text-[10px] font-semibold text-white ${
                                    index === 0
                                        ? "bg-[#f59e0b]"
                                        : index === 1
                                          ? "bg-[#ec4899]"
                                          : index === 2
                                            ? "bg-[#3b82f6]"
                                            : "bg-[#14b8a6]"
                                }`}
                            >
                                {label}
                            </div>
                        ))}
                    </div>
                    <span>{activeSessionCard.attendees} check-ins tracked</span>
                </div>
            </section>

            <section className="rounded-[22px] bg-[#1daaf2] px-4 py-4 text-[#04131f] shadow-[0_16px_36px_rgba(29,170,242,0.24)]">
                {!scannedSession ? (
                    <>
                        <button
                            onClick={() => setShowScanner(true)}
                            className="flex w-full items-center justify-center gap-3 rounded-[18px] bg-[#1daaf2] py-1 text-base font-semibold text-[#04131f] cursor-pointer"
                        >
                            <QrCode size={22} weight="bold" />
                            Mark Attendance
                        </button>
                        <p className="mt-2 text-center text-[11px] font-medium text-[#093047]">
                            Having trouble? Enter code manually after scanning on your current flow.
                        </p>
                    </>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between rounded-[18px] bg-[#0f2230]/12 px-3 py-3 text-sm">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0b3b5a]">
                                    Session detected
                                </p>
                                <p className="mt-1 font-semibold text-[#04131f]">{scannedSession.subject}</p>
                            </div>
                            <MapPin size={20} weight="fill" className={isInRange ? "text-emerald-700" : "text-amber-700"} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setScannedSession(null)}
                                className="rounded-[16px] bg-white/18 px-4 py-3 text-sm font-semibold text-[#052235] cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleMarkAttendance}
                                disabled={marking || (distanceVal !== null && distanceVal > MAX_RADIUS)}
                                className="flex items-center justify-center gap-2 rounded-[16px] bg-[#04131f] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {marking ? <SpinnerGap className="animate-spin" size={18} /> : <CheckCircle size={18} weight="fill" />}
                                Mark Present
                            </button>
                        </div>
                    </div>
                )}
            </section>

            <section className="grid grid-cols-2 gap-3">
                <div className="rounded-[20px] border border-white/6 bg-[#181d27] px-4 py-4 shadow-[0_12px_28px_rgba(0,0,0,0.22)]">
                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#102b35] text-[#29c7d8]">
                        <Clock size={20} weight="duotone" />
                    </div>
                    <p className="text-[31px] font-semibold leading-none text-white">
                        {attendedSessions}/{Math.max(totalSessions, attendedSessions)}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">This week</p>
                </div>

                <div className="rounded-[20px] border border-white/6 bg-[#181d27] px-4 py-4 shadow-[0_12px_28px_rgba(0,0,0,0.22)]">
                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#102833] text-[#61d7ff]">
                        <TrendUp size={20} weight="duotone" />
                    </div>
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[31px] font-semibold leading-none text-white">{attendancePercentage}%</p>
                            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                Attendance
                            </p>
                        </div>
                        <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] font-semibold text-slate-300">
                            {absentSessions} absent
                        </span>
                    </div>
                </div>
            </section>

            <section className="pt-1">
                <div className="mb-3 flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-semibold text-white">Recent Activity</h3>
                        <p className="text-xs text-slate-500">Latest attendance records</p>
                    </div>
                    <button
                        onClick={() => setActiveTab("history")}
                        className="text-xs font-semibold text-[#33c3ff] cursor-pointer"
                    >
                        View History
                    </button>
                </div>

                {loadingHistory ? (
                    <div className="flex items-center justify-center rounded-[20px] border border-white/6 bg-[#141925] px-4 py-10">
                        <SpinnerGap size={22} className="animate-spin text-[#33c3ff]" />
                    </div>
                ) : recentHistory.length === 0 ? (
                    <div className="rounded-[20px] border border-white/6 bg-[#141925] px-4 py-8 text-center text-sm text-slate-400">
                        No attendance records yet
                    </div>
                ) : (
                    <div className="space-y-3">
                        {recentHistory.map((record) => {
                            const tone = getStatusTone(record.status);
                            return (
                                <div
                                    key={record._id}
                                    className="flex items-center justify-between rounded-[20px] border border-white/6 bg-[#141925] px-4 py-4 shadow-[0_10px_24px_rgba(0,0,0,0.18)]"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full border border-white/6 bg-white/[0.03] text-slate-300">
                                            <Clock size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-white">
                                                {record.sessionId?.subject || "Unknown Subject"}
                                            </p>
                                            <p className="mt-1 text-[11px] text-slate-500">{formatDateTime(record.timestamp)}</p>
                                            <p className="mt-0.5 text-[11px] text-slate-500">
                                                {record.sessionId?.room || record.sessionId?.location || "Room info unavailable"}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${tone.badge}`}>
                                        {tone.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );

    const renderHistoryTab = () => (
        <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setActiveTab("home")}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/[0.04] hover:text-white cursor-pointer"
                    >
                        <ArrowLeft size={18} weight="bold" />
                    </button>
                    <div>
                        <h2 className="text-lg font-semibold text-white">History</h2>
                        <p className="text-xs text-slate-500">Track your recent attendance sessions</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/6 bg-[#141925] text-slate-400">
                        <CalendarBlank size={16} />
                    </button>
                    <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/6 bg-[#141925] text-slate-400">
                        <FunnelSimple size={16} />
                    </button>
                </div>
            </div>

            <div>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Statistics</p>
                <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-[18px] border border-[#34d7ff]/20 bg-[linear-gradient(180deg,#0f6776,#0b4d58)] px-3 py-3 shadow-[0_16px_30px_rgba(12,90,109,0.24)]">
                        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[#8af2ff]">
                            <TrendUp size={18} weight="duotone" />
                        </div>
                        <p className="text-xl font-semibold leading-none text-white">{attendancePercentage}%</p>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100/80">Attendance</p>
                    </div>

                    <div className="rounded-[18px] border border-white/6 bg-[#141925] px-3 py-3">
                        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] text-slate-300">
                            <ChartLineUp size={18} weight="duotone" />
                        </div>
                        <p className="text-xl font-semibold leading-none text-white">{streakDays} Days</p>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Streak</p>
                    </div>

                    <div className="rounded-[18px] border border-white/6 bg-[#141925] px-3 py-3">
                        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] text-slate-300">
                            <Clock size={18} weight="duotone" />
                        </div>
                        <p className="text-xl font-semibold leading-none text-white">{absentSessions}</p>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Missed</p>
                    </div>
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {["All", "This Week", "Last Month", "Mathematics"].map((chip, index) => (
                    <button
                        key={chip}
                        className={`whitespace-nowrap rounded-full px-4 py-2 text-[11px] font-semibold ${
                            index === 0
                                ? "bg-[#1cc7ee] text-[#04131f]"
                                : "bg-[#141925] text-slate-400 border border-white/6"
                        }`}
                    >
                        {chip}
                    </button>
                ))}
            </div>

            <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-white">Recent Sessions</h3>
                <span className="text-[11px] font-medium text-slate-500">
                    {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                </span>
            </div>

            {loadingHistory ? (
                <div className="flex items-center justify-center rounded-[20px] border border-white/6 bg-[#141925] px-4 py-10">
                    <SpinnerGap size={24} className="animate-spin text-[#33c3ff]" />
                </div>
            ) : (
                <div className="space-y-5">
                    {historySections.length === 0 ? (
                        <div className="rounded-[20px] border border-white/6 bg-[#141925] px-4 py-10 text-center text-sm text-slate-400">
                            No attendance records yet
                        </div>
                    ) : (
                        historySections.map((section) => (
                            <div key={section.key}>
                                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                                    {section.title}
                                </p>
                                <div className="space-y-3">
                                    {section.records.map((record) => {
                                        const tone = getStatusTone(record.status);
                                        return (
                                            <div key={record._id} className="flex gap-3">
                                                <div className="flex w-4 flex-col items-center">
                                                    <span className={`mt-3 h-2.5 w-2.5 rounded-full ${tone.label === "Absent" ? "bg-rose-400" : "bg-slate-500"}`} />
                                                    <span className="mt-1 h-full w-px bg-white/8" />
                                                </div>
                                                <div className="flex-1 rounded-[22px] border border-white/6 bg-[#141925] px-4 py-4 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="text-[15px] font-semibold text-white">
                                                                {record.sessionId?.subject || "Unknown Subject"}
                                                            </p>
                                                            <p className="mt-1 text-[11px] text-slate-500">
                                                                {record.sessionId?.teacherName || "Faculty name unavailable"}
                                                            </p>
                                                        </div>
                                                        <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${tone.badge}`}>
                                                            {tone.label}
                                                        </span>
                                                    </div>

                                                    <div className="mt-4 grid grid-cols-2 gap-3 text-[11px] text-slate-400">
                                                        <div className="flex items-center gap-2">
                                                            <Clock size={14} />
                                                            <span>{formatTimeOnly(record.timestamp)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <MapPin size={14} />
                                                            <span>{record.sessionId?.room || record.sessionId?.location || "Campus"}</span>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 flex items-center justify-between border-t border-white/6 pt-3">
                                                        <p className="text-[10px] text-slate-500">Captured via QR Scan</p>
                                                        <button className="text-[11px] font-semibold text-[#2fc6ff]">
                                                            Details
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            <div className="rounded-[22px] border border-cyan-500/20 bg-[linear-gradient(180deg,rgba(8,90,94,0.95),rgba(10,73,89,0.95))] px-4 py-4 shadow-[0_16px_34px_rgba(8,90,94,0.22)]">
                <h4 className="text-sm font-semibold text-white">Improve your score?</h4>
                <p className="mt-1 max-w-[220px] text-[11px] text-cyan-50/70">
                    Enable location alerts to never miss a check-in reminder.
                </p>
                <div className="mt-4 flex justify-end">
                    <button className="rounded-xl bg-[#2fe4ff] px-4 py-2 text-[11px] font-semibold text-[#06222b]">
                        Enable
                    </button>
                </div>
            </div>
        </div>
    );

    const renderProfileTab = () => (
        <div className="space-y-4 animate-fade-in">
            <div className="rounded-[22px] border border-white/6 bg-[#141925] px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-white">Profile</h2>
                        <p className="mt-1 text-sm text-slate-400">Keep these details updated for attendance verification.</p>
                    </div>
                    {!isEditingProfile && (
                        <button
                            onClick={() => setIsEditingProfile(true)}
                            className="text-xs font-semibold text-[#33c3ff] cursor-pointer"
                        >
                            Edit
                        </button>
                    )}
                </div>
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
                        <div
                            key={item.label}
                            className="flex items-center gap-3 rounded-[20px] border border-white/6 bg-[#141925] px-4 py-4"
                        >
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
                <div className="rounded-[24px] border border-white/6 bg-[#141925] p-4 shadow-[0_12px_28px_rgba(0,0,0,0.2)]">
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
                                className="text-xs font-semibold text-slate-400 cursor-pointer"
                            >
                                Cancel
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleProfileUpdate} className="space-y-3">
                        <label className="block">
                            <span className="mb-1.5 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                                <UserIcon size={14} />
                                Full Name
                            </span>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full rounded-[16px] border border-white/8 bg-[#0f1420] px-4 py-3 text-sm text-white outline-none transition focus:border-[#33c3ff]"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-1.5 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                                <IdentificationCard size={14} />
                                Registration No.
                            </span>
                            <input
                                type="text"
                                value={regNo}
                                onChange={(e) => setRegNo(e.target.value)}
                                required
                                className="w-full rounded-[16px] border border-white/8 bg-[#0f1420] px-4 py-3 text-sm text-white outline-none transition focus:border-[#33c3ff]"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-1.5 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                                <Buildings size={14} />
                                Branch
                            </span>
                            <input
                                type="text"
                                value={branch}
                                onChange={(e) => setBranch(e.target.value)}
                                required
                                className="w-full rounded-[16px] border border-white/8 bg-[#0f1420] px-4 py-3 text-sm text-white outline-none transition focus:border-[#33c3ff]"
                            />
                        </label>

                        <div className="grid grid-cols-2 gap-3">
                            <label className="block">
                                <span className="mb-1.5 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                                    <BookBookmark size={14} />
                                    Semester
                                </span>
                                <input
                                    type="text"
                                    value={semester}
                                    onChange={(e) => setSemester(e.target.value)}
                                    required
                                    className="w-full rounded-[16px] border border-white/8 bg-[#0f1420] px-4 py-3 text-sm text-white outline-none transition focus:border-[#33c3ff]"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-1.5 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                                    <Phone size={14} />
                                    Mobile
                                </span>
                                <input
                                    type="text"
                                    value={mobileNo}
                                    onChange={(e) => setMobileNo(e.target.value)}
                                    required
                                    className="w-full rounded-[16px] border border-white/8 bg-[#0f1420] px-4 py-3 text-sm text-white outline-none transition focus:border-[#33c3ff]"
                                />
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="w-full rounded-[18px] bg-[#1daaf2] px-4 py-3 text-sm font-semibold text-[#04131f] shadow-[0_16px_36px_rgba(29,170,242,0.24)] cursor-pointer"
                        >
                            Save Profile
                        </button>
                    </form>
                </div>
            )}

            <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-[18px] border border-white/8 bg-[#171c27] px-4 py-3 text-sm font-semibold text-white cursor-pointer"
            >
                <SignOut size={18} />
                Logout
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(23,34,56,0.92),rgba(5,8,18,1)_55%)] text-slate-200">
            <main className="mx-auto min-h-screen w-full max-w-md px-4 pb-28 pt-5">
                <section className="mb-6">
                    <div className="flex items-center justify-between rounded-[22px] border border-white/6 bg-[#171b24]/96 px-3 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#121720]">
                            <Lightning size={20} weight="fill" />
                        </div>
                        <button
                            onClick={() => setActiveTab("profile")}
                            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/[0.04] hover:text-white cursor-pointer"
                        >
                            <GearSix size={18} weight="bold" />
                        </button>
                    </div>
                </section>

                {activeTab === "home" && (
                    <section className="mb-6">
                        <h1 className="text-[32px] font-semibold leading-none text-white">
                            Hi, {user?.name?.split(" ")[0] || "Student"}
                        </h1>
                        <p className="mt-2 text-sm text-slate-400">Let&apos;s get you marked for today&apos;s classes.</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                            <span className="rounded-full bg-white/5 px-2.5 py-1">{formatShortDate(new Date())}</span>
                            <span className="rounded-full bg-white/5 px-2.5 py-1">
                                {locationStatus === "in-range"
                                    ? "On campus"
                                    : locationStatus === "out-of-range"
                                      ? "Outside campus"
                                      : locationStatus === "error"
                                        ? "Location blocked"
                                        : "Checking location"}
                            </span>
                        </div>
                    </section>
                )}

                {activeTab === "home" && renderHomeTab()}
                {activeTab === "history" && renderHistoryTab()}
                {activeTab === "profile" && renderProfileTab()}
            </main>

            {showScanner && <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}

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
                        onClick={() => setShowScanner(true)}
                        className="flex flex-col items-center gap-1 text-[10px] font-medium text-slate-300"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#2fc6ff]/30 bg-[#101a2e] text-[#2fc6ff]">
                            <QrCode size={20} weight="bold" />
                        </div>
                        Scan
                    </button>

                    <button
                        onClick={() => setActiveTab("history")}
                        className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
                            activeTab === "history" ? "text-[#2fc6ff]" : "text-slate-500"
                        }`}
                    >
                        <ClockCounterClockwise size={22} weight={activeTab === "history" ? "fill" : "regular"} />
                        History
                    </button>

                    <button
                        onClick={() => setActiveTab("profile")}
                        className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
                            activeTab === "profile" ? "text-[#2fc6ff]" : "text-slate-500"
                        }`}
                    >
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
