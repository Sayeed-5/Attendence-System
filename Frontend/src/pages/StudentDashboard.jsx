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
    }, [user, isProfileComplete]);

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
            // Get location
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
            },
            (err) => {
                toast.error("Please enable location access to mark attendance");
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
            // Generate a simple device fingerprint
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
        } catch (err) {
            toast.error(err.response?.data?.msg || "Failed to mark attendance");
        } finally {
            setMarking(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
            <Navbar />

            <main className="max-w-lg mx-auto px-4 pt-20 pb-8">
                {/* Welcome */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-white">
                        Hey, {user?.name?.split(" ")[0]} 👋
                    </h1>
                    <p className="text-indigo-300/60 text-sm mt-1">
                        Ready to mark your attendance?
                    </p>
                </div>

                {/* Analytics Segment */}
                {activeTab === "home" && stats && (
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 flex flex-col justify-between">
                            <div className="flex items-center gap-2 mb-2">
                                <ChartBar size={18} className="text-blue-400" />
                                <span className="text-white/70 text-xs">Classes Attended</span>
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-2xl font-bold text-white">{stats.attendedSessions}</span>
                                <span className="text-white/40 text-xs mb-1">/ {stats.totalSessions}</span>
                            </div>
                        </div>
                        <div className="bg-indigo-500/20 backdrop-blur-sm border border-indigo-500/30 rounded-2xl p-4 flex flex-col justify-between">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle size={18} className="text-green-400" />
                                <span className="text-indigo-200/70 text-xs">Attendance</span>
                            </div>
                            <div className="flex items-end gap-1">
                                <span className="text-2xl font-bold text-white">{stats.percentage}%</span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-1.5 mt-2">
                                <div
                                    className="bg-green-400 h-1.5 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${Math.min(stats.percentage, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Profile View / Edit Form */}
                {activeTab === "profile" && (
                    <div className="bg-indigo-900/40 border border-indigo-500/30 rounded-2xl p-5 mb-6 backdrop-blur-sm">
                        {!isEditingProfile ? (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-white font-semibold flex items-center gap-2">
                                        <UserIcon size={20} className="text-indigo-400" />
                                        My Profile
                                    </h3>
                                    <button
                                        onClick={() => setIsEditingProfile(true)}
                                        className="text-indigo-400 text-xs hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
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
                                        <span className="text-white/50 text-sm">Reg. No</span>
                                        <span className="text-white text-sm font-medium">{user?.regNo}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/5 pb-2">
                                        <span className="text-white/50 text-sm">Branch</span>
                                        <span className="text-white text-sm font-medium">{user?.branch}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/5 pb-2">
                                        <span className="text-white/50 text-sm">Semester</span>
                                        <span className="text-white text-sm font-medium">{user?.semester}</span>
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
                                                setName(user.name || "");
                                                setRegNo(user.regNo || "");
                                                setBranch(user.branch || "");
                                                setSemester(user.semester || "");
                                                setMobileNo(user.mobileNo || "");
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
                                            <UserIcon size={14} /> Full Name
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
                                            <IdentificationCard size={14} /> Registration No.
                                        </label>
                                        <input
                                            type="text"
                                            value={regNo}
                                            onChange={(e) => setRegNo(e.target.value)}
                                            required
                                            placeholder="e.g., 21CS001"
                                            className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-400 transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-white/60 text-xs mb-1 flex items-center gap-1">
                                            <Buildings size={14} /> Branch
                                        </label>
                                        <input
                                            type="text"
                                            value={branch}
                                            onChange={(e) => setBranch(e.target.value)}
                                            required
                                            placeholder="e.g., Computer Science"
                                            className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-400 transition"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-white/60 text-xs mb-1 flex items-center gap-1">
                                                <BookBookmark size={14} /> Semester
                                            </label>
                                            <input
                                                type="text"
                                                value={semester}
                                                onChange={(e) => setSemester(e.target.value)}
                                                required
                                                placeholder="e.g., 6th"
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

                {/* Scan QR / Scanned Session */}
                {activeTab === "home" && !scannedSession && (
                    <button
                        onClick={() => setShowScanner(true)}
                        className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 shadow-lg shadow-purple-500/20 hover:shadow-xl active:scale-[0.98] mb-6 cursor-pointer"
                    >
                        <QrCode size={28} weight="duotone" />
                        <span className="text-lg">Scan QR Code</span>
                    </button>
                )}

                {activeTab === "home" && scannedSession && (
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 mb-6">
                        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <CheckCircle size={20} className="text-green-400" />
                            Session Found
                        </h3>
                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-white/50">Subject</span>
                                <span className="text-white font-medium">
                                    {scannedSession.subject}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-white/50">Status</span>
                                <span
                                    className={`font-medium ${scannedSession.isActive
                                        ? "text-green-400"
                                        : "text-red-400"
                                        }`}
                                >
                                    {scannedSession.isActive ? "Active" : "Expired"}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-white/50">Location</span>
                                <span className="text-white/80 flex items-center gap-1">
                                    <MapPin size={14} />
                                    {location
                                        ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                                        : "Fetching..."}
                                </span>
                            </div>
                            {distanceVal !== null && distanceVal > MAX_RADIUS && (
                                <div className="mt-2 bg-red-500/20 text-red-300 p-2 rounded-lg text-xs flex items-center gap-2">
                                    <Warning size={16} />
                                    You are {Math.round(distanceVal)}m away. You must be inside the college campus to mark attendance.
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setScannedSession(null);
                                    setLocation(null);
                                    setDistanceVal(null);
                                }}
                                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-xl transition text-sm font-medium cursor-pointer"
                            >
                                Cancel
                            </button>
                            {distanceVal !== null && distanceVal <= MAX_RADIUS && (
                                <button
                                    onClick={handleMarkAttendance}
                                    disabled={marking || !scannedSession.isActive}
                                    className="flex-1 bg-green-500 hover:bg-green-400 text-white py-2.5 rounded-xl transition text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {marking ? (
                                        <SpinnerGap size={18} className="animate-spin" />
                                    ) : (
                                        <CheckCircle size={18} />
                                    )}
                                    {marking ? "Marking..." : "Mark Attendance"}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* QR Scanner Modal */}
                {showScanner && (
                    <QRScanner
                        onScan={handleScan}
                        onClose={() => setShowScanner(false)}
                    />
                )}

                {/* Attendance History */}
                {activeTab === "history" && (
                    <div>
                        <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <Clock size={18} className="text-indigo-400" />
                            Recent Attendance
                        </h2>

                        {loadingHistory ? (
                            <div className="text-center py-8">
                                <SpinnerGap
                                    size={24}
                                    className="animate-spin text-indigo-400 mx-auto"
                                />
                            </div>
                        ) : history.length === 0 ? (
                            <div className="text-center py-8 text-white/30 text-sm">
                                No attendance records yet
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {history.map((record) => (
                                    <div
                                        key={record._id}
                                        className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between"
                                    >
                                        <div>
                                            <p className="text-white text-sm font-medium">
                                                {record.sessionId?.subject || "Unknown Subject"}
                                            </p>
                                            <p className="text-white/40 text-xs mt-0.5">
                                                {new Date(record.timestamp).toLocaleDateString("en-IN", {
                                                    day: "numeric",
                                                    month: "short",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`text-xs font-medium px-2.5 py-1 rounded-full ${record.status === "present"
                                                    ? "bg-green-500/20 text-green-400"
                                                    : "bg-yellow-500/20 text-yellow-400"
                                                    }`}
                                            >
                                                {record.status === "present" ? "Present" : "Flagged"}
                                            </span>
                                            <span className="text-white/40 text-xs font-mono">
                                                {record.score}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-md border-t border-white/10 p-4 pb-6 z-50">
                <div className="max-w-lg mx-auto flex justify-around items-center">
                    <button
                        onClick={() => setActiveTab("home")}
                        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "home" ? "text-purple-400" : "text-white/40 hover:text-white/60"} cursor-pointer`}
                    >
                        <House size={24} weight={activeTab === "home" ? "fill" : "regular"} />
                        <span className="text-[10px] font-medium">Home</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("history")}
                        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "history" ? "text-purple-400" : "text-white/40 hover:text-white/60"} cursor-pointer`}
                    >
                        <ClockCounterClockwise size={24} weight={activeTab === "history" ? "fill" : "regular"} />
                        <span className="text-[10px] font-medium">History</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("profile")}
                        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "profile" ? "text-purple-400" : "text-white/40 hover:text-white/60"} cursor-pointer`}
                    >
                        <UserIcon size={24} weight={activeTab === "profile" ? "fill" : "regular"} />
                        <span className="text-[10px] font-medium">Profile</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
