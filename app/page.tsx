import Link from 'next/link'
import { AppHeader } from '@/components/layout/app-header'
import { AppFooter } from '@/components/layout/app-footer'
import { LogoIcon } from '@/components/ui/logo'

export default async function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0C0C10] font-sans text-[#E2E8F0] selection:bg-[#A78BFA]/20 antialiased">
      <AppHeader />

      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-6 pt-20 pb-24 lg:pt-28 lg:pb-32">
          {/* Subtle top background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(167,139,250,0.08),rgba(0,0,0,0))] -z-10" />

          <div className="mx-auto max-w-6xl">
            <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#2A2A3A] bg-[#1C1C27] px-3.5 py-1 text-xs font-semibold text-[#6EE7B7]">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#6EE7B7] opacity-60"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#6EE7B7]"></span>
                  </span>
                  Darmowy audyt promptu bez rejestracji
                </div>
                
                <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-[#E2E8F0] font-heading sm:text-5xl lg:text-6xl leading-[1.1]">
                  Audytuj. Ulepszaj.<br />
                  Podnoś jakość <span className="gradient-text">każdego promptu.</span>
                </h1>
                
                <p className="mt-6 text-base leading-relaxed text-[#94A3B8] max-w-xl">
                  PromptPolish analizuje Twoje prompty, ocenia kluczowe parametry i dostarcza gotowe do wdrożenia usprawnienia, aby uzyskać lepsze wyniki z dowolnego modelu AI.
                </p>

                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Link 
                    className="inline-flex items-center justify-center rounded-lg gradient-btn px-7 py-4 text-center text-sm font-bold text-white active:scale-95 transition-all cursor-pointer" 
                    href="/analyze"
                  >
                    Rozpocznij bezpłatnie
                    <svg className="ml-2 h-4 w-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                  <a 
                    className="inline-flex items-center justify-center rounded-lg border border-[#2A2A3A] bg-[#13131A] hover:bg-[#1C1C27] hover:border-[#3A3A52] px-7 py-4 text-center text-sm font-semibold text-[#94A3B8] active:scale-95 transition-all" 
                    href="#features"
                  >
                    <svg className="mr-2 h-4 w-4 text-[#8290A2]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Zobacz możliwości
                  </a>
                </div>

                {/* Hero bullet points matching screenshot */}
                <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-[#2A2A3A]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1C1C27] border border-[#2A2A3A] text-[#A78BFA]">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#E2E8F0]">Lepsze wyniki</h4>
                      <p className="text-[11px] text-[#8290A2]">Wyższa jakość odpowiedzi</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1C1C27] border border-[#2A2A3A] text-[#A78BFA]">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#E2E8F0]">Oszczędność czasu</h4>
                      <p className="text-[11px] text-[#8290A2]">Iteruj z pewnością</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1C1C27] border border-[#2A2A3A] text-[#A78BFA]">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a2 2 0 002 2h3a1 1 0 011 1v3a2 2 0 002 2 2 2 0 010 4 2 2 0 00-2 2v3a1 1 0 01-1 1h-3a2 2 0 00-2-2 2 2 0 01-4 0 2 2 0 00-2 2H4a1 1 0 01-1-1v-3a2 2 0 00-2-2 2 2 0 010-4 2 2 0 002-2V7a1 1 0 011-1h3a2 2 0 002-2V4z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#E2E8F0]">Działa wszędzie</h4>
                      <p className="text-[11px] text-[#8290A2]">Modele LLM, aplikacje, API</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pixel-perfect HTML/CSS app mockup replica from the screenshot */}
              <div className="relative rounded-2xl border border-[#2A2A3A] bg-[#13131A] p-2 shadow-[0_0_0_1px_#2A2A3A,0_8px_48px_-8px_rgba(0,0,0,0.7)] glow-violet">
                {/* Demo badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 inline-flex items-center gap-1.5 rounded-full border border-[#A78BFA]/30 bg-[#13131A] px-3 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#A78BFA]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#A78BFA] animate-pulse" aria-hidden="true" />
                  DEMO / Przykładowy wynik
                </div>
                <div className="rounded-[18px] border border-[#1E1E2E] bg-[#0C0C10] overflow-hidden grid grid-cols-[160px_1fr] h-[480px]">
                  
                  {/* Mockup Sidebar */}
                  <div className="border-r border-[#1E1E2E] bg-[#13131A] p-4 flex flex-col justify-between">
                    <div>
                      {/* Star brand logo */}
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-[#7C3AED]/10 border border-[#A78BFA]/20">
                          <LogoIcon className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-bold text-[#E2E8F0] tracking-tight font-sans">PromptPolish</span>
                      </div>

                      {/* New Audit button */}
                      <div className="mt-6">
                        <div className="rounded-md bg-[#A78BFA]/10 text-[#A78BFA] border border-[#A78BFA]/20 py-1.5 px-3 text-[10px] font-bold flex items-center gap-1.5 cursor-pointer">
                          <span>+</span> Nowy audyt
                        </div>
                      </div>

                      {/* Nav list */}
                      <nav className="mt-5 space-y-1">
                        <div className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[10px] font-semibold text-[#8290A2]">
                          <span>📊</span> Dashboard (Wkrótce)
                        </div>
                        <div className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[10px] font-semibold text-[#8290A2]">
                          <span>🕒</span> Historia
                        </div>
                        <div className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[10px] font-semibold text-[#8290A2]">
                          <span>📚</span> Biblioteka (Wkrótce)
                        </div>
                        <div className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[10px] font-semibold text-[#8290A2]">
                          <span>📋</span> Szablony (Wkrótce)
                        </div>
                        <div className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[10px] font-semibold text-[#8290A2]">
                          <span>⚙️</span> Ustawienia (Wkrótce)
                        </div>
                      </nav>
                    </div>

                    {/* Usage billing meter at bottom of sidebar */}
                    <div className="rounded-lg border border-[#2A2A3A] p-2.5 space-y-2 bg-[#1C1C27]">
                      <div className="flex items-center justify-between text-[9px] font-bold text-[#94A3B8]">
                        <span>Plan Pro</span>
                      </div>
                      <p className="text-[8px] text-[#8290A2]">Reset za 12 dni</p>
                      <div className="h-1.5 w-full rounded-full bg-[#2A2A3A] overflow-hidden">
                        <div className="h-full bg-[#A78BFA] rounded-full" style={{ width: '49%' }} />
                      </div>
                      <div className="flex items-center justify-between text-[8px] font-bold text-[#94A3B8]">
                        <span>248 / 500</span>
                      </div>
                    </div>
                  </div>

                  {/* Mockup Main content area */}
                  <div className="p-4 flex flex-col bg-[#0C0C10] overflow-y-auto">
                    
                    {/* Mockup header */}
                    <div className="flex items-center justify-between border-b border-[#2A2A3A] pb-3 shrink-0">
                      <div>
                        <span className="inline-flex items-center rounded-md bg-[#1C1C27] border border-[#3A3A52] px-1.5 py-0.5 text-[8px] font-semibold text-[#A78BFA] uppercase tracking-wider">
                          Prywatny audyt
                        </span>
                        <h4 className="text-[10px] font-bold text-[#E2E8F0] mt-0.5">Raport audytu promptu</h4>
                      </div>
                      <button className="rounded border border-[#2A2A3A] px-2 py-0.5 text-[8px] font-semibold text-[#94A3B8] flex items-center gap-1 hover:bg-[#1C1C27]" aria-label="Eksportuj raport">
                        Eksportuj ▼
                      </button>
                    </div>

                    {/* Score Display Card */}
                    <div className="mt-3 relative flex items-center justify-between overflow-hidden rounded-xl border border-[#A78BFA]/20 bg-[#A78BFA]/5 p-3 shadow-sm shrink-0">
                      <div className="space-y-1">
                        <p className="text-[7px] font-mono font-bold uppercase tracking-[0.1em] text-[#8290A2]">Ogólna Ocena Jakości</p>
                        <h5 className="text-xs font-bold text-[#A78BFA]">Bardzo dobry</h5>
                        <p className="text-[8px] leading-snug text-[#94A3B8] max-w-[140px]">Prompt jest solidny, wymaga jedynie kosmetycznych usprawnień.</p>
                      </div>

                      {/* Mini SVG circular progress meter */}
                      <div className="relative h-12 w-12 shrink-0 rounded-full bg-[#1C1C27] flex items-center justify-center border border-[#2A2A3A]">
                        <svg className="h-[40px] w-[40px] -rotate-90">
                          <circle cx="20" cy="20" r="16" className="stroke-[#1C1C27]" strokeWidth="3.5" fill="transparent" />
                          <circle cx="20" cy="20" r="16" className="stroke-[#A78BFA]" strokeWidth="3.5" fill="transparent" strokeDasharray="100.5" strokeDashoffset="18" strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-[10px] font-black text-[#E2E8F0] font-mono leading-none">82</span>
                          <span className="text-[5px] font-mono font-bold text-[#8290A2] mt-0.5">/ 100</span>
                        </div>
                      </div>
                    </div>

                    {/* Details Breakdown */}
                    <div className="mt-3 space-y-2 border-t border-[#2A2A3A]/30 pt-3 shrink-0">
                      <div className="flex items-center justify-between text-[8px] font-bold text-[#8290A2] uppercase tracking-wider">
                        <span>Kryteria szczegółowe</span>
                        <span className="text-[#A78BFA]">3 z 10 Parametrów</span>
                      </div>

                      <div className="space-y-2">
                        {/* Criterion 1: Jasność celu */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[8px]">
                            <span className="font-semibold text-[#E2E8F0]">Jasność celu</span>
                            <span className="rounded bg-[#A78BFA]/10 border border-[#A78BFA]/20 px-1 py-0.2 text-[7px] font-bold text-[#A78BFA]">8 / 10</span>
                          </div>
                          <div className="h-1 w-full bg-[#1C1C27] rounded-full overflow-hidden border border-[#2A2A3A]/20">
                            <div className="h-full bg-gradient-to-r from-[#7C3AED] to-[#A78BFA] rounded-full" style={{ width: '80%' }} />
                          </div>
                        </div>

                        {/* Criterion 2: Kompletność kontekstu */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[8px]">
                            <span className="font-semibold text-[#E2E8F0]">Kompletność kontekstu</span>
                            <span className="rounded bg-[#6EE7B7]/10 border border-[#6EE7B7]/20 px-1 py-0.2 text-[7px] font-bold text-[#6EE7B7]">9 / 10</span>
                          </div>
                          <div className="h-1 w-full bg-[#1C1C27] rounded-full overflow-hidden border border-[#2A2A3A]/20">
                            <div className="h-full bg-gradient-to-r from-[#059669] to-[#6EE7B7] rounded-full" style={{ width: '90%' }} />
                          </div>
                        </div>

                        {/* Criterion 3: Definicje ograniczeń */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[8px]">
                            <span className="font-semibold text-[#E2E8F0]">Definicje ograniczeń</span>
                            <span className="rounded bg-[#A78BFA]/10 border border-[#A78BFA]/20 px-1 py-0.2 text-[7px] font-bold text-[#A78BFA]">7 / 10</span>
                          </div>
                          <div className="h-1 w-full bg-[#1C1C27] rounded-full overflow-hidden border border-[#2A2A3A]/20">
                            <div className="h-full bg-gradient-to-r from-[#7C3AED] to-[#A78BFA] rounded-full" style={{ width: '70%' }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Original Prompt Collapsible */}
                    <div className="mt-3 border-t border-[#2A2A3A]/30 pt-3 shrink-0">
                      <div className="flex items-center justify-between rounded-lg border border-[#2A2A3A] bg-[#13131A] px-3 py-1.5 text-[8px] font-semibold text-[#E2E8F0]">
                        <span>Oryginalny prompt</span>
                        <span className="text-[#8290A2]">▼</span>
                      </div>
                    </div>

                    {/* Improved Prompt Block */}
                    <div className="mt-3 overflow-hidden rounded-lg border border-[#2A2A3A] bg-[#0C0C10] shadow-md flex-grow flex flex-col min-h-[120px]">
                      {/* Editor Top Bar */}
                      <div className="flex items-center justify-between border-b border-[#2A2A3A] bg-[#13131A] px-3 py-1.5 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-0.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500/85" />
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500/85" />
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/85" />
                          </div>
                          <span className="text-[7px] font-semibold uppercase tracking-widest text-[#94A3B8] border-l border-[#2A2A3A] pl-1.5">
                            POPRAWIONY PROMPT
                          </span>
                        </div>
                        <span className="rounded border border-[#2A2A3A] bg-[#1C1C27] px-1 py-0.2 text-[7px] font-bold text-[#8290A2]">
                          Kopiuj
                        </span>
                      </div>
                      
                      {/* Editor Code Area */}
                      <div className="p-3 font-mono text-[8px] leading-relaxed text-[#E2E8F0] space-y-1 overflow-y-auto flex-1">
                        <div className="flex items-start">
                          <span className="select-none w-3 text-right text-[#8290A2] shrink-0 pr-1.5 border-r border-[#2A2A3A]/40 font-mono">1</span>
                          <code className="pl-2 whitespace-pre-wrap break-words font-mono text-[#E2E8F0] block flex-1">
                            Napisz szczegółowy post na blogu o długości około 1000 słów
                          </code>
                        </div>
                        <div className="flex items-start">
                          <span className="select-none w-3 text-right text-[#8290A2] shrink-0 pr-1.5 border-r border-[#2A2A3A]/40 font-mono">2</span>
                          <code className="pl-2 whitespace-pre-wrap break-words font-mono text-[#E2E8F0] block flex-1">
                            na temat wpływu generatywnej sztucznej inteligencji na pracę
                          </code>
                        </div>
                        <div className="flex items-start">
                          <span className="select-none w-3 text-right text-[#8290A2] shrink-0 pr-1.5 border-r border-[#2A2A3A]/40 font-mono">3</span>
                          <code className="pl-2 whitespace-pre-wrap break-words font-mono text-[#E2E8F0] block flex-1">
                            biurową, uwzględniając konkretne przykłady narzędzi.
                          </code>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>



        {/* Benefits Section */}
        <section id="features" className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center">
            <h2 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#A78BFA]">Wszystko, czego potrzebujesz do tworzenia lepszych promptów</h2>
            <p className="mt-3 text-3xl font-bold tracking-tight text-[#E2E8F0] font-heading sm:text-4xl">
              Co zyskujesz dzięki PromptPolish?
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-[#94A3B8] text-sm">
              Analizujemy prompty na poziomie inżynieryjnym, dostarczając precyzyjnych narzędzi do natychmiastowej poprawy komunikacji z LLM.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <article className="group rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6 hover:border-[#3A3A52] hover:bg-[#1C1C27] transition-all duration-200">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#A78BFA]/10 border border-[#A78BFA]/20 text-[#A78BFA] mb-5">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-[#E2E8F0] font-heading">Głęboki audyt promptów</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-[#94A3B8]">
                Wielwymiarowa ocena pod kątem jasności, precyzji, kontekstu i innych parametrów. Koniec ze zgadywaniem.
              </p>
            </article>

            <article className="group rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6 hover:border-[#3A3A52] hover:bg-[#1C1C27] transition-all duration-200">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#6EE7B7]/10 border border-[#6EE7B7]/20 text-[#6EE7B7] mb-5">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-[#E2E8F0] font-heading">Inteligentne sugestie</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-[#94A3B8]">
                Gotowe do wdrożenia usprawnienia dostosowane do Twoich celów. Precyzyjnie wskazane luki i zalecenia.
              </p>
            </article>

            <article className="group rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6 hover:border-[#3A3A52] hover:bg-[#1C1C27] transition-all duration-200">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#A78BFA]/10 border border-[#A78BFA]/20 text-[#A78BFA] mb-5">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-[#E2E8F0] font-heading">Biblioteka promptów (Wkrótce)</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-[#94A3B8]">
                Organizuj, wersjonuj i używaj ponownie swoich najlepszych promptów. Wszystko w jednym bezpiecznym miejscu.
              </p>
            </article>

            <article className="group rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6 hover:border-[#3A3A52] hover:bg-[#1C1C27] transition-all duration-200">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#6EE7B7]/10 border border-[#6EE7B7]/20 text-[#6EE7B7] mb-5">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-[#E2E8F0] font-heading">Śledź i udoskonalaj (Wkrótce)</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-[#94A3B8]">
                Monitoruj jakość w czasie i stale podnoś poprawność instrukcji. Rozwijaj swoje kompetencje razem z nami.
              </p>
            </article>
          </div>
        </section>

        {/* Metric Strip Section replacing the testimonials */}
        <section className="border-y border-[#2A2A3A] bg-[#13131A] py-10 px-6">
          <div className="mx-auto max-w-4xl grid grid-cols-2 sm:grid-cols-3 gap-6 text-center">
            {[
              { value: '100%', label: 'Anonimowy — bez rejestracji' },
              { value: '10 kryteriów', label: 'Inżynierii promptów w każdym audycie' },
              { value: '0 PLN', label: 'Podstawowy dostęp na zawsze' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold font-mono text-[#A78BFA]">{stat.value}</p>
                <p className="mt-1 text-xs text-[#8290A2] leading-snug">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Target Users Section */}
        <section className="border-b border-[#2A2A3A] px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h2 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#A78BFA]">Dla Kogo?</h2>
              <p className="mt-3 text-3xl font-bold tracking-tight text-[#E2E8F0] font-heading sm:text-4xl">
                Zaprojektowany dla każdego
              </p>
              <p className="mx-auto mt-4 max-w-2xl text-[#94A3B8] text-sm">
                Sprawdź, jak PromptPolish pomaga w nauce, pracy i codziennych projektach ze sztuczną inteligencją.
              </p>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  role: 'Studenci i uczniowie',
                  benefit: 'Twórz lepsze konspekty nauki, dopracowuj zapytania do prac badawczych i szybciej przyswajaj wiedzę dzięki trafnym instrukcjom dla modeli AI.'
                },
                {
                  role: 'Twórcy i freelancerzy',
                  benefit: 'Ulepszaj prompty generujące grafiki, scenariusze czy posty. Buduj unikalny styl i oszczędzaj czas przy tworzeniu kreatywnych treści.'
                },
                {
                  role: 'Pracownicy biurowi i marketerzy',
                  benefit: 'Piszesz newslettery, raporty lub analizujesz dane? Zdobądź pewność, że AI dokładnie zrozumie Twoje intencje i wygeneruje bezbłędne odpowiedzi.'
                },
                {
                  role: 'Założyciele i programiści',
                  benefit: 'Optymalizuj zapytania systemowe w swoich aplikacjach i automatyzuj procesy z pełną precyzją, bez marnowania tokenów i czasu na nieudane próby.'
                }
              ].map((user, i) => (
                <div key={i} className="flex flex-col rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6 hover:border-[#3A3A52] transition-all duration-200">
                  <h3 className="text-sm font-bold text-[#E2E8F0] font-heading">{user.role}</h3>
                  <p className="mt-2.5 text-[11px] leading-relaxed text-[#8290A2] flex-grow">{user.benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works (Flow Explanation) Section */}
        <section className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <div className="text-center">
            <h2 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#A78BFA]">Proces</h2>
            <p className="mt-3 text-3xl font-bold tracking-tight text-[#E2E8F0] font-heading sm:text-4xl">
              Jak przebiega audyt promptu?
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-[#94A3B8] text-sm">
              Proste, bezwysiłkowe flow w 4 krokach, zrealizowane z dbałością o najwyższe standardy inżynierii AI.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 relative">
            {[
              {
                num: '01',
                title: 'Wklejasz prompt',
                desc: 'Wprowadzasz swoją instrukcję, opcjonalnie definiując cel, typ zadania lub oczekiwany format.'
              },
              {
                num: '02',
                title: 'Lokalny skan bezpieczeństwa',
                desc: 'Nasz skaner natychmiast analizuje tekst w poszukiwaniu kluczy API, tokenów lub haseł, chroniąc Twoje dane.'
              },
              {
                num: '03',
                title: 'Audyt jakości promptu',
                desc: 'Model analizuje instrukcję pod kątem 10 kluczowych kryteriów inżynierii promptów.'
              },
              {
                num: '04',
                title: 'Gotowy wynik',
                desc: 'Odbierasz ustrukturyzowany raport, punktację, lista zmian oraz gotowy do wdrożenia, ulepszony prompt.'
              }
            ].map((step, i) => (
              <div key={i} className="relative rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6 hover:border-[#A78BFA]/30 transition-all">
                <span className="text-2xl font-black font-mono text-[#1C1C27] absolute top-4 right-4 select-none">
                  {step.num}
                </span>
                <h3 className="text-sm font-bold text-[#E2E8F0] font-heading mt-2">{step.title}</h3>
                <p className="mt-3 text-xs leading-relaxed text-[#94A3B8]">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link className="inline-flex items-center justify-center rounded-lg gradient-btn px-8 py-4 text-center text-sm font-bold text-white active:scale-95 transition-all cursor-pointer" href="/analyze">
              Sprawdź swój prompt teraz
            </Link>
          </div>

          <div className="max-w-2xl mx-auto mt-16 p-5 rounded-xl border border-[#2A2A3A] bg-[#13131A]/60 backdrop-blur-sm text-left">
            <div className="flex gap-3.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#A78BFA]/10 text-[#A78BFA] border border-[#A78BFA]/20">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-[#E2E8F0] tracking-wide">Bezpieczeństwo i ochrona danych wrażliwych</h4>
                <p className="text-[11px] leading-relaxed text-[#94A3B8]">
                  PromptPolish stawia prywatność na pierwszym miejscu i działa w pełni anonimowo. Przed analizą lokalny filtr automatycznie sprawdza prompt pod kątem kluczy API, tokenów czy haseł.
                </p>
                <p className="text-[10px] font-bold text-[#F59E0B]">
                  Pamiętaj: Ze względów bezpieczeństwa pod żadnym pozorem nie wklejaj do analizatora haseł, prywatnych kluczy ani tajemnic handlowych.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  )
}
