'use client'

import { useState, useEffect } from 'react'
import type { AnalysisResult } from '@/lib/ai/schemas'
import { mvpModelProfiles } from '@/lib/ai/model-profiles'
import { UpgradeModal } from './upgrade-modal'


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
  const [isCopied, setIsCopied] = useState(false)
  const [feedbackVote, setFeedbackVote] = useState<'up' | 'down' | null>(null)
  const [feedbackComment, setFeedbackComment] = useState('')
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)
  const [isShareEnabled, setIsShareEnabled] = useState(result.isShareEnabled ?? false)
  const [shareToken, setShareToken] = useState<string | null>(result.shareToken ?? null)
  const [isShareLinkCopied, setIsShareLinkCopied] = useState(false)
  const [expandedCriteria, setExpandedCriteria] = useState<Record<string, boolean>>({})
  const [shareError, setShareError] = useState<string | null>(null)

  // Upgrade Modal states
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState('')

  // Export handlers
  const handleExportMarkdown = () => {
    if (planSlug !== 'pro') {
      setSelectedFeature('Eksport Markdown')
      setIsUpgradeModalOpen(true)
      return
    }

    if (!result.id) return
    window.location.href = `/api/export/markdown?id=${result.id}`
  }

  const handleExportPdf = () => {
    if (planSlug !== 'pro') {
      setSelectedFeature('Eksport PDF')
      setIsUpgradeModalOpen(true)
      return
    }

    if (!result.id) return
    window.location.href = `/api/export/pdf?id=${result.id}`
  }

  const handleUseBatchAudit = () => {
    setSelectedFeature('Audyt Zbiorczy (Batch Audit)')
    setIsUpgradeModalOpen(true)
  }

  // Find the model profile corresponding to the detected_task_type or a default
  const activeProfile = mvpModelProfiles.find(p => p.slug === 'openrouter-deepseek-v4-flash') || mvpModelProfiles[0]


  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(result.improved_prompt)
      setIsCopied(true)
    } catch (err) {
      console.error('Failed to copy text', err)
    }
    // Fire-and-forget: track copy event server-side without blocking UX
    if (result.id) {
      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_type: 'copy_improved_prompt', analysis_id: result.id })
      }).catch(() => { /* swallow silently — non-critical telemetry */ })
    }
  }

  const handleFeedbackVote = async (rating: 'up' | 'down') => {
    if (!result.id || feedbackSubmitted || feedbackLoading) return
    setFeedbackVote(rating)
    setFeedbackError(null)

    // For thumbs-up: submit immediately (no comment needed)
    // For thumbs-down: show comment textarea first, submit via handleSubmitFeedback
    if (rating === 'up') {
      await submitFeedback(rating, null)
    }
  }

  const submitFeedback = async (rating: 'up' | 'down', comment: string | null) => {
    if (!result.id) return
    setFeedbackLoading(true)
    setFeedbackError(null)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis_id: result.id,
          rating,
          comment: comment?.trim() || null
        })
      })
      if (!res.ok) {
        throw new Error('Nie udało się zapisać opinii. Spróbuj ponownie.')
      }
      setFeedbackSubmitted(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Błąd podczas zapisu opinii.'
      setFeedbackError(msg)
    } finally {
      setFeedbackLoading(false)
    }
  }

  const handleSubmitFeedback = () => {
    if (feedbackVote) {
      submitFeedback(feedbackVote, feedbackComment)
    }
  }

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => setIsCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [isCopied])

  const shareUrl = typeof window !== 'undefined' && shareToken
    ? `${window.location.origin}/share/${shareToken}`
    : ''

  const handleCopyShareLink = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setIsShareLinkCopied(true)
    } catch (err) {
      console.error('Failed to copy share link', err)
    }
  }

  useEffect(() => {
    if (isShareLinkCopied) {
      const timer = setTimeout(() => setIsShareLinkCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [isShareLinkCopied])

  const handleToggleShare = async () => {
    if (!result.id) return
    setShareError(null)
    const targetState = !isShareEnabled

    try {
      if (targetState) {
        // Enable public sharing via API
        const res = await fetch('/api/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ analysis_id: result.id })
        })

        if (!res.ok) {
          throw new Error('Nie udało się włączyć udostępniania publicznego.')
        }

        const data = await res.json()
        setIsShareEnabled(true)
        setShareToken(data.share_token)
      } else {
        // Disable public sharing via API
        const res = await fetch('/api/share/disable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ analysis_id: result.id })
        })

        if (!res.ok) {
          throw new Error('Nie udało się wyłączyć udostępniania publicznego.')
        }

        setIsShareEnabled(false)
        setShareToken(null)
      }
    } catch (err: unknown) {
      const errorObject = err instanceof Error ? err : new Error(String(err))
      console.error(errorObject)
      setShareError(errorObject.message)
    }
  }

  const toggleCriterion = (criterionKey: string) => {
    setExpandedCriteria(prev => ({
      ...prev,
      [criterionKey]: !prev[criterionKey]
    }))
  }

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
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Raport Audytu Promptu</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleCopyPrompt}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 active:scale-[0.98] transition-all cursor-pointer"
          >
            {isCopied ? (
              <>
                <svg className="h-4 w-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>Skopiowano prompt!</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                <span>Skopiuj ulepszony prompt</span>
              </>
            )}
          </button>
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

          <div className="mt-6 border-t border-slate-100 pt-4 flex flex-wrap gap-y-2 justify-between text-xs text-slate-500">
            <span>Typ audytu: <strong>Standard</strong></span>
            <span>Tryb: <strong>Automatyczny</strong></span>
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

        {/* Right Side: Criteria Breakdown with Expandable Details */}
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
              const isExpanded = !!expandedCriteria[item.criterion]
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
                <div key={item.criterion} className="py-3.5 first:pt-0 last:pb-0">
                  <button
                    onClick={() => toggleCriterion(item.criterion)}
                    className="flex w-full items-center justify-between gap-4 text-left hover:opacity-90 active:scale-[0.99] transition-all"
                  >
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
                          className={`h-full rounded-full ${barColor} transition-all duration-700`}
                          style={{ width: `${item.raw_score_0_10 * 10}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Expand/Collapse Chevron */}
                    <div className="shrink-0 p-1 text-slate-400">
                      <svg
                        className={`h-4.5 w-4.5 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-indigo-600' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Expandable Details Container */}
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      isExpanded ? 'grid-rows-[1fr] opacity-100 mt-3.5' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-2.5">
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
                </div>
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

          <button
            onClick={handleCopyPrompt}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-[0.97] border border-white/5 text-xs font-semibold text-white px-4 py-2 transition-all"
          >
            {isCopied ? (
              <>
                <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-emerald-400">Skopiowano!</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Kopiuj kod</span>
              </>
            )}
          </button>
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
          {/* Feedback Section */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Czy ten audyt był pomocny?</h3>
              <p className="mt-1 text-xs text-slate-500">Twój feedback pozwala nam stale ulepszać filtry inżynierii promptów.</p>
            </div>

            <div className="mt-6 space-y-3">
              {feedbackSubmitted ? (
                /* Confirmation state */
                <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-xs font-bold text-emerald-700">
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Dziękujemy za przesłanie opinii!</span>
                </div>
              ) : (
                <>
                  {/* Vote buttons — disabled after a vote is cast */}
                  <div className="flex gap-3" role="group" aria-label="Oceń audyt">
                    <button
                      id="feedback-btn-up"
                      onClick={() => handleFeedbackVote('up')}
                      disabled={feedbackLoading}
                      aria-pressed={feedbackVote === 'up'}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border py-3 text-xs font-semibold transition-all active:scale-95 disabled:opacity-60 ${
                        feedbackVote === 'up'
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-base">👍</span>
                      <span>Tak, bardzo</span>
                    </button>
                    <button
                      id="feedback-btn-down"
                      onClick={() => handleFeedbackVote('down')}
                      disabled={feedbackLoading}
                      aria-pressed={feedbackVote === 'down'}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border py-3 text-xs font-semibold transition-all active:scale-95 disabled:opacity-60 ${
                        feedbackVote === 'down'
                          ? 'border-rose-300 bg-rose-50 text-rose-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-base">👎</span>
                      <span>Nie, słaba jakość</span>
                    </button>
                  </div>

                  {/* Optional comment — shown after thumbs-down to let user elaborate */}
                  {feedbackVote === 'down' && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      <label htmlFor="feedback-comment" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Co poszło nie tak? (opcjonalne, maks. 500 znaków)
                      </label>
                      <textarea
                        id="feedback-comment"
                        value={feedbackComment}
                        onChange={e => setFeedbackComment(e.target.value)}
                        maxLength={500}
                        rows={3}
                        placeholder="Opisz co mogło być lepsze..."
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-700 placeholder-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none transition-colors"
                      />
                      <button
                        id="feedback-submit-btn"
                        onClick={handleSubmitFeedback}
                        disabled={feedbackLoading}
                        className="w-full rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 active:scale-[0.98] disabled:opacity-60 transition-all"
                      >
                        {feedbackLoading ? 'Wysyłanie...' : 'Wyślij opinię'}
                      </button>
                    </div>
                  )}

                  {/* Inline error */}
                  {feedbackError && (
                    <p className="text-xs font-medium text-rose-600">⚠️ {feedbackError}</p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Share Link Generation */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Udostępnij raport</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Stwórz publiczny link. Domyślnie wyłączone (prywatny). Każdy z linkiem zobaczy treść promptu i raport.
                </p>
              </div>
              
              {/* Toggle Switch */}
              <button
                onClick={handleToggleShare}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isShareEnabled ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isShareEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="mt-6">
              {shareError && (
                <p className="text-xs font-semibold text-red-600 mb-2">⚠️ {shareError}</p>
              )}

              {isShareEnabled && shareToken ? (
                <div className="space-y-2.5 animate-fadeIn">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 block">Publiczny adres URL:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="flex-1 min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-500 focus:outline-none"
                    />
                    <button
                      onClick={handleCopyShareLink}
                      className="shrink-0 rounded-2xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white px-4 py-2.5 transition-colors"
                    >
                      {isShareLinkCopied ? 'Skopiowano!' : 'Kopiuj'}
                    </button>
                  </div>
                  
                  {/* Public link safety warning block */}
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-3 text-[10px] leading-relaxed text-amber-900 flex gap-2">
                    <svg className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <strong className="block mb-0.5">Uwaga: Raport staje się publiczny!</strong>
                      Każdy, kto posiada ten adres URL, będzie mógł go wyświetlić. Prywatne tokeny sesji i dane techniczne są ukrywane, lecz zachowaj ostrożność.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center">
                  <span className="text-xs font-medium text-slate-400">
                    Włącz przełącznik, aby wygenerować link udostępniania.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        featureName={selectedFeature}
      />
    </div>
  )
}
