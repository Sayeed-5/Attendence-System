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
        <nav className="fixed top-0 left-0 right-0 z-40 bg-[#060b18]/85 backdrop-blur-xl border-b border-[#1a2744]">
            <div className="max-w-lg mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#14b8a6] flex items-center justify-center shadow-md shadow-teal-500/20">
                        <GraduationCap size={18} weight="bold" className="text-white" />
                    </div>
                    <span className="text-[#e2e8f0] font-bold text-sm tracking-tight">
                        AttendEase
                    </span>
                </div>

                {/* User Info + Logout */}
                <div className="flex items-center gap-3">
                    {/* Role Badge */}
                    <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${user?.role === "teacher"
                            ? "bg-amber-500/15 text-amber-400"
                            : "bg-[#14b8a6]/15 text-teal-300"
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
                            className="w-7 h-7 rounded-full border border-[#1a2744]"
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <div className="w-7 h-7 rounded-full bg-[#14b8a6]/20 flex items-center justify-center text-teal-300 text-xs font-bold">
                            {user?.name?.[0] || "?"}
                        </div>
                    )}

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#0f1629] hover:bg-[#1a2744] text-[#64748b] hover:text-[#e2e8f0] transition-all duration-200 cursor-pointer"
                        title="Logout"
                    >
                        <SignOut size={16} />
                    </button>
                </div>
            </div>
        </nav>
    );
}
