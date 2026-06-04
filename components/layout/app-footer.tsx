import Link from 'next/link'

interface AppFooterProps {
  theme?: 'light' | 'dark'
}

export function AppFooter({ theme = 'light' }: AppFooterProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = theme
  const bgStyle = 'bg-white border-slate-200/60 text-slate-400'
  const textHoverStyle = 'hover:text-indigo-600'
  const borderStyle = 'border-t border-slate-200/60'

  return (
    <footer className={`py-12 px-6 ${borderStyle} ${bgStyle}`}>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100/50 shadow-sm">
              {/* Elegant 4-pointed star logo matching the header */}
              <svg className="h-4.5 w-4.5 fill-indigo-600" viewBox="0 0 24 24">
                <path d="M12 2L15.3 8.7L22 12L15.3 15.3L12 22L8.7 15.3L2 12L8.7 8.7Z" />
              </svg>
            </div>
            <span className="text-sm font-bold tracking-tight text-slate-900 font-sans">
              PromptPolish
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-xs font-semibold">
            <Link className={`transition ${textHoverStyle}`} href="/privacy">Polityka prywatności</Link>
            <Link className={`transition ${textHoverStyle}`} href="/terms">Regulamin</Link>
            <span className="text-slate-200">|</span>
            <span className="font-normal font-sans text-slate-400">
              © {new Date().getFullYear()} PromptPolish. Wszystkie prawa zastrzeżone.
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
