import { BellSimple, CheckCircle, ClockCounterClockwise, X } from "@phosphor-icons/react";

function toneStyles(tone) {
  if (tone === "success") return "bg-emerald-500/12 text-emerald-200 border-emerald-400/20";
  if (tone === "warning") return "bg-amber-500/12 text-amber-200 border-amber-400/20";
  return "bg-sky-500/12 text-sky-200 border-sky-400/20";
}

export default function StudentNotificationCenter({ open, notifications, unreadCount, onClose, onMarkAllRead }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="absolute right-0 top-0 h-full w-full max-w-md border-l border-white/8 bg-[#121722] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7b61ff]/15 text-[#aa9fff]">
                <BellSimple size={18} />
              </div>
              <div>
                <p className="font-['Space_Grotesk'] text-xl font-bold text-white">Notification Center</p>
                <p className="text-xs text-slate-500">{unreadCount} unread alerts</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03] text-slate-300"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm text-slate-400">Live sessions, attendance updates aur reminders yahan ayenge.</p>
          <button type="button" onClick={onMarkAllRead} className="text-xs font-semibold text-[#66d5ff]">
            Mark all read
          </button>
        </div>

        <div className="mt-6 space-y-3 overflow-y-auto pr-1">
          {notifications.length ? (
            notifications.map((item) => (
              <div key={item.id} className="rounded-[22px] border border-white/8 bg-[#171d2a] p-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl border ${toneStyles(item.tone)}`}>
                    {item.tone === "success" ? <CheckCircle size={18} weight="fill" /> : <ClockCounterClockwise size={18} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      {!item.read ? <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#2dc6ef]" /> : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-400">{item.message}</p>
                    <p className="mt-3 text-xs text-slate-500">{item.timeLabel}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[22px] border border-white/8 bg-[#171d2a] p-5 text-sm text-slate-400">
              No notifications yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
