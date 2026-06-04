import Link from 'next/link'
import { AppHeader } from '@/components/layout/app-header'
import { AppFooter } from '@/components/layout/app-footer'

const benefits = [
  {
    title: 'Precyzyjny wynik 0–100',
    description: 'Koniec z zgadywaniem. Otrzymasz obiektywną ocenę promptu na podstawie 4 inżynieryjnych kryteriów: jasności roli, głębokości kontekstu, definicji ograniczeń oraz formatu wyjściowego.',
    badge: 'SYSTEM // METRYKI',
    icon: (
      <span className="font-mono font-bold text-pp-cyan text-lg">[DGN]</span>
    )
  },
  {
    title: 'Głęboka diagnoza słabości',
    description: 'System automatycznie wskaże 3 najważniejsze luki w Twojej instrukcji, wyjaśni dlaczego mogą one wprowadzać model w błąd i zaproponuje natychmiastowe kroki naprawcze.',
    badge: 'CRIT // DIAGNOZA',
    icon: (
      <span className="font-mono font-bold text-pp-warning text-lg">[ERR]</span>
    )
  },
  {
    title: 'Ulepszona wersja promptu',
    description: 'Otrzymasz zrestrukturyzowany, profesjonalnie zredagowany prompt gotowy do skopiowania jednym kliknięciem. Zachowujemy Twoją intencję, drastycznie podnosząc precyzję modelu.',
    badge: 'FORGE // ARTEFAKT',
    icon: (
      <span className="font-mono font-bold text-pp-success text-lg">[OK]</span>
    )
  }
]

const targetUsers = [
  {
    role: 'Konsultanci i trenerzy AI',
    benefit: 'Szybkie audytowanie promptów dostarczanych przez klientów i dostarczanie powtarzalnych raportów z konkretną punktacją zamiast subiektywnych opinii.',
    bg: 'pp-panel hover:pp-panel-active border-pp-border'
  },
  {
    role: 'Marketerzy i copywriterzy',
    benefit: 'Optymalizacja promptów generujących teksty sprzedażowe, newslettery i kreacje w celu uzyskania spójnego tonu i zminimalizowania ryzyka halucynacji AI.',
    bg: 'pp-panel hover:pp-panel-active border-pp-border'
  },
  {
    role: 'Developerzy i zespoły AI',
    benefit: 'Testowanie i standaryzacja promptów systemowych (system instructions) przed wdrożeniem ich do kodu aplikacji lub chatbotów produkcyjnych.',
    bg: 'pp-panel hover:pp-panel-active border-pp-border'
  },
  {
    role: 'Zespoły produktu i e-commerce',
    benefit: 'Podnoszenie kompetencji wewnętrznych zespołów poprzez proste, przejrzyste narzędzie do nauki właściwej struktury promptowania.',
    bg: 'pp-panel hover:pp-panel-active border-pp-border'
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
    title: 'Preflight bezpieczeństwa',
    desc: 'Nasz skaner natychmiast analizuje tekst w poszukiwaniu kluczy API, tokenów lub haseł, chroniąc Twoje dane.'
  },
  {
    num: '03',
    title: 'Audyt jakości promptu',
    desc: 'Model analizuje instrukcję pod kątem 4 fundamentalnych filarów inżynierii promptów.'
  },
  {
    num: '04',
    title: 'Wykuwanie i ulepszenie',
    desc: 'Odbierasz ustrukturyzowany raport, punktację, listę zmian oraz gotowy do wdrożenia, ulepszony prompt.'
  }
]

const testimonials = [
  {
    user: "Adam (Growth Marketer)",
    log: "Dzięki PromptPolish moje prompty są teraz krótsze, trafniejsze i dużo skuteczniejsze. Oszczędzam godziny każdego tygodnia!"
  },
  {
    user: "Martyna (Content Lead)",
    log: "Tryb audytu to game changer. W końcu wiem, które prompty naprawdę dowodzą wyniki. Nie wrócę do starego sposobu pracy."
  },
  {
    user: "Kuba (Product Manager)",
    log: "Biblioteka promptów pomaga całemu zespołowi dzielić się wiedzą i najlepszymi praktykami. Porządek i jakość na nowym poziomie."
  }
]

