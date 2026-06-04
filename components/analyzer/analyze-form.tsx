'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { detectSensitiveData } from '@/lib/privacy/sensitive-data-detector'
import { LoaderBackdrop } from './loader-backdrop'
import { MonthlyLimitBanner } from './monthly-limit-banner'
import { SensitiveDataAlert } from './sensitive-data-alert'
import { CalibrationFields } from './calibration-fields'

const MIN_PROMPT_CHARS = 20
const MAX_PROMPT_CHARS = 12000
const WARN_PROMPT_CHARS = 11000

const loadingStepsPl = [
  'Uruchamianie preflighta bezpieczeństwa...',
  'Sprawdzanie limitów użytkowania...',
  'Inicjowanie modelu analizującego...',
  'Audytowanie struktury promptu (rola, kontekst, ograniczenia)...',
  'Generowanie ulepszonego promptu i wyjaśnień...'
]

const loadingStepsEn = [
  'Launching safety preflight check...',
  'Checking usage quotas and limits...',
  'Initializing analyzing engine...',
  'Auditing prompt structures (role, context, constraints)...',
  'Generating improved prompt and explanations...'
]

export function AnalyzeForm() {
  const router = useRouter()
  const [inputPrompt, setInputPrompt] = useState('')
  const [workingLanguage, setWorkingLanguage] = useState<'pl' | 'en'>('pl')
  const [profileSlug, setProfileSlug] = useState('general-llm')
  const [auditMode, setAuditMode] = useState('universal')
  
  // Optional Prompt Calibration Fields
  const [taskGoal, setTaskGoal] = useState('')
  const [taskType, setTaskType] = useState('')
  const [expectedOutputFormat, setExpectedOutputFormat] = useState('')
  const [constraints, setConstraints] = useState('')
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)

  // Real Audit Loading States & Session Ownership Mappings
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isMonthlyLimitReached, setIsMonthlyLimitReached] = useState(false)
  const [monthlyLimitFromApi, setMonthlyLimitFromApi] = useState<number | null>(null)

  // Real-time Sensitive Data Scanner
  const detection = useMemo(() => detectSensitiveData(inputPrompt), [inputPrompt])
  
  const isTooShort = inputPrompt.trim().length < MIN_PROMPT_CHARS
  const isTooLong = inputPrompt.length > MAX_PROMPT_CHARS
  const isApproachingLimit = inputPrompt.length >= WARN_PROMPT_CHARS && inputPrompt.length <= MAX_PROMPT_CHARS
  const isBlocked = detection.riskLevel === 'high'

  const loadingSteps = workingLanguage === 'pl' ? loadingStepsPl : loadingStepsEn

  // Animate mock audit loading checkpoints and redirect dynamically
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isSubmitting && !errorMessage) {
      if (createdId && currentStepIndex >= loadingSteps.length - 1) {
        const timer = setTimeout(() => {
          setIsSubmitting(false)
          router.push(`/result/${createdId}`)
        }, 0)
        return () => clearTimeout(timer)
      }

      interval = setInterval(() => {
        if (currentStepIndex < loadingSteps.length - 1) {
          if (createdId) {
            setCurrentStepIndex(loadingSteps.length - 1)
          } else {
            setCurrentStepIndex((prev) => prev + 1)
          }
        } else {
          if (createdId) {
            clearInterval(interval)
            setIsSubmitting(false)
            router.push(`/result/${createdId}`)
          }
        }
      }, 750)
    }
    return () => clearInterval(interval)
  }, [isSubmitting, createdId, currentStepIndex, errorMessage, router, loadingSteps.length])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isTooShort || isTooLong || isBlocked) return
    
    setErrorMessage(null)
    setIsMonthlyLimitReached(false)
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
          audit_mode: auditMode,
          task_goal: taskGoal || undefined,
          task_type: taskType || undefined,
          expected_output_format: expectedOutputFormat || undefined,
          constraints: constraints || undefined
        })
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        const errorSlug = errData.error || 'internal_error'
        
        if (errorSlug === 'monthly_limit_reached') {
          setMonthlyLimitFromApi(typeof errData.limit === 'number' ? errData.limit : null)
          setIsMonthlyLimitReached(true)
          setIsSubmitting(false)
          return
        }
        
        let msg = ''
        if (workingLanguage === 'pl') {
          switch (errorSlug) {
            case 'invalid_input':
              msg = 'Nieprawidłowe dane wejściowe. Upewnij się, że Twój prompt ma co najmniej 20 znaków.'
              break
            case 'prompt_too_long':
              msg = `Wprowadzony prompt jest za długi. Maksymalna długość to ${MAX_PROMPT_CHARS} znaków.`
              break
            case 'high_risk_sensitive_data_detected':
              msg = 'Analiza zablokowana. Wykryto poufne dane wysokiego ryzyka (np. klucze API lub hasła). Usuń je przed ponowną próbą.'
              break
            case 'limit_reached':
              msg = 'Osiągnięto dzienny limit analiz dla użytkownika anonimowego. Spróbuj ponownie jutro.'
              break
            case 'model_profile_unavailable':
              msg = 'Wybrany profil kalibracyjny modelu jest obecnie niedostępny.'
              break
            case 'provider_unavailable':
              msg = 'Usługa analizy AI jest tymczasowo przeciążona lub niedostępna. Spróbuj ponownie za chwilę.'
              break
            case 'provider_error':
              msg = 'Wystąpił błąd komunikacji z silnikiem analizy AI. Spróbuj ponownie.'
              break
            default:
              msg = errData.message || 'Wystąpił nieoczekiwany błąd serwera. Spróbuj ponownie później.'
          }
        } else {
          switch (errorSlug) {
            case 'invalid_input':
              msg = 'Invalid input parameters. Please ensure your prompt is at least 20 characters.'
              break
            case 'prompt_too_long':
              msg = `The input prompt is too long. The maximum length is ${MAX_PROMPT_CHARS} characters.`
              break
            case 'high_risk_sensitive_data_detected':
              msg = 'Analysis blocked. High-risk sensitive credentials (e.g. API keys or passwords) were detected. Please remove them.'
              break
            case 'limit_reached':
              msg = 'Daily anonymous analysis limit reached. Please try again tomorrow.'
              break
            case 'model_profile_unavailable':
              msg = 'The selected model calibration profile is temporarily unavailable.'
              break
            case 'provider_unavailable':
              msg = 'The AI analysis service is currently overloaded or down. Please try again shortly.'
              break
            case 'provider_error':
              msg = 'An error occurred while communicating with the AI analysis engine. Please try again.'
              break
            default:
              msg = errData.message || 'An unexpected internal server error occurred. Please try again later.'
          }
        }
        throw new Error(msg)
      }

      const data = await response.json()
      if (!data.id) {
        throw new Error(
          workingLanguage === 'pl' 
            ? 'Serwer nie zwrócił poprawnego identyfikatora wyniku.' 
            : 'Server did not return a valid result identifier.'
        )
      }

      setCreatedId(data.id)
    } catch (err: unknown) {
      const errorObject = err instanceof Error ? err : new Error(String(err))
      console.error(errorObject)
      setErrorMessage(errorObject.message || (workingLanguage === 'pl' ? 'Wystąpił nieznany błąd podczas łączenia z serwerem.' : 'An unknown error occurred while connecting to the server.'))
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <LoaderBackdrop
        isSubmitting={isSubmitting}
        workingLanguage={workingLanguage}
        currentStepIndex={currentStepIndex}
        loadingSteps={loadingSteps}
      />

      {/* Main Analyzer Form */}
      <form onSubmit={handleSubmit} className="space-y-8 rounded-3xl border border-slate-200/60 bg-white p-6 sm:p-10 shadow-xl shadow-slate-100/40 glow-purple">
        
        <MonthlyLimitBanner
          isMonthlyLimitReached={isMonthlyLimitReached}
          setIsMonthlyLimitReached={setIsMonthlyLimitReached}
          monthlyLimitFromApi={monthlyLimitFromApi}
          workingLanguage={workingLanguage}
        />

        {/* Upper Dashboard: Safety Warnings & Daily Quotas */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Privacy Disclaimer Card */}
          <div className="rounded-2xl border border-amber-200/70 bg-amber-50/20 p-4 text-xs leading-relaxed text-amber-900 flex gap-3 shadow-sm">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m0-6h.01M5.938 18h12.124c1.348 0 2.19-1.46 1.516-2.61L13.516 6.39c-.674-1.15-2.358-1.15-3.032 0L4.422 15.39c-.674 1.15.168 2.61 1.516 2.61z" />
              </svg>
            </div>
            <div>
              <span className="font-bold block mb-0.5 text-amber-950">
                {workingLanguage === 'pl' ? 'Ochrona Prywatności' : 'Privacy Protection'}
              </span>
              {workingLanguage === 'pl' 
                ? 'Przed analizą system automatycznie skanuje instrukcje w poszukiwaniu danych wrażliwych. Nigdy nie wklejaj haseł ani kluczy prywatnych.'
                : 'Before analysis, the system automatically scans prompts for sensitive details. Never paste passwords or private credentials.'}
            </div>
          </div>

          {/* Daily Limit Badge */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/20 p-4 text-xs leading-relaxed text-indigo-900 flex gap-3 shadow-sm">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <span className="font-bold block mb-0.5 text-indigo-950">
                {workingLanguage === 'pl' ? 'Dzienny Limit Analiz' : 'Daily Analysis Limit'}
              </span>
              {workingLanguage === 'pl' 
                ? 'Każdy użytkownik anonimowy otrzymuje bezpłatny dzienny limit. Pula odnawia się o północy UTC.' 
                : 'Every anonymous user receives a free daily limit. Quotas reset daily at midnight UTC.'}
            </div>
          </div>
        </div>

        {/* Mandatory Selections */}
        <div className="grid gap-6 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-semibold text-slate-800">
            {workingLanguage === 'pl' ? 'Język roboczy' : 'Working language'}
            <select 
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/40 hover:bg-slate-50 px-4 py-3.5 text-sm font-medium transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white shadow-sm" 
              value={workingLanguage} 
              onChange={(e) => setWorkingLanguage(e.target.value as 'pl' | 'en')}
            >
              <option value="pl">Polski (Wersja zlokalizowana)</option>
              <option value="en">English (Universal)</option>
            </select>
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-800">
            <span className="block">
              {workingLanguage === 'pl' ? 'Tryb audytu' : 'Audit mode'}
            </span>
            <select 
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/40 hover:bg-slate-50 px-4 py-3.5 text-sm font-medium transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white shadow-sm" 
              value={auditMode} 
              onChange={(e) => setAuditMode(e.target.value)}
            >
              <option value="universal">{workingLanguage === 'pl' ? 'Uniwersalny' : 'Universal'}</option>
              <option value="seo_content">{workingLanguage === 'pl' ? 'SEO / content' : 'SEO / content'}</option>
              <option value="coding">{workingLanguage === 'pl' ? 'Kodowanie' : 'Coding'}</option>
              <option value="data_analysis">{workingLanguage === 'pl' ? 'Analiza danych' : 'Data analysis'}</option>
              <option value="research">{workingLanguage === 'pl' ? 'Research' : 'Research'}</option>
              <option value="marketing_sales">{workingLanguage === 'pl' ? 'Marketing / sprzedaż' : 'Marketing / sales'}</option>
              <option value="agent_workflow">{workingLanguage === 'pl' ? 'Agent / workflow' : 'Agent / workflow'}</option>
            </select>
          </label>
        </div>

        {/* Primary Prompt Input Textarea */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-800">
              {workingLanguage === 'pl' ? 'Prompt do audytu (Wymagany)' : 'Prompt to audit (Required)'}
            </label>
            <span className={`text-xs font-semibold ${isTooLong ? 'text-red-600' : isApproachingLimit ? 'text-amber-600' : 'text-slate-400'}`}>
              {inputPrompt.length.toLocaleString()} / {MAX_PROMPT_CHARS.toLocaleString()} {workingLanguage === 'pl' ? 'znaków' : 'characters'}
            </span>
          </div>
          <textarea
            className={`min-h-[240px] w-full rounded-2xl border px-4 py-4 text-sm leading-relaxed transition-all focus:outline-none focus:ring-2 shadow-sm ${
              isTooLong ? 'border-red-300 focus:ring-red-100 bg-red-50/10' : 
              isApproachingLimit ? 'border-amber-300 focus:ring-amber-100 bg-amber-50/10' : 
              'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100 bg-slate-50/20 focus:bg-white'
            }`}
            placeholder={workingLanguage === 'pl' 
              ? 'Wklej tutaj treść promptu, który chcesz przetestować i ulepszyć (minimum 20 znaków)...' 
              : 'Paste the content of the prompt you want to test and improve here (minimum 20 characters)...'}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
          />
        </div>

        <SensitiveDataAlert
          detection={detection}
          workingLanguage={workingLanguage}
        />

        {/* Warning messages */}
        {isApproachingLimit && (
          <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5 animate-pulse">
            ⚠️ {workingLanguage === 'pl' 
              ? `Zbliżasz się do maksymalnego limitu ${MAX_PROMPT_CHARS.toLocaleString()} znaków. Ogranicz tekst.`
              : `You are approaching the limit of ${MAX_PROMPT_CHARS.toLocaleString()} characters. Please trim the text.`}
          </p>
        )}
        {isTooLong && (
          <p className="text-xs font-semibold text-red-700 flex items-center gap-1.5">
            ❌ {workingLanguage === 'pl'
              ? `Błąd: Twój prompt przekracza maksymalny dopuszczalny limit ${MAX_PROMPT_CHARS.toLocaleString()} znaków (obecnie ${inputPrompt.length.toLocaleString()}).`
              : `Error: Your prompt exceeds the maximum allowed limit of ${MAX_PROMPT_CHARS.toLocaleString()} characters (currently ${inputPrompt.length.toLocaleString()}).`}
          </p>
        )}

        {/* Expandable Advanced Options Panel */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/40 hover:bg-slate-50 px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest transition shadow-sm"
          >
            <span>{workingLanguage === 'pl' ? 'Opcjonalna kalibracja i model docelowy' : 'Optional calibration & target model'}</span>
            <svg
              className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isAdvancedOpen ? 'rotate-180 text-indigo-600' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isAdvancedOpen && (
            <div className="space-y-6 pt-4 border-t border-slate-100 animate-in fade-in duration-200">
              <CalibrationFields
                taskGoal={taskGoal}
                setTaskGoal={setTaskGoal}
                taskType={taskType}
                setTaskType={setTaskType}
                expectedOutputFormat={expectedOutputFormat}
                setExpectedOutputFormat={setExpectedOutputFormat}
                constraints={constraints}
                setConstraints={setConstraints}
                workingLanguage={workingLanguage}
              />

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-slate-200/70" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                    {workingLanguage === 'pl' ? 'Ustawienia zaawansowane' : 'Advanced Settings'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <label className="space-y-2 text-sm font-semibold text-slate-800 block">
                  <span className="block">
                    {workingLanguage === 'pl' ? 'Docelowy model AI' : 'Target AI model'}
                  </span>
                  <select
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/40 hover:bg-slate-50 px-4 py-3.5 text-sm font-medium transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white shadow-sm block"
                    value={profileSlug}
                    onChange={(e) => setProfileSlug(e.target.value)}
                  >
                    <option value="general-llm">
                      {workingLanguage === 'pl' ? 'Uniwersalny model AI' : 'Universal AI model'}
                    </option>
                    <option value="openrouter-deepseek-v4-flash">
                      {workingLanguage === 'pl' ? 'Zaawansowany model AI' : 'Advanced AI model'}
                    </option>
                  </select>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Mapped Localized Error Banners */}
        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800 flex gap-3 shadow-sm items-center animate-pulse">
            <svg className="h-5 w-5 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <span className="font-bold block mb-0.5">{workingLanguage === 'pl' ? 'Wystąpił Błąd' : 'An Error Occurred'}</span>
              {errorMessage}
            </div>
          </div>
        )}

        {/* Submission Button */}
        <div className="pt-4">
          <button
            className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 text-sm active:scale-[0.99] disabled:scale-100 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 shadow-md shadow-indigo-100 hover:shadow-indigo-200 active:shadow-sm transition-all flex items-center justify-center gap-2"
            disabled={isTooShort || isTooLong || isBlocked}
            type="submit"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 00-2-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {workingLanguage === 'pl' ? 'Przeprowadź audyt promptu' : 'Conduct prompt audit'}
          </button>
        </div>

        {/* Validation Warnings Labels at Footer */}
        {isTooShort && (
          <p className="text-center text-xs font-medium text-slate-500">
            💡 {workingLanguage === 'pl' 
              ? `Aby rozpocząć analizę, wpisz prompt o długości przynajmniej ` 
              : `To start the analysis, enter a prompt of at least `}
            <strong className="text-slate-700">{MIN_PROMPT_CHARS} {workingLanguage === 'pl' ? 'znaków' : 'characters'}</strong> 
            {workingLanguage === 'pl' ? ` (obecnie: ${inputPrompt.length}).` : ` (currently: ${inputPrompt.length}).`}
          </p>
        )}
        {isBlocked && (
          <p className="text-center text-xs font-semibold text-red-600 animate-pulse">
            ⚠️ {workingLanguage === 'pl' 
              ? 'Ostrzeżenie: Wykryto wrażliwe dane. Usuń klucze API lub poufne teksty, aby odblokować przycisk audytu.'
              : 'Warning: Sensitive data detected. Remove API keys or credentials to unlock the audit button.'}
          </p>
        )}
      </form>
    </>
  )
}
