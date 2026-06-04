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
    <div className="flex flex-wrap gap-3 font-mono">
      {analysisId && (
        <>
          <button
            onClick={handleExportMarkdown}
            className="pp-button text-xs py-2 px-4"
          >
            <span>[EXP_MD]</span>
          </button>
          <button
            onClick={handleExportTxt}
            className="pp-button text-xs py-2 px-4"
          >
            <span>[EXP_TXT]</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="pp-button text-xs py-2 px-4 border-pp-border-bright hover:border-pp-cyan"
          >
            <span>[EXP_PDF]</span>
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
