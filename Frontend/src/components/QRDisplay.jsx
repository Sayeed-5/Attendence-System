import { useState, useEffect } from "react";
import api from "../services/api";
import {
    Users,
    CheckCircle,
    Warning,
    XCircle,
    Stop,
    Copy,
    Check,
} from "@phosphor-icons/react";

export default function QRDisplay({ session, attendanceCount, onEnd }) {
    const [currentSession, setCurrentSession] = useState(session);
    const [copied, setCopied] = useState(false);
    const [elapsedTime, setElapsedTime] = useState("");

    useEffect(() => {
        setCurrentSession(session);
    }, [session]);

    // Timer effect
    useEffect(() => {
        if (!session.startTime) return;

        const updateTimer = () => {
            const start = new Date(session.startTime).getTime();
            const now = new Date().getTime();
            const diffInSeconds = Math.floor((now - start) / 1000);

            const m = Math.floor(diffInSeconds / 60).toString().padStart(2, "0");
            const s = (diffInSeconds % 60).toString().padStart(2, "0");
            setElapsedTime(`${m}:${s}`);
        };

        updateTimer();
        const timerInterval = setInterval(updateTimer, 1000);
        return () => clearInterval(timerInterval);
    }, [session.startTime]);

    useEffect(() => {
        const refreshQr = async () => {
            try {
                const res = await api.patch(`/session/${session._id}/refresh-qr`);
                setCurrentSession(res.data);
            } catch (err) {
                console.error("Failed to refresh QR:", err);
            }
        };

        const interval = setInterval(refreshQr, 30000); // 30 seconds refresh
        return () => clearInterval(interval);
    }, [session._id]);

    const handleCopyCode = () => {
        navigator.clipboard.writeText(currentSession.sessionCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-[#0f1629] border border-[#1a2744] rounded-2xl p-5 space-y-4 shadow-lg shadow-black/10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-[#e2e8f0] font-semibold">{session.subject}</h3>
                    <p className="text-[#64748b] text-xs mt-0.5">Live Session</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                    <div className="flex items-center gap-1 text-[#64748b] text-sm">
                        <span className="font-mono font-medium text-[#10b981]">
                            Live {elapsedTime}
                        </span>
                    </div>
                </div>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
                <div className="bg-white rounded-2xl p-4">
                    <img
                        src={currentSession.qrCode}
                        alt="QR Code"
                        className="w-48 h-48 mx-auto"
                    />
                </div>
            </div>

            {/* Session Code (manual fallback) */}
            <div className="flex items-center justify-center gap-2">
                <span className="text-[#64748b] text-xs">Code:</span>
                <span className="text-[#e2e8f0] font-mono font-bold tracking-widest text-lg">
                    {currentSession.sessionCode}
                </span>
                <button
                    onClick={handleCopyCode}
                    className="text-[#64748b] hover:text-[#e2e8f0] transition-colors duration-200 cursor-pointer"
                >
                    {copied ? (
                        <Check size={16} className="text-[#10b981]" />
                    ) : (
                        <Copy size={16} />
                    )}
                </button>
            </div>

            {/* Live Count */}
            {attendanceCount && (
                <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-[#060b18] border border-[#1a2744] rounded-xl p-2 flex flex-col justify-between">
                        <Users size={14} className="text-[#14b8a6] mx-auto mb-1" />
                        <p className="text-[#e2e8f0] font-bold text-sm">
                            {attendanceCount.total}
                        </p>
                        <p className="text-[#64748b] text-[10px]">Total</p>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2 flex flex-col justify-between">
                        <CheckCircle size={14} className="text-[#10b981] mx-auto mb-1" />
                        <p className="text-[#10b981] font-bold text-sm">
                            {attendanceCount.present}
                        </p>
                        <p className="text-[#64748b] text-[10px]">Present</p>
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-2 flex flex-col justify-between">
                        <Warning size={14} className="text-yellow-400 mx-auto mb-1" />
                        <p className="text-yellow-400 font-bold text-sm">
                            {attendanceCount.flagged}
                        </p>
                        <p className="text-[#64748b] text-[10px]">Flagged</p>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-2 flex flex-col justify-between">
                        <XCircle size={14} className="text-red-400 mx-auto mb-1" />
                        <p className="text-red-400 font-bold text-sm">
                            {attendanceCount.absent}
                        </p>
                        <p className="text-[#64748b] text-[10px]">Absent</p>
                    </div>
                </div>
            )}

            {/* End Session */}
            <button
                onClick={onEnd}
                className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium cursor-pointer"
            >
                <Stop size={16} weight="fill" />
                End Session
            </button>
        </div>
    );
}
