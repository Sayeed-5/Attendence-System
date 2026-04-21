import {
  BookOpen,
  CalendarBlank,
  ChalkboardTeacher,
  House,
  SignOut,
  Users,
} from "@phosphor-icons/react";

function BrandMark() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7b61ff]/20 text-[#9d8cff] ring-1 ring-inset ring-[#7b61ff]/35">
      <div className="h-4 w-4 rotate-45 rounded-[4px] border-2 border-current" />
    </div>
  );
}

export const adminNavItems = [
  { key: "overview", label: "Overview", icon: House },
  { key: "students", label: "Students", icon: Users },
  { key: "teachers", label: "Teachers", icon: ChalkboardTeacher },
  { key: "sessions", label: "Sessions", icon: CalendarBlank },
  { key: "attendance", label: "Attendance", icon: BookOpen },
];

export default function AdminSidebar({ user, navItems, activeTab, onTabChange, onLogout }) {
  return (
    <aside className="flex h-full min-h-screen w-full max-w-[320px] flex-col border-r border-white/8 bg-[#171a1f]/95">
      <div className="border-b border-white/8 px-6 py-6">
        <div className="flex items-center gap-3">
          <BrandMark />
          <div>
            <p className="font-['Space_Grotesk'] text-xl font-bold tracking-tight text-[#8e7dff]">AttendanceMgr</p>
            <p className="text-xs text-slate-400">Admin control center</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-6">
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.key === activeTab;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onTabChange(item.key)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                  active
                    ? "bg-[#7b61ff] text-white shadow-[0_14px_30px_rgba(123,97,255,0.3)]"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={18} weight={active ? "fill" : "regular"} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-white/8 px-6 py-5">
        <div className="mb-4 rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Signed in</p>
          <p className="mt-2 text-sm font-semibold text-white">{user?.name || "Admin User"}</p>
          <p className="text-xs text-slate-400">{user?.email || "admin@attendance.local"}</p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-200 transition hover:bg-rose-500/15"
        >
          <SignOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
