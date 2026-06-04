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

  // Safe fallback: only explicit "pro" is treated as Pro.
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
    <div className="flex min-h-screen flex-col pp-grid-bg text-pp-text selection:bg-pp-border-bright selection:text-white antialiased font-mono">
      <AppHeader />

      {/* Main Dashboard Layout */}
      <main className="flex-1 mx-auto w-full max-w-4xl px-6 py-10 space-y-8 z-10 relative">
        
        {/* Profile Card */}
        <div className="pp-panel p-6 sm:p-8 border-2 border-pp-border relative">
          <div className="absolute top-0 right-4 -translate-y-1/2 bg-pp-bg px-2 text-[9px] font-bold text-pp-cyan tracking-widest uppercase">
            {"// PANEL_PROFILU"}
          </div>
          
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-pp-muted">
                Karta postaci użytkownika
              </p>
              <h2 className="text-xl font-black uppercase tracking-wider text-pp-text">
                Witaj, {profile?.display_name || profile?.email || 'Użytkowniku'}!
              </h2>
              <p className="text-xs text-pp-muted font-mono">{profile?.email}</p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {planSlug === 'free' ? (
                <div className="border border-pp-border bg-pp-panel-2 px-4 py-2.5 text-center">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-pp-muted block">
                    KLASA_POSTACI
                  </span>
                  <span className="mt-1 text-xs font-black text-pp-text uppercase tracking-wide block">
                    FREE_TIER
                  </span>
                </div>
              ) : (
                <div className="border-2 border-pp-border-bright bg-pp-primary/20 px-4 py-2.5 text-center shadow-sm">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-pp-cyan block">
                    KLASA_POSTACI
                  </span>
                  <span className="mt-1 text-xs font-black text-pp-primary-bright uppercase tracking-wide block">
                    PRO_MEMBER
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Usage Stats Card */}
        <div className="pp-panel p-6 sm:p-8 border-2 border-pp-border relative space-y-6">
          <div className="absolute top-0 right-4 -translate-y-1/2 bg-pp-bg px-2 text-[9px] font-bold text-pp-cyan tracking-widest uppercase">
            {"// POZIOM_XP_UŻYCIA"}
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-pp-text border-b border-pp-border pb-2">
              Statystyki zużycia zasobów
            </h3>
            <p className="mt-1 text-[11px] text-pp-muted uppercase">
              Miesięczny transfer promptów do audytora AI.
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
        <div className="pp-panel p-6 sm:p-8 border-2 border-pp-border relative">
          <div className="absolute top-0 right-4 -translate-y-1/2 bg-pp-bg px-2 text-[9px] font-bold text-pp-cyan tracking-widest uppercase">
            {"// FINANSE_SKARBIEC"}
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-pp-text border-b border-pp-border pb-2 mb-4">
            Metryki subskrypcji i rozliczenia
          </h3>

          {!stripeEnabled && (
            <div className="border border-pp-warning bg-pp-warning/10 p-4 text-xs text-pp-warning font-semibold leading-relaxed mb-4">
              <strong>Beta Info:</strong> Bramka płatności Stripe jest obecnie wyłączona (STRIPE_ENABLED=false). Cennik i funkcje konta Pro są symulowane.
            </div>
          )}

          {subscription ? (
            /* Stripe Subscription Details */
            <div className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="pp-inset p-4 bg-black/20 text-xs">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-pp-muted block">
                    STATUS
                  </span>

                  <div className="mt-2 flex items-center gap-2">
                    {subscription.status === 'active' || subscription.status === 'trialing' ? (
                      subscription.cancel_at_period_end ? (
                        <>
                          <span className="h-2 w-2 bg-pp-warning animate-pulse" />
                          <span className="font-bold text-pp-warning uppercase">
                            AKTYWNA ANULOWANA
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="h-2 w-2 bg-pp-success animate-pulse" />
                          <span className="font-bold text-pp-success uppercase">
                            AKTYWNA
                          </span>
                        </>
                      )
                    ) : subscription.status === 'past_due' ? (
                      <>
                        <span className="h-2 w-2 bg-pp-warning animate-pulse" />
                        <span className="font-bold text-pp-warning uppercase">
                          ZALEGŁOŚĆ
                        </span>
                      </>
                    ) : subscription.status === 'unpaid' ? (
                      <>
                        <span className="h-2 w-2 bg-pp-danger animate-pulse" />
                        <span className="font-bold text-pp-danger uppercase">
                          NIEOPŁACONA
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="h-2 w-2 bg-pp-muted" />
                        <span className="font-bold text-pp-muted uppercase">
                          WYGASŁA ({subscription.status})
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="pp-inset p-4 bg-black/20 text-xs">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-pp-muted block">
                    CYKL ROZLICZENIOWY
                  </span>
                  <span className="mt-2 font-bold text-pp-text block uppercase text-[11px]">
                    {new Date(subscription.current_period_start).toLocaleDateString('pl-PL')} –{' '}
                    {new Date(subscription.current_period_end).toLocaleDateString('pl-PL')}
                  </span>
                </div>

                <div className="pp-inset p-4 bg-black/20 text-xs">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-pp-muted block">
                    {subscription.cancel_at_period_end
                      ? 'WYGAŚNIĘCIE'
                      : 'NASTĘPNA PŁATNOŚĆ'}
                  </span>
                  <span className="mt-2 font-bold text-pp-text block uppercase text-[11px]">
                    {new Date(subscription.current_period_end).toLocaleDateString('pl-PL')}
                  </span>
                </div>
              </div>

              {subscription.cancel_at_period_end && (
                <div className="border border-pp-warning bg-pp-warning/10 p-4 text-[11px] text-pp-warning leading-relaxed">
                  <strong>Ostrzeżenie:</strong> Twoja subskrypcja została anulowana i wygaśnie dnia{' '}
                  <strong>
                    {new Date(subscription.current_period_end).toLocaleDateString('pl-PL')}
                  </strong>
                  . Zachowujesz dostęp do funkcji Pro do końca cyklu.
                </div>
              )}

              {subscription.status === 'past_due' && (
                <div className="border border-pp-warning bg-pp-warning/10 p-4 text-[11px] text-pp-warning leading-relaxed">
                  <strong>Zaległość:</strong> Nie udało się pobrać opłaty. Zaktualizuj dane płatnicze w portalu Stripe.
                </div>
              )}

              {subscription.status === 'unpaid' && (
                <div className="border border-pp-danger bg-pp-danger/10 p-4 text-[11px] text-pp-danger leading-relaxed">
                  <strong>Zawieszenie:</strong> Konto Pro zostało zawieszone z powodu braku płatności. Zaktualizuj dane płatnicze poniżej.
                </div>
              )}

              <div className="pt-4 border-t border-pp-border/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p className="text-[11px] text-pp-muted uppercase">
                  Zarządzaj kartami, pobieraj faktury lub anuluj subskrypcję w panelu Stripe Customer Portal.
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
                  <span className="inline-flex h-2 w-2 bg-pp-cyan animate-pulse" />
                  <p className="text-xs font-bold text-pp-text uppercase">
                    Dostęp Pro aktywny (Beta testy)
                  </p>
                </div>

                <p className="text-[11px] text-pp-muted leading-relaxed uppercase">
                  Korzystasz z dostępu Pro w ramach zamkniętych testów beta. Bramka Stripe płatności jest symulowana.
                </p>
              </div>

              <div className="border border-pp-border-bright bg-pp-primary/20 px-4 py-2 text-center shrink-0">
                <span className="text-[9px] font-bold uppercase tracking-widest text-pp-cyan block">
                  STATUS
                </span>
                <span className="mt-0.5 text-xs font-black text-pp-primary-bright uppercase tracking-wide block">
                  BETA_PRO
                </span>
              </div>
            </div>
          ) : (
            /* Free Tier Upgrade Prompt */
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 bg-pp-muted" />
                  <p className="text-xs font-bold text-pp-text uppercase">
                    Korzystasz z bezpłatnego planu Free
                  </p>
                </div>

                <p className="text-[11px] text-pp-muted leading-relaxed uppercase">
                  Twój limit to 20 analiz miesięcznie bez eksportu PDF i audytu zbiorczego. Odblokuj Pro aby uzyskać 500 analiz miesięcznie.
                </p>
              </div>

              <Link
                href="/pricing"
                className="pp-button pp-button-primary text-xs py-2 px-4 shrink-0"
              >
                POKAŻ CENNIK // PRO
              </Link>
            </div>
          )}
        </div>

        {/* Saved Library Shortcut Card */}
        <div className="pp-panel p-6 sm:p-8 border-2 border-pp-border relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="absolute top-0 right-4 -translate-y-1/2 bg-pp-bg px-2 text-[9px] font-bold text-pp-cyan tracking-widest uppercase">
            {"// EKWIPUNEK_ARCHIWUM"}
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-pp-text">
              Twoja historia analiz
            </h3>
            <p className="text-[11px] text-pp-muted leading-relaxed uppercase">
              Zarządzaj biblioteką ulepszonych promptów, filtruj, oznaczaj jako ulubione lub usuwaj stare raporty.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
            <span className="border border-pp-border bg-pp-bg px-3 py-1 text-xs font-bold text-pp-text">
              ZAPISANE: {history.length}
            </span>
            <Link
              href="/history"
              className="pp-button text-xs py-2 px-4 border-pp-border-bright"
            >
              WEJDŹ DO ARCHIWUM &gt;&gt;
            </Link>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}