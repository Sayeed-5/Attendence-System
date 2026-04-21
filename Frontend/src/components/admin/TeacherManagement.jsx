import {
  CalendarDots,
  ChalkboardTeacher,
  MagnifyingGlass,
  Plus,
  Trash,
  UserList,
  X,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import SectionCard from "./SectionCard";
import { formatShortDate, getInitials } from "./adminUtils";

const emptyTeacherForm = {
  name: "",
  email: "",
  password: "",
  role: "teacher",
  dept: "",
  subject: "",
  mobileNo: "",
  date: "",
  branch: "",
};

const inputClassName =
  "w-full rounded-2xl border border-white/10 bg-[#11141a] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#7b61ff]/70 focus:ring-2 focus:ring-[#7b61ff]/20";

function buildStaffId(teacher, index) {
  const suffix = String(index + 1).padStart(3, "0");
  const year = teacher.createdAt ? new Date(teacher.createdAt).getFullYear() : new Date().getFullYear();
  return `TCH-${year}-${suffix}`;
}

function getTeacherSubjects(subject = "") {
  return String(subject)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function deriveTeacherStatus(teacher) {
  const subjects = getTeacherSubjects(teacher.subject);
  if (!teacher.dept || subjects.length === 0) return "Needs Setup";
  if (!teacher.mobileNo || !teacher.date) return "Profile Pending";
  return "Active";
}

function formatYearsFromDate(dateValue) {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";
  const years = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  return `${years.toFixed(1)} yrs`;
}

function StatCard({ icon: Icon, title, value, caption }) {
  return (
    <div className="rounded-[28px] border border-white/8 bg-[#16191f]/92 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.22)]">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7b61ff]/15 text-[#9b8dff] ring-1 ring-inset ring-[#7b61ff]/25">
        <Icon size={22} />
      </div>
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{caption}</p>
    </div>
  );
}

function TeacherAvatar({ teacher }) {
  if (teacher.profilePicture) {
    return <img src={teacher.profilePicture} alt={teacher.name} className="h-11 w-11 rounded-full object-cover ring-1 ring-white/10" />;
  }

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#7b61ff]/20 text-sm font-semibold text-[#b7acff] ring-1 ring-inset ring-[#7b61ff]/30">
      {getInitials(teacher.name)}
    </div>
  );
}

function TeacherStatusPill({ status }) {
  const styles = {
    Active: "bg-emerald-500/12 text-emerald-200 border-emerald-400/20",
    "Needs Setup": "bg-amber-500/12 text-amber-200 border-amber-400/20",
    "Profile Pending": "bg-sky-500/12 text-sky-200 border-sky-400/20",
  };

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${styles[status] || "bg-white/5 text-slate-200 border-white/10"}`}>
      {status}
    </span>
  );
}

function TeacherMobileCard({ teacher, onDeleteTeacher }) {
  return (
    <div className="rounded-[22px] border border-white/8 bg-[#11141a] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <TeacherAvatar teacher={teacher} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-white">{teacher.name || "-"}</p>
            <p className="mt-1 text-xs text-slate-500">{teacher.staffId}</p>
          </div>
        </div>
        <TeacherStatusPill status={teacher.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="col-span-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Contact</p>
          <p className="mt-1 text-slate-200">{teacher.email || "-"}</p>
          <p className="mt-1 text-xs text-slate-500">{teacher.mobileNo || "No phone added"}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Department</p>
          <p className="mt-1 text-slate-200">{teacher.dept || "-"}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Hire date</p>
          <p className="mt-1 text-slate-200">{teacher.date ? formatShortDate(teacher.date) : "Not added"}</p>
        </div>
        <div className="col-span-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Subjects</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {teacher.subjects.length ? teacher.subjects.map((subject) => (
              <span key={subject} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-slate-200">
                {subject}
              </span>
            )) : <span className="text-xs text-slate-500">No subjects yet</span>}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-slate-500">{teacher.branch || teacher.dept || "Pending faculty load"}</p>
        <button
          type="button"
          onClick={() => onDeleteTeacher(teacher.id || teacher._id)}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-400/20 bg-rose-500/10 text-rose-200"
          aria-label={`Delete ${teacher.name}`}
        >
          <Trash size={16} />
        </button>
      </div>
    </div>
  );
}

function TeacherFormModal({ open, form, onChange, onClose, onSubmit, submitting }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-[30px] border border-white/10 bg-[#181b22] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[#8e7dff]">Faculty record</p>
            <h3 className="mt-2 font-['Space_Grotesk'] text-2xl font-bold text-white">Add Teacher</h3>
            <p className="mt-2 text-sm text-slate-400">
              Teacher account create hone ke saath faculty profile details bhi save hongi.
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
            <input required value={form.name} onChange={(event) => onChange("name", event.target.value)} placeholder="Teacher name" className={inputClassName} />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Email</span>
            <input required type="email" value={form.email} onChange={(event) => onChange("email", event.target.value)} placeholder="teacher@school.edu" className={inputClassName} />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Password</span>
            <input required type="password" value={form.password} onChange={(event) => onChange("password", event.target.value)} placeholder="Create password" className={inputClassName} />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Department</span>
            <input value={form.dept} onChange={(event) => onChange("dept", event.target.value)} placeholder="Mathematics" className={inputClassName} />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Subjects</span>
            <input value={form.subject} onChange={(event) => onChange("subject", event.target.value)} placeholder="Physics, Robotics" className={inputClassName} />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Assigned classes</span>
            <input value={form.branch} onChange={(event) => onChange("branch", event.target.value)} placeholder="Grade 10-B, Grade 12-A" className={inputClassName} />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Mobile number</span>
            <input value={form.mobileNo} onChange={(event) => onChange("mobileNo", event.target.value)} placeholder="+91 9876543210" className={inputClassName} />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Hire date</span>
            <input type="date" value={form.date} onChange={(event) => onChange("date", event.target.value)} className={inputClassName} />
          </label>

          <div className="flex items-end justify-end gap-3 sm:col-span-2">
            <button type="button" onClick={onClose} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="rounded-2xl bg-[#7b61ff] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(123,97,255,0.32)] transition hover:bg-[#8b73ff] disabled:cursor-not-allowed disabled:opacity-70">
              {submitting ? "Adding..." : "Add Teacher"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TeacherManagement({ teachers, sessions, onAddTeacher, onDeleteTeacher, creatingTeacher }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [showAddModal, setShowAddModal] = useState(false);
  const [teacherForm, setTeacherForm] = useState(emptyTeacherForm);

  const teacherRows = useMemo(
    () =>
      teachers.map((teacher, index) => {
        const status = deriveTeacherStatus(teacher);
        return {
          ...teacher,
          staffId: buildStaffId(teacher, index),
          status,
          subjects: getTeacherSubjects(teacher.subject),
        };
      }),
    [teachers]
  );

  const filteredTeachers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return teacherRows.filter((teacher) => {
      const matchesStatus = statusFilter === "All Statuses" || teacher.status === statusFilter;
      if (!matchesStatus) return false;
      if (!query) return true;

      return [
        teacher.name,
        teacher.email,
        teacher.staffId,
        teacher.dept,
        teacher.subject,
        teacher.branch,
        teacher.mobileNo,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [search, statusFilter, teacherRows]);

  const activeTeachers = teacherRows.filter((teacher) => teacher.status === "Active").length;
  const classesCovered = useMemo(() => {
    const classSet = new Set();
    teacherRows.forEach((teacher) => {
      String(teacher.branch || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .forEach((item) => classSet.add(item));
    });
    return classSet.size;
  }, [teacherRows]);

  const averageTenure = useMemo(() => {
    const validDates = teacherRows
      .map((teacher) => (teacher.date ? new Date(teacher.date) : null))
      .filter((value) => value && !Number.isNaN(value.getTime()));

    if (!validDates.length) return "0.0 yrs";

    const averageYears =
      validDates.reduce((sum, date) => sum + (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365.25), 0) /
      validDates.length;

    return `${averageYears.toFixed(1)} yrs`;
  }, [teacherRows]);

  const sessionLoads = useMemo(() => {
    if (!sessions.length) return 0;
    const uniqueSubjects = new Set(sessions.map((session) => session.subject).filter(Boolean));
    return uniqueSubjects.size;
  }, [sessions]);

  const handleFormChange = (key, value) => {
    setTeacherForm((current) => ({ ...current, [key]: value }));
  };

  const handleCloseModal = () => {
    if (creatingTeacher) return;
    setShowAddModal(false);
    setTeacherForm(emptyTeacherForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const created = await onAddTeacher(teacherForm);
    if (!created) return;
    setShowAddModal(false);
    setTeacherForm(emptyTeacherForm);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={ChalkboardTeacher} title="Total Teachers" value={teacherRows.length} caption="Faculty accounts in system" />
          <StatCard icon={UserList} title="Active Now" value={activeTeachers} caption="Profiles ready for daily use" />
          <StatCard icon={CalendarDots} title="Classes Covered" value={classesCovered || sessionLoads} caption="Combined assigned loads" />
          <StatCard icon={CalendarDots} title="Avg. Tenured" value={averageTenure} caption="Based on hire date records" />
        </div>

        <SectionCard
          title="Faculty Staff List"
          description="Manage institutional teaching resources, subjects and assigned classes without touching the student screen."
          action={
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#7b61ff] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(123,97,255,0.32)] transition hover:bg-[#8b73ff]"
            >
              <Plus size={18} />
              Add Teacher
            </button>
          }
        >
          <div className="mb-5 flex flex-col gap-3 rounded-[24px] border border-white/8 bg-[#11141a] p-4 lg:flex-row lg:items-center">
            <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <MagnifyingGlass size={18} className="text-slate-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, ID, dept, subject..."
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200 outline-none"
            >
              <option>All Statuses</option>
              <option>Active</option>
              <option>Needs Setup</option>
              <option>Profile Pending</option>
            </select>
          </div>

          <div className="space-y-3 lg:hidden">
            {filteredTeachers.map((teacher) => (
              <TeacherMobileCard key={teacher.id || teacher._id} teacher={teacher} onDeleteTeacher={onDeleteTeacher} />
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-[24px] border border-white/8 lg:block">
            <div className="overflow-x-auto bg-[#11141a]">
              <table className="min-w-full">
                <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="px-4 py-4 text-left">Teacher Profile</th>
                    <th className="px-4 py-4 text-left">Staff ID</th>
                    <th className="px-4 py-4 text-left">Contact Details</th>
                    <th className="px-4 py-4 text-left">Subjects &amp; Loads</th>
                    <th className="px-4 py-4 text-left">Status</th>
                    <th className="px-4 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.map((teacher) => (
                    <tr key={teacher.id || teacher._id} className="border-t border-white/8 text-sm text-slate-200 transition hover:bg-white/[0.03]">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <TeacherAvatar teacher={teacher} />
                          <div>
                            <p className="font-semibold text-white">{teacher.name || "-"}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              Hire date: {teacher.date ? formatShortDate(teacher.date) : "Not added"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="rounded-2xl bg-white/[0.05] px-3 py-2 text-sm font-semibold text-slate-200">
                          {teacher.staffId}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p>{teacher.email || "-"}</p>
                        <p className="mt-1 text-xs text-slate-500">{teacher.mobileNo || "No phone added"}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          {teacher.subjects.length ? teacher.subjects.map((subject) => (
                            <span key={subject} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-slate-200">
                              {subject}
                            </span>
                          )) : <span className="text-xs text-slate-500">No subjects yet</span>}
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                          Assigned: {teacher.branch || teacher.dept || "Pending faculty load"}
                        </p>
                        <p className="mt-1 text-xs text-slate-600">{formatYearsFromDate(teacher.date)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <TeacherStatusPill status={teacher.status} />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => onDeleteTeacher(teacher.id || teacher._id)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-400/20 bg-rose-500/10 text-rose-200 transition hover:bg-rose-500/15"
                          aria-label={`Delete ${teacher.name}`}
                        >
                          <Trash size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredTeachers.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <p className="text-lg font-semibold text-white">No teachers found</p>
                  <p className="mt-2 text-sm text-slate-400">Search ya status filter change kijiye, ya naya teacher add kijiye.</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing <span className="font-semibold text-white">{filteredTeachers.length}</span> of{" "}
              <span className="font-semibold text-white">{teacherRows.length}</span> faculty members
            </p>
            <p>Teacher data backend ke existing profile fields se hi render ho raha hai.</p>
          </div>
        </SectionCard>
      </div>

      <TeacherFormModal
        open={showAddModal}
        form={teacherForm}
        onChange={handleFormChange}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        submitting={creatingTeacher}
      />
    </>
  );
}
