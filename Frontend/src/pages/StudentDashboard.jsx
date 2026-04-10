import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import Navbar from "../components/Navbar";
import QRScanner from "../components/QRScanner";
import toast from "react-hot-toast";
import {
    QrCode,
    MapPin,
    CheckCircle,
    Clock,
    Warning,
    SpinnerGap,
    IdentificationCard,
    Buildings,
    User as UserIcon,
    Phone,
    BookBookmark,
    House,
    ClockCounterClockwise,
    MapPinLine,
    TrendUp,
    Target,
    Sparkle,
    BookOpen,
    DotsThreeVertical,
} from "@phosphor-icons/react";

const COLLEGE_LAT = 20.217426;
const COLLEGE_LNG = 85.682104;
const MAX_RADIUS = 50; // meters

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

const CircularProgress = ({ percentage }) => {
    const radius = 60;
    const stroke = 12;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const color = percentage >= 75 ? "#10b981" : percentage >= 50 ? "#f97316" : "#ef4444";

    return (
        <div className="relative flex items-center justify-center -ml-4">
            <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
                {/* Background Ring */}
                <circle
                    stroke="#ffffff"
                    fill="transparent"
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    className="opacity-10"
                />
                {/* Progress Ring */}
                <circle
                    stroke={color}
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={circumference + " " + circumference}
                    style={{ strokeDashoffset, transition: "stroke-dashoffset 0.5s ease-in-out" }}
                    strokeLinecap="round"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-white">{percentage}%</span>
                <span className="text-[8px] text-[#94a3b8] font-bold tracking-widest uppercase mt-0.5">Overall</span>
            </div>
        </div>
    );
};

