'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

interface AppHeaderClientProps {
  theme: 'light' | 'dark'
  isLoggedIn: boolean
  isAdmin: boolean
  publicShare: boolean
}

export function AppHeaderClient({ theme, isLoggedIn, isAdmin, publicShare }: AppHeaderClientProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = theme
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const { supabaseClient } = await import('@/lib/supabase/client')
      if (supabaseClient) {
        await supabaseClient.auth.signOut()
      }
      await fetch('/api/auth/session', { method: 'DELETE' })
      router.push('/')
      router.refresh()
    } catch (err) {
      console.error('Logout failed:', err)
    } finally {
      setIsLoggingOut(false)
      setIsMobileMenuOpen(false)
    }
  }

  // Theme style mappings - dark-mode-first
  const bgStyle = 'bg-[#0C0C10]/90 border-[#2A2A3A] text-[#E2E8F0]'
  const textStyle = 'text-[#94A3B8] hover:text-[#E2E8F0] transition-colors duration-150 text-sm font-medium'
  const activeTextStyle = 'text-[#A78BFA] font-semibold text-sm'
  const buttonBorderClass = 'border-[#2A2A3A] bg-[#13131A] hover:bg-[#1C1C27] hover:border-[#3A3A52] text-[#E2E8F0] shadow-none'

  const isLinkActive = (path: string) => pathname === path

  return (
    <header className={`border-b sticky top-0 z-50 backdrop-blur-xl transition-all duration-200 ${bgStyle}`}>
      <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1C1C27] border border-[#3A3A52] hover:border-[#A78BFA]/50 transition-colors">
            <svg className="h-5 w-5 fill-[#A78BFA]" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L15.3 8.7L22 12L15.3 15.3L12 22L8.7 15.3L2 12L8.7 8.7Z" />
            </svg>
          </div>
          <span className="text-base font-bold tracking-tight text-[#E2E8F0] font-heading">
            PromptPolish
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm">
          {/* Public Share page shows only home and analyze */}
          {publicShare ? (
            <>
              <Link
                href="/"
                className={isLinkActive('/') ? activeTextStyle : textStyle}
              >
                Strona główna
              </Link>
              <Link
                href="/analyze"
                className="inline-flex items-center justify-center rounded-lg gradient-btn px-4 py-2 text-xs font-bold text-white transition active:scale-95 cursor-pointer"
              >
                Przeanalizuj prompt
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/"
                className={isLinkActive('/') ? activeTextStyle : textStyle}
              >
                Strona główna
              </Link>
              <Link
                href="/analyze"
                className={isLinkActive('/analyze') ? activeTextStyle : textStyle}
              >
                Nowy audyt
              </Link>
              <Link
                href="/pricing"
                className={isLinkActive('/pricing') ? activeTextStyle : textStyle}
              >
                Cennik
              </Link>

              {isAdmin && (
                <Link
                  href="/admin/metrics"
                  className={isLinkActive('/admin/metrics') ? activeTextStyle : textStyle}
                >
                  Admin
                </Link>
              )}

              {isLoggedIn ? (
                <>
                  <Link
                    href="/account"
                    className={isLinkActive('/account') ? activeTextStyle : textStyle}
                  >
                    Konto
                  </Link>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className={`rounded-lg border px-4 py-2 text-xs font-bold transition active:scale-95 disabled:opacity-50 cursor-pointer ${buttonBorderClass}`}
                  >
                    {isLoggingOut ? 'Wylogowywanie...' : 'Wyloguj'}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={`rounded-lg border px-4 py-2 text-xs font-bold transition active:scale-95 cursor-pointer ${buttonBorderClass}`}
                  >
                    Zaloguj
                  </Link>
                  <Link
                    href="/analyze"
                    className="inline-flex items-center justify-center rounded-lg gradient-btn px-4 py-2 text-xs font-bold text-white transition active:scale-95 cursor-pointer"
                  >
                    Zacznij za darmo
                  </Link>
                </>
              )}

              {/* Polish active indicator status badge for MVP */}
              {!isLoggedIn && (
                <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-[#1C1C27] text-[#6EE7B7] border border-[#6EE7B7]/20">
                  Działa bez konta
                </span>
              )}
            </>
          )}
        </nav>

        {/* Mobile Navigation Toggle (Hamburger) */}
        <div className="flex md:hidden items-center gap-3">
          {!isLoggedIn && !publicShare && (
            <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-[#1C1C27] text-[#6EE7B7] border border-[#6EE7B7]/20">
              Działa bez konta
            </span>
          )}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg border border-[#2A2A3A] text-[#94A3B8] hover:bg-[#1C1C27] hover:text-[#E2E8F0] transition"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[#2A2A3A] px-6 py-4 space-y-4 animate-in slide-in-from-top duration-200 bg-[#0C0C10]">
          {publicShare ? (
            <div className="flex flex-col gap-3">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-sm py-2 font-medium ${isLinkActive('/') ? activeTextStyle : textStyle}`}
              >
                Strona główna
              </Link>
              <Link
                href="/analyze"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center inline-flex items-center justify-center rounded-lg gradient-btn px-4 py-2 text-xs font-bold text-white transition active:scale-95"
              >
                Przeanalizuj prompt
              </Link>
            </div>
          ) : (
            <nav className="flex flex-col gap-2">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-sm py-2 font-medium border-b border-[#2A2A3A]/30 ${isLinkActive('/') ? activeTextStyle : textStyle}`}
              >
                Strona główna
              </Link>
              <Link
                href="/analyze"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-sm py-2 font-medium border-b border-[#2A2A3A]/30 ${isLinkActive('/analyze') ? activeTextStyle : textStyle}`}
              >
                Nowy audyt
              </Link>
              <Link
                href="/pricing"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-sm py-2 font-medium border-b border-[#2A2A3A]/30 ${isLinkActive('/pricing') ? activeTextStyle : textStyle}`}
              >
                Cennik
              </Link>

              {isAdmin && (
                <Link
                  href="/admin/metrics"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-sm py-2 font-medium border-b border-[#2A2A3A]/30 ${isLinkActive('/admin/metrics') ? activeTextStyle : textStyle}`}
                >
                  Admin
                </Link>
              )}

              {isLoggedIn ? (
                <>
                  <Link
                    href="/account"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`text-sm py-2 font-medium border-b border-[#2A2A3A]/30 ${isLinkActive('/account') ? activeTextStyle : textStyle}`}
                  >
                    Konto
                  </Link>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full text-left text-sm py-2 font-bold text-rose-500 hover:text-rose-600 disabled:opacity-50"
                  >
                    {isLoggingOut ? 'Wylogowywanie...' : 'Wyloguj'}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`w-full text-center block rounded-lg border px-4 py-2 text-xs font-bold transition active:scale-95 cursor-pointer ${buttonBorderClass}`}
                  >
                    Zaloguj
                  </Link>
                  <Link
                    href="/analyze"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full text-center inline-flex items-center justify-center rounded-lg gradient-btn px-4 py-2 text-xs font-bold text-white transition active:scale-95 cursor-pointer mt-2"
                  >
                    Zacznij za darmo
                  </Link>
                </>
              )}
            </nav>
          )}
        </div>
      )}
    </header>
  )
}
