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
      <div className="rounded-lg border border-[#6EE7B7]/20 bg-[#6EE7B7]/5 p-4 text-center animate-in fade-in zoom-in-95 duration-300">
        <span className="text-2xl">🎉</span>
        <h4 className="mt-2 text-sm font-bold text-[#6EE7B7]">
          {lang === 'pl' ? 'Zapisano pomyślnie!' : 'Successfully joined!'}
        </h4>
        <p className="mt-1 text-xs text-[#94A3B8] leading-relaxed">
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
          className="w-full rounded-lg border border-[#2A2A3A] bg-[#0C0C10] px-4 py-2.5 text-xs text-[#E2E8F0] placeholder-[#8290A2] transition focus:border-[#A78BFA]/40 focus:outline-none disabled:opacity-50"
        />
      </div>

      {error && (
        <p className="text-xs font-medium text-[#F87171] animate-pulse">
          ⚠️ {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full text-center rounded-lg gradient-btn text-white font-bold py-2.5 text-xs active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
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
