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
  anonymous: 'bg-[#1C1C27] text-[#4A5568] border-[#2A2A3A]',
  free: 'bg-[#1C1C27] text-[#94A3B8] border-[#2A2A3A]',
  pro: 'bg-[#A78BFA]/10 text-[#A78BFA] border-[#A78BFA]/30',
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
    ? 'bg-gradient-to-r from-[#F87171] to-[#DC2626]'
    : isWarning
    ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706]'
    : 'bg-gradient-to-r from-[#7C3AED] to-[#A78BFA]'

  const content = (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-widest ${PLAN_BADGE_CLASSES[planSlug]}`}
          >
            {PLAN_LABELS[planSlug]}
          </span>
          {planSlug === 'pro' && isSimulatedPro && (
            <span className="inline-flex items-center rounded-full border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-2 py-0.5 text-xs font-bold uppercase tracking-widest text-[#F59E0B]">
              Beta Symulacja
            </span>
          )}
        </div>

        <span
          className={`text-xs font-bold tabular-nums ${
            isBlocked
              ? 'text-[#F87171]'
              : isWarning
              ? 'text-[#F59E0B]'
              : 'text-[#4A5568]'
          }`}
        >
          {monthlyCount} / {monthlyLimit} analiz
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-[#1C1C27] border border-[#2A2A3A] overflow-hidden">
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
      <div className="flex items-center justify-between text-xs font-semibold text-[#4A5568]">
        <span>Pozostało: <strong className={isBlocked ? 'text-[#F87171]' : isWarning ? 'text-[#F59E0B]' : 'text-[#E2E8F0]'}>{remaining}</strong></span>
        <span>{usagePct}% wykorzystane</span>
      </div>

      {/* Warning banner */}
      {isWarning && !isBlocked && (
        <div className="rounded-lg border border-[#F59E0B]/25 bg-[#F59E0B]/6 px-3 py-2 text-xs font-semibold text-[#F59E0B] flex items-center gap-2">
          <span>⚠️</span>
          <span>
            Zbliżasz się do limitu miesięcznego ({remaining} pozostało).{' '}
            <Link href="/pricing" className="underline underline-offset-2 hover:text-[#F59E0B] transition text-[#F59E0B]">
              Sprawdź plan Pro
            </Link>
          </span>
        </div>
      )}

      {/* Blocked banner */}
      {isBlocked && (
        <div className="rounded-lg border border-[#F87171]/25 bg-[#F87171]/6 px-3 py-2.5 text-xs text-[#F87171] flex flex-col gap-2">
          <p className="font-bold">
            🚫 Osiągnięto miesięczny limit analiz ({monthlyLimit}/{monthlyLimit}).
          </p>
          <p className="leading-relaxed">
            Twój plan <strong>{PLAN_LABELS[planSlug]}</strong> wyczerpał limit na ten miesiąc. Limit
            odnawia się 1. dnia każdego miesiąca (UTC). Przejdź na Pro, aby uzyskać do{' '}
            <strong>500 analiz</strong> miesięcznie.{' '}
            {planSlug !== 'pro' && (
              <span className="italic text-[#F87171]/70">
                (Zakup Pro jest niedostępny w becie — płatności Stripe zostaną aktywowane wkrótce.)
              </span>
            )}
          </p>
          <Link
            href="/pricing"
            className="self-start inline-flex items-center rounded-lg gradient-btn px-3 py-1.5 text-xs font-bold text-white transition active:scale-95"
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
    <div className="rounded-xl border border-[#2A2A3A] bg-[#13131A] p-5">
      {content}
    </div>
  )
}
