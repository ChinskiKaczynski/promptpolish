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
          <div className="mt-6 mb-2 flex items-center justify-center gap-2 text-xs text-[#4A5568] font-mono">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#F97316]"></span>
            Beta — płatności tymczasowo niedostępne. Dostępna symulacja Pro po zalogowaniu.
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
                  <p className="mt-2 text-xs text-[#4A5568]">Dla hobbystów i osób testujących narzędzie.</p>
                </div>
                {(!profile || profile.plan_slug === 'free') && (
                  <span className="rounded-full bg-[#1C1C27] border border-[#2A2A3A] px-3 py-1 text-[10px] font-black text-[#A78BFA] uppercase tracking-wider">
                    Twój aktualny plan
                  </span>
                )}
              </div>
              <div className="mt-6 flex items-baseline">
                <span className="text-4xl font-extrabold font-mono text-[#E2E8F0]">0 PLN</span>
                <span className="ml-1.5 text-xs font-bold text-[#4A5568]">/ na zawsze</span>
              </div>

              <div className="mt-8 border-t border-[#2A2A3A]/50 pt-6 space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-[#4A5568]">Co zawiera plan Free:</p>
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
                    <span className="text-sm text-[#4A5568]">Eksport do PDF (Pro)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-[#2A2A3A] font-bold">✗</span>
                    <span className="text-sm text-[#4A5568]">Zbiorczy audyt (Batch Audit) wielu promptów</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-4">
              <Link
                href="/analyze"
                className="block text-center w-full rounded-lg border border-[#2A2A3A] bg-[#1C1C27] hover:bg-[#22223A] text-[#94A3B8] font-semibold py-3.5 text-sm active:scale-[0.98] transition-all cursor-pointer"
              >
                Rozpocznij za darmo
              </Link>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="rounded-xl border border-[#A78BFA]/40 bg-[#13131A] p-8 flex flex-col justify-between hover:shadow-violet-glow transition duration-300 relative glow-violet">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full gradient-btn px-4 py-1 text-[10px] font-black text-white uppercase tracking-widest">
              Najpopularniejszy
            </div>

            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-[#E2E8F0] font-heading">{proLimits.name} Tier</h3>
                  <p className="mt-2 text-xs text-[#4A5568]">Dla zaawansowanych twórców i profesjonalistów.</p>
                </div>
                {profile?.plan_slug === 'pro' && (
                  <span className="rounded-full bg-[#1C1C27] border border-[#A78BFA]/30 px-3 py-1 text-[10px] font-black text-[#A78BFA] uppercase tracking-wider">
                    Twój aktualny plan
                  </span>
                )}
              </div>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-[#E2E8F0]">Cena TBD</span>
                <span className="rounded-full bg-[#1C1C27] border border-[#2A2A3A] px-2.5 py-0.5 text-[9px] font-black text-[#A78BFA] uppercase tracking-widest">
                  Lista oczekujących
                </span>
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
                  <li className="flex items-center gap-2.5">
                    <span className="text-[#6EE7B7] font-bold">✓</span>
                    <span className="text-sm text-[#94A3B8]"><strong>Batch Audit (Pro)</strong> – analizuj wiele promptów naraz</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-4 space-y-4">
              {profile?.plan_slug === 'pro' ? (
                <div className="space-y-3">
                  <div className="text-center text-xs font-bold text-[#6EE7B7] bg-[#6EE7B7]/10 border border-[#6EE7B7]/20 py-3 rounded-lg animate-pulse">
                    🎉 Masz aktywny plan Pro!
                  </div>
                  <Link
                    href="/account"
                    className="block text-center w-full rounded-lg border border-[#2A2A3A] bg-[#1C1C27] hover:bg-[#22223A] text-[#94A3B8] font-semibold py-3.5 text-sm active:scale-[0.98] transition-all cursor-pointer"
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
                  <div className="rounded-lg border border-[#F59E0B]/20 bg-[#F59E0B]/5 px-4 py-3 text-center text-xs font-semibold text-[#F59E0B]">
                    Zakup Pro niedostępny w becie.
                  </div>
                  <WaitlistForm lang="pl" />
                </div>
              ) : (
                <div className="space-y-3">
                  <Link
                    href="/login?redirectTo=/pricing"
                    className="block text-center w-full rounded-lg gradient-btn text-white font-bold py-3.5 text-xs active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Zaloguj się, aby odblokować Pro
                  </Link>
                  <p className="text-[10px] text-[#4A5568] text-center leading-relaxed">
                    Konta są darmowe i bezpieczne.
                  </p>
                </div>
              )}

              {/* Developer Simulation Gate */}
              <div className="border-t border-[#2A2A3A]/50 pt-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#4A5568] text-center mb-2">
                  Tryb Deweloperski / Testy Integracyjne
                </p>
                {user ? (
                  <SimulateProButton isPro={profile?.plan_slug === 'pro'} />
                ) : (
                  <Link
                    href="/login"
                    className="block text-center w-full rounded-lg border border-[#2A2A3A] bg-[#1C1C27] hover:bg-[#22223A] text-[#94A3B8] font-semibold py-2 text-xs active:scale-[0.98] transition-all text-center cursor-pointer"
                  >
                    Zaloguj się, aby symulować Pro
                  </Link>
                )}
              </div>
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
                Obecnie PromptPolish jest w fazie zamkniętych testów beta. Pracujemy nad integracją Stripe, ale na ten moment wszystkie funkcje premium można testować bezpłatnie po zalogowaniu i włączeniu symulacji Pro.
              </p>
            </div>
            <div className="rounded-xl border border-[#2A2A3A] bg-[#13131A] p-5 space-y-2">
              <h4 className="text-sm font-bold text-[#E2E8F0] font-heading">Jak mogę przetestować funkcje Pro?</h4>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Jeśli chcesz wypróbować możliwości wersji Pro (np. eksport PDF, Markdown lub wyższe limity długości promptu), zaloguj się i użyj przycisku „Aktywuj Symulację Pro” w sekcji deweloperskiej powyżej.
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

      <AppFooter />
    </div>
  )
}
