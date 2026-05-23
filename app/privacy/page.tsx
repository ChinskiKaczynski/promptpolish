import Link from 'next/link'

export default function PrivacyPage() {
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
              <h3 className="text-sm font-bold text-amber-950 uppercase tracking-wider">Wersja Robocza / Draft Policy</h3>
              <p className="mt-1 text-xs leading-relaxed text-amber-900">
                To jest roboczy draft polityki prywatności dla fazy MVP narzędzia <strong>PromptPolish</strong>. Niniejszy dokument służy celom demonstracyjnym i testowym, nie stanowi oficjalnej porady prawnej i wymaga pełnego audytu prawnego przed udostępnieniem serwisu dla publicznego ruchu z Unii Europejskiej (UE).
              </p>
            </div>
          </div>
        </div>

        {/* Article Container */}
        <article className="prose prose-slate max-w-none">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            Polityka Prywatności (Draft MVP)
          </h1>
          <p className="mt-2 text-xs text-slate-400">Ostatnia aktualizacja: 23 maja 2026 r.</p>
          
          <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-700">
            
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">1. Ochrona Danych i Krytyczne Ostrzeżenie</h2>
              <p>
                PromptPolish stawia bezpieczeństwo Twoich danych na pierwszym miejscu, działając w oparciu o model <strong>anonymous-first</strong>. Nie wymagamy rejestracji, zakładania kont, ani podawania adresów e-mail do przeprowadzenia analizy.
              </p>
              <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-4 font-medium text-rose-950">
                <p className="text-xs uppercase font-bold text-rose-800 mb-1">⚠️ BEZWZGLĘDNY ZAKAZ WKLEJANIA DANYCH WRAŻLIWYCH:</p>
                <p className="text-xs leading-relaxed">
                  Pod żadnym pozorem nie wklejaj w polu analizy promptów haseł, kluczy API (np. tokenów dostępowych, kluczy OpenAI/Google), poufnych danych finansowych, danych osobowych swoich klientów ani tajemnic przedsiębiorstwa. Narzędzie uruchamia automatyczne lokalne filtry bezpieczeństwa (preflight), ale nie zastępują one zdrowego rozsądku i ostrożności użytkownika.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">2. Przetwarzanie przez Zewnętrzne Modele AI</h2>
              <p>
                W celu wygenerowania diagnozy, oceny punktowej oraz ulepszonej wersji instrukcji, treść Twojego promptu jest przesyłana za pośrednictwem bezpiecznego połączenia do API wybranego dostawcy AI (domyślnie profil <strong>Google Gemini API</strong> lub dedykowany model inżynieryjny).
              </p>
              <p>
                Dostawcy ci przetwarzają dane wyłącznie w celu wygenerowania odpowiedzi (tzw. in-memory execution) i zgodnie z ich deklaracjami handlowymi dla API, dane te nie są wykorzystywane do trenowania modeli publicznych ani zapisywane w ich stałych logach operacyjnych.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">3. Retencja Danych (Okres Przechowywania)</h2>
              <p>
                W celu uniknięcia bezterminowego przechowywania informacji, wdrożyliśmy automatyczne mechanizmy usuwania danych z bazy zgodnie z poniższym harmonogramem:
              </p>
              
              <div className="overflow-x-auto my-4">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-left font-semibold text-slate-700">
                      <th className="px-4 py-2">Typ Danych</th>
                      <th className="px-4 py-2">Okres Retencji</th>
                      <th className="px-4 py-2">Cel i Opis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    <tr>
                      <td className="px-4 py-3 font-semibold">Anonimowe analizy promptów</td>
                      <td className="px-4 py-3 text-indigo-600 font-bold">30 Dni</td>
                      <td className="px-4 py-3">Umożliwia użytkownikowi powrót do prywatnego raportu w przeglądarce.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold">Logi użycia i telemetria</td>
                      <td className="px-4 py-3 text-indigo-600 font-bold">90 Dni</td>
                      <td className="px-4 py-3">Używane do monitorowania wydajności, wykrywania błędów i ochrony przed nadużyciami.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold">Opinie i feedback (Upvote/Downvote)</td>
                      <td className="px-4 py-3 text-indigo-600 font-bold">180 Dni</td>
                      <td className="px-4 py-3">Zbierane dobrowolnie celem optymalizacji jakości algorytmów i filtrów audytu.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold">Surowy ładunek API (LLM)</td>
                      <td className="px-4 py-3 text-emerald-600 font-bold">0 Dni (Nigdy)</td>
                      <td className="px-4 py-3">Pakiety przetwarzane są wyłącznie w pamięci operacyjnej serwera.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">4. Sesja Anonimowa i Pliki Cookie</h2>
              <p>
                W celach autoryzacyjnych system generuje bezpieczny identyfikator połączenia zapisywany w pliku cookie o nazwie <code>owner_anonymous_id</code> (posiadający atrybuty <code>httpOnly</code>, <code>secure</code> oraz <code>sameSite='strict'</code>).
              </p>
              <p>
                Identyfikator ten jest powiązany z wygenerowanymi przez Ciebie raportami przez okres <strong>30 dni</strong>. 
              </p>
              <p className="font-semibold text-slate-900">
                Ważne: Wycyszczenie plików cookie lub pamięci podręcznej w Twojej przeglądarce spowoduje bezpowrotną utratę dostępu do wygenerowanych wcześniej prywatnych linków typu `/result/[id]`. Serwer nie będzie w stanie zweryfikować Twoich uprawnień do edycji ani odczytu.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">5. Udostępnianie Publiczne (Share Links)</h2>
              <p>
                Domyślnie wszystkie audyty są całkowicie <strong>prywatne</strong>. Publiczne udostępnianie raportów odbywa się wyłącznie na wyraźne żądanie użytkownika (formuła **opt-in**). 
              </p>
              <p>
                Dopiero po ręcznym aktywowaniu opcji udostępniania w panelu raportu, system wygeneruje publicznie dostępny adres URL `/share/[token]`. Możesz w każdej chwili wyłączyć udostępnianie publiczne, co spowoduje natychmiastowe zablokowanie dostępu osobom trzecim.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">6. Limitowanie Zapytań i Logi Serwera</h2>
              <p>
                W celu ochrony przed nadużyciami infrastruktury i generowaniem niepotrzebnych kosztów u dostawców AI, system stosuje automatyczne ograniczenia liczby zapytań (rate limiting). W tym celu na serwerze analizowane są zaszyfrowane (solone i zahashowane) adresy IP połączeń. Surowe adresy IP nie są zapisywane w bazie danych.
              </p>
            </section>

            <section className="space-y-3 border-t border-slate-100 pt-6">
              <p className="text-xs text-slate-500">
                Projekt PromptPolish rozwijany jest jako system chroniący prywatność w fazie MVP. Wszelkie uwagi dotyczące przetwarzania danych prosimy zgłaszać bezpośrednio do zespołu technicznego.
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
            <Link href="/terms" className="hover:text-indigo-600 transition">Regulamin Serwisu</Link>
            <span>© {new Date().getFullYear()} PromptPolish. Wersja robocza MVP.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