export default async function HomePage() {
  return (
    <div className="flex min-h-screen flex-col pp-grid-bg text-pp-text selection:bg-pp-border-bright selection:text-white antialiased font-mono">
      <AppHeader />

      {/* Main Content */}
      <main className="flex-1 z-10 relative">
        
        {/* Hero Section */}
        <section className="px-6 py-16 lg:py-24 max-w-6xl mx-auto">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            
            {/* Left side: Terminal Title & Controls */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 border border-pp-border-bright bg-pp-panel px-3.5 py-1.5 text-xs font-bold text-pp-primary-bright shadow-[2px_2px_0px_rgba(0,0,0,0.5)]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping bg-pp-cyan opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 bg-pp-cyan"></span>
                </span>
                [ STATUS: AUDYT_AKTYWNY_BEZ_LOGOWANIA ]
              </div>
              
              <h1 className="text-3xl font-black tracking-wider text-pp-text sm:text-4xl lg:text-5xl leading-tight uppercase">
                Ulepszaj prompty AI jak{' '}
                <span className="text-pp-cyan drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]">
                  magiczne zaklęcia.
                </span>
              </h1>
              
              <p className="text-sm leading-relaxed text-pp-muted max-w-xl">
                Wklej swój prompt, wybierz profil audytu i uruchom preflight bezpieczeństwa. System wykryje luki, przeanalizuje strukturę i przekuje słaby opis w zoptymalizowaną, precyzyjną instrukcję systemową.
              </p>
              
              <div className="flex flex-col gap-4 sm:flex-row pt-2">
                <Link className="pp-button pp-button-primary text-sm px-6 py-4" href="/analyze">
                  Rozpocznij audyt &gt;&gt;
                </Link>
                <a className="pp-button text-sm px-6 py-4 border-pp-border bg-pp-panel hover:border-pp-border-bright" href="#features">
                  Zobacz moduły
                </a>
              </div>
            </div>

            {/* Right side: Mockup Widget styled as diagnostic retro dashboard stats sheet */}
            <div className="pp-panel p-6 border-2 border-pp-border relative">
              <div className="absolute top-0 right-4 -translate-y-1/2 bg-pp-bg px-2 text-[10px] font-bold text-pp-cyan tracking-widest font-mono uppercase">
                {"// RAPORT_STATUS"}
              </div>

              <div className="flex items-center justify-between border-b border-pp-border pb-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 bg-pp-danger" />
                  <span className="h-3 w-3 bg-pp-warning" />
                  <span className="h-3 w-3 bg-pp-success" />
                </div>
                <span className="text-[10px] font-bold text-pp-muted uppercase tracking-wider">MODUŁ: WERYFIKACJA_V1.0</span>
              </div>

              <div className="mt-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-pp-muted">Globalny współczynnik precyzji</h4>
                    <p className="mt-1 text-2xl font-black text-pp-warning tracking-wide">74 / 100</p>
                  </div>
                  <span className="border border-pp-warning bg-pp-warning/10 px-2 py-0.5 text-[10px] font-bold text-pp-warning uppercase">
                    Wymaga poprawek
                  </span>
                </div>

                <div className="pp-inset p-4 space-y-3">
                  <div>
                    <p className="text-[9px] font-bold text-pp-danger uppercase tracking-wider">{"// WYKRYTE LUKI SYSTEMU:"}</p>
                    <p className="mt-1 text-[11px] text-pp-text leading-relaxed font-mono">
                      Brak zdefiniowanego formatu wyjściowego. Model może formatować wyniki niespójnie.
                    </p>
                  </div>
                  <div className="border-t border-pp-border/50 pt-2">
                    <p className="text-[9px] font-bold text-pp-success uppercase tracking-wider">{"// ZAPROPONOWANE ROZWIĄZANIE:"}</p>
                    <p className="mt-1 text-[11px] text-pp-muted leading-relaxed font-mono">
                      W ulepszonym skrypcie dodaliśmy jawne dyrektywy formatu JSON/Markdown.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Safety Warning Preflight Section */}
        <section className="px-6 py-6 max-w-6xl mx-auto">
          <div className="border-2 border-pp-warning bg-pp-warning/5 p-6 sm:p-8 shadow-[4px_4px_0px_rgba(245,158,11,0.15)] relative">
            <div className="absolute top-0 left-6 -translate-y-1/2 bg-pp-bg px-2 text-[10px] font-bold text-pp-warning tracking-widest font-mono uppercase">
              ⚠️ ALARM_BEZPIECZEŃSTWA // PREFLIGHT
            </div>
            
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-pp-warning bg-pp-warning/10 text-pp-warning">
                <span className="text-xl font-bold">!</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-pp-text uppercase tracking-wider">Lokalne skanowanie danych wrażliwych przed analizą</h3>
                <p className="text-xs leading-relaxed text-pp-muted">
                  Narzędzie działa w 100% anonimowo. Przed wysłaniem promptu do analizy, w przeglądarce uruchamiany jest automatyczny filtr preflight wyszukujący klucze API, tokeny dostępowe oraz sekrety, chroniąc Twoją prywatność.
                </p>
                <p className="text-[10px] font-black text-pp-warning uppercase tracking-widest">
                  NAKAZ: POD ŻADNYM POZOREM NIE WKLEJAJ HASEŁ, KLUCZY API, ANI DANYCH OSOBOWYCH KLIENTÓW.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="features" className="max-w-6xl mx-auto px-6 py-16 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-pp-cyan">{"// PARAMETRY ANALIZATORA"}</h2>
            <p className="text-2xl font-black uppercase tracking-wider text-pp-text">
              Precyzyjna diagnostyka i ulepszanie
            </p>
            <p className="text-xs text-pp-muted max-w-xl mx-auto">
              Rozkładamy instrukcje AI na czynniki pierwsze za pomocą ścisłego audytu inżynierii promptów.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {benefits.map((benefit, i) => (
              <article key={i} className="pp-panel p-6 border-2 border-pp-border flex flex-col justify-between hover:pp-panel-active transition-all">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-9 w-9 flex items-center justify-center border border-pp-border bg-pp-bg">
                      {benefit.icon}
                    </div>
                    <span className="border border-pp-border bg-pp-bg px-2 py-0.5 text-[9px] font-bold text-pp-muted">
                      {benefit.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-pp-text">{benefit.title}</h3>
                  <p className="text-xs leading-relaxed text-pp-muted">{benefit.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Target Users Section */}
        <section className="border-y-2 border-pp-border bg-pp-panel/30 px-6 py-16">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-2">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-pp-primary-bright">{"// DOCELOWE PROFILE UŻYTKOWNIKÓW"}</h2>
              <p className="text-2xl font-black uppercase tracking-wider text-pp-text">
                Stworzony dla profesjonalistów AI
              </p>
              <p className="text-xs text-pp-muted max-w-xl mx-auto">
                Sprawdź, jak nasz system wspomaga codzienną inżynierię instrukcji dla modeli językowych.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {targetUsers.map((user, i) => (
                <div key={i} className={`p-6 ${user.bg} border-2 relative flex flex-col justify-between`}>
                  <div className="absolute top-0 right-4 -translate-y-1/2 bg-pp-bg px-1.5 text-[9px] font-mono text-pp-primary-bright font-bold uppercase tracking-widest">
                    SYS.LOG // 0{i + 1}
                  </div>
                  <h3 className="text-xs font-bold text-pp-text uppercase tracking-wider mb-3">{user.role}</h3>
                  <p className="text-[11px] leading-relaxed text-pp-muted">{user.benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works (Flow Explanation) Section */}
        <section className="max-w-6xl mx-auto px-6 py-16 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-pp-cyan">{"// SEKWENCJA QUESTU AUDYTORSKIEGO"}</h2>
            <p className="text-2xl font-black uppercase tracking-wider text-pp-text">
              Jak przebiega proces optymalizacji?
            </p>
            <p className="text-xs text-pp-muted max-w-xl mx-auto">
              Czterostopniowa ścieżka od surowego tekstu do precyzyjnie wykutego artefaktu instrukcji.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <div key={i} className="pp-panel p-6 border-2 border-pp-border relative flex flex-col justify-between">
                <span className="text-2xl font-black text-pp-border/40 absolute top-4 right-4 font-mono select-none">
                  {step.num}
                </span>
                <div className="space-y-2 pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-pp-text">{step.title}</h3>
                  <p className="text-[11px] leading-relaxed text-pp-muted">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-6">
            <Link className="pp-button pp-button-primary text-sm px-8 py-4" href="/analyze">
              URUCHOM ANALIZATOR PROMPTÓW NOW
            </Link>
          </div>
        </section>

        {/* Testimonials as Terminal Logs */}
        <section className="max-w-6xl mx-auto px-6 pb-16 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-pp-cyan">{"// DECYZJE UŻYTKOWNIKÓW // LOGS"}</h2>
            <p className="text-xl font-bold uppercase text-pp-text">Raporty zwrotne z pola walki</p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <div key={i} className="pp-inset p-5 space-y-3 border border-pp-border relative">
                <div className="absolute top-0 left-4 -translate-y-1/2 bg-pp-bg px-2 text-[9px] font-bold text-pp-muted">
                  [LOG_ID: PP_REF_{100 + i}]
                </div>
                <p className="text-xs leading-relaxed text-pp-text italic">
                  &quot;{t.log}&quot;
                </p>
                <div className="text-[10px] font-bold text-pp-cyan tracking-wider text-right uppercase border-t border-pp-border/30 pt-2">
                  -- {t.user}
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      <AppFooter />
    </div>
  )
}
