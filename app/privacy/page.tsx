import { AppHeader } from '@/components/layout/app-header'
import { AppFooter } from '@/components/layout/app-footer'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50/30 text-slate-900 font-sans selection:bg-indigo-100 antialiased">
      <AppHeader />

      {/* Main Content Area */}
      <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        
        {/* Draft Alert Notice */}
        <div className="rounded-3xl border border-amber-200/70 bg-amber-50/20 p-5 mb-8 shadow-sm">
          <div className="flex gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <h3 className="text-sm font-bold text-amber-955 uppercase tracking-wider">Wersja Robocza / Draft Privacy Policy</h3>
              <p className="mt-1 text-xs leading-relaxed text-amber-900 font-semibold">
                To jest roboczy draft polityki prywatności dla platformy <strong>PromptPolish</strong>. Niniejszy dokument służy celom deweloperskim i testowym, nie stanowi oficjalnej porady prawnej i wymaga pełnego audytu prawnego przed udostępnieniem serwisu dla publicznego ruchu lub transakcji płatniczych z Unii Europejskiej (UE). Wdrożenie płatności produkcyjnych (Paid Production) jest wstrzymane do czasu ukończenia weryfikacji przez certyfikowanego radcę prawnego. Zgodność z RODO (GDPR) nie jest na tym etapie gwarantowana.
              </p>
            </div>
          </div>
        </div>

        {/* Article Container */}
        <article className="prose prose-slate max-w-none">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            Polityka Prywatności (Draft MVP)
          </h1>
          <p className="mt-2 text-xs text-slate-400">Ostatnia aktualizacja: 4 czerwca 2026 r.</p>
          
          <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-700">
            
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">1. Ochrona Danych i Krytyczne Ostrzeżenie</h2>
              <p>
                PromptPolish stawia bezpieczeństwo Twoich danych na pierwszym miejscu, działając w oparciu o model <strong>anonymous-first</strong>. W przypadku wersji bezpłatnej nie wymagamy rejestracji, zakładania kont, ani podawania adresów e-mail do przeprowadzenia analizy. W przypadku wyboru płatnego abonamentu (Pro Plan) dane konta i powiązane dane transakcyjne będą przetwarzane wyłącznie w celach realizacji subskrypcji.
              </p>
              <div className="rounded-2xl border border-rose-100 bg-rose-50/20 p-4 font-semibold text-rose-950">
                <p className="text-xs uppercase font-bold text-rose-800 mb-1">⚠️ BEZWZGLĘDNY ZAKAZ WKLEJANIA DANYCH WRAŻLIWYCH:</p>
                <p className="text-xs leading-relaxed">
                  Pod żadnym pozorem nie wklejaj w polu analizy promptów haseł, kluczy API (np. tokenów dostępowych, kluczy OpenAI/Google), poufnych danych finansowych, danych osobowych swoich klientów ani tajemnic przedsiębiorstwa. Narzędzie uruchamia automatyczne lokalne filtry bezpieczeństwa (preflight), ale nie zastępują one zdrowego rozsądku i ostrożności użytkownika.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">2. Sesja Anonimowa i Pliki Cookie</h2>
              <p>
                W celach autoryzacyjnych i w celu zachowania własności nad audytami bez logowania, system generuje identyfikator sesji zapisywany w pliku cookie o nazwie <code>owner_anonymous_id</code> (atrybuty HttpOnly, Secure, SameSite=Strict).
              </p>
              <p>
                Identyfikator ten jest powiązany z wygenerowanymi przez Ciebie raportami przez okres <strong>30 dni</strong>.
              </p>
              <p className="font-semibold text-slate-900">
                Ważne: Wyszyszczenie plików cookie lub pamięci podręcznej w przeglądarce spowoduje bezpowrotną utratę dostępu do wygenerowanych wcześniej prywatnych linków typu <code>/result/[id]</code>. Serwer nie będzie w stanie zweryfikować Twoich uprawnień do odczytu lub edycji tych raportów.
              </p>
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/20 p-4 text-xs font-semibold">
                <p className="font-bold text-indigo-950 uppercase mb-1">Informacja dotycząca plików cookie (ePrivacy Note):</p>
                <p className="leading-relaxed text-indigo-900">
                  Bieżące założenie: używane są wyłącznie pliki cookie ściśle niezbędne. Wymogi dotyczące zgody na pliki cookie muszą zostać zweryfikowane przed publicznym uruchomieniem, w szczególności jeśli dodane zostaną zewnętrzne narzędzia analityczne lub marketingowe.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">3. Konta Użytkowników i Zbierane Dane</h2>
              <p>
                Po zalogowaniu się do serwisu (opcjonalna rejestracja), zbieramy i przetwarzamy następujące dane:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 font-semibold">
                <li><strong>Dane konta:</strong> Adres e-mail, identyfikator użytkownika oraz nazwa wyświetlana.</li>
                <li><strong>Historia promptów:</strong> Treści przesyłanych zapytań tekstowych oraz wygenerowane ulepszenia (optymalizacje), oceny i diagnozy, aby umożliwić synchronizację i ponowny dostęp do zapytań na różnych urządzeniach.</li>
                <li><strong>Metadane płatności Stripe:</strong> Kiedy subskrypcje i bramka płatnicza zostaną włączone, przetwarzane będą metadane płatnicze (np. status subskrypcji, identyfikator klienta Stripe). Dane te są synchronizowane tylko wtedy, gdy billing jest aktywny w systemie.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">4. Zewnętrzni Dostawcy i Podmioty Przetwarzające (Sub-processors)</h2>
              <p>
                W celu dostarczania usług, PromptPolish planuje współpracować z poniższymi podmiotami. Przesyłanie danych do tych dostawców ma status <strong>&quot;do zweryfikowania przed wdrożeniem produkcyjnym&quot;</strong> i wymaga formalnego zawarcia umów powierzenia przetwarzania (DPA):
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs text-slate-600 font-semibold">
                <li>
                  <strong>Supabase, Inc. (Baza danych)</strong>: Odpowiada za przechowywanie rejestrów sesji, historii promptów oraz danych kont użytkowników. Baza danych oraz kopie zapasowe podlegają weryfikacji pod kątem fizycznej lokalizacji serwerów i ograniczenia ich do obszaru EOG (EEA).
                </li>
                <li>
                  <strong>Vercel Inc. (Hosting i Telemetria)</strong>: Odpowiada za hosting interfejsu, routing oraz bezserwerowe funkcje API. Regiony przetwarzania żądań podlegają weryfikacji i konfiguracji przed startem komercyjnym.
                </li>
                <li>
                  <strong>Stripe, Inc. (Procesowanie płatności)</strong>: Odpowiada za obsługę Checkout, transakcje oraz cykl życia subskrypcji. Serwis nie przechowuje ani nie ma dostępu do pełnych numerów kart płatniczych. Retencja faktur podlega regulacjom podatkowym.
                </li>
                <li>
                  <strong>OpenRouter / skonfigurowany dostawca modelu AI (Silnik AI)</strong>: Odpowiada za generowanie audytów i optymalizację promptów. Zasady zapisu logów, polityki braku trenowania modeli oraz data residency u dostawców modeli AI stanowią przedmiot weryfikacji umów handlowych (status: warunki do weryfikacji).
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">5. Retencja Danych (Okres Przechowywania)</h2>
              <p>
                Harmonogram retencji danych stanowi odzwierciedlenie <strong>bieżącego założenia technicznego (engineering intent)</strong>, a nie ostateczną prawną certyfikację zgodności:
              </p>
              
              <div className="overflow-x-auto my-4 rounded-2xl border border-slate-200 bg-white">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-left font-semibold text-slate-700">
                      <th className="px-4 py-3">Typ Danych</th>
                      <th className="px-4 py-3">Okres Przechowywania</th>
                      <th className="px-4 py-3">Opis i Uzasadnienie techniczne</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white text-slate-600 font-semibold">
                    <tr>
                      <td className="px-4 py-3 font-bold text-slate-800">Anonimowe analizy promptów</td>
                      <td className="px-4 py-3 text-indigo-650 font-bold">30 Dni</td>
                      <td className="px-4 py-3">Automatycznie usuwane z bazy danych Supabase po 30 dniach od ich utworzenia.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-bold text-slate-800">Zgromadzone logi i telemetria</td>
                      <td className="px-4 py-3 text-indigo-650 font-bold">90 Dni</td>
                      <td className="px-4 py-3">Używane do analizy błędów i zabezpieczania aplikacji.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-bold text-slate-800">Opinie i głosy (Upvote/Downvote)</td>
                      <td className="px-4 py-3 text-indigo-650 font-bold">180 Dni</td>
                      <td className="px-4 py-3">Zbierane w celach analizy jakości ocen audytora promptów.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-bold text-slate-800">Subskrypcje i Faktury Stripe</td>
                      <td className="px-4 py-3 text-amber-600 font-bold">Zgodnie z przepisami</td>
                      <td className="px-4 py-3">Przechowywane po stronie Stripe przez 5-7 lat zgodnie z przepisami podatkowymi (tylko w przypadku płatności).</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">6. Udostępnianie Wyników i Generowane Pliki</h2>
              <p>
                Wszystkie analizy są domyślnie prywatne. Funkcje udostępniania i eksportu podlegają następującym zasadom:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 font-semibold">
                <li><strong>Publiczne linki (Share Links):</strong> Użytkownik może dobrowolnie wygenerować publiczny link `/share/[token]`. Wygenerowane w ten sposób publiczne analizy są <strong>wyłączone z automatycznej 30-dniowej procedury usuwania</strong>, aby uniknąć niedziałających linków u osób trzecich. Pozostają aktywne w bazie danych, dopóki użytkownik ręcznie nie wyłączy udostępniania lub nie usunie danej analizy.</li>
                <li><strong>Eksport plików (PDF/Markdown):</strong> Generowane pliki eksportu (PDF oraz pliki Markdown) są kompilowane w pamięci na żądanie i przesyłane bezpośrednio do przeglądarki użytkownika. Nie są trwale składowane w bazie ani w magazynach plików (object storage).</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">7. Prawa Użytkownika i Procedura Usuwania (RODO/GDPR Art. 17)</h2>
              <p>
                Użytkownicy posiadają prawo dostępu do swoich danych, ich poprawiania oraz żądania ich usunięcia:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 font-semibold">
                <li>
                  <strong>Dla Użytkowników Anonimowych:</strong> Możesz usunąć lokalne ciasteczka w przeglądarce, co natychmiast zerwie połączenie z Twoimi danymi. Rekordy w bazie danych zostaną automatycznie wyczyszczone zgodnie z 30-dniowym cyklem retencji.
                </li>
                <li>
                  <strong>Dla Użytkowników Zalogowanych:</strong> Usunięcie konta w panelu ustawień aplikacji powoduje natychmiastowe wysłanie żądań anulowania subskrypcji do Stripe oraz kaskadowe usunięcie profilu, historii zapytań oraz powiązanych danych z bazy Supabase.
                </li>
                <li>
                  <strong>Wnioski ręczne:</strong> Pytania o zakres przetwarzanych danych lub wnioski o ich usunięcie można kierować na adres: <code>[PRIVACY CONTACT EMAIL TBD]</code> lub <code>[SUPPORT EMAIL TBD]</code>. Wniosek zostanie zweryfikowany pod kątem własności sesji i obsłużony w ustawowym terminie.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">8. Telemetria i Bezpieczeństwo IP</h2>
              <p>
                Adresy IP użytkowników są wykorzystywane do celów obronnych (rate limiting, ochrona przed atakami DDoS). W tym celu na serwerze adresy IP są natychmiast solone i hashowane w pamięci operacyjnej przed zapisaniem do bazy. Klucz szyfrujący (sól) ulega rotacji co <strong>24 godziny</strong>, co uniemożliwia trwałą rekonstrukcję lub śledzenie historycznych adresów IP.
              </p>
            </section>

            <section className="space-y-3 border-t border-slate-200 pt-6">
              <h2 className="text-base font-bold text-slate-900">9. Kontakt w Sprawach Prywatności</h2>
              <p className="text-xs">
                Wszelkie zapytania dotyczące ochrony danych osobowych prosimy kierować na poniższe dane kontaktowe:
              </p>
              <ul className="list-none space-y-1 text-xs text-slate-600 font-semibold">
                <li><strong>Koordynator ds. prywatności:</strong> <code>[PRIVACY CONTACT EMAIL TBD]</code></li>
                <li><strong>E-mail wsparcia:</strong> <code>[SUPPORT EMAIL TBD]</code></li>
                <li><strong>Nazwa podmiotu:</strong> <code>[LEGAL ENTITY NAME TBD]</code></li>
                <li><strong>Adres rejestrowy:</strong> <code>[REGISTERED BUSINESS ADDRESS TBD]</code></li>
              </ul>
            </section>

          </div>
        </article>
      </main>

      <AppFooter />
    </div>
  )
}
