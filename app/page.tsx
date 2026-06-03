import Link from 'next/link'
import { AppHeader } from '@/components/layout/app-header'
import { AppFooter } from '@/components/layout/app-footer'
import { LandingTracker } from '@/components/layout/landing-tracker'

const problemPoints = [
  {
    icon: '🎯',
    title: 'Niejasny wynik',
    desc: 'Model nie wie, czego oczekujesz — zwraca ogólną, bezużyteczną odpowiedź zamiast konkretnego rozwiązania.',
  },
  {
    icon: '📐',
    title: 'Zły format wyjściowy',
    desc: 'Brak jawnej instrukcji formatu powoduje, że model formatuje dane inaczej przy każdym uruchomieniu.',
  },
  {
    icon: '🌀',
    title: 'Zbyt szeroki zakres',
    desc: 'Prompt bez ograniczeń prowadzi do dryfowania tematu, bocznych wątków i nadmiernej długości odpowiedzi.',
  },
  {
    icon: '🧊',
    title: 'Ryzyko halucynacji',
    desc: 'Słaby kontekst i brak roli dla modelu znacznie zwiększają prawdopodobieństwo zmyślonych faktów.',
  },
  {
    icon: '💸',
    title: 'Koszt iteracji',
    desc: 'Kolejne poprawki "na czuja" marnują czas, tokeny i budżet — bez gwarancji poprawy jakości.',
  },
]

const useCases = [
  { emoji: '✍️', label: 'Content & SEO', desc: 'Teksty sprzedażowe, opisy produktów, meta-tagi.' },
  { emoji: '💻', label: 'Programowanie', desc: 'System instructions, code review, generowanie kodu.' },
  { emoji: '🔬', label: 'Badania & Research', desc: 'Streszczenia, ekstrakcja danych, analiza dokumentów.' },
  { emoji: '📊', label: 'Analiza danych', desc: 'Raporty, SQL z języka naturalnego, wykresy.' },
  { emoji: '📣', label: 'Marketing & Sprzedaż', desc: 'Newslettery, kreacje reklamowe, cold e-maile.' },
  { emoji: '🤖', label: 'Agenty & Workflow', desc: 'Orkiestracja agentów, system prompts, RAG pipelines.' },
]

const benefits = [
  {
    title: 'Precyzyjny wynik 0–100',
    description: 'Koniec z zgadywaniem. Otrzymasz obiektywną ocenę promptu na podstawie 4 inżynieryjnych kryteriów: jasności roli, głębokości kontekstu, definicji ograniczeń oraz formatu wyjściowego.',
    badge: 'WYNIK I METRYKI',
    icon: (
      <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
      </svg>
    )
  },
  {
    title: 'Głęboka diagnoza słabości',
    description: 'System automatycznie wskaże 3 najważniejsze luki w Twojej instrukcji, wyjaśni dlaczego mogą one wprowadzać model w błąd i zaproponuje natychmiastowe kroki naprawcze.',
    badge: 'DIAGNOZA I KRYTYKA',
    icon: (
      <svg className="h-6 w-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    )
  },
  {
    title: 'Ulepszona wersja promptu',
    description: 'Otrzymasz zrestrukturyzowany, profesjonalnie zredagowany prompt gotowy do skopiowania jednym kliknięciem. Zachowujemy Twoją intencję, drastycznie podnosząc precyzję modelu.',
    badge: 'GOTOWA WERSJA PROMPTU',
    icon: (
      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
      </svg>
    )
  }
]

const targetUsers = [
  {
    role: 'Konsultanci i trenerzy AI',
    benefit: 'Szybkie audytowanie promptów dostarczanych przez klientów i dostarczanie powtarzalnych raportów z konkretną punktacją zamiast subiektywnych opinii.',
    bg: 'bg-indigo-50/50 hover:bg-indigo-50 border-indigo-100'
  },
  {
    role: 'Marketerzy i copywriterzy',
    benefit: 'Optymalizacja promptów generujących teksty sprzedażowe, newslettery i kreacje w celu uzyskania spójnego tonu i uniknięcia halucynacji AI.',
    bg: 'bg-violet-50/50 hover:bg-violet-50 border-violet-100'
  },
  {
    role: 'Developerzy i zespoły AI',
    benefit: 'Testowanie i standaryzacja promptów systemowych (system instructions) przed wdrożeniem ich do kodu aplikacji lub chatbotów produkcyjnych.',
    bg: 'bg-blue-50/50 hover:bg-blue-50 border-blue-100'
  },
  {
    role: 'Zespoły produktu i e-commerce',
    benefit: 'Podnoszenie kompetencji wewnętrznych zespołów poprzez proste, przejrzyste narzędzie do nauki właściwej struktury promptowania.',
    bg: 'bg-slate-50 hover:bg-slate-100 border-slate-200'
  }
]

const steps = [
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
    desc: 'Odbierasz ustrukturyzowany raport z punktacją, listą zmian i gotowym do wdrożenia, ulepszonym promptem. Zapisujesz lub eksportujesz wynik.'
  }
]

