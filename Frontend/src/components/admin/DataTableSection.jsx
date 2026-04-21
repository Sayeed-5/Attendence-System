import SectionCard from "./SectionCard";

export default function DataTableSection({ title, description, columns, rows, emptyMessage, action }) {
  return (
    <SectionCard title={title} description={description} action={action}>
      <div className="overflow-hidden rounded-[24px] border border-white/8">
        <div className="overflow-x-auto bg-[#11141a]">
          <table className="min-w-full">
            <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className={`px-4 py-4 ${column.align === "right" ? "text-right" : "text-left"}`}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((row) => (
                  <tr key={row.key} className="border-t border-white/8 text-sm text-slate-200">
                    {row.cells.map((cell, index) => (
                      <td
                        key={`${row.key}-${columns[index]?.key || index}`}
                        className={`px-4 py-4 align-top ${columns[index]?.align === "right" ? "text-right" : "text-left"}`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-slate-400">
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>
  );
}
