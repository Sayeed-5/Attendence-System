import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { SpinnerGap } from "@phosphor-icons/react";

export default function ProtectedRoute({ children, allowedRole }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
                <SpinnerGap size={40} className="animate-spin text-[#6366f1]" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRole && user.role !== allowedRole) {
        // Redirect to their correct dashboard
        return (
            <Navigate
                to={user.role === "teacher" ? "/teacher" : "/student"}
                replace
            />
        );
    }

    return children;
}
