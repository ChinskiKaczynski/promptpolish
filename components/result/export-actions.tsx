'use client'

import { useState } from 'react'
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

export function ExportActions({
  analysisId,
  planSlug = 'free',
  improvedPrompt
}: ExportActionsProps) {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState('')

  const handleExportMarkdown = () => {
    if (!analysisId) return
    window.location.href = `/api/export/${analysisId}?format=markdown`
  }

  const handleExportTxt = () => {
    if (!analysisId) return
    window.location.href = `/api/export/${analysisId}?format=txt`
  }

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
    <div className="flex flex-wrap gap-3">
      {analysisId && (
        <>
          <button
            onClick={handleExportMarkdown}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#2A2A3A] bg-[#1C1C27] hover:border-[#3A3A52] hover:text-[#E2E8F0] px-4 py-2.5 text-xs font-semibold text-[#94A3B8] active:scale-[0.98] transition-all cursor-pointer"
          >
            <svg className="h-4 w-4 text-[#4A5568]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Eksportuj Markdown</span>
          </button>
          <button
            onClick={handleExportTxt}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#2A2A3A] bg-[#1C1C27] hover:border-[#3A3A52] hover:text-[#E2E8F0] px-4 py-2.5 text-xs font-semibold text-[#94A3B8] active:scale-[0.98] transition-all cursor-pointer"
          >
            <svg className="h-4 w-4 text-[#4A5568]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Eksportuj TXT</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#2A2A3A] bg-[#1C1C27] hover:border-[#3A3A52] hover:text-[#E2E8F0] px-4 py-2.5 text-xs font-semibold text-[#94A3B8] active:scale-[0.98] transition-all cursor-pointer"
          >
            <svg className="h-4 w-4 text-[#4A5568]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
  )
}
