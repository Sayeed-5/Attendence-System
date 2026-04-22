import { BellSimple, GearSix, Sparkle } from "@phosphor-icons/react";

const brandName = "AstraAttend";

export default function StudentHeader({
  activeTab,
  navItems,
  activeSession,
  unreadCount,
  onOpenNotifications,
  onOpenProfile,
  onTabChange,
}) {
  return (
    <section className="mb-7">
      <div className="rounded-[26px] border border-white/6 bg-[#191e2a]/96 px-4 py-4 shadow-[0_14px_36px_rgba(0,0,0,0.22)] sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src="/logo.png"
              alt="AstraAttend logo"
              className="h-11 w-11 shrink-0 rounded-2xl object-cover shadow-[0_14px_28px_rgba(46,200,239,0.22)]"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate font-['Space_Grotesk'] text-lg font-bold tracking-tight text-white">{brandName}</p>
                <span className="hidden rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 sm:inline-flex">
                  Student Hub
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {activeSession?.subject
                  ? `Live now: ${activeSession.subject}`
                  : "Realtime attendance, alerts and history in one place."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenNotifications}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-[#141a26] text-slate-300 transition hover:bg-white/[0.05]"
              aria-label="Open notifications"
            >
              <BellSimple size={19} />
              {unreadCount > 0 ? (
                <span className="absolute right-2 top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff5d8f] px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={onOpenProfile}
              className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-[#141a26] text-slate-300 transition hover:bg-white/[0.05] lg:inline-flex"
              aria-label="Open settings"
            >
              <GearSix size={18} weight="bold" />
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 lg:hidden">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-[#141a26] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
            <Sparkle size={12} />
            {activeSession ? "Session Live" : "Standby"}
          </span>
          <span className="rounded-full border border-white/8 bg-[#141a26] px-3 py-2 text-[11px] font-medium text-slate-400">
            {unreadCount} notifications
          </span>
        </div>

        <div className="mt-4 hidden items-center justify-between gap-3 lg:flex">
          <div className="flex items-center gap-1 rounded-[16px] border border-white/6 bg-[#141a26] p-1">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => onTabChange(item.key)}
                className={`rounded-[12px] px-5 py-2 text-sm font-semibold transition ${
                  activeTab === item.key ? "bg-[#2dc6ef] text-[#05131d]" : "text-slate-400 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-200">
              {activeSession ? "1 active session" : "No live session"}
            </div>
            <button
              type="button"
              onClick={onOpenProfile}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/5"
              aria-label="Open profile"
            >
              <GearSix size={18} weight="bold" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
