'use client'

import { useState } from 'react'
import { supabaseClient } from '@/lib/supabase/client'
import { LogoIcon } from '@/components/ui/logo'

export function LoginForm() {
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
        
        // Telemetry: signup_completed
        fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event_type: 'signup_completed' })
        }).catch(() => null)

        setSuccessMsg(
          'Rejestracja przebiegła pomyślnie! Sprawdź swoją skrzynkę e-mail, aby potwierdzić konto.'
        )
      } else {
        const { error } = await supabaseClient.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
      }
    } catch (err: unknown) {
      console.error('Auth error:', err)
      if (isSignUp) {
        const isAlreadyRegistered =
          err instanceof Error &&
          (/already registered/i.test(err.message) ||
            ('code' in err && (err as { code?: string }).code === 'user_already_exists'))

        if (isAlreadyRegistered) {
          setErrorMsg(
            'Nie udało się utworzyć konta. Spróbuj ponownie lub zaloguj się, jeśli masz już konto.'
          )
        } else {
          const message =
            err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd rejestracji.'
          setErrorMsg(message)
        }
      } else {
        const message =
          err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd logowania.'
        setErrorMsg(message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md rounded-xl border border-[#2A2A3A] bg-[#13131A] p-8">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#7C3AED]/10 border border-[#A78BFA]/20 shadow-[0_0_15px_rgba(167,139,250,0.2)]">
            <LogoIcon className="h-8 w-8" />
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#E2E8F0] font-heading">
          {isSignUp ? 'Utwórz bezpłatne konto' : 'Zaloguj się do PromptPolish'}
        </h1>
        <p className="mt-2 text-sm text-[#94A3B8]">
          {isSignUp
            ? 'Zapisuj historię swoich promptów i uzyskaj dostęp do Pro planu.'
            : 'Zarządzaj swoimi ulepszonymi promptami i historią audytów.'}
        </p>
      </div>

      {/* Toggle Tabs */}
      <div className="mt-6 flex rounded-lg bg-[#0C0C10] border border-[#2A2A3A] p-1">
        <button
          type="button"
          className={`flex-1 rounded-md py-2.5 text-center text-xs font-bold transition-all cursor-pointer ${
            !isSignUp ? 'bg-[#1C1C27] text-[#E2E8F0] border border-[#3A3A52]' : 'text-[#8290A2] hover:text-[#94A3B8]'
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
          className={`flex-1 rounded-md py-2.5 text-center text-xs font-bold transition-all cursor-pointer ${
            isSignUp ? 'bg-[#1C1C27] text-[#E2E8F0] border border-[#3A3A52]' : 'text-[#8290A2] hover:text-[#94A3B8]'
          }`}
          onClick={() => {
            setIsSignUp(true)
            setErrorMsg(null)
            setSuccessMsg(null)
            // Telemetry: signup_started
            fetch('/api/events', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ event_type: 'signup_started' })
            }).catch(() => null)
          }}
        >
          Rejestracja
        </button>
      </div>

      <form onSubmit={handleAuth} className="mt-6 space-y-4">
        {isSignUp && (
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]" htmlFor="displayName">
              Imię / Nazwa użytkownika
            </label>
            <input
              id="displayName"
              type="text"
              placeholder="np. Jan Kowalski"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[#2A2A3A] bg-[#0C0C10] px-4 py-3 text-sm text-[#E2E8F0] placeholder:text-[#8290A2] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#A78BFA]/20 focus:outline-none transition-all"
            />
          </div>
        )}

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]" htmlFor="email">
            Adres e-mail
          </label>
          <input
            id="email"
            type="email"
            required
            placeholder="twoj@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-[#2A2A3A] bg-[#0C0C10] px-4 py-3 text-sm text-[#E2E8F0] placeholder:text-[#8290A2] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#A78BFA]/20 focus:outline-none transition-all"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]" htmlFor="password">
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
            className="mt-1.5 w-full rounded-lg border border-[#2A2A3A] bg-[#0C0C10] px-4 py-3 text-sm text-[#E2E8F0] placeholder:text-[#8290A2] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#A78BFA]/20 focus:outline-none transition-all"
          />
        </div>

        {errorMsg && (
          <div role="alert" className="rounded-lg border border-[#F87171]/30 bg-[#F87171]/8 p-4 text-xs font-medium text-[#F87171]">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div role="status" aria-live="polite" className="rounded-lg border border-[#6EE7B7]/30 bg-[#6EE7B7]/8 p-4 text-xs font-medium text-[#6EE7B7] leading-relaxed">
            {successMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full inline-flex items-center justify-center rounded-lg gradient-btn disabled:opacity-40 disabled:transform-none py-3.5 text-center text-sm font-semibold text-white transition-all active:scale-95 cursor-pointer"
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
  )
}
