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

  const progressPct = Math.round(((currentStepIndex + 1) / loadingSteps.length) * 100)
  const blockCount = Math.round(((currentStepIndex + 1) / loadingSteps.length) * 12)
  const barBlocks = '█'.repeat(blockCount)
  const barEmpty = '░'.repeat(12 - blockCount)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-pp-bg/90 font-mono">
      <div className="pp-panel p-6 sm:p-8 max-w-md w-full border-2 border-pp-border-bright mx-4 shadow-[0_0_15px_rgba(124,58,237,0.4)]">
        <div className="flex items-center justify-between border-b border-pp-border pb-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 bg-pp-cyan animate-pulse" />
            <span className="text-[10px] font-bold tracking-widest text-pp-cyan uppercase">
              SYS // WYKUWANIE_PROMPTU
            </span>
          </div>
          <span className="text-[10px] text-pp-muted">
            PORT: 8080
          </span>
        </div>

        <div className="space-y-4">
          <div className="pp-inset p-4 bg-black/45 text-xs text-pp-muted font-mono leading-relaxed space-y-1">
            <p className="text-pp-cyan">&gt; INITIALIZING PREFLIGHT SCANNER...</p>
            {currentStepIndex >= 1 && <p className="text-pp-success">&gt; USER LIMITS VERIFIED [OK]</p>}
            {currentStepIndex >= 2 && <p className="text-pp-success">&gt; PROMPT ENGINE LOADED [OK]</p>}
            {currentStepIndex >= 3 && <p className="text-pp-primary-bright">&gt; ANALYZING STRUCTURE AND LUKAS...</p>}
            {currentStepIndex >= 4 && <p className="text-pp-cyan">&gt; GENERATING OPTIMIZED TEXT...</p>}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-pp-text uppercase">
              <span>{workingLanguage === 'pl' ? 'Postęp audytu' : 'Audit progress'}</span>
              <span className="text-pp-cyan">{progressPct}%</span>
            </div>
            
            {/* ASCII style progress bar */}
            <div className="text-lg font-mono text-pp-border-bright tracking-wider leading-none select-none">
              [{barBlocks}{barEmpty}]
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-pp-cyan tracking-wider">
              {workingLanguage === 'pl' ? `Krok ${currentStepIndex + 1} / ${loadingSteps.length}` : `Step ${currentStepIndex + 1} / ${loadingSteps.length}`}
            </p>
            <p className="text-xs text-pp-text leading-relaxed animate-pulse">
              {loadingSteps[currentStepIndex]}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
