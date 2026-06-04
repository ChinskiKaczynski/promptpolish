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

export function AppHeaderClient(props: AppHeaderClientProps) {
  const { isLoggedIn, isAdmin, publicShare } = props
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

  const isLinkActive = (path: string) => pathname === path

  return (
    <header className="border-b-2 border-pp-border bg-pp-panel sticky top-0 z-50 transition-all duration-200">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo / Console ID */}
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 active:translate-y-0.5 transition-all">
          <div className="flex h-9 w-9 items-center justify-center border-2 border-pp-border-bright bg-pp-primary shadow-[2px_2px_0px_rgba(0,0,0,0.5)]">
            <span className="font-mono font-bold text-white text-base">P</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-widest text-pp-text uppercase">
              PROMPT_POLISH
            </span>
            <span className="text-[9px] font-mono text-pp-cyan font-bold tracking-wider">
              SYS.V1.0.0 // CONSOLE
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-wider font-mono">
          {/* Public Share page shows only home and analyze */}
          {publicShare ? (
            <>
              <Link
                href="/"
                className={isLinkActive('/') ? 'text-pp-cyan drop-shadow-[0_0_4px_rgba(6,182,212,0.5)]' : 'text-pp-muted hover:text-pp-text'}
              >
                [ Strona główna ]
              </Link>
              <Link
                href="/analyze"
                className="pp-button pp-button-primary text-xs py-1.5 px-3"
              >
                Przeanalizuj prompt
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/"
                className={isLinkActive('/') ? 'text-pp-cyan drop-shadow-[0_0_4px_rgba(6,182,212,0.5)]' : 'text-pp-muted hover:text-pp-text'}
              >
                [ Start ]
              </Link>
              <Link
                href="/analyze"
                className={isLinkActive('/analyze') ? 'text-pp-cyan drop-shadow-[0_0_4px_rgba(6,182,212,0.5)]' : 'text-pp-muted hover:text-pp-text'}
              >
                [ Analizator ]
              </Link>
              <Link
                href="/pricing"
                className={isLinkActive('/pricing') ? 'text-pp-cyan drop-shadow-[0_0_4px_rgba(6,182,212,0.5)]' : 'text-pp-muted hover:text-pp-text'}
              >
                [ Cennik ]
              </Link>

              {isAdmin && (
                <Link
                  href="/admin/metrics"
                  className={isLinkActive('/admin/metrics') ? 'text-pp-cyan drop-shadow-[0_0_4px_rgba(6,182,212,0.5)]' : 'text-pp-muted hover:text-pp-text'}
                >
                  [ Admin Metrics ]
                </Link>
              )}

              {isLoggedIn ? (
                <>
                  <Link
                    href="/account"
                    className={isLinkActive('/account') ? 'text-pp-cyan drop-shadow-[0_0_4px_rgba(6,182,212,0.5)]' : 'text-pp-muted hover:text-pp-text'}
                  >
                    [ Konto ]
                  </Link>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="pp-button text-[10px] py-1 px-2.5 bg-red-950 border-red-800 hover:border-red-500 text-red-200"
                  >
                    {isLoggingOut ? 'LOGOUT...' : 'Wyloguj'}
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="pp-button text-[10px] py-1 px-3 border-pp-border hover:border-pp-border-bright"
                >
                  Zaloguj
                </Link>
              )}

              {/* Polish active indicator status badge for MVP */}
              {!isLoggedIn && (
                <span className="border border-dashed border-pp-border bg-pp-panel px-2 py-0.5 text-[9px] font-bold text-pp-muted">
                  TRYB_ANONIM
                </span>
              )}
            </>
          )}
        </nav>

        {/* Mobile Navigation Toggle (Hamburger) */}
        <div className="flex md:hidden items-center gap-3">
          {!isLoggedIn && !publicShare && (
            <span className="border border-pp-border bg-pp-panel px-2 py-0.5 text-[9px] font-bold text-pp-muted">
              MVP
            </span>
          )}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 border-2 border-pp-border text-pp-text bg-pp-panel-2 hover:border-pp-border-bright"
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
        <div className="md:hidden border-t-2 border-pp-border px-6 py-4 space-y-4 bg-pp-panel animate-in slide-in-from-top duration-200">
          {publicShare ? (
            <div className="flex flex-col gap-3 font-mono text-xs uppercase font-bold tracking-wider">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-2 ${isLinkActive('/') ? 'text-pp-cyan' : 'text-pp-muted'}`}
              >
                [ Strona główna ]
              </Link>
              <Link
                href="/analyze"
                onClick={() => setIsMobileMenuOpen(false)}
                className="pp-button pp-button-primary w-full text-center py-2 text-xs"
              >
                Przeanalizuj prompt
              </Link>
            </div>
          ) : (
            <nav className="flex flex-col gap-2 font-mono text-xs uppercase font-bold tracking-wider">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-2 border-b border-pp-border/30 ${isLinkActive('/') ? 'text-pp-cyan' : 'text-pp-muted'}`}
              >
                [ START ]
              </Link>
              <Link
                href="/analyze"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-2 border-b border-pp-border/30 ${isLinkActive('/analyze') ? 'text-pp-cyan' : 'text-pp-muted'}`}
              >
                [ ANALIZATOR ]
              </Link>
              <Link
                href="/pricing"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-2 border-b border-pp-border/30 ${isLinkActive('/pricing') ? 'text-pp-cyan' : 'text-pp-muted'}`}
              >
                [ CENNIK ]
              </Link>

              {isAdmin && (
                <Link
                  href="/admin/metrics"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`py-2 border-b border-pp-border/30 ${isLinkActive('/admin/metrics') ? 'text-pp-cyan' : 'text-pp-muted'}`}
                >
                  [ METRYKI ]
                </Link>
              )}

              {isLoggedIn ? (
                <>
                  <Link
                    href="/account"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`py-2 border-b border-pp-border/30 ${isLinkActive('/account') ? 'text-pp-cyan' : 'text-pp-muted'}`}
                  >
                    [ KONTO ]
                  </Link>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full text-left py-2 font-bold text-red-400 hover:text-red-300 disabled:opacity-50"
                  >
                    {isLoggingOut ? '[ LOGOUT IN PROGRESS... ]' : '[ WYLOGUJ ]'}
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="pp-button w-full text-center py-2.5 mt-2"
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
