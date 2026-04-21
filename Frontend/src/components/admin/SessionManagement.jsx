import {
  CalendarBlank,
  ClockCountdown,
  DownloadSimple,
  Eye,
  ListBullets,
  PencilSimple,
  Plus,
  Trash,
  UploadSimple,
} from "@phosphor-icons/react";
import { useMemo, useRef, useState } from "react";
import SectionCard from "./SectionCard";
import SessionFormModal from "./SessionFormModal";
import { enrichSessions } from "./adminInsights";
import { clampPercentage, formatShortDate, formatTimeOnly } from "./adminUtils";

const emptySessionForm = {
  teacherId: "",
  subject: "",
  startTime: "",
  timeLimit: 60,
  radius: 100,
  isActive: false,
  locationLabel: "",
};

function statusClassName(status) {
  if (status === "In Progress") return "bg-emerald-500/12 text-emerald-200 border-emerald-400/20";
  if (status === "Completed" || status === "Closed") return "bg-slate-500/12 text-slate-200 border-slate-400/20";
  if (status === "Starting Soon") return "bg-amber-500/12 text-amber-200 border-amber-400/20";
  return "bg-[#7b61ff]/12 text-[#c3bbff] border-[#7b61ff]/20";
}

function parseCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((item) => item.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((item) => item.trim());
    return headers.reduce((acc, header, index) => {
      acc[header] = values[index] || "";
      return acc;
    }, {});
  });
}

