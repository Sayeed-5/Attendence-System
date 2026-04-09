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
    Calendar,
    BookBookmark,
    House,
    ChartBar,
    ClockCounterClockwise,
    Fire,
    Lightning,
    ShieldCheck,
    Globe,
    MapPinLine,
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
    const [locationStatus, setLocationStatus] = useState("checking"); // checking, in-range, out-of-range, error

    // Profile completion form
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

    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
    });
    const formattedTime = now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });

    return (
        <div className="min-h-screen bg-[#060b18]">
            <Navbar />

            <main className="max-w-lg mx-auto px-4 sm:px-6 pt-20 pb-24">

                {/* ========== HOME TAB ========== */}
                {activeTab === "home" && (
                    <>
                        {/* Daily Check-in Badge */}
                        <div className="mb-4">
                            <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-[#eab308]/15 text-[#eab308] border border-[#eab308]/20">
                                Daily check-in
                            </span>
                        </div>

                        {/* Hero Heading */}
                        <div className="mb-5">
                            <h1 className="text-2xl font-bold text-[#e2e8f0] leading-tight">
                                Mark attendance in one step
                            </h1>
                            <p className="text-[#64748b] text-sm mt-1.5">
                                Verify your location and record today's attendance with a single action.
                            </p>
                        </div>

                        {/* Live Status Badge */}
                        <div className="mb-5">
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-[#0f1629] border border-[#1a2744] text-[#e2e8f0]">
                                {stats?.activeSessionCount > 0 ? (
                                    <>
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                                        Live — {stats.activeSessionCount} active session{stats.activeSessionCount > 1 ? "s" : ""}
                                    </>
                                ) : (
                                    <>
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#64748b]" />
                                        No active sessions
                                    </>
                                )}
                            </span>
                        </div>

                        {/* Location Check Card */}
                        <div className="bg-[#0f1629] border border-[#1a2744] rounded-2xl p-4 mb-4 shadow-lg shadow-black/5">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${locationStatus === "in-range"
                                    ? "bg-[#10b981]/15 text-[#10b981]"
                                    : locationStatus === "out-of-range"
                                        ? "bg-[#eab308]/15 text-[#eab308]"
                                        : "bg-[#14b8a6]/15 text-[#14b8a6]"
                                    }`}>
                                    <MapPinLine size={22} weight="duotone" />
                                </div>
                                <div>
                                    <h3 className="text-[#e2e8f0] font-semibold text-sm">Location check</h3>
                                    <p className="text-[#64748b] text-xs mt-0.5">
                                        {locationStatus === "checking" && "Checking your location..."}
                                        {locationStatus === "in-range" && "You are on campus. Ready to check in!"}
                                        {locationStatus === "out-of-range" && "You are off campus. Move closer to check in."}
                                        {locationStatus === "error" && "Enable location access to check in."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Mark Window Card (if scanned session exists) */}
                        {scannedSession && (
                            <div className="bg-[#0f1629] border border-[#1a2744] rounded-2xl p-5 mb-4 shadow-lg shadow-black/5">
                                <p className="text-[#64748b] text-[10px] font-semibold tracking-[0.15em] uppercase mb-2">
                                    MARK WINDOW
                                </p>
                                <p className="text-[#e2e8f0] text-2xl font-bold">
                                    {new Date(scannedSession.startTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })}
                                    {" "}-{" "}
                                    {scannedSession.endTime
                                        ? new Date(scannedSession.endTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })
                                        : "Open"
                                    }
                                </p>
                                <p className="text-[#e2e8f0] text-sm mt-1">{scannedSession.subject}</p>
                                <p className="text-[#64748b] text-[10px] font-medium tracking-[0.1em] uppercase mt-1">
                                    TIMEZONE: ASIA/KOLKATA
                                </p>

                                {/* Status */}
                                <div className="flex items-center gap-2 mt-3">
                                    <MapPin size={14} className={distanceVal !== null && distanceVal <= MAX_RADIUS ? "text-[#10b981]" : "text-[#eab308]"} />
                                    <span className={`text-xs font-medium ${distanceVal !== null && distanceVal <= MAX_RADIUS
                                        ? "text-[#10b981]"
                                        : "text-[#eab308]"
                                        }`}>
                                        {distanceVal !== null && distanceVal <= MAX_RADIUS
                                            ? "Location verified"
                                            : distanceVal !== null
                                                ? `${Math.round(distanceVal)}m away — move closer`
                                                : "Checking location..."
                                        }
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Mark Attendance Button */}
                        {!scannedSession ? (
                            <button
                                onClick={() => setShowScanner(true)}
                                className="w-full flex items-center justify-center gap-3 bg-[#0f1629] border border-[#1a2744] hover:border-[#14b8a6]/40 text-[#e2e8f0] font-semibold py-4 px-6 rounded-2xl transition-all duration-200 hover:shadow-lg hover:shadow-teal-500/5 active:scale-[0.98] mb-4 cursor-pointer"
                            >
                                <QrCode size={22} weight="duotone" className="text-[#14b8a6]" />
                                <span>Mark Attendance</span>
                            </button>
                        ) : (
                            <div className="flex gap-3 mb-4">
                                <button
                                    onClick={() => {
                                        setScannedSession(null);
                                        setLocation(null);
                                        setDistanceVal(null);
                                    }}
                                    className="flex-1 bg-[#060b18] border border-[#1a2744] hover:bg-[#1a2744] text-[#e2e8f0] py-3 rounded-xl transition-colors duration-200 text-sm font-medium cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleMarkAttendance}
                                    disabled={marking || !scannedSession.isActive || (distanceVal !== null && distanceVal > MAX_RADIUS)}
                                    className="flex-1 bg-[#14b8a6] hover:bg-[#14b8a6]/90 text-white py-3 rounded-xl transition-colors duration-200 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {marking ? (
                                        <SpinnerGap size={18} className="animate-spin" />
                                    ) : (
                                        <CheckCircle size={18} />
                                    )}
                                    {marking ? "Marking..." : "Confirm Attendance"}
                                </button>
                            </div>
                        )}

                        {/* Mode Card */}
                        <div className="bg-[#0f1629] border border-[#1a2744] rounded-2xl p-4 mb-5 shadow-lg shadow-black/5">
                            <p className="text-[#64748b] text-[10px] font-semibold tracking-[0.15em] uppercase mb-1">MODE</p>
                            <div className="flex items-center gap-2">
                                <ShieldCheck size={18} className="text-[#14b8a6]" weight="fill" />
                                <span className="text-[#e2e8f0] font-semibold text-sm">Geo-verified</span>
                            </div>
                        </div>

                        {/* Stats Row — Streak + Attendance + Classes */}
                        {stats && (
                            <div className="grid grid-cols-3 gap-3 mb-5">
                                <div className="bg-[#0f1629] border border-[#1a2744] rounded-2xl p-4 text-center shadow-lg shadow-black/5">
                                    <div className="flex items-center justify-center gap-1 mb-2">
                                        <Fire size={16} className="text-orange-400" weight="fill" />
                                    </div>
                                    <p className="text-2xl font-bold text-[#e2e8f0]">{stats.streak}</p>
                                    <p className="text-[#64748b] text-[10px] font-medium tracking-wider uppercase mt-1">Streak</p>
                                </div>
                                <div className="bg-[#0f1629] border border-[#1a2744] rounded-2xl p-4 text-center shadow-lg shadow-black/5">
                                    <div className="flex items-center justify-center gap-1 mb-2">
                                        <ChartBar size={16} className="text-[#14b8a6]" />
                                    </div>
                                    <p className="text-2xl font-bold text-[#e2e8f0]">{stats.percentage}%</p>
                                    <p className="text-[#64748b] text-[10px] font-medium tracking-wider uppercase mt-1">Rate</p>
                                </div>
                                <div className="bg-[#0f1629] border border-[#1a2744] rounded-2xl p-4 text-center shadow-lg shadow-black/5">
                                    <div className="flex items-center justify-center gap-1 mb-2">
                                        <CheckCircle size={16} className="text-[#10b981]" />
                                    </div>
                                    <p className="text-2xl font-bold text-[#e2e8f0]">{stats.attendedSessions}<span className="text-sm text-[#64748b] font-normal">/{stats.totalSessions}</span></p>
                                    <p className="text-[#64748b] text-[10px] font-medium tracking-wider uppercase mt-1">Classes</p>
                                </div>
                            </div>
                        )}

                        {/* Today Status */}
                        {stats && (
                            <div className={`rounded-2xl p-4 mb-4 border ${stats.checkedInToday
                                ? "bg-[#10b981]/8 border-[#10b981]/20"
                                : "bg-[#eab308]/8 border-[#eab308]/20"
                                }`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-2.5 h-2.5 rounded-full ${stats.checkedInToday ? "bg-[#10b981]" : "bg-[#eab308] animate-pulse"}`} />
                                    <span className={`text-sm font-medium ${stats.checkedInToday ? "text-[#10b981]" : "text-[#eab308]"}`}>
                                        {stats.checkedInToday ? "Checked in today ✓" : "Not checked in yet"}
                                    </span>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ========== PROFILE TAB ========== */}
                {activeTab === "profile" && (
                    <div className="bg-[#0f1629] border border-[#1a2744] rounded-2xl p-5 mb-6 shadow-lg shadow-black/5">
                        {!isEditingProfile ? (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-[#e2e8f0] font-semibold flex items-center gap-2">
                                        <UserIcon size={20} className="text-[#14b8a6]" />
                                        My Profile
                                    </h3>
                                    <button
                                        onClick={() => setIsEditingProfile(true)}
                                        className="text-[#14b8a6] text-xs hover:text-[#14b8a6]/80 flex items-center gap-1 cursor-pointer transition-colors duration-200"
                                    >
                                        Edit
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between border-b border-[#1a2744]/50 pb-2">
                                        <span className="text-[#64748b] text-sm">Full Name</span>
                                        <span className="text-[#e2e8f0] text-sm font-medium">{user?.name}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-[#1a2744]/50 pb-2">
                                        <span className="text-[#64748b] text-sm">Reg. No</span>
                                        <span className="text-[#e2e8f0] text-sm font-medium">{user?.regNo}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-[#1a2744]/50 pb-2">
                                        <span className="text-[#64748b] text-sm">Branch</span>
                                        <span className="text-[#e2e8f0] text-sm font-medium">{user?.branch}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-[#1a2744]/50 pb-2">
                                        <span className="text-[#64748b] text-sm">Semester</span>
                                        <span className="text-[#e2e8f0] text-sm font-medium">{user?.semester}</span>
                                    </div>
                                    <div className="flex justify-between pb-1">
                                        <span className="text-[#64748b] text-sm">Mobile No.</span>
                                        <span className="text-[#e2e8f0] text-sm font-medium">{user?.mobileNo}</span>
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
                                                setName(user.name || "");
                                                setRegNo(user.regNo || "");
                                                setBranch(user.branch || "");
                                                setSemester(user.semester || "");
                                                setMobileNo(user.mobileNo || "");
                                            }}
                                            className="text-[#64748b] hover:text-[#e2e8f0] text-xs cursor-pointer transition-colors duration-200"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                                <form onSubmit={handleProfileUpdate} className="space-y-3">
                                    <div>
                                        <label className="text-[#64748b] text-xs mb-1.5 flex items-center gap-1">
                                            <UserIcon size={14} /> Full Name
                                        </label>
                                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your full name"
                                            className="w-full bg-[#060b18] border border-[#1a2744] rounded-xl px-4 py-2.5 text-[#e2e8f0] text-sm placeholder:text-[#64748b]/50 focus:outline-none focus:border-[#14b8a6] transition-colors duration-200" />
                                    </div>
                                    <div>
                                        <label className="text-[#64748b] text-xs mb-1.5 flex items-center gap-1">
                                            <IdentificationCard size={14} /> Registration No.
                                        </label>
                                        <input type="text" value={regNo} onChange={(e) => setRegNo(e.target.value)} required placeholder="e.g., 21CS001"
                                            className="w-full bg-[#060b18] border border-[#1a2744] rounded-xl px-4 py-2.5 text-[#e2e8f0] text-sm placeholder:text-[#64748b]/50 focus:outline-none focus:border-[#14b8a6] transition-colors duration-200" />
                                    </div>
                                    <div>
                                        <label className="text-[#64748b] text-xs mb-1.5 flex items-center gap-1">
                                            <Buildings size={14} /> Branch
                                        </label>
                                        <input type="text" value={branch} onChange={(e) => setBranch(e.target.value)} required placeholder="e.g., Computer Science"
                                            className="w-full bg-[#060b18] border border-[#1a2744] rounded-xl px-4 py-2.5 text-[#e2e8f0] text-sm placeholder:text-[#64748b]/50 focus:outline-none focus:border-[#14b8a6] transition-colors duration-200" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[#64748b] text-xs mb-1.5 flex items-center gap-1">
                                                <BookBookmark size={14} /> Semester
                                            </label>
                                            <input type="text" value={semester} onChange={(e) => setSemester(e.target.value)} required placeholder="e.g., 6th"
                                                className="w-full bg-[#060b18] border border-[#1a2744] rounded-xl px-4 py-2.5 text-[#e2e8f0] text-sm placeholder:text-[#64748b]/50 focus:outline-none focus:border-[#14b8a6] transition-colors duration-200" />
                                        </div>
                                        <div>
                                            <label className="text-[#64748b] text-xs mb-1.5 flex items-center gap-1">
                                                <Phone size={14} /> Mobile No.
                                            </label>
                                            <input type="text" value={mobileNo} onChange={(e) => setMobileNo(e.target.value)} required placeholder="Your number"
                                                className="w-full bg-[#060b18] border border-[#1a2744] rounded-xl px-4 py-2.5 text-[#e2e8f0] text-sm placeholder:text-[#64748b]/50 focus:outline-none focus:border-[#14b8a6] transition-colors duration-200" />
                                        </div>
                                    </div>
                                    <button type="submit"
                                        className="w-full bg-[#14b8a6] hover:bg-[#14b8a6]/90 text-white font-semibold py-2.5 rounded-xl transition-colors duration-200 text-sm cursor-pointer">
                                        Save Profile
                                    </button>
                                </form>
                            </>
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
                    <div>
                        <h2 className="text-[#e2e8f0] font-semibold mb-3 flex items-center gap-2">
                            <Clock size={18} className="text-[#14b8a6]" />
                            Recent Attendance
                        </h2>

                        {loadingHistory ? (
                            <div className="text-center py-8">
                                <SpinnerGap size={24} className="animate-spin text-[#14b8a6] mx-auto" />
                            </div>
                        ) : history.length === 0 ? (
                            <div className="text-center py-8 text-[#64748b] text-sm">
                                No attendance records yet
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {history.map((record) => (
                                    <div key={record._id}
                                        className="bg-[#0f1629]/60 border border-[#1a2744] rounded-xl p-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-[#e2e8f0] text-sm font-medium">
                                                {record.sessionId?.subject || "Unknown Subject"}
                                            </p>
                                            <p className="text-[#64748b] text-xs mt-0.5">
                                                {new Date(record.timestamp).toLocaleDateString("en-IN", {
                                                    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                                                })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${record.status === "present"
                                                ? "bg-emerald-500/15 text-[#10b981]"
                                                : "bg-yellow-500/15 text-yellow-400"
                                                }`}>
                                                {record.status === "present" ? "Present" : "Flagged"}
                                            </span>
                                            <span className="text-[#64748b] text-xs font-mono">{record.score}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-[#060b18]/95 backdrop-blur-md border-t border-[#1a2744] pt-2 px-6 pb-4 z-50">
                <div className="max-w-lg mx-auto flex justify-around items-center">
                    <button onClick={() => setActiveTab("home")}
                        className={`flex flex-col items-center gap-1 transition-colors duration-200 ${activeTab === "home" ? "text-[#14b8a6]" : "text-[#64748b] hover:text-[#e2e8f0]"} cursor-pointer`}>
                        <House size={24} weight={activeTab === "home" ? "fill" : "regular"} />
                        <span className="text-[10px] font-medium">Home</span>
                    </button>
                    <button onClick={() => setActiveTab("history")}
                        className={`flex flex-col items-center gap-1 transition-colors duration-200 ${activeTab === "history" ? "text-[#14b8a6]" : "text-[#64748b] hover:text-[#e2e8f0]"} cursor-pointer`}>
                        <ClockCounterClockwise size={24} weight={activeTab === "history" ? "fill" : "regular"} />
                        <span className="text-[10px] font-medium">History</span>
                    </button>
                    <button onClick={() => setActiveTab("profile")}
                        className={`flex flex-col items-center gap-1 transition-colors duration-200 ${activeTab === "profile" ? "text-[#14b8a6]" : "text-[#64748b] hover:text-[#e2e8f0]"} cursor-pointer`}>
                        <UserIcon size={24} weight={activeTab === "profile" ? "fill" : "regular"} />
                        <span className="text-[10px] font-medium">Profile</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
