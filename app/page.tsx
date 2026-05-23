import Link from 'next/link'

const benefits = [
  {
    title: 'Precyzyjny Wynik 0–100',
    description: 'Koniec z zgadywaniem. Otrzymasz obiektywną ocenę promptu na podstawie 4 inżynieryjnych kryteriów: jasności roli, głębokości kontekstu, definicji ograniczeń oraz formatu wyjściowego.',
    badge: 'Score & Metrics',
    icon: (
      <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
      </svg>
    )
  },
  {
    title: 'Głęboka Diagnoza Słabości',
    description: 'System automatycznie wskaże 3 najważniejsze luki w Twojej instrukcji, wyjaśni dlaczego mogą one wprowadzać model w błąd i zaproponuje natychmiastowe kroki naprawcze.',
    badge: 'Diagnosis & Critique',
    icon: (
      <svg className="h-6 w-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    )
  },
  {
    title: 'Ulepszona Wersja Promptu',
    description: 'Otrzymasz zrestrukturyzowany, profesjonalnie zredagowany prompt gotowy do skopiowania jednym kliknięciem. Zachowujemy Twoją intencję, drastycznie podnosząc precyzję modelu.',
    badge: 'Copy-Ready Refinement',
    icon: (
      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
      </svg>
    )
  }
]

const targetUsers = [
  {
    role: 'Konsultanci & Trenerzy AI',
    benefit: 'Szybkie audytowanie promptów dostarczanych przez klientów i dostarczanie powtarzalnych raportów z konkretną punktacją zamiast subiektywnych opinii.',
    bg: 'bg-indigo-50/50 hover:bg-indigo-50 border-indigo-100'
  },
  {
    role: 'Marketerzy & Copywriterzy',
    benefit: 'Optymalizacja promptów generujących teksty sprzedażowe, newslettery i kreacje w celu uzyskania spójnego tonu i uniknięcia halucynacji AI.',
    bg: 'bg-violet-50/50 hover:bg-violet-50 border-violet-100'
  },
  {
    role: 'Deweloperzy & AI Engineers',
    benefit: 'Testowanie i standaryzacja promptów systemowych (system instructions) przed wdrożeniem ich do kodu aplikacji lub chatbotów produkcyjnych.',
    bg: 'bg-blue-50/50 hover:bg-blue-50 border-blue-100'
  },
  {
    role: 'Zespoły Product & E-commerce',
    benefit: 'Podnoszenie kompetencji wewnętrznych zespołów poprzez proste, przejrzyste narzędzie do nauki właściwej struktury promptowania.',
    bg: 'bg-slate-50 hover:bg-slate-100 border-slate-200'
  }
]

const steps = [
  {
    num: '01',
    title: 'Wklejasz Prompt',
    desc: 'Wprowadzasz swoją instrukcję, opcjonalnie definiując cel, typ zadania lub oczekiwany format.'
  },
  {
    num: '02',
    title: 'Lokalny Preflight',
    desc: 'Nasz skaner natychmiast analizuje tekst w poszukiwaniu kluczy API, tokenów lub haseł, chroniąc Twoje dane.'
  },
  {
    num: '03',
    title: 'Inżynieryjny Audyt',
    desc: 'Model analizuje instrukcję pod kątem 4 fundamentalnych filarów inżynierii promptów.'
  },
  {
    num: '04',
    title: 'Copy-Ready Output',
    desc: 'Odbierasz ustrukturyzowany raport, punktację, listę zmian oraz gotowy do wdrożenia, ulepszony prompt.'
  }
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50/30 font-sans text-slate-900 selection:bg-indigo-100 antialiased">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 shadow-md shadow-indigo-200">
              <span className="font-bold text-white text-base">P</span>
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-800 bg-clip-text text-transparent">
              PromptPolish
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium text-slate-600">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Anonymous-first MVP</span>
            <Link className="hover:text-indigo-600 transition" href="/privacy">Prywatność</Link>
            <Link className="hover:text-indigo-600 transition" href="/terms">Regulamin</Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-6 py-20 lg:py-28">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.50),white)] opacity-70" />
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/50 px-3.5 py-1 text-xs font-medium text-indigo-700">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
                  </span>
                  Wolny, darmowy audyt bez rejestracji
                </div>
                <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl leading-[1.1]">
                  Sprawdź, dlaczego Twój prompt{' '}
                  <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 bg-clip-text text-transparent">
                    działa słabo.
                  </span>
                </h1>
                <p className="mt-6 text-lg leading-relaxed text-slate-600">
                  Wklej swój prompt, wybierz język i profil modelu. Nasz system natychmiast wygeneruje obiektywny audyt 0–100, zdiagnozuje słabe punkty i dostarczy ustrukturyzowaną, gotową do skopiowania wersję instrukcji.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-6 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-indigo-100 hover:shadow-indigo-200 active:scale-95 transition-all" href="/analyze">
                    Rozpocznij analizę
                    <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                  <a className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 px-6 py-3.5 text-center text-sm font-semibold text-slate-700 active:scale-95 transition-all" href="#features">
                    Zobacz możliwości
                  </a>
                </div>
              </div>

              {/* Decorative Mockup Widget */}
              <div className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-100/50">
                <div className="absolute -top-3 -right-3 h-12 w-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 opacity-20 blur-md" />
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-400" />
                    <span className="h-3 w-3 rounded-full bg-yellow-400" />
                    <span className="h-3 w-3 rounded-full bg-green-400" />
                  </div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Mockup Audit</span>
                </div>
                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Ocena Promptu</h4>
                      <p className="mt-1 text-2xl font-black text-slate-900">74 / 100</p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700 border border-yellow-100">
                      Wymaga poprawek
                    </span>
                  </div>
                  <div className="mt-6 space-y-4">
                    <div className="rounded-xl bg-slate-50/50 p-4 border border-slate-100">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Krytyczna Luka:</p>
                      <p className="mt-1.5 text-xs text-slate-700 leading-relaxed">
                        Brak zdefiniowanego formatu wyjściowego. Model może formatować wyniki niespójnie w zależności od uruchomienia.
                      </p>
                    </div>
                    <div className="rounded-xl bg-indigo-50/30 p-4 border border-indigo-50">
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Rozwiązanie:</p>
                      <p className="mt-1.5 text-xs text-slate-700 leading-relaxed">
                        W ulepszonej wersji dodaliśmy jawne reguły formatowania Markdown (tabele, nagłówki).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Safety Warning Preflight Section */}
        <section className="px-6 py-6">
          <div className="mx-auto max-w-5xl">
            <div className="rounded-3xl border border-amber-200 bg-amber-50/30 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-6h.01M5.938 18h12.124c1.348 0 2.19-1.46 1.516-2.61L13.516 6.39c-.674-1.15-2.358-1.15-3.032 0L4.422 15.39c-.674 1.15.168 2.61 1.516 2.61z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-amber-950">Gwarancja Bezpieczeństwa & Preflight Ochronny</h3>
                  <p className="mt-2 text-sm leading-relaxed text-amber-900/90">
                    PromptPolish stawia prywatność na pierwszym miejscu. Narzędzie działa w 100% anonimowo. Przed przesłaniem promptu do analizy, system uruchamia automatyczny filtr w poszukiwaniu kluczy API, tokenów autoryzacyjnych lub poufnych danych finansowych.
                  </p>
                  <p className="mt-2 text-xs font-semibold text-amber-800">
                    WAŻNE: Pod żadnym pozorem nie wklejaj haseł, kluczy API, tajemnic handlowych ani danych osobowych klientów.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="features" className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-center">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600">Możliwości Narzędzia</h2>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Co zyskujesz dzięki PromptPolish?
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600">
              Analizujemy prompty na poziomie inżynieryjnym, dostarczając precyzyjnych narzędzi do natychmiastowej poprawy komunikacji z LLM.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {benefits.map((benefit, i) => (
              <article key={i} className="group relative rounded-3xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-md transition-all">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                  {benefit.icon}
                </div>
                <span className="absolute top-8 right-8 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {benefit.badge}
                </span>
                <h3 className="mt-6 text-lg font-bold text-slate-950">{benefit.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{benefit.description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Target Users Section */}
        <section className="bg-slate-100/50 border-y border-slate-200/50 px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <h2 className="text-xs font-bold uppercase tracking-widest text-violet-600">Dla Kogo?</h2>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Zaprojektowany dla profesjonalistów
              </p>
              <p className="mx-auto mt-4 max-w-2xl text-slate-600">
                Sprawdź, jak PromptPolish ułatwia codzienną pracę z technologiami generatywnymi.
              </p>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {targetUsers.map((user, i) => (
                <div key={i} className={`flex flex-col rounded-2xl border p-6 bg-white shadow-sm transition-all ${user.bg}`}>
                  <h3 className="text-base font-bold text-slate-950">{user.role}</h3>
                  <p className="mt-3 text-xs leading-relaxed text-slate-600 flex-1">{user.benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works (Flow Explanation) Section */}
        <section className="mx-auto max-w-5xl px-6 py-20 lg:py-28">
          <div className="text-center">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600">Proces</h2>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Jak przebiega audyt promptu?
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600">
              Proste, bezwysiłkowe flow w 4 krokach, zrealizowane z dbałością o najwyższe standardy inżynierii AI.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 relative">
            {steps.map((step, i) => (
              <div key={i} className="relative rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <span className="text-3xl font-black bg-gradient-to-r from-slate-200 to-slate-100 bg-clip-text text-transparent absolute top-4 right-4">
                  {step.num}
                </span>
                <h3 className="text-base font-bold text-slate-950 mt-2">{step.title}</h3>
                <p className="mt-3 text-xs leading-relaxed text-slate-600">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-8 py-4 text-center text-sm font-semibold text-white shadow-lg shadow-indigo-100 hover:shadow-indigo-200 active:scale-95 transition-all" href="/analyze">
              Sprawdź swój prompt teraz
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
                <span className="font-bold text-white text-xs">P</span>
              </div>
              <span className="text-sm font-bold text-slate-900 tracking-tight">PromptPolish</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-xs font-semibold text-slate-500">
              <Link className="hover:text-indigo-600 transition" href="/privacy">Polityka Prywatności</Link>
              <Link className="hover:text-indigo-600 transition" href="/terms">Regulamin Serwisu</Link>
              <span className="text-slate-300">|</span>
              <span className="font-normal text-slate-400">© {new Date().getFullYear()} PromptPolish. Wszelkie prawa zastrzeżone.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
