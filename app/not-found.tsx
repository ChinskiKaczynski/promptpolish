import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50/30 px-6 py-20 font-sans text-slate-900 selection:bg-indigo-100 antialiased">
      {/* Decorative gradient blur spheres */}
      <div className="absolute top-1/4 right-1/4 -z-10 h-80 w-80 rounded-full bg-indigo-100/40 blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 -z-10 h-80 w-80 rounded-full bg-violet-100/40 blur-3xl" />

      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xl text-center space-y-8">
        {/* CSS-only Beautiful Search Icon Illustration */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-slate-950 to-slate-800 bg-clip-text text-transparent">
              Nie odnaleziono strony
            </h1>
            <p className="text-xs uppercase tracking-wider font-bold text-slate-400">
              Page or Result Not Found
            </p>
          </div>

          <div className="space-y-3.5 text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
            <p>
              Szukana strona, token udostępniania lub analiza nie istnieje, została usunięta lub upłynął okres jej przechowywania.
            </p>
            <p className="border-t border-slate-100 pt-3 text-xs italic text-slate-500">
              The page, share token, or prompt analysis you are looking for does not exist, was deleted, or has expired.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/analyze"
            className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-6 py-3.5 shadow-md shadow-indigo-100 transition active:scale-95 text-center"
          >
            Przeanalizuj prompt / Audit a Prompt
          </Link>
          <Link
            href="/"
            className="rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold px-6 py-3.5 transition active:scale-95 text-center"
          >
            Strona główna / Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}
