import { List } from "@phosphor-icons/react";
import { useState } from "react";
import AdminSidebar from "./AdminSidebar";

export default function AdminShell({ user, navItems, activeTab, onTabChange, onLogout, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleTabChange = (tab) => {
    onTabChange(tab);
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#090b10] text-slate-100">
      <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(123,97,255,0.18),_transparent_28%),linear-gradient(180deg,_#111318_0%,_#090b10_100%)]">
        <div className="hidden xl:block">
          <AdminSidebar
            user={user}
            navItems={navItems}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onLogout={onLogout}
          />
        </div>

        {mobileOpen ? (
          <div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm xl:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <div className="h-full w-[min(88vw,320px)]" onClick={(event) => event.stopPropagation()}>
              <AdminSidebar
                user={user}
                navItems={navItems}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                onLogout={onLogout}
              />
            </div>
          </div>
        ) : null}

        <main className="min-w-0 flex-1 px-3 py-3 sm:px-6 xl:px-8">
          <div className="mb-4 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur xl:hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Attendance Manager</p>
                <p className="text-xs text-slate-400">Admin workspace</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200"
              >
                <List size={18} />
              </button>
            </div>

            <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto pb-1">
              {navItems.map((item) => {
                const active = item.key === activeTab;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleTabChange(item.key)}
                    className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
                      active ? "bg-[#7b61ff] text-white" : "border border-white/10 bg-white/[0.03] text-slate-300"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
