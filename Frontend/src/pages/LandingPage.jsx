import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDots,
  ChartBar,
  CheckCircle,
  DeviceMobile,
  Lightning,
  ListChecks,
  Minus,
  Plus,
  ShieldCheck,
  Sparkle,
} from "@phosphor-icons/react";

const featureCards = [
  {
    icon: Lightning,
    title: "Instant QR check-ins",
    description:
      "Launch a session, share a live QR, and let students mark attendance in seconds without paper sheets or manual entry.",
  },
  {
    icon: ChartBar,
    title: "Insightful analytics",
    description:
      "Spot attendance trends, identify at-risk learners early, and export clean reports for faculty or admin review.",
  },
  {
    icon: ShieldCheck,
    title: "Secure records",
    description:
      "Keep attendance history organized in one place with protected access, consistent timestamps, and easier auditing.",
  },
];

const steps = [
  {
    number: "1",
    title: "Teacher creates session",
    description:
      "Start a class or event in one tap and generate a fresh code for that attendance window.",
  },
  {
    number: "2",
    title: "Students scan QR",
    description:
      "Learners scan from their phones and submit attendance without waiting in a queue.",
  },
  {
    number: "3",
    title: "Reports delivered",
    description:
      "Attendance is logged instantly so summaries are ready right after the session ends.",
  },
];

const mobileFeatures = [
  "Offline-friendly experience for classrooms with unstable internet",
  "Works across phones, tablets, and laptop browsers",
  "Attendance summaries ready for quick sharing with staff",
];

const faqs = [
  {
    question: "Can students cheat by sharing the QR code?",
    answer:
      "The flow is designed for short-lived session check-ins, so codes can be refreshed per class and monitored by the instructor during attendance.",
  },
  {
    question: "Is there a limit to the number of students?",
    answer:
      "The interface is built for both small classrooms and larger sections, making it practical for daily academic use.",
  },
  {
    question: "Do students need to install an app?",
    answer:
      "No. Students can sign in from their regular device browser, which keeps onboarding simple for classrooms.",
  },
  {
    question: "Can this work for seminars or labs too?",
    answer:
      "Yes. The same session-based attendance flow fits lectures, labs, workshops, and short academic events.",
  },
];

const institutionNames = ["EduTech", "TimeWise", "FastTrack", "SecureEd"];

