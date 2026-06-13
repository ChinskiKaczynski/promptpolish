import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0C0C10] px-6 py-20 font-sans text-[#E2E8F0] selection:bg-[#A78BFA]/20 antialiased">
      {/* Decorative gradient blur spheres */}
      <div className="absolute top-1/4 right-1/4 -z-10 h-80 w-80 rounded-full bg-violet-900/15 blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 -z-10 h-80 w-80 rounded-full bg-indigo-900/10 blur-3xl" />

      <div className="w-full max-w-lg rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6 sm:p-10 text-center space-y-8">
        {/* CSS-only Beautiful Search Icon Illustration */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-[#A78BFA]/10 text-[#A78BFA] border border-[#A78BFA]/20">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-[#E2E8F0] font-heading">
              Nie odnaleziono strony
            </h1>
            <p className="text-xs uppercase tracking-wider font-bold text-[#8290A2]">
              Page or Result Not Found
            </p>
          </div>

          <div className="space-y-3.5 text-sm text-[#94A3B8] leading-relaxed max-w-sm mx-auto">
            <p>
              Szukana strona, token udostępniania lub analiza nie istnieje, została usunięta lub upłynął okres jej przechowywania.
            </p>
            <p className="border-t border-[#2A2A3A] pt-3 text-xs italic text-[#8290A2]">
              The page, share token, or prompt analysis you are looking for does not exist, was deleted, or has expired.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/analyze"
            className="rounded-lg gradient-btn text-white text-sm font-semibold px-6 py-3.5 transition active:scale-95 text-center"
          >
            Przeanalizuj prompt / Audit a Prompt
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-[#2A2A3A] bg-[#1C1C27] hover:bg-[#22223A] text-[#94A3B8] text-sm font-semibold px-6 py-3.5 transition active:scale-95 text-center"
          >
            Strona główna / Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}
