'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { CopyButton } from './copy-button'

const UpgradeModal = dynamic(() => import('./upgrade-modal').then((mod) => mod.UpgradeModal), {
  ssr: false
})

interface ExportActionsProps {
  analysisId?: string
  planSlug?: 'free' | 'pro'
  improvedPrompt: string
}

interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
}

let toastCounter = 0

export function ExportActions({
  analysisId,
  planSlug = 'free',
  improvedPrompt
}: ExportActionsProps) {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState('')
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = ++toastCounter
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const triggerDownload = useCallback(
    (format: 'markdown' | 'txt', label: string) => {
      if (!analysisId) return
      try {
        window.location.href = `/api/export/${analysisId}?format=${format}`
        addToast(`Pobieranie ${label} zostało rozpoczęte.`, 'success')
      } catch {
        addToast(`Nie udało się rozpocząć pobierania. Spróbuj ponownie.`, 'error')
      }
    },
    [analysisId, addToast]
  )

  const handleExportMarkdown = () => triggerDownload('markdown', 'Markdown')
  const handleExportTxt = () => triggerDownload('txt', 'TXT')

  const handleExportPdf = () => {
    if (!analysisId) return
    if (planSlug === 'pro') {
      window.location.href = `/api/export/${analysisId}?format=pdf`
    } else {
      setSelectedFeature('Eksport PDF')
      setIsUpgradeModalOpen(true)
    }
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {analysisId && (
          <>
            <button
              onClick={handleExportMarkdown}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#2A2A3A] bg-[#1C1C27] hover:border-[#3A3A52] hover:text-[#E2E8F0] px-4 py-2.5 text-xs font-semibold text-[#94A3B8] active:scale-[0.98] transition-all cursor-pointer"
            >
              <svg className="h-4 w-4 text-[#8290A2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Eksportuj Markdown</span>
            </button>
            <button
              onClick={handleExportTxt}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#2A2A3A] bg-[#1C1C27] hover:border-[#3A3A52] hover:text-[#E2E8F0] px-4 py-2.5 text-xs font-semibold text-[#94A3B8] active:scale-[0.98] transition-all cursor-pointer"
            >
              <svg className="h-4 w-4 text-[#8290A2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Eksportuj TXT</span>
            </button>
            <button
              onClick={handleExportPdf}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#2A2A3A] bg-[#1C1C27] hover:border-[#3A3A52] hover:text-[#E2E8F0] px-4 py-2.5 text-xs font-semibold text-[#94A3B8] active:scale-[0.98] transition-all cursor-pointer"
            >
              <svg className="h-4 w-4 text-[#8290A2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Eksportuj PDF</span>
            </button>
          </>
        )}
        
        <CopyButton text={improvedPrompt} analysisId={analysisId} variant="primary" />

        <UpgradeModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
          featureName={selectedFeature}
        />
      </div>

      {/* Inline toast notifications — no external library */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[9998] flex flex-col gap-2 pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-xs font-semibold shadow-2xl backdrop-blur-md pointer-events-auto animate-in slide-in-from-bottom-4 fade-in duration-200 ${
                toast.type === 'success'
                  ? 'border-[#6EE7B7]/30 bg-[#0C0C10]/95 text-[#6EE7B7]'
                  : 'border-[#F87171]/30 bg-[#0C0C10]/95 text-[#F87171]'
              }`}
            >
              <span>{toast.type === 'success' ? '✓' : '✗'}</span>
              <span>{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                aria-label="Zamknij powiadomienie"
                className="ml-2 text-[#8290A2] hover:text-[#E2E8F0] transition cursor-pointer"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
