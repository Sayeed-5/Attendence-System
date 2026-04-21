import { X } from "@phosphor-icons/react";

const inputClassName =
  "w-full rounded-2xl border border-white/10 bg-[#11141a] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#7b61ff]/70 focus:ring-2 focus:ring-[#7b61ff]/20";

export default function StudentFormModal({ open, form, onChange, onClose, onSubmit, submitting }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[30px] border border-white/10 bg-[#181b22] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[#8e7dff]">New student</p>
            <h3 className="mt-2 font-['Space_Grotesk'] text-2xl font-bold text-white">Add Student</h3>
            <p className="mt-2 text-sm text-slate-400">
              Name, email aur password required hain. Baaki fields optional hain aur profile details ke liye use hongi.
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
            <span className="mb-2 block text-sm text-slate-300">Full name</span>
            <input
              required
              value={form.name}
              onChange={(event) => onChange("name", event.target.value)}
              placeholder="Student name"
              className={inputClassName}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Email</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => onChange("email", event.target.value)}
              placeholder="student@example.com"
              className={inputClassName}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Password</span>
            <input
              required
              type="password"
              value={form.password}
              onChange={(event) => onChange("password", event.target.value)}
              placeholder="Create password"
              className={inputClassName}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Registration no.</span>
            <input
              value={form.regNo}
              onChange={(event) => onChange("regNo", event.target.value)}
              placeholder="Optional"
              className={inputClassName}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Branch</span>
            <input
              value={form.branch}
              onChange={(event) => onChange("branch", event.target.value)}
              placeholder="CSE / ECE / ..."
              className={inputClassName}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Semester</span>
            <input
              value={form.semester}
              onChange={(event) => onChange("semester", event.target.value)}
              placeholder="6"
              className={inputClassName}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Mobile number</span>
            <input
              value={form.mobileNo}
              onChange={(event) => onChange("mobileNo", event.target.value)}
              placeholder="+91 9876543210"
              className={inputClassName}
            />
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
              {submitting ? "Adding..." : "Add Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
