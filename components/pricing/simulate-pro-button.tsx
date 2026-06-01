'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SimulateProButtonProps {
  isPro: boolean
}

export function SimulateProButton({ isPro }: SimulateProButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleActivate = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/entitlements/simulate-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        router.refresh()
      } else {
        const data = await response.json().catch(() => ({}))
        setError(data.error || 'Failed to activate Pro simulation')
      }
    } catch (err) {
      console.error('Error activating Pro simulation:', err)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-1.5 w-full">
      <button
        onClick={handleActivate}
        disabled={loading}
        className="w-full text-center rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white font-semibold py-2 text-xs border border-slate-800 transition active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading
          ? 'Przetwarzanie...'
          : isPro
          ? 'Pro aktywne — odśwież status'
          : 'Aktywuj Symulację Pro (Wersja Demo)'}
      </button>
      {error && (
        <p className="text-[10px] text-center text-rose-500 font-semibold animate-pulse mt-1">
          ⚠️ {error}
        </p>
      )}
    </div>
  )
}
