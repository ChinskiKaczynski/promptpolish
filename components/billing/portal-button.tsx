'use client'

import { useState } from 'react'

interface PortalButtonProps {
  lang?: 'pl' | 'en'
}

export function PortalButton({ lang = 'pl' }: PortalButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpenPortal = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || (lang === 'pl' ? 'Nie udało się otworzyć portalu.' : 'Failed to open billing portal.'))
      }

      const { portalUrl } = await response.json()
      if (portalUrl) {
        window.location.href = portalUrl
      } else {
        throw new Error(lang === 'pl' ? 'Brak adresu portalu.' : 'No portal URL provided.')
      }
    } catch (err) {
      console.error('Portal session error:', err)
      setError(err instanceof Error ? err.message : String(err))
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full space-y-2">
      <button
        onClick={handleOpenPortal}
        disabled={isLoading}
        className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50/50 px-4 py-2.5 text-xs font-bold text-indigo-600 shadow-sm transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer gap-2"
      >
        {isLoading ? (
          <>
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            <span>{lang === 'pl' ? 'Ładowanie portalu...' : 'Loading portal...'}</span>
          </>
        ) : (
          <span>{lang === 'pl' ? 'Zarządzaj subskrypcją i rozliczeniami' : 'Manage subscription & billing'}</span>
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
