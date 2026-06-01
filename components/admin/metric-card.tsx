'use client'

interface MetricCardProps {
  label: string
  value: string | number
  subtext?: string
  status?: 'strong' | 'acceptable' | 'warning' | 'weak' | 'blocking' | 'unknown' | null
  format?: 'number' | 'percent' | 'text'
}

function statusColor(status: MetricCardProps['status']): string {
  switch (status) {
    case 'strong':
      return 'text-emerald-400'
    case 'acceptable':
      return 'text-sky-400'
    case 'warning':
      return 'text-amber-400'
    case 'weak':
      return 'text-orange-400'
    case 'blocking':
      return 'text-rose-500'
    default:
      return 'text-slate-200'
  }
}

function statusBadge(status: MetricCardProps['status']): { label: string; cls: string } | null {
  switch (status) {
    case 'strong':
      return { label: 'Strong', cls: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' }
    case 'acceptable':
      return { label: 'Acceptable', cls: 'bg-sky-500/15 text-sky-400 border border-sky-500/30' }
    case 'warning':
      return { label: 'Warning', cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/30' }
    case 'weak':
      return { label: 'Weak', cls: 'bg-orange-500/15 text-orange-400 border border-orange-500/30' }
    case 'blocking':
      return { label: 'Blocking', cls: 'bg-rose-500/15 text-rose-400 border border-rose-500/30' }
    default:
      return null
  }
}

export function MetricCard({ label, value, subtext, status, format = 'number' }: MetricCardProps) {
  const badge = statusBadge(status ?? null)
  const valueColor = statusColor(status ?? null)

  const displayValue = (() => {
    if (format === 'percent' && typeof value === 'number') {
      return `${value.toFixed(1)}%`
    }
    if (format === 'number' && typeof value === 'number') {
      return value.toLocaleString()
    }
    return String(value)
  })()

  return (
    <div className="relative flex flex-col gap-2 rounded-2xl bg-slate-900 border border-slate-800 p-5 hover:border-slate-700 transition-colors overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800/20 to-transparent pointer-events-none" />

      <div className="flex items-start justify-between gap-2 relative">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-widest leading-tight">{label}</p>
        {badge && (
          <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>
            {badge.label}
          </span>
        )}
      </div>

      <p className={`text-3xl font-bold tracking-tight relative ${valueColor}`}>{displayValue}</p>

      {subtext && (
        <p className="text-xs text-slate-500 relative">{subtext}</p>
      )}
    </div>
  )
}
