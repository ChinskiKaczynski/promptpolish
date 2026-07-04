import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAuthUser } from '@/lib/identity/auth'
import { getOwnerIdFromCookies } from '@/lib/identity/anonymous'
import {
  getUserProfile,
  ensureUserProfile,
  getPromptAnalysesForUser,
  createUsageEvent,
  getUsageCountThisMonthForUser,
} from '@/lib/supabase/queries'
import { getSubscriptionByUserId } from '@/lib/supabase/billing'
import { AppHeader } from '@/components/layout/app-header'
import { AppFooter } from '@/components/layout/app-footer'
import { PortalButton } from '@/components/billing/portal-button'
import { PLAN_LIMITS } from '@/lib/plans/config'
import { UsageMeter } from '@/components/plans/usage-meter'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Konto — PromptPolish',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AccountPage() {
  // 1. Resolve secure server-side authenticated user session.
  const user = await getAuthUser()

  if (!user) {
    redirect('/login')
  }

  const displayName =
    typeof user.user_metadata?.display_name === 'string'
      ? user.user_metadata.display_name
      : user.email?.split('@')[0] || null

  // 2. Resolve or sync user profile without overwriting plan_slug.
  let profile = await getUserProfile(user.id)

  if (!profile) {
    profile = await ensureUserProfile({
      user_id: user.id,
      email: user.email || '',
      display_name: displayName,
    })
  }

  const planSlug = profile?.plan_slug === 'pro' ? 'pro' : 'free'

  // 3. Resolve history count combining user_id and current anonymous owner ID.
  const ownerAnonymousId = await getOwnerIdFromCookies()
  const history = await getPromptAnalysesForUser(user.id, ownerAnonymousId)

  // 4. Log account_viewed event (server-side)
  if (ownerAnonymousId) {
    await createUsageEvent({
      owner_anonymous_id: ownerAnonymousId,
      user_id: user.id,
      event_type: 'account_viewed',
      metadata_json: {}
    }).catch(err => {
      console.error('Failed to log account_viewed event:', err)
    })
  }

  // 5. Fetch subscription only when Stripe is active.
  const stripeEnabled =
    process.env.STRIPE_ENABLED === 'true' &&
    !!process.env.STRIPE_SECRET_KEY &&
    !!process.env.STRIPE_PRICE_ID_PRO
  const subscription = stripeEnabled ? await getSubscriptionByUserId(user.id) : null

  // 6. Calculate monthly usage metrics
  const monthlyCount = await getUsageCountThisMonthForUser(ownerAnonymousId, user.id)
  const limits = PLAN_LIMITS[planSlug]
  const monthlyLimit = limits.monthlyAnalyses

  return (
    <div className="flex min-h-screen flex-col bg-[#0C0C10] text-[#E2E8F0] selection:bg-[#A78BFA]/20 antialiased font-sans">
      <AppHeader />

      {/* Main Dashboard Layout */}
      <main className="flex-grow mx-auto w-full max-w-4xl px-6 py-10 space-y-8">
        
        {/* Profile Card */}
        <div className="rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#8290A2]">
                Panel użytkownika
              </p>

              <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-[#E2E8F0] font-heading">
                Witaj, {profile?.display_name || profile?.email || 'Użytkowniku'}!
              </h2>

              <p className="mt-1 text-xs text-[#8290A2]">{profile?.email}</p>
            </div>

            <div className="flex items-center gap-3">
              {planSlug === 'free' ? (
                <div className="rounded-lg border border-[#2A2A3A] bg-[#0C0C10] px-4 py-2 text-center">
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#8290A2] block">
                    Twój plan
                  </span>
                  <span className="mt-0.5 text-xs font-bold text-[#94A3B8] uppercase tracking-wide block">
                    Free
                  </span>
                </div>
              ) : (
                <div className="rounded-lg border border-[#A78BFA]/20 bg-[#A78BFA]/10 px-4 py-2 text-center">
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#A78BFA] block">
                    Twój plan
                  </span>
                  <span className="mt-0.5 text-xs font-bold text-[#A78BFA] uppercase tracking-wide block">
                    Pro
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Usage Stats Card */}
        <div className="rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-[#E2E8F0] font-heading">
              Statystyki użycia i limity
            </h3>
            <p className="mt-1 text-xs text-[#8290A2] font-medium">
              Podsumowanie przeprowadzonych analiz w bieżącym miesiącu UTC.
            </p>
          </div>

          <UsageMeter
            planSlug={planSlug}
            monthlyCount={monthlyCount}
            monthlyLimit={monthlyLimit}
            variant="inline"
            isSimulatedPro={planSlug === 'pro' && !stripeEnabled}
          />
        </div>

        {/* Billing Status UI Section */}
        <div className="rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6 sm:p-8">
          <h3 className="text-base font-bold tracking-tight text-[#E2E8F0] font-heading border-b border-[#1E1E2E] pb-4">
            Subskrypcja i rozliczenia
          </h3>



          {subscription ? (
            /* Stripe Subscription Details */
            <div className="mt-6 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border border-[#2A2A3A] bg-[#0C0C10] p-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#8290A2] block">
                    Status subskrypcji
                  </span>

                  <div className="mt-2 flex items-center gap-2">
                    {subscription.status === 'active' || subscription.status === 'trialing' ? (
                      subscription.cancel_at_period_end ? (
                        <>
                          <span className="h-2 w-2 rounded-full bg-[#F59E0B] animate-pulse" />
                          <span className="text-xs font-bold text-[#F59E0B]">
                            Aktywna anulowana
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="h-2 w-2 rounded-full bg-[#6EE7B7] animate-pulse" />
                          <span className="text-xs font-bold text-[#6EE7B7]">
                            Aktywna
                          </span>
                        </>
                      )
                    ) : subscription.status === 'past_due' ? (
                      <>
                        <span className="h-2 w-2 rounded-full bg-[#F59E0B] animate-pulse" />
                        <span className="text-xs font-bold text-[#F59E0B]">
                          Zaległa płatność
                        </span>
                      </>
                    ) : subscription.status === 'unpaid' ? (
                      <>
                        <span className="h-2 w-2 rounded-full bg-[#F87171] animate-pulse" />
                        <span className="text-xs font-bold text-[#F87171]">
                          Nieopłacona
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="h-2 w-2 rounded-full bg-[#8290A2]" />
                        <span className="text-xs font-bold text-[#8290A2]">
                          Wygasła ({subscription.status})
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-[#2A2A3A] bg-[#0C0C10] p-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#8290A2] block">
                    Okres rozliczeniowy
                  </span>
                  <span className="mt-2 text-xs font-bold text-[#94A3B8] block">
                    {new Date(subscription.current_period_start).toLocaleDateString('pl-PL')} –{' '}
                    {new Date(subscription.current_period_end).toLocaleDateString('pl-PL')}
                  </span>
                </div>

                <div className="rounded-lg border border-[#2A2A3A] bg-[#0C0C10] p-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#8290A2] block">
                    {subscription.cancel_at_period_end
                      ? 'Wygaśnięcie subskrypcji'
                      : 'Następna płatność'}
                  </span>
                  <span className="mt-2 text-xs font-bold text-[#94A3B8] block">
                    {new Date(subscription.current_period_end).toLocaleDateString('pl-PL')}
                  </span>
                </div>
              </div>

              {subscription.cancel_at_period_end && (
                <div className="rounded-lg border border-[#F59E0B]/25 bg-[#F59E0B]/6 p-4 text-xs text-[#F59E0B] leading-relaxed font-semibold">
                  <strong>Uwaga:</strong> Twoja subskrypcja została anulowana i wygaśnie dnia{' '}
                  <strong>
                    {new Date(subscription.current_period_end).toLocaleDateString('pl-PL')}
                  </strong>
                  . Do tego czasu masz pełny dostęp do wszystkich funkcji Pro. Żadne kolejne
                  opłaty nie zostaną pobrane.
                </div>
              )}

              {subscription.status === 'past_due' && (
                <div className="rounded-lg border border-[#F59E0B]/25 bg-[#F59E0B]/6 p-4 text-xs text-[#F59E0B] leading-relaxed font-semibold">
                  <strong>Zaległość w płatności:</strong> Nie udało się pobrać opłaty za kolejny
                  okres rozliczeniowy. Karta zostanie obciążona ponownie przez Stripe. Utrzymujemy
                  Twój dostęp do funkcji Pro przez okres przejściowy. Zaktualizuj dane płatnicze,
                  aby uniknąć przerw w dostępie.
                </div>
              )}

              {subscription.status === 'unpaid' && (
                <div className="rounded-lg border border-[#F87171]/25 bg-[#F87171]/6 p-4 text-xs text-[#F87171] leading-relaxed font-semibold">
                  <strong>Dostęp zawieszony:</strong> Twoje konto Pro zostało zawieszone z powodu
                  braku pomyślnej płatności. Zaktualizuj dane płatnicze w portalu Stripe poniżej,
                  aby odzyskać dostęp do Pro.
                </div>
              )}

              <div className="pt-4 border-t border-[#1E1E2E] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p className="text-xs text-[#8290A2] font-semibold">
                  Zarządzaj kartami płatniczymi, sprawdzaj faktury VAT lub anuluj/odnów
                  subskrypcję w bezpiecznym panelu Stripe Customer Portal.
                </p>
                <div className="shrink-0">
                  <PortalButton lang="pl" />
                </div>
              </div>
            </div>
          ) : planSlug === 'pro' ? (
            /* Simulated Pro */
            <div className="mt-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-[#A78BFA] animate-pulse" />
                  <p className="text-xs sm:text-sm font-bold text-[#E2E8F0] font-heading">
                    Dostęp Pro aktywny (Beta)
                  </p>
                </div>

                <p className="text-xs text-[#94A3B8] max-w-xl leading-relaxed">
                  Korzystasz z dostępu Pro w ramach otwartych testów (Public Beta). Płatności
                  realizowane są w trybie testowym Stripe (Test Mode). Wszystkie funkcje Pro
                  są aktywne.
                </p>
              </div>

              <div className="rounded-lg border border-[#A78BFA]/20 bg-[#A78BFA]/10 px-4 py-2 text-center shrink-0">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#A78BFA] block">
                  Status
                </span>
                <span className="mt-0.5 text-xs font-bold text-[#A78BFA] uppercase tracking-wide block">
                  Beta Pro
                </span>
              </div>
            </div>
          ) : (
            /* Free Tier Upgrade Prompt */
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-[#8290A2]" />
                  <p className="text-xs sm:text-sm font-bold text-[#E2E8F0] font-heading">
                    Korzystasz z bezpłatnego planu Free
                  </p>
                </div>

                <p className="text-xs text-[#94A3B8] max-w-xl leading-relaxed">
                  Twój limit to 20 analiz miesięcznie bez eksportu do PDF (dostępny w Pro)
                  oraz zbiorczego audytu promptów. Eksport do Markdown/TXT jest dostępny na każdym planie.
                  Odblokuj pełne możliwości platformy, przechodząc na plan Pro.
                </p>
              </div>

              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-lg gradient-btn px-5 py-2.5 text-xs font-bold text-white transition active:scale-95 cursor-pointer shrink-0 font-sans"
              >
                Pokaż cennik
              </Link>
            </div>
          )}
        </div>

        {/* Saved Library Shortcut Card */}
        <div className="rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold tracking-tight text-[#E2E8F0] font-heading">
              Twoja historia analiz
            </h3>
            <p className="text-xs text-[#94A3B8] max-w-xl leading-relaxed">
              Zarządzaj swoją biblioteką ulepszonych promptów, filtruj, wyszukuj, oznaczaj jako ulubione lub usuwaj stare raporty.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="rounded-full bg-[#1C1C27] border border-[#2A2A3A] px-3 py-1 text-xs font-semibold text-[#94A3B8]">
              Zapisane: {history.length}
            </span>
            <Link
              href="/history"
              className="inline-flex items-center justify-center rounded-lg border border-[#2A2A3A] bg-[#1C1C27] hover:bg-[#22223A] px-5 py-2.5 text-xs font-bold text-[#E2E8F0] transition active:scale-95 cursor-pointer shrink-0 font-sans"
            >
              Przejdź do historii
            </Link>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}