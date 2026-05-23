'use client'

import { useState } from 'react'

interface CheckoutButtonProps {
  lang?: 'pl' | 'en'
}

export function CheckoutButton({ lang = 'pl' }: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async () => {
    setIsLoading(true)
    setError(null)

    // Telemetry: upgrade_cta_clicked
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'upgrade_cta_clicked' })
    }).catch(() => null)

    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || (lang === 'pl' ? 'Nie udało się rozpocząć płatności.' : 'Failed to initiate payment.'))
      }

      const { checkoutUrl } = await response.json()
      if (checkoutUrl) {
        window.location.href = checkoutUrl
      } else {
        throw new Error(lang === 'pl' ? 'Brak adresu przekierowania.' : 'No redirect URL provided.')
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setError(err instanceof Error ? err.message : String(err))
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full space-y-2">
      <button
        onClick={handleCheckout}
        disabled={isLoading}
        className="w-full text-center rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold py-3 text-xs active:scale-[0.98] shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span>{lang === 'pl' ? 'Przekierowywanie...' : 'Redirecting...'}</span>
          </>
        ) : (
          <span>{lang === 'pl' ? 'Aktywuj Pro z Stripe' : 'Activate Pro with Stripe'}</span>
        )}
      </button>

      {error && (
        <p className="text-[11px] font-medium text-rose-500 text-center animate-pulse">
          ⚠️ {error}
        </p>
      )}
    </div>
  )
}
