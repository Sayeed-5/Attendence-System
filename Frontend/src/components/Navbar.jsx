import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
    SignOut,
    GraduationCap,
    ChalkboardTeacher,
} from "@phosphor-icons/react";

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate("/login", { replace: true });
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
            <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                        <GraduationCap size={18} weight="bold" className="text-white" />
                    </div>
                    <span className="text-white font-bold text-sm tracking-tight">
                        AttendEase
                    </span>
                </div>

                {/* User Info + Logout */}
                <div className="flex items-center gap-3">
                    {/* Role Badge */}
                    <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${user?.role === "teacher"
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-indigo-500/20 text-indigo-300"
                            }`}
                    >
                        {user?.role === "teacher" ? (
                            <span className="flex items-center gap-1">
                                <ChalkboardTeacher size={10} />
                                Teacher
                            </span>
                        ) : (
                            "Student"
                        )}
                    </span>

                    {/* Avatar */}
                    {user?.profilePicture ? (
                        <img
                            src={user.profilePicture}
                            alt={user.name}
                            className="w-7 h-7 rounded-full border border-white/20"
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 text-xs font-bold">
                            {user?.name?.[0] || "?"}
                        </div>
                    )}

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition cursor-pointer"
                        title="Logout"
                    >
                        <SignOut size={16} />
                    </button>
                </div>
            </div>
        </nav>
    );
}
