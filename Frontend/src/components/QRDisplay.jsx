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

    useEffect(() => {
        // Sync with props if session changes from parent
        setCurrentSession(session);
    }, [session]);

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
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-white font-semibold">{session.subject}</h3>
                    <p className="text-white/40 text-xs mt-0.5">Live Session</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <div className="flex items-center gap-1 text-white/70 text-sm">
                        <span className="font-mono font-medium text-white">
                            Live
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
                <span className="text-white/50 text-xs">Code:</span>
                <span className="text-white font-mono font-bold tracking-widest text-lg">
                    {currentSession.sessionCode}
                </span>
                <button
                    onClick={handleCopyCode}
                    className="text-white/40 hover:text-white/80 transition cursor-pointer"
                >
                    {copied ? (
                        <Check size={16} className="text-green-400" />
                    ) : (
                        <Copy size={16} />
                    )}
                </button>
            </div>

            {/* Live Count */}
            {attendanceCount && (
                <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-white/5 rounded-xl p-2 flex flex-col justify-between">
                        <Users size={14} className="text-indigo-400 mx-auto mb-1" />
                        <p className="text-white font-bold text-sm">
                            {attendanceCount.total}
                        </p>
                        <p className="text-white/30 text-[10px]">Total</p>
                    </div>
                    <div className="bg-green-500/10 rounded-xl p-2 flex flex-col justify-between">
                        <CheckCircle size={14} className="text-green-400 mx-auto mb-1" />
                        <p className="text-green-400 font-bold text-sm">
                            {attendanceCount.present}
                        </p>
                        <p className="text-white/30 text-[10px]">Present</p>
                    </div>
                    <div className="bg-yellow-500/10 rounded-xl p-2 flex flex-col justify-between">
                        <Warning size={14} className="text-yellow-400 mx-auto mb-1" />
                        <p className="text-yellow-400 font-bold text-sm">
                            {attendanceCount.flagged}
                        </p>
                        <p className="text-white/30 text-[10px]">Flagged</p>
                    </div>
                    <div className="bg-red-500/10 rounded-xl p-2 flex flex-col justify-between">
                        <XCircle size={14} className="text-red-400 mx-auto mb-1" />
                        <p className="text-red-400 font-bold text-sm">
                            {attendanceCount.absent}
                        </p>
                        <p className="text-white/30 text-[10px]">Absent</p>
                    </div>
                </div>
            )}

            {/* End Session */}
            <button
                onClick={onEnd}
                className="w-full flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2.5 rounded-xl transition text-sm font-medium cursor-pointer"
            >
                <Stop size={16} weight="fill" />
                End Session
            </button>
        </div>
    );
}
