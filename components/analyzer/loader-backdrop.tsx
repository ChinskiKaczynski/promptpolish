'use client'

interface LoaderBackdropProps {
  isSubmitting: boolean
  workingLanguage: 'pl' | 'en'
  currentStepIndex: number
  loadingSteps: string[]
}

export function LoaderBackdrop({
  isSubmitting,
  workingLanguage,
  currentStepIndex,
  loadingSteps
}: LoaderBackdropProps) {
  if (!isSubmitting) return null

  return (
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
  )
}
