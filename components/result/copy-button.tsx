'use client'

import { useState, useEffect } from 'react'

interface CopyButtonProps {
  text: string
  analysisId?: string
  variant?: 'primary' | 'secondary'
}

export function CopyButton({ text, analysisId, variant = 'primary' }: CopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setIsCopied(true)
    } catch (err) {
      console.error('Failed to copy text', err)
    }

    if (analysisId) {
      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_type: 'copy_improved_prompt', analysis_id: analysisId })
      }).catch(() => {})
    }
  }

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => setIsCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [isCopied])

  if (variant === 'primary') {
    return (
      <button
        onClick={handleCopy}
        className="pp-button pp-button-primary text-xs py-2 px-4 flex items-center gap-2"
      >
        {isCopied ? (
          <>
            <span className="text-pp-cyan animate-pulse">✓</span>
            <span>SKOPIOWANO!</span>
          </>
        ) : (
          <>
            <span>[KOP]</span>
            <span>SKOPIUJ ULEPSZONY PROMPT</span>
          </>
        )}
      </button>
    )
  }

  return (
    <button
      onClick={handleCopy}
      className="pp-button text-[10px] py-1 px-3 border-pp-border"
    >
      {isCopied ? (
        <>
          <span className="text-pp-cyan">✓</span>
          <span className="text-pp-cyan">SKOPIOWANO!</span>
        </>
      ) : (
        <>
          <span>KOP_TEKST</span>
        </>
      )}
    </button>
  )
}
