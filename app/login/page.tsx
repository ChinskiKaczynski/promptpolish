'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabaseClient) {
      setErrorMsg('Usługa autoryzacji jest niedostępna w tym środowisku.')
      return
    }

    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      if (isSignUp) {
        const { error } = await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName || null
            }
          }
        })
        if (error) throw error
        setSuccessMsg(
          'Rejestracja przebiegła pomyślnie! Sprawdź swoją skrzynkę e-mail, aby potwierdzić konto.'
        )
      } else {
        const { error } = await supabaseClient.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
        router.push('/account')
        router.refresh()
      }
    } catch (err: unknown) {
      console.error('Auth error:', err)
      const message = err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd logowania.'
      setErrorMsg(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50 selection:bg-indigo-100 antialiased font-sans">
      {/* Mini Navigation Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 shadow-md shadow-indigo-200">
              <span className="font-bold text-white text-base">P</span>
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-800 bg-clip-text text-transparent">
              PromptPolish
            </span>
          </Link>
          <Link href="/" className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition">
            Powrót do strony głównej
          </Link>
        </div>
      </header>

      {/* Auth Card Container */}
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-100/50">
          <div className="text-center">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              {isSignUp ? 'Utwórz bezpłatne konto' : 'Zaloguj się do PromptPolish'}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {isSignUp
                ? 'Zapisuj historię swoich promptów i uzyskaj dostęp do Pro planu.'
                : 'Zarządzaj swoimi ulepszonymi promptami i historią audytów.'}
            </p>
          </div>

          {/* Toggle Tabs */}
          <div className="mt-6 flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              className={`flex-1 rounded-lg py-2.5 text-center text-xs font-bold transition-all ${
                !isSignUp ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
              onClick={() => {
                setIsSignUp(false)
                setErrorMsg(null)
                setSuccessMsg(null)
              }}
            >
              Logowanie
            </button>
            <button
              type="button"
              className={`flex-1 rounded-lg py-2.5 text-center text-xs font-bold transition-all ${
                isSignUp ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
              onClick={() => {
                setIsSignUp(true)
                setErrorMsg(null)
                setSuccessMsg(null)
              }}
            >
              Rejestracja
            </button>
          </div>

          <form onSubmit={handleAuth} className="mt-6 space-y-4">
            {isSignUp && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="displayName">
                  Imię / Nazwa użytkownika
                </label>
                <input
                  id="displayName"
                  type="text"
                  placeholder="np. Jan Kowalski"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="email">
                Adres e-mail
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="twoj@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="password">
                Hasło
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-700 leading-relaxed">
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full inline-flex items-center justify-center rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-indigo-100 hover:shadow-indigo-200 transition-all active:scale-95 cursor-pointer"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : isSignUp ? (
                'Zarejestruj się'
              ) : (
                'Zaloguj się'
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 px-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} PromptPolish. Wszystkie prawa zastrzeżone.
      </footer>
    </div>
  )
}
