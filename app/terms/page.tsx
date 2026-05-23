import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans selection:bg-indigo-100 antialiased">
      {/* Navigation Header */}
      <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
              <span className="font-bold text-white text-xs">P</span>
            </div>
            <span className="text-sm font-bold text-slate-900 tracking-tight">PromptPolish</span>
          </Link>
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">Anonymous-first MVP</span>
            <Link href="/" className="hover:text-indigo-600 transition">Powrót</Link>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        
        {/* Draft Alert Notice */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 mb-8">
          <div className="flex gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <h3 className="text-sm font-bold text-amber-950 uppercase tracking-wider">Wersja Robocza Regulaminu / Draft Terms</h3>
              <p className="mt-1 text-xs leading-relaxed text-amber-900">
                To jest roboczy draft regulaminu (warunków korzystania) dla fazy MVP narzędzia <strong>PromptPolish</strong>. Dokument służy celom demonstracyjnym i testowym, nie stanowi oficjalnej opinii prawnej i musi przejść weryfikację prawną przed wdrożeniem do komercyjnej eksploatacji produkcyjnej.
              </p>
            </div>
          </div>
        </div>

        {/* Article Container */}
        <article className="prose prose-slate max-w-none">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            Regulamin Korzystania (Draft MVP)
          </h1>
          <p className="mt-2 text-xs text-slate-400">Ostatnia aktualizacja: 23 maja 2026 r.</p>
          
          <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-700">
            
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">1. Opis i Charakterystyka Usługi</h2>
              <p>
                PromptPolish jest darmowym, anonimowym narzędziem pomocniczym służącym do audytowania, punktowania i optymalizacji promptów (instrukcji) kierowanych do modeli językowych (LLM). Usługa jest udostępniana w formule <strong>Anonymous-first MVP</strong> bez konieczności rejestrowania konta użytkownika.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">2. Wyłączenie Odpowiedzialności i Brak Gwarancji</h2>
              <p>
                Narzędzie oraz wygenerowane analizy, punktacje i ulepszone wersje promptów są dostarczane w stanie, w jakim się znajdują (<strong>"as-is"</strong>), bez jakichkolwiek gwarancji – wyraźnych lub dorozumianych.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs">
                <li>System nie gwarantuje, że poprawione prompty przyniosą określony rezultat biznesowy, sprzedażowy lub techniczny.</li>
                <li>System nie gwarantuje całkowitej poprawności i braku zjawiska tzw. halucynacji (generowania fałszywych informacji) przez poprawione instrukcje.</li>
                <li>Użytkownik ponosi pełną odpowiedzialność za końcowe przetestowanie i zatwierdzenie zoptymalizowanego promptu we własnym środowisku roboczym lub produkcyjnym.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">3. Odpowiedzialność Użytkownika za Dane Wrażliwe</h2>
              <p>
                Korzystając z serwisu, użytkownik zobowiązuje się do nieprzesyłania do analizy jakichkolwiek treści o charakterze poufnym lub niebezpiecznym.
              </p>
              <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-4 font-semibold text-rose-950">
                <p className="text-xs uppercase text-rose-800 mb-1">Czego nie wolno wklejać:</p>
                <p className="text-xs leading-relaxed">
                  Zabrania się wklejania haseł dostępowych, kluczy API, tokenów uwierzytelniających, wrażliwych danych osobowych (PII), danych medycznych, finansowych, a także danych klientów bez ich wyraźnej zgody. Użytkownik ponosi wyłączną odpowiedzialność za wszelkie szkody wynikłe z ujawnienia takich danych w promptach.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">4. Retencja Danych i Anonimowe Sesje</h2>
              <p>
                Zgodnie z naszą polityką retencji:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs">
                <li>Raporty i wyniki audytów są przechowywane w bazie danych przez okres <strong>30 dni</strong> od momentu wygenerowania, po czym ulegają automatycznemu usunięciu.</li>
                <li>Prywatne powiązanie z raportami opiera się na pliku cookie <code>owner_anonymous_id</code> o żywotności 30 dni.</li>
                <li><strong>Ostrzeżenie o plikach cookie:</strong> Wyszyszczenie historii przeglądarki, usunięcie plików cookie lub zmiana urządzenia spowoduje permanentne zerwanie powiązania sesji. Oznacza to natychmiastową i nieodwracalną utratę dostępu do Twoich prywatnych stron wyników w formacie `/result/[id]`. Zespół techniczny nie posiada technicznej możliwości przywrócenia dostępu do tych danych.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">5. Funkcja Udostępniania (Public Share Links)</h2>
              <p>
                Wszystkie analizy są domyślnie ściśle prywatne. Udostępnienie wyników osobom trzecim za pomocą publicznego linku `/share/[token]` jest w pełni opcjonalne (**opt-in**). Użytkownik decyduje, kiedy wygenerować link i może go w każdej chwili zdezaktywować w panelu raportu, co wywoła natychmiastowe zablokowanie publicznego dostępu.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">6. Limitowanie Zapytań i Ochrona Serwisu</h2>
              <p>
                W celu zapewnienia stabilności infrastruktury i równego dostępu dla wszystkich użytkowników, system nakłada limity częstotliwości zapytań (rate limiting). Wszelkie próby zautomatyzowanego scrapowania, przeciążania infrastruktury (ataków DoS/DDoS) lub omijania limitów za pomocą serwerów proxy będą skutkowały natychmiastowym zablokowaniem dostępu.
              </p>
            </section>

            <section className="space-y-3 border-t border-slate-100 pt-6">
              <p className="text-xs text-slate-500">
                MVP PromptPolish nie oferuje w tej fazie żadnych usług płatnych, subskrypcji ani kont komercyjnych. Narzędzie jest bezpłatne i otwarte do testów społecznościowych.
              </p>
            </section>

          </div>
        </article>
      </main>

      {/* Navigation Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 px-6 mt-16">
        <div className="mx-auto max-w-5xl flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500 font-semibold">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-600">
              <span className="font-bold text-white text-[10px]">P</span>
            </div>
            <span>PromptPolish</span>
          </div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-indigo-600 transition">Polityka Prywatności</Link>
            <span>© {new Date().getFullYear()} PromptPolish. Wersja robocza MVP.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