function downloadCsv(filename, rows) {
  const blob = new Blob([rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function SessionMetric({ title, value, hint, icon: Icon }) {
  return (
    <div className="rounded-[28px] border border-white/8 bg-[#16191f]/90 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.22)]">
      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7b61ff]/15 text-[#9b8dff] ring-1 ring-inset ring-[#7b61ff]/25">
        <Icon size={20} />
      </div>
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-2 text-4xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

function SessionCalendar({ sessions, onEdit, onDelete, onClose }) {
  const grouped = sessions.reduce((acc, session) => {
    const key = formatShortDate(session.startTime);
    if (!acc[key]) acc[key] = [];
    acc[key].push(session);
    return acc;
  }, {});

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Object.entries(grouped).map(([day, daySessions]) => (
        <SectionCard key={day} title={day} description={`${daySessions.length} scheduled sessions`}>
          <div className="space-y-3">
            {daySessions.map((session) => (
              <div key={session.rowId} className="rounded-2xl border border-white/8 bg-[#11141a] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{session.subject}</p>
                    <p className="mt-1 text-sm text-slate-400">{session.teacher?.name || "Unassigned faculty"}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {formatTimeOnly(session.startTime)} • {session.locationLabel}
                    </p>
                  </div>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClassName(session.statusLabel)}`}>
                    {session.statusLabel}
                  </span>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button type="button" onClick={() => onEdit(session)} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200">
                    Edit
                  </button>
                  <button type="button" onClick={() => onClose(session.rowId)} className="rounded-xl border border-sky-400/20 bg-sky-500/10 px-3 py-2 text-sm text-sky-200">
                    Close
                  </button>
                  <button type="button" onClick={() => onDelete(session.rowId)} className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ))}
    </div>
  );
}

export default function SessionManagement({
  sessions,
  teachers,
  students,
  records,
  onCreateSession,
  onUpdateSession,
  onDeleteSession,
  onCloseSession,
}) {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [form, setForm] = useState(emptySessionForm);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const enrichedSessions = useMemo(
    () => enrichSessions(sessions, teachers, records, students.length),
    [sessions, teachers, records, students.length]
  );

  const filteredSessions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return enrichedSessions;

    return enrichedSessions.filter((session) =>
      [session.subject, session.sessionCode, session.teacher?.name, session.locationLabel]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [search, enrichedSessions]);

  const todayCount = enrichedSessions.filter((session) => sameDay(session.startTime, new Date())).length;
  const avgCapacity = enrichedSessions.length
    ? clampPercentage(
        enrichedSessions.reduce((sum, session) => sum + session.occupancyPercentage, 0) / enrichedSessions.length
      )
    : 0;
  const pendingAttendance = enrichedSessions.filter((session) => session.statusLabel === "Completed" && session.attendedCount === 0).length;

  function sameDay(value, date) {
    if (!value) return false;
    return new Date(value).toDateString() === new Date(date).toDateString();
  }

  function SessionMobileCard({ session }) {
    return (
      <div className="rounded-[22px] border border-white/8 bg-[#11141a] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-slate-500">{session.sessionCode || session.rowId.slice(0, 8).toUpperCase()}</p>
            <p className="mt-1 font-semibold text-white">{session.subject}</p>
            <p className="mt-1 text-sm text-slate-400">{session.teacher?.name || "Unassigned"}</p>
          </div>
          <span className={`inline-flex shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${statusClassName(session.statusLabel)}`}>
            {session.statusLabel}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Date</p>
            <p className="mt-1 text-slate-200">{formatShortDate(session.startTime)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Time</p>
            <p className="mt-1 text-slate-200">{formatTimeOnly(session.startTime)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Location</p>
            <p className="mt-1 text-slate-200">{session.locationLabel}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Occupancy</p>
            <p className="mt-1 text-slate-200">{session.attendedCount}/{students.length} ({session.occupancyPercentage}%)</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button type="button" onClick={() => openEditModal(session)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-200">
            <PencilSimple size={16} />
          </button>
          <button type="button" onClick={() => onCloseSession(session.rowId)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-500/10 text-sky-200">
            <Eye size={16} />
          </button>
          <button type="button" onClick={() => onDeleteSession(session.rowId)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-400/20 bg-rose-500/10 text-rose-200">
            <Trash size={16} />
          </button>
        </div>
      </div>
    );
  }

  function toLocalInputValue(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  }

  function openCreateModal() {
    setModalMode("create");
    setForm({
      ...emptySessionForm,
      teacherId: teachers[0]?.id || teachers[0]?._id || "",
    });
    setShowModal(true);
  }

  function openEditModal(session) {
    setModalMode("edit");
    setForm({
      id: session.rowId,
      teacherId: session.teacherId,
      subject: session.subject,
      startTime: toLocalInputValue(session.startTime),
      timeLimit: session.timeLimit || 60,
      radius: session.radius || 100,
      isActive: Boolean(session.isActive),
      locationLabel: session.locationLabel || "",
    });
    setShowModal(true);
  }

  function closeModal() {
    if (submitting) return;
    setShowModal(false);
    setForm(emptySessionForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    const payload = {
      teacherId: form.teacherId,
      subject: form.subject,
      startTime: form.startTime ? new Date(form.startTime).toISOString() : undefined,
      timeLimit: Number(form.timeLimit) || 60,
      radius: Number(form.radius) || 100,
      isActive: Boolean(form.isActive),
      locationLabel: form.locationLabel,
    };

    try {
      if (modalMode === "edit" && form.id) {
        await onUpdateSession(form.id, payload);
      } else {
        await onCreateSession(payload);
      }
      closeModal();
    } finally {
      setSubmitting(false);
    }
  }

  function handleFormChange(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleExport() {
    const rows = [
      ["sessionCode", "subject", "teacher", "startTime", "location", "occupancy", "status"].join(","),
      ...filteredSessions.map((session) =>
        [
          session.sessionCode || "",
          `"${session.subject || ""}"`,
          `"${session.teacher?.name || ""}"`,
          session.startTime || "",
          `"${session.locationLabel || ""}"`,
          `${session.attendedCount}/${students.length || 0}`,
          `"${session.statusLabel}"`,
        ].join(",")
      ),
    ].join("\n");

    downloadCsv(`sessions-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }

  async function handleImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const rows = file.name.endsWith(".json") ? JSON.parse(text) : parseCsv(text);

      for (const row of rows) {
        const teacher = teachers.find(
          (item) =>
            item.email?.toLowerCase() === row.teacherEmail?.toLowerCase() ||
            item.name?.toLowerCase() === row.teacherName?.toLowerCase()
        );

        if (!teacher || !row.subject) continue;

        await onCreateSession({
          teacherId: teacher.id || teacher._id,
          subject: row.subject,
          startTime: row.startTime ? new Date(row.startTime).toISOString() : undefined,
          timeLimit: Number(row.timeLimit) || 60,
          radius: Number(row.radius) || 100,
          isActive: String(row.isActive || "").toLowerCase() === "true",
          locationLabel: row.locationLabel || row.location || "",
        });
      }
    } finally {
      event.target.value = "";
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SessionMetric title="Today's Sessions" value={todayCount} hint="Scheduled for today" icon={CalendarBlank} />
          <SessionMetric title="Capacity Utilization" value={`${avgCapacity}%`} hint="Average occupancy across sessions" icon={ListBullets} />
          <SessionMetric title="Pending Attendance" value={pendingAttendance} hint="Completed sessions with no marks yet" icon={ClockCountdown} />
        </div>

        <SectionCard
          title="Sessions List"
          description="Create, import, export, search aur schedule visualization sab ek reusable workspace me."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#7b61ff] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(123,97,255,0.32)] transition hover:bg-[#8b73ff]"
              >
                <Plus size={18} />
                Create Session
              </button>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200">
                <UploadSimple size={16} />
                Import
              </button>
              <button type="button" onClick={handleExport} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200">
                <DownloadSimple size={16} />
                Export
              </button>
            </div>
          }
        >
          <input ref={fileInputRef} type="file" accept=".csv,.json" hidden onChange={handleImport} />

          <div className="mb-5 flex flex-col gap-3 rounded-[24px] border border-white/8 bg-[#11141a] p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search title, code, teacher or location..."
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm ${viewMode === "list" ? "bg-white/10 text-white" : "border border-white/10 bg-white/[0.03] text-slate-300"}`}
              >
                <ListBullets size={16} />
                List
              </button>
              <button
                type="button"
                onClick={() => setViewMode("calendar")}
                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm ${viewMode === "calendar" ? "bg-white/10 text-white" : "border border-white/10 bg-white/[0.03] text-slate-300"}`}
              >
                <CalendarBlank size={16} />
                Calendar
              </button>
            </div>
          </div>

          {viewMode === "calendar" ? (
            <SessionCalendar sessions={filteredSessions} onEdit={openEditModal} onDelete={onDeleteSession} onClose={onCloseSession} />
          ) : (
            <>
              <div className="space-y-3 lg:hidden">
                {filteredSessions.map((session) => (
                  <SessionMobileCard key={session.rowId} session={session} />
                ))}
              </div>

              <div className="hidden overflow-hidden rounded-[24px] border border-white/8 lg:block">
                <div className="overflow-x-auto bg-[#11141a]">
                  <table className="min-w-full">
                    <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.18em] text-slate-500">
                      <tr>
                        <th className="px-4 py-4 text-left">Session ID</th>
                        <th className="px-4 py-4 text-left">Session Details</th>
                        <th className="px-4 py-4 text-left">Teacher</th>
                        <th className="px-4 py-4 text-left">Time & Date</th>
                        <th className="px-4 py-4 text-left">Location</th>
                        <th className="px-4 py-4 text-left">Occupancy</th>
                        <th className="px-4 py-4 text-left">Status</th>
                        <th className="px-4 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSessions.map((session) => (
                        <tr key={session.rowId} className="border-t border-white/8 text-sm text-slate-200">
                        <td className="px-4 py-4 text-xs text-slate-400">{session.sessionCode || session.rowId.slice(0, 8).toUpperCase()}</td>
                        <td className="px-4 py-4">
                          <p className="font-semibold text-white">{session.subject}</p>
                          <p className="mt-1 text-xs text-slate-500">{session.teacher?.dept || "Session"} </p>
                        </td>
                        <td className="px-4 py-4">{session.teacher?.name || "Unassigned"}</td>
                        <td className="px-4 py-4">
                          <p>{formatShortDate(session.startTime)}</p>
                          <p className="mt-1 text-xs text-slate-500">{formatTimeOnly(session.startTime)} ({session.timeLimit || 60} min)</p>
                        </td>
                        <td className="px-4 py-4">{session.locationLabel}</td>
                        <td className="px-4 py-4">
                          <div className="w-28">
                            <div className="mb-2 flex items-center justify-between text-xs">
                              <span>{session.attendedCount}/{students.length}</span>
                              <span>{session.occupancyPercentage}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-white/[0.06]">
                              <div className="h-2 rounded-full bg-[linear-gradient(90deg,_#7b61ff_0%,_#67e8f9_100%)]" style={{ width: `${session.occupancyPercentage}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClassName(session.statusLabel)}`}>
                            {session.statusLabel}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => openEditModal(session)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-200">
                              <PencilSimple size={16} />
                            </button>
                            <button type="button" onClick={() => onCloseSession(session.rowId)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-500/10 text-sky-200">
                              <Eye size={16} />
                            </button>
                            <button type="button" onClick={() => onDeleteSession(session.rowId)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-400/20 bg-rose-500/10 text-rose-200">
                              <Trash size={16} />
                            </button>
                          </div>
                        </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredSessions.length === 0 ? (
                    <div className="px-4 py-12 text-center">
                      <p className="text-lg font-semibold text-white">No sessions found</p>
                      <p className="mt-2 text-sm text-slate-400">Search adjust kijiye ya naya session create kijiye.</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </SectionCard>
      </div>

      <SessionFormModal
        open={showModal}
        mode={modalMode}
        form={form}
        teachers={teachers}
        onChange={handleFormChange}
        onClose={closeModal}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </>
  );
}
