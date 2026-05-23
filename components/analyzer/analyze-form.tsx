'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { detectSensitiveData } from '@/lib/privacy/sensitive-data-detector'

const MIN_PROMPT_CHARS = 20
const MAX_PROMPT_CHARS = 4000
const WARN_PROMPT_CHARS = 3000

const loadingSteps = [
  'Uruchamianie preflighta bezpieczeństwa...',
  'Sprawdzanie limitów użytkowania...',
  'Inicjowanie modelu Gemini 3.5 Flash...',
  'Audytowanie struktury promptu (rola, kontekst, ograniczenia)...',
  'Generowanie ulepszonego promptu i wyjaśnień...'
]

export function AnalyzeForm() {
  const router = useRouter()
  const [inputPrompt, setInputPrompt] = useState('')
  const [workingLanguage, setWorkingLanguage] = useState<'pl' | 'en'>('pl')
  const [profileSlug, setProfileSlug] = useState('general-llm')
  
  // Optional Prompt Calibration Fields
  const [taskGoal, setTaskGoal] = useState('')
  const [taskType, setTaskType] = useState('')
  const [expectedOutputFormat, setExpectedOutputFormat] = useState('')
  const [constraints, setConstraints] = useState('')

  // Real Audit Loading States & Session Ownership Mappings
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Real-time Sensitive Data Scanner
  const detection = useMemo(() => detectSensitiveData(inputPrompt), [inputPrompt])
  
  const isTooShort = inputPrompt.trim().length < MIN_PROMPT_CHARS
  const isTooLong = inputPrompt.length > MAX_PROMPT_CHARS
  const isApproachingLimit = inputPrompt.length >= WARN_PROMPT_CHARS && inputPrompt.length <= MAX_PROMPT_CHARS
  const isBlocked = detection.riskLevel === 'high'

  // Animate mock audit loading checkpoints and redirect dynamically
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isSubmitting && !errorMessage) {
      interval = setInterval(() => {
        setCurrentStepIndex((prevIndex) => {
          if (prevIndex < loadingSteps.length - 1) {
            return prevIndex + 1
          } else {
            // Once mock stages complete, redirect immediately if server resolved the database ID
            if (createdId) {
              clearInterval(interval)
              setIsSubmitting(false)
              router.push(`/result/${createdId}`)
            }
            return prevIndex
          }
        })
      }, 750)
    }
    return () => clearInterval(interval)
  }, [isSubmitting, createdId, errorMessage, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isTooShort || isTooLong || isBlocked) return
    
    setErrorMessage(null)
    setCreatedId(null)
    setCurrentStepIndex(0)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input_prompt: inputPrompt,
          working_language: workingLanguage,
          selected_profile_slug: profileSlug,
          task_goal: taskGoal || undefined,
          task_type: taskType || undefined,
          expected_output_format: expectedOutputFormat || undefined,
          constraints: constraints || undefined
        })
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.message || errData.error || 'Wystąpił błąd serwera podczas analizy.')
      }

      const data = await response.json()
      if (!data.id) {
        throw new Error('Serwer nie zwrócił poprawnego identyfikatora wyniku.')
      }

      setCreatedId(data.id)
    } catch (err: any) {
      console.error(err)
      setErrorMessage(err.message || 'Wystąpił nieznany błąd podczas łączenia z serwerem.')
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Full-Screen Simulated AI Audit Progress Backdrop */}
      {isSubmitting && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md transition-all duration-300">
          <div className="relative flex flex-col items-center max-w-md px-6 text-center">
            {/* Spinning gradient ring */}
            <div className="relative flex h-20 w-20 items-center justify-center">
              <div className="absolute h-full w-full animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-500" />
              <svg className="h-8 w-8 text-indigo-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            
            <h3 className="mt-8 text-lg font-bold text-white tracking-tight">Trwa inżynieryjny audyt promptu...</h3>
            
            {/* Steps Progress Indicator */}
            <div className="mt-6 w-72 rounded-full bg-slate-800 p-1">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500" 
                style={{ width: `${((currentStepIndex + 1) / loadingSteps.length) * 100}%` }}
              />
            </div>
            
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Krok {currentStepIndex + 1} z {loadingSteps.length}
            </p>
            
            <p className="mt-2 text-sm text-slate-400 leading-relaxed min-h-[40px] animate-fade-in">
              {loadingSteps[currentStepIndex]}
            </p>
          </div>
        </div>
      )}

      {/* Main Analyzer Form */}
      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        
        {/* Upper Dashboard: Safety Warnings & Daily Quotas */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Privacy Disclaimer Card */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 text-xs leading-relaxed text-amber-900 flex gap-3">
            <svg className="h-5 w-5 shrink-0 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-6h.01M5.938 18h12.124c1.348 0 2.19-1.46 1.516-2.61L13.516 6.39c-.674-1.15-2.358-1.15-3.032 0L4.422 15.39c-.674 1.15.168 2.61 1.516 2.61z" />
            </svg>
            <div>
              <span className="font-bold block mb-0.5">Ochrona Prywatności</span>
              Przed analizą system automatycznie skanuje instrukcje w poszukiwaniu danych wrażliwe. Nigdy nie wklejaj haseł, kluczy ani tajemnic firmy.
            </div>
          </div>

          {/* Daily Limit Badge */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/20 p-4 text-xs leading-relaxed text-indigo-900 flex gap-3">
            <svg className="h-5 w-5 shrink-0 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <div>
              <span className="font-bold block mb-0.5">Dzienny limit bezpłatny</span>
              Wykorzystano dzisiaj: <strong className="text-indigo-700">0 / 5 analiz</strong>. Bezpłatne kwoty odnawiają się codziennie o północy.
            </div>
          </div>
        </div>

        {/* Mandatory Selections */}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-semibold text-slate-800">
            Język roboczy
            <select 
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 px-4 py-3 text-sm font-medium transition cursor-pointer" 
              value={workingLanguage} 
              onChange={(e) => setWorkingLanguage(e.target.value as 'pl' | 'en')}
            >
              <option value="pl">Polski (Wersja zlokalizowana)</option>
              <option value="en">English (Universal)</option>
            </select>
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-800">
            Profil kalibracyjny modelu
            <select 
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 px-4 py-3 text-sm font-medium transition cursor-pointer" 
              value={profileSlug} 
              onChange={(e) => setProfileSlug(e.target.value)}
            >
              <option value="general-llm">Balanced General LLM</option>
              <option value="google-gemini-3-5-flash">Google Gemini 3.5 Flash</option>
            </select>
          </label>
        </div>

        {/* Primary Prompt Input Textarea */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-800">Prompt do audytu (Wymagany)</label>
            <span className={`text-xs font-semibold ${isTooLong ? 'text-red-600' : isApproachingLimit ? 'text-amber-600' : 'text-slate-400'}`}>
              {inputPrompt.length} / {MAX_PROMPT_CHARS} znaków
            </span>
          </div>
          <textarea
            className={`min-h-[220px] w-full rounded-2xl border px-4 py-3.5 text-sm leading-relaxed transition-all focus:outline-none focus:ring-2 ${
              isTooLong ? 'border-red-300 focus:ring-red-100 bg-red-50/10' : 
              isApproachingLimit ? 'border-amber-300 focus:ring-amber-100 bg-amber-50/10' : 
              'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100 bg-slate-50/30'
            }`}
            placeholder="Wklej tutaj treść promptu, który chcesz przetestować i ulepszyć (minimum 20 znaków)..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
          />
        </div>

        {/* Real-time Sensitive Data Scans Result */}
        {detection.riskLevel !== 'none' && (
          <div className={`rounded-2xl border p-5 text-xs flex gap-3.5 transition-all shadow-sm ${
            detection.riskLevel === 'high' ? 'border-red-200 bg-red-50/50 text-red-950 animate-shake' :
            detection.riskLevel === 'medium' ? 'border-amber-200 bg-amber-50/50 text-amber-950' :
            'border-slate-200 bg-slate-50/60 text-slate-800'
          }`}>
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              detection.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
              detection.riskLevel === 'medium' ? 'bg-amber-100 text-amber-700' :
              'bg-slate-100 text-slate-600'
            }`}>
              {detection.riskLevel === 'high' ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-6h.01M5.938 18h12.124c1.348 0 2.19-1.46 1.516-2.61L13.516 6.39c-.674-1.15-2.358-1.15-3.032 0L4.422 15.39c-.674 1.15.168 2.61 1.516 2.61z" />
                </svg>
              ) : detection.riskLevel === 'medium' ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm leading-tight">
                {detection.riskLevel === 'high' ? 'Zablokowano: Wykryto dane krytyczne' :
                 detection.riskLevel === 'medium' ? 'Ostrzeżenie: Potencjalne dane poufne' :
                 'Informacja: Zidentyfikowano dane kontaktowe'}
              </p>
              <p className="mt-1 text-slate-600 leading-relaxed">
                {detection.riskLevel === 'high' ? 'Nasz skaner preflight zidentyfikował wzorce krytycznych sekretów. Aby odblokować audyt, usuń je ze swojego promptu:' :
                 detection.riskLevel === 'medium' ? 'Wykryliśmy wzorce o średnim poziomie ryzyka (np. hasła). Zalecamy upewnić się, że nie są to dane produkcyjne przed kontynuacją:' :
                 'Wykryliśmy podstawowe dane kontaktowe (np. adres e-mail). Narzędzie działa w 100% anonimowo, ale zalecamy ostrożność:'}
              </p>
              <ul className="mt-3.5 space-y-2.5">
                {detection.findings.map((finding, idx) => (
                  <li key={`${finding.type}-${idx}`} className="rounded-xl border border-white/50 bg-white/40 p-3 flex flex-col gap-1.5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                        finding.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                        finding.riskLevel === 'medium' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {finding.riskLevel === 'high' ? 'Krytyczne' : finding.riskLevel === 'medium' ? 'Ostrzeżenie' : 'Info'}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-700 break-all">{finding.redactedValue}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-normal font-medium">{finding.message}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Warning messages */}
        {isApproachingLimit && (
          <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5 animate-pulse">
            ⚠️ Zbliżasz się do maksymalnego limitu 4,000 znaków. Ogranicz tekst, aby zmieścił się w oknie analizy.
          </p>
        )}
        {isTooLong && (
          <p className="text-xs font-semibold text-red-700 flex items-center gap-1.5">
            ❌ Błąd: Twój prompt przekracza maksymalny dopuszczalny limit 4,000 znaków (obecnie {inputPrompt.length}).
          </p>
        )}

        {/* Divider for optional parameters */}
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-4 text-xs font-bold uppercase tracking-widest text-slate-400">
              Opcjonalne Uściślenia Celu (Rekomendowane)
            </span>
          </div>
        </div>

        {/* Optional Contextual Parameters Fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-semibold text-slate-800">
            Cel zadania (Goal)
            <input 
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/30 focus:border-indigo-500 focus:bg-white focus:outline-none px-4 py-3 text-sm transition"
              placeholder="np. Napisanie posta blogowego SEO"
              value={taskGoal} 
              onChange={(e) => setTaskGoal(e.target.value)} 
            />
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-800">
            Typ zadania (Task Type)
            <input 
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/30 focus:border-indigo-500 focus:bg-white focus:outline-none px-4 py-3 text-sm transition"
              placeholder="np. Kreatywne pisanie, Analiza danych, Kodowanie"
              value={taskType} 
              onChange={(e) => setTaskType(e.target.value)} 
            />
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-800">
            Oczekiwany format wyjściowy (Expected Format)
            <input 
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/30 focus:border-indigo-500 focus:bg-white focus:outline-none px-4 py-3 text-sm transition"
              placeholder="np. Tabela Markdown, Lista bulletpoints, Kod JSON"
              value={expectedOutputFormat} 
              onChange={(e) => setExpectedOutputFormat(e.target.value)} 
            />
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-800">
            Szczególne ograniczenia (Constraints)
            <input 
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/30 focus:border-indigo-500 focus:bg-white focus:outline-none px-4 py-3 text-sm transition"
              placeholder="np. Maksymalnie 300 słów, Ton profesjonalny"
              value={constraints} 
              onChange={(e) => setConstraints(e.target.value)} 
            />
          </label>
        </div>

        {/* Error Messages */}
        {errorMessage && (
          <p className="text-center text-xs font-semibold text-red-600 animate-pulse">
            ⚠️ {errorMessage}
          </p>
        )}

        {/* Submission Button */}
        <div className="pt-4">
          <button
            className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 text-sm active:scale-[0.99] disabled:scale-100 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 shadow-md shadow-indigo-50 hover:shadow-indigo-100 transition-all flex items-center justify-center gap-2"
            disabled={isTooShort || isTooLong || isBlocked}
            type="submit"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 00-2-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Przeprowadź audyt promptu
          </button>
        </div>

        {/* Validation Warnings Labels at Footer */}
        {isTooShort && (
          <p className="text-center text-xs font-medium text-slate-500">
            💡 Aby rozpocząć analizę, wpisz prompt o długości przynajmniej <strong className="text-slate-700">{MIN_PROMPT_CHARS} znaków</strong> (obecnie: {inputPrompt.length}).
          </p>
        )}
        {isBlocked && (
          <p className="text-center text-xs font-semibold text-red-600">
            ⚠️ Ostrzeżenie: Wykryto wrażliwe dane. Usuń klucze API lub poufne teksty, aby odblokować przycisk audytu.
          </p>
        )}
      </form>
    </>
  )
}
