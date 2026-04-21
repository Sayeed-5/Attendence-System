import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { SpinnerGap } from "@phosphor-icons/react";

function roleHome(role) {
    if (role === "admin") return "/admin";
    if (role === "teacher") return "/teacher";
    return "/student";
}

export default function ProtectedRoute({ children, allowedRole }) {
    const { user, loading, authError, retryAuth, resetAuth } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
                <div className="flex flex-col items-center gap-4">
                    <SpinnerGap size={40} className="animate-spin text-[#6366f1]" />
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center text-slate-200">
                        <p className="text-sm font-semibold">Loading session…</p>
                        <p className="mt-1 text-xs text-slate-400">
                            {authError ? String(authError.message || authError) : "If this takes too long, try Retry."}
                        </p>
                        <div className="mt-3 flex items-center justify-center gap-2">
                            <button
                                type="button"
                                onClick={retryAuth}
                                className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-white"
                            >
                                Retry
                            </button>
                            <button
                                type="button"
                                onClick={resetAuth}
                                className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-200"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRole && user.role !== allowedRole) {
        return <Navigate to={roleHome(user.role)} replace />;
    }

    return children;
}
