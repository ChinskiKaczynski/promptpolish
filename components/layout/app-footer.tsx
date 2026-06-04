import Link from 'next/link'

export function AppFooter() {
  return (
    <footer className="py-8 px-6 border-t-2 border-pp-border bg-pp-panel text-pp-muted font-mono text-xs">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center border border-pp-border-bright bg-pp-primary text-[10px] font-bold text-white shadow-sm">
              P
            </div>
            <span className="font-bold text-pp-text uppercase tracking-widest text-xs">
              PROMPT_POLISH // CORE
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-bold uppercase">
            <Link className="hover:text-pp-cyan transition-colors" href="/privacy">[ POLITYKA PRYWATNOŚCI ]</Link>
            <Link className="hover:text-pp-cyan transition-colors" href="/terms">[ REGULAMIN ]</Link>
            <span className="text-pp-border">|</span>
            <span className="font-normal normal-case text-[10px] text-pp-muted font-mono">
              © {new Date().getFullYear()} PromptPolish. SYSTEM READY.
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
