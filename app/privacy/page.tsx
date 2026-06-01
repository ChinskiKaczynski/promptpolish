import { AppHeader } from '@/components/layout/app-header'
import { AppFooter } from '@/components/layout/app-footer'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans selection:bg-indigo-100 antialiased">
      <AppHeader />

      {/* Main Content Area */}
      <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        
        {/* Draft Alert Notice */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 mb-8">
          <div className="flex gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <h3 className="text-sm font-bold text-amber-950 uppercase tracking-wider">Wersja Robocza / Draft Privacy Policy</h3>
              <p className="mt-1 text-xs leading-relaxed text-amber-900 font-medium">
                To jest roboczy draft polityki prywatności dla fazy MVP narzędzia <strong>PromptPolish</strong>. Niniejszy dokument służy celom demonstracyjnym i testowym, nie stanowi oficjalnej porady prawnej i wymaga pełnego audytu prawnego przed udostępnieniem serwisu dla publicznego ruchu lub transakcji płatniczych z Unii Europejskiej (UE). Wdrożenie płatności produkcyjnych (Paid Production) jest wstrzymane do czasu ukończenia weryfikacji przez certyfikowanego radcę prawnego. Zgodność z RODO (GDPR) nie jest na tym etapie gwarantowana.
              </p>
            </div>
          </div>
        </div>

        {/* Article Container */}
        <article className="prose prose-slate max-w-none">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            Polityka Prywatności (Draft MVP)
          </h1>
          <p className="mt-2 text-xs text-slate-400">Ostatnia aktualizacja: 24 maja 2026 r.</p>
          
          <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-700">
            
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">1. Ochrona Danych i Krytyczne Ostrzeżenie</h2>
              <p>
                PromptPolish stawia bezpieczeństwo Twoich danych na pierwszym miejscu, działając w oparciu o model <strong>anonymous-first</strong>. W przypadku wersji bezpłatnej nie wymagamy rejestracji, zakładania kont, ani podawania adresów e-mail do przeprowadzenia analizy. W przypadku wyboru płatnego abonamentu (Pro Plan) dane konta i płatności są przetwarzane w celach realizacji subskrypcji.
              </p>
              <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-4 font-medium text-rose-950">
                <p className="text-xs uppercase font-bold text-rose-800 mb-1">⚠️ BEZWZGLĘDNY ZAKAZ WKLEJANIA DANYCH WRAŻLIWYCH:</p>
                <p className="text-xs leading-relaxed">
                  Pod żadnym pozorem nie wklejaj w polu analizy promptów haseł, kluczy API (np. tokenów dostępowych, kluczy OpenAI/Google), poufnych danych finansowych, danych osobowych swoich klientów ani tajemnic przedsiębiorstwa. Narzędzie uruchamia automatyczne lokalne filtry bezpieczeństwa (preflight), ale nie zastępują one zdrowego rozsądku i ostrożności użytkownika.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">2. Rola i Przetwarzanie przez Zewnętrznych Dostawców (Sub-procesorów)</h2>
              <p>
                W celu dostarczania usług na najwyższym poziomie, PromptPolish współpracuje z zaufanymi dostawcami technologicznymi. Dane są przekazywane i przetwarzane w następujący sposób:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs">
                <li>
                  <strong>Vercel (Hosting)</strong>: Odpowiada za serwowanie aplikacji, routing żądań oraz logi serwerowe (zabezpieczone i ograniczone do celów telemetrycznych).
                </li>
                <li>
                  <strong>Supabase (Baza danych Postgres)</strong>: Odpowiada za bezpieczne przechowywanie danych kont użytkowników, sesji, transakcji oraz historii promptów. Baza danych jest zlokalizowana w regionie europejskim (EEA).
                </li>
                <li>
                  <strong>Stripe (Procesowanie Płatności)</strong>: Odpowiada za realizację transakcji finansowych, fakturowanie oraz obsługę subskrypcji Pro. PromptPolish nie przechowuje ani nie ma dostępu do surowych danych kart płatniczych – całe procesowanie odbywa się po stronie Stripe.
                </li>
                <li>
                  <strong>Google Gemini API (Dostawca AI)</strong>: Odpowiada za przetwarzanie przesłanych promptów w celu generowania punktacji, diagnozy i ulepszeń. Dane te są przetwarzane wyłącznie w pamięci operacyjnej (in-memory execution) i zgodnie z warunkami handlowymi API nie są zapisywane na stałe ani używane do trenowania modeli publicznych.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">3. Zasady Subskrypcji i Zgodność Cennika</h2>
              <p>
                Wprowadzony model płatności (Pro Plan) oferuje rozszerzone możliwości analizy promptów:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs">
                <li><strong>Cena abonamentu:</strong> Wynosi od <strong>$9.00 do $12.00 USD miesięcznie</strong> (zależnie od ostatecznej konfiguracji i podatków lokalnych).</li>
                <li><strong>Okres próbny:</strong> Brak (bezpłatna wersja anonimowa służy jako stały okres próbny usługi).</li>
                <li><strong>Polityka Zwrotów:</strong> Oferujemy <strong>14-dniową gwarancję zwrotu pieniędzy</strong> pod warunkiem, że w danym cyklu rozliczeniowym użytkownik wykonał <strong>mniej niż 10 analiz promptów</strong>. W przypadku wykonania 10 lub więcej analiz, subskrypcja staje się bezzwrotna ze względu na bezpośrednie koszty przetwarzania AI.</li>
                <li><strong>Anulowanie:</strong> Możliwe w dowolnym momencie przez panel Stripe Customer Portal. Dostęp do konta Pro wygasa z końcem opłaconego okresu.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">4. Retencja Danych (Okres Przechowywania)</h2>
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
                      <td className="px-4 py-3 font-semibold">Subskrypcje i Inwentarz Stripe</td>
                      <td className="px-4 py-3 text-amber-600 font-bold">Zgodnie z przepisami podatkowymi</td>
                      <td className="px-4 py-3">Faktury i dane transakcyjne na Stripe są przechowywane przez 5-7 lat zgodnie z wymogami prawa podatkowego.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">5. Sesja Anonimowa i Pliki Cookie</h2>
              <p>
                W celach autoryzacyjnych system generuje bezpieczny identyfikator połączenia zapisywany w pliku cookie o nazwie <code>owner_anonymous_id</code> (posiadający atrybuty <code>httpOnly</code>, <code>secure</code> oraz <code>sameSite=&apos;strict&apos;</code>).
              </p>
              <p>
                Identyfikator ten jest powiązany z wygenerowanymi przez Ciebie raportami przez okres <strong>30 dni</strong>.
              </p>
              <p className="font-semibold text-slate-900">
                Ważne: Wyszyszczenie plików cookie lub pamięci podręcznej w Twojej przeglądarce spowoduje bezpowrotną utratę dostępu do wygenerowanych wcześniej prywatnych linków typu `/result/[id]`. Serwer nie będzie w stanie zweryfikować Twoich uprawnień do edycji ani odczytu.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">6. Procedura Usuwania Danych (Right to Be Forgotten)</h2>
              <p>
                Każdy użytkownik posiada prawo do całkowitego usunięcia swoich danych osobowych lub pseudonimizowanych (RODO Art. 17):
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs">
                <li>
                  <strong>Dla Użytkowników Anonimowych:</strong> Możesz kliknąć przycisk &bdquo;Usuń Historię&rdquo; w panelu raportu. Spowoduje to natychmiastowe wysłanie żądania do bazy danych, usunięcie rekordów analiz i wyczyszczenie ciasteczka. Alternatywnie, wyczyszczenie ciasteczek w przeglądarce odcina powiązanie, a rekordy zostaną automatycznie usunięte po 30 dniach.
                </li>
                <li>
                  <strong>Dla Użytkowników Rejestrowanych:</strong> Po wdrożeniu modułu kont użytkownicy mogą usunąć profil bezpośrednio w panelu ustawień konta. Spowoduje to natychmiastowe anulowanie subskrypcji Stripe oraz kaskadowe usunięcie danych z tabel profilowych i promptów w bazie danych Supabase.
                </li>
                <li>
                  <strong>Zgłoszenia Ręczne:</strong> Możesz wysłać e-mail na adres <code>support@promptpolish.com</code> z prośbą o usunięcie danych (podając tokeny udostępniania lub ID raportów). Zgłoszenie zostanie przetworzone w terminie do 30 dni.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">7. Limitowanie Zapytań i Ochrona Prywatności IP</h2>
              <p>
                W celu ochrony przed nadużyciami infrastruktury i generowaniem niepotrzebnych kosztów u dostawców AI, system stosuje automatyczne ograniczenia liczby zapytań (rate limiting). W tym celu na serwerze analizowane są zaszyfrowane (solone i zahashowane) adresy IP połączeń. W celu uniemożliwienia trwałego śledzenia lub odtworzenia adresów IP, klucz szyfrujący (sól) jest rotowany co **24 godziny**.
              </p>
            </section>

            <section className="space-y-3 border-t border-slate-100 pt-6">
              <p className="text-xs text-slate-500">
                Projekt PromptPolish rozwijany jest jako system chroniący prywatność w fazie MVP. Wszelkie uwagi dotyczące przetwarzania danych prosimy zgłaszać bezpośrednio do zespołu technicznego na adres support@promptpolish.com.
              </p>
            </section>

          </div>
        </article>
      </main>

      <AppFooter />
    </div>
  )
}
