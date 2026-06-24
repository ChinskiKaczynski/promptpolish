import Link from 'next/link'

// Evaluated at build time — avoids SSR/client hydration mismatch on the copyright year.
const CURRENT_YEAR = new Date().getFullYear()

interface AppFooterProps {
  theme?: 'light' | 'dark'
}

export function AppFooter({ theme }: AppFooterProps = {}) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = theme
  return (
    <footer className="border-t border-[#2A2A3A] bg-[#0C0C10] py-10 px-6 mt-auto">
      <div className="mx-auto max-w-6xl flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-[#1C1C27] border border-[#2A2A3A] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-icon.png" alt="PromptPolish Logo" className="h-4 w-4 object-contain" />
          </div>
          <span className="text-sm font-bold text-[#E2E8F0] font-heading">PromptPolish</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-[#8290A2]">
          <Link className="hover:text-[#A78BFA] transition-colors" href="/privacy">Polityka prywatności</Link>
          <Link className="hover:text-[#A78BFA] transition-colors" href="/terms">Regulamin</Link>
          <a className="hover:text-[#A78BFA] transition-colors" href="mailto:kontakt@promptpolish.pl">Kontakt</a>
          <span className="text-[#8290A2]" suppressHydrationWarning>© {CURRENT_YEAR} PromptPolish</span>
        </div>
      </div>
    </footer>
  )
}