export default async function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50/30 font-sans text-slate-900 selection:bg-indigo-100 antialiased">
      {/* Fire landing_viewed telemetry on mount (client-side, fire-and-forget) */}
      <LandingTracker />
      <AppHeader />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-6 py-20 lg:py-28">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.50),white)] opacity-70" />
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/50 px-3.5 py-1 text-xs font-medium text-indigo-700">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
                  </span>
                  Zamknięta Beta — bez rejestracji, bez opłat
                </div>
                <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl leading-[1.1]">
                  Zobacz, co osłabia Twój prompt —{' '}
                  <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 bg-clip-text text-transparent">
                    i jak go poprawić.
                  </span>
                </h1>
                <p className="mt-6 text-lg leading-relaxed text-slate-600">
                  Wklej prompt, a PromptPolish oceni go w skali 0–100, wskaże słabe punkty i zwróci gotową do użycia, ulepszoną wersję. Zero zgadywania, zero ręcznego iterowania.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    id="hero-cta-analyze"
                    className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-6 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-indigo-100 hover:shadow-indigo-200 active:scale-95 transition-all"
                    href="/analyze"
                  >
                    Przeprowadź audyt promptu
                    <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                  <Link
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 px-6 py-3.5 text-center text-sm font-semibold text-slate-700 active:scale-95 transition-all"
                    href="/pricing"
                  >
                    Zobacz cennik
                  </Link>
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
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">PRZYKŁADOWY AUDYT</span>
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

        {/* Problem Section */}
        <section className="bg-slate-900 px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h2 className="text-xs font-bold uppercase tracking-widest text-rose-400">Problem</h2>
              <p className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Dlaczego słaby prompt kosztuje Cię czas i pieniądze?
              </p>
              <p className="mx-auto mt-4 max-w-2xl text-slate-400">
                Praca z LLM bez struktury to jak pisanie kodu bez testów — działa do momentu, gdy przestaje. Oto co idzie nie tak.
              </p>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {problemPoints.map((point, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-800 bg-slate-800/40 p-6 hover:border-slate-700 hover:bg-slate-800/60 transition-all"
                >
                  <span className="text-3xl">{point.icon}</span>
                  <h3 className="mt-4 text-sm font-bold text-white">{point.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">{point.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-sm text-slate-400">
                PromptPolish wykrywa te problemy automatycznie i dostarcza gotową poprawkę — bez iterowania.
              </p>
            </div>
          </div>
        </section>

        {/* Safety Warning Preflight Section */}
        <section className="px-6 py-6">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-3xl border border-amber-200 bg-amber-50/30 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-6h.01M5.938 18h12.124c1.348 0 2.19-1.46 1.516-2.61L13.516 6.39c-.674-1.15-2.358-1.15-3.032 0L4.422 15.39c-.674 1.15.168 2.61 1.516 2.61z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-amber-950">Ochrona danych wrażliwych przed analizą</h3>
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
        <section id="features" className="mx-auto max-w-6xl px-6 py-20">
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

          {/* Feature highlights strip */}
          <div className="mt-12 rounded-2xl border border-slate-100 bg-slate-50 px-6 py-5">
            <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Dostępne teraz w Becie</p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                'Wynik 0–100', 'Top 3 słabości', 'Plan naprawczy', 'Ulepszona wersja promptu',
                'Historia analiz', 'Eksport Markdown & TXT', 'Link do udostępnienia', 'Skan danych wrażliwych',
              ].map((f) => (
                <span key={f} className="inline-flex items-center gap-1 rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-semibold text-indigo-700">
                  <span className="text-indigo-500">✓</span> {f}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="bg-indigo-600 px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-200">Zastosowania</h2>
              <p className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Sprawdza się w każdym kontekście
              </p>
              <p className="mx-auto mt-4 max-w-2xl text-indigo-100">
                Od marketingu przez programowanie po orkiestrację agentów — PromptPolish pomaga wszędzie, gdzie piszesz instrukcje dla modeli językowych.
              </p>
            </div>

            <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {useCases.map((uc, i) => (
                <div key={i} className="flex items-start gap-4 rounded-2xl border border-indigo-500/40 bg-indigo-700/30 p-5 hover:bg-indigo-700/50 transition-all">
                  <span className="text-2xl shrink-0">{uc.emoji}</span>
                  <div>
                    <h3 className="text-sm font-bold text-white">{uc.label}</h3>
                    <p className="mt-1 text-xs text-indigo-200 leading-relaxed">{uc.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Target Users Section */}
        <section className="bg-slate-100/50 border-y border-slate-200/50 px-6 py-20">
          <div className="mx-auto max-w-6xl">
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
        <section id="jak-to-dziala" className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <div className="text-center">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600">Jak to działa</h2>
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
            <Link
              id="how-it-works-cta"
              className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-8 py-4 text-center text-sm font-semibold text-white shadow-lg shadow-indigo-100 hover:shadow-indigo-200 active:scale-95 transition-all"
              href="/analyze"
            >
              Przeprowadź audyt promptu
            </Link>
          </div>
        </section>

        {/* Beta Note Section */}
        <section className="px-6 pb-16">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-3xl border border-indigo-100 bg-indigo-50/40 p-8 sm:p-10 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-100/60 px-3.5 py-1 text-xs font-bold text-indigo-700 mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
                </span>
                Zamknięta Beta
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                PromptPolish jest teraz w fazie zamkniętej bety
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-600">
                Wszystkie funkcje są dostępne bezpłatnie. Płatności są wyłączone — nie potrzebujesz karty kredytowej. Twoja opinia kształtuje produkt.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  id="beta-cta-analyze"
                  className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-100 active:scale-95 transition-all"
                  href="/analyze"
                >
                  Wypróbuj za darmo
                </Link>
                <Link
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 px-6 py-3 text-sm font-semibold text-slate-700 active:scale-95 transition-all"
                  href="/pricing"
                >
                  Plany i limity →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  )
}
