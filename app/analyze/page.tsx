import nextDynamic from 'next/dynamic'
import { AppHeader } from '@/components/layout/app-header'
import { AppFooter } from '@/components/layout/app-footer'
import { getAuthUser } from '@/lib/identity/auth'
import { getOwnerIdFromCookies } from '@/lib/identity/anonymous'
import {
  createUsageEvent,
  getUsageCountThisMonthForUser,
} from '@/lib/supabase/queries'
import { getPlanSlugForUser, PLAN_LIMITS } from '@/lib/plans/config'

const AnalyzeForm = nextDynamic(() => import('@/components/analyzer/analyze-form').then((mod) => mod.AnalyzeForm))
const UsageMeter = nextDynamic(() => import('@/components/plans/usage-meter').then((mod) => mod.UsageMeter))

export const dynamic = 'force-dynamic'

export default async function AnalyzePage() {
  // Resolve identity server-side — mirrors what /api/analyze does
  const user = await getAuthUser()
  const ownerAnonymousId = await getOwnerIdFromCookies()

  const userId = user?.id ?? null
  const planSlug = await getPlanSlugForUser(userId)
  const monthlyCount = await getUsageCountThisMonthForUser(ownerAnonymousId || '', userId)
  const monthlyLimit = PLAN_LIMITS[planSlug].monthlyAnalyses
  const usagePct = monthlyLimit > 0 ? Math.round((monthlyCount / monthlyLimit) * 100) : 0

  // Fire limit_warning_shown event server-side when approaching limit (≥80%) but not yet blocked
  if (usagePct >= 80 && usagePct < 100) {
    createUsageEvent({
      owner_anonymous_id: ownerAnonymousId || '',
      user_id: userId,
      event_type: 'limit_warning_shown',
      metadata_json: {
        plan_slug: planSlug,
        monthly_count: monthlyCount,
        monthly_limit: monthlyLimit,
        usage_pct: usagePct,
      },
    }).catch((err) => {
      console.error('Failed to log limit_warning_shown event:', err)
    })
  }

  const stripeEnabled = process.env.STRIPE_ENABLED === 'true'
  const showMeter = usagePct >= 80 || monthlyCount >= monthlyLimit

  return (
    <div className="flex min-h-screen flex-col bg-[#0C0C10] text-[#E2E8F0] selection:bg-[#A78BFA]/20 antialiased font-sans">
      <AppHeader />

      <main className="flex-1 mx-auto w-full max-w-4xl px-6 py-10">
        <div className="mb-8">
          <p className="text-xs font-mono font-medium uppercase tracking-[0.2em] text-[#A78BFA]">PromptPolish</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Przeanalizuj prompt</h1>
          <p className="mt-2 text-sm text-[#94A3B8]">
            Wprowadź treść swojej instrukcji, zdefiniuj opcjonalny cel i rozpocznij audyt jakości promptu.
          </p>
        </div>

        {/* Usage meter — shown only when approaching or at limit to avoid cluttering the happy path */}
        {showMeter && (
          <div className="mb-6">
            <UsageMeter
              planSlug={planSlug}
              monthlyCount={monthlyCount}
              monthlyLimit={monthlyLimit}
              variant="card"
              isSimulatedPro={planSlug === 'pro' && !stripeEnabled}
            />
          </div>
        )}

        <AnalyzeForm />
      </main>

      <AppFooter />
    </div>
  )
}
