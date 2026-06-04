'use client'

import { useState, useEffect } from 'react'

interface ShareSettingsProps {
  analysisId?: string
  isShareEnabledInitially: boolean
  shareTokenInitially: string | null
}

export function ShareSettings({
  analysisId,
  isShareEnabledInitially,
  shareTokenInitially
}: ShareSettingsProps) {
  const [isShareEnabled, setIsShareEnabled] = useState(isShareEnabledInitially)
  const [shareToken, setShareToken] = useState<string | null>(shareTokenInitially)
  const [isShareLinkCopied, setIsShareLinkCopied] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)

  const shareUrl = typeof window !== 'undefined' && shareToken
    ? `${window.location.origin}/share/${shareToken}`
    : ''

  const handleCopyShareLink = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setIsShareLinkCopied(true)
    } catch (err) {
      console.error('Failed to copy share link', err)
    }
  }

  useEffect(() => {
    if (isShareLinkCopied) {
      const timer = setTimeout(() => setIsShareLinkCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [isShareLinkCopied])

  const handleToggleShare = async () => {
    if (!analysisId) return
    setShareError(null)
    const targetState = !isShareEnabled

    try {
      if (targetState) {
        const res = await fetch('/api/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ analysis_id: analysisId })
        })

        if (!res.ok) {
          throw new Error('Nie udało się włączyć udostępniania publicznego.')
        }

        const data = await res.json()
        setIsShareEnabled(true)
        setShareToken(data.share_token)
      } else {
        const res = await fetch('/api/share/disable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ analysis_id: analysisId })
        })

        if (!res.ok) {
          throw new Error('Nie udało się wyłączyć udostępniania publicznego.')
        }

        setIsShareEnabled(false)
        setShareToken(null)
      }
    } catch (err: unknown) {
      const errorObject = err instanceof Error ? err : new Error(String(err))
      console.error(errorObject)
      setShareError(errorObject.message)
    }
  }

  if (!analysisId) return null

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Udostępnij raport</h3>
          <p className="mt-1 text-xs text-slate-500">
            Stwórz publiczny link. Domyślnie wyłączone (prywatny). Każdy z linkiem zobaczy treść promptu i raport.
          </p>
        </div>

        {/* Toggle Switch */}
        <button
          onClick={handleToggleShare}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            isShareEnabled ? 'bg-indigo-600' : 'bg-slate-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              isShareEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <div className="mt-6">
        {shareError && (
          <p className="text-xs font-semibold text-red-600 mb-2">⚠️ {shareError}</p>
        )}

        {isShareEnabled && shareToken ? (
          <div className="space-y-2.5 animate-fadeIn">
            <label className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 block">Publiczny adres URL:</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-500 focus:outline-none"
              />
              <button
                onClick={handleCopyShareLink}
                className="shrink-0 rounded-2xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white px-4 py-2.5 transition-colors cursor-pointer"
              >
                {isShareLinkCopied ? 'Skopiowano!' : 'Kopiuj'}
              </button>
            </div>

            {/* Public link safety warning block */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-3 text-[10px] leading-relaxed text-amber-900 flex gap-2">
              <svg className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <strong className="block mb-0.5">Uwaga: Raport staje się publiczny!</strong>
                Każdy, kto posiada ten adres URL, będzie mógł go wyświetlić. Prywatne tokeny sesji i dane techniczne są ukrywane, lecz zachowaj ostrożność.
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center">
            <span className="text-xs font-medium text-slate-400">
              Włącz przełącznik, aby wygenerować link udostępniania.
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
