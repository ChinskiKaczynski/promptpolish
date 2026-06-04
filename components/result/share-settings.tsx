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
    <div className="pp-panel p-6 border-2 border-pp-border flex flex-col justify-between font-mono relative">
      <div className="absolute top-0 right-4 -translate-y-1/2 bg-pp-bg px-2 text-[9px] font-bold text-pp-cyan tracking-widest uppercase">
        {"// UDOSTĘPNIANIE"}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-bold text-pp-text uppercase tracking-wider">Status widoczności raportu</h3>
          <p className="mt-1 text-[11px] text-pp-muted">
            Stwórz publiczny link. Domyślnie wyłączone. Każdy z linkiem zobaczy raport.
          </p>
        </div>

        {/* Retro Toggle Button */}
        <button
          onClick={handleToggleShare}
          className={`pp-button text-[10px] py-1.5 px-3 shrink-0 ${
            isShareEnabled ? 'pp-button-primary' : 'border-pp-border'
          }`}
        >
          {isShareEnabled ? 'WIDOCZNY [WŁ]' : 'PRYWATNY [WYŁ]'}
        </button>
      </div>

      <div className="mt-6">
        {shareError && (
          <p className="text-xs font-bold text-pp-danger mb-2">⚠️ {shareError}</p>
        )}

        {isShareEnabled && shareToken ? (
          <div className="space-y-3">
            <label className="text-[9px] font-bold uppercase tracking-wider text-pp-cyan block">Publiczny adres URL:</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="pp-input flex-1 min-w-0 text-xs text-pp-muted"
              />
              <button
                onClick={handleCopyShareLink}
                className="pp-button text-xs py-2 px-3 border-pp-border-bright"
              >
                {isShareLinkCopied ? 'SKOPIOWANO!' : 'KOPIUJ'}
              </button>
            </div>

            {/* Public link safety warning block */}
            <div className="border border-pp-warning bg-pp-warning/10 p-3 text-[10px] leading-relaxed text-pp-warning flex gap-2">
              <span className="text-sm font-bold">!</span>
              <div>
                <strong className="block mb-0.5">UWAGA: RAPORT UPUBLICZNIONY</strong>
                Każdy, kto posiada ten adres URL, będzie mógł wyświetlić wyniki. Twoje prywatne ciasteczka sesji są bezpieczne, ale dane promptu będą widoczne.
              </div>
            </div>
          </div>
        ) : (
          <div className="pp-inset p-4 text-center">
            <span className="text-[11px] text-pp-muted uppercase tracking-wider">
              PRYWATNY RAPORT // AKTYWUJ PRZEŁĄCZNIK ABY GENEROWAĆ URL
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
