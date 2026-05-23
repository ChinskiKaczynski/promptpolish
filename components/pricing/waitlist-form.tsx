'use client'

import { useState } from 'react'

interface WaitlistFormProps {
  initialEmail?: string
  lang?: 'pl' | 'en'
}

export function WaitlistForm({ initialEmail = '', lang = 'pl' }: WaitlistFormProps) {
  const [email, setEmail] = useState(initialEmail)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(
        lang === 'pl'
          ? 'Wprowadź poprawny adres e-mail.'
          : 'Please enter a valid email address.'
      )
      return
    }

    setIsLoading(true)

    // Simulate API registration delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    setIsLoading(false)
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center animate-in fade-in zoom-in-95 duration-300">
        <span className="text-2xl">🎉</span>
        <h4 className="mt-2 text-sm font-bold text-emerald-400">
          {lang === 'pl' ? 'Zapisano pomyślnie!' : 'Successfully joined!'}
        </h4>
        <p className="mt-1 text-xs text-slate-400 leading-relaxed">
          {lang === 'pl'
            ? 'Dziękujemy! Otrzymasz powiadomienie, gdy tylko plan Pro wystartuje.'
            : 'Thank you! We will notify you as soon as the Pro tier launches.'}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="waitlist-email" className="sr-only">
          Email
        </label>
        <input
          id="waitlist-email"
          type="email"
          placeholder={
            lang === 'pl'
              ? 'Wpisz swój adres e-mail...'
              : 'Enter your email address...'
          }
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-500 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
        />
      </div>

      {error && (
        <p className="text-[11px] font-medium text-rose-500 animate-pulse">
          ⚠️ {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full text-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-bold py-2.5 text-xs active:scale-[0.98] shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
      >
        {isLoading ? (
          <>
            <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
            <span>{lang === 'pl' ? 'Zapisywanie...' : 'Subscribing...'}</span>
          </>
        ) : (
          <span>
            {lang === 'pl'
              ? 'Dołącz do listy oczekujących'
              : 'Join the Waitlist'}
          </span>
        )}
      </button>
    </form>
  )
}