export default function StudentDashboard() {
    const { user, updateProfile } = useAuth();
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

    const [showProfileForm, setShowProfileForm] = useState(false);
    const [name, setName] = useState(user?.name || "");
    const [regNo, setRegNo] = useState(user?.regNo || "");
    const [branch, setBranch] = useState(user?.branch || "");
    const [semester, setSemester] = useState(user?.semester || "");
    const [mobileNo, setMobileNo] = useState(user?.mobileNo || "");

    const isProfileComplete = user && user.regNo && user.branch && user.semester && user.mobileNo;
    const [isEditingProfile, setIsEditingProfile] = useState(!isProfileComplete);

    useEffect(() => {
        if (!isProfileComplete) {
            setIsEditingProfile(true);
            setActiveTab("profile");
        }
        fetchHistory();
        fetchStats();
        checkLocationOnLoad();
    }, [user, isProfileComplete]);

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

    // Derived subject-wise progress from history
    const subjectStats = history.reduce((acc, curr) => {
        const sub = curr.sessionId?.subject || "Unknown";
        if (!acc[sub]) acc[sub] = { present: 0, total: 0 };
        acc[sub].total += 1;
        if (curr.status === "present" || curr.status === "verified") {
            acc[sub].present += 1;
        }
        return acc;
    }, {});

    const subjectWiseData = Object.entries(subjectStats).map(([name, data]) => {
        const percentage = data.total > 0 ? Math.round((data.present / data.total) * 100) : 0;
        return { name, present: data.present, total: data.total, percentage };
    });

    const isGoodStanding = stats?.percentage >= 75;

    return (
        <div className="min-h-screen bg-[#0b1121] text-gray-200">
            <Navbar />

            <main className="max-w-lg mx-auto px-4 pt-20 pb-24">
                {/* ========== HOME TAB ========== */}
                {activeTab === "home" && (
                    <div className="animate-fade-in">
                        {/* Header Section */}
                        <div className="mb-6 mt-2">
                            <h1 className="text-2xl font-bold text-white mb-0.5">Student Dashboard</h1>
                            <p className="text-gray-400 text-sm">Welcome back, <span className="font-semibold text-gray-200">{user?.name || "Student"}</span>.</p>
                        </div>

                        {/* Overview Card */}
                        <div className="bg-[#1a2035] rounded-3xl p-6 mb-5 flex flex-col items-center shadow-lg border border-white/5 relative overflow-hidden">
                            {/* Subtle Glows */}
                            <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[150%] bg-blue-500/5 rounded-[100%] blur-[80px]" />

                            <div className="mb-4 relative z-10">
                                <CircularProgress percentage={stats?.percentage || 0} />
                            </div>

                            <h2 className="text-white text-xl font-bold mb-1.5 z-10">
                                {isGoodStanding ? "Good Standing!" : "Critical Action Required!"}
                            </h2>
                            <p className="text-[#94a3b8] text-sm mb-5 text-center z-10">
                                You've attended <span className="text-white font-semibold">{stats?.attendedSessions || 0}</span> out of <span className="text-white font-semibold">{stats?.totalSessions || 0}</span> evaluated sessions.
                            </p>

                            <div className="flex flex-wrap gap-3 mb-6 w-full justify-center z-10">
                                <div className="flex items-center gap-1.5 border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 rounded-full text-blue-400 text-xs font-semibold">
                                    <TrendUp size={14} weight="bold" /> Dynamic
                                </div>
                                <div className="flex items-center gap-1.5 border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 rounded-full text-orange-400 text-xs font-semibold">
                                    <Target size={14} weight="bold" /> Target: 75%
                                </div>
                            </div>

                            {!scannedSession ? (
                                <button
                                    onClick={() => setShowScanner(true)}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3.5 px-4 rounded-[14px] flex items-center justify-center gap-2 transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.5)] z-10"
                                >
                                    <Sparkle size={18} weight="fill" />
                                    Mark Today's Attendance
                                </button>
                            ) : (
                                <div className="w-full z-10">
                                    <div className="flex items-center justify-between bg-[#111827] rounded-xl p-3 mb-3 border border-white/5">
                                        <div>
                                            <p className="text-xs text-gray-400 font-medium">Session Detected</p>
                                            <p className="text-sm font-bold text-white">{scannedSession.subject}</p>
                                        </div>
                                        <MapPin size={20} className={distanceVal !== null && distanceVal <= MAX_RADIUS ? "text-emerald-500" : "text-orange-500"} />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setScannedSession(null)} className="flex-[0.4] bg-[#2a3449] hover:bg-[#323d54] text-white py-3 rounded-[14px] text-sm font-medium transition-colors duration-200">
                                            Cancel
                                        </button>
                                        <button onClick={handleMarkAttendance} disabled={marking || (distanceVal !== null && distanceVal > MAX_RADIUS)} className="flex-[0.6] bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-[14px] text-sm font-semibold flex items-center justify-center gap-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_0_rgba(16,185,129,0.39)]">
                                            {marking ? <SpinnerGap className="animate-spin" /> : <CheckCircle weight="bold" size={18} />} Mark Present
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-3 gap-3 mb-8">
                            <div className="bg-[#1a2035] rounded-2xl p-4 flex flex-col items-center justify-center border border-white/5 border-b-[3px] border-b-emerald-500/30">
                                <span className="text-xl font-bold text-emerald-400 mb-1">{stats?.attendedSessions || 0}</span>
                                <span className="text-[10px] text-emerald-500/80 font-semibold tracking-wider uppercase">Present</span>
                            </div>
                            <div className="bg-[#1a2035] rounded-2xl p-4 flex flex-col items-center justify-center border border-white/5 border-b-[3px] border-b-blue-500/30">
                                <span className="text-xl font-bold text-blue-400 mb-1">{stats?.totalSessions || 0}</span>
                                <span className="text-[10px] text-blue-500/80 font-semibold tracking-wider uppercase">Total</span>
                            </div>
                            <div className="bg-[#1a2035] rounded-2xl p-4 flex flex-col items-center justify-center border border-white/5 border-b-[3px] border-b-red-500/30">
                                <span className="text-xl font-bold text-red-500 mb-1">{(stats?.totalSessions || 0) - (stats?.attendedSessions || 0)}</span>
                                <span className="text-[10px] text-red-500/80 font-semibold tracking-wider uppercase">Absent</span>
                            </div>
                        </div>

                        {/* Subject Wise Progress Section */}
                        <div>
                            <div className="flex items-center justify-between mb-4 px-1">
                                <div className="flex items-center gap-2">
                                    <BookOpen size={18} className="text-blue-400" weight="duotone" />
                                    <h3 className="text-white font-semibold text-sm">Subject Wise Progress</h3>
                                </div>
                                <button
                                    onClick={() => setActiveTab("history")}
                                    className="text-gray-400 hover:text-blue-400 text-xs font-semibold cursor-pointer transition-colors duration-200"
                                >
                                    View Log &rarr;
                                </button>
                            </div>

                            {subjectWiseData.length === 0 ? (
                                <div className="text-center py-8 bg-[#1a2035] rounded-2xl border border-white/5">
                                    <p className="text-gray-400 text-sm">No subject data available yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {subjectWiseData.map((sub, idx) => {
                                        const isDanger = sub.percentage < 75;
                                        const barColor = isDanger ? "bg-red-500" : "bg-blue-500";
                                        const textColor = isDanger ? "text-red-500" : "text-blue-500";
                                        const iconColorClass = isDanger ? "text-red-400" : "text-blue-400";
                                        const iconBgClass = isDanger ? "bg-red-500/10" : "bg-blue-500/10";

                                        return (
                                            <div key={idx} className="bg-[#1a2035] rounded-2xl p-5 border border-white/5 relative hover:border-white/10 transition-colors duration-300">
                                                <button className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors duration-200">
                                                    <DotsThreeVertical size={20} weight="bold" />
                                                </button>

                                                <div className="flex items-start gap-4 mb-5">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${iconBgClass}`}>
                                                        <BookBookmark size={20} className={iconColorClass} weight="fill" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-white font-bold text-sm tracking-wide leading-tight">{sub.name}</h4>
                                                        <p className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mt-1">
                                                            {sub.present}/{sub.total} SESSIONS
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-end mb-1.5">
                                                    <span className="text-[#94a3b8] text-xs font-medium">Attendance</span>
                                                    <span className={`text-lg font-extrabold ${textColor}`}>{sub.percentage}%</span>
                                                </div>

                                                <div className="w-full bg-[#0b1121] h-1.5 rounded-full overflow-hidden relative mb-2 shadow-inner">
                                                    <div className={`h-full ${barColor} rounded-full transition-all duration-700 ease-out`} style={{ width: `${sub.percentage}%` }} />
                                                </div>

                                                <div className="flex justify-between items-center text-[9px] text-[#64748b] font-semibold uppercase tracking-wider">
                                                    <span>0%</span>
                                                    <span>75% threshold</span>
                                                    <span>100%</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ========== PROFILE TAB ========== */}
                {activeTab === "profile" && (
                    <div className="bg-[#1a2035] border border-white/5 rounded-3xl p-6 mb-6 shadow-xl relative overflow-hidden animate-fade-in">
                        <div className="absolute top-[-30%] right-[-10%] w-[50%] h-[100%] bg-blue-500/5 rounded-full blur-[60px]" />

                        {!isEditingProfile ? (
                            <div className="relative z-10">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-white text-lg font-bold flex items-center gap-2">
                                        <UserIcon size={22} className="text-blue-400" weight="duotone" />
                                        My Profile
                                    </h3>
                                    <button
                                        onClick={() => setIsEditingProfile(true)}
                                        className="text-blue-400 text-sm font-semibold hover:text-blue-300 transition-colors duration-200"
                                    >
                                        Edit
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between border-b border-white/5 pb-3">
                                        <span className="text-gray-400 text-sm font-medium">Full Name</span>
                                        <span className="text-white text-sm font-bold">{user?.name}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/5 pb-3">
                                        <span className="text-gray-400 text-sm font-medium">Reg. No</span>
                                        <span className="text-white text-sm font-bold">{user?.regNo}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/5 pb-3">
                                        <span className="text-gray-400 text-sm font-medium">Branch</span>
                                        <span className="text-white text-sm font-bold">{user?.branch}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/5 pb-3">
                                        <span className="text-gray-400 text-sm font-medium">Semester</span>
                                        <span className="text-white text-sm font-bold">{user?.semester}</span>
                                    </div>
                                    <div className="flex justify-between pb-1">
                                        <span className="text-gray-400 text-sm font-medium">Mobile No.</span>
                                        <span className="text-white text-sm font-bold">{user?.mobileNo}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-2">
                                        <Warning size={20} className="text-orange-400" weight="fill" />
                                        <h3 className="text-orange-400 font-bold text-sm">
                                            {isProfileComplete ? "Edit Profile" : "Complete Your Profile"}
                                        </h3>
                                    </div>
                                    {isProfileComplete && (
                                        <button
                                            onClick={() => {
                                                setIsEditingProfile(false);
                                                setName(user.name || "");
                                                setRegNo(user.regNo || "");
                                                setBranch(user.branch || "");
                                                setSemester(user.semester || "");
                                                setMobileNo(user.mobileNo || "");
                                            }}
                                            className="text-gray-400 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                                <form onSubmit={handleProfileUpdate} className="space-y-4">
                                    <div>
                                        <label className="text-gray-400 text-xs font-medium mb-1.5 flex items-center gap-1">
                                            <UserIcon size={14} /> Full Name
                                        </label>
                                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your full name"
                                            className="w-full bg-[#0b1121] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500 transition-colors" />
                                    </div>
                                    <div>
                                        <label className="text-gray-400 text-xs font-medium mb-1.5 flex items-center gap-1">
                                            <IdentificationCard size={14} /> Registration No.
                                        </label>
                                        <input type="text" value={regNo} onChange={(e) => setRegNo(e.target.value)} required placeholder="e.g., 21CS001"
                                            className="w-full bg-[#0b1121] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500 transition-colors" />
                                    </div>
                                    <div>
                                        <label className="text-gray-400 text-xs font-medium mb-1.5 flex items-center gap-1">
                                            <Buildings size={14} /> Branch
                                        </label>
                                        <input type="text" value={branch} onChange={(e) => setBranch(e.target.value)} required placeholder="e.g., Computer Science"
                                            className="w-full bg-[#0b1121] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500 transition-colors" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-gray-400 text-xs font-medium mb-1.5 flex items-center gap-1">
                                                <BookBookmark size={14} /> Semester
                                            </label>
                                            <input type="text" value={semester} onChange={(e) => setSemester(e.target.value)} required placeholder="e.g., 6th"
                                                className="w-full bg-[#0b1121] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500 transition-colors" />
                                        </div>
                                        <div>
                                            <label className="text-gray-400 text-xs font-medium mb-1.5 flex items-center gap-1">
                                                <Phone size={14} /> Mobile No.
                                            </label>
                                            <input type="text" value={mobileNo} onChange={(e) => setMobileNo(e.target.value)} required placeholder="Your number"
                                                className="w-full bg-[#0b1121] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500 transition-colors" />
                                        </div>
                                    </div>
                                    <button type="submit"
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] mt-2">
                                        Save Profile
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                )}

                {/* QR Scanner Modal */}
                {showScanner && (
                    <QRScanner
                        onScan={handleScan}
                        onClose={() => setShowScanner(false)}
                    />
                )}

                {/* ========== HISTORY TAB ========== */}
                {activeTab === "history" && (
                    <div className="animate-fade-in">
                        <h2 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
                            <Clock size={20} className="text-blue-400" />
                            Recent Attendance
                        </h2>

                        {loadingHistory ? (
                            <div className="text-center py-12">
                                <SpinnerGap size={28} className="animate-spin text-blue-500 mx-auto mb-3" />
                                <p className="text-sm text-gray-400">Loading history...</p>
                            </div>
                        ) : history.length === 0 ? (
                            <div className="text-center py-12 bg-[#1a2035] rounded-3xl border border-white/5">
                                <Clock size={40} className="text-gray-600 mx-auto mb-3" weight="duotone" />
                                <p className="text-gray-400 text-sm font-medium">No attendance records yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {history.map((record) => {
                                    const isPresent = record.status === "present" || record.status === "verified";
                                    return (
                                        <div key={record._id}
                                            className="bg-[#1a2035] border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:border-white/10 transition-colors">
                                            <div>
                                                <p className="text-white text-sm font-bold tracking-wide">
                                                    {record.sessionId?.subject || "Unknown Subject"}
                                                </p>
                                                <p className="text-gray-400 text-[11px] font-medium mt-1">
                                                    {new Date(record.timestamp).toLocaleDateString("en-IN", {
                                                        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                                                    })}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5">
                                                <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-sm ${isPresent
                                                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                                                        : "bg-red-500/15 text-red-500 border border-red-500/20"
                                                    }`}>
                                                    {isPresent ? "Present" : "Absent"}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-[#0b1121]/90 backdrop-blur-xl border-t border-white/5 pt-3 px-6 pb-5 z-50">
                <div className="max-w-lg mx-auto flex justify-around items-center">
                    <button onClick={() => setActiveTab("home")}
                        className={`flex flex-col items-center gap-1.5 transition-colors duration-200 ${activeTab === "home" ? "text-blue-500" : "text-gray-500 hover:text-gray-300"} cursor-pointer`}>
                        <House size={24} weight={activeTab === "home" ? "fill" : "regular"} />
                        <span className="text-[10px] font-bold tracking-wider uppercase">Home</span>
                    </button>
                    <button onClick={() => setActiveTab("history")}
                        className={`flex flex-col items-center gap-1.5 transition-colors duration-200 ${activeTab === "history" ? "text-blue-500" : "text-gray-500 hover:text-gray-300"} cursor-pointer`}>
                        <ClockCounterClockwise size={24} weight={activeTab === "history" ? "fill" : "regular"} />
                        <span className="text-[10px] font-bold tracking-wider uppercase">Log</span>
                    </button>
                    <button onClick={() => setActiveTab("profile")}
                        className={`flex flex-col items-center gap-1.5 transition-colors duration-200 ${activeTab === "profile" ? "text-blue-500" : "text-gray-500 hover:text-gray-300"} cursor-pointer`}>
                        <UserIcon size={24} weight={activeTab === "profile" ? "fill" : "regular"} />
                        <span className="text-[10px] font-bold tracking-wider uppercase">Me</span>
                    </button>
                </div>
            </div>

            <style jsx="true">{`
                .animate-fade-in {
                    animation: fadeIn 0.4s ease-out forwards;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
