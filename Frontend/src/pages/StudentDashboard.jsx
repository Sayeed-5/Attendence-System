import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import {
    BookBookmark,
    Buildings,
    CheckCircle,
    ClockCounterClockwise,
    GearSix,
    House,
    IdentificationCard,
    Lightning,
    MapPin,
    Phone,
    SignOut,
    SpinnerGap,
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

function formatTime(value) {
    if (!value) return "--:--";
    return new Date(value).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getTeacherName(session) {
    return session?.teacherName || session?.teacherId?.name || "Teacher unavailable";
}

function getDeviceId() {
    return `${navigator.userAgent.slice(0, 40)}_${window.screen.width}x${window.screen.height}`;
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

    const isWithinRadius = useMemo(() => {
        if (typeof activeSession?.isWithinRadius === "boolean") return activeSession.isWithinRadius;
        if (!location || !activeSession?.location) return null;
        return getDistance(location.lat, location.lng, activeSession.location.lat, activeSession.location.lng) <= (activeSession.radius || 100);
    }, [activeSession, location]);

    const canMarkAttendance = Boolean(activeSession) && !activeSession?.alreadyMarked && isWithinRadius === true && !marking;

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
                setDistanceVal(
                    getDistance(currentLocation.lat, currentLocation.lng, res.data.location.lat, res.data.location.lng)
                );
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

    function renderHomeTab() {
        return (
            <div className="space-y-5 animate-fade-in">
                <section className="lg:flex lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-[32px] font-semibold leading-none text-white lg:text-[42px]">
                            Hi, {user?.name?.split(" ")[0] || "Student"}
                        </h1>
                        <p className="mt-2 text-sm text-slate-400 lg:text-base">
                            Your teacher&apos;s active session appears here automatically.
                        </p>
                    </div>
                    <div className="mt-4 hidden gap-3 lg:grid lg:grid-cols-3">
                        <div className="rounded-[18px] border border-white/6 bg-[#141925] px-4 py-3">
                            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Attendance</p>
                            <p className="mt-2 text-2xl font-semibold text-white">{attendancePercentage}%</p>
                        </div>
                        <div className="rounded-[18px] border border-white/6 bg-[#141925] px-4 py-3">
                            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Attended</p>
                            <p className="mt-2 text-2xl font-semibold text-white">{attendedSessions}</p>
                        </div>
                        <div className="rounded-[18px] border border-white/6 bg-[#141925] px-4 py-3">
                            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Missed</p>
                            <p className="mt-2 text-2xl font-semibold text-white">{absentSessions}</p>
                        </div>
                    </div>
                </section>

                {loadingSession ? (
                    <div className="flex justify-center rounded-[26px] border border-white/6 bg-[#171b24] p-10">
                        <SpinnerGap size={24} className="animate-spin text-[#33c3ff]" />
                    </div>
                ) : activeSession ? (
                    <section className="rounded-[26px] border border-emerald-400/20 bg-[linear-gradient(180deg,rgba(10,33,40,0.98),rgba(9,18,30,0.98))] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-300">
                                <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(74,222,128,0.8)]" />
                                Active Session
                            </span>
                            <span
                                className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                                    isWithinRadius
                                        ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                                        : isWithinRadius === false
                                          ? "border-rose-400/20 bg-rose-500/10 text-rose-300"
                                          : "border-white/10 bg-white/5 text-slate-300"
                                }`}
                            >
                                {isWithinRadius ? "Verified" : isWithinRadius === false ? "Out of range" : locationStatus === "error" ? "Location blocked" : "Checking"}
                            </span>
                        </div>

                        <h2 className="mt-5 text-[24px] font-semibold text-white">{activeSession.subject}</h2>
                        <p className="mt-1 text-sm text-slate-300">{activeSession.teacherName}</p>

                        <div className="mt-5 grid gap-3 md:grid-cols-3">
                            <div className="rounded-2xl border border-white/6 bg-[#111722] p-4">
                                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Teacher</p>
                                <p className="mt-2 text-sm font-semibold text-white">{getTeacherName(activeSession)}</p>
                            </div>
                            <div className="rounded-2xl border border-white/6 bg-[#111722] p-4">
                                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Time Window</p>
                                <p className="mt-2 text-sm font-semibold text-white">
                                    {formatTime(activeSession.startTime)} - {formatTime(activeSession.endTime)}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-white/6 bg-[#111722] p-4">
                                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Students Marked</p>
                                <p className="mt-2 text-sm font-semibold text-white">{activeSession.totalMarked || 0}</p>
                            </div>
                        </div>

                        <div className="mt-5 rounded-2xl border border-white/6 bg-[#111722] p-4 text-sm text-slate-300">
                            <div className="flex items-start gap-3">
                                <MapPin size={18} className={isWithinRadius ? "text-emerald-300" : "text-amber-300"} />
                                <div>
                                    <p className="font-semibold text-white">
                                        {activeSession.alreadyMarked
                                            ? "Attendance already marked for this session"
                                            : isWithinRadius
                                              ? "Location verified"
                                              : isWithinRadius === false
                                                ? "You are outside the allowed radius"
                                                : "Enable location to verify attendance"}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400">
                                        Radius: {activeSession.radius || 100}m
                                        {typeof distanceVal === "number" ? ` - Distance: ${Math.round(distanceVal)}m` : ""}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                            <button
                                onClick={handleMarkAttendance}
                                disabled={!canMarkAttendance}
                                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#29d8ff] px-5 py-3 text-sm font-semibold text-[#04131f] shadow-[0_16px_34px_rgba(41,216,255,0.22)] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {marking ? <SpinnerGap size={18} className="animate-spin" /> : <CheckCircle size={18} weight="fill" />}
                                {activeSession.alreadyMarked ? "Attendance Marked" : "Mark Attendance"}
                            </button>
                            <button
                                onClick={() => refreshLocationAndSession(true)}
                                className="rounded-2xl border border-white/8 bg-[#101622] px-5 py-3 text-sm font-semibold text-white"
                            >
                                Refresh Location
                            </button>
                        </div>
                    </section>
                ) : (
                    <section className="rounded-[26px] border border-dashed border-cyan-400/20 bg-[#171b24] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200/80">No Active Session</p>
                                <h2 className="mt-2 text-2xl font-semibold text-white">Nothing is live right now</h2>
                                <p className="mt-2 text-sm text-slate-400">
                                    When a teacher starts a session, it will appear here automatically.
                                </p>
                            </div>
                            <button
                                onClick={() => refreshLocationAndSession(true)}
                                className="rounded-2xl border border-white/8 bg-[#101622] px-4 py-3 text-sm font-semibold text-white"
                            >
                                Refresh
                            </button>
                        </div>
                        <div className="mt-6 space-y-3">
                            <p className="text-sm font-semibold text-white">Past 5 sessions</p>
                            {recentSessions.length === 0 ? (
                                <div className="rounded-2xl border border-white/6 bg-[#111722] px-4 py-5 text-sm text-slate-400">
                                    No recent sessions yet.
                                </div>
                            ) : (
                                recentSessions.map((record) => (
                                    <div key={record._id} className="rounded-2xl border border-white/6 bg-[#111722] px-4 py-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-white">{record.sessionId?.subject || "Unknown subject"}</p>
                                                <p className="mt-1 text-xs text-slate-400">{getTeacherName(record.sessionId)}</p>
                                                <p className="mt-2 text-xs text-slate-500">{formatDateTime(record.timestamp || record.sessionId?.startTime)}</p>
                                            </div>
                                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                                                {record.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                )}
            </div>
        );
    }

    function renderHistoryTab() {
        return (
            <div className="space-y-4 animate-fade-in">
                <div className="rounded-[24px] border border-white/6 bg-[#171b24] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
                    <h2 className="text-lg font-semibold text-white">Recent attendance history</h2>
                    <p className="mt-1 text-sm text-slate-400">Review your latest marked and missed sessions.</p>
                </div>

                {loadingHistory ? (
                    <div className="flex justify-center py-10">
                        <SpinnerGap size={24} className="animate-spin text-[#33c3ff]" />
                    </div>
                ) : history.length === 0 ? (
                    <div className="rounded-[24px] border border-white/6 bg-[#171b24] px-4 py-10 text-center text-sm text-slate-400">
                        No attendance records available yet.
                    </div>
                ) : (
                    history.map((record) => (
                        <div key={record._id} className="rounded-[24px] border border-white/6 bg-[#171b24] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <p className="text-lg font-semibold text-white">{record.sessionId?.subject || "Unknown subject"}</p>
                                    <p className="mt-1 text-sm text-slate-400">{getTeacherName(record.sessionId)}</p>
                                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                                        <span>{formatDateTime(record.timestamp || record.sessionId?.startTime)}</span>
                                        <span>
                                            {formatTime(record.sessionId?.startTime)} - {formatTime(record.sessionId?.endTime)}
                                        </span>
                                    </div>
                                </div>
                                <span className="w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                                    {record.status}
                                </span>
                            </div>
                        </div>
                    ))
                )}
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

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(23,34,56,0.92),rgba(5,8,18,1)_55%)] text-slate-200">
            <main className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10">
                <section className="mb-6">
                    <div className="flex items-center justify-between rounded-[22px] border border-white/6 bg-[#171b24]/96 px-3 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.2)] lg:px-5 lg:py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#121720]">
                                <Lightning size={20} weight="fill" />
                            </div>
                            <div className="hidden lg:block">
                                <p className="text-sm font-semibold text-white">Student Dashboard</p>
                                <p className="mt-1 text-xs text-slate-500">Track live attendance, history, and profile in one place.</p>
                            </div>
                        </div>
                        <div className="hidden lg:flex items-center gap-2 rounded-2xl border border-white/6 bg-[#121722] p-1">
                            <button onClick={() => setActiveTab("home")} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${activeTab === "home" ? "bg-[#29d8ff] text-[#04131f]" : "text-slate-400 hover:text-white"}`}>Home</button>
                            <button onClick={() => setActiveTab("history")} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${activeTab === "history" ? "bg-[#29d8ff] text-[#04131f]" : "text-slate-400 hover:text-white"}`}>History</button>
                            <button onClick={() => setActiveTab("profile")} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${activeTab === "profile" ? "bg-[#29d8ff] text-[#04131f]" : "text-slate-400 hover:text-white"}`}>Profile</button>
                        </div>
                        <button onClick={() => setActiveTab("profile")} className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/[0.04] hover:text-white lg:hidden">
                            <GearSix size={18} weight="bold" />
                        </button>
                    </div>
                </section>

                {activeTab === "home" && renderHomeTab()}
                {activeTab === "history" && renderHistoryTab()}
                {activeTab === "profile" && renderProfileTab()}
            </main>

            <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-5 lg:hidden">
                <div className="mx-auto flex w-full max-w-md items-center justify-between rounded-[24px] border border-white/6 bg-[#0e1320]/94 px-5 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                    <button onClick={() => setActiveTab("home")} className={`flex flex-col items-center gap-1 text-[10px] font-medium ${activeTab === "home" ? "text-[#2fc6ff]" : "text-slate-500"}`}>
                        <House size={22} weight={activeTab === "home" ? "fill" : "regular"} />
                        Home
                    </button>
                    <button onClick={() => setActiveTab("history")} className={`flex flex-col items-center gap-1 text-[10px] font-medium ${activeTab === "history" ? "text-[#2fc6ff]" : "text-slate-500"}`}>
                        <ClockCounterClockwise size={22} weight={activeTab === "history" ? "fill" : "regular"} />
                        History
                    </button>
                    <button onClick={() => refreshLocationAndSession(true)} className="flex flex-col items-center gap-1 text-[10px] font-medium text-slate-300">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#2fc6ff]/30 bg-[#101a2e] text-[#2fc6ff]">
                            <MapPin size={20} weight="bold" />
                        </div>
                        Refresh
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
