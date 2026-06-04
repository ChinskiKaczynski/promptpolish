import Link from 'next/link'
import { getAuthUser } from '@/lib/identity/auth'
import { getOwnerIdFromCookies } from '@/lib/identity/anonymous'
import { getPromptAnalysesForUser, createUsageEvent } from '@/lib/supabase/queries'
import nextDynamic from 'next/dynamic'

const HistoryFilters = nextDynamic(() => import('@/components/history/history-filters').then((mod) => mod.HistoryFilters))
const HistoryClientActions = nextDynamic(() => import('@/components/history/history-client-actions').then((mod) => mod.HistoryClientActions))
const SignOutButton = nextDynamic(() => import('@/components/auth/sign-out-button').then((mod) => mod.SignOutButton))
import { scrubSensitiveData } from '@/lib/monitoring/observability'

export const dynamic = 'force-dynamic'

interface HistoryPageProps {
  searchParams: Promise<{
    search?: string
    lang?: string
    profile?: string
    favorite?: string
    sort?: string
  }>
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  // 1. Resolve secure identities
  const user = await getAuthUser()
  const ownerAnonymousId = await getOwnerIdFromCookies()

  // 2. Resolve Filters and Sorting params
  const { search = '', lang = 'all', profile = 'all', favorite = 'false', sort = 'newest' } = await searchParams
  const isFavoriteFiltered = favorite === 'true'

  const allowedSorts = ['newest', 'oldest', 'highest_score', 'lowest_score'] as const
  type SortBy = typeof allowedSorts[number]
  const sortByParam = allowedSorts.includes(sort as SortBy) ? (sort as SortBy) : 'newest'

  // 3. Query filtered database history
  const history = await getPromptAnalysesForUser(user?.id || '', ownerAnonymousId || '', {
    search,
    lang,
    profile,
    isFavorite: isFavoriteFiltered,
    sortBy: sortByParam
  })

  // 4. Log history_viewed event (server-side)
  await createUsageEvent({
    owner_anonymous_id: ownerAnonymousId || '',
    user_id: user?.id || null,
    event_type: 'history_viewed',
    metadata_json: {}
  }).catch(err => {
    console.error('Failed to log history_viewed event:', err)
  })

  // 5. Guest Flow logic: show promotional CTA if user is guest and has ZERO analyses
  if (!user) {
    const totalGuestAnalyses = (await getPromptAnalysesForUser('', ownerAnonymousId || '')).length
    if (totalGuestAnalyses === 0) {
      return (
        <div className="flex min-h-screen flex-col pp-grid-bg text-pp-text selection:bg-pp-border-bright selection:text-white antialiased font-mono">
          {/* Navigation Header */}
          <header className="border-b-2 border-pp-border bg-pp-panel sticky top-0 z-50">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition">
                <div className="flex h-9 w-9 items-center justify-center border-2 border-pp-border-bright bg-pp-primary shadow-md">
                  <span className="font-bold text-white text-base">P</span>
                </div>
                <span className="text-sm font-black tracking-widest text-pp-text uppercase">
                  PROMPT_POLISH
                </span>
              </Link>
              <div className="flex items-center gap-4">
                <Link
                  href="/login"
                  className="pp-button pp-button-primary text-xs py-1.5 px-3"
                >
                  ZALOGUJ SIĘ
                </Link>
              </div>
            </div>
          </header>

          {/* Guest Conversion CTA Box */}
          <main className="flex-grow flex items-center justify-center px-6 py-12 z-10 relative">
            <div className="w-full max-w-2xl pp-panel p-8 sm:p-12 border-2 border-pp-border text-center space-y-8 relative">
              <div className="absolute top-0 right-4 -translate-y-1/2 bg-pp-bg px-2 text-[9px] font-bold text-pp-cyan tracking-widest uppercase">
                {"// SYSTEM_ARCHIWIZACJI"}
              </div>

              <div className="mx-auto flex h-14 w-14 items-center justify-center border-2 border-pp-border-bright bg-pp-primary text-white text-lg">
                ★
              </div>

              <div className="space-y-3">
                <h2 className="text-xl font-black text-pp-text uppercase tracking-wider">
                  Zapisuj i śledź historię swoich promptów
                </h2>
                <p className="text-pp-muted text-xs leading-relaxed max-w-lg mx-auto uppercase">
                  Bezpiecznie przechowuj ulepszone wersje promptów, filtruj audyty, organizuj ulubione instrukcje i zarządzaj linkami udostępniania z dowolnego urządzenia.
                </p>
              </div>

              {/* Value Highlights */}
              <div className="grid gap-4 sm:grid-cols-2 text-left max-w-lg mx-auto text-[11px] pp-inset p-4 bg-black/20">
                <div className="flex items-start gap-2">
                  <span className="text-pp-cyan font-bold">[★]</span>
                  <span className="text-pp-text leading-relaxed font-semibold uppercase">Nielimitowana historia promptów</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-pp-cyan font-bold">[🔍]</span>
                  <span className="text-pp-text leading-relaxed font-semibold uppercase">Szybkie wyszukiwanie i filtry</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-pp-cyan font-bold">[📁]</span>
                  <span className="text-pp-text leading-relaxed font-semibold uppercase">Organizacja w bibliotece</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-pp-cyan font-bold">[🔗]</span>
                  <span className="text-pp-text leading-relaxed font-semibold uppercase">Pełna kontrola nad share links</span>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/login"
                  className="pp-button pp-button-primary text-xs py-3 px-6"
                >
                  ZAŁÓŻ BEZPŁATNE KONTO
                </Link>
                <Link
                  href="/analyze"
                  className="pp-button text-xs py-3 px-6 border-pp-border"
                >
                  AUDYT GOŚCIA
                </Link>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t-2 border-pp-border bg-pp-panel py-8 px-6 text-center text-[10px] text-pp-muted font-mono">
            © {new Date().getFullYear()} PromptPolish. SYSTEM READY.
          </footer>
        </div>
      )
    }
  }

