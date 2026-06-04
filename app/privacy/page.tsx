import { AppHeader } from '@/components/layout/app-header'
import { AppFooter } from '@/components/layout/app-footer'

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col pp-grid-bg text-pp-text selection:bg-pp-border-bright selection:text-white antialiased font-mono">
      <AppHeader />

      {/* Main Content Area */}
      <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16 z-10 relative">
        
        {/* Draft Alert Notice */}
        <div className="border-2 border-pp-warning bg-pp-warning/10 p-5 mb-8 font-mono">
          <div className="flex gap-3 items-start">
            <span className="text-lg font-bold text-pp-warning">⚠️</span>
            <div>
              <h3 className="text-xs font-bold text-pp-warning uppercase tracking-wider">Wersja Robocza / Draft Privacy Policy</h3>
              <p className="mt-1.5 text-[11px] leading-relaxed text-pp-muted font-medium uppercase">
                To jest roboczy draft polityki prywatności dla platformy <strong>PromptPolish</strong>. Niniejszy dokument służy celom deweloperskim i testowym, nie stanowi oficjalnej porady prawnej i wymaga pełnego audytu prawnego przed udostępnieniem serwisu dla publicznego ruchu lub transakcji płatniczych z Unii Europejskiej (UE). Wdrożenie płatności produkcyjnych (Paid Production) jest wstrzymane do czasu ukończenia weryfikacji przez certyfikowanego radcę prawnego. Zgodność z RODO (GDPR) nie jest na tym etapie gwarantowana.
              </p>
            </div>
          </div>
        </div>

        {/* Article Container */}
        <div className="pp-panel p-6 sm:p-10 border-2 border-pp-border relative">
          <div className="absolute top-0 right-4 -translate-y-1/2 bg-pp-bg px-2 text-[9px] font-bold text-pp-cyan tracking-widest uppercase">
            {"// METADANE_POLITYKI"}
          </div>

          <article className="space-y-6 text-xs leading-relaxed text-pp-text">
            <div className="border-b border-pp-border pb-4">
              <h1 className="text-xl font-black uppercase tracking-wider text-pp-text">
                Polityka Prywatności (Draft MVP)
              </h1>
              <p className="mt-1 text-[10px] text-pp-muted uppercase">Ostatnia aktualizacja: 4 czerwca 2026 r.</p>
            </div>
            
            <div className="space-y-8 font-mono">
              
              <section className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-pp-cyan">1. Ochrona Danych i Krytyczne Ostrzeżenie</h2>
                <p className="text-pp-muted">
                  PromptPolish stawia bezpieczeństwo Twoich danych na pierwszym miejscu, działając w oparciu o model <strong>anonymous-first</strong>. W przypadku wersji bezpłatnej nie wymagamy rejestracji, zakładania kont, ani podawania adresów e-mail do przeprowadzenia analizy. W przypadku wyboru płatnego abonamentu (Pro Plan) dane konta i powiązane dane transakcyjne będą przetwarzane wyłącznie w celach realizacji subskrypcji.
                </p>
                <div className="border border-pp-danger bg-pp-danger/10 p-4 font-bold text-pp-danger leading-relaxed">
                  <p className="text-[10px] uppercase tracking-wider mb-1">⚠️ BEZWZGLĘDNY ZAKAZ WKLEJANIA DANYCH WRAŻLIWYCH:</p>
                  <p className="text-[11px] font-normal leading-relaxed lowercase">
                    POD ŻADNYM POZOREM NIE WKLEJAJ W POLU ANALIZY PROMPTÓW HASEŁ, KLUCZY API (NP. TOKENÓW OpenAI/Google), POUFNYCH DANYCH FINANSOWYCH, DANYCH OSOBOWYCH SWOICH KLIENTÓW ANI TAJEMNIC PRZEDSIĘBIORSTWA. SYSTEM URUCHAMIA AUTOMATYCZNE PREFLIGHT FILTRY BEZPIECZEŃSTWA, ALE NIE ZASTĘPUJĄ ONE OSTROŻNOŚCI UŻYTKOWNIKA.
                  </p>
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-pp-cyan">2. Sesja Anonimowa i Pliki Cookie</h2>
                <p className="text-pp-muted">
                  W celach autoryzacyjnych i w celu zachowania własności nad audytami bez logowania, system generuje identyfikator sesji zapisywany w pliku cookie o nazwie <code>owner_anonymous_id</code> (atrybuty HttpOnly, Secure, SameSite=Strict).
                </p>
                <p className="text-pp-muted">
                  Identyfikator ten jest powiązany z wygenerowanymi przez Ciebie raportami przez okres <strong>30 dni</strong>.
                </p>
                <p className="font-bold text-pp-text uppercase">
                  Ważne: Wyszyszczenie plików cookie lub pamięci podręcznej w przeglądarce spowoduje bezpowrotną utratę dostępu do wygenerowanych wcześniej prywatnych linków typu <code>/result/[id]</code>. Serwer nie będzie w stanie zweryfikować Twoich uprawnień do odczytu lub edycji tych raportów.
                </p>
                <div className="border border-pp-border bg-pp-panel-2 p-4 text-[11px] leading-relaxed text-pp-muted">
                  <p className="font-bold text-pp-text uppercase mb-1">Informacja dotycząca plików cookie (ePrivacy Note):</p>
                  <p className="leading-relaxed">
                    Bieżące założenie: używane są wyłącznie pliki cookie ściśle niezbędne. Wymogi dotyczące zgody na pliki cookie muszą zostać zweryfikowane przed publicznym uruchomieniem, w szczególności jeśli dodane zostaną zewnętrzne narzędzia analityczne lub marketingowe.
                  </p>
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-pp-cyan">3. Konta Użytkowników i Zbierane Dane</h2>
                <p className="text-pp-muted">
                  Po zalogowaniu się do serwisu (opcjonalna rejestracja), zbieramy i przetwarzamy następujące dane:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-pp-muted">
                  <li><strong>Dane konta:</strong> Adres e-mail, identyfikator użytkownika oraz nazwa wyświetlana.</li>
                  <li><strong>Historia promptów:</strong> Treści przesyłanych zapytań tekstowych oraz wygenerowane ulepszenia (optymalizacje), oceny i diagnozy, aby umożliwić synchronizację i ponowny dostęp do zapytań.</li>
                  <li><strong>Metadane płatności Stripe:</strong> Kiedy subskrypcje i bramka płatnicza zostaną włączone, przetwarzane będą metadane płatnicze (np. status subskrypcji, identyfikator klienta Stripe). Dane te są synchronizowane tylko wtedy, gdy billing jest aktywny.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-pp-cyan">4. Zewnętrzni Dostawcy i Podmioty Przetwarzające</h2>
                <p className="text-pp-muted">
                  W celu dostarczania usług, PromptPolish planuje współpracować z poniższymi podmiotami. Przesyłanie danych do tych dostawców ma status <strong>&quot;do zweryfikowania przed wdrożeniem produkcyjnym&quot;</strong> i wymaga formalnego zawarcia umów powierzenia przetwarzania (DPA):
                </p>
                <ul className="list-disc pl-5 space-y-2 text-pp-muted">
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
                    <strong>OpenRouter / skonfigurowany dostawca modelu AI (Silnik AI)</strong>: Odpowiada za generowanie audytów i optymalizację promptów. Zasady zapisu logów oraz data residency stanowią przedmiot weryfikacji umów handlowych.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-pp-cyan">5. Retencja Danych (Okres Przechowywania)</h2>
                <p className="text-pp-muted">
                  Harmonogram retencji danych stanowi odzwierciedlenie <strong>bieżącego założenia technicznego (engineering intent)</strong>, a nie ostateczną prawną certyfikację zgodności:
                </p>
                
                <div className="overflow-x-auto my-4 border border-pp-border">
                  <table className="min-w-full divide-y divide-pp-border text-[11px] font-mono text-pp-text uppercase">
                    <thead>
                      <tr className="bg-pp-panel text-left font-bold text-pp-cyan">
                        <th className="px-4 py-2 border-r border-pp-border">Typ Danych</th>
                        <th className="px-4 py-2 border-r border-pp-border">Okres Przechowywania</th>
                        <th className="px-4 py-2">Opis i Uzasadnienie</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pp-border bg-black/10 text-pp-muted">
                      <tr>
                        <td className="px-4 py-3 font-semibold border-r border-pp-border text-pp-text">Anonimowe analizy promptów</td>
                        <td className="px-4 py-3 text-pp-cyan font-bold border-r border-pp-border">30 Dni</td>
                        <td className="px-4 py-3">Automatycznie usuwane z bazy danych Supabase po 30 dniach od ich utworzenia.</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold border-r border-pp-border text-pp-text">Zgromadzone logi i telemetria</td>
                        <td className="px-4 py-3 text-pp-cyan font-bold border-r border-pp-border">90 Dni</td>
                        <td className="px-4 py-3">Używane do analizy błędów i zabezpieczania aplikacji.</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold border-r border-pp-border text-pp-text">Opinie i głosy (Upvote/Downvote)</td>
                        <td className="px-4 py-3 text-pp-cyan font-bold border-r border-pp-border">180 Dni</td>
                        <td className="px-4 py-3">Zbierane w celach analizy jakości ocen audytora promptów.</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold border-r border-pp-border text-pp-text">Subskrypcje i Faktury Stripe</td>
                        <td className="px-4 py-3 text-pp-warning font-bold border-r border-pp-border">Zgodnie z przepisami</td>
                        <td className="px-4 py-3">Przechowywane po stronie Stripe przez 5-7 lat zgodnie z przepisami podatkowymi (tylko w przypadku płatności).</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-pp-cyan">6. Udostępnianie Wyników i Generowane Pliki</h2>
                <p className="text-pp-muted">
                  Wszystkie analizy są domyślnie prywatne. Funkcje udostępniania i eksportu podlegają następującym zasadom:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-pp-muted">
                  <li><strong>Publiczne linki (Share Links):</strong> Użytkownik może dobrowolnie wygenerować publiczny link `/share/[token]`. Wygenerowane w ten sposób publiczne analizy są <strong>wyłączone z automatycznej 30-dniowej procedury usuwania</strong>, aby uniknąć niedziałających linków. Pozostają aktywne w bazie danych, dopóki użytkownik ręcznie nie wyłączy udostępniania lub nie usunie danej analizy.</li>
                  <li><strong>Eksport plików (PDF/Markdown):</strong> Generowane pliki eksportu są kompilowane w pamięci na żądanie i przesyłane bezpośrednio do przeglądarki. Nie są trwale składowane w bazie ani w object storage.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-pp-cyan">7. Prawa Użytkownika i Procedura Usuwania</h2>
                <p className="text-pp-muted">
                  Użytkownicy posiadają prawo dostępu do swoich danych, ich poprawiania oraz żądania ich usunięcia:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-pp-muted">
                  <li>
                    <strong>Dla Użytkowników Anonimowych:</strong> Możesz usunąć lokalne ciasteczka w przeglądarce, co natychmiast zerwie połączenie z Twoimi danymi. Rekordy w bazie danych zostaną automatycznie wyczyszczone zgodnie z 30-dniowym cyklem retencji.
                  </li>
                  <li>
                    <strong>Dla Użytkowników Zalogowanych:</strong> Usunięcie konta w panelu ustawień aplikacji powoduje natychmiastowe wysłanie żądań anulowania subskrypcji do Stripe oraz kaskadowe usunięcie profilu, historii zapytań oraz powiązanych danych z bazy Supabase.
                  </li>
                  <li>
                    <strong>Wnioski ręczne:</strong> Pytania o zakres przetwarzanych danych lub wnioski o ich usunięcie można kierować na adres: <code>[PRIVACY CONTACT EMAIL TBD]</code> lub <code>[SUPPORT EMAIL TBD]</code>. Wniosek zostanie zweryfikowany pod kątem własności sesji.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-pp-cyan">8. Telemetria i Bezpieczeństwo IP</h2>
                <p className="text-pp-muted">
                  Adresy IP użytkowników są wykorzystywane do celów obronnych (rate limiting, ochrona przed atakami DDoS). W tym celu na serwerze adresy IP są natychmiast solone i hashowane w pamięci operacyjnej przed zapisaniem do bazy. Klucz szyfrujący (sól) ulega rotacji co <strong>24 godziny</strong>, co uniemożliwia trwałą rekonstrukcję lub śledzenie historycznych adresów IP.
                </p>
              </section>

              <section className="space-y-3 border-t border-pp-border pt-6 text-[11px] text-pp-muted">
                <h2 className="text-xs font-bold text-pp-text uppercase">9. Kontakt w Sprawach Prywatności</h2>
                <p>
                  Wszelkie zapytania dotyczące ochrony danych osobowych prosimy kierować na poniższe dane kontaktowe:
                </p>
                <ul className="list-none space-y-1 mt-2">
                  <li><strong>Koordynator ds. prywatności:</strong> <code>[PRIVACY CONTACT EMAIL TBD]</code></li>
                  <li><strong>E-mail wsparcia:</strong> <code>[SUPPORT EMAIL TBD]</code></li>
                  <li><strong>Nazwa podmiotu:</strong> <code>[LEGAL ENTITY NAME TBD]</code></li>
                  <li><strong>Adres rejestrowy:</strong> <code>[REGISTERED BUSINESS ADDRESS TBD]</code></li>
                </ul>
              </section>

            </div>
          </article>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}
