'use client'

interface Column {
  key: string
  label: string
  align?: 'left' | 'right' | 'center'
  format?: 'number' | 'percent' | 'text' | 'status'
}

interface MetricTableProps {
  title: string
  description?: string
  columns: Column[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows: Array<Record<string, any>>
  emptyMessage?: string
}

function statusPill(value: string) {
  const map: Record<string, string> = {
    present: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    no_events_yet: 'bg-slate-700/50 text-slate-500 border border-slate-700',
    unknown: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    strong: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    acceptable: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    weak: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
    blocking: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    low: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
    medium: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    high: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    none: 'bg-slate-700/50 text-slate-400 border border-slate-700',
  }
  const cls = map[value] ?? 'bg-slate-700/50 text-slate-400 border border-slate-700'
  const label = value.replace(/_/g, ' ')
  return (
    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${cls}`}>
      {label}
    </span>
  )
}

export function MetricTable({ title, description, columns, rows, emptyMessage = 'No data available.' }: MetricTableProps) {
  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800">
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>

      {rows.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-slate-500">{emptyMessage}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors last:border-0"
                >
                  {columns.map((col) => {
                    const raw = row[col.key]
                    let cell: React.ReactNode

                    if (col.format === 'status') {
                      cell = statusPill(String(raw ?? 'unknown'))
                    } else if (col.format === 'percent' && typeof raw === 'number') {
                      cell = <span className="tabular-nums">{raw.toFixed(1)}%</span>
                    } else if (col.format === 'number' && typeof raw === 'number') {
                      cell = <span className="tabular-nums">{raw.toLocaleString()}</span>
                    } else {
                      cell = <span className="text-slate-300">{String(raw ?? '—')}</span>
                    }

                    return (
                      <td
                        key={col.key}
                        className={`px-5 py-3 text-slate-300 whitespace-nowrap ${
                          col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                        }`}
                      >
                        {cell}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
