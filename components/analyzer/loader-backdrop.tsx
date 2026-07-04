import { useState, useEffect } from 'react'

interface LoaderBackdropProps {
  isSubmitting: boolean
  workingLanguage: 'pl' | 'en'
  currentStepIndex: number
  loadingSteps: string[]
  createdId?: string | null
}

export function LoaderBackdrop({
  isSubmitting,
  workingLanguage,
  currentStepIndex,
  loadingSteps,
  createdId
}: LoaderBackdropProps) {
  const [showFallback, setShowFallback] = useState(false)

  useEffect(() => {
    let timeout: NodeJS.Timeout
    if (createdId && isSubmitting) {
      timeout = setTimeout(() => {
        setShowFallback(true)
      }, 2000)
    } else {
      Promise.resolve().then(() => {
        setShowFallback(false)
      })
    }
    return () => clearTimeout(timeout)
  }, [createdId, isSubmitting])

  if (!isSubmitting) return null

  const progressPct = Math.round(((currentStepIndex + 1) / loadingSteps.length) * 100)

  return (
    <div role="status" aria-live="polite" aria-busy="true" className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0C0C10]/95 backdrop-blur-md transition-all duration-300">
      <div className="relative flex flex-col items-center max-w-md px-6 text-center">
        
        {/* Spinning gradient ring */}
        <div className="relative flex h-20 w-20 items-center justify-center">
          <div className="absolute h-full w-full animate-spin rounded-full border-4 border-[#A78BFA]/20 border-t-[#A78BFA]" />
          <svg className="h-8 w-8 text-[#A78BFA] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        
        <h3 className="mt-8 text-lg font-bold text-white tracking-tight">
          {workingLanguage === 'pl' ? 'Trwa inżynieryjny audyt promptu...' : 'Conducting prompt engineering audit...'}
        </h3>
        
        {/* Steps Progress Indicator */}
        <div className="mt-6 w-80 rounded-full bg-[#13131A] p-1 border border-[#2A2A3A]">
          <div 
            className="h-2 rounded-full bg-gradient-to-r from-[#7C3AED] via-[#A78BFA] to-[#6EE7B7] transition-all duration-500 ease-out" 
            style={{ width: `${progressPct}%` }}
          />
        </div>
        
        <div className="mt-3 flex justify-between w-80 text-xs font-mono font-bold text-[#94A3B8] uppercase tracking-widest px-1">
          <span>{workingLanguage === 'pl' ? `Krok ${currentStepIndex + 1} z ${loadingSteps.length}` : `Step ${currentStepIndex + 1} of ${loadingSteps.length}`}</span>
          <span className="text-[#A78BFA] animate-pulse">{progressPct}%</span>
        </div>
 
        {/* Visual Engineering Checkpoints List */}
        <div className="mt-8 text-left space-y-3 w-80 max-w-full border-t border-[#2A2A3A] pt-6">
          {loadingSteps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex
            const isActive = idx === currentStepIndex
            return (
              <div 
                key={idx} 
                className={`flex items-center gap-3 text-xs transition-all duration-300 ${
                  isCompleted ? 'text-[#A78BFA]/80 opacity-60' :
                  isActive ? 'text-white font-bold scale-[1.02] translate-x-1' :
                  'text-[#8290A2]'
                }`}
              >
                <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[11px] font-mono shrink-0 border transition-all duration-300 ${
                  isCompleted ? 'border-[#A78BFA] bg-[#A78BFA]/20 text-[#A78BFA]' :
                  isActive ? 'border-[#A78BFA] bg-[#7C3AED] animate-pulse text-white font-bold shadow-md shadow-[#A78BFA]/40' :
                  'border-[#2A2A3A] text-[#8290A2]'
                }`}>
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span className="truncate">{step}</span>
              </div>
            )
          })}
        </div>

        {/* Fallback direct browser redirect link if client-side navigation gets stuck */}
        {showFallback && createdId && (
          <div className="mt-8 border-t border-[#2A2A3A] pt-6 w-80">
            <a 
              href={`/result/${createdId}`}
              className="inline-block w-full text-center px-6 py-3 rounded-lg bg-[#A78BFA] text-[#0C0C10] font-bold hover:bg-[#8B5CF6] active:scale-[0.98] transition duration-200 shadow-lg shadow-[#A78BFA]/25 text-sm"
            >
              {workingLanguage === 'pl' ? 'Przejdź do wyniku (Pomiń animację)' : 'Go to result (Skip animation)'}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
