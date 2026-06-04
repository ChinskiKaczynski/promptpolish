'use client'

import Link from 'next/link'

interface MonthlyLimitBannerProps {
  isMonthlyLimitReached: boolean
  setIsMonthlyLimitReached: (val: boolean) => void
  monthlyLimitFromApi: number | null
  workingLanguage: 'pl' | 'en'
}

export function MonthlyLimitBanner({
  isMonthlyLimitReached,
  setIsMonthlyLimitReached,
  monthlyLimitFromApi,
  workingLanguage
}: MonthlyLimitBannerProps) {
  if (!isMonthlyLimitReached) return null

  return (
    <div className="relative border-2 border-pp-warning bg-pp-panel p-6 text-pp-text shadow-[4px_4px_0px_rgba(245,158,11,0.1)] font-mono animate-in fade-in slide-in-from-top-4 duration-300">
      {/* Dismiss Button */}
      <button
        type="button"
        onClick={() => setIsMonthlyLimitReached(false)}
        className="absolute right-4 top-4 text-pp-muted hover:text-pp-text transition p-1 cursor-pointer"
        aria-label="Close warning"
      >
        <span className="font-bold text-sm">[X]</span>
      </button>

      <div className="flex gap-4 items-start">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-pp-warning bg-pp-warning/10 text-pp-warning font-bold">
          !
        </div>
        <div className="space-y-2 pr-6">
          <h4 className="text-xs font-black uppercase tracking-wider text-pp-warning">
            {workingLanguage === 'pl' ? 'Osiągnięto limit miesięczny' : 'Monthly Limit Exceeded'}
          </h4>
          <p className="text-[11px] leading-relaxed text-pp-muted">
            {workingLanguage === 'pl'
              ? `Wykorzystałeś miesięczny limit analiz (${monthlyLimitFromApi ?? '—'}/miesiąc) na Twoim planie. Przejdź na Pro, aby uzyskać do 500 analiz miesięcznie, eksport PDF/Markdown, wyższy limit znaków (24 000) i zbiorczy audyt. Płatności Stripe zostaną włączone wkrótce.`
              : `You have reached the monthly analysis limit (${monthlyLimitFromApi ?? '—'}/month) for your plan. Upgrade to Pro for 500 monthly analyses, PDF/Markdown exports, higher character limits (24k), and batch audits. Stripe billing is arriving soon.`}
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/pricing"
              className="pp-button pp-button-primary text-[10px] py-1.5 px-3"
            >
              {workingLanguage === 'pl' ? 'ZOBACZ CENNIK // PRO' : 'VIEW PRICING // PRO'}
            </Link>
            <button
              type="button"
              onClick={() => setIsMonthlyLimitReached(false)}
              className="pp-button text-[10px] py-1.5 px-3 border-pp-border"
            >
              {workingLanguage === 'pl' ? 'POWRÓT' : 'DISMISS'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
