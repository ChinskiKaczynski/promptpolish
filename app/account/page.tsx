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
  const history = await getPromptAnalysesForUser(user.id, ownerAnonymousId || '')

  // 4. Log account_viewed event (server-side)
  await createUsageEvent({
    owner_anonymous_id: ownerAnonymousId || '',
    user_id: user.id,
    event_type: 'account_viewed',
    metadata_json: {}
  }).catch(err => {
    console.error('Failed to log account_viewed event:', err)
  })

  // 5. Fetch subscription only when Stripe is active.
  const stripeEnabled = process.env.STRIPE_ENABLED === 'true'
  const subscription = stripeEnabled ? await getSubscriptionByUserId(user.id) : null

  // 6. Calculate monthly usage metrics
  const monthlyCount = await getUsageCountThisMonthForUser(ownerAnonymousId || '', user.id)
  const limits = PLAN_LIMITS[planSlug]
  const monthlyLimit = limits.monthlyAnalyses

  return (
    <div className="flex min-h-screen flex-col bg-[#0C0C10] text-[#E2E8F0] selection:bg-[#A78BFA]/20 antialiased font-sans">
      <AppHeader />

      {/* Main Dashboard Layout */}
      <main className="flex-grow mx-auto w-full max-w-4xl px-6 py-10 space-y-8">
        
        {/* Profile Card */}
        <div className="rounded-3xl border border-slate-200/60 bg-white p-6 sm:p-8 shadow-md">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Panel użytkownika
              </p>

              <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-slate-900">
                Witaj, {profile?.display_name || profile?.email || 'Użytkowniku'}!
              </h2>

              <p className="mt-1 text-xs text-slate-500">{profile?.email}</p>
            </div>

            <div className="flex items-center gap-3">
              {planSlug === 'free' ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-center">
                  <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 block">
                    Twój plan
                  </span>
                  <span className="mt-0.5 text-xs font-black text-slate-600 uppercase tracking-wide block">
                    Free
                  </span>
                </div>
              ) : (
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-2 text-center shadow-sm">
                  <span className="text-[8px] font-bold uppercase tracking-widest text-indigo-500 block">
                    Twój plan
                  </span>
                  <span className="mt-0.5 text-xs font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent uppercase tracking-wide block">
                    Pro
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Usage Stats Card */}
        <div className="rounded-3xl border border-slate-200/60 bg-white p-6 sm:p-8 shadow-md space-y-6">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-slate-900">
              Statystyki użycia i limity
            </h3>
            <p className="mt-1 text-xs text-[#4A5568] font-medium">
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
        <div className="rounded-3xl border border-slate-200/60 bg-white p-6 sm:p-8 shadow-md">
          <h3 className="text-base font-bold tracking-tight text-slate-900 border-b border-slate-100 pb-4">
            Subskrypcja i rozliczenia
          </h3>

          {!stripeEnabled && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/40 p-4 text-xs text-amber-800 leading-relaxed font-semibold">
              <strong>Beta Info:</strong> Bramka płatności Stripe jest obecnie wyłączona (STRIPE_ENABLED=false). Cennik i funkcje konta Pro są symulowane.
            </div>
          )}

          {subscription ? (
            /* Stripe Subscription Details */
            <div className="mt-6 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                    Status subskrypcji
                  </span>

                  <div className="mt-2 flex items-center gap-2">
                    {subscription.status === 'active' || subscription.status === 'trialing' ? (
                      subscription.cancel_at_period_end ? (
                        <>
                          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                          <span className="text-xs font-bold text-amber-600">
                            Aktywna anulowana
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-xs font-bold text-emerald-600">
                            Aktywna
                          </span>
                        </>
                      )
                    ) : subscription.status === 'past_due' ? (
                      <>
                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-xs font-bold text-amber-600">
                          Zaległa płatność
                        </span>
                      </>
                    ) : subscription.status === 'unpaid' ? (
                      <>
                        <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                        <span className="text-xs font-bold text-rose-600">
                          Nieopłacona
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="h-2 w-2 rounded-full bg-slate-400" />
                        <span className="text-xs font-bold text-slate-500">
                          Wygasła ({subscription.status})
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                    Okres rozliczeniowy
                  </span>
                  <span className="mt-2 text-xs font-bold text-slate-700 block">
                    {new Date(subscription.current_period_start).toLocaleDateString('pl-PL')} –{' '}
                    {new Date(subscription.current_period_end).toLocaleDateString('pl-PL')}
                  </span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                    {subscription.cancel_at_period_end
                      ? 'Wygaśnięcie subskrypcji'
                      : 'Następna płatność'}
                  </span>
                  <span className="mt-2 text-xs font-bold text-slate-700 block">
                    {new Date(subscription.current_period_end).toLocaleDateString('pl-PL')}
                  </span>
                </div>
              </div>

              {subscription.cancel_at_period_end && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 text-xs text-amber-800 leading-relaxed font-semibold">
                  <strong>Uwaga:</strong> Twoja subskrypcja została anulowana i wygaśnie dnia{' '}
                  <strong>
                    {new Date(subscription.current_period_end).toLocaleDateString('pl-PL')}
                  </strong>
                  . Do tego czasu masz pełny dostęp do wszystkich funkcji Pro. Żadne kolejne
                  opłaty nie zostaną pobrane.
                </div>
              )}

              {subscription.status === 'past_due' && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 text-xs text-amber-800 leading-relaxed font-semibold">
                  <strong>Zaległość w płatności:</strong> Nie udało się pobrać opłaty za kolejny
                  okres rozliczeniowy. Karta zostanie obciążona ponownie przez Stripe. Utrzymujemy
                  Twój dostęp do funkcji Pro przez okres przejściowy. Zaktualizuj dane płatnicze,
                  aby uniknąć przerw w dostępie.
                </div>
              )}

              {subscription.status === 'unpaid' && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4 text-xs text-rose-800 leading-relaxed font-semibold">
                  <strong>Dostęp zawieszony:</strong> Twoje konto Pro zostało zawieszone z powodu
                  braku pomyślnej płatności. Zaktualizuj dane płatnicze w portalu Stripe poniżej,
                  aby odzyskać dostęp do Pro.
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p className="text-xs text-slate-500 font-semibold">
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
                  <span className="inline-flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                  <p className="text-xs sm:text-sm font-bold text-slate-800">
                    Dostęp Pro aktywny (Beta)
                  </p>
                </div>

                <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                  Korzystasz z dostępu Pro w ramach zamkniętych testów beta. Płatności Stripe
                  zostaną aktywowane wkrótce — do tego czasu wszystkie funkcje Pro są dostępne
                  bez opłat.
                </p>
              </div>

              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-2 text-center shadow-sm shrink-0">
                <span className="text-[8px] font-bold uppercase tracking-widest text-indigo-500 block">
                  Status
                </span>
                <span className="mt-0.5 text-xs font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent uppercase tracking-wide block">
                  Beta Pro
                </span>
              </div>
            </div>
          ) : (
            /* Free Tier Upgrade Prompt */
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-slate-300" />
                  <p className="text-xs sm:text-sm font-bold text-slate-800">
                    Korzystasz z bezpłatnego planu Free
                  </p>
                </div>

                <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                  Twój limit to 20 analiz miesięcznie bez możliwości eksportu do PDF/Markdown
                  oraz zbiorczego audytu promptów. Odblokuj pełne możliwości platformy,
                  przechodząc na plan Pro.
                </p>
              </div>

              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-95 cursor-pointer shrink-0 font-sans"
              >
                Pokaż cennik
              </Link>
            </div>
          )}
        </div>

        {/* Saved Library Shortcut Card */}
        <div className="rounded-3xl border border-slate-200/60 bg-white p-6 sm:p-8 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold tracking-tight text-slate-900">
              Twoja historia analiz
            </h3>
            <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
              Zarządzaj swoją biblioteką ulepszonych promptów, filtruj, wyszukuj, oznaczaj jako ulubione lub usuwaj stare raporty.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="rounded-full bg-slate-100 border border-slate-200/50 px-3 py-1 text-xs font-bold text-slate-600">
              Zapisane: {history.length}
            </span>
            <Link
              href="/history"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 hover:bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-95 cursor-pointer shrink-0 font-sans"
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