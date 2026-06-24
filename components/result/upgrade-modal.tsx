'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  featureName: string
}

export function UpgradeModal({ isOpen, onClose, featureName }: UpgradeModalProps) {
  const [mounted, setMounted] = useState(false)

  // Ensure portal target document.body is available only on the client
  useEffect(() => {
    let active = true
    setTimeout(() => {
      if (active) {
        setMounted(true)
      }
    }, 0)
    return () => {
      active = false
    }
  }, [])

  // Lock scrolling when the modal is open
  useEffect(() => {
    if (!isOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !mounted) return null

  const modalLayout = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
      aria-describedby="upgrade-modal-desc"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 transition-all duration-300"
      onClick={(e) => {
        // Dismiss if clicking directly on the backdrop container
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="relative w-full max-w-md rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Zamknij okno"
          className="absolute right-6 top-6 rounded-xl border border-[#2A2A3A] bg-[#0C0C10] p-2 text-[#8290A2] hover:text-[#E2E8F0] transition cursor-pointer"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header Icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[#A78BFA]/10 text-[#A78BFA] border border-[#A78BFA]/20">
          <svg className="h-6 w-6 text-[#A78BFA]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>

        {/* Text */}
        <div className="mt-6 text-center space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#A78BFA]">Funkcja Premium Pro</span>
          <h3 id="upgrade-modal-title" className="text-xl font-extrabold tracking-tight text-[#E2E8F0] font-heading">
            Odblokuj {featureName}
          </h3>
          <p id="upgrade-modal-desc" className="text-xs leading-relaxed text-[#94A3B8] px-2">
            Ta funkcja jest zarezerwowana dla subskrybentów planu <strong>Pro</strong>. Podnieś jakość swojej pracy dzięki rozszerzonym narzędziom inżynierii promptów.
          </p>
        </div>

        {/* Pro features checklist */}
        <div className="mt-6 rounded-lg bg-[#0C0C10] border border-[#2A2A3A] p-4 space-y-3.5">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-[#A78BFA] text-sm font-bold">✓</span>
            <span className="text-[#94A3B8]">Eksport PDF w planie Pro</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-[#A78BFA] text-sm font-bold">✓</span>
            <span className="text-[#94A3B8]">Zwiększony limit do 500 analyses miesięcznie</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-[#A78BFA] text-sm font-bold">✓</span>
            <span className="text-[#94A3B8]">Wyższe limity długości instrukcji (24k znaków)</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-[#A78BFA] text-sm font-bold">✓</span>
            <span className="text-[#94A3B8]">Dostęp do modułu audytów zbiorczych (Batch Audit)</span>
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/pricing"
            onClick={onClose}
            className="w-full text-center rounded-lg gradient-btn text-white font-bold py-3 text-xs active:scale-[0.98] transition-all cursor-pointer"
          >
            Zobacz Cennik i plany
          </Link>
          <button
            onClick={onClose}
            className="w-full rounded-lg border border-[#2A2A3A] bg-[#1C1C27] hover:bg-[#22223A] py-3 text-xs font-bold text-[#94A3B8] transition cursor-pointer"
          >
            Wróć do darmowej wersji
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalLayout, document.body)
}
