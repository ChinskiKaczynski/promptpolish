'use client'

import Link from 'next/link'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  featureName: string
}

export function UpgradeModal({ isOpen, onClose, featureName }: UpgradeModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-pp-bg/90 font-mono">
      <div className="relative w-full max-w-md border-2 border-pp-border-bright bg-pp-panel p-6 sm:p-8 shadow-[0_0_20px_rgba(124,58,237,0.5)] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-pp-muted hover:text-pp-text transition cursor-pointer"
        >
          <span className="font-bold text-sm">[X]</span>
        </button>

        {/* Header Icon */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center border-2 border-pp-border-bright bg-pp-primary text-white text-lg font-bold">
          ★
        </div>

        {/* Text */}
        <div className="mt-6 text-center space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-pp-cyan">{"// FUNKCJA_PRO_PREMIUM //"}</span>
          <h3 className="text-lg font-black tracking-tight text-white uppercase">
            Odblokuj {featureName}
          </h3>
          <p className="text-xs leading-relaxed text-pp-muted px-2">
            Ta funkcja jest zarezerwowana dla subskrybentów planu Pro. Podnieś jakość swojej pracy dzięki rozszerzonym narzędziom inżynierii promptów.
          </p>
        </div>

        {/* Pro features checklist */}
        <div className="mt-6 pp-inset p-4 space-y-3.5">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-pp-cyan text-sm font-bold">[✓]</span>
            <span className="text-pp-text">Eksport PDF w planie Pro</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-pp-cyan text-sm font-bold">[✓]</span>
            <span className="text-pp-text">Zwiększony limit do 500 analiz miesięcznie</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-pp-cyan text-sm font-bold">[✓]</span>
            <span className="text-pp-text">Wyższe limity długości instrukcji (24k znaków)</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-pp-cyan text-sm font-bold">[✓]</span>
            <span className="text-pp-text">Dostęp do modułu audytów zbiorczych (Batch Audit)</span>
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/pricing"
            className="pp-button pp-button-primary text-xs py-3 text-center"
          >
            POKAŻ CENNIK I PLANY
          </Link>
          <button
            onClick={onClose}
            className="pp-button text-xs py-3 border-pp-border"
          >
            ANULUJ
          </button>
        </div>
      </div>
    </div>
  )
}
