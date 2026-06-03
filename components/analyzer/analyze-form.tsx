'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { detectSensitiveData } from '@/lib/privacy/sensitive-data-detector'

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
      // If server ID is ready and we are at the final step, complete instantly
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
    // Local preflight safety check - do not submit if blocked, too short, or too long
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
            
            <h3 className="mt-8 text-lg font-bold text-white tracking-tight">
              {workingLanguage === 'pl' ? 'Trwa inżynieryjny audyt promptu...' : 'Conducting prompt engineering audit...'}
            </h3>
            
            {/* Steps Progress Indicator */}
            <div className="mt-6 w-72 rounded-full bg-slate-800 p-1">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500" 
                style={{ width: `${((currentStepIndex + 1) / loadingSteps.length) * 100}%` }}
              />
            </div>
            
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-indigo-400">
              {workingLanguage === 'pl' ? `Krok ${currentStepIndex + 1} z ${loadingSteps.length}` : `Step ${currentStepIndex + 1} of ${loadingSteps.length}`}
            </p>
            
            <p className="mt-2 text-sm text-slate-400 leading-relaxed min-h-[40px] animate-fade-in">
              {loadingSteps[currentStepIndex]}
            </p>
          </div>
        </div>
      )}

      {/* Main Analyzer Form */}
      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 shadow-sm">
        
        {/* Monthly Limit Reached Inline Upgrade CTA Card */}
        {isMonthlyLimitReached && (
          <div className="relative rounded-2xl border-2 border-indigo-500 bg-gradient-to-br from-slate-900 to-indigo-950/90 p-6 text-white shadow-lg shadow-indigo-500/10 animate-in fade-in slide-in-from-top-4 duration-300">
            {/* Dismiss Button */}
            <button
              type="button"
              onClick={() => setIsMonthlyLimitReached(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white transition p-1 cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 shadow-md shadow-indigo-500/20 text-white">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="space-y-1.5 pr-6">
                <h4 className="text-sm font-extrabold tracking-tight">
                  {workingLanguage === 'pl' ? 'Osiągnięto miesięczny limit analiz' : 'Monthly Analysis Limit Reached'}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {workingLanguage === 'pl'
                    ? `Wykorzstałeś miesięczny limit analiz (${monthlyLimitFromApi ?? '—'}/miesiąc) na Twoim planie. Przejdź na Pro, aby uzyskać do 500 analiz miesięcznie, eksport PDF/Markdown, wyższy limit znaków (24 000) i zbiorczy audyt. Zakup Pro jest niedostępny w becie — dostępny wkrótce po uruchomieniu Stripe.`
                    : `You have reached the monthly analysis limit (${monthlyLimitFromApi ?? '—'}/month) for your plan. Upgrade to Pro for 500 monthly analyses, PDF/Markdown exports, higher character limits (24k), and batch audits. Pro purchase is unavailable in beta — available soon after Stripe activation.`}
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    {workingLanguage === 'pl' ? 'Zobacz cennik i ulepsz plan' : 'View Pricing & Upgrade'}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsMonthlyLimitReached(false)}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition active:scale-95 cursor-pointer"
                  >
                    {workingLanguage === 'pl' ? 'Wróć do audytu' : 'Dismiss'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upper Dashboard: Safety Warnings & Daily Quotas */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Privacy Disclaimer Card */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 text-xs leading-relaxed text-amber-900 flex gap-3">
            <svg className="h-5 w-5 shrink-0 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-6h.01M5.938 18h12.124c1.348 0 2.19-1.46 1.516-2.61L13.516 6.39c-.674-1.15-2.358-1.15-3.032 0L4.422 15.39c-.674 1.15.168 2.61 1.516 2.61z" />
            </svg>
            <div>
              <span className="font-bold block mb-0.5">
                {workingLanguage === 'pl' ? 'Ochrona Prywatności' : 'Privacy Protection'}
              </span>
              {workingLanguage === 'pl' 
                ? 'Przed analizą system automatycznie skanuje instrukcje w poszukiwaniu danych wrażliwych. Nigdy nie wklejaj haseł ani kluczy prywatnych.'
                : 'Before analysis, the system automatically scans prompts for sensitive details. Never paste passwords or private credentials.'}
            </div>
          </div>

          {/* Daily Limit Badge */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/20 p-4 text-xs leading-relaxed text-indigo-900 flex gap-3">
            <svg className="h-5 w-5 shrink-0 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <div>
              <span className="font-bold block mb-0.5">
                {workingLanguage === 'pl' ? 'Dzienny Limit Analiz' : 'Daily Analysis Limit'}
              </span>
              {workingLanguage === 'pl' 
                ? 'Każdy użytkownik anonimowy otrzymuje bezpłatny dzienny limit. Pula odnawia się o północy UTC.' 
                : 'Every anonymous user receives a free daily limit. Quotas reset daily at midnight UTC.'}
            </div>
          </div>
        </div>

        {/* Mandatory Selections */}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-semibold text-slate-800">
            {workingLanguage === 'pl' ? 'Język roboczy' : 'Working language'}
            <select 
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 px-4 py-3 text-sm font-medium transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-100" 
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
            <span className="block text-xs font-normal text-slate-500 leading-normal">
              {workingLanguage === 'pl'
                ? 'Wybierz, do jakiego rodzaju zadania ma zostać oceniony prompt.'
                : 'Choose the type of task the prompt should be evaluated for.'}
            </span>
            <select 
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 px-4 py-3 text-sm font-medium transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-100" 
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
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-800">
              {workingLanguage === 'pl' ? 'Prompt do audytu (Wymagany)' : 'Prompt to audit (Required)'}
            </label>
            <span className={`text-xs font-semibold ${isTooLong ? 'text-red-600' : isApproachingLimit ? 'text-amber-600' : 'text-slate-400'}`}>
              {inputPrompt.length.toLocaleString()} / {MAX_PROMPT_CHARS.toLocaleString()} {workingLanguage === 'pl' ? 'znaków' : 'characters'}
            </span>
          </div>
          <textarea
            className={`min-h-[220px] w-full rounded-2xl border px-4 py-3.5 text-sm leading-relaxed transition-all focus:outline-none focus:ring-2 ${
              isTooLong ? 'border-red-300 focus:ring-red-100 bg-red-50/10' : 
              isApproachingLimit ? 'border-amber-300 focus:ring-amber-100 bg-amber-50/10' : 
              'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100 bg-slate-50/30'
            }`}
            placeholder={workingLanguage === 'pl' 
              ? 'Wklej tutaj treść promptu, który chcesz przetestować i ulepszyć (minimum 20 znaków)...' 
              : 'Paste the content of the prompt you want to test and improve here (minimum 20 characters)...'}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
          />
        </div>

        {/* Real-time Sensitive Data Scans Result */}
        {detection.riskLevel !== 'none' && (
          <div className={`rounded-2xl border p-4 sm:p-5 text-xs flex gap-3.5 transition-all shadow-sm ${
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
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm leading-tight">
                {detection.riskLevel === 'high' 
                  ? (workingLanguage === 'pl' ? 'Zablokowano: Wykryto dane krytyczne' : 'Blocked: High-Risk Credentials Detected') :
                 detection.riskLevel === 'medium' 
                  ? (workingLanguage === 'pl' ? 'Ostrzeżenie: Potencjalne dane poufne' : 'Warning: Potential Secrets Found') :
                 (workingLanguage === 'pl' ? 'Informacja: Zidentyfikowano dane kontaktowe' : 'Notice: Contact Identifiers Identified')}
              </p>
              <p className="mt-1 text-slate-600 leading-relaxed break-words">
                {detection.riskLevel === 'high' 
                  ? (workingLanguage === 'pl' ? 'Nasz skaner preflight zidentyfikował wzorce krytycznych sekretów. Aby odblokować audyt, usuń je ze swojego promptu:' : 'Our safety preflight scan identified high-risk secret patterns. To unlock the audit button, please remove them from your prompt:') :
                 detection.riskLevel === 'medium' 
                  ? (workingLanguage === 'pl' ? 'Wykryliśmy wzorce o średnim poziomie ryzyka (np. hasła). Zalecamy upewnić się, że nie są to dane produkcyjne przed kontynuacją:' : 'We detected medium-risk parameters (e.g. passwords). We highly recommend verifying these are non-production placeholders:') :
                 (workingLanguage === 'pl' ? 'Wykryliśmy podstawowe dane kontaktowe (np. adres e-mail). Narzędzie działa w 100% anonimowo, ale zalecamy ostrożność:' : 'We detected common contact details (e.g. email). Although this tool is 100% anonymous, please stay cautious:')}
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
                        {finding.riskLevel === 'high' ? (workingLanguage === 'pl' ? 'Krytyczne' : 'Critical') : finding.riskLevel === 'medium' ? (workingLanguage === 'pl' ? 'Ostrzeżenie' : 'Warning') : 'Info'}
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

        {/* Divider for optional parameters */}
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-4 text-xs font-bold uppercase tracking-widest text-slate-400">
              {workingLanguage === 'pl' ? 'Opcjonalne Uściślenia Celu (Rekomendowane)' : 'Optional Task Calibration (Recommended)'}
            </span>
          </div>
        </div>

        {/* Optional Contextual Parameters Fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-semibold text-slate-800">
            {workingLanguage === 'pl' ? 'Cel zadania (Goal)' : 'Task goal (Goal)'}
            <input 
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/30 focus:border-indigo-500 focus:bg-white focus:outline-none px-4 py-3 text-sm transition"
              placeholder={workingLanguage === 'pl' ? 'np. Napisanie posta blogowego SEO' : 'e.g. Writing an SEO blog post'}
              value={taskGoal} 
              onChange={(e) => setTaskGoal(e.target.value)} 
            />
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-800">
            {workingLanguage === 'pl' ? 'Typ zadania (Task Type)' : 'Task type (Task Type)'}
            <input 
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/30 focus:border-indigo-500 focus:bg-white focus:outline-none px-4 py-3 text-sm transition"
              placeholder={workingLanguage === 'pl' ? 'np. Kreatywne pisanie, Analiza danych, Kodowanie' : 'e.g. Creative writing, Data analysis, Coding'}
              value={taskType} 
              onChange={(e) => setTaskType(e.target.value)} 
            />
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-800">
            {workingLanguage === 'pl' ? 'Oczekiwany format wyjściowy (Expected Format)' : 'Expected output format (Expected Format)'}
            <input 
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/30 focus:border-indigo-500 focus:bg-white focus:outline-none px-4 py-3 text-sm transition"
              placeholder={workingLanguage === 'pl' ? 'np. Tabela Markdown, Lista bulletpoints, Kod JSON' : 'e.g. Markdown table, Bulletpoints, JSON code'}
              value={expectedOutputFormat} 
              onChange={(e) => setExpectedOutputFormat(e.target.value)} 
            />
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-800">
            {workingLanguage === 'pl' ? 'Szczególne ograniczenia (Constraints)' : 'Specific constraints (Constraints)'}
            <input 
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/30 focus:border-indigo-500 focus:bg-white focus:outline-none px-4 py-3 text-sm transition"
              placeholder={workingLanguage === 'pl' ? 'np. Maksymalnie 300 słów, Ton profesjonalny' : 'e.g. Maximum 300 words, Professional tone'}
              value={constraints} 
              onChange={(e) => setConstraints(e.target.value)} 
            />
          </label>
        </div>

        {/* Advanced Settings */}
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-4 text-xs font-bold uppercase tracking-widest text-slate-400">
              {workingLanguage === 'pl' ? 'Ustawienia zaawansowane' : 'Advanced settings'}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <label className="space-y-2 text-sm font-semibold text-slate-800 block">
            <span className="block">
              {workingLanguage === 'pl' ? 'Docelowy model AI' : 'Target AI model'}
            </span>
            <span className="block text-xs font-normal text-slate-500 leading-relaxed">
              {workingLanguage === 'pl'
                ? 'Opcjonalnie wybierz typ modelu, pod który chcesz dostosować prompt. To ustawienie wpływa na sugestie optymalizacji, ale nie zmienia silnika analizującego prompt.'
                : 'Optionally select the model type you want to tailor the prompt for. This affects optimization recommendations but does not change the core engine performing the audit.'}
            </span>
            <select
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 px-4 py-3 text-sm font-medium transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-100 block"
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
            className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 text-sm active:scale-[0.99] disabled:scale-100 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 shadow-md shadow-indigo-50 hover:shadow-indigo-100 transition-all flex items-center justify-center gap-2"
            disabled={isTooShort || isTooLong || isBlocked}
            type="submit"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 00-2-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
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
          <p className="text-center text-xs font-semibold text-red-600">
            ⚠️ {workingLanguage === 'pl' 
              ? 'Ostrzeżenie: Wykryto wrażliwe dane. Usuń klucze API lub poufne teksty, aby odblokować przycisk audytu.'
              : 'Warning: Sensitive data detected. Remove API keys or credentials to unlock the audit button.'}
          </p>
        )}
      </form>
    </>
  )
}
