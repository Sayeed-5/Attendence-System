import { useEffect, useState } from "react";
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
    const { loginWithGoogle, loginWithEmailPassword, user, loading } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("student");
    const [isLogging, setIsLogging] = useState(false);

    // Teacher form state
    const [teacherEmail, setTeacherEmail] = useState("");
    const [teacherPassword, setTeacherPassword] = useState("");
    // Student email/password state (optional alternative to Google)
    const [studentEmail, setStudentEmail] = useState("");
    const [studentPassword, setStudentPassword] = useState("");

    useEffect(() => {
        if (!loading && user) {
            navigate(user.role === "teacher" ? "/teacher" : "/student", {
                replace: true,
            });
        }
    }, [loading, user, navigate]);

    const handleStudentLogin = async () => {
        setIsLogging(true);
        try {
            await loginWithGoogle();
        } catch (err) {
            toast.error("Google Login failed or cancelled.");
            console.error(err);
        } finally {
            setIsLogging(false);
        }
    };

    const handleStudentEmailLogin = async (e) => {
        e.preventDefault();
        setIsLogging(true);
        try {
            const loggedUser = await loginWithEmailPassword(studentEmail, studentPassword);
            if (loggedUser?.role === "teacher") {
                navigate("/teacher", { replace: true });
                toast.success("Welcome, Teacher!");
                return;
            }
            navigate("/student", { replace: true });
            toast.success(`Welcome, ${loggedUser?.name || "Student"}!`);
        } catch (err) {
            toast.error("Invalid email/password credentials.");
            console.error(err);
        } finally {
            setIsLogging(false);
        }
    };

    const handleTeacherLogin = async (e) => {
        e.preventDefault();
        setIsLogging(true);
        try {
            const loggedUser = await loginWithEmailPassword(teacherEmail, teacherPassword);
            if (loggedUser?.role !== "teacher") {
                toast.error("This account is not a teacher account.");
                return;
            }
            toast.success(`Welcome, Teacher!`);
            navigate("/teacher", { replace: true });
        } catch (err) {
            toast.error("Invalid teacher credentials.");
            console.error(err);
        } finally {
            setIsLogging(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#060b18]">
                <SpinnerGap size={48} className="animate-spin text-[#14b8a6]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#060b18] p-4">
            {/* Decorative background shapes */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[#14b8a6]/8 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-[#14b8a6]/5 blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo / Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0f1629] mb-4 border border-[#1a2744] shadow-lg shadow-black/10">
                        <GraduationCap size={36} weight="duotone" className="text-[#14b8a6]" />
                    </div>
                    <h1 className="text-3xl font-bold text-[#e2e8f0] tracking-tight">
                        AttendEase
                    </h1>
                    <p className="text-[#64748b] mt-2 text-sm">
                        Smart attendance for modern classrooms
                    </p>
                </div>

                {/* Card */}
                <div className="bg-[#0f1629] rounded-2xl border border-[#1a2744] p-6 sm:p-8 shadow-xl shadow-black/10">

                    {/* Tabs */}
                    <div className="grid grid-cols-2 gap-2 mb-8 bg-[#060b18] p-1.5 rounded-xl border border-[#1a2744]">
                        <button
                            onClick={() => setActiveTab("student")}
                            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${activeTab === "student"
                                ? "bg-[#14b8a6]/25 text-white shadow-sm"
                                : "text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1a2744]/40"
                                }`}
                        >
                            <GraduationCap size={20} weight={activeTab === "student" ? "fill" : "duotone"} />
                            <span className="text-sm font-semibold">Student</span>
                        </button>

                        <button
                            onClick={() => setActiveTab("teacher")}
                            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${activeTab === "teacher"
                                ? "bg-[#14b8a6]/25 text-white shadow-sm"
                                : "text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1a2744]/40"
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
                                <h2 className="text-[#e2e8f0] font-semibold text-lg">Student Login</h2>
                                <p className="text-[#64748b] text-xs mt-1">Use your college email</p>
                            </div>
                            <button
                                onClick={handleStudentLogin}
                                disabled={isLogging}
                                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {isLogging ? (
                                    <SpinnerGap size={22} className="animate-spin" />
                                ) : (
                                    <GoogleLogo size={22} weight="bold" className="text-red-500" />
                                )}
                                {isLogging ? "Signing in..." : "Continue with Google"}
                            </button>
                            <div className="relative py-1">
                                <div className="border-t border-[#1a2744]" />
                                <p className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#0f1629] px-2 text-[11px] text-[#64748b]">
                                    OR
                                </p>
                            </div>
                            <form onSubmit={handleStudentEmailLogin} className="space-y-3">
                                <input
                                    type="email"
                                    required
                                    value={studentEmail}
                                    onChange={(e) => setStudentEmail(e.target.value)}
                                    placeholder="Student Email"
                                    className="w-full bg-[#060b18] border border-[#1a2744] rounded-xl px-4 py-3 text-[#e2e8f0] text-sm placeholder:text-[#64748b]/50 focus:outline-none focus:border-[#14b8a6] transition-colors duration-200"
                                />
                                <input
                                    type="password"
                                    required
                                    value={studentPassword}
                                    onChange={(e) => setStudentPassword(e.target.value)}
                                    placeholder="Password"
                                    className="w-full bg-[#060b18] border border-[#1a2744] rounded-xl px-4 py-3 text-[#e2e8f0] text-sm placeholder:text-[#64748b]/50 focus:outline-none focus:border-[#14b8a6] transition-colors duration-200"
                                />
                                <button
                                    type="submit"
                                    disabled={isLogging}
                                    className="w-full flex items-center justify-center gap-2 bg-[#14b8a6]/90 hover:bg-[#14b8a6] text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-teal-500/20 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                                >
                                    {isLogging ? <SpinnerGap size={20} className="animate-spin" /> : "Login with Email"}
                                </button>
                            </form>
                        </div>
                    ) : (
                        /* Teacher Login Content */
                        <div className="space-y-4">
                            <div className="text-center mb-4">
                                <h2 className="text-[#e2e8f0] font-semibold text-lg">Teacher Login</h2>
                                <p className="text-[#64748b] text-xs mt-1">Provided by Administration</p>
                            </div>

                            <form onSubmit={handleTeacherLogin} className="space-y-4">
                                <div>
                                    <input
                                        type="email"
                                        required
                                        value={teacherEmail}
                                        onChange={(e) => setTeacherEmail(e.target.value)}
                                        placeholder="Teacher Email"
                                        className="w-full bg-[#060b18] border border-[#1a2744] rounded-xl px-4 py-3 text-[#e2e8f0] text-sm placeholder:text-[#64748b]/50 focus:outline-none focus:border-[#14b8a6] transition-colors duration-200"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="password"
                                        required
                                        value={teacherPassword}
                                        onChange={(e) => setTeacherPassword(e.target.value)}
                                        placeholder="Password"
                                        className="w-full bg-[#060b18] border border-[#1a2744] rounded-xl px-4 py-3 text-[#e2e8f0] text-sm placeholder:text-[#64748b]/50 focus:outline-none focus:border-[#14b8a6] transition-colors duration-200"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLogging}
                                    className="w-full flex items-center justify-center gap-2 bg-[#14b8a6] hover:bg-[#14b8a6]/90 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-teal-500/20 active:scale-[0.98] disabled:opacity-60 cursor-pointer mt-2"
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
