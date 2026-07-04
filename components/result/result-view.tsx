'use client'

import { useState, useEffect } from 'react'
import type { AnalysisResult } from '@/lib/ai/schemas'
import { mvpModelProfiles } from '@/lib/ai/model-profiles'
import { normalizeNewlines } from '@/lib/export/format-analysis'
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
    selected_profile_slug?: string;
    working_language?: string;
    input_prompt?: string;
  }
  mode: 'private' | 'share' | 'public'
  planSlug?: 'free' | 'pro'
}

// English to Polish translations for score levels
const scoreLevelTranslations: Record<string, { label: string; desc: string; bg: string; text: string; border: string; bar: string }> = {
  excellent: {
    label: 'Doskonały',
    desc: 'Prompt spełnia najwyższe standardy inżynierii promptów.',
    bg: 'bg-[#6EE7B7]/5',
    text: 'text-[#6EE7B7]',
    border: 'border-[#6EE7B7]/20',
    bar: 'from-[#059669] to-[#6EE7B7]'
  },
  strong: {
    label: 'Bardzo dobry',
    desc: 'Prompt jest solidny, wymaga jedynie kosmetycznych usprawnień.',
    bg: 'bg-[#A78BFA]/5',
    text: 'text-[#A78BFA]',
    border: 'border-[#A78BFA]/20',
    bar: 'from-[#7C3AED] to-[#A78BFA]'
  },
  decent: {
    label: 'Dostateczny',
    desc: 'Prompt działa poprawnie, lecz posiada istotne braki strukturalne.',
    bg: 'bg-[#F59E0B]/5',
    text: 'text-[#F59E0B]',
    border: 'border-[#F59E0B]/20',
    bar: 'from-[#B45309] to-[#F59E0B]'
  },
  needs_work: {
    label: 'Wymaga poprawek',
    desc: 'Prompt ma niską precyzję i może dawać niespójne odpowiedzi.',
    bg: 'bg-[#F97316]/5',
    text: 'text-[#F97316]',
    border: 'border-[#F97316]/20',
    bar: 'from-[#C2410C] to-[#F97316]'
  },
  weak: {
    label: 'Słaby',
    desc: 'Prompt jest chaotyczny, pozbawiony celu i kluczowych kontekstów.',
    bg: 'bg-[#F87171]/5',
    text: 'text-[#F87171]',
    border: 'border-[#F87171]/20',
    bar: 'from-[#DC2626] to-[#F87171]'
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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(timer)
  }, [])

  const scoreMeta = scoreLevelTranslations[result.scoreLevel] || scoreLevelTranslations.decent
  const normalizedImprovedPrompt = normalizeNewlines(result.improved_prompt)
  const promptLines = normalizedImprovedPrompt.split('\n')

  // Score SVG math
  const radius = 42
  const strokeWidth = 8
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (result.overallScore / 100) * circumference

  const isPublicMode = mode === 'share' || mode === 'public'

  return (
    <div className="space-y-8 pb-16">
      {/* Top Breadcrumb/Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[#2A2A3A] pb-6 animate-fade-in-up">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-[#1C1C27] border border-[#3A3A52] px-2.5 py-0.5 text-[11px] font-semibold text-[#A78BFA] uppercase tracking-wider">
              {isPublicMode ? 'Publiczny raport' : 'Prywatny audyt'}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#E2E8F0] font-heading sm:text-3xl">Raport audytu promptu</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          {!isPublicMode ? (
            <ExportActions
              analysisId={result.id}
              planSlug={planSlug}
              improvedPrompt={normalizedImprovedPrompt}
            />
          ) : (
            <CopyButton text={normalizedImprovedPrompt} analysisId={result.id} variant="primary" />
          )}
        </div>
      </div>

      {/* Main Score & Warning Cards Layout */}
      <div className="grid gap-6 md:grid-cols-[1fr_1.2fr] animate-fade-in-up animation-delay-100">
        {/* Score Display Card */}
        <div className={`relative flex flex-col justify-between overflow-hidden rounded-xl border p-6 sm:p-7 shadow-lg transition-all ${scoreMeta.bg} ${scoreMeta.border}`}>
          <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-[#A78BFA]/5 opacity-30 blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <p className="text-xs font-mono font-bold uppercase tracking-[0.15em] text-[#8290A2]">Ogólna Ocena Jakości</p>
              <h2 className={`text-2xl font-bold tracking-tight font-heading ${scoreMeta.text}`}>{scoreMeta.label}</h2>
              <p className="text-xs leading-relaxed text-[#94A3B8] max-w-[240px]">{scoreMeta.desc}</p>
            </div>
            
            {/* SVG Circular Progress Meter */}
            <div className="relative h-24 w-24 shrink-0 rounded-full bg-[#1C1C27] flex items-center justify-center border border-[#2A2A3A]">
              <svg className="h-[88px] w-[88px] -rotate-90">
                <circle
                  cx="44"
                  cy="44"
                  r={radius}
                  className="stroke-[#1C1C27]"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                <circle
                  cx="44"
                  cy="44"
                  r={radius}
                  className="stroke-[#A78BFA] transition-all duration-1000 ease-out"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={mounted ? strokeDashoffset : circumference}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-[#E2E8F0] font-mono leading-none">{result.overallScore}</span>
                <span className="text-xs font-mono font-bold text-[#8290A2] mt-1">/ 100</span>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-[#2A2A3A]/50 pt-4 relative z-10">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#8290A2]">
              <span>Wersja algorytmu: <strong className="font-semibold text-[#6EE7B7]/70">{result.analysis_schema_version || '1.0.0'}</strong></span>
              <span className="font-semibold text-[#6EE7B7]/70">
                {planSlug === 'pro'
                  ? 'Profesjonalny audyt Pro'
                  : mode === 'share'
                  ? 'Udostępniony audyt Free'
                  : 'Szybki audyt bezpłatny'}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Model Profile Info Area */}
        {(() => {
          const profile = mvpModelProfiles.find(p => p.slug === result.selected_profile_slug)
          const isStaleOrUnverified = !profile || profile.verificationStatus !== 'verified'
          
          return (
            <div className="flex flex-col justify-between rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6 sm:p-7">
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1C1C27] text-[#A78BFA] border border-[#2A2A3A] shrink-0">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">
                    PROFIL AUDYTU: {profile ? profile.displayName.toUpperCase() : 'UNIWERSALNY'}
                  </h3>
                </div>
                
                  <p className="text-xs leading-relaxed text-[#94A3B8]">
                    Analiza ocenia prompt według ogólnych, uniwersalnych zasad przejrzystości, kontekstu i struktury dla LLM.
                  </p>
                  
                  {isStaleOrUnverified && (
                    <div className="rounded-lg border border-[#2A2A3A] bg-[#1C1C27] p-3 flex gap-2 text-[#8290A2]">
                      <span className="text-sm leading-none mt-0.5 shrink-0" aria-hidden="true">ℹ️</span>
                      <p className="text-[11px] leading-relaxed">
                        Profil nie deklaruje konkretnych parametrów technicznych modelu — celowe podejście, które eliminuje nieaktualne roszczenia dotyczące możliwości.
                      </p>
                    </div>
                  )}

                  <div className="rounded-lg border border-[#F59E0B]/20 bg-[#F59E0B]/5 p-3.5 flex gap-3">
                    <span className="text-lg" aria-hidden="true">💡</span>
                    <p className="text-[11px] leading-relaxed text-[#F59E0B]/80 font-medium">
                      Ten audyt ma charakter pomocniczy. Przed użyciem promptu w krytycznym procesie zweryfikuj wynik samodzielnie.
                    </p>
                  </div>
                </div>
              </div>
            )
          })()}
      </div>

      {/* Main Two-Column Breakdown Dashboard */}
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        
        {/* Left Side: Summary, Weaknesses, Improvement Plan */}
        <div className="space-y-8 animate-fade-in-up animation-delay-200">
          
          {/* Overall Summary Card */}
          <section className="rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6 sm:p-7">
            <h3 className="text-lg font-bold tracking-tight text-[#E2E8F0] font-heading mb-4">Podsumowanie audytu</h3>
            <div className="relative">
              <p className="text-xs sm:text-sm leading-relaxed text-[#94A3B8] pl-2">
                {result.overall_summary}
              </p>
            </div>
          </section>

          {/* Original Prompt Collapsible Section */}
          {mode === 'private' && result.input_prompt && (
            <details className="group rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6 sm:p-7 transition-all duration-300">
              <summary className="flex items-center justify-between font-heading text-lg font-bold text-[#E2E8F0] cursor-pointer list-none [&::-webkit-details-marker]:hidden select-none">
                <span>Oryginalny prompt</span>
                <svg
                  className="h-5 w-5 text-[#8290A2] transition-transform duration-300 group-open:rotate-180 group-open:text-[#A78BFA]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="mt-4 border-t border-[#2A2A3A]/40 pt-4">
                <pre className="whitespace-pre-wrap break-words font-mono text-xs text-[#94A3B8] bg-[#0C0C10] p-4 rounded-lg border border-[#2A2A3A]">
                  {result.input_prompt}
                </pre>
              </div>
            </details>
          )}

          {/* Top Weaknesses Section */}
          <section className="rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6 sm:p-7">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold tracking-tight text-[#E2E8F0] font-heading">Największe słabości</h3>
            </div>
            
            <div className="grid gap-3">
              {result.top_weaknesses.map((weakness, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl bg-[#1C1C27] p-4 border border-[#2A2A3A] hover:bg-[#222230] transition-colors">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F87171]/10 text-xs font-black text-[#F87171] border border-[#F87171]/20">
                    {i + 1}
                  </span>
                  <p className="text-xs font-semibold text-[#94A3B8] leading-relaxed">{weakness}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Improvement Plan Section */}
          <section className="rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6 sm:p-7">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold tracking-tight text-[#E2E8F0] font-heading">Plan naprawy</h3>
            </div>

            <div className="space-y-3.5">
              {result.improvement_plan.map((step, i) => (
                <div key={i} className="flex items-start gap-3 p-1">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#A78BFA]/10 text-xs font-black text-[#A78BFA] border border-[#A78BFA]/20">
                    {i + 1}
                  </div>
                  <p className="text-xs font-bold text-[#94A3B8] mt-0.5 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Right Side: Criteria Breakdown with Native Details/Summary */}
        <section className="rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6 sm:p-7 animate-fade-in-up animation-delay-300">
          <div className="flex items-center justify-between border-b border-[#2A2A3A]/30 pb-4 mb-4">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-[#E2E8F0] font-heading">Kryteria szczegółowe</h3>
              <p className="text-[11px] text-[#8290A2] mt-0.5 font-medium">Kliknij kryterium, aby zobaczyć wyjaśnienie</p>
            </div>
            <span className="rounded-full bg-[#A78BFA]/10 border border-[#A78BFA]/20 px-2.5 py-0.5 text-xs font-bold text-[#A78BFA] uppercase tracking-wider">
              10 Parametrów
            </span>
          </div>

          <div className="divide-y divide-[#2A2A3A]/30">
            {result.criteria_scores.map((item) => {
              const barColor = item.raw_score_0_10 >= 8 
                ? 'from-[#059669] to-[#6EE7B7]' 
                : item.raw_score_0_10 >= 6 
                ? 'from-[#7C3AED] to-[#A78BFA]' 
                : item.raw_score_0_10 >= 4 
                ? 'from-[#B45309] to-[#F59E0B]' 
                : 'from-[#DC2626] to-[#F87171]'

              const scoreBg = item.raw_score_0_10 >= 8 
                ? 'bg-[#6EE7B7]/10 text-[#6EE7B7] border-[#6EE7B7]/20' 
                : item.raw_score_0_10 >= 6 
                ? 'bg-[#A78BFA]/10 text-[#A78BFA] border-[#A78BFA]/20' 
                : item.raw_score_0_10 >= 4 
                ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20' 
                : 'bg-[#F87171]/10 text-[#F87171] border-[#F87171]/20'

              return (
                <details key={item.criterion} className="group py-4 first:pt-0 last:pb-0">
                  <summary className="flex w-full items-center justify-between gap-4 text-left hover:opacity-90 active:scale-[0.99] transition-all list-none [&::-webkit-details-marker]:hidden cursor-pointer select-none">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-[#E2E8F0]">
                          {criterionTranslations[item.criterion] || item.criterion}
                        </span>
                        <span className={`rounded-xl border px-2.5 py-0.5 text-xs font-black ${scoreBg}`}>
                          {item.raw_score_0_10} / 10
                        </span>
                      </div>
                      
                      {/* Progress Bar with smooth growth animation */}
                      <div className="mt-2.5 h-1.5 w-full bg-[#1C1C27] rounded-full overflow-hidden border border-[#2A2A3A]">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-1000 ease-out`}
                          style={{ width: mounted ? `${item.raw_score_0_10 * 10}%` : '0%' }}
                        />
                      </div>
                    </div>
                    
                    {/* Expand/Collapse Chevron */}
                    <div className="shrink-0 p-1 text-[#8290A2]">
                      <svg
                        className="h-5 w-5 transition-transform duration-300 group-open:rotate-180 group-open:text-[#A78BFA]"
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
                    <div className="rounded-xl bg-[#1C1C27] border border-[#2A2A3A] p-4 space-y-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#8290A2]">Analiza słabości:</p>
                        <p className="mt-1 text-xs text-[#94A3B8] leading-relaxed font-semibold">{item.rationale}</p>
                      </div>
                      <div className="border-t border-[#2A2A3A] pt-2.5">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#A78BFA]">Rekomendowane ulepszenie:</p>
                        <p className="mt-1 text-xs text-[#A78BFA] font-bold leading-relaxed">{item.improvement_suggestion}</p>
                      </div>
                    </div>
                  </div>
                </details>
              )
            })}
          </div>
        </section>

      </div>

      {/* Improved Prompt Block (Sleek Dark Theme Editor Style matching layout mockup) */}
      <section className="overflow-hidden rounded-xl border border-[#2A2A3A] bg-[#0C0C10] shadow-2xl animate-fade-in-up animation-delay-400">
        {/* Editor Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2A2A3A] bg-[#13131A] px-6 py-4">
          <div className="flex items-center gap-3">
            {/* Mock Windows controls from screenshot mockup */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="h-3 w-3 rounded-full bg-rose-500/85" />
              <span className="h-3 w-3 rounded-full bg-amber-500/85" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/85" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#94A3B8] border-l border-[#2A2A3A] pl-3">
              POPRAWIONY PROMPT
            </span>
          </div>

          <CopyButton text={normalizedImprovedPrompt} analysisId={result.id} variant="secondary" />
        </div>

        {/* Editor Code Area */}
        <div className="p-6 font-mono text-sm leading-relaxed text-[#E2E8F0] selection:bg-[#A78BFA]/20">
          <pre className="whitespace-pre-wrap break-words font-mono w-full">
            {promptLines.map((line, i) => (
              <div key={i} className="flex items-start hover:bg-[#A78BFA]/5 transition-colors duration-150 rounded py-0.5 px-1">
                <span className="select-none w-8 text-right text-[#8290A2] shrink-0 pr-3 border-r border-[#2A2A3A]/40 font-mono">
                  {i + 1}
                </span>
                <code className="pl-4 whitespace-pre-wrap break-words font-mono text-[#E2E8F0] flex-1 block">
                  {line || ' '}
                </code>
              </div>
            ))}
          </pre>
        </div>
      </section>

      {/* Safety, Uncertainty, Model Fit & Change Notes Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-fade-in-up animation-delay-500">
        
        {/* Change Explanations */}
        <div className="rounded-xl border border-[#2A2A3A] bg-[#13131A] p-5 space-y-3.5">
          <div className="flex items-center gap-2.5 text-[#A78BFA]">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#E2E8F0]">Wyjaśnienie Zmian</h4>
          </div>
          <ul className="list-disc pl-4 space-y-2 text-xs text-[#94A3B8] leading-relaxed">
            {result.change_explanations.map((note, i) => <li key={i}>{note}</li>)}
          </ul>
        </div>

        {/* Model Fit Notes */}
        <div className="rounded-xl border border-[#2A2A3A] bg-[#13131A] p-5 space-y-3.5">
          <div className="flex items-center gap-2.5 text-[#A78BFA]">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#E2E8F0]">ZGODNOŚĆ Z PROFILEM</h4>
          </div>
          <ul className="list-disc pl-4 space-y-2 text-xs text-[#94A3B8] leading-relaxed">
            {result.model_fit_notes.map((note, i) => <li key={i}>{note}</li>)}
          </ul>
        </div>

        {/* Uncertainty Warnings */}
        <div className="rounded-xl border border-[#2A2A3A] bg-[#13131A] p-5 space-y-3.5">
          <div className="flex items-center gap-2.5 text-[#F59E0B]">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#E2E8F0]">OSTRZEŻENIA</h4>
          </div>
          <ul className="list-disc pl-4 space-y-2 text-xs text-[#94A3B8] leading-relaxed">
            {result.uncertainty_warnings.map((note, i) => <li key={i}>{note}</li>)}
          </ul>
        </div>

        {/* Safety Notes */}
        <div className="rounded-xl border border-[#2A2A3A] bg-[#13131A] p-5 space-y-3.5">
          <div className="flex items-center gap-2.5 text-[#F87171]">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#E2E8F0]">BEZPIECZEŃSTWO</h4>
          </div>
          <ul className="list-disc pl-4 space-y-2 text-xs text-[#94A3B8] leading-relaxed">
            {result.safety_notes.map((note, i) => <li key={i}>{note}</li>)}
          </ul>
        </div>

      </div>

      {/* Footer Interactive Actions Section: Feedback & Public Sharing */}
      {!isPublicMode && (
        <div className="grid gap-6 md:grid-cols-2 animate-fade-in-up animation-delay-500">
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
