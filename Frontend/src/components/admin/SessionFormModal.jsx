import { X } from "@phosphor-icons/react";

const inputClassName =
  "w-full rounded-2xl border border-white/10 bg-[#11141a] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#7b61ff]/70 focus:ring-2 focus:ring-[#7b61ff]/20";

export default function SessionFormModal({
  open,
  form,
  teachers,
  onChange,
  onClose,
  onSubmit,
  submitting,
  mode = "create",
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-[30px] border border-white/10 bg-[#181b22] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[#8e7dff]">Session planner</p>
            <h3 className="mt-2 font-['Space_Grotesk'] text-2xl font-bold text-white">
              {mode === "edit" ? "Edit Session" : "Create Session"}
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              Schedule, faculty aur location fields editable hain. Active toggle ke through session immediately open bhi kar sakte ho.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Teacher</span>
            <select
              required
              value={form.teacherId}
              onChange={(event) => onChange("teacherId", event.target.value)}
              className={inputClassName}
            >
              <option value="">Select teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher.id || teacher._id} value={teacher.id || teacher._id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Subject</span>
            <input
              required
              value={form.subject}
              onChange={(event) => onChange("subject", event.target.value)}
              placeholder="Advanced Mathematics"
              className={inputClassName}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Start time</span>
            <input
              type="datetime-local"
              value={form.startTime}
              onChange={(event) => onChange("startTime", event.target.value)}
              className={inputClassName}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Duration (minutes)</span>
            <input
              type="number"
              min="15"
              value={form.timeLimit}
              onChange={(event) => onChange("timeLimit", Number(event.target.value))}
              placeholder="60"
              className={inputClassName}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Location label</span>
            <input
              value={form.locationLabel}
              onChange={(event) => onChange("locationLabel", event.target.value)}
              placeholder="Hall B / Room 204"
              className={inputClassName}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Radius</span>
            <input
              type="number"
              min="10"
              value={form.radius}
              onChange={(event) => onChange("radius", Number(event.target.value))}
              placeholder="100"
              className={inputClassName}
            />
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#11141a] px-4 py-3 text-sm text-slate-200 sm:col-span-2">
            <input
              type="checkbox"
              checked={Boolean(form.isActive)}
              onChange={(event) => onChange("isActive", event.target.checked)}
              className="h-4 w-4 rounded border-white/10 bg-transparent"
            />
            Start this session as active
          </label>

          <div className="flex items-end justify-end gap-3 sm:col-span-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-[#7b61ff] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(123,97,255,0.32)] transition hover:bg-[#8b73ff] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Saving..." : mode === "edit" ? "Update Session" : "Create Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
