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
  const detection = useMemo(() => {
    const combined = [inputPrompt, taskGoal, taskType, expectedOutputFormat, constraints]
      .filter(Boolean)
      .join('\n')
    return detectSensitiveData(combined)
  }, [inputPrompt, taskGoal, taskType, expectedOutputFormat, constraints])
  
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
      <form onSubmit={handleSubmit} className="space-y-7 rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6 sm:p-8">
        
        <MonthlyLimitBanner
          isMonthlyLimitReached={isMonthlyLimitReached}
          setIsMonthlyLimitReached={setIsMonthlyLimitReached}
          monthlyLimitFromApi={monthlyLimitFromApi}
          workingLanguage={workingLanguage}
        />

        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-lg border border-[#2A2A3A] bg-[#1C1C27] px-4 py-2.5 text-xs text-[#8290A2]">
          <span className="flex items-center gap-1.5 text-[#94A3B8]">
            <svg className="h-3.5 w-3.5 text-[#F97316] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5.938 18h12.124c1.348 0 2.19-1.46 1.516-2.61L13.516 6.39c-.674-1.15-2.358-1.15-3.032 0L4.422 15.39c-.674 1.15.168 2.61 1.516 2.61z" />
            </svg>
            {workingLanguage === 'pl' ? 'Nie wklejaj kluczy API ani haseł.' : 'Do not paste API keys or passwords.'}
          </span>
          <span className="hidden sm:inline text-[#2A2A3A]">·</span>
          <span>{workingLanguage === 'pl' ? 'Limit dzienny odnawia się o północy UTC.' : 'Daily limit resets at midnight UTC.'}</span>
        </div>

        {/* Mandatory Selections */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="working-language-select" className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] block">
              {workingLanguage === 'pl' ? 'Język roboczy' : 'Working language'}
            </label>
            <select 
              id="working-language-select"
              className="select-dark w-full rounded-lg px-4 py-3 text-sm font-medium transition cursor-pointer" 
              value={workingLanguage} 
              onChange={(e) => setWorkingLanguage(e.target.value as 'pl' | 'en')}
            >
              <option value="pl">Polski (Wersja zlokalizowana)</option>
              <option value="en">English (Universal)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="audit-mode-select" className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] block">
              {workingLanguage === 'pl' ? 'Tryb audytu' : 'Audit mode'}
            </label>
            <select 
              id="audit-mode-select"
              className="select-dark w-full rounded-lg px-4 py-3 text-sm font-medium transition cursor-pointer" 
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
          </div>
        </div>

        {/* Primary Prompt Input Textarea */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label htmlFor="prompt-textarea" className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] block">
              {workingLanguage === 'pl' ? 'Prompt do audytu (Wymagany)' : 'Prompt to audit (Required)'}
            </label>
            <span className={`text-xs font-mono font-medium ${isTooLong ? 'text-[#F87171]' : isApproachingLimit ? 'text-[#F97316]' : 'text-[#8290A2]'}`}>
              {inputPrompt.length.toLocaleString()} / {MAX_PROMPT_CHARS.toLocaleString()} {workingLanguage === 'pl' ? 'znaków' : 'characters'}
            </span>
          </div>
          <textarea
            id="prompt-textarea"
            className={`prompt-textarea min-h-[220px] w-full rounded-lg px-4 py-3.5 resize-y transition-all ${isTooLong ? 'border-[#F87171]/60' : isApproachingLimit ? 'border-[#F97316]/50' : ''}`}
            placeholder={workingLanguage === 'pl' 
              ? 'Wklej tutaj treść promptu, który chcesz przetestować i ulepszyć (minimum 20 znaków)...' 
              : 'Paste the content of the prompt you want to test and improve here (minimum 20 characters)...'}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            aria-describedby={[
              isApproachingLimit ? 'warn-approaching-limit' : '',
              isTooLong ? 'error-too-long' : '',
              isBlocked ? 'warn-blocked' : '',
              errorMessage ? 'api-error' : '',
              isTooShort ? 'char-min-warn' : ''
            ].filter(Boolean).join(' ') || undefined}
          />
        </div>

        <SensitiveDataAlert
          detection={detection}
          workingLanguage={workingLanguage}
        />

        {/* Warning messages */}
        {isApproachingLimit && (
          <p id="warn-approaching-limit" role="status" aria-live="polite" className="text-xs font-semibold text-amber-700 flex items-center gap-1.5 animate-pulse">
            ⚠️ {workingLanguage === 'pl' 
              ? `Zbliżasz się do maksymalnego limitu ${MAX_PROMPT_CHARS.toLocaleString()} znaków. Ogranicz tekst.`
              : `You are approaching the limit of ${MAX_PROMPT_CHARS.toLocaleString()} characters. Please trim the text.`}
          </p>
        )}
        {isTooLong && (
          <p id="error-too-long" role="alert" className="text-xs font-semibold text-red-700 flex items-center gap-1.5">
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
            aria-expanded={isAdvancedOpen}
            aria-controls="advanced-calibration-panel"
            className="flex w-full items-center justify-between rounded-lg border border-[#2A2A3A] bg-[#1C1C27] hover:bg-[#1C1C27]/80 hover:border-[#3A3A52] px-5 py-3.5 text-xs font-bold text-[#94A3B8] uppercase tracking-widest transition"
          >
            <span>{workingLanguage === 'pl' ? 'Opcjonalna kalibracja i model docelowy' : 'Optional calibration & target model'}</span>
            <svg
              className={`h-4 w-4 transition-transform duration-300 ${isAdvancedOpen ? 'rotate-180 text-[#A78BFA]' : 'text-[#8290A2]'}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isAdvancedOpen && (
            <div id="advanced-calibration-panel" className="space-y-6 pt-4 border-t border-[#2A2A3A] animate-in fade-in duration-200">
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
                  <div className="w-full border-t border-[#2A2A3A]" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[#13131A] px-4 text-xs font-bold uppercase tracking-widest text-[#8290A2]">
                    {workingLanguage === 'pl' ? 'Ustawienia zaawansowane' : 'Advanced Settings'}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="target-ai-model-select" className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] block">
                  {workingLanguage === 'pl' ? 'Docelowy model AI' : 'Target AI model'}
                </label>
                <select
                  id="target-ai-model-select"
                  className="select-dark w-full rounded-lg px-4 py-3 text-sm font-medium transition cursor-pointer"
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
              </div>
            </div>
          )}
        </div>

        {/* Mapped Localized Error Banners */}
        {errorMessage && (
          <div id="api-error" role="alert" className="rounded-lg border border-[#F87171]/30 bg-[#F87171]/8 p-4 text-xs font-semibold text-[#F87171] flex gap-3 items-center">
            <svg className="h-5 w-5 shrink-0 text-[#F87171]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            className="w-full rounded-lg gradient-btn text-white font-semibold py-4 text-sm disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none transition-all flex items-center justify-center gap-2"
            disabled={isTooShort || isTooLong || isBlocked || isSubmitting}
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
          <p id="char-min-warn" className="text-center text-xs font-mono text-[#8290A2]">
            💡 {workingLanguage === 'pl' 
              ? `Aby rozpocząć analizę, wpisz prompt o długości przynajmniej ` 
              : `To start the analysis, enter a prompt of at least `}
            <strong className="text-[#94A3B8] font-bold">{MIN_PROMPT_CHARS} {workingLanguage === 'pl' ? 'znaków' : 'characters'}</strong> 
            {workingLanguage === 'pl' ? ` (obecnie: ${inputPrompt.length}).` : ` (currently: ${inputPrompt.length}).`}
          </p>
        )}
        {isBlocked && (
          <p id="warn-blocked" role="alert" className="text-center text-xs font-semibold text-[#F87171] animate-pulse">
            ⚠️ {workingLanguage === 'pl' 
              ? 'Ostrzeżenie: Wykryto wrażliwe dane. Usuń klucze API lub poufne teksty, aby odblokować przycisk audytu.'
              : 'Warning: Sensitive data detected. Remove API keys or credentials to unlock the audit button.'}
          </p>
        )}
      </form>
    </>
  )
}
