export default function SectionCard({ title, description, action, children }) {
  return (
    <section className="rounded-[28px] border border-white/8 bg-[#16191f]/92 p-5 shadow-[0_16px_44px_rgba(0,0,0,0.24)] sm:p-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-['Space_Grotesk'] text-2xl font-bold text-white">{title}</h2>
          {description ? <p className="mt-2 max-w-2xl text-sm text-slate-400">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      {children}
    </section>
  );
}
