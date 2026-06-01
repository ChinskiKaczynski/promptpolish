import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAuthUser } from '@/lib/identity/auth'
import { getOwnerIdFromCookies } from '@/lib/identity/anonymous'
import {
  getUserProfile,
  ensureUserProfile,
  getPromptAnalysesForUser,
} from '@/lib/supabase/queries'
import { getSubscriptionByUserId } from '@/lib/supabase/billing'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { PortalButton } from '@/components/billing/portal-button'

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

  // 3. Resolve history combining user_id and current anonymous owner ID.
  const ownerAnonymousId = await getOwnerIdFromCookies()
  const history = await getPromptAnalysesForUser(user.id, ownerAnonymousId || '')

  // 4. Fetch subscription only when Stripe is active.
  // This avoids PGRST205 when billing tables are absent.
  const stripeEnabled = process.env.STRIPE_ENABLED === 'true'
  const subscription = stripeEnabled ? await getSubscriptionByUserId(user.id) : null

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50 selection:bg-indigo-100 antialiased font-sans">
      {/* Navigation Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 shadow-md shadow-indigo-200">
              <span className="font-bold text-white text-base">P</span>
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-800 bg-clip-text text-transparent">
              PromptPolish
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/analyze"
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition active:scale-95 cursor-pointer"
            >
              Ulepsz prompt
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-10">
        {/* Profile Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-md shadow-slate-100/50">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Panel użytkownika
              </p>

              <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-slate-900">
                Witaj, {profile?.display_name || profile?.email || 'Użytkowniku'}!
              </h2>

              <p className="mt-1 text-sm text-slate-500">{profile?.email}</p>
            </div>

            <div className="flex items-center gap-3">
              {planSlug === 'free' ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                    Twój plan
                  </span>
                  <span className="mt-1 text-sm font-black text-slate-700 uppercase tracking-wide block">
                    Free
                  </span>
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-indigo-500/30 bg-indigo-50 px-4 py-2.5 text-center shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 block">
                    Twój plan
                  </span>
                  <span className="mt-1 text-sm font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent uppercase tracking-wide block">
                    Pro
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Billing Status UI Section */}
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-md shadow-slate-100/50">
          <h3 className="text-base font-bold tracking-tight text-slate-900 border-b border-slate-100 pb-4">
            Subskrypcja i rozliczenia
          </h3>

          {subscription ? (
            /* Stripe Subscription Details — shown only when STRIPE_ENABLED=true and row exists */
            <div className="mt-6 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Status subskrypcji
                  </span>

                  <div className="mt-2.5 flex items-center gap-2">
                    {subscription.status === 'active' || subscription.status === 'trialing' ? (
                      subscription.cancel_at_period_end ? (
                        <>
                          <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                          <span className="text-sm font-bold text-amber-600">
                            Aktywna anulowana
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-sm font-bold text-emerald-600">
                            Aktywna
                          </span>
                        </>
                      )
                    ) : subscription.status === 'past_due' ? (
                      <>
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-sm font-bold text-amber-600">
                          Zaległa płatność
                        </span>
                      </>
                    ) : subscription.status === 'unpaid' ? (
                      <>
                        <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
                        <span className="text-sm font-bold text-rose-600">
                          Nieopłacona
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                        <span className="text-sm font-bold text-slate-500">
                          Wygasła ({subscription.status})
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Okres rozliczeniowy
                  </span>
                  <span className="mt-2 text-sm font-bold text-slate-800 block">
                    {new Date(subscription.current_period_start).toLocaleDateString('pl-PL')} –{' '}
                    {new Date(subscription.current_period_end).toLocaleDateString('pl-PL')}
                  </span>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    {subscription.cancel_at_period_end
                      ? 'Wygaśnięcie subskrypcji'
                      : 'Następna płatność'}
                  </span>
                  <span className="mt-2 text-sm font-bold text-slate-800 block">
                    {new Date(subscription.current_period_end).toLocaleDateString('pl-PL')}
                  </span>
                </div>
              </div>

              {subscription.cancel_at_period_end && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-xs text-amber-800 leading-relaxed">
                  <strong>Uwaga:</strong> Twoja subskrypcja została anulowana i wygaśnie dnia{' '}
                  <strong>
                    {new Date(subscription.current_period_end).toLocaleDateString('pl-PL')}
                  </strong>
                  . Do tego czasu masz pełny dostęp do wszystkich funkcji Pro. Żadne kolejne
                  opłaty nie zostaną pobrane.
                </div>
              )}

              {subscription.status === 'past_due' && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-xs text-amber-800 leading-relaxed">
                  <strong>Zaległość w płatności:</strong> Nie udało się pobrać opłaty za kolejny
                  okres rozliczeniowy. Karta zostanie obciążona ponownie przez Stripe. Utrzymujemy
                  Twój dostęp do funkcji Pro przez okres przejściowy. Zaktualizuj dane płatnicze,
                  aby uniknąć przerw w dostępie.
                </div>
              )}

              {subscription.status === 'unpaid' && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 text-xs text-rose-800 leading-relaxed">
                  <strong>Dostęp zawieszony:</strong> Twoje konto Pro zostało zawieszone z powodu
                  braku pomyślnej płatności. Zaktualizuj dane płatnicze w portalu Stripe poniżej,
                  aby odzyskać dostęp do Pro.
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p className="text-xs text-slate-500">
                  Zarządzaj kartami płatniczymi, sprawdzaj faktury VAT lub anuluj/odnów
                  subskrypcję w bezpiecznym panelu Stripe Customer Portal.
                </p>
                <div className="shrink-0">
                  <PortalButton lang="pl" />
                </div>
              </div>
            </div>
          ) : planSlug === 'pro' ? (
            /* Simulated Pro — plan is pro but Stripe is not active */
            <div className="mt-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                  <p className="text-sm font-bold text-slate-800">
                    Dostęp Pro aktywny
                  </p>
                </div>

                <p className="text-xs text-slate-500 max-w-xl">
                  Korzystasz z dostępu Pro w ramach zamkniętych testów beta. Płatności Stripe
                  zostaną aktywowane wkrótce — do tego czasu wszystkie funkcje Pro są dostępne
                  bez opłat.
                </p>
              </div>

              <div className="rounded-2xl border-2 border-indigo-500/30 bg-indigo-50 px-4 py-2.5 text-center shadow-sm shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 block">
                  Status
                </span>
                <span className="mt-1 text-xs font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent uppercase tracking-wide block">
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
                  <p className="text-sm font-bold text-slate-800">
                    Korzystasz z bezpłatnego planu Free
                  </p>
                </div>

                <p className="text-xs text-slate-500 max-w-xl">
                  Twój limit to 20 analiz miesięcznie bez możliwości eksportu do PDF/Markdown
                  oraz zbiorczego audytu promptów. Odblokuj pełne możliwości platformy,
                  przechodząc na plan Pro.
                </p>
              </div>

              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-95 cursor-pointer shrink-0"
              >
                Ulepsz do Pro
              </Link>
            </div>
          )}
        </div>

        {/* History Section */}
        <div className="mt-10">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-slate-900">
                Twoja historia audytów
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Wszystkie analizy promptów skojarzone z Twoim kontem i obecną sesją.
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              Suma: {history.length}
            </span>
          </div>

          {history.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white py-16 px-6 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 13h6m-3-3v6m-9 1V4a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                  />
                </svg>
              </div>

              <h4 className="mt-4 text-base font-bold text-slate-900">
                Brak historii audytów
              </h4>

              <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
                Nie przeanalizowałeś jeszcze żadnego promptu w tej sesji lub po zalogowaniu.
                Rozpocznij pierwszy profesjonalny audyt.
              </p>

              <Link
                href="/analyze"
                className="mt-6 inline-flex items-center justify-center rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-6 py-3 text-sm font-semibold text-white shadow-md active:scale-95 transition-all"
              >
                Przetestuj pierwszy prompt
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {history.map((analysis) => {
                const date = new Date(analysis.created_at).toLocaleDateString('pl-PL', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })

                return (
                  <div
                    key={analysis.id}
                    className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-md transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                          {analysis.working_language === 'pl' ? 'Polski (PL)' : 'Angielski (EN)'}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          {date}
                        </span>
                      </div>

                      <p className="mt-2 text-sm font-bold text-slate-900 truncate max-w-lg">
                        {analysis.input_prompt}
                      </p>

                      <p className="mt-1 text-xs text-slate-400 truncate max-w-lg">
                        Profil:{' '}
                        {analysis.selected_profile_slug === 'openrouter-deepseek-v4-flash'
                          ? analysis.working_language === 'pl'
                            ? 'Zaawansowany model AI'
                            : 'Advanced AI model'
                          : analysis.working_language === 'pl'
                            ? 'Uniwersalny model AI'
                            : 'Universal AI model'}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Wynik
                        </span>
                        <span
                          className={`mt-0.5 text-base font-black tracking-tight block ${
                            analysis.overall_score >= 80
                              ? 'text-emerald-600'
                              : analysis.overall_score >= 50
                                ? 'text-yellow-600'
                                : 'text-red-500'
                          }`}
                        >
                          {analysis.overall_score} / 100
                        </span>
                      </div>

                      <Link
                        href={`/result/${analysis.id}`}
                        className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-100 hover:text-indigo-600 px-4 text-xs font-bold text-slate-700 active:scale-95 transition-all"
                      >
                        Pokaż audyt
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8 px-6 text-center text-xs text-slate-400 mt-auto">
        © {new Date().getFullYear()} PromptPolish. Wszystkie prawa zastrzeżone.
      </footer>
    </div>
  )
}