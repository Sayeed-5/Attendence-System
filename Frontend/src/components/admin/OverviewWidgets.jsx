import { ArrowRight, CalendarBlank, ChartBar, ClockClockwise, UsersThree } from "@phosphor-icons/react";
import SectionCard from "./SectionCard";
import { formatShortDateTime, formatTimeOnly } from "./adminUtils";

export function MetricTile({ icon: Icon, title, value, hint, change }) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-[#16191f]/90 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.22)] sm:rounded-[28px] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7b61ff]/15 text-[#9b8dff] ring-1 ring-inset ring-[#7b61ff]/25">
          <Icon size={20} />
        </div>
        <span className={`text-xs font-semibold ${change?.startsWith("-") ? "text-rose-300" : "text-emerald-300"}`}>
          {change}
        </span>
      </div>
      <p className="mt-5 text-sm text-slate-400">{title}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

export function TrendChartCard({ title, description, points }) {
  const width = 520;
  const height = 220;
  const maxValue = Math.max(...points.map((point) => point.percentage), 100);
  const path = points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * width;
      const y = height - (point.percentage / maxValue) * height;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <SectionCard title={title} description={description}>
      <div className="overflow-x-auto rounded-[24px] border border-white/8 bg-[#11141a] p-3 sm:p-4">
        <svg viewBox={`0 0 ${width} ${height + 28}`} className="h-[220px] min-w-[480px] w-full sm:h-[240px]">
          {[0, 25, 50, 75, 100].map((tick) => {
            const y = height - (tick / 100) * height;
            return (
              <g key={tick}>
                <line x1="0" y1={y} x2={width} y2={y} stroke="rgba(148,163,184,0.12)" strokeDasharray="4 5" />
                <text x="0" y={y - 6} fill="rgba(148,163,184,0.5)" fontSize="11">
                  {tick}%
                </text>
              </g>
            );
          })}
          <path d={path} fill="none" stroke="#7b61ff" strokeWidth="3" strokeLinecap="round" />
          {points.map((point, index) => {
            const x = (index / Math.max(points.length - 1, 1)) * width;
            const y = height - (point.percentage / maxValue) * height;
            return <circle key={point.label} cx={x} cy={y} r="4" fill="#9b8dff" />;
          })}
          {points.map((point, index) => {
            const x = (index / Math.max(points.length - 1, 1)) * width;
            return (
              <text key={`${point.label}-label`} x={x} y={height + 18} textAnchor="middle" fill="rgba(148,163,184,0.7)" fontSize="11">
                {point.label}
              </text>
            );
          })}
        </svg>
      </div>
    </SectionCard>
  );
}

