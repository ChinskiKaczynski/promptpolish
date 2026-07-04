import Link from 'next/link'
import nextDynamic from 'next/dynamic'
import { getAuthUser } from '@/lib/identity/auth'
import { ensureUserProfile, createUsageEvent } from '@/lib/supabase/queries'
import { getOwnerIdFromCookies } from '@/lib/identity/anonymous'
import { PLAN_LIMITS, getPlanSlugForUser } from '@/lib/plans/config'
import { AppHeader } from '@/components/layout/app-header'
import { AppFooter } from '@/components/layout/app-footer'
import { getSubscriptionByUserId } from '@/lib/supabase/billing'

const CheckoutButton = nextDynamic(() => import('@/components/pricing/checkout-button').then((mod) => mod.CheckoutButton))
const WaitlistForm = nextDynamic(() => import('@/components/pricing/waitlist-form').then((mod) => mod.WaitlistForm))
const PortalButton = nextDynamic(() => import('@/components/billing/portal-button').then((mod) => mod.PortalButton))

export const dynamic = 'force-dynamic'

export default async function PricingPage() {
  const user = await getAuthUser()
  const stripeEnabled =
    process.env.STRIPE_ENABLED === 'true' &&
    !!process.env.STRIPE_SECRET_KEY &&
    !!process.env.STRIPE_PRICE_ID_PRO

  const isNotProduction = process.env.VERCEL_ENV !== 'production'
  const isNotTest = process.env.NODE_ENV !== 'test'
  const shouldRenderDiagnostics = isNotTest && isNotProduction

  // Safe server-side debug output for preview/dev environments
  if (shouldRenderDiagnostics) {
    console.info('[Stripe Debug - Pricing]:', {
      STRIPE_ENABLED_is_true: process.env.STRIPE_ENABLED === 'true',
      has_STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      has_STRIPE_PRICE_ID_PRO: !!process.env.STRIPE_PRICE_ID_PRO,
      has_APP_URL: !!process.env.APP_URL,
      stripeEnabledResolved: stripeEnabled
    })
  }

  let profile = null
  let subscription = null
  let hasActiveProSub = false

  if (user) {
    profile = await ensureUserProfile({
      user_id: user.id,
      email: user.email || '',
      display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || null,
    })
    subscription = stripeEnabled ? await getSubscriptionByUserId(user.id) : null
    const planSlug = await getPlanSlugForUser(user.id)
    hasActiveProSub = planSlug === 'pro' || (subscription ? ['active', 'trialing'].includes(subscription.status) : false)
  }

  const ownerAnonymousId = await getOwnerIdFromCookies()

  if (ownerAnonymousId) {
    createUsageEvent({
      owner_anonymous_id: ownerAnonymousId,
      user_id: user?.id ?? null,
      event_type: 'pricing_viewed',
      metadata_json: {
        stripe_enabled: stripeEnabled,
        plan_slug: profile?.plan_slug ?? null,
      },
    }).catch((err) => {
      console.error('Failed to log pricing_viewed event:', err)
    })
  }

  const freeLimits = PLAN_LIMITS.free
  const proLimits = PLAN_LIMITS.pro

  return (
    <div className="flex min-h-screen flex-col bg-[#0C0C10] text-[#E2E8F0] selection:bg-[#A78BFA]/20 antialiased font-sans pb-16">
      <AppHeader />

      {/* Main Section */}
      <main className="flex-grow mx-auto w-full max-w-5xl px-6 py-16">
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#2A2A3A] bg-[#1C1C27] px-3.5 py-1 text-xs font-semibold text-[#A78BFA] uppercase tracking-wider">
            Plany i Cennik — Faza Beta
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-[#E2E8F0] font-heading">
            Wybierz plan dopasowany do swoich potrzeb
          </h1>
          <p className="text-sm text-[#94A3B8] leading-relaxed max-w-lg mx-auto">
            Przestań zgadywać. Poleruj swoje instrukcje za pomocą precyzyjnych audytów zoptymalizowanych pod kątem najnowszych modeli językowych.
          </p>
        </div>

        {/* Beta Notice Banner - Minimized & Inside Main */}
        {!stripeEnabled && (
          <div className="mt-6 mb-2 flex items-center justify-center gap-2 text-xs text-[#8290A2] font-mono">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#F97316] shrink-0"></span>
            Beta — płatności tymczasowo niedostępne.
          </div>
        )}

        {/* Plan Grid */}
        <div className="mt-16 grid gap-8 md:grid-cols-2 max-w-4xl mx-auto items-stretch">
          {/* Free Plan */}
          <div className="rounded-xl border border-[#2A2A3A] bg-[#13131A] p-8 flex flex-col justify-between hover:border-[#3A3A52] transition duration-300 relative">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-[#E2E8F0] font-heading">{freeLimits.name}</h3>
                  <p className="mt-2 text-xs text-[#8290A2]">Dla hobbystów i osób testujących narzędzie.</p>
                </div>
                {(!profile || (profile.plan_slug === 'free' && !hasActiveProSub)) && (
                  <span className="rounded-full bg-[#1C1C27] border border-[#2A2A3A] px-3 py-1 text-[10px] font-black text-[#A78BFA] uppercase tracking-wider">
                    Twój aktualny plan
                  </span>
                )}
              </div>
              <div className="mt-6 flex items-baseline">
                <span className="text-4xl font-extrabold font-mono text-[#E2E8F0]">0 PLN</span>
                <span className="ml-1.5 text-xs font-bold text-[#8290A2]">/ na zawsze</span>
              </div>

              <div className="mt-8 border-t border-[#2A2A3A]/50 pt-6 space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-[#8290A2]">Co zawiera plan Free:</p>
                <ul className="space-y-3.5">
                  <li className="flex items-center gap-2.5">
                    <span className="text-[#6EE7B7] font-bold">✓</span>
                    <span className="text-sm text-[#94A3B8]"><strong>{freeLimits.monthlyAnalyses}</strong> analiz promptów miesięcznie</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-[#6EE7B7] font-bold">✓</span>
                    <span className="text-sm text-[#94A3B8]">Maksymalnie <strong>12,000</strong> znaków na prompt</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-[#6EE7B7] font-bold">✓</span>
                    <span className="text-sm text-[#94A3B8]">Pełna historia analiz (wymaga logowania)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-[#6EE7B7] font-bold">✓</span>
                    <span className="text-sm text-[#94A3B8]">Eksport do Markdown / TXT</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-[#2A2A3A] font-bold">✗</span>
                    <span className="text-sm text-[#8290A2]">Eksport do PDF (Pro)</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-4">
              <Link
                href="/analyze"
                className="block text-center w-full rounded-lg border border-[#2A2A3A] bg-[#1C1C27] hover:bg-[#22223A] text-[#94A3B8] font-semibold py-3.5 text-sm transition-all"
              >
                Rozpocznij za darmo
              </Link>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="rounded-xl border border-[#A78BFA]/40 bg-[#13131A] p-8 flex flex-col justify-between transition duration-300 relative glow-violet">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full gradient-btn px-4 py-1 text-[10px] font-black text-white uppercase tracking-widest">
              Najpopularniejszy
            </div>

            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-[#E2E8F0] font-heading">{proLimits.name} Tier</h3>
                  <p className="mt-2 text-xs text-[#8290A2]">Dla zaawansowanych twórców i profesjonalistów.</p>
                </div>
                {(profile?.plan_slug === 'pro' || hasActiveProSub) && (
                  <span className="rounded-full bg-[#1C1C27] border border-[#A78BFA]/30 px-3 py-1 text-[10px] font-black text-[#A78BFA] uppercase tracking-wider">
                    Twój aktualny plan
                  </span>
                )}
              </div>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-[#E2E8F0]">19 PLN</span>
                <span className="ml-1.5 text-xs font-bold text-[#8290A2]">/ miesiąc</span>
              </div>

              <div className="mt-8 border-t border-[#2A2A3A]/50 pt-6 space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-[#A78BFA]">Wszystkie zalety Pro:</p>
                <ul className="space-y-3.5">
                  <li className="flex items-center gap-2.5">
                    <span className="text-[#6EE7B7] font-bold">✓</span>
                    <span className="text-sm text-[#94A3B8]"><strong>{proLimits.monthlyAnalyses}</strong> analiz promptów miesięcznie</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-[#6EE7B7] font-bold">✓</span>
                    <span className="text-sm text-[#94A3B8]">Maksymalnie <strong>24,000</strong> znaków na prompt</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-[#6EE7B7] font-bold">✓</span>
                    <span className="text-sm text-[#94A3B8]"><strong>Eksport PDF (Pro)</strong> – elegancki raport dla klienta</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-4 space-y-4">
              {profile?.plan_slug === 'pro' || hasActiveProSub ? (
                <div className="space-y-3">
                  <div className="text-center text-xs font-bold text-[#6EE7B7] bg-[#6EE7B7]/10 border border-[#6EE7B7]/20 py-3 rounded-lg">
                    🎉 Masz już Pro
                  </div>
                  {subscription && stripeEnabled ? (
                    <div className="flex flex-col gap-2">
                      <PortalButton lang="pl" />
                      <Link
                        href="/account"
                        className="block text-center w-full rounded-lg border border-[#2A2A3A] bg-[#1C1C27] hover:bg-[#22223A] text-[#94A3B8] font-semibold py-3.5 text-sm active:scale-[0.98] transition-all cursor-pointer"
                      >
                        Przejdź do panelu konta
                      </Link>
                    </div>
                  ) : (
                    <Link
                      href="/account"
                      className="block text-center w-full rounded-lg border border-[#2A2A3A] bg-[#1C1C27] hover:bg-[#22223A] text-[#94A3B8] font-semibold py-3.5 text-sm active:scale-[0.98] transition-all cursor-pointer"
                    >
                      Przejdź do panelu konta
                    </Link>
                  )}
                </div>
              ) : user && stripeEnabled ? (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <CheckoutButton lang="pl" label="Przejdź do płatności testowej" />
                  <p className="text-[10px] text-[#A78BFA] text-center leading-relaxed font-semibold">
                    Płatność testowa Stripe — karta nie zostanie obciążona.
                  </p>
                </div>
              ) : !stripeEnabled ? (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <WaitlistForm lang="pl" />
                </div>
              ) : (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <Link
                    href="/login?redirectTo=/pricing"
                    className="block text-center w-full rounded-lg gradient-btn text-white font-bold py-3.5 text-xs active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Przejdź do płatności testowej
                  </Link>
                  <p className="text-[10px] text-[#A78BFA] text-center leading-relaxed font-semibold">
                    Płatność testowa Stripe — karta nie zostanie obciążona.
                  </p>
                </div>
              )}


            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="mt-20 border-t border-[#2A2A3A] pt-16 max-w-3xl mx-auto space-y-8">
          <h3 className="text-2xl font-bold text-center text-[#E2E8F0] font-heading">Najczęściej zadawane pytania</h3>
          <div className="grid gap-6">
            <div className="rounded-xl border border-[#2A2A3A] bg-[#13131A] p-5 space-y-2">
              <h4 className="text-sm font-bold text-[#E2E8F0] font-heading">Czy mogę korzystać z narzędzia za darmo?</h4>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Tak! Zarejestrowani użytkownicy otrzymują 20 bezpłatnych analiz miesięcznie, a użytkownicy anonimowi mają dzienny limit chroniący infrastrukturę.
              </p>
            </div>
            <div className="rounded-xl border border-[#2A2A3A] bg-[#13131A] p-5 space-y-2">
              <h4 className="text-sm font-bold text-[#E2E8F0] font-heading">Kiedy płatności będą w pełni aktywne?</h4>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Obecnie PromptPolish jest w fazie otwartych testów (Public Beta). Wszystkie płatności realizowane są w trybie testowym Stripe (Test Mode).
              </p>
            </div>

            <div className="rounded-xl border border-[#2A2A3A] bg-[#13131A] p-5 space-y-2">
              <h4 className="text-sm font-bold text-[#E2E8F0] font-heading">Czy moje dane są bezpieczne?</h4>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Zdecydowanie. Nasz wbudowany bezpieczny skaner danych preflight natychmiast blokuje i uniemożliwia zapisywanie promptów zawierających wrażliwe dane lub sekrety (jak klucze API).
              </p>
            </div>
          </div>
        </div>
      </main>
      
      {shouldRenderDiagnostics && (
        <div
          id="stripe-debug-diagnostics"
          className="hidden"
          data-stripe-enabled-env={process.env.STRIPE_ENABLED}
          data-stripe-enabled-is-true={process.env.STRIPE_ENABLED === 'true'}
          data-stripe-secret-key-configured={!!process.env.STRIPE_SECRET_KEY}
          data-stripe-price-id-configured={!!process.env.STRIPE_PRICE_ID_PRO}
          data-stripe-enabled-resolved={stripeEnabled}
          data-app-url-configured={!!process.env.APP_URL}
        />
      )}

      <AppFooter />
    </div>
  )
}
