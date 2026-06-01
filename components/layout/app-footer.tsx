import Link from 'next/link'

interface AppFooterProps {
  theme?: 'light' | 'dark'
}

export function AppFooter({ theme = 'light' }: AppFooterProps) {
  const bgStyle = theme === 'dark'
    ? 'bg-slate-950 border-slate-900 text-slate-500'
    : 'bg-white border-slate-200 text-slate-400'

  const textHoverStyle = theme === 'dark'
    ? 'hover:text-slate-300'
    : 'hover:text-indigo-600'

  const borderStyle = theme === 'dark'
    ? 'border-t border-slate-900'
    : 'border-t border-slate-200/60'

  return (
    <footer className={`py-12 px-6 ${borderStyle} ${bgStyle}`}>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 shadow-sm">
              <span className="font-bold text-white text-xs">P</span>
            </div>
            <span className={`text-sm font-bold tracking-tight ${
              theme === 'dark' ? 'text-slate-200' : 'text-slate-900'
            }`}>
              PromptPolish
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-xs font-semibold">
            <Link className={`transition ${textHoverStyle}`} href="/privacy">Polityka prywatności</Link>
            <Link className={`transition ${textHoverStyle}`} href="/terms">Regulamin</Link>
            <span className={theme === 'dark' ? 'text-slate-800' : 'text-slate-200'}>|</span>
            <span className="font-normal font-sans">
              © {new Date().getFullYear()} PromptPolish. Wszystkie prawa zastrzeżone.
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