export function DonutBreakdownCard({ title, description, items, total }) {
  let currentOffset = 0;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  return (
    <SectionCard title={title} description={description}>
      <div className="flex flex-col items-center gap-5 rounded-[24px] border border-white/8 bg-[#11141a] p-5">
        <div className="relative">
          <svg viewBox="0 0 180 180" className="h-36 w-36 -rotate-90 sm:h-44 sm:w-44">
            <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(148,163,184,0.14)" strokeWidth="16" />
            {items.map((item) => {
              const value = total ? (item.value / total) * circumference : 0;
              const dash = `${value} ${circumference - value}`;
              const node = (
                <circle
                  key={item.label}
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth="16"
                  strokeDasharray={dash}
                  strokeDashoffset={-currentOffset}
                  strokeLinecap="round"
                />
              );
              currentOffset += value;
              return node;
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-3xl font-semibold text-white">{total}</p>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Cases</p>
          </div>
        </div>

        <div className="grid w-full gap-3">
          {items.map((item) => (
            <div key={item.label} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                {item.label}
              </div>
              <span className="text-white">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

export function OccupancyBarCard({ title, description, bars }) {
  return (
    <SectionCard title={title} description={description}>
      <div className="overflow-x-auto rounded-[24px] border border-white/8 bg-[#11141a] p-4 sm:p-5">
        <div className="flex h-[210px] min-w-[300px] items-end justify-between gap-3 sm:gap-4">
          {bars.map((bar) => (
            <div key={bar.label} className="flex flex-1 flex-col items-center gap-3">
              <div className="flex h-[170px] w-full items-end rounded-full bg-white/[0.04] px-1.5 py-1.5">
                <div
                  className="w-full rounded-full bg-[linear-gradient(180deg,_#67e8f9_0%,_#4f46e5_100%)]"
                  style={{ height: `${Math.max(bar.value, 6)}%` }}
                />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-white">{bar.label}</p>
                <p className="text-[11px] text-slate-500">{bar.value}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

export function RecentActivityCard({ title, items }) {
  return (
    <SectionCard
      title={title}
      description="System tags, marking events aur session changes ka quick recap."
      action={
        <button type="button" className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-200">
          View All Logs
        </button>
      }
    >
      <div className="rounded-[24px] border border-white/8 bg-[#11141a] p-4">
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <div
                className={`mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full ${
                  item.accent === "session" ? "bg-[#7b61ff]/18 text-[#aa9fff]" : "bg-cyan-500/12 text-cyan-200"
                }`}
              >
                {item.accent === "session" ? <CalendarBlank size={18} /> : <ClockClockwise size={18} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="mt-1 text-xs text-slate-400">{item.meta}</p>
              </div>
              <span className="shrink-0 text-[11px] text-slate-500">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

export function UpcomingSessionsCard({ sessions, onManageSessions }) {
  return (
    <SectionCard
      title="Upcoming Sessions"
      description="Classes scheduled for the next 24 hours."
      action={
        <button
          type="button"
          onClick={onManageSessions}
          className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-200"
        >
          Manage All Sessions
        </button>
      }
    >
      <div className="space-y-3 lg:hidden">
        {sessions.map((session, index) => (
          <div key={session.rowId} className="rounded-[22px] border border-white/8 bg-[#11141a] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-slate-500">{`S-${String(index + 901).padStart(3, "0")}`}</p>
                <p className="mt-1 font-semibold text-white">{session.subject}</p>
                <p className="mt-1 text-sm text-slate-400">{session.teacher?.name || "Unassigned"}</p>
              </div>
              <button
                type="button"
                onClick={onManageSessions}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200"
              >
                Open
                <ArrowRight size={14} />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Schedule</p>
                <p className="mt-1 text-slate-200">{formatTimeOnly(session.startTime)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Location</p>
                <p className="mt-1 text-slate-200">{session.locationLabel}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-[24px] border border-white/8 lg:block">
        <div className="overflow-x-auto bg-[#11141a]">
          <table className="min-w-full">
            <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-4 py-4 text-left">ID</th>
                <th className="px-4 py-4 text-left">Session Title</th>
                <th className="px-4 py-4 text-left">Teacher</th>
                <th className="px-4 py-4 text-left">Schedule</th>
                <th className="px-4 py-4 text-left">Location</th>
                <th className="px-4 py-4 text-left">Status</th>
                <th className="px-4 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session, index) => (
                <tr key={session.rowId} className="border-t border-white/8 text-sm text-slate-200">
                  <td className="px-4 py-4 text-xs text-slate-400">{`S-${String(index + 901).padStart(3, "0")}`}</td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-white">{session.subject}</p>
                    <p className="mt-1 text-xs text-slate-500">{session.teacher?.dept || "Faculty session"}</p>
                  </td>
                  <td className="px-4 py-4">{session.teacher?.name || "Unassigned"}</td>
                  <td className="px-4 py-4">
                    <p>{formatTimeOnly(session.startTime)}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatShortDateTime(session.startTime)}</p>
                  </td>
                  <td className="px-4 py-4">{session.locationLabel}</td>
                  <td className="px-4 py-4">{session.statusLabel}</td>
                  <td className="px-4 py-4 text-right">
                    <button
                      type="button"
                      onClick={onManageSessions}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200"
                    >
                      Open
                      <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>
  );
}

export const overviewMetricIcons = {
  students: UsersThree,
  teachers: UsersThree,
  sessions: CalendarBlank,
  attendance: ChartBar,
  absences: ClockClockwise,
};
