import { useMemo } from "react";
import { buildOverviewInsights } from "./adminInsights";
import {
  DonutBreakdownCard,
  MetricTile,
  OccupancyBarCard,
  overviewMetricIcons,
  RecentActivityCard,
  TrendChartCard,
  UpcomingSessionsCard,
} from "./OverviewWidgets";

export default function AdminOverview({ students, teachers, sessions, records, onOpenSessions }) {
  const insights = useMemo(
    () => buildOverviewInsights({ students, teachers, sessions, records }),
    [students, teachers, sessions, records]
  );

  const absenceItems = [
    { label: "Medical", value: insights.absenceBreakdown.medical, color: "#7b61ff" },
    { label: "Personal", value: insights.absenceBreakdown.personal, color: "#67e8f9" },
    { label: "Unexcused", value: insights.absenceBreakdown.unexcused, color: "#ef4444" },
    { label: "Other", value: insights.absenceBreakdown.other, color: "#d4d4d8" },
  ];

  const metricItems = [
    {
      key: "students",
      title: "Total Students",
      value: insights.totalStudents.toLocaleString("en-IN"),
      hint: "Registered learners across the system",
      change: "+12%",
    },
    {
      key: "teachers",
      title: "Total Teachers",
      value: insights.totalTeachers.toLocaleString("en-IN"),
      hint: "Faculty profiles available for sessions",
      change: "+3%",
    },
    {
      key: "sessions",
      title: "Upcoming Sessions",
      value: insights.upcomingCount.toLocaleString("en-IN"),
      hint: "Planned and in-progress classes",
      change: "+15%",
    },
    {
      key: "attendance",
      title: "Attendance Rate",
      value: `${insights.attendanceRate}%`,
      hint: "Based on recorded present/flagged entries",
      change: "+1.5%",
    },
    {
      key: "absences",
      title: "Today's Absences",
      value: insights.todayAbsences.toLocaleString("en-IN"),
      hint: "Estimated from today attendance marks",
      change: "-4%",
    },
  ];

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.32em] text-[#8e7dff]">Overview</p>
        <h1 className="mt-2 font-['Space_Grotesk'] text-3xl font-bold text-white">Admin performance dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Real-time attendance summaries, activity feed aur upcoming sessions ek hi dashboard me.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metricItems.map((item) => (
          <MetricTile
            key={item.key}
            icon={overviewMetricIcons[item.key]}
            title={item.title}
            value={item.value}
            hint={item.hint}
            change={item.change}
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
        <TrendChartCard
          title="Weekly Attendance Trend"
          description="Attendance percentage captured across the last 7 days."
          points={insights.weeklyTrend}
        />
        <DonutBreakdownCard
          title="Absence Breakdown"
          description="Primary reasons surfaced from attendance records."
          items={absenceItems}
          total={insights.totalBreakdown}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <OccupancyBarCard
          title="Session Occupancy"
          description="Highest filled sessions compared to total student capacity."
          bars={insights.sessionOccupancy}
        />
        <RecentActivityCard title="Recent Activity" items={insights.recentActivity} />
      </div>

      <UpcomingSessionsCard sessions={insights.upcomingSessions} onManageSessions={onOpenSessions} />
    </section>
  );
}
