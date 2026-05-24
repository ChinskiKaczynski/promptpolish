import Link from 'next/link'
import { getAuthUser } from '@/lib/identity/auth'
import { getOwnerIdFromCookies } from '@/lib/identity/anonymous'
import { getPromptAnalysesForUser } from '@/lib/supabase/queries'
import { HistoryFilters } from '@/components/history/history-filters'
import { HistoryClientActions } from '@/components/history/history-client-actions'
import { SignOutButton } from '@/components/auth/sign-out-button'

interface HistoryPageProps {
  searchParams: Promise<{
    search?: string
    lang?: string
    profile?: string
    favorite?: string
  }>
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  // 1. Resolve secure authenticated session
  const user = await getAuthUser()
  const ownerAnonymousId = await getOwnerIdFromCookies()

  // 2. Render Guest CTA if user is not logged in
  if (!user) {
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
                href="/login"
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition active:scale-95 cursor-pointer"
              >
                Zaloguj się
              </Link>
            </div>
          </div>
        </header>

        {/* Guest Conversion CTA Box */}
        <main className="flex-grow flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-2xl rounded-3xl border border-indigo-100 bg-white p-8 sm:p-12 shadow-xl shadow-indigo-50/30 text-center space-y-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-6h.01M5.938 18h12.124c1.348 0 2.19-1.46 1.516-2.61L13.516 6.39c-.674-1.15-2.358-1.15-3.032 0L4.422 15.39c-.674 1.15.168 2.61 1.516 2.61z" />
              </svg>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-black text-slate-900 sm:text-3xl tracking-tight">
                Zapisuj i śledź historię swoich audytów!
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed max-w-lg mx-auto">
                Bezpiecznie przechowuj ulepszone wersje promptów, filtruj audyty, organizuj ulubione instrukcje i zarządzaj linkami udostępniania z dowolnego urządzenia.
              </p>
            </div>

            {/* Value Highlights */}
            <div className="grid gap-4 sm:grid-cols-2 text-left max-w-lg mx-auto">
              <div className="flex items-start gap-3">
                <span className="text-indigo-500 font-bold text-sm">★</span>
                <span className="text-xs text-slate-600 leading-relaxed font-semibold">Zapisuj nieograniczoną historię promptów</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-indigo-500 font-bold text-sm">🔍</span>
                <span className="text-xs text-slate-600 leading-relaxed font-semibold">Wyszukuj i filtruj audyty błyskawicznie</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-indigo-500 font-bold text-sm">📁</span>
                <span className="text-xs text-slate-600 leading-relaxed font-semibold">Grupuj najlepsze instrukcje w jednym miejscu</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-indigo-500 font-bold text-sm">🔗</span>
                <span className="text-xs text-slate-600 leading-relaxed font-semibold">Pełna kontrola nad publicznym dzieleniem się</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-100 hover:shadow-indigo-200 active:scale-95 transition-all"
              >
                Załóż bezpłatne konto
              </Link>
              <Link
                href="/analyze"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 px-8 py-3.5 text-sm font-semibold text-slate-700 active:scale-95 transition-all"
              >
                Uruchom szybki audyt gościa
              </Link>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-8 px-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} PromptPolish. Wszystkie prawa zastrzeżone.
        </footer>
      </div>
    )
  }

  // 3. Authenticated View - Load Filters
  const { search = '', lang = 'all', profile = 'all', favorite = 'false' } = await searchParams
  const isFavoriteFiltered = favorite === 'true'

  // 4. Query filtered database history
  const history = await getPromptAnalysesForUser(user.id, ownerAnonymousId || '', {
    search,
    lang,
    profile,
    isFavorite: isFavoriteFiltered
  })

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

      {/* History Dashboard Main Area */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-10 space-y-6">
        {/* Title area */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
            Historia Audytów & Biblioteka
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Przeszukuj swoje analizy, filtruj wyniki inżynieryjne i zarządzaj swoimi ulubionymi promptami.
          </p>
        </div>

        {/* Filter Controls Component */}
        <HistoryFilters
          currentSearch={search}
          currentLang={lang}
          currentProfile={profile}
          currentFavorite={isFavoriteFiltered}
        />

        {/* History List Grid */}
        <div className="space-y-4">
          {history.length === 0 ? (
            /* Friendly Empty State */
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-20 px-6 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="mt-4 text-base font-bold text-slate-900">Brak pasujących audytów</h4>
              <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
                Nie znaleziono żadnych wyników spełniających obecne kryteria wyszukiwania lub filtry.
              </p>
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
                    className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                          {analysis.working_language === 'pl' ? 'Polski (PL)' : 'Angielski (EN)'}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold uppercase text-indigo-700">
                          {analysis.selected_profile_slug === 'google-gemini-3-5-flash'
                            ? (analysis.working_language === 'pl' ? 'Model Google' : 'Google model')
                            : (analysis.working_language === 'pl' ? 'Uniwersalny model AI' : 'Universal AI model')}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">{date}</span>
                      </div>

                      <h3 className="mt-3 text-sm font-bold text-slate-900 truncate">
                        {analysis.title || `Audyt Promptu #${history.length - index}`}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500 leading-relaxed truncate max-w-xl">
                        {analysis.input_prompt}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                      {/* Score Indicator */}
                      <div className="text-right">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Wynik</span>
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

                      {/* Client-Side Interactive Mutations (Favorite & Soft Delete) */}
                      <HistoryClientActions
                        analysisId={analysis.id}
                        isFavoriteInitially={analysis.is_favorite}
                      />

                      {/* Open Audit Details */}
                      <Link
                        href={`/result/${analysis.id}`}
                        className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 text-white hover:bg-indigo-600 px-4 text-xs font-bold transition active:scale-95 shadow-sm"
                      >
                        Pokaż audyt
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 px-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} PromptPolish. Wszystkie prawa zastrzeżone.
      </footer>
    </div>
  )
}
