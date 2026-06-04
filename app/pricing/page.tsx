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

  // Resolve ownerAnonymousId for telemetry
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
    <div className="flex min-h-screen flex-col pp-grid-bg text-pp-text selection:bg-pp-border-bright selection:text-white antialiased font-mono pb-16">
      <AppHeader theme="dark" />

      {/* Beta Notice Banner */}
      {!stripeEnabled && (
        <div className="w-full bg-pp-warning/10 border-b-2 border-pp-warning px-6 py-2.5 text-center text-xs font-semibold text-pp-warning">
          ⚠️ <strong>Beta:</strong> Bramka płatności Stripe jest wyłączona. Zakup Pro jest niedostępny — możesz testować symulację Pro po zalogowaniu.
        </div>
      )}

      {/* Main Section */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-12 z-10 relative">
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto space-y-4 border-b-2 border-pp-border pb-8">
          <div className="inline-flex items-center gap-2 border border-pp-border-bright bg-pp-panel px-3 py-1 text-xs font-semibold text-pp-cyan uppercase tracking-wider">
            Plany i Cennik — Faza Beta
          </div>
          <h1 className="text-3xl font-black uppercase tracking-wider text-pp-text">
            Zasoby i subskrypcje
          </h1>
          <p className="text-xs text-pp-muted leading-relaxed uppercase">
            Wybierz stopień zaawansowania dla swoich promptów. Odblokuj pełne inżynieryjne metryki i eksporty.
          </p>
        </div>

        {/* Plan Grid */}
        <div className="mt-16 grid gap-8 md:grid-cols-2 max-w-4xl mx-auto items-stretch">
          
          {/* Free Plan */}
          <div className="pp-panel p-8 border-2 border-pp-border flex flex-col justify-between relative group">
            <div className="absolute top-0 right-4 -translate-y-1/2 bg-pp-bg px-2 text-[9px] font-bold text-pp-muted tracking-widest uppercase">
              {"// FREE_CARTRIDGE"}
            </div>
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">{freeLimits.name}</h3>
                  <p className="mt-2 text-[11px] text-pp-muted uppercase">Dla hobbystów i osób testujących narzędzie.</p>
                </div>
                {(!profile || profile.plan_slug === 'free') && (
                  <span className="border border-pp-border bg-pp-bg px-2 py-0.5 text-[8px] font-bold text-pp-muted uppercase">
                    Aktualny
                  </span>
                )}
              </div>
              <div className="mt-6 flex items-baseline">
                <span className="text-3xl font-black text-white">0 PLN</span>
                <span className="ml-1.5 text-xs text-pp-muted font-bold">/ NA ZAWSZE</span>
              </div>

              <div className="mt-8 border-t border-pp-border/40 pt-6 space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-pp-muted">Zawartość planu Free:</p>
                <ul className="space-y-3.5 text-xs text-pp-text uppercase">
                  <li className="flex items-center gap-2">
                    <span className="text-pp-success text-sm font-bold">[✓]</span>
                    <span><strong>{freeLimits.monthlyAnalyses}</strong> analiz promptów / miesiąc</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-pp-success text-sm font-bold">[✓]</span>
                    <span>Maksymalnie <strong>12,000</strong> znaków</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-pp-success text-sm font-bold">[✓]</span>
                    <span>Pełna historia analiz (zapis)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-pp-success text-sm font-bold">[✓]</span>
                    <span>Eksport do Markdown / TXT</span>
                  </li>
                  <li className="flex items-center gap-2 text-pp-muted">
                    <span>[x]</span>
                    <span>Eksport do PDF (PRO)</span>
                  </li>
                  <li className="flex items-center gap-2 text-pp-muted">
                    <span>[x]</span>
                    <span>Zbiorczy audyt (PRO)</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-4">
              <Link
                href="/analyze"
                className="pp-button w-full text-center py-3 text-xs"
              >
                ROZPOCZNIJ ZA DARMO
              </Link>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="pp-panel p-8 border-2 border-pp-border-bright flex flex-col justify-between relative">
            <div className="absolute top-0 right-4 -translate-y-1/2 bg-pp-bg px-2 text-[9px] font-bold text-pp-primary-bright tracking-widest uppercase">
              {"// PRO_CARTRIDGE"}
            </div>
            
            <div className="absolute -top-3 left-6 bg-pp-border-bright px-3 py-0.5 text-[8px] font-black text-white uppercase tracking-widest shadow-md">
              POLECANY
            </div>

            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-pp-primary-bright">{proLimits.name} TIER</h3>
                  <p className="mt-2 text-[11px] text-pp-muted uppercase">Dla zaawansowanych twórców i profesjonalistów.</p>
                </div>
                {profile?.plan_slug === 'pro' && (
                  <span className="border border-pp-border-bright bg-pp-primary/20 px-2 py-0.5 text-[8px] font-bold text-pp-cyan uppercase">
                    Aktywny
                  </span>
                )}
              </div>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-2xl font-black text-pp-cyan drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]">Cena TBD</span>
                <span className="border border-pp-cyan bg-pp-cyan/10 px-2 py-0.5 text-[9px] font-bold text-pp-cyan uppercase tracking-widest">
                  Lista oczekujących
                </span>
              </div>

              <div className="mt-8 border-t border-pp-border/40 pt-6 space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-pp-muted">Wszystkie funkcje Pro:</p>
                <ul className="space-y-3.5 text-xs text-pp-text uppercase">
                  <li className="flex items-center gap-2">
                    <span className="text-pp-cyan text-sm font-bold">[✓]</span>
                    <span><strong>{proLimits.monthlyAnalyses}</strong> analiz promptów / miesiąc</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-pp-cyan text-sm font-bold">[✓]</span>
                    <span>Maksymalnie <strong>24,000</strong> znaków</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-pp-cyan text-sm font-bold">[✓]</span>
                    <span><strong>Eksport PDF</strong> – profesjonalny raport</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-pp-cyan text-sm font-bold">[✓]</span>
                    <span><strong>Batch Audit</strong> – analizuj paczki promptów</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-4 space-y-4">
              {profile?.plan_slug === 'pro' ? (
                <div className="space-y-3">
                  <div className="text-center text-xs font-bold text-pp-success bg-pp-success/10 border border-pp-success py-3 uppercase">
                    🎉 Masz aktywny plan Pro!
                  </div>
                  <Link
                    href="/account"
                    className="pp-button pp-button-primary w-full text-center py-3 text-xs"
                  >
                    PANEL KONTA &gt;&gt;
                  </Link>
                </div>
              ) : user && stripeEnabled ? (
                <div className="space-y-3">
                  <CheckoutButton lang="pl" />
                </div>
              ) : user && !stripeEnabled ? (
                /* Stripe disabled */
                <div className="space-y-3">
                  <div className="border border-pp-warning bg-pp-warning/10 px-4 py-2.5 text-center text-[10px] font-bold text-pp-warning uppercase">
                    Zakup Pro niedostępny w becie.
                  </div>
                  <WaitlistForm lang="pl" />
                </div>
              ) : (
                <div className="space-y-3">
                  <Link
                    href="/login?redirectTo=/pricing"
                    className="pp-button pp-button-primary w-full text-center py-3 text-xs"
                  >
                    ZALOGUJ SIĘ ABY ODBLOKOWAĆ PRO
                  </Link>
                  <p className="text-[9px] text-pp-muted text-center leading-relaxed uppercase">
                    Konta są darmowe i bezpieczne.
                  </p>
                </div>
              )}

              {/* Developer Simulation Gate */}
              <div className="border-t border-pp-border pt-4">
                <p className="text-[8px] font-bold uppercase tracking-widest text-pp-muted text-center mb-2">
                  {"// DEVEL // SYMULACJA_BRAMKI"}
                </p>
                {user ? (
                  <SimulateProButton isPro={profile?.plan_slug === 'pro'} />
                ) : (
                  <Link
                    href="/login"
                    className="pp-button w-full text-center py-2 text-xs border-pp-border text-pp-muted hover:text-pp-text"
                  >
                    ZALOGUJ SIĘ ABY SYMULOWAĆ PRO
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="mt-20 border-t-2 border-pp-border pt-16 max-w-3xl mx-auto space-y-8">
          <h3 className="text-lg font-black tracking-wider text-center text-white uppercase">{"// FAQ // BAZA_WIEDZY"}</h3>
          <div className="grid gap-6">
            <div className="pp-panel p-5 border border-pp-border space-y-2 relative">
              <div className="absolute top-0 left-4 -translate-y-1/2 bg-pp-bg px-2 text-[9px] font-bold text-pp-cyan uppercase">
                Q1
              </div>
              <h4 className="text-xs font-bold text-white uppercase">Czy mogę korzystać z narzędzia za darmo?</h4>
              <p className="text-[11px] text-pp-muted leading-relaxed uppercase">
                Tak! Zarejestrowani użytkownicy otrzymują 20 bezpłatnych analiz miesięcznie, a użytkownicy anonimowi mają dzienny limit chroniący infrastrukturę.
              </p>
            </div>
            
            <div className="pp-panel p-5 border border-pp-border space-y-2 relative">
              <div className="absolute top-0 left-4 -translate-y-1/2 bg-pp-bg px-2 text-[9px] font-bold text-pp-cyan uppercase">
                Q2
              </div>
              <h4 className="text-xs font-bold text-white uppercase">Kiedy płatności będą w pełni aktywne?</h4>
              <p className="text-[11px] text-pp-muted leading-relaxed uppercase">
                Obecnie PromptPolish jest w fazie testów beta. Pracujemy nad integracją Stripe, ale na ten moment wszystkie funkcje premium można testować bezpłatnie po zalogowaniu i włączeniu symulacji Pro.
              </p>
            </div>

            <div className="pp-panel p-5 border border-pp-border space-y-2 relative">
              <div className="absolute top-0 left-4 -translate-y-1/2 bg-pp-bg px-2 text-[9px] font-bold text-pp-cyan uppercase">
                Q3
              </div>
              <h4 className="text-xs font-bold text-white uppercase">Jak mogę przetestować funkcje Pro?</h4>
              <p className="text-[11px] text-pp-muted leading-relaxed uppercase">
                Jeśli chcesz wypróbować możliwości wersji Pro (np. eksport PDF, Markdown lub wyższe limity), zaloguj się i użyj przycisku „Aktywuj Symulację Pro” w sekcji deweloperskiej powyżej.
              </p>
            </div>

            <div className="pp-panel p-5 border border-pp-border space-y-2 relative">
              <div className="absolute top-0 left-4 -translate-y-1/2 bg-pp-bg px-2 text-[9px] font-bold text-pp-cyan uppercase">
                Q4
              </div>
              <h4 className="text-xs font-bold text-white uppercase">Czy moje dane są bezpieczne?</h4>
              <p className="text-[11px] text-pp-muted leading-relaxed uppercase">
                Zdecydowanie. Nasz wbudowany bezpieczny skaner danych preflight natychmiast blokuje i uniemożliwia zapisywanie promptów zawierających wrażliwe dane lub sekrety.
              </p>
            </div>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}
