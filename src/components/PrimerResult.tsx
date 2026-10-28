export interface PrimerResultColumn {
  key: string
  label: string
}

export type PrimerResultRow = Record<string, string | number>

export function PrimerResult({
  title,
  columns,
  rows,
  summary,
}: {
  title: string
  columns: PrimerResultColumn[]
  rows: PrimerResultRow[]
  summary?: string
}) {
  return (
    <section aria-label={title} className="my-5 max-w-3xl overflow-hidden rounded-xl border bg-card/50">
      <div className="border-b bg-muted/40 px-4 py-2.5">
        <h3 className="font-mono text-sm font-medium text-foreground">{title}</h3>
        {summary && <p className="mt-1 text-xs leading-5 text-foreground">{summary}</p>}
      </div>
      <div tabIndex={0} className="max-w-full overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-muted/30">
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col" className="px-3 py-2 font-semibold text-foreground">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row, index) => (
                <tr key={index} className="border-t align-top">
                  {columns.map((column) => (
                    <td key={column.key} className="px-3 py-2 font-mono text-xs">
                      {row[column.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr className="border-t">
                <td colSpan={columns.length} className="px-3 py-3 text-sm text-foreground">
                  No rows.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
