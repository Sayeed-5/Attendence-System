const inputClassName =
  "w-full rounded-2xl border border-white/10 bg-[#11141a] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#7b61ff]/70 focus:ring-2 focus:ring-[#7b61ff]/20";

export default function UserCreateForm({
  title,
  description,
  buttonLabel,
  form,
  onChange,
  onSubmit,
}) {
  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-[28px] border border-white/8 bg-[#16191f]/92 p-5 shadow-[0_16px_44px_rgba(0,0,0,0.24)] md:grid-cols-4">
      <div className="md:col-span-4">
        <h2 className="font-['Space_Grotesk'] text-xl font-bold text-white">{title}</h2>
        <p className="mt-2 text-sm text-slate-400">{description}</p>
      </div>

      <input
        required
        value={form.name}
        onChange={(event) => onChange("name", event.target.value)}
        placeholder="Name"
        className={inputClassName}
      />
      <input
        required
        type="email"
        value={form.email}
        onChange={(event) => onChange("email", event.target.value)}
        placeholder="Email"
        className={inputClassName}
      />
      <input
        required
        type="password"
        value={form.password}
        onChange={(event) => onChange("password", event.target.value)}
        placeholder="Password"
        className={inputClassName}
      />
      <button
        type="submit"
        className="rounded-2xl bg-[#7b61ff] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(123,97,255,0.32)] transition hover:bg-[#8b73ff]"
      >
        {buttonLabel}
      </button>
    </form>
  );
}
