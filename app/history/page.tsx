import type { Metadata } from 'next'
import Link from 'next/link'
import { getAuthUser } from '@/lib/identity/auth'
import { getOwnerIdFromCookies } from '@/lib/identity/anonymous'
import { getPromptAnalysesForUser, createUsageEvent } from '@/lib/supabase/queries'
import nextDynamic from 'next/dynamic'
import { scrubSensitiveData } from '@/lib/monitoring/observability'
import { AppHeader } from '@/components/layout/app-header'
import { AppFooter } from '@/components/layout/app-footer'

const HistoryFilters = nextDynamic(() => import('@/components/history/history-filters').then((mod) => mod.HistoryFilters))
const HistoryClientActions = nextDynamic(() => import('@/components/history/history-client-actions').then((mod) => mod.HistoryClientActions))

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Historia Analiz — PromptPolish',
  robots: {
    index: false,
    follow: false,
  },
}

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
  const history = await getPromptAnalysesForUser(user?.id || null, ownerAnonymousId || null, {
    search,
    lang,
    profile,
    isFavorite: isFavoriteFiltered,
    sortBy: sortByParam
  })

  // 4. Log history_viewed event (server-side)
  if (ownerAnonymousId) {
    await createUsageEvent({
      owner_anonymous_id: ownerAnonymousId,
      user_id: user?.id || null,
      event_type: 'history_viewed',
      metadata_json: {}
    }).catch(err => {
      console.error('Failed to log history_viewed event:', err)
    })
  }

  // 5. Guest Flow logic: show promotional CTA if user is guest and has ZERO analyses
  if (!user) {
    const totalGuestAnalyses = ownerAnonymousId
      ? (await getPromptAnalysesForUser(null, ownerAnonymousId)).length
      : 0
    if (totalGuestAnalyses === 0) {
      return (
        <div className="flex min-h-screen flex-col bg-[#0C0C10] text-[#E2E8F0] selection:bg-[#A78BFA]/20 antialiased font-sans">
          <AppHeader />

          {/* Guest Conversion CTA Box */}
          <main className="flex-grow flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-2xl rounded-xl border border-[#2A2A3A] bg-[#13131A] p-8 sm:p-12 glow-violet text-center space-y-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-[#A78BFA]/10 text-[#A78BFA] border border-[#A78BFA]/20">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-6h.01M5.938 18h12.124c1.348 0 2.19-1.46 1.516-2.61L13.516 6.39c-.674-1.15-2.358-1.15-3.032 0L4.422 15.39c-.674 1.15.168 2.61 1.516 2.61z" />
                </svg>
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-[#E2E8F0] sm:text-3xl tracking-tight font-heading">
                  Zapisuj i śledź historię swoich audytów!
                </h2>
                <p className="text-[#94A3B8] text-sm leading-relaxed max-w-lg mx-auto">
                  Bezpiecznie przechowuj ulepszone wersje promptów, filtruj audyty, organizuj ulubione instrukcje i zarządzaj linkami udostępniania z dowolnego urządzenia.
                </p>
              </div>

              {/* Value Highlights */}
              <div className="grid gap-4 sm:grid-cols-2 text-left max-w-lg mx-auto border-t border-[#1E1E2E] pt-6">
                <div className="flex items-start gap-3">
                  <span className="text-[#A78BFA] font-bold text-sm">★</span>
                  <span className="text-xs text-[#94A3B8] font-semibold">Zapisuj nieograniczoną historię promptów</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#A78BFA] font-bold text-sm">🔍</span>
                  <span className="text-xs text-[#94A3B8] font-semibold">Wyszukuj & filtruj audyty błyskawicznie</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#A78BFA] font-bold text-sm">📁</span>
                  <span className="text-xs text-[#94A3B8] font-semibold">Grupuj najlepsze instrukcje w jednym miejscu</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#A78BFA] font-bold text-sm">🔗</span>
                  <span className="text-xs text-[#94A3B8] font-semibold">Pełna kontrola nad publicznym dzieleniem się</span>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-lg gradient-btn px-8 py-3.5 text-sm font-bold text-white active:scale-95 transition-all font-sans cursor-pointer"
                >
                  Załóż bezpłatne konto
                </Link>
                <Link
                  href="/analyze"
                  className="inline-flex items-center justify-center rounded-lg border border-[#2A2A3A] bg-[#1C1C27] hover:bg-[#22223A] px-8 py-3.5 text-sm font-semibold text-[#94A3B8] active:scale-95 transition-all cursor-pointer"
                >
                  Uruchom szybki audyt gościa
                </Link>
              </div>
            </div>
          </main>

          <AppFooter />
        </div>
      )
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0C0C10] text-[#E2E8F0] selection:bg-[#A78BFA]/20 antialiased font-sans">
      <AppHeader />

      {/* History Dashboard Main Area */}
      <main className="flex-grow mx-auto w-full max-w-5xl px-6 py-10 space-y-8">
        
        {/* Title area */}
        <div className="flex flex-col gap-2 border-b border-[#1E1E2E] pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-[#E2E8F0] font-heading">
            Historia analiz
          </h1>
          <p className="text-xs sm:text-sm text-[#8290A2] font-medium">
            Przeszukuj swoje analizy, filtruj wyniki inżynieryjne i zarządzaj swoimi ulubionymi promptami.
          </p>
        </div>

        {/* Guest Warning Tip */}
        {!user && (
          <div className="rounded-xl border border-[#F59E0B]/25 bg-[#F59E0B]/6 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[#E2E8F0] font-heading flex items-center gap-2">
                <span>💡</span> Przeglądasz historię jako gość
              </h4>
              <p className="text-xs text-[#F59E0B] leading-relaxed max-w-2xl font-semibold">
                Te analizy są zapisane tylko w tej przeglądarce i wygasną po 30 dniach lub po wyczyszczeniu ciasteczek. Załóż bezpłatne konto, aby zachować je na stałe.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center rounded-lg gradient-btn px-5 text-xs font-bold text-white transition active:scale-95 shrink-0 cursor-pointer text-center font-sans"
            >
              Zarejestruj się
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
            <div className="rounded-xl border border-dashed border-[#3A3A52] bg-[#13131A] py-20 px-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#A78BFA]/10 text-[#A78BFA] border border-[#A78BFA]/20">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="mt-4 text-base font-bold text-[#E2E8F0] font-heading">Nie masz jeszcze zapisanych analiz</h4>
              <p className="mt-2 text-sm text-[#8290A2] max-w-sm mx-auto">
                Nie znaleziono żadnych zapytań spełniających obecne filtry. Przejdź do analizatora, aby dodać nowy prompt.
              </p>
              <div className="mt-6">
                <Link
                  href="/analyze"
                  className="inline-flex items-center justify-center rounded-lg gradient-btn px-5 py-2.5 text-sm font-bold text-white transition active:scale-95 font-sans"
                >
                  Przeanalizuj prompt
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
                    className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between rounded-xl border border-[#2A2A3A] bg-[#13131A] p-5 sm:p-6 hover:border-[#3A3A52] transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="inline-flex items-center rounded-full bg-[#1C1C27] border border-[#2A2A3A] px-2.5 py-0.5 text-xs font-bold uppercase text-[#94A3B8]">
                          {analysis.working_language === 'pl' ? 'Polski (PL)' : 'Angielski (EN)'}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-[#A78BFA]/10 border border-[#A78BFA]/20 px-2.5 py-0.5 text-xs font-bold uppercase text-[#A78BFA]">
                          {analysis.selected_profile_slug === 'openrouter-deepseek-v4-flash'
                            ? (analysis.working_language === 'pl' ? 'Zaawansowany model AI' : 'Advanced AI model')
                            : (analysis.working_language === 'pl' ? 'Uniwersalny model AI' : 'Universal AI model')}
                        </span>
                        {analysis.audit_mode && (
                          <span className="inline-flex items-center rounded-full bg-[#1C1C27] border border-[#2A2A3A] px-2.5 py-0.5 text-xs font-bold uppercase text-[#94A3B8]">
                            {analysis.audit_mode}
                          </span>
                        )}
                        <span className="text-xs font-semibold text-[#8290A2]">{date}</span>
                      </div>

                      <h3 className="mt-3 text-sm font-bold text-[#E2E8F0] font-heading truncate">
                        {analysis.title || `Audyt Promptu #${history.length - index}`}
                      </h3>

                      <p className="mt-1 text-xs text-[#8290A2] leading-relaxed truncate max-w-xl">
                        {scrubSensitiveData(
                          analysis.input_prompt.length > 120
                            ? analysis.input_prompt.slice(0, 120) + '...'
                            : analysis.input_prompt
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end border-t sm:border-t-0 border-[#1E1E2E] pt-3 sm:pt-0">
                      {/* Score Indicator */}
                      <div className="text-left sm:text-right pr-4">
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#8290A2] block">Wynik</span>
                        <span
                          className={`mt-0.5 text-base font-black tracking-tight block ${
                            analysis.overall_score >= 80
                              ? 'text-[#6EE7B7]'
                              : analysis.overall_score >= 50
                              ? 'text-[#F59E0B]'
                              : 'text-[#F87171]'
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

      <AppFooter />
    </div>
  )
}
