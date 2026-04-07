import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
    GraduationCap,
    ChalkboardTeacher,
    GoogleLogo,
    SpinnerGap,
} from "@phosphor-icons/react";
import toast from "react-hot-toast";

export default function LoginPage() {
    const { loginWithGoogle, loginTeacher, user, loading } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("student");
    const [isLogging, setIsLogging] = useState(false);

    // Teacher form state
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // If already logged in, redirect
    if (!loading && user) {
        navigate(user.role === "teacher" ? "/teacher" : "/student", {
            replace: true,
        });
        return null;
    }

    const handleStudentLogin = async () => {
        setIsLogging(true);
        try {
            const loggedUser = await loginWithGoogle();
            toast.success(`Welcome, ${loggedUser.name}!`);
            navigate("/student", { replace: true });
        } catch (err) {
            toast.error("Google Login failed or cancelled.");
            console.error(err);
        } finally {
            setIsLogging(false);
        }
    };

    const handleTeacherLogin = async (e) => {
        e.preventDefault();
        setIsLogging(true);
        try {
            const loggedUser = await loginTeacher(email, password);
            toast.success(`Welcome, Teacher!`);
            navigate("/teacher", { replace: true });
        } catch (err) {
            toast.error(err.code === "auth/invalid-credential"
                ? "Invalid teacher credentials."
                : "Failed to login properly as Teacher.");
            console.error(err);
        } finally {
            setIsLogging(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-900">
                <SpinnerGap size={48} className="animate-spin text-white" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-900 p-4">
            {/* Decorative background shapes */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo / Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm mb-4 border border-white/20">
                        <GraduationCap size={36} weight="duotone" className="text-purple-300" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        AttendEase
                    </h1>
                    <p className="text-purple-300/80 mt-2 text-sm">
                        Smart attendance for modern classrooms
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-2xl">

                    {/* Tabs */}
                    <div className="grid grid-cols-2 gap-2 mb-8 bg-white/5 p-1 rounded-2xl border border-white/10">
                        <button
                            onClick={() => setActiveTab("student")}
                            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${activeTab === "student"
                                ? "bg-purple-500/40 text-white shadow-lg shadow-purple-500/10"
                                : "text-white/50 hover:text-white hover:bg-white/5"
                                }`}
                        >
                            <GraduationCap size={20} weight={activeTab === "student" ? "fill" : "duotone"} />
                            <span className="text-sm font-semibold">Student</span>
                        </button>

                        <button
                            onClick={() => setActiveTab("teacher")}
                            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${activeTab === "teacher"
                                ? "bg-purple-500/40 text-white shadow-lg shadow-purple-500/10"
                                : "text-white/50 hover:text-white hover:bg-white/5"
                                }`}
                        >
                            <ChalkboardTeacher size={20} weight={activeTab === "teacher" ? "fill" : "duotone"} />
                            <span className="text-sm font-semibold">Teacher</span>
                        </button>
                    </div>

                    {activeTab === "student" ? (
                        /* Student Login Content */
                        <div className="space-y-6">
                            <div className="text-center mb-6">
                                <h2 className="text-white font-semibold text-lg">Student Login</h2>
                                <p className="text-white/50 text-xs mt-1">Use your college email</p>
                            </div>
                            <button
                                onClick={handleStudentLogin}
                                disabled={isLogging}
                                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3.5 px-6 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {isLogging ? (
                                    <SpinnerGap size={22} className="animate-spin" />
                                ) : (
                                    <GoogleLogo size={22} weight="bold" className="text-red-500" />
                                )}
                                {isLogging ? "Signing in..." : "Continue with Google"}
                            </button>
                        </div>
                    ) : (
                        /* Teacher Login Content */
                        <div className="space-y-4">
                            <div className="text-center mb-4">
                                <h2 className="text-white font-semibold text-lg">Teacher Login</h2>
                                <p className="text-white/50 text-xs mt-1">Provided by Administration</p>
                            </div>

                            <form onSubmit={handleTeacherLogin} className="space-y-4">
                                <div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Teacher Email"
                                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-400 focus:bg-white/20 transition"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Password"
                                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-400 focus:bg-white/20 transition"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLogging}
                                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-3.5 rounded-xl transition duration-200 shadow-lg shadow-purple-500/20 active:scale-[0.98] disabled:opacity-60 cursor-pointer mt-2"
                                >
                                    {isLogging ? <SpinnerGap size={20} className="animate-spin" /> : "Sign In Securely"}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
