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
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50/50 px-6 py-20 font-sans text-slate-900 selection:bg-indigo-100 antialiased">
      {/* Decorative gradient glowing spheres */}
      <div className="absolute top-1/4 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-rose-100 to-indigo-100 opacity-60 blur-3xl" />

      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xl text-center space-y-8">
        {/* Animated Error Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 animate-pulse">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-slate-950">
              Coś poszło nie tak
            </h1>
            <p className="text-xs uppercase tracking-wider font-bold text-slate-400">
              An unexpected error occurred
            </p>
          </div>

          <div className="space-y-3.5 text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
            <p>
              Przepraszamy. Wystąpił niespodziewany błąd aplikacji. Ze względów bezpieczeństwa szczegóły błędu nie są wyświetlane.
            </p>
            <p className="border-t border-slate-100 pt-3 text-xs italic text-slate-500">
              We apologize. An unexpected application error occurred. For security reasons, the system does not leak error details.
            </p>
          </div>
        </div>

        {/* Diagnostic Code (digest) */}
        {error.digest && (
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5">
            <span className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Kod diagnostyczny / Diagnostic ID
            </span>
            <span className="font-mono text-xs font-semibold text-slate-600 select-all">
              {error.digest}
            </span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={() => reset()}
            className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-6 py-3.5 shadow-md shadow-indigo-100 transition active:scale-95"
          >
            Spróbuj ponownie / Try Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold px-6 py-3.5 transition active:scale-95 text-center flex items-center justify-center"
          >
            Strona główna / Go Home
          </button>
        </div>
      </div>
    </div>
  )
}
