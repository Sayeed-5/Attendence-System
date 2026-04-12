import { useEffect, useState } from "react";
import {
    CheckCircle,
    ClockCountdown,
    MapPin,
    Stop,
    Users,
    Warning,
    XCircle,
} from "@phosphor-icons/react";

function formatTime(value) {
    if (!value) return "--:--";
    return new Date(value).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function QRDisplay({ session, attendanceCount, onEnd }) {
    const [remainingTime, setRemainingTime] = useState("");

    useEffect(() => {
        if (!session?.endTime) {
            setRemainingTime("Open");
            return undefined;
        }

        const tick = () => {
            const now = Date.now();
            const end = new Date(session.endTime).getTime();
            const diff = Math.max(0, end - now);
            const minutes = Math.floor(diff / 60000)
                .toString()
                .padStart(2, "0");
            const seconds = Math.floor((diff % 60000) / 1000)
                .toString()
                .padStart(2, "0");
            setRemainingTime(`${minutes}:${seconds}`);
        };

        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, [session?.endTime]);

    return (
        <div className="space-y-4 rounded-2xl border border-[#1a2744] bg-[#0f1629] p-5 shadow-lg shadow-black/10">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-[#e2e8f0]">{session.subject}</h3>
                    <p className="mt-0.5 text-xs text-[#64748b]">Live attendance session</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#64748b]">
                    <span className="h-2 w-2 rounded-full bg-[#10b981] animate-pulse" />
                    <span className="font-medium text-[#10b981]">Ends in {remainingTime}</span>
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-[#1a2744] bg-[#060b18] p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[#64748b]">Time Window</p>
                    <div className="mt-3 flex items-center gap-2 text-[#e2e8f0]">
                        <ClockCountdown size={18} className="text-[#14b8a6]" />
                        <span className="font-semibold">
                            {formatTime(session.startTime)} - {formatTime(session.endTime)}
                        </span>
                    </div>
                </div>

                <div className="rounded-xl border border-[#1a2744] bg-[#060b18] p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[#64748b]">Location</p>
                    <div className="mt-3 flex items-center gap-2 text-[#e2e8f0]">
                        <MapPin size={18} className="text-[#14b8a6]" />
                        <span className="font-semibold">Radius {session.radius || 100}m</span>
                    </div>
                </div>
            </div>

            {attendanceCount && (
                <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="flex flex-col justify-between rounded-xl border border-[#1a2744] bg-[#060b18] p-2">
                        <Users size={14} className="mx-auto mb-1 text-[#14b8a6]" />
                        <p className="text-sm font-bold text-[#e2e8f0]">{attendanceCount.total}</p>
                        <p className="text-[10px] text-[#64748b]">Total</p>
                    </div>
                    <div className="flex flex-col justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2">
                        <CheckCircle size={14} className="mx-auto mb-1 text-[#10b981]" />
                        <p className="text-sm font-bold text-[#10b981]">{attendanceCount.present}</p>
                        <p className="text-[10px] text-[#64748b]">Present</p>
                    </div>
                    <div className="flex flex-col justify-between rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-2">
                        <Warning size={14} className="mx-auto mb-1 text-yellow-400" />
                        <p className="text-sm font-bold text-yellow-400">{attendanceCount.flagged}</p>
                        <p className="text-[10px] text-[#64748b]">Flagged</p>
                    </div>
                    <div className="flex flex-col justify-between rounded-xl border border-red-500/20 bg-red-500/10 p-2">
                        <XCircle size={14} className="mx-auto mb-1 text-red-400" />
                        <p className="text-sm font-bold text-red-400">{attendanceCount.absent}</p>
                        <p className="text-[10px] text-[#64748b]">Absent</p>
                    </div>
                </div>
            )}

            <button
                onClick={onEnd}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 py-2.5 text-sm font-medium text-red-400 transition-all duration-200 hover:bg-red-500/20"
            >
                <Stop size={16} weight="fill" />
                End Session
            </button>
        </div>
    );
}
