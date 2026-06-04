import Link from 'next/link'

interface AppFooterProps {
  theme?: 'light' | 'dark'
}

export function AppFooter({ theme }: AppFooterProps = {}) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = theme
  return (
    <footer className="border-t border-[#2A2A3A] bg-[#0C0C10] py-10 px-6 mt-auto">
      <div className="mx-auto max-w-6xl flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

        {/* Logo + tagline */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-[#1C1C27] border border-[#2A2A3A]">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L15.3 8.7L22 12L15.3 15.3L12 22L8.7 15.3L2 12L8.7 8.7Z" fill="#A78BFA"/>
            </svg>
          </div>
          <span className="text-sm font-bold text-[#E2E8F0] font-heading">PromptPolish</span>
          <span className="hidden sm:inline text-[#4A5568] text-xs ml-2">— Audyt promptów AI</span>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-[#4A5568]">
          <Link className="hover:text-[#A78BFA] transition-colors" href="/privacy">Polityka prywatności</Link>
          <Link className="hover:text-[#A78BFA] transition-colors" href="/terms">Regulamin</Link>
          <span className="text-[#1E1E2E]">|</span>
          <span className="text-[#4A5568]">© {new Date().getFullYear()} PromptPolish</span>
        </div>
      </div>
    </footer>
  )
}
