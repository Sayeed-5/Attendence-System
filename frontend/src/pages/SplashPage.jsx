import React from "react";
import { useNavigate } from "react-router-dom";
import {
  QrCode,
  MapPin,
  LockKey,
  Lightning,
  Student,
  CheckCircle,
  Scan,
} from "@phosphor-icons/react";

const SplashPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white flex flex-col font-sans overflow-hidden">
      {/* Background gradients for the dark theme effect */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Navigation */}
      <header className="flex items-center justify-between px-6 py-5 relative z-10">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 text-white p-2 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Student weight="fill" size={20} />
          </div>
          <span className="text-xl font-bold tracking-wide">Attendify</span>
        </div>
        <button
          onClick={() => navigate("/login")}
          className="bg-[#1a2744] hover:bg-[#25365e] text-blue-300 font-medium px-5 py-2 rounded-full transition-all duration-300 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]"
        >
          Sign In
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center px-6 pt-4 pb-24 relative z-10 max-w-lg mx-auto w-full">
        <div className="space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium backdrop-blur-sm animate-fade-in-up">
            <Scan size={16} weight="bold" />
            College Attendance System
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-[1.15] tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400">
            Real-Time <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
              QR Scanning
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-gray-400 text-lg leading-relaxed max-w-[90%]">
            Faculty creates live sessions, students scan and mark presence
            instantly. Fast, secure, and hassle-free.
          </p>

          {/* Feature Chips */}
          <div className="flex flex-wrap gap-3 pt-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1a2744]/60 border border-white/5 shadow-md backdrop-blur-md">
              <MapPin size={16} className="text-red-400" weight="fill" />
              <span className="text-sm font-medium text-gray-200">
                GPS Verified
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1a2744]/60 border border-white/5 shadow-md backdrop-blur-md">
              <Lightning size={16} className="text-yellow-400" weight="fill" />
              <span className="text-sm font-medium text-gray-200">
                Real-time
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1a2744]/60 border border-white/5 shadow-md backdrop-blur-md">
              <LockKey size={16} className="text-green-400" weight="fill" />
              <span className="text-sm font-medium text-gray-200">Secure</span>
            </div>
          </div>
        </div>

        {/* Floating Illustration Area */}
        <div className="mt-16 sm:mt-20 relative h-[250px] w-full flex items-center justify-center">
          {/* Main central glow backdrop */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[200px] h-[200px] bg-blue-500/10 rounded-full blur-2xl"></div>
          </div>

          {/* UI Illustration Mockup */}
          <div className="relative w-full max-w-[280px] h-full">
            {/* Top right floating card */}
            <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 bg-[#111827]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex items-center gap-3 shadow-xl animate-[float_4s_eas-in-out_infinite]">
              <div className="bg-blue-600 rounded-lg p-2 flex-shrink-0">
                <QrCode size={24} className="text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-bold leading-tight">
                  Scan & Attend
                </p>
                <p className="text-gray-400 text-[11px] mt-0.5">
                  QR Active Now
                </p>
              </div>
            </div>

            {/* Central abstract representation */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160px] h-[180px] bg-gradient-to-b from-[#1a2744] to-[#0f1629] rounded-2xl border border-white/10 shadow-2xl flex flex-col items-center justify-center overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              <div className="w-[80px] h-[80px] rounded-2xl border-2 border-dashed border-blue-500/50 flex items-center justify-center bg-blue-500/5">
                <QrCode size={40} className="text-blue-400" />
              </div>
              <div className="mt-4 w-2/3 h-2 bg-gray-700/50 rounded-full"></div>
              <div className="mt-2 w-1/2 h-2 bg-gray-700/50 rounded-full"></div>
            </div>

            {/* Bottom left floating card */}
            <div className="absolute bottom-4 left-0 transform -translate-x-4 translate-y-4 bg-[#111827]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex items-center gap-3 shadow-xl animate-[float_5s_ease-in-out_infinite_reverse]">
              <div className="bg-green-500/20 rounded-full p-2 flex-shrink-0">
                <CheckCircle size={20} className="text-green-400" weight="fill" />
              </div>
              <div>
                <p className="text-white text-sm font-bold leading-tight">
                  Location Verified
                </p>
                <p className="text-gray-400 text-[11px] mt-0.5">
                  Within 50m radius
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Action Area */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-[#0a0f1c] via-[#0a0f1c]/90 to-transparent z-40">
        <div className="max-w-lg mx-auto w-full">
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 text-lg"
          >
            Get Started
            <Lightning weight="fill" size={20} />
          </button>
        </div>
      </div>

      <style jsx="true">{`
        @keyframes float {
          0% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-10px) translateX(5px);
          }
          100% {
            transform: translateY(0px) translateX(0px);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default SplashPage;
