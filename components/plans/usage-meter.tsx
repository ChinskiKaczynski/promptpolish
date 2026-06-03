import Link from 'next/link'
import type { PlanSlug } from '@/lib/plans/config'

export interface UsageMeterProps {
  planSlug: PlanSlug
  monthlyCount: number
  monthlyLimit: number
  /** Optional: show a compact/inline variant (no card border) */
  variant?: 'card' | 'inline'
  /** When true, shows a beta badge next to Pro plan name */
  isSimulatedPro?: boolean
}

const PLAN_LABELS: Record<PlanSlug, string> = {
  anonymous: 'Anonimowy',
  free: 'Free',
  pro: 'Pro',
}

const PLAN_BADGE_CLASSES: Record<PlanSlug, string> = {
  anonymous: 'bg-slate-100 text-slate-600 border-slate-200',
  free: 'bg-slate-100 text-slate-700 border-slate-200',
  pro: 'bg-indigo-50 text-indigo-700 border-indigo-200',
}

/**
 * UsageMeter — reusable component for displaying monthly analysis usage.
 *
 * States:
 * - Normal   (<80% used): indigo progress bar
 * - Warning  (≥80% used): amber progress bar + amber text
 * - Blocked  (≥100% used): rose progress bar + rose banner + /pricing CTA
 */
export function UsageMeter({
  planSlug,
  monthlyCount,
  monthlyLimit,
  variant = 'card',
  isSimulatedPro = false,
}: UsageMeterProps) {
  const remaining = Math.max(0, monthlyLimit - monthlyCount)
  const usagePct = monthlyLimit > 0 ? Math.min(100, Math.round((monthlyCount / monthlyLimit) * 100)) : 0

  const isWarning = usagePct >= 80 && usagePct < 100
  const isBlocked = usagePct >= 100

  const barColor = isBlocked
    ? 'bg-gradient-to-r from-rose-500 to-red-600'
    : isWarning
    ? 'bg-gradient-to-r from-amber-400 to-amber-500'
    : 'bg-gradient-to-r from-indigo-500 to-violet-600'

  const content = (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest ${PLAN_BADGE_CLASSES[planSlug]}`}
          >
            {PLAN_LABELS[planSlug]}
          </span>
          {planSlug === 'pro' && isSimulatedPro && (
            <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-700">
              Beta Symulacja
            </span>
          )}
        </div>

        <span
          className={`text-xs font-bold tabular-nums ${
            isBlocked
              ? 'text-rose-600'
              : isWarning
              ? 'text-amber-600'
              : 'text-slate-500'
          }`}
        >
          {monthlyCount} / {monthlyLimit} analiz
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${usagePct}%` }}
          role="progressbar"
          aria-valuenow={usagePct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Użyto ${usagePct}% limitu miesięcznego`}
        />
      </div>

      {/* Status labels */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
        <span>Pozostało: <strong className={isBlocked ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-slate-700'}>{remaining}</strong></span>
        <span>{usagePct}% wykorzystane</span>
      </div>

      {/* Warning banner */}
      {isWarning && !isBlocked && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2 text-xs font-semibold text-amber-800 flex items-center gap-2">
          <span>⚠️</span>
          <span>
            Zbliżasz się do limitu miesięcznego ({remaining} pozostało).{' '}
            <Link href="/pricing" className="underline underline-offset-2 hover:text-amber-900 transition">
              Sprawdź plan Pro
            </Link>
          </span>
        </div>
      )}

      {/* Blocked banner */}
      {isBlocked && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/60 px-3 py-2.5 text-xs text-rose-800 flex flex-col gap-2">
          <p className="font-bold">
            🚫 Osiągnięto miesięczny limit analiz ({monthlyLimit}/{monthlyLimit}).
          </p>
          <p className="leading-relaxed">
            Twój plan <strong>{PLAN_LABELS[planSlug]}</strong> wyczerpał limit na ten miesiąc. Limit
            odnawia się 1. dnia każdego miesiąca (UTC). Przejdź na Pro, aby uzyskać do{' '}
            <strong>500 analiz</strong> miesięcznie.{' '}
            {planSlug !== 'pro' && (
              <span className="italic text-rose-700">
                (Zakup Pro jest niedostępny w becie — płatności Stripe zostaną aktywowane wkrótce.)
              </span>
            )}
          </p>
          <Link
            href="/pricing"
            className="self-start inline-flex items-center rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-[11px] font-bold text-white transition active:scale-95"
          >
            Zobacz plany →
          </Link>
        </div>
      )}
    </div>
  )

  if (variant === 'inline') {
    return <div className="w-full">{content}</div>
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-0">
      {content}
    </div>
  )
}
