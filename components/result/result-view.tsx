import 'server-only'
import type { AnalysisResult } from '@/lib/ai/schemas'
import nextDynamic from 'next/dynamic'

const CopyButton = nextDynamic(() => import('./copy-button').then((mod) => mod.CopyButton))
const FeedbackSection = nextDynamic(() => import('./feedback-section').then((mod) => mod.FeedbackSection))
const ShareSettings = nextDynamic(() => import('./share-settings').then((mod) => mod.ShareSettings))
const ExportActions = nextDynamic(() => import('./export-actions').then((mod) => mod.ExportActions))

type ResultViewProps = {
  result: AnalysisResult & { 
    overallScore: number; 
    scoreLevel: string;
    id?: string;
    isShareEnabled?: boolean;
    shareToken?: string | null;
  }
  mode: 'private' | 'share' | 'public'
  planSlug?: 'free' | 'pro'
}

// English to Polish translations for score levels
const scoreLevelTranslations: Record<string, { label: string; desc: string; bg: string; text: string; border: string; bar: string }> = {
  excellent: {
    label: 'Doskonały',
    desc: 'Prompt spełnia najwyższe standardy inżynierii promptów.',
    bg: 'bg-emerald-50/50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    bar: 'from-emerald-500 to-teal-400'
  },
  strong: {
    label: 'Bardzo dobry',
    desc: 'Prompt jest solidny, wymaga jedynie kosmetycznych usprawnień.',
    bg: 'bg-indigo-50/50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    bar: 'from-indigo-500 to-violet-500'
  },
  decent: {
    label: 'Dostateczny',
    desc: 'Prompt działa poprawnie, lecz posiada istotne braki strukturalne.',
    bg: 'bg-amber-50/50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    bar: 'from-amber-500 to-yellow-400'
  },
  needs_work: {
    label: 'Wymaga poprawek',
    desc: 'Prompt ma niską precyzję i może dawać niespójne odpowiedzi.',
    bg: 'bg-orange-50/50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    bar: 'from-orange-500 to-amber-500'
  },
  weak: {
    label: 'Słaby',
    desc: 'Prompt jest chaotyczny, pozbawiony celu i kluczowych kontekstów.',
    bg: 'bg-rose-50/50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    bar: 'from-rose-500 to-red-500'
  }
}

// Translations for Criterion Names
export const criterionTranslations: Record<string, string> = {
  goal_clarity: 'Jasność celu',
  context_completeness: 'Kompletność kontekstu',
  structure: 'Struktura promptu',
  constraints: 'Definicje ograniczeń',
  output_format: 'Format wyniku',
  model_profile_fit: 'Dopasowanie do profilu audytu',
  resistance_to_misinterpretation: 'Odporność na błędy interpretacji',
  cost_efficiency: 'Efektywność kosztowa',
  safety: 'Filtry bezpieczeństwa',
  testability: 'Testowalność i ocena'
}

