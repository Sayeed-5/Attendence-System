import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";
import {
    ArrowLeft,
    DownloadSimple,
    MagnifyingGlass,
    CheckCircle,
    Warning,
    Users,
    Clock,
    MapPin,
    SpinnerGap,
} from "@phosphor-icons/react";

export default function SessionDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [sessionRes, recordsRes] = await Promise.all([
                api.get(`/session/${id}`),
                api.get(`/attendance/session/${id}`),
            ]);
            setSession(sessionRes.data);
            setRecords(recordsRes.data);
        } catch (err) {
            toast.error("Failed to load session data");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = async () => {
        setExporting(true);
        try {
            const res = await api.get(`/attendance/export/${id}`, {
                responseType: "blob",
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute(
                "download",
                `attendance_${session?.subject || "export"}.csv`
            );
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success("CSV downloaded!");
        } catch (err) {
            toast.error("Export failed");
        } finally {
            setExporting(false);
        }
    };

    const filteredRecords = records.filter((r) => {
        const name = r.studentId?.name || r.studentName || "";
        const regNo = r.studentId?.regNo || "";
        const q = search.toLowerCase();
        return name.toLowerCase().includes(q) || regNo.toLowerCase().includes(q);
    });

    const presentCount = records.filter((r) => r.status === "present").length;
    const flaggedCount = records.filter((r) => r.status === "flagged").length;

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060b18] flex items-center justify-center">
                <SpinnerGap size={32} className="animate-spin text-[#14b8a6]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#060b18]">
            <Navbar />

            <main className="max-w-lg mx-auto px-4 sm:px-6 pt-20 pb-8">
                {/* Back Button + Title */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate("/teacher")}
                        className="flex items-center gap-1 text-[#64748b] hover:text-[#e2e8f0] transition-colors duration-200 text-sm mb-3 cursor-pointer"
                    >
                        <ArrowLeft size={16} />
                        Back to dashboard
                    </button>
                    <h1 className="text-2xl font-bold text-[#e2e8f0]">
                        {session?.subject || "Session Detail"}
                    </h1>
                    <p className="text-[#64748b] text-xs mt-1 flex items-center gap-2">
                        <Clock size={12} />
                        {new Date(session?.startTime).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                        <span>•</span>
                        Code: {session?.sessionCode}
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-[#0f1629] border border-[#1a2744] rounded-xl p-3 text-center shadow-lg shadow-black/5">
                        <Users size={18} className="text-[#14b8a6] mx-auto mb-1" />
                        <p className="text-[#e2e8f0] font-bold text-lg">{records.length}</p>
                        <p className="text-[#64748b] text-xs">Total</p>
                    </div>
                    <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-3 text-center shadow-lg shadow-black/5">
                        <CheckCircle size={18} className="text-[#10b981] mx-auto mb-1" />
                        <p className="text-[#10b981] font-bold text-lg">{presentCount}</p>
                        <p className="text-[#64748b] text-xs">Present</p>
                    </div>
                    <div className="bg-yellow-500/8 border border-yellow-500/20 rounded-xl p-3 text-center shadow-lg shadow-black/5">
                        <Warning size={18} className="text-yellow-400 mx-auto mb-1" />
                        <p className="text-yellow-400 font-bold text-lg">{flaggedCount}</p>
                        <p className="text-[#64748b] text-xs">Flagged</p>
                    </div>
                </div>

                {/* Search + Export */}
                <div className="flex gap-3 mb-4">
                    <div className="flex-1 relative">
                        <MagnifyingGlass
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]/50"
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name or reg no..."
                            className="w-full bg-[#0f1629] border border-[#1a2744] rounded-xl pl-9 pr-4 py-2.5 text-[#e2e8f0] text-sm placeholder:text-[#64748b]/50 focus:outline-none focus:border-[#14b8a6] transition-colors duration-200"
                        />
                    </div>
                    <button
                        onClick={handleExportCSV}
                        disabled={exporting || records.length === 0}
                        className="flex items-center gap-2 bg-[#0f1629] border border-[#1a2744] hover:bg-[#1a2744] text-[#e2e8f0] px-4 py-2.5 rounded-xl transition-colors duration-200 text-sm font-medium disabled:opacity-50 cursor-pointer"
                    >
                        {exporting ? (
                            <SpinnerGap size={16} className="animate-spin" />
                        ) : (
                            <DownloadSimple size={16} />
                        )}
                        CSV
                    </button>
                </div>

                {/* Attendance List */}
                {filteredRecords.length === 0 ? (
                    <div className="text-center py-8 text-[#64748b] text-sm">
                        {records.length === 0
                            ? "No attendance records yet"
                            : "No matching students found"}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredRecords.map((record, idx) => {
                            const student = record.studentId || {};
                            return (
                                <div
                                    key={record._id}
                                    className="bg-[#0f1629]/60 border border-[#1a2744] rounded-xl p-4"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#14b8a6]/20 flex items-center justify-center text-teal-300 text-xs font-bold">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <p className="text-[#e2e8f0] text-sm font-medium">
                                                    {student.name || record.studentName || "Unknown"}
                                                </p>
                                                <p className="text-[#64748b] text-xs flex items-center gap-2">
                                                    {student.regNo && <span>{student.regNo}</span>}
                                                    {student.branch && (
                                                        <>
                                                            <span>•</span>
                                                            <span>{student.branch}</span>
                                                        </>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span
                                                className={`text-xs font-medium px-2.5 py-1 rounded-full ${record.status === "present"
                                                    ? "bg-emerald-500/15 text-[#10b981]"
                                                    : "bg-yellow-500/15 text-yellow-400"
                                                    }`}
                                            >
                                                {record.status === "present" ? "Present" : "Flagged"}
                                            </span>
                                            <p className="text-[#64748b]/50 text-xs mt-1 font-mono">
                                                Score: {record.score}
                                            </p>
                                        </div>
                                    </div>
                                    {/* Flags */}
                                    {record.flags && record.flags.length > 0 && (
                                        <div className="flex gap-1.5 mt-2 ml-11">
                                            {record.flags.map((flag) => (
                                                <span
                                                    key={flag}
                                                    className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20"
                                                >
                                                    {flag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <p className="text-[#64748b]/40 text-xs mt-2 ml-11">
                                        {new Date(record.timestamp).toLocaleTimeString("en-IN", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            second: "2-digit",
                                        })}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