function PhoneMockup() {
  const students = [
    { name: "Olivia Chen", present: true },
    { name: "Ethan Smith", present: true },
    { name: "Sofia Ramirez", present: true },
    { name: "Liam Johnson", present: true },
    { name: "Ava Brown", present: false },
    { name: "Noah Taylor", present: false },
  ];

  return (
    <div className="relative mx-auto w-[220px] rounded-[2.2rem] border border-white/10 bg-[#11111a] p-3 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
      <div className="absolute left-1/2 top-3 h-1.5 w-16 -translate-x-1/2 rounded-full bg-white/10" />
      <div className="overflow-hidden rounded-[1.7rem] border border-white/6 bg-[#f4f5f7]">
        <div className="bg-[linear-gradient(180deg,#24354f_0%,#1b273c_100%)] px-4 pb-4 pt-6 text-white">
          <div className="mb-4 flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-white/55">
            <span>AstraAttend</span>
            <span>Live</span>
          </div>
          <p className="text-sm font-semibold">Class: Design Thinking</p>
          <p className="mt-1 text-xs text-white/65">Oct 26 • 09:30 AM</p>
        </div>
        <div className="space-y-2 p-3">
          {students.map((student) => (
            <div
              key={student.name}
              className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 text-[11px] text-slate-700 shadow-sm"
            >
              <span>{student.name}</span>
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  student.present
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {student.present ? "✓" : ""}
              </span>
            </div>
          ))}
          <button className="mt-2 w-full rounded-full bg-emerald-600 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-white">
            End session
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState(0);

  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <div className="min-h-screen bg-[#14111d] text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(162,129,255,0.18),transparent_26%),radial-gradient(circle_at_top_left,rgba(53,84,133,0.22),transparent_28%),linear-gradient(180deg,#1a1624_0%,#14111d_100%)]" />
        <div className="absolute right-[-120px] top-36 h-80 w-80 rounded-full bg-[#9f7aea]/10 blur-3xl" />
        <div className="absolute left-[-140px] top-60 h-96 w-96 rounded-full bg-[#3767c9]/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-6 sm:px-8 lg:px-10">
          <header className="rounded-[28px] border border-white/6 bg-white/[0.03] px-6 py-4 backdrop-blur-md">
            <div className="flex items-center justify-between gap-6">
              <Link to="/" className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="AstraAttend logo"
                  className="h-10 w-10 rounded-2xl object-cover shadow-[0_10px_25px_rgba(155,124,247,0.35)]"
                />
                <span
                  className="text-2xl font-bold tracking-tight text-[#aa90ff]"
                  style={{ fontFamily: '"Space Grotesk", "Inter", sans-serif' }}
                >
                  AstraAttend
                </span>
              </Link>

              <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
                <a href="#features" className="transition hover:text-white">
                  Features
                </a>
                <a href="#how-it-works" className="transition hover:text-white">
                  How it works
                </a>
                <a href="#faq" className="transition hover:text-white">
                  FAQ
                </a>
              </nav>

              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="hidden text-sm font-medium text-white/80 transition hover:text-white sm:inline-flex"
                >
                  Log in
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center rounded-2xl bg-[#9b7cf7] px-5 py-3 text-sm font-semibold text-[#171321] transition hover:scale-[1.02] hover:bg-[#ab91ff]"
                >
                  Get started
                </Link>
              </div>
            </div>
          </header>

          <section className="grid gap-16 px-2 pb-8 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#8d73e6]/35 bg-[#8d73e6]/12 px-4 py-2 text-sm font-medium text-[#b8a3ff]">
                <Sparkle size={16} weight="fill" />
                New: modern attendance for faster classrooms
              </div>

              <h1
                className="mt-8 max-w-xl text-5xl font-bold leading-none text-white sm:text-6xl lg:text-[76px]"
                style={{ fontFamily: '"Space Grotesk", "Inter", sans-serif' }}
              >
                Smart attendance,
                <span className="mt-2 block text-[#9b7cf7]">
                  simplified for all.
                </span>
              </h1>

              <p className="mt-8 max-w-xl text-lg leading-9 text-white/70">
                Eliminate paper sheets and manual entry. AstraAttend gives
                schools a secure, fast, and polished way to handle classroom
                attendance with QR-based check-ins and live records.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-2xl bg-[#9b7cf7] px-7 py-4 text-base font-semibold text-[#171321] shadow-[0_20px_50px_rgba(155,124,247,0.24)] transition hover:-translate-y-0.5 hover:bg-[#ac92ff]"
                >
                  Get Started for Free
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/[0.02] px-7 py-4 text-base font-semibold text-white transition hover:border-white/35 hover:bg-white/[0.05]"
                >
                  Explore Features
                </a>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-4 text-sm text-white/45">
                <div className="flex -space-x-3">
                  {["U1", "U2", "U3", "U4"].map((item) => (
                    <div
                      key={item}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/6 bg-white/8 text-xs font-semibold text-white/70 backdrop-blur-sm"
                    >
                      {item}
                    </div>
                  ))}
                </div>
                <span className="font-semibold uppercase tracking-[0.24em]">
                  Trusted by 5,000+ educators
                </span>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 rounded-[36px] bg-[radial-gradient(circle_at_center,rgba(155,124,247,0.22),transparent_55%)] blur-3xl" />
              <div className="relative rounded-[32px] border border-white/8 bg-white/[0.03] p-4 shadow-[0_30px_70px_rgba(0,0,0,0.28)]">
                <div className="relative overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(140deg,#1c2440_0%,#162033_30%,#2a5f95_62%,#c67a74_100%)] p-6 min-h-[420px]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.35),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,235,196,0.18),transparent_26%)]" />
                  <div className="absolute right-8 top-8 h-36 w-36 rounded-full bg-white/15 blur-2xl" />
                  <div className="absolute bottom-0 right-0 h-56 w-56 rounded-tl-[120px] bg-black/15 backdrop-blur-[1px]" />

                  <div className="relative z-10 flex h-full flex-col justify-between">
                    <div className="grid grid-cols-5 gap-2 opacity-25">
                      {Array.from({ length: 25 }).map((_, index) => (
                        <div
                          key={index}
                          className="h-4 rounded-full bg-white/80"
                        />
                      ))}
                    </div>

                    <div className="max-w-[240px] rounded-[26px] border border-white/15 bg-[#1d1627]/92 p-5 shadow-[0_20px_50px_rgba(20,17,29,0.38)] backdrop-blur-xl">
                      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300">
                        <CalendarDots size={24} weight="duotone" />
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
                        Session active
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-white">
                        CS101: Web Dev
                      </h3>
                      <div className="mt-5 rounded-[22px] bg-white p-4">
                        <div className="grid grid-cols-5 gap-1">
                          {Array.from({ length: 25 }).map((_, index) => (
                            <div
                              key={index}
                              className={`aspect-square rounded-sm ${
                                index % 3 === 0
                                  ? "bg-slate-300"
                                  : "bg-slate-100"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-10 -left-8 hidden w-44 rounded-[26px] border border-white/10 bg-[#1d1827]/94 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl md:block">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2a2f4e] text-[#7dd3fc]">
                  <ListChecks size={24} weight="duotone" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7dd3fc]">
                  Live records
                </p>
                <p className="mt-3 text-sm leading-6 text-white/72">
                  Instant logs keep each session organized and visible the moment
                  students check in.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-10">
        <section id="features" className="py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#9b7cf7]">
              Why schools choose AstraAttend
            </p>
            <h2
              className="mt-5 text-4xl font-bold text-white sm:text-5xl"
              style={{ fontFamily: '"Space Grotesk", "Inter", sans-serif' }}
            >
              Everything needed to manage presence without the admin headache.
            </h2>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {featureCards.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="rounded-[28px] border border-white/6 bg-white/[0.03] p-8 shadow-[0_20px_40px_rgba(0,0,0,0.16)]"
              >
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-[#2a2140] text-[#9b7cf7]">
                  <Icon size={30} weight="duotone" />
                </div>
                <h3 className="mt-8 text-2xl font-semibold text-white">
                  {title}
                </h3>
                <p className="mt-5 text-base leading-8 text-white/68">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#9b7cf7]">
              Get running in 3 minutes
            </p>
            <h2
              className="mt-5 text-4xl font-bold text-white sm:text-5xl"
              style={{ fontFamily: '"Space Grotesk", "Inter", sans-serif' }}
            >
              A straightforward attendance flow for teachers and students.
            </h2>
          </div>

          <div className="mt-18 grid gap-12 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="relative pt-10 text-center">
                {index < steps.length - 1 && (
                  <div className="absolute left-[58%] top-14 hidden h-px w-[85%] border-t border-dashed border-[#5a4e75] md:block" />
                )}
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#9b7cf7] text-lg font-bold text-[#171321] shadow-[0_12px_30px_rgba(155,124,247,0.28)]">
                  {step.number}
                </div>
                <h3 className="mt-8 text-2xl font-semibold text-white">
                  {step.title}
                </h3>
                <p className="mx-auto mt-4 max-w-xs text-base leading-8 text-white/68">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-20">
          <div className="grid gap-12 rounded-[36px] border border-white/6 bg-white/[0.03] p-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:p-14">
            <div className="relative overflow-hidden rounded-[30px] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.3),transparent_22%),linear-gradient(135deg,#d7c4a8_0%,#6c6358_18%,#2b2b33_46%,#15141d_100%)] p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(255,244,210,0.18),transparent_25%)]" />
              <div className="absolute inset-y-0 left-0 w-28 bg-white/15 blur-2xl" />
              <PhoneMockup />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#9b7cf7]">
                Built for the modern mobile educator
              </p>
              <h2
                className="mt-5 max-w-md text-4xl font-bold text-white sm:text-5xl"
                style={{ fontFamily: '"Space Grotesk", "Inter", sans-serif' }}
              >
                Designed for classrooms that move quickly.
              </h2>
              <div className="mt-8 space-y-6">
                {mobileFeatures.map((feature) => (
                  <div key={feature} className="flex gap-4">
                    <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#2a2140] text-[#9b7cf7]">
                      <CheckCircle size={16} weight="fill" />
                    </div>
                    <p className="text-base leading-8 text-white/72">{feature}</p>
                  </div>
                ))}
              </div>

              <Link
                to="/login"
                className="mt-10 inline-flex items-center gap-3 rounded-2xl bg-[#9b7cf7] px-6 py-4 text-base font-semibold text-[#171321] transition hover:-translate-y-0.5 hover:bg-[#ac92ff]"
              >
                Try it now
                <ArrowRight size={18} weight="bold" />
              </Link>
            </div>
          </div>
        </section>

        <section id="faq" className="py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#9b7cf7]">
              Frequently asked questions
            </p>
            <h2
              className="mt-5 text-4xl font-bold text-white sm:text-5xl"
              style={{ fontFamily: '"Space Grotesk", "Inter", sans-serif' }}
            >
              Quick answers before you roll this out campus-wide.
            </h2>
          </div>

          <div className="mx-auto mt-14 max-w-4xl space-y-4">
            {faqs.map((item, index) => {
              const isOpen = openFaq === index;

              return (
                <button
                  key={item.question}
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? -1 : index)}
                  className="w-full rounded-[24px] border border-white/10 bg-white/[0.03] p-6 text-left transition hover:border-white/20 hover:bg-white/[0.045]"
                >
                  <div className="flex items-center justify-between gap-6">
                    <h3 className="text-xl font-semibold text-white">
                      {item.question}
                    </h3>
                    {isOpen ? (
                      <Minus size={20} className="text-white/70" />
                    ) : (
                      <Plus size={20} className="text-white/70" />
                    )}
                  </div>
                  {isOpen && (
                    <p className="mt-4 max-w-3xl text-base leading-8 text-white/68">
                      {item.answer}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section className="py-20">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#9b7cf7]">
                Trusted by growing institutions
              </p>
              <h2
                className="mt-5 max-w-md text-4xl font-bold text-white sm:text-5xl"
                style={{ fontFamily: '"Space Grotesk", "Inter", sans-serif' }}
              >
                From classrooms to seminars, attendance stays organized.
              </h2>
              <div className="mt-10 grid grid-cols-2 gap-5">
                {institutionNames.map((name, index) => (
                  <div
                    key={name}
                    className="flex items-center gap-3 rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-4 text-white/40"
                  >
                    {index % 2 === 0 ? (
                      <DeviceMobile size={20} />
                    ) : (
                      <ShieldCheck size={20} />
                    )}
                    <span className="text-lg font-semibold uppercase tracking-wide">
                      {name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[34px] bg-[linear-gradient(135deg,#9b7cf7_0%,#af97ff_100%)] p-10 text-[#1b1328] shadow-[0_25px_60px_rgba(155,124,247,0.18)]">
              <h3
                className="max-w-md text-4xl font-bold leading-tight"
                style={{ fontFamily: '"Space Grotesk", "Inter", sans-serif' }}
              >
                Ready to digitize your classroom?
              </h3>
              <p className="mt-5 max-w-lg text-lg leading-8 text-[#2d2340]/88">
                Join educators using AstraAttend to save time on attendance and
                spend more time teaching.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-4 text-base font-semibold text-[#7b61d8] transition hover:bg-white/90"
                >
                  Get Started Free
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center rounded-2xl border border-[#1b1328]/15 px-6 py-4 text-base font-semibold text-[#2d2340] transition hover:bg-black/5"
                >
                  View features
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/8 bg-[#17131f]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 sm:px-8 lg:grid-cols-[1.15fr_0.85fr_0.85fr_0.85fr] lg:px-10">
          <div>
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="AstraAttend logo"
                className="h-10 w-10 rounded-2xl object-cover"
              />
              <span
                className="text-2xl font-bold text-[#aa90ff]"
                style={{ fontFamily: '"Space Grotesk", "Inter", sans-serif' }}
              >
                AstraAttend
              </span>
            </div>
            <p className="mt-5 max-w-sm text-base leading-8 text-white/60">
              A cleaner way for institutions to run attendance, reduce manual
              work, and keep records ready when they matter.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.24em] text-white/80">
              Product
            </h4>
            <div className="mt-5 space-y-3 text-white/58">
              <a href="#features" className="block transition hover:text-white">
                Features
              </a>
              <a
                href="#how-it-works"
                className="block transition hover:text-white"
              >
                Workflow
              </a>
              <Link to="/login" className="block transition hover:text-white">
                Get started
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.24em] text-white/80">
              Core use cases
            </h4>
            <div className="mt-5 space-y-3 text-white/58">
              <p>Daily classes</p>
              <p>Lab sessions</p>
              <p>Department seminars</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.24em] text-white/80">
              Support
            </h4>
            <div className="mt-5 space-y-3 text-white/58">
              <Link to="/login" className="block transition hover:text-white">
                Student login
              </Link>
              <Link to="/login" className="block transition hover:text-white">
                Teacher login
              </Link>
              <a href="#faq" className="block transition hover:text-white">
                FAQ
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-white/8 px-6 py-6 text-center text-sm text-white/40">
          © {year} AstraAttend. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
