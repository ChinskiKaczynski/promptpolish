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

  // Theme style mappings - standard modern white-lavender
  const bgStyle = 'bg-white/80 border-slate-200/60 text-slate-900'
  const textStyle = 'text-slate-600 hover:text-indigo-600 transition-colors duration-200 font-medium'
  const activeTextStyle = 'text-indigo-600 font-bold'
  const buttonBorderClass = 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:border-slate-300 shadow-sm'

  const isLinkActive = (path: string) => pathname === path

  return (
    <header className={`border-b sticky top-0 z-50 backdrop-blur-md transition-all duration-200 ${bgStyle}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 active:scale-[0.98] transition-all">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100/80 shadow-sm">
            {/* Elegant 4-pointed star logo matching the screenshot */}
            <svg className="h-5 w-5 fill-indigo-600" viewBox="0 0 24 24">
              <path d="M12 2L15.3 8.7L22 12L15.3 15.3L12 22L8.7 15.3L2 12L8.7 8.7Z" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 font-sans">
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
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-100 hover:shadow-indigo-200 transition active:scale-95 cursor-pointer"
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
                    className={`rounded-xl border px-4 py-2 text-xs font-bold transition active:scale-95 disabled:opacity-50 cursor-pointer ${buttonBorderClass}`}
                  >
                    {isLoggingOut ? 'Wylogowywanie...' : 'Wyloguj'}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={`rounded-xl border px-4 py-2 text-xs font-bold transition active:scale-95 cursor-pointer ${buttonBorderClass}`}
                  >
                    Zaloguj
                  </Link>
                  <Link
                    href="/analyze"
                    className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-100 hover:shadow-indigo-200 transition active:scale-95 cursor-pointer"
                  >
                    Zacznij za darmo
                  </Link>
                </>
              )}

              {/* Polish active indicator status badge for MVP */}
              {!isLoggedIn && (
                <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100/50">
                  Działa bez konta
                </span>
              )}
            </>
          )}
        </nav>

        {/* Mobile Navigation Toggle (Hamburger) */}
        <div className="flex md:hidden items-center gap-3">
          {!isLoggedIn && !publicShare && (
            <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100/50">
              MVP
            </span>
          )}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
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
        <div className="md:hidden border-t px-6 py-4 space-y-4 animate-in slide-in-from-top duration-200 bg-white border-slate-200/60">
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
                <>
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full text-center block rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-750 active:scale-95"
                  >
                    Zaloguj
                  </Link>
                  <Link
                    href="/analyze"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full text-center block rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-95 mt-2"
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
