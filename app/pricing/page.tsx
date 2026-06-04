import Link from 'next/link'
import nextDynamic from 'next/dynamic'
import { getAuthUser } from '@/lib/identity/auth'
import { ensureUserProfile, createUsageEvent } from '@/lib/supabase/queries'
import { getOwnerIdFromCookies } from '@/lib/identity/anonymous'
import { PLAN_LIMITS } from '@/lib/plans/config'
import { AppHeader } from '@/components/layout/app-header'
import { AppFooter } from '@/components/layout/app-footer'

const CheckoutButton = nextDynamic(() => import('@/components/pricing/checkout-button').then((mod) => mod.CheckoutButton))
const SimulateProButton = nextDynamic(() => import('@/components/pricing/simulate-pro-button').then((mod) => mod.SimulateProButton))
const WaitlistForm = nextDynamic(() => import('@/components/pricing/waitlist-form').then((mod) => mod.WaitlistForm))

export const dynamic = 'force-dynamic'

export default async function PricingPage() {
  const user = await getAuthUser()
  const stripeEnabled = process.env.STRIPE_ENABLED === 'true'
  let profile = null

  if (user) {
    profile = await ensureUserProfile({
      user_id: user.id,
      email: user.email || '',
      display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || null,
    })
  }

  const ownerAnonymousId = await getOwnerIdFromCookies()

  createUsageEvent({
    owner_anonymous_id: ownerAnonymousId || '',
    user_id: user?.id ?? null,
    event_type: 'pricing_viewed',
    metadata_json: {
      stripe_enabled: stripeEnabled,
      plan_slug: profile?.plan_slug ?? null,
    },
  }).catch((err) => {
    console.error('Failed to log pricing_viewed event:', err)
  })

  const freeLimits = PLAN_LIMITS.free
  const proLimits = PLAN_LIMITS.pro

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/30 text-slate-900 antialiased font-sans pb-16">
      <AppHeader />

      {/* Beta Notice Banner */}
      {!stripeEnabled && (
        <div className="w-full bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 text-center text-xs font-semibold text-amber-800">
          ⚠️ <strong>Beta:</strong> Bramka płatności Stripe jest wyłączona. Zakup Pro jest niedostępny — możesz testować symulację Pro po zalogowaniu.
        </div>
      )}

      {/* Main Section */}
      <main className="flex-grow mx-auto w-full max-w-5xl px-6 py-16">
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-100/50 px-3.5 py-1 text-xs font-semibold text-indigo-700 uppercase tracking-wider">
            Plany i Cennik — Faza Beta
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-slate-950">
            Wybierz plan dopasowany do swoich potrzeb
          </h1>
          <p className="text-sm text-slate-550 leading-relaxed max-w-lg mx-auto">
            Przestań zgadywać. Poleruj swoje instrukcje za pomocą precyzyjnych audytów zoptymalizowanych pod kątem najnowszych modeli językowych.
          </p>
        </div>

        {/* Plan Grid */}
        <div className="mt-16 grid gap-8 md:grid-cols-2 max-w-4xl mx-auto items-stretch">
          {/* Free Plan */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-8 flex flex-col justify-between hover:border-slate-300 transition duration-300 relative shadow-md">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{freeLimits.name}</h3>
                  <p className="mt-2 text-xs text-slate-450">Dla hobbystów i osób testujących narzędzie.</p>
                </div>
                {(!profile || profile.plan_slug === 'free') && (
                  <span className="rounded-full bg-slate-50 border border-slate-200/60 px-3 py-1 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Twój aktualny plan
                  </span>
                )}
              </div>
              <div className="mt-6 flex items-baseline">
                <span className="text-4xl font-extrabold text-slate-900">0 PLN</span>
                <span className="ml-1.5 text-xs font-bold text-slate-455">/ na zawsze</span>
              </div>

              <div className="mt-8 border-t border-slate-100 pt-6 space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-450">Co zawiera plan Free:</p>
                <ul className="space-y-3.5 text-sm text-slate-650">
                  <li className="flex items-center gap-2.5">
                    <span className="text-emerald-555 font-bold">✓</span>
                    <span><strong>{freeLimits.monthlyAnalyses}</strong> analiz promptów miesięcznie</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-emerald-555 font-bold">✓</span>
                    <span>Maksymalnie <strong>12,000</strong> znaków na prompt</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-emerald-555 font-bold">✓</span>
                    <span>Pełna historia analiz (wymaga logowania)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-emerald-555 font-bold">✓</span>
                    <span>Eksport do Markdown / TXT</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-slate-400">
                    <span className="text-slate-300">✗</span>
                    <span>Eksport do PDF (Pro)</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-slate-400">
                    <span className="text-slate-300">✗</span>
                    <span>Zbiorczy audyt (Batch Audit) wielu promptów</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-4">
              <Link
                href="/analyze"
                className="block text-center w-full rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold py-3.5 text-xs active:scale-[0.98] transition-all border border-slate-200 cursor-pointer"
              >
                Rozpocznij za darmo
              </Link>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="rounded-3xl border-2 border-indigo-500/50 bg-white p-8 flex flex-col justify-between hover:shadow-2xl hover:shadow-indigo-500/5 transition duration-300 relative shadow-lg glow-purple">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-1 text-[10px] font-black text-white uppercase tracking-widest shadow-md">
              Najpopularniejszy
            </div>

            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{proLimits.name} Tier</h3>
                  <p className="mt-2 text-xs text-slate-450">Dla zaawansowanych twórców i profesjonalistów.</p>
                </div>
                {profile?.plan_slug === 'pro' && (
                  <span className="rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-[10px] font-black text-indigo-700 uppercase tracking-wider">
                    Twój aktualny plan
                  </span>
                )}
              </div>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Cena TBD</span>
                <span className="rounded-full bg-indigo-50 border border-indigo-100/50 px-2.5 py-0.5 text-[9px] font-black text-indigo-700 uppercase tracking-widest">
                  Lista oczekujących
                </span>
              </div>

              <div className="mt-8 border-t border-slate-105 pt-6 space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Wszystkie zalety Pro:</p>
                <ul className="space-y-3.5 text-sm text-slate-650">
                  <li className="flex items-center gap-2.5">
                    <span className="text-indigo-600 font-bold">✓</span>
                    <span><strong>{proLimits.monthlyAnalyses}</strong> analiz promptów miesięcznie</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-indigo-600 font-bold">✓</span>
                    <span>Maksymalnie <strong>24,000</strong> znaków na prompt</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-indigo-600 font-bold">✓</span>
                    <span><strong>Eksport PDF (Pro)</strong> – elegancki raport dla klienta</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-indigo-600 font-bold">✓</span>
                    <span><strong>Batch Audit (Pro)</strong> – analizuj wiele promptów naraz</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-4 space-y-4">
              {profile?.plan_slug === 'pro' ? (
                <div className="space-y-3">
                  <div className="text-center text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 py-3 rounded-xl animate-pulse">
                    🎉 Masz aktywny plan Pro!
                  </div>
                  <Link
                    href="/account"
                    className="block text-center w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 text-xs active:scale-[0.98] transition cursor-pointer"
                  >
                    Przejdź do panelu konta
                  </Link>
                </div>
              ) : user && stripeEnabled ? (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <CheckoutButton lang="pl" />
                </div>
              ) : user && !stripeEnabled ? (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-xs font-semibold text-amber-800">
                    Zakup Pro niedostępny w becie.
                  </div>
                  <WaitlistForm lang="pl" />
                </div>
              ) : (
                <div className="space-y-3">
                  <Link
                    href="/login?redirectTo=/pricing"
                    className="block text-center w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-3 text-xs active:scale-[0.98] transition cursor-pointer"
                  >
                    Zaloguj się, aby odblokować Pro
                  </Link>
                  <p className="text-[10px] text-slate-450 text-center leading-relaxed">
                    Konta są darmowe i bezpieczne.
                  </p>
                </div>
              )}

              {/* Developer Simulation Gate */}
              <div className="border-t border-slate-100 pt-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-450 text-center mb-2">
                  Tryb Deweloperski / Testy Integracyjne
                </p>
                {user ? (
                  <SimulateProButton isPro={profile?.plan_slug === 'pro'} />
                ) : (
                  <Link
                    href="/login"
                    className="block text-center w-full rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 font-semibold py-2 text-xs border border-slate-200 transition text-center cursor-pointer"
                  >
                    Zaloguj się, aby symulować Pro
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="mt-20 border-t border-slate-200/60 pt-16 max-w-3xl mx-auto space-y-8">
          <h3 className="text-2xl font-bold text-center text-slate-900">Najczęściej zadawane pytania</h3>
          <div className="grid gap-6">
            <div className="rounded-2xl border border-slate-200/70 bg-white p-5 space-y-2 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900">Czy mogę korzystać z narzędzia za darmo?</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tak! Zarejestrowani użytkownicy otrzymują 20 bezpłatnych analiz miesięcznie, a użytkownicy anonimowi mają dzienny limit chroniący infrastrukturę.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-white p-5 space-y-2 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900">Kiedy płatności będą w pełni aktywne?</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Obecnie PromptPolish jest w fazie zamkniętych testów beta. Pracujemy nad integracją Stripe, ale na ten moment wszystkie funkcje premium można testować bezpłatnie po zalogowaniu i włączeniu symulacji Pro.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-white p-5 space-y-2 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900">Jak mogę przetestować funkcje Pro?</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Jeśli chcesz wypróbować możliwości wersji Pro (np. eksport PDF, Markdown lub wyższe limity długości promptu), zaloguj się i użyj przycisku „Aktywuj Symulację Pro” w sekcji deweloperskiej powyżej.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-white p-5 space-y-2 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900">Czy moje dane są bezpieczne?</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Zdecydowanie. Nasz wbudowany bezpieczny skaner danych preflight natychmiast blokuje i uniemożliwia zapisywanie promptów zawierających wrażliwe dane lub sekrety (jak klucze API).
              </p>
            </div>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}
