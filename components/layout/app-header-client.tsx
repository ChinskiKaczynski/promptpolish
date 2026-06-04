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

  // Theme style mappings
  const bgStyle = theme === 'dark'
    ? 'bg-slate-950/80 border-slate-900 text-slate-100'
    : 'bg-white/80 border-slate-100 text-slate-900'

  const textStyle = theme === 'dark'
    ? 'text-slate-400 hover:text-white transition-colors duration-200'
    : 'text-slate-600 hover:text-indigo-600 transition-colors duration-200'

  const activeTextStyle = theme === 'dark'
    ? 'text-white font-bold'
    : 'text-indigo-600 font-bold'

  const logoTextGradient = theme === 'dark'
    ? 'from-white to-slate-300'
    : 'from-slate-900 to-slate-800'

  const buttonBorderClass = theme === 'dark'
    ? 'border-slate-800 hover:bg-slate-900 text-slate-300 hover:text-white'
    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'

  const isLinkActive = (path: string) => pathname === path

  return (
    <header className={`border-b sticky top-0 z-50 backdrop-blur-md transition-all duration-200 ${bgStyle}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 active:scale-[0.98] transition-all">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 shadow-md shadow-indigo-500/20">
            <span className="font-bold text-white text-base">P</span>
          </div>
          <span className={`text-lg font-bold tracking-tight bg-gradient-to-r ${logoTextGradient} bg-clip-text text-transparent`}>
            PromptPolish
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
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
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition active:scale-95 cursor-pointer"
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
                    className={`rounded-xl border px-4 py-1.5 text-xs font-bold transition active:scale-95 disabled:opacity-50 cursor-pointer ${buttonBorderClass}`}
                  >
                    {isLoggingOut ? 'Wylogowywanie...' : 'Wyloguj'}
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className={`rounded-xl border px-4 py-1.5 text-xs font-bold transition active:scale-95 cursor-pointer ${buttonBorderClass}`}
                >
                  Zaloguj
                </Link>
              )}

              {/* Polish active indicator status badge for MVP */}
              {!isLoggedIn && (
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  theme === 'dark' ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-600'
                }`}>
                  Działa bez konta
                </span>
              )}
            </>
          )}
        </nav>

        {/* Mobile Navigation Toggle (Hamburger) */}
        <div className="flex md:hidden items-center gap-3">
          {/* Badge for anonymous MVP on mobile */}
          {!isLoggedIn && !publicShare && (
            <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
              theme === 'dark' ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-500'
            }`}>
              MVP
            </span>
          )}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`p-2 rounded-lg border transition ${
              theme === 'dark'
                ? 'border-slate-800 text-slate-300 hover:bg-slate-900'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
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
        <div className={`md:hidden border-t px-6 py-4 space-y-4 animate-in slide-in-from-top duration-200 ${
          theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-100'
        }`}>
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
                className="w-full text-center rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-95"
              >
                Przeanalizuj prompt
              </Link>
            </div>
          ) : (
            <nav className="flex flex-col gap-2">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-sm py-2 font-medium border-b border-slate-100/5 ${isLinkActive('/') ? activeTextStyle : textStyle}`}
              >
                Strona główna
              </Link>
              <Link
                href="/analyze"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-sm py-2 font-medium border-b border-slate-100/5 ${isLinkActive('/analyze') ? activeTextStyle : textStyle}`}
              >
                Nowy audyt
              </Link>
              <Link
                href="/pricing"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-sm py-2 font-medium border-b border-slate-100/5 ${isLinkActive('/pricing') ? activeTextStyle : textStyle}`}
              >
                Cennik
              </Link>

              {isAdmin && (
                <Link
                  href="/admin/metrics"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-sm py-2 font-medium border-b border-slate-100/5 ${isLinkActive('/admin/metrics') ? activeTextStyle : textStyle}`}
                >
                  Admin
                </Link>
              )}

              {isLoggedIn ? (
                <>
                  <Link
                    href="/account"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`text-sm py-2 font-medium border-b border-slate-100/5 ${isLinkActive('/account') ? activeTextStyle : textStyle}`}
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
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center block rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-95 mt-2"
                >
                  Zaloguj
                </Link>
              )}
            </nav>
          )}
        </div>
      )}
    </header>
  )
}