export function ResultView({ result, mode, planSlug = 'free' }: ResultViewProps) {
  const scoreMeta = scoreLevelTranslations[result.scoreLevel] || scoreLevelTranslations.decent
  const promptLines = result.improved_prompt.split('\n')

  // Score SVG math
  const radius = 42
  const strokeWidth = 8
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (result.overallScore / 100) * circumference

  const isPublicMode = mode === 'share' || mode === 'public'

  return (
    <div className="space-y-8 pb-16">
      {/* Top Breadcrumb/Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {isPublicMode ? 'Publiczny raport' : 'Prywatny audyt'}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Raport audytu promptu</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          {!isPublicMode ? (
            <ExportActions
              analysisId={result.id}
              planSlug={planSlug}
              improvedPrompt={result.improved_prompt}
            />
          ) : (
            <CopyButton text={result.improved_prompt} analysisId={result.id} variant="primary" />
          )}
        </div>
      </div>

      {/* Main Score & Warning Cards Layout */}
      <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
        {/* Score Display Card */}
        <div className={`relative flex flex-col justify-between overflow-hidden rounded-3xl border p-6 sm:p-8 shadow-sm transition-all ${scoreMeta.bg} ${scoreMeta.border}`}>
          <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-white opacity-40 blur-xl" />
          
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Ogólna Ocena Jakości</p>
              <h2 className={`mt-2 text-3xl font-black tracking-tight ${scoreMeta.text}`}>{scoreMeta.label}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{scoreMeta.desc}</p>
            </div>
            
            {/* SVG Circular Progress Meter */}
            <div className="relative h-24 w-24 shrink-0">
              <svg className="h-full w-full -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  className="stroke-slate-200/60"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  className="stroke-indigo-600 transition-all duration-1000 ease-out"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-900">{result.overallScore}</span>
                <span className="text-[10px] font-bold text-slate-400">/ 100</span>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Wersja algorytmu: <strong>1.0.0</strong></span>
              <span className="font-semibold text-slate-600">Szybki audyt anonimowy</span>
            </div>
          </div>
        </div>

        {/* Dynamic Model Profile Info Area */}
        <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">PROFIL AUDYTU: UNIWERSALNY</h3>
            </div>
            
            <div className="mt-4">
              <p className="text-xs leading-relaxed text-slate-600">
                Analiza ocenia prompt według uniwersalnych zasad: jasności celu, kontekstu, struktury, ograniczeń, formatu wyniku i bezpieczeństwa.
              </p>
              <p className="mt-3 text-xs leading-relaxed text-amber-700 bg-amber-50/50 border border-amber-100 rounded-xl p-3 font-medium">
                Ten audyt ma charakter ogólny. Przed użyciem promptu w krytycznym procesie zweryfikuj wynik samodzielnie.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Breakdown Dashboard */}
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        
        {/* Left Side: Summary, Weaknesses, Improvement Plan */}
        <div className="space-y-8">
          
          {/* Overall Summary Card */}
          <section className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm">
            <h3 className="text-lg font-bold tracking-tight text-slate-900">Podsumowanie audytu</h3>
            <div className="relative mt-4">
              <svg className="absolute -left-2 -top-2 h-8 w-8 text-slate-100 -z-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 10.017-10.366V6.78c-3.626.697-5.067 2.073-5.289 4.394 1.157.067 2.185.666 2.66 1.37.563.83.618 1.887.26 2.684-.357.797-1.121 1.293-1.948 1.293-2.187 0-3.7-1.713-3.7-3.7v-.03c0-3.684 2.87-6.85 7.42-7.85v-.03c.839 0 1.545-.515 1.8-.135C24 6.78 24 6.78 24 6.78z" />
              </svg>
              <p className="text-sm leading-relaxed text-slate-600 pl-4">
                {result.overall_summary}
              </p>
            </div>
          </section>

          {/* Top Weaknesses Section */}
          <section className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold tracking-tight text-slate-900">Największe słabości</h3>
            </div>
            
            <div className="mt-4 grid gap-3">
              {result.top_weaknesses.map((weakness, i) => (
                <div key={i} className="flex items-start gap-3 rounded-2xl bg-slate-50/50 p-4 border border-slate-100 hover:bg-slate-50 transition-colors">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[10px] font-black text-rose-700">
                    {i + 1}
                  </span>
                  <p className="text-xs font-medium text-slate-700 leading-relaxed">{weakness}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Improvement Plan Section */}
          <section className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold tracking-tight text-slate-900">Plan naprawy</h3>
            </div>

            <div className="mt-4 space-y-3">
              {result.improvement_plan.map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-black text-indigo-600 border border-indigo-100">
                    {i + 1}
                  </div>
                  <p className="text-xs font-semibold text-slate-700">{step}</p>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Right Side: Criteria Breakdown with Native Details/Summary */}
        <section className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-slate-900">Kryteria szczegółowe</h3>
              <p className="text-xs text-slate-500 mt-0.5">Kliknij kryterium, aby zobaczyć wyjaśnienie</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500 uppercase">
              10 Parametrów
            </span>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {result.criteria_scores.map((item) => {
              const barColor = item.raw_score_0_10 >= 8 
                ? 'bg-emerald-500' 
                : item.raw_score_0_10 >= 6 
                ? 'bg-indigo-500' 
                : item.raw_score_0_10 >= 4 
                ? 'bg-amber-500' 
                : 'bg-rose-500'

              const scoreBg = item.raw_score_0_10 >= 8 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                : item.raw_score_0_10 >= 6 
                ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
                : item.raw_score_0_10 >= 4 
                ? 'bg-amber-50 text-amber-700 border-amber-100' 
                : 'bg-rose-50 text-rose-700 border-rose-100'

              return (
                <details key={item.criterion} className="group py-3.5 first:pt-0 last:pb-0">
                  <summary className="flex w-full items-center justify-between gap-4 text-left hover:opacity-90 active:scale-[0.99] transition-all list-none [&::-webkit-details-marker]:hidden cursor-pointer select-none">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-800">
                          {criterionTranslations[item.criterion] || item.criterion}
                        </span>
                        <span className={`rounded-xl border px-2 py-0.5 text-xs font-black ${scoreBg}`}>
                          {item.raw_score_0_10} / 10
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barColor}`}
                          style={{ width: `${item.raw_score_0_10 * 10}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Expand/Collapse Chevron */}
                    <div className="shrink-0 p-1 text-slate-400">
                      <svg
                        className="h-4.5 w-4.5 transition-transform duration-300 group-open:rotate-180 group-open:text-indigo-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </summary>

                  {/* Expandable Details Container */}
                  <div className="mt-3.5 transition-all duration-300">
                    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-2.5">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Analiza słabości:</p>
                        <p className="mt-1 text-xs text-slate-700 leading-relaxed">{item.rationale}</p>
                      </div>
                      <div className="border-t border-slate-200/50 pt-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Rekomendowane ulepszenie:</p>
                        <p className="mt-1 text-xs text-indigo-950 font-medium leading-relaxed">{item.improvement_suggestion}</p>
                      </div>
                    </div>
                  </div>
                </details>
              )
            })}
          </div>
        </section>

      </div>

      {/* Improved Prompt Block (Sleek Dark Theme Editor Style) */}
      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-xl">
        {/* Editor Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 bg-slate-900/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="h-3 w-3 rounded-full bg-rose-500/80" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 border-l border-slate-800 pl-3">
              POPRAWIONY PROMPT
            </span>
          </div>

          <CopyButton text={result.improved_prompt} analysisId={result.id} variant="secondary" />
        </div>

        {/* Editor Code Area */}
        <div className="p-6 font-mono text-sm leading-relaxed text-indigo-200 selection:bg-indigo-500/30">
          <pre className="whitespace-pre-wrap break-words font-mono w-full">
            {promptLines.map((line, i) => (
              <div key={i} className="flex items-start hover:bg-white/5 transition-colors duration-150 rounded py-0.5 px-1">
                <span className="select-none w-8 text-right text-slate-600 shrink-0 pr-3 border-r border-slate-800/40 font-mono">
                  {i + 1}
                </span>
                <code className="pl-4 whitespace-pre-wrap break-words font-mono flex-1 block">
                  {line || ' '}
                </code>
              </div>
            ))}
          </pre>
        </div>
      </section>

      {/* Safety, Uncertainty, Model Fit & Change Notes Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        
        {/* Change Explanations */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-indigo-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Wyjaśnienie Zmian</h4>
          </div>
          <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-600 leading-relaxed">
            {result.change_explanations.map((note, i) => <li key={i}>{note}</li>)}
          </ul>
        </div>

        {/* Model Fit Notes */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-indigo-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">ZGODNOŚĆ Z PROFILEM AUDYTU</h4>
          </div>
          <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-600 leading-relaxed">
            {result.model_fit_notes.map((note, i) => <li key={i}>{note}</li>)}
          </ul>
        </div>

        {/* Uncertainty Warnings */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-amber-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">OSTRZEŻENIA</h4>
          </div>
          <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-600 leading-relaxed">
            {result.uncertainty_warnings.map((note, i) => <li key={i}>{note}</li>)}
          </ul>
        </div>

        {/* Safety Notes */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-rose-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">BEZPIECZEŃSTWO</h4>
          </div>
          <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-600 leading-relaxed">
            {result.safety_notes.map((note, i) => <li key={i}>{note}</li>)}
          </ul>
        </div>

      </div>

      {/* Footer Interactive Actions Section: Feedback & Public Sharing */}
      {!isPublicMode && (
        <div className="grid gap-6 md:grid-cols-2">
          <FeedbackSection analysisId={result.id} />
          <ShareSettings
            analysisId={result.id}
            isShareEnabledInitially={result.isShareEnabled ?? false}
            shareTokenInitially={result.shareToken ?? null}
          />
        </div>
      )}
    </div>
  )
}
