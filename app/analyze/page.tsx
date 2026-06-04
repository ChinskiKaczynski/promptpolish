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
    <div className="flex min-h-screen flex-col pp-grid-bg text-pp-text selection:bg-pp-border-bright selection:text-white antialiased font-mono">
      <AppHeader />

      <main className="flex-1 mx-auto w-full max-w-4xl px-6 py-10 z-10 relative">
        <div className="mb-8 border-b-2 border-pp-border pb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-pp-cyan">{"// KONSOLA_ANALIZATORA // SYS_READY"}</p>
          <h1 className="mt-2 text-2xl font-black uppercase tracking-wider text-pp-text">Przeprowadź audyt promptu</h1>
          <p className="mt-2 text-pp-muted text-xs">
            Wprowadź treść swojej instrukcji, zdefiniuj opcjonalny cel zadania i uruchom preflight analizy inżynieryjnej.
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
