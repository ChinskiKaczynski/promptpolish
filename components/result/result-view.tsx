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
const scoreLevelTranslations: Record<string, { label: string; desc: string; text: string; border: string; bar: string }> = {
  excellent: {
    label: 'Doskonały',
    desc: 'Prompt spełnia najwyższe standardy inżynierii promptów.',
    text: 'text-pp-success',
    border: 'border-pp-success',
    bar: 'pp-stat-fill-success'
  },
  strong: {
    label: 'Bardzo dobry',
    desc: 'Prompt jest solidny, wymaga jedynie kosmetycznych usprawnień.',
    text: 'text-pp-cyan',
    border: 'border-pp-cyan',
    bar: 'pp-stat-fill-primary'
  },
  decent: {
    label: 'Dostateczny',
    desc: 'Prompt działa poprawnie, lecz posiada istotne braki strukturalne.',
    text: 'text-pp-warning',
    border: 'border-pp-warning',
    bar: 'pp-stat-fill-warning'
  },
  needs_work: {
    label: 'Wymaga poprawek',
    desc: 'Prompt ma niską precyzję i może dawać niespójne odpowiedzi.',
    text: 'text-pp-warning',
    border: 'border-pp-warning',
    bar: 'pp-stat-fill-warning'
  },
  weak: {
    label: 'Słaby',
    desc: 'Prompt jest chaotyczny, pozbawiony celu i kluczowych kontekstów.',
    text: 'text-pp-danger',
    border: 'border-pp-danger',
    bar: 'pp-stat-fill-danger'
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
    <div className="space-y-8 pb-16 font-mono text-pp-text">
      
      {/* Top Breadcrumb/Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b-2 border-pp-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="border border-pp-border bg-pp-panel px-2.5 py-0.5 text-[9px] font-bold text-pp-muted">
              {isPublicMode ? 'STATUS // PUBLICZNY_RAPORT' : 'STATUS // PRYWATNY_AUDYT'}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-black uppercase tracking-wider text-pp-text sm:text-3xl">Raport audytu promptu</h1>
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
      <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
        
        {/* Score Display Card */}
        <div className={`pp-panel p-6 sm:p-8 border-2 relative flex flex-col justify-between ${scoreMeta.border}`}>
          <div className="absolute top-0 right-4 -translate-y-1/2 bg-pp-bg px-2 text-[9px] font-bold text-pp-cyan tracking-widest uppercase">
            {"// WYNIK_ANALIZY"}
          </div>

          <div className="flex items-center justify-between gap-6 flex-wrap sm:flex-nowrap">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-pp-muted">Ogólna Ocena Jakości</p>
              <h2 className={`text-2xl font-black tracking-wider uppercase ${scoreMeta.text}`}>{scoreMeta.label}</h2>
              <p className="text-xs leading-relaxed text-pp-muted">{scoreMeta.desc}</p>
            </div>
            
            {/* Circular Progress Meter */}
            <div className="relative h-24 w-24 shrink-0 mx-auto sm:mx-0">
              <svg className="h-full w-full -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  className="stroke-pp-border/40"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  className="stroke-pp-border-bright transition-all duration-1000 ease-out"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="square"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                <span className="text-2xl font-black text-pp-text tracking-tighter">{result.overallScore}</span>
                <span className="text-[9px] font-bold text-pp-muted">/ 100</span>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-pp-border/50 pt-4">
            <div className="flex items-center justify-between text-[10px] text-pp-muted">
              <span>ALGO_VER: <strong>1.0.0</strong></span>
              <span className="font-semibold text-pp-text uppercase tracking-wider">AUDYT_ANONIMOWY</span>
            </div>
          </div>
        </div>

        {/* Dynamic Model Profile Info Area */}
        <div className="pp-panel border-2 border-pp-border p-6 sm:p-8 relative flex flex-col justify-between">
          <div className="absolute top-0 right-4 -translate-y-1/2 bg-pp-bg px-2 text-[9px] font-bold text-pp-cyan tracking-widest uppercase">
            {"// PARAMETRY_CELU"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-pp-cyan text-sm font-bold">[i]</span>
              <h3 className="text-xs font-bold text-pp-text uppercase tracking-wider">PROFIL AUDYTU: UNIWERSALNY</h3>
            </div>
            
            <div className="mt-4 space-y-3">
              <p className="text-[11px] leading-relaxed text-pp-muted font-mono">
                Analiza ocenia prompt według uniwersalnych zasad: jasności celu, kompletności kontekstu, ograniczeń, formatu wyniku i ochrony prywatności.
              </p>
              <div className="border border-pp-warning bg-pp-warning/10 p-3 text-[10px] leading-relaxed text-pp-warning font-medium">
                Ten audyt ma charakter diagnostyczny. Zweryfikuj rekomendacje we własnym zespole przed wdrożeniem na produkcji.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Breakdown Dashboard */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        
        {/* Left Side: Summary, Weaknesses, Improvement Plan */}
        <div className="space-y-6">
          
          {/* Overall Summary Card */}
          <section className="pp-panel p-6 border-2 border-pp-border relative">
            <div className="absolute top-0 right-4 -translate-y-1/2 bg-pp-bg px-2 text-[9px] font-bold text-pp-cyan tracking-widest uppercase">
              {"// PODSUMOWANIE"}
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-pp-text border-b border-pp-border pb-2 mb-3">
              Komentarz diagnostyczny
            </h3>
            <p className="text-xs leading-relaxed text-pp-muted font-mono">
              {result.overall_summary}
            </p>
          </section>

          {/* Top Weaknesses Section */}
          <section className="pp-panel p-6 border-2 border-pp-border relative">
            <div className="absolute top-0 right-4 -translate-y-1/2 bg-pp-bg px-2 text-[9px] font-bold text-pp-danger tracking-widest uppercase">
              {"// WYKRYTE_SŁABOŚCI"}
            </div>
            <div className="flex items-center gap-2 border-b border-pp-border pb-2 mb-3">
              <span className="text-pp-danger text-sm font-bold">[ERR]</span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-pp-text">Główne Luki Systemu</h3>
            </div>
            
            <div className="grid gap-3">
              {result.top_weaknesses.map((weakness, i) => (
                <div key={i} className="flex items-start gap-3 pp-inset p-3 bg-black/20">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center border border-pp-danger bg-pp-danger/10 text-[9px] font-black text-pp-danger font-mono">
                    {i + 1}
                  </span>
                  <p className="text-xs font-medium text-pp-text leading-relaxed font-mono">{weakness}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Improvement Plan Section */}
          <section className="pp-panel p-6 border-2 border-pp-border relative">
            <div className="absolute top-0 right-4 -translate-y-1/2 bg-pp-bg px-2 text-[9px] font-bold text-pp-success tracking-widest uppercase">
              {"// REKOMENDACJE_NAPRAWY"}
            </div>
            <div className="flex items-center gap-2 border-b border-pp-border pb-2 mb-3">
              <span className="text-pp-success text-sm font-bold">[OK]</span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-pp-text">Ścieżka Optymalizacji</h3>
            </div>

            <div className="space-y-3">
              {result.improvement_plan.map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center border border-pp-border-bright bg-pp-panel-2 text-[9px] font-black text-pp-primary-bright font-mono">
                    {i + 1}
                  </div>
                  <p className="text-xs font-semibold text-pp-text font-mono">{step}</p>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Right Side: Criteria Breakdown */}
        <section className="pp-panel p-6 border-2 border-pp-border relative">
          <div className="absolute top-0 right-4 -translate-y-1/2 bg-pp-bg px-2 text-[9px] font-bold text-pp-cyan tracking-widest uppercase">
            {"// SZCZEGÓŁOWE_METRYKI"}
          </div>
          <div className="flex items-center justify-between border-b border-pp-border pb-3 mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-pp-text">Parametry inżynieryjne</h3>
              <p className="text-[10px] text-pp-muted mt-0.5">Kliknij wiersz aby pokazać logi diagnozy</p>
            </div>
            <span className="border border-pp-border bg-pp-bg px-2.5 py-0.5 text-[9px] font-bold text-pp-muted">
              10 KRYTERIÓW
            </span>
          </div>

          <div className="divide-y divide-pp-border/30">
            {result.criteria_scores.map((item) => {
              const scoreMeta = item.raw_score_0_10 >= 8 
                ? { fill: 'pp-stat-fill-success', text: 'text-pp-success', bg: 'border-pp-success bg-pp-success/5 text-pp-success' } 
                : item.raw_score_0_10 >= 6 
                ? { fill: 'pp-stat-fill-primary', text: 'text-pp-cyan', bg: 'border-pp-cyan bg-pp-cyan/5 text-pp-cyan' } 
                : item.raw_score_0_10 >= 4 
                ? { fill: 'pp-stat-fill-warning', text: 'text-pp-warning', bg: 'border-pp-warning bg-pp-warning/5 text-pp-warning' } 
                : { fill: 'pp-stat-fill-danger', text: 'text-pp-danger', bg: 'border-pp-danger bg-pp-danger/5 text-pp-danger' }

              return (
                <details key={item.criterion} className="group py-3 first:pt-0 last:pb-0 font-mono">
                  <summary className="flex w-full items-center justify-between gap-4 text-left hover:opacity-90 active:translate-y-0.5 transition-all list-none [&::-webkit-details-marker]:hidden cursor-pointer select-none">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-pp-text">
                          {criterionTranslations[item.criterion] || item.criterion}
                        </span>
                        <span className={`border px-2 py-0.5 text-[10px] font-bold ${scoreMeta.bg}`}>
                          {item.raw_score_0_10} / 10
                        </span>
                      </div>
                      
                      {/* Retro Progress Bar */}
                      <div className="mt-2 pp-stat-track">
                        <div
                          className={`pp-stat-fill ${scoreMeta.fill}`}
                          style={{ width: `${item.raw_score_0_10 * 10}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Expand/Collapse Chevron replacement: simple retro indicators */}
                    <div className="shrink-0 p-1 text-pp-muted font-bold text-xs select-none">
                      <span className="group-open:hidden">[+]</span>
                      <span className="hidden group-open:inline">[-]</span>
                    </div>
                  </summary>

                  {/* Expandable Details Container */}
                  <div className="mt-3.5 transition-all duration-300">
                    <div className="pp-inset p-4 bg-black/30 space-y-3 text-[11px] leading-relaxed">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-pp-danger">{"// LOGI DIAGNOZY SŁABOŚCI:"}</p>
                        <p className="mt-1 text-pp-text">{item.rationale}</p>
                      </div>
                      <div className="border-t border-pp-border/40 pt-2.5">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-pp-cyan">{"// REKOMENDACJA NAPRAWY:"}</p>
                        <p className="mt-1 text-pp-primary-bright font-medium">{item.improvement_suggestion}</p>
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
      <section className="pp-panel border-2 border-pp-border relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-4 -translate-y-1/2 bg-pp-bg px-2 text-[9px] font-bold text-pp-cyan tracking-widest uppercase">
          {"// REZULTAT // ULEPSZONY_KOD"}
        </div>

        {/* Editor Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-pp-border bg-pp-panel-2 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="h-2.5 w-2.5 bg-pp-danger" />
              <span className="h-2.5 w-2.5 bg-pp-warning" />
              <span className="h-2.5 w-2.5 bg-pp-success" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-pp-text border-l border-pp-border pl-3">
              POPRAWIONY PROMPT SYSTEMOWY
            </span>
          </div>

          <CopyButton text={result.improved_prompt} analysisId={result.id} variant="secondary" />
        </div>

        {/* Editor Code Area */}
        <div className="p-6 font-mono text-xs leading-relaxed text-pp-text bg-black/40">
          <pre className="whitespace-pre-wrap break-words font-mono w-full">
            {promptLines.map((line, i) => (
              <div key={i} className="flex items-start hover:bg-pp-border/20 transition-colors duration-150 py-0.5 px-1 font-mono">
                <span className="select-none w-8 text-right text-pp-muted shrink-0 pr-3 border-r border-pp-border/50 font-mono">
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 font-mono text-xs">
        
        {/* Change Explanations */}
        <div className="pp-panel p-5 border border-pp-border space-y-3 relative">
          <div className="absolute top-0 left-4 -translate-y-1/2 bg-pp-bg px-2 text-[9px] font-bold text-pp-cyan uppercase">
            {"// ZMIANY"}
          </div>
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-pp-text border-b border-pp-border/40 pb-1">WYJAŚNIENIE ZMIAN</h4>
          <ul className="list-disc pl-4 space-y-1.5 text-[11px] text-pp-muted leading-relaxed font-mono">
            {result.change_explanations.map((note, i) => <li key={i}>{note}</li>)}
          </ul>
        </div>

        {/* Model Fit Notes */}
        <div className="pp-panel p-5 border border-pp-border space-y-3 relative">
          <div className="absolute top-0 left-4 -translate-y-1/2 bg-pp-bg px-2 text-[9px] font-bold text-pp-cyan uppercase">
            {"// DOPASOWANIE"}
          </div>
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-pp-text border-b border-pp-border/40 pb-1">PROFIL MODELU</h4>
          <ul className="list-disc pl-4 space-y-1.5 text-[11px] text-pp-muted leading-relaxed font-mono">
            {result.model_fit_notes.map((note, i) => <li key={i}>{note}</li>)}
          </ul>
        </div>

        {/* Uncertainty Warnings */}
        <div className="pp-panel p-5 border border-pp-border space-y-3 relative">
          <div className="absolute top-0 left-4 -translate-y-1/2 bg-pp-bg px-2 text-[9px] font-bold text-pp-warning uppercase">
            {"// OSTRZEŻENIA"}
          </div>
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-pp-text border-b border-pp-border/40 pb-1">OSTRZEŻENIA SYSTEMU</h4>
          <ul className="list-disc pl-4 space-y-1.5 text-[11px] text-pp-muted leading-relaxed font-mono">
            {result.uncertainty_warnings.map((note, i) => <li key={i}>{note}</li>)}
          </ul>
        </div>

        {/* Safety Notes */}
        <div className="pp-panel p-5 border border-pp-border space-y-3 relative">
          <div className="absolute top-0 left-4 -translate-y-1/2 bg-pp-bg px-2 text-[9px] font-bold text-pp-danger uppercase">
            {"// POLITYKI_SEC"}
          </div>
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-pp-text border-b border-pp-border/40 pb-1">KWESTIE BEZPIECZEŃSTWA</h4>
          <ul className="list-disc pl-4 space-y-1.5 text-[11px] text-pp-muted leading-relaxed font-mono">
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
