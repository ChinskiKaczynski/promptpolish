'use client'

import { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log unhandled exceptions to secure tracking systems (console for now)
    console.error('[Unhandled Application Boundary Error]:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0C0C10] px-6 py-20 font-sans text-[#E2E8F0] selection:bg-[#A78BFA]/20 antialiased">
      {/* Decorative gradient glowing spheres */}
      <div className="absolute top-1/4 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-[#F87171]/5 to-violet-900/10 opacity-80 blur-3xl" />

      <div className="w-full max-w-lg rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6 sm:p-10 text-center space-y-8">
        {/* Animated Error Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-[#F87171]/10 text-[#F87171] border border-[#F87171]/20">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-[#E2E8F0] font-heading">
              Coś poszło nie tak
            </h1>
            <p className="text-xs uppercase tracking-wider font-bold text-[#8290A2]">
              An unexpected error occurred
            </p>
          </div>

          <div className="space-y-3.5 text-sm text-[#94A3B8] leading-relaxed max-w-sm mx-auto">
            <p>
              Przepraszamy. Wystąpił niespodziewany błąd aplikacji. Ze względów bezpieczeństwa szczegóły błędu nie są wyświetlane.
            </p>
            <p className="border-t border-[#2A2A3A] pt-3 text-xs italic text-[#8290A2]">
              We apologize. An unexpected application error occurred. For security reasons, the system does not leak error details.
            </p>
          </div>
        </div>

        {/* Diagnostic Code (digest) */}
        {error.digest && (
          <div className="rounded-lg bg-[#0C0C10] border border-[#2A2A3A] p-2.5">
            <span className="font-mono text-xs font-bold text-[#8290A2] uppercase tracking-wider block">
              Kod diagnostyczny / Diagnostic ID
            </span>
            <span className="font-mono text-xs font-semibold text-[#94A3B8] select-all">
              {error.digest}
            </span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={() => reset()}
            className="rounded-lg gradient-btn text-white text-sm font-semibold px-6 py-3.5 transition active:scale-95"
          >
            Spróbuj ponownie / Try Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="rounded-lg border border-[#2A2A3A] bg-[#1C1C27] hover:bg-[#22223A] text-[#94A3B8] text-sm font-semibold px-6 py-3.5 transition active:scale-95 text-center flex items-center justify-center"
          >
            Strona główna / Go Home
          </button>
        </div>
      </div>
    </div>
  )
}
