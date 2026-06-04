'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'

export function LoginForm() {
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
    <div className="w-full max-w-md pp-panel p-6 sm:p-8 border-2 border-pp-border font-mono relative">
      <div className="absolute top-0 right-4 -translate-y-1/2 bg-pp-bg px-2 text-[9px] font-bold text-pp-cyan tracking-widest uppercase">
        {"// LOGOWANIE_KONSOLI"}
      </div>

      <div className="text-center space-y-1">
        <h1 className="text-sm font-black uppercase tracking-wider text-pp-text">
          {isSignUp ? 'Utwórz bezpłatne konto' : 'Zaloguj się do PromptPolish'}
        </h1>
        <p className="text-[11px] text-pp-muted uppercase">
          {isSignUp
            ? 'Zapisuj historię swoich promptów i uzyskaj dostęp do Pro planu.'
            : 'Zarządzaj swoimi ulepszonymi promptami i historią audytów.'}
        </p>
      </div>

      {/* Toggle Tabs (Win98 retro tab strip layout) */}
      <div className="mt-6 flex border-b border-pp-border">
        <button
          type="button"
          className={`flex-1 py-2 text-center text-xs font-bold transition-all uppercase tracking-wider cursor-pointer ${
            !isSignUp 
              ? 'border-t-2 border-l-2 border-r-2 border-pp-border bg-pp-panel text-pp-cyan' 
              : 'text-pp-muted hover:text-pp-text'
          }`}
          onClick={() => {
            setIsSignUp(false)
            setErrorMsg(null)
            setSuccessMsg(null)
          }}
        >
          LOGOWANIE
        </button>
        <button
          type="button"
          className={`flex-1 py-2 text-center text-xs font-bold transition-all uppercase tracking-wider cursor-pointer ${
            isSignUp 
              ? 'border-t-2 border-l-2 border-r-2 border-pp-border bg-pp-panel text-pp-cyan' 
              : 'text-pp-muted hover:text-pp-text'
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
          REJESTRACJA
        </button>
      </div>

      <form onSubmit={handleAuth} className="mt-6 space-y-4">
        {isSignUp && (
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-pp-muted" htmlFor="displayName">
              Nazwa użytkownika
            </label>
            <input
              id="displayName"
              type="text"
              placeholder="np. Jan Kowalski"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="pp-input text-xs"
            />
          </div>
        )}

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-pp-muted" htmlFor="email">
            Adres e-mail
          </label>
          <input
            id="email"
            type="email"
            required
            placeholder="twoj@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pp-input text-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-pp-muted" htmlFor="password">
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
            className="pp-input text-xs"
          />
        </div>

        {errorMsg && (
          <div className="border border-pp-danger bg-pp-danger/10 p-3 text-[11px] font-bold text-pp-danger uppercase leading-relaxed">
            [!] BŁĄD: {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="border border-pp-success bg-pp-success/10 p-3 text-[11px] font-bold text-pp-success uppercase leading-relaxed">
            [+] SUKCES: {successMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="pp-button pp-button-primary w-full text-xs py-3.5 mt-2 flex justify-center items-center gap-2"
        >
          {loading ? (
            <span>LOGOWANIE...</span>
          ) : isSignUp ? (
            'STWÓRZ KONTO'
          ) : (
            'ZALOGUJ SIĘ // WEJŚCIE'
          )}
        </button>
      </form>
    </div>
  )
}
