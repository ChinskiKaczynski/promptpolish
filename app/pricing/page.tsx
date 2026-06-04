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

  // Resolve ownerAnonymousId for telemetry (works for both anonymous and authenticated users)
  const ownerAnonymousId = await getOwnerIdFromCookies()

  // Fire pricing_viewed telemetry event
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
    <div className="flex min-h-screen flex-col bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.12),rgba(255,255,255,0))] text-slate-100 antialiased font-sans pb-16">
      <AppHeader theme="dark" />

      {/* Beta Notice Banner */}
      {!stripeEnabled && (
        <div className="w-full bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 text-center text-xs font-semibold text-amber-300">
          ⚠️ <strong>Beta:</strong> Bramka płatności Stripe jest wyłączona. Zakup Pro jest niedostępny — możesz testować symulację Pro po zalogowaniu.
        </div>
      )}

      {/* Main Section */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-12">
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            Plany i Cennik — Faza Beta
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
            Wybierz plan dopasowany do swoich potrzeb
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Przestań zgadywać. Poleruj swoje instrukcje za pomocą precyzyjnych audytów zoptymalizowanych pod kątem najnowszych modeli językowych.
          </p>
        </div>

        {/* Plan Grid */}
        <div className="mt-16 grid gap-8 md:grid-cols-2 max-w-4xl mx-auto items-stretch">
          {/* Free Plan */}
          <div className="rounded-3xl border border-slate-900 bg-slate-900/20 p-8 flex flex-col justify-between hover:border-slate-800 transition duration-300 relative group">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-white">{freeLimits.name}</h3>
                  <p className="mt-2 text-xs text-slate-400">Dla hobbystów i osób testujących narzędzie.</p>
                </div>
                {(!profile || profile.plan_slug === 'free') && (
                  <span className="rounded-full bg-slate-900 border border-slate-800 px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Twój aktualny plan
                  </span>
                )}
              </div>
              <div className="mt-6 flex items-baseline">
                <span className="text-4xl font-extrabold text-white">0 PLN</span>
                <span className="ml-1 text-sm text-slate-500">/ na zawsze</span>
              </div>

              <div className="mt-8 border-t border-slate-900 pt-6 space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Co zawiera plan Free:</p>
                <ul className="space-y-3.5 text-sm text-slate-300">
                  <li className="flex items-center gap-2.5">
                    <span className="text-emerald-500 text-base">✓</span>
                    <span><strong>{freeLimits.monthlyAnalyses}</strong> analiz promptów miesięcznie</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-emerald-500 text-base">✓</span>
                    <span>Maksymalnie <strong>12,000</strong> znaków na prompt</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-emerald-500 text-base">✓</span>
                    <span>Pełna historia analiz (wymaga logowania)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-emerald-500 text-base">✓</span>
                    <span>Eksport do Markdown / TXT</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-slate-600">
                    <span>✗</span>
                    <span>Eksport do PDF (Pro)</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-slate-600">
                    <span>✗</span>
                    <span>Zbiorczy audyt (Batch Audit) wielu promptów</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-4">
              <Link
                href="/analyze"
                className="block text-center w-full rounded-2xl bg-slate-900 hover:bg-slate-850 text-white font-semibold py-3.5 text-xs active:scale-[0.98] transition-all border border-slate-800 cursor-pointer"
              >
                Rozpocznij za darmo
              </Link>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="rounded-3xl border-2 border-indigo-500/50 bg-slate-900/40 p-8 flex flex-col justify-between hover:shadow-2xl hover:shadow-indigo-500/5 transition duration-300 relative group">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-1 text-[10px] font-black text-white uppercase tracking-widest shadow-md">
              Najpopularniejszy
            </div>

            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-white">{proLimits.name} Tier</h3>
                  <p className="mt-2 text-xs text-slate-300">Dla zaawansowanych twórców i profesjonalistów.</p>
                </div>
                {profile?.plan_slug === 'pro' && (
                  <span className="rounded-full bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 text-[10px] font-black text-indigo-400 uppercase tracking-wider">
                    Twój aktualny plan
                  </span>
                )}
              </div>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-3xl font-black bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Cena TBD</span>
                <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                  Lista oczekujących
                </span>
              </div>

              <div className="mt-8 border-t border-indigo-950/80 pt-6 space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Wszystkie zalety Pro:</p>
                <ul className="space-y-3.5 text-sm text-slate-200">
                  <li className="flex items-center gap-2.5">
                    <span className="text-indigo-400 text-base">✓</span>
                    <span><strong>{proLimits.monthlyAnalyses}</strong> analiz promptów miesięcznie</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-indigo-400 text-base">✓</span>
                    <span>Maksymalnie <strong>24,000</strong> znaków na prompt</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-indigo-400 text-base">✓</span>
                    <span><strong>Eksport PDF (Pro)</strong> – elegancki raport dla klienta</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-indigo-400 text-base">✓</span>
                    <span><strong>Batch Audit (Pro)</strong> – analizuj wiele promptów naraz</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-4 space-y-4">
              {profile?.plan_slug === 'pro' ? (
                <div className="space-y-3">
                  <div className="text-center text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-3 rounded-xl animate-pulse-subtle">
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
                /* Stripe disabled: show waitlist form as primary CTA, simulate-pro as dev tool */
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-center text-xs font-semibold text-amber-300">
                    Zakup Pro niedostępny w becie.
                  </div>
                  <WaitlistForm lang="pl" />
                </div>
              ) : (
                <div className="space-y-3">
                  <Link
                    href="/login?redirectTo=/pricing"
                    className="block text-center w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-bold py-3 text-xs active:scale-[0.98] transition cursor-pointer"
                  >
                    Zaloguj się, aby odblokować Pro
                  </Link>
                  <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                    Konta są darmowe i bezpieczne.
                  </p>
                </div>
              )}

              {/* Developer Simulation Gate */}
              <div className="border-t border-slate-900 pt-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 text-center mb-2">
                  Tryb Deweloperski / Testy Integracyjne
                </p>
                {user ? (
                  <SimulateProButton isPro={profile?.plan_slug === 'pro'} />
                ) : (
                  <Link
                    href="/login"
                    className="block text-center w-full rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white font-semibold py-2 text-xs border border-slate-800 transition text-center cursor-pointer"
                  >
                    Zaloguj się, aby symulować Pro
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="mt-20 border-t border-slate-900 pt-16 max-w-3xl mx-auto space-y-8">
          <h3 className="text-xl font-bold text-center text-white">Najczęściej zadawane pytania</h3>
          <div className="grid gap-6">
            <div className="rounded-2xl border border-slate-900 bg-slate-900/10 p-5 space-y-2">
              <h4 className="text-sm font-bold text-white">Czy mogę korzystać z narzędzia za darmo?</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tak! Zarejestrowani użytkownicy otrzymują 20 bezpłatnych analiz miesięcznie, a użytkownicy anonimowi mają dzienny limit chroniący infrastrukturę.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-900 bg-slate-900/10 p-5 space-y-2">
              <h4 className="text-sm font-bold text-white">Kiedy płatności będą w pełni aktywne?</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Obecnie PromptPolish jest w fazie zamkniętych testów beta. Pracujemy nad integracją Stripe, ale na ten moment wszystkie funkcje premium można testować bezpłatnie po zalogowaniu i włączeniu symulacji Pro.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-900 bg-slate-900/10 p-5 space-y-2">
              <h4 className="text-sm font-bold text-white">Jak mogę przetestować funkcje Pro?</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Jeśli chcesz wypróbować możliwości wersji Pro (np. eksport PDF, Markdown lub wyższe limity długości promptu), zaloguj się i użyj przycisku „Aktywuj Symulację Pro” w sekcji deweloperskiej powyżej.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-900 bg-slate-900/10 p-5 space-y-2">
              <h4 className="text-sm font-bold text-white">Czy moje dane są bezpieczne?</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Zdecydowanie. Nasz wbudowany bezpieczny skaner danych preflight natychmiast blokuje i uniemożliwia zapisywanie promptów zawierających wrażliwe dane lub sekrety (jak klucze API).
              </p>
            </div>
          </div>
        </div>
      </main>

      <AppFooter theme="dark" />
    </div>
  )
}
