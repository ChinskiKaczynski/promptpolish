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
  anonymous: 'ANONIMOWY',
  free: 'FREE_TIER',
  pro: 'PRO_MEMBER',
}

const PLAN_BADGE_CLASSES: Record<PlanSlug, string> = {
  anonymous: 'border-pp-border bg-pp-panel text-pp-muted',
  free: 'border-pp-border bg-pp-panel text-pp-text',
  pro: 'border-pp-border-bright bg-pp-primary/10 text-pp-primary-bright',
}

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

  const barColorClass = isBlocked
    ? 'pp-stat-fill-danger'
    : isWarning
    ? 'pp-stat-fill-warning'
    : 'pp-stat-fill-primary'

  const content = (
    <div className="space-y-4 font-mono text-xs">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest ${PLAN_BADGE_CLASSES[planSlug]}`}
          >
            {PLAN_LABELS[planSlug]}
          </span>
          {planSlug === 'pro' && isSimulatedPro && (
            <span className="inline-flex items-center border border-pp-warning bg-pp-warning/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-pp-warning">
              Beta Symulacja
            </span>
          )}
        </div>

        <span
          className={`text-xs font-bold tabular-nums uppercase ${
            isBlocked
              ? 'text-pp-danger'
              : isWarning
              ? 'text-pp-warning'
              : 'text-pp-text'
          }`}
        >
          {monthlyCount} / {monthlyLimit} analiz
        </span>
      </div>

      {/* Progress bar */}
      <div className="pp-stat-track">
        <div
          className={`pp-stat-fill ${barColorClass}`}
          style={{ width: `${usagePct}%` }}
          role="progressbar"
          aria-valuenow={usagePct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Użyto ${usagePct}% limitu miesięcznego`}
        />
      </div>

      {/* Status labels */}
      <div className="flex items-center justify-between text-[10px] font-bold uppercase text-pp-muted">
        <span>Pozostało: <strong className={isBlocked ? 'text-pp-danger' : isWarning ? 'text-pp-warning' : 'text-pp-text'}>{remaining}</strong></span>
        <span>{usagePct}% wykorzystane</span>
      </div>

      {/* Warning banner */}
      {isWarning && !isBlocked && (
        <div className="border border-pp-warning bg-pp-warning/10 px-3 py-2 text-[11px] font-bold text-pp-warning flex items-center gap-2 leading-relaxed">
          <span>⚠️</span>
          <span>
            Zbliżasz się do limitu miesięcznego ({remaining} pozostało).{' '}
            <Link href="/pricing" className="underline hover:text-pp-text transition">
              ZOBACZ CENNIK // PRO
            </Link>
          </span>
        </div>
      )}

      {/* Blocked banner */}
      {isBlocked && (
        <div className="border border-pp-danger bg-pp-danger/10 px-3 py-2.5 text-[11px] text-pp-danger flex flex-col gap-2 leading-relaxed uppercase">
          <p className="font-black">
            🚫 Osiągnięto limit analiz ({monthlyLimit}/{monthlyLimit}).
          </p>
          <p className="text-[10px] text-pp-muted">
            Twój plan wyczerpał limit na ten miesiąc. Pula odnowi się 1. dnia kolejnego miesiąca (UTC). Przejdź na Pro aby zyskać do 500 analiz miesięcznie.
          </p>
          <Link
            href="/pricing"
            className="self-start pp-button pp-button-primary text-[10px] py-1.5 px-3"
          >
            ZOBACZ CENNIK // PRO →
          </Link>
        </div>
      )}
    </div>
  )

  if (variant === 'inline') {
    return <div className="w-full">{content}</div>
  }

  return (
    <div className="pp-panel p-5 border-2 border-pp-border relative">
      {content}
    </div>
  )
}
