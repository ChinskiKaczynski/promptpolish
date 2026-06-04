import Link from 'next/link'
import { AppHeader } from '@/components/layout/app-header'
import { AppFooter } from '@/components/layout/app-footer'

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
                  Audit. Refine.<br />
                  Elevate <span className="gradient-text">every prompt.</span>
                </h1>
                
                <p className="mt-6 text-base leading-relaxed text-[#94A3B8] max-w-xl">
                  PromptPolish analyzes your prompts, scores what matters, and gives you actionable improvements to get better results from any AI model.
                </p>

                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Link 
                    className="inline-flex items-center justify-center rounded-lg gradient-btn px-7 py-4 text-center text-sm font-bold text-white active:scale-95 transition-all cursor-pointer" 
                    href="/analyze"
                  >
                    Start for free
                    <svg className="ml-2 h-4 w-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                  <a 
                    className="inline-flex items-center justify-center rounded-lg border border-[#2A2A3A] bg-[#13131A] hover:bg-[#1C1C27] hover:border-[#3A3A52] px-7 py-4 text-center text-sm font-semibold text-[#94A3B8] active:scale-95 transition-all" 
                    href="#features"
                  >
                    <svg className="mr-2 h-4 w-4 text-[#4A5568]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Zobacz możliwości
                  </a>
                </div>

                {/* Hero bullet points matching screenshot */}
                <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-[#2A2A3A]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1C1C27] border border-[#2A2A3A] text-[#A78BFA]">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#E2E8F0]">Better outputs</h4>
                      <p className="text-[11px] text-[#4A5568]">Higher quality results</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1C1C27] border border-[#2A2A3A] text-[#A78BFA]">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#E2E8F0]">Save time</h4>
                      <p className="text-[11px] text-[#4A5568]">Iterate with confidence</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1C1C27] border border-[#2A2A3A] text-[#A78BFA]">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a2 2 0 002 2h3a1 1 0 011 1v3a2 2 0 002 2 2 2 0 010 4 2 2 0 00-2 2v3a1 1 0 01-1 1h-3a2 2 0 00-2-2 2 2 0 01-4 0 2 2 0 00-2 2H4a1 1 0 01-1-1v-3a2 2 0 00-2-2 2 2 0 010-4 2 2 0 002-2V7a1 1 0 011-1h3a2 2 0 002-2V4z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#E2E8F0]">Works anywhere</h4>
                      <p className="text-[11px] text-[#4A5568]">LLMs, apps, APIs</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pixel-perfect HTML/CSS app mockup replica from the screenshot */}
              <div className="relative rounded-2xl border border-[#2A2A3A] bg-[#13131A] p-2 shadow-[0_0_0_1px_#2A2A3A,0_8px_48px_-8px_rgba(0,0,0,0.7)] glow-violet">
                <div className="rounded-[18px] border border-[#1E1E2E] bg-[#0C0C10] overflow-hidden grid grid-cols-[160px_1fr] h-[480px]">
                  
                  {/* Mockup Sidebar */}
                  <div className="border-r border-[#1E1E2E] bg-[#13131A] p-4 flex flex-col justify-between">
                    <div>
                      {/* Star brand logo */}
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-[#1C1C27] border border-[#2A2A3A]">
                          <svg className="h-4 w-4 fill-[#A78BFA]" viewBox="0 0 24 24">
                            <path d="M12 2L15.3 8.7L22 12L15.3 15.3L12 22L8.7 15.3L2 12L8.7 8.7Z" />
                          </svg>
                        </div>
                        <span className="text-xs font-bold text-[#E2E8F0] tracking-tight font-sans">PromptPolish</span>
                      </div>

                      {/* New Audit button */}
                      <div className="mt-6">
                        <div className="rounded-md bg-[#A78BFA]/10 text-[#A78BFA] border border-[#A78BFA]/20 py-1.5 px-3 text-[10px] font-bold flex items-center gap-1.5 cursor-pointer">
                          <span>+</span> New Audit
                        </div>
                      </div>

                      {/* Nav list */}
                      <nav className="mt-5 space-y-1">
                        <div className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[10px] font-semibold text-[#4A5568]">
                          <span>📊</span> Dashboard
                        </div>
                        <div className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[10px] font-semibold text-[#4A5568]">
                          <span>🕒</span> History
                        </div>
                        <div className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[10px] font-semibold text-[#4A5568]">
                          <span>📚</span> Prompt Library
                        </div>
                        <div className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[10px] font-semibold text-[#4A5568]">
                          <span>📋</span> Templates
                        </div>
                        <div className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[10px] font-semibold text-[#4A5568]">
                          <span>⚙️</span> Settings
                        </div>
                      </nav>
                    </div>

                    {/* Usage billing meter at bottom of sidebar */}
                    <div className="rounded-lg border border-[#2A2A3A] p-2.5 space-y-2 bg-[#1C1C27]">
                      <div className="flex items-center justify-between text-[9px] font-bold text-[#94A3B8]">
                        <span>Pro Plan</span>
                      </div>
                      <p className="text-[8px] text-[#4A5568]">Resets in 12 days</p>
                      <div className="h-1.5 w-full rounded-full bg-[#2A2A3A] overflow-hidden">
                        <div className="h-full bg-[#A78BFA] rounded-full" style={{ width: '49%' }} />
                      </div>
                      <div className="flex items-center justify-between text-[8px] font-bold text-[#94A3B8]">
                        <span>2,489 / 5,000</span>
                      </div>
                    </div>
                  </div>

                  {/* Mockup Main content area */}
                  <div className="p-4 flex flex-col justify-between bg-[#0C0C10] overflow-y-auto">
                    
                    {/* Mockup header */}
                    <div className="flex items-center justify-between border-b border-[#2A2A3A] pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#E2E8F0]">Audit result</span>
                        <span className="inline-flex items-center rounded-full bg-[#6EE7B7]/10 px-2 py-0.5 text-[8px] font-bold text-[#6EE7B7] border border-[#6EE7B7]/20">
                          Excellent potential
                        </span>
                      </div>
                      <button className="rounded-lg border border-[#2A2A3A] px-2 py-1 text-[9px] font-bold text-[#94A3B8] flex items-center gap-1 hover:bg-[#1C1C27]">
                        <span>🔗</span> Share
                      </button>
                    </div>

                    {/* Circular Overall Score & Score breakdown */}
                    <div className="mt-3.5 grid grid-cols-[80px_1fr] gap-4 items-center border-b border-[#2A2A3A] pb-3.5">
                      {/* Overall Score Circle */}
                      <div className="relative h-18 w-18 flex flex-col items-center justify-center rounded-full border-[5px] border-[#A78BFA] border-t-[#2A2A3A] -rotate-45 shrink-0">
                        <div className="rotate-45 flex flex-col items-center">
                          <span className="text-lg font-black text-[#E2E8F0] leading-none">82</span>
                          <span className="text-[8px] font-bold text-[#4A5568] mt-0.5">/100</span>
                        </div>
                      </div>

                      {/* Breakdown Bars */}
                      <div className="space-y-1.5">
                        <span className="text-[8px] font-bold uppercase tracking-wider text-[#4A5568] block">Score breakdown</span>
                        
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[8px]">
                            <span className="font-semibold text-[#94A3B8]">Clarity</span>
                            <span className="font-bold text-[#E2E8F0]">85</span>
                          </div>
                          <div className="h-1 w-full bg-[#1C1C27] rounded-full overflow-hidden border border-[#2A2A3A]/20">
                            <div className="h-full bg-[#A78BFA] rounded-full" style={{ width: '85%' }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[8px]">
                            <span className="font-semibold text-[#94A3B8]">Specificity</span>
                            <span className="font-bold text-[#E2E8F0]">90</span>
                          </div>
                          <div className="h-1 w-full bg-[#1C1C27] rounded-full overflow-hidden border border-[#2A2A3A]/20">
                            <div className="h-full bg-[#A78BFA] rounded-full" style={{ width: '90%' }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[8px]">
                            <span className="font-semibold text-[#94A3B8]">Context</span>
                            <span className="font-bold text-[#E2E8F0]">75</span>
                          </div>
                          <div className="h-1 w-full bg-[#1C1C27] rounded-full overflow-hidden border border-[#2A2A3A]/20">
                            <div className="h-full bg-[#A78BFA] rounded-full" style={{ width: '75%' }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Original & Polished Prompt side by side */}
                    <div className="mt-3.5 grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-[#2A2A3A] bg-[#13131A] p-2.5 flex flex-col justify-between h-28">
                        <div>
                          <span className="text-[8px] font-bold text-[#4A5568] uppercase tracking-wider">Original prompt</span>
                          <p className="mt-1 text-[9px] text-[#94A3B8] leading-normal font-medium">Write a blog post about AI</p>
                        </div>
                        <span className="text-[8px] text-[#4A5568] font-medium">6 tokens</span>
                      </div>

                      <div className="rounded-lg border border-[#A78BFA]/20 bg-[#13131A] p-2.5 flex flex-col justify-between h-28 relative">
                        <button className="absolute top-2.5 right-2.5 rounded border border-[#2A2A3A] bg-[#1C1C27] px-1.5 py-0.5 text-[8px] font-semibold text-[#94A3B8] hover:bg-[#1C1C27]">
                          Copy
                        </button>
                        <div>
                          <span className="text-[8px] font-bold text-[#4A5568] uppercase tracking-wider">Polished prompt</span>
                          <p className="mt-1 text-[9px] text-[#94A3B8] leading-normal font-semibold">Write a 1,000-word blog post about the impact of generative AI...</p>
                        </div>
                        <div className="flex items-center justify-between mt-1 border-t border-[#2A2A3A] pt-1.5">
                          <span className="text-[8px] text-[#4A5568] font-medium">42 tokens</span>
                          <span className="text-[8px] font-bold text-[#6EE7B7] bg-[#6EE7B7]/10 px-1 rounded border border-[#6EE7B7]/20">+6 improvements</span>
                        </div>
                      </div>
                    </div>

                    {/* Top Improvements */}
                    <div className="mt-3">
                      <span className="text-[8px] font-bold uppercase tracking-wider text-[#4A5568] block mb-1.5">Top improvements</span>
                      <div className="flex flex-wrap gap-1.5">
                        {['Add context', 'Increase specificity', 'Add constraints', 'Improve structure', 'Clarify audience'].map((tag) => (
                          <span key={tag} className="rounded-full bg-[#1C1C27] border border-[#2A2A3A] px-2 py-0.5 text-[8px] font-semibold text-[#4A5568]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Safety Warning Preflight Section */}
        <section className="px-6 py-12">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-xl border border-[#F59E0B]/20 bg-[#F59E0B]/5 p-6 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-6h.01M5.938 18h12.124c1.348 0 2.19-1.46 1.516-2.61L13.516 6.39c-.674-1.15-2.358-1.15-3.032 0L4.422 15.39c-.674 1.15.168 2.61 1.516 2.61z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#E2E8F0] font-heading">Ochrona danych wrażliwych przed analizą</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#94A3B8]">
                    PromptPolish stawia prywatność na pierwszym miejscu. Narzędzie działa w 100% anonimowo. Przed przesłaniem promptu do analizy, system uruchamia automatyczny filtr w poszukiwaniu kluczy API, tokenów autoryzacyjnych lub poufnych danych finansowych.
                  </p>
                  <p className="mt-2 text-xs font-semibold text-[#F59E0B]">
                    WAŻNE: Pod żadnym pozorem nie wklejaj haseł, kluczy API, tajemnic handlowych ani danych osobowych klientów.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="features" className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center">
            <h2 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#A78BFA]">Everything you need to craft better prompts</h2>
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
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-[#E2E8F0] font-heading">Deep Prompt Audits</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-[#94A3B8]">
                Multi-dimensional scoring across clarity, specificity, context, and more. Koniec z zgadywaniem.
              </p>
            </article>

            <article className="group rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6 hover:border-[#3A3A52] hover:bg-[#1C1C27] transition-all duration-200">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#6EE7B7]/10 border border-[#6EE7B7]/20 text-[#6EE7B7] mb-5">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-[#E2E8F0] font-heading">Smart Suggestions</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-[#94A3B8]">
                Actionable, AI-powered improvements tailored to your goals. Zdefiniowane luki i rekomendacje zmian.
              </p>
            </article>

            <article className="group rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6 hover:border-[#3A3A52] hover:bg-[#1C1C27] transition-all duration-200">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#A78BFA]/10 border border-[#A78BFA]/20 text-[#A78BFA] mb-5">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-[#E2E8F0] font-heading">Prompt Library</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-[#94A3B8]">
                Organize, version, and reuse your best prompts across projects. Wszystko w jednym bezpiecznym miejscu.
              </p>
            </article>

            <article className="group rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6 hover:border-[#3A3A52] hover:bg-[#1C1C27] transition-all duration-200">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#6EE7B7]/10 border border-[#6EE7B7]/20 text-[#6EE7B7] mb-5">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-[#E2E8F0] font-heading">Track & Improve</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-[#94A3B8]">
                Monitor performance over time and continuously level up your prompts. Twoje promptowanie rośnie razem z nami.
              </p>
            </article>
          </div>
        </section>

        {/* Metric Strip Section replacing the testimonials */}
        <section className="border-y border-[#2A2A3A] bg-[#13131A] py-10 px-6">
          <div className="mx-auto max-w-4xl grid grid-cols-2 sm:grid-cols-3 gap-6 text-center">
            {[
              { value: '100%', label: 'Anonimowy — bez rejestracji' },
              { value: '4 filary', label: 'Inżynierii promptów w każdym audycie' },
              { value: '0 PLN', label: 'Podstawowy dostęp na zawsze' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold font-mono text-[#A78BFA]">{stat.value}</p>
                <p className="mt-1 text-xs text-[#4A5568] leading-snug">{stat.label}</p>
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
                Zaprojektowany dla profesjonalistów
              </p>
              <p className="mx-auto mt-4 max-w-2xl text-[#94A3B8] text-sm">
                Sprawdź, jak PromptPolish ułatwia codzienną pracę z technologiami generatywnymi.
              </p>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  role: 'Konsultanci i trenerzy AI',
                  benefit: 'Szybkie audytowanie promptów dostarczanych przez klientów i dostarczanie powtarzalnych raportów z konkretną punktacją zamiast subiektywnych opinii.'
                },
                {
                  role: 'Marketerzy i copywriterzy',
                  benefit: 'Optymalizacja promptów generujących teksty sprzedażowe, newslettery i kreacje w celu uzyskania spójnego tonu i zminimalizowania ryzyka halucynacji AI.'
                },
                {
                  role: 'Developerzy i zespoły AI',
                  benefit: 'Testowanie i standaryzacja promptów systemowych (system instructions) przed wdrożeniem ich do kodu aplikacji lub chatbotów produkcyjnych.'
                },
                {
                  role: 'Zespoły produktu i e-commerce',
                  benefit: 'Podnoszenie kompetencji wewnętrznych zespołów poprzez proste, przejrzyste narzędzie do nauki właściwej struktury promptowania.'
                }
              ].map((user, i) => (
                <div key={i} className="flex flex-col rounded-xl border border-[#2A2A3A] bg-[#13131A] p-6 hover:border-[#3A3A52] transition-all duration-200">
                  <h3 className="text-sm font-bold text-[#E2E8F0] font-heading">{user.role}</h3>
                  <p className="mt-2.5 text-[11px] leading-relaxed text-[#4A5568] flex-grow">{user.benefit}</p>
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
                desc: 'Model analizuje instrukcję pod kątem 4 fundamentalnych filarów inżynierii promptów.'
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
        </section>
      </main>

      <AppFooter />
    </div>
  )
}
