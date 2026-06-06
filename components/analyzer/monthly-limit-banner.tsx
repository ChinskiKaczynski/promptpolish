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
    <div className="relative rounded-xl border border-[#A78BFA]/30 bg-[#13131A] p-6">
      {/* Dismiss Button */}
      <button
        type="button"
        onClick={() => setIsMonthlyLimitReached(false)}
        className="absolute right-4 top-4 text-[#4A5568] hover:text-[#E2E8F0] transition p-1 cursor-pointer"
        aria-label="Close warning"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#A78BFA]/10 border border-[#A78BFA]/20 text-[#A78BFA]">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="space-y-1.5 pr-6">
          <h4 className="text-sm font-bold tracking-tight text-[#E2E8F0] font-heading">
            {workingLanguage === 'pl' ? 'Osiągnięto miesięczny limit analiz' : 'Monthly Analysis Limit Reached'}
          </h4>
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            {workingLanguage === 'pl'
              ? `Wykorzystałeś miesięczny limit analiz (${monthlyLimitFromApi ?? '—'}/miesiąc) na Twoim planie. Przejdź na Pro, aby uzyskać do 500 analiz miesięcznie, eksport PDF/Markdown, wyższy limit znaków (24 000) i zbiorczy audyt. Zakup Pro jest niedostępny w becie — dostępny wkrótce po uruchomieniu Stripe.`
              : `You have reached the monthly analysis limit (${monthlyLimitFromApi ?? '—'}/month) for your plan. Upgrade to Pro for 500 monthly analyses, PDF/Markdown exports, higher character limits (24k), and batch audits. Pro purchase is unavailable in beta — available soon after Stripe activation.`}
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-lg gradient-btn px-4 py-2 text-xs font-bold text-white transition active:scale-95 cursor-pointer"
            >
              {workingLanguage === 'pl' ? 'Zobacz cennik i ulepsz plan' : 'View Pricing & Upgrade'}
            </Link>
            <button
              type="button"
              onClick={() => setIsMonthlyLimitReached(false)}
              className="rounded-lg border border-[#2A2A3A] bg-[#1C1C27] px-4 py-2 text-xs font-bold text-[#4A5568] hover:text-[#E2E8F0] transition active:scale-95 cursor-pointer"
            >
              {workingLanguage === 'pl' ? 'Wróć do audytu' : 'Dismiss'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