  return (
    <div className="flex min-h-screen flex-col pp-grid-bg text-pp-text selection:bg-pp-border-bright selection:text-white antialiased font-mono">
      {/* Navigation Header */}
      <header className="border-b-2 border-pp-border bg-pp-panel sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition">
            <div className="flex h-9 w-9 items-center justify-center border-2 border-pp-border-bright bg-pp-primary shadow-md">
              <span className="font-bold text-white text-base">P</span>
            </div>
            <span className="text-sm font-black tracking-widest text-pp-text uppercase">
              PROMPT_POLISH
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/analyze"
              className="pp-button pp-button-primary text-xs py-1.5 px-3"
            >
              NOWY AUDYT
            </Link>
            {user ? (
              <>
                <Link
                  href="/account"
                  className="text-xs font-bold text-pp-muted hover:text-pp-cyan uppercase tracking-wider"
                >
                  [ Konto ]
                </Link>
                <SignOutButton />
              </>
            ) : (
              <Link
                href="/login"
                className="text-xs font-bold text-pp-muted hover:text-pp-cyan uppercase tracking-wider"
              >
                [ Zaloguj się ]
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* History Dashboard Main Area */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-10 space-y-6 z-10 relative">
        {/* Title area */}
        <div className="border-b-2 border-pp-border pb-4">
          <h1 className="text-2xl font-black uppercase tracking-wider text-pp-text">
            Historia analiz
          </h1>
          <p className="mt-1 text-xs text-pp-muted uppercase">
            Przeszukuj swoje analizy, filtruj wyniki inżynieryjne i zarządzaj swoimi ulubionymi promptami.
          </p>
        </div>

        {/* Guest Warning Tip */}
        {!user && (
          <div className="border-2 border-pp-warning bg-pp-warning/5 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm relative">
            <div className="space-y-1">
              <h4 className="text-xs font-black text-pp-warning uppercase tracking-wider flex items-center gap-2">
                <span>💡</span> Przeglądasz historię jako gość
              </h4>
              <p className="text-[11px] text-pp-muted leading-relaxed max-w-2xl font-mono">
                Te analizy są zapisane tylko w tej przeglądarce i wygasną po 30 dniach lub po wyczyszczeniu ciasteczek. Załóż bezpłatne konto, aby zachować je na stałe.
              </p>
            </div>
            <Link
              href="/login"
              className="pp-button text-[10px] py-1.5 px-3 border-pp-warning bg-pp-warning/10 text-pp-warning hover:bg-pp-warning/20 shrink-0"
            >
              ZAREJESTRUJ SIĘ
            </Link>
          </div>
        )}

        {/* Filter Controls Component */}
        <HistoryFilters
          currentSearch={search}
          currentLang={lang}
          currentProfile={profile}
          currentFavorite={isFavoriteFiltered}
          currentSort={sort}
        />

        {/* History List Grid */}
        <div className="space-y-4">
          {history.length === 0 ? (
            /* Friendly Empty State */
            <div className="pp-panel border-2 border-dashed border-pp-border p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center border border-pp-border bg-pp-panel text-pp-muted text-lg font-bold">
                ?
              </div>
              <h4 className="mt-4 text-xs font-black uppercase text-pp-text">
                {search || lang !== 'all' || profile !== 'all' || isFavoriteFiltered
                  ? 'Nie znaleziono zapisanych analiz'
                  : 'Nie masz jeszcze zapisanych analiz'}
              </h4>
              <p className="mt-2 text-[11px] text-pp-muted max-w-sm mx-auto uppercase">
                Brak wyników spełniających kryteria. Przejdź do analizatora, aby dodać nowy prompt.
              </p>
              <div className="mt-6">
                <Link
                  href="/analyze"
                  className="pp-button pp-button-primary text-xs py-2 px-4"
                >
                  PRZEPROWADŹ AUDYT
                </Link>
              </div>
            </div>
          ) : (
            /* Audited Prompts Cards */
            <div className="grid gap-4">
              {history.map((analysis, index) => {
                const date = new Date(analysis.created_at).toLocaleDateString('pl-PL', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })

                return (
                  <article
                    key={analysis.id}
                    className="pp-panel p-5 hover:pp-panel-active border-2 border-pp-border flex flex-col gap-4 sm:flex-row sm:items-center justify-between transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="border border-pp-border bg-pp-bg px-2 py-0.5 text-[9px] font-bold text-pp-muted">
                          {analysis.working_language === 'pl' ? 'PL' : 'EN'}
                        </span>
                        <span className="border border-pp-border bg-pp-bg px-2 py-0.5 text-[9px] font-bold text-pp-cyan">
                          {analysis.selected_profile_slug === 'openrouter-deepseek-v4-flash' ? 'ADV' : 'UNI'}
                        </span>
                        {analysis.audit_mode && (
                          <span className="border border-pp-border bg-pp-bg px-2 py-0.5 text-[9px] font-bold text-pp-muted uppercase">
                            {analysis.audit_mode}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-pp-muted">{date}</span>
                      </div>

                      <h3 className="mt-2.5 text-xs font-black text-pp-text uppercase tracking-wider truncate">
                        {analysis.title || `Audyt Promptu #${history.length - index}`}
                      </h3>

                      <p className="mt-1 text-[11px] text-pp-muted leading-normal truncate max-w-xl">
                        {scrubSensitiveData(
                          analysis.input_prompt.length > 120
                            ? analysis.input_prompt.slice(0, 120) + '...'
                            : analysis.input_prompt
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                      {/* Score Indicator */}
                      <div className="text-right">
                        <span className="text-[8px] font-bold uppercase tracking-wider text-pp-muted block">Wynik</span>
                        <span
                          className={`mt-0.5 text-sm font-black tracking-wider block ${
                            analysis.overall_score >= 80
                              ? 'text-pp-success'
                              : analysis.overall_score >= 50
                              ? 'text-pp-warning'
                              : 'text-pp-danger'
                          }`}
                        >
                          {analysis.overall_score} / 100
                        </span>
                      </div>

                      {/* Client-Side Interactive Mutations (Favorite & Soft Delete & Open) */}
                      <HistoryClientActions
                        analysisId={analysis.id}
                        isFavoriteInitially={analysis.is_favorite}
                      />
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-pp-border bg-pp-panel py-8 px-6 text-center text-[10px] text-pp-muted font-mono">
        © {new Date().getFullYear()} PromptPolish. SYSTEM READY.
      </footer>
    </div>
  )
}
