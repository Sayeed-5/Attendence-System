import { FunnelSimple, MagnifyingGlass, Plus, Trash } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import SectionCard from "./SectionCard";
import StudentFormModal from "./StudentFormModal";
import { formatShortDate, getInitials } from "./adminUtils";

const emptyStudentForm = {
  name: "",
  email: "",
  password: "",
  role: "student",
  regNo: "",
  branch: "",
  semester: "",
  mobileNo: "",
};

function Avatar({ student }) {
  if (student.profilePicture) {
    return <img src={student.profilePicture} alt={student.name} className="h-11 w-11 rounded-full object-cover ring-1 ring-white/10" />;
  }

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#7b61ff]/20 text-sm font-semibold text-[#b7acff] ring-1 ring-inset ring-[#7b61ff]/30">
      {getInitials(student.name)}
    </div>
  );
}

function StudentRow({ student, onDelete }) {
  return (
    <tr className="border-t border-white/8 text-sm text-slate-200 transition hover:bg-white/[0.03]">
      <td className="px-4 py-4">
        <Avatar student={student} />
      </td>
      <td className="px-4 py-4">
        <p className="font-semibold text-white">{student.name || "-"}</p>
        <p className="mt-1 text-xs text-slate-500">{student.regNo || "Registration pending"}</p>
      </td>
      <td className="px-4 py-4">
        <p>{student.email || "-"}</p>
        <p className="mt-1 text-xs text-slate-500">{student.mobileNo || "No phone added"}</p>
      </td>
      <td className="px-4 py-4">
        <p>{student.branch || "-"}</p>
      </td>
      <td className="px-4 py-4">
        <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
          {student.semester ? `Sem ${student.semester}` : "Not set"}
        </span>
      </td>
      <td className="px-4 py-4">
        <p>{formatShortDate(student.createdAt || student.created_at)}</p>
      </td>
      <td className="px-4 py-4 text-right">
        <button
          type="button"
          onClick={() => onDelete(student.id || student._id)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-400/20 bg-rose-500/10 text-rose-200 transition hover:bg-rose-500/15"
          aria-label={`Delete ${student.name}`}
        >
          <Trash size={16} />
        </button>
      </td>
    </tr>
  );
}

function StudentCard({ student, onDelete }) {
  return (
    <div className="rounded-[22px] border border-white/8 bg-[#11141a] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar student={student} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-white">{student.name || "-"}</p>
            <p className="mt-1 text-xs text-slate-500">{student.regNo || "Registration pending"}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onDelete(student.id || student._id)}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-400/20 bg-rose-500/10 text-rose-200"
          aria-label={`Delete ${student.name}`}
        >
          <Trash size={16} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="col-span-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Contact</p>
          <p className="mt-1 text-slate-200">{student.email || "-"}</p>
          <p className="mt-1 text-xs text-slate-500">{student.mobileNo || "No phone added"}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Branch</p>
          <p className="mt-1 text-slate-200">{student.branch || "-"}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Semester</p>
          <p className="mt-1 text-slate-200">{student.semester ? `Sem ${student.semester}` : "Not set"}</p>
        </div>
        <div className="col-span-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Enrolled</p>
          <p className="mt-1 text-slate-200">{formatShortDate(student.createdAt || student.created_at)}</p>
        </div>
      </div>
    </div>
  );
}

export default function StudentManagement({ students, onAddStudent, onDeleteStudent, creatingStudent }) {
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [studentForm, setStudentForm] = useState(emptyStudentForm);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return students;

    return students.filter((student) =>
      [student.name, student.email, student.regNo, student.branch, student.mobileNo]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [search, students]);

  const handleFormChange = (key, value) => {
    setStudentForm((current) => ({ ...current, [key]: value }));
  };

  const handleCloseModal = () => {
    if (creatingStudent) return;
    setShowAddModal(false);
    setStudentForm(emptyStudentForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const created = await onAddStudent(studentForm);
    if (!created) return;
    setShowAddModal(false);
    setStudentForm(emptyStudentForm);
  };

  return (
    <>
      <SectionCard
        title="Student Management"
        description="Manage student profiles in a cleaner admin workspace inspired by your reference layout."
        action={
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#7b61ff] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(123,97,255,0.32)] transition hover:bg-[#8b73ff]"
          >
            <Plus size={18} />
            Add Student
          </button>
        }
      >
        <div className="mb-5 flex flex-col gap-3 rounded-[24px] border border-white/8 bg-[#11141a] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <MagnifyingGlass size={18} className="text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, branch, reg no..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300"
          >
            <FunnelSimple size={18} />
            Active Students
          </button>
        </div>

        <div className="space-y-3 lg:hidden">
          {filteredStudents.map((student) => (
            <StudentCard key={student.id || student._id} student={student} onDelete={onDeleteStudent} />
          ))}
        </div>

        <div className="hidden overflow-hidden rounded-[24px] border border-white/8 lg:block">
          <div className="overflow-x-auto bg-[#11141a]">
            <table className="min-w-full">
              <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-4 py-4 text-left">Photo</th>
                  <th className="px-4 py-4 text-left">Full Name</th>
                  <th className="px-4 py-4 text-left">Contact Information</th>
                  <th className="px-4 py-4 text-left">Branch</th>
                  <th className="px-4 py-4 text-left">Semester</th>
                  <th className="px-4 py-4 text-left">Enrolled</th>
                  <th className="px-4 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <StudentRow
                    key={student.id || student._id}
                    student={student}
                    onDelete={onDeleteStudent}
                  />
                ))}
              </tbody>
            </table>

            {filteredStudents.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <p className="text-lg font-semibold text-white">No students found</p>
                <p className="mt-2 text-sm text-slate-400">
                  Search clear karke dekhiye ya naya student add kijiye.
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing <span className="font-semibold text-white">{filteredStudents.length}</span> of{" "}
            <span className="font-semibold text-white">{students.length}</span> students
          </p>
          <p>Student ID aur status column intentionally remove kiye gaye hain.</p>
        </div>
      </SectionCard>

      <StudentFormModal
        open={showAddModal}
        form={studentForm}
        onChange={handleFormChange}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        submitting={creatingStudent}
      />
    </>
  );
}
