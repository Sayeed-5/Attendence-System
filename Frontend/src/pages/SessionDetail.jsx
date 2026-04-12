import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
    ArrowLeft,
    CalendarBlank,
    DownloadSimple,
    FunnelSimple,
    GraduationCap,
    MagnifyingGlass,
    Prohibit,
    SpinnerGap,
    UsersThree,
    Warning,
} from "@phosphor-icons/react";
import Navbar from "../components/Navbar";
import api from "../services/api";

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

export default function SessionDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [session, setSession] = useState(null);
    const [records, setRecords] = useState([]);
    const [summary, setSummary] = useState({
        presentCount: 0,
        flaggedCount: 0,
        absentCount: 0,
        attendedCount: 0,
        totalStudents: 0,
        attendancePercentage: 0,
    });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [sessionRes, rosterRes] = await Promise.all([
                    api.get(`/session/${id}`),
                    api.get(`/attendance/session/${id}/roster`),
                ]);

                setSession(sessionRes.data);
                setRecords(rosterRes.data.records || []);
                setSummary({
                    presentCount: rosterRes.data.presentCount || 0,
                    flaggedCount: rosterRes.data.flaggedCount || 0,
                    absentCount: rosterRes.data.absentCount || 0,
                    attendedCount: rosterRes.data.attendedCount || 0,
                    totalStudents: rosterRes.data.totalStudents || 0,
                    attendancePercentage: rosterRes.data.attendancePercentage || 0,
                });
            } catch (err) {
                toast.error("Failed to load session data");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

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

    const filteredRecords = useMemo(() => {
        const query = search.trim().toLowerCase();

        return records.filter((record) => {
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
                statusFilter === "all" ? true : record.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [records, search, statusFilter]);

    const filterChips = [
        { key: "all", label: "All", count: records.length },
        { key: "present", label: "Present", count: summary.presentCount },
        { key: "flagged", label: "Flagged", count: summary.flaggedCount },
        { key: "absent", label: "Absent", count: summary.absentCount },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060b18] flex items-center justify-center">
                <SpinnerGap size={34} className="animate-spin text-[#33c3ff]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(23,34,56,0.92),rgba(5,8,18,1)_58%)] text-slate-200">
            <Navbar />

            <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-20 sm:px-6 lg:px-8">
                <section className="mb-6">
                    <button
                        onClick={() => navigate("/teacher")}
                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
                    >
                        <ArrowLeft size={16} />
                        Back to Sessions
                    </button>
                </section>

                <section className="rounded-[30px] border border-white/6 bg-[#171b24]/96 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
                    <div className="rounded-[28px] border border-cyan-400/14 bg-[linear-gradient(180deg,rgba(8,96,106,0.95),rgba(16,27,37,0.95))] p-5">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                            <div>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-cyan-100">
                                        <GraduationCap size={22} weight="duotone" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-semibold text-white">
                                            {session?.subject || "Session Detail"}
                                        </h1>
                                        <p className="mt-1 text-sm text-cyan-50/70">
                                            {formatDateTime(
                                                session?.startTime || session?.createdAt
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-cyan-50/70">
                                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
                                        <CalendarBlank size={14} />
                                        Code: {session?.sessionCode || "Unavailable"}
                                    </span>
                                    <span
                                        className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] ${
                                            session?.isActive
                                                ? "bg-emerald-500/15 text-emerald-200"
                                                : "bg-white/10 text-slate-100"
                                        }`}
                                    >
                                        {session?.isActive ? "Active" : "Closed"}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handleExportCSV}
                                disabled={exporting || records.length === 0}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#121722] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#161d29] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {exporting ? (
                                    <SpinnerGap size={16} className="animate-spin" />
                                ) : (
                                    <DownloadSimple size={18} />
                                )}
                                Export CSV
                            </button>
                        </div>

                        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-[22px] bg-[#121722] p-4 text-center">
                                <p className="text-3xl font-semibold text-white">
                                    {summary.attendedCount}
                                </p>
                                <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                                    Attended
                                </p>
                            </div>
                            <div className="rounded-[22px] bg-[#121722] p-4 text-center">
                                <p className="text-3xl font-semibold text-white">
                                    {summary.totalStudents}
                                </p>
                                <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                                    Total Students
                                </p>
                            </div>
                            <div className="rounded-[22px] bg-[#121722] p-4 text-center">
                                <p className="text-3xl font-semibold text-rose-300">
                                    {summary.absentCount}
                                </p>
                                <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                                    Absent
                                </p>
                            </div>
                            <div className="rounded-[22px] bg-[#121722] p-4 text-center">
                                <p className="text-3xl font-semibold text-emerald-300">
                                    {summary.attendancePercentage}%
                                </p>
                                <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                                    Percentage
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                        <div className="relative w-full xl:max-w-xl">
                            <MagnifyingGlass
                                size={18}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                            />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name, reg no, or branch..."
                                className="w-full rounded-[20px] border border-white/8 bg-[#141925] py-3 pl-11 pr-4 text-sm text-white outline-none transition focus:border-[#33c3ff]"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-[#141925] px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                <FunnelSimple size={16} />
                                Filter
                            </span>
                            {filterChips.map((chip) => (
                                <button
                                    key={chip.key}
                                    type="button"
                                    onClick={() => setStatusFilter(chip.key)}
                                    className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                                        statusFilter === chip.key
                                            ? "bg-[#29d8ff] text-[#04131f]"
                                            : "border border-white/8 bg-[#141925] text-slate-300"
                                    }`}
                                >
                                    {chip.label} ({chip.count})
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-5 space-y-3">
                        {filteredRecords.length === 0 ? (
                            <div className="rounded-[22px] border border-white/6 bg-[#141925] px-4 py-12 text-center text-sm text-slate-400">
                                {records.length === 0
                                    ? "No student records found for this session."
                                    : "No students matched your current search or filter."}
                            </div>
                        ) : (
                            filteredRecords.map((record, index) => {
                                const student = record.studentId || {};
                                const isPresent = record.status === "present";
                                const isFlagged = record.status === "flagged";
                                const isAbsent = record.status === "absent";
                                const statusClass = isPresent
                                    ? "bg-emerald-500/14 text-emerald-300"
                                    : isFlagged
                                      ? "bg-amber-400/14 text-amber-200"
                                      : "bg-rose-500/14 text-rose-300";

                                return (
                                    <div
                                        key={record._id}
                                        className="rounded-[22px] border border-white/6 bg-[#141925] px-4 py-4 shadow-[0_10px_24px_rgba(0,0,0,0.18)]"
                                    >
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1f2d39] text-sm font-semibold text-white">
                                                    {index + 1}
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
                                                <span
                                                    className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${statusClass}`}
                                                >
                                                    {isPresent
                                                        ? "Present"
                                                        : isFlagged
                                                          ? "Flagged"
                                                          : "Absent"}
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
                            })
                        )}
                    </div>
                </section>

                <section className="mt-5 grid gap-4 md:grid-cols-3">
                    <div className="rounded-[24px] border border-white/6 bg-[#171b24]/96 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
                        <UsersThree size={20} className="text-cyan-300" />
                        <p className="mt-4 text-2xl font-semibold text-white">
                            {summary.presentCount}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                            Students marked present normally.
                        </p>
                    </div>
                    <div className="rounded-[24px] border border-white/6 bg-[#171b24]/96 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
                        <Warning size={20} className="text-amber-300" />
                        <p className="mt-4 text-2xl font-semibold text-white">
                            {summary.flaggedCount}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                            Students flagged for review or unusual checks.
                        </p>
                    </div>
                    <div className="rounded-[24px] border border-white/6 bg-[#171b24]/96 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
                        <Prohibit size={20} className="text-rose-300" />
                        <p className="mt-4 text-2xl font-semibold text-white">
                            {summary.absentCount}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                            Students missing from the final session roster.
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
}
