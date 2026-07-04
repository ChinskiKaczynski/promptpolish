import type { Metadata } from 'next'
import { AppHeader } from '@/components/layout/app-header'
import { AppFooter } from '@/components/layout/app-footer'

export const metadata: Metadata = {
  title: 'Regulamin Świadczenia Usług — PromptPolish',
  robots: {
    index: false,
    follow: true,
  },
}

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0C0C10] text-[#E2E8F0] selection:bg-[#A78BFA]/20 antialiased font-sans">
      <AppHeader />

      {/* Main Content Area */}
      <main className="flex-grow mx-auto max-w-3xl w-full px-6 py-12 sm:py-16">
        
        {/* Article Container */}
        <article className="max-w-none">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#E2E8F0] sm:text-4xl font-heading">
            Regulamin Świadczenia Usług
          </h1>
          <p className="mt-2 text-xs text-[#8290A2]">Ostatnia aktualizacja: 4 czerwca 2026 r.</p>
          
          <div className="mt-8 space-y-8 text-sm leading-relaxed text-[#94A3B8]">
            
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#E2E8F0] font-heading border-b border-[#2A2A3A] pb-2 mt-8 mb-4">1. Opis i Charakterystyka Usługi</h2>
              <p>
                PromptPolish jest oprogramowaniem typu SaaS (Software-as-a-Service) służącym do audytowania, oceniania, punktowania i optymalizacji instrukcji tekstowych (&quot;promptów&quot;) kierowanych do wielkich modeli językowych (LLM). Narzędzie analizuje strukturę instrukcji, wskazuje ich luki oraz sugeruje ulepszone wersje wejściowych promptów.
              </p>
              <p>
                Usługa jest udostępniana w formule <strong className="text-[#E2E8F0]">Anonymous-first MVP</strong> (podstawowa bezpłatna analiza do określonego limitu bez rejestracji) oraz w formule rejestrowanej (z dostępem do historii analiz, ulubionych raportów oraz planów premium po zalogowaniu).
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#E2E8F0] font-heading border-b border-[#2A2A3A] pb-2 mt-8 mb-4">2. Dostęp Anonimowy i Pliki Cookie</h2>
              <p>
                Użytkownicy mogą korzystać z podstawowych funkcji audytu bez zakładania konta. W tym scenariuszu, powiązanie przeglądarki z wygenerowanymi raportami w formacie <code className="text-[#A78BFA] bg-[#1C1C27] px-1.5 py-0.5 rounded font-mono text-xs">/result/[id]</code> opiera się wyłącznie na niezbędnym pliku cookie o nazwie <code className="text-[#A78BFA] bg-[#1C1C27] px-1.5 py-0.5 rounded font-mono text-xs">owner_anonymous_id</code> (atrybuty HttpOnly, Secure, SameSite=Strict).
              </p>
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-[#F87171] font-semibold">
                <p className="text-xs uppercase font-bold text-[#F87171] mb-1">⚠️ Ważne ostrzeżenie:</p>
                <p className="text-xs leading-relaxed text-[#F87171]/90">
                  Wyczyszczenie plików cookie, pamięci podręcznej przeglądarki lub zmiana urządzenia spowoduje bezpowrotną utratę dostępu do Twoich prywatnych stron wyników. Serwis nie posiada możliwości odzyskania lub przywrócenia dostępu do danych powiązanych z sesją anonimową po usunięciu ciasteczka identyfikacyjnego.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#E2E8F0] font-heading border-b border-[#2A2A3A] pb-2 mt-8 mb-4">3. Konta Użytkowników i Rejestracja</h2>
              <p>
                Dostęp do dodatkowych funkcji (takich jak przechowywanie i filtrowanie historii analiz, ulubione raporty czy eksporty wyników) wymaga rejestracji konta przy użyciu dostarczonego systemu uwierzytelniania.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-[#94A3B8]">
                <li>Użytkownik rejestrujący konto zobowiązuje się do zachowania poufności swoich danych uwierzytelniających oraz odpowiada za wszystkie operacje wykonane w ramach swojego profilu.</li>
                <li>Z usługi mogą korzystać wyłącznie osoby, które ukończyły osiemnaście (18) lat lub osiągnęły pełnoletność w swojej jurysdykcji.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#E2E8F0] font-heading border-b border-[#2A2A3A] pb-2 mt-8 mb-4">4. Subskrypcja Pro Plan i Płatności Stripe</h2>
              <p>
                Platforma przewiduje płatny plan premium (&quot;Pro Plan&quot;), oferujący wyższe limity zapytań, rozszerzoną długość promptów oraz zaawansowane eksporty raportów.
              </p>
              <div className="rounded-xl border border-[#A78BFA]/20 bg-[#A78BFA]/5 p-4 text-xs space-y-2 font-semibold text-[#94A3B8]">
                <p>
                  <strong className="text-[#E2E8F0]">Cennik i waluta:</strong> Opłaty za usługi świadczone w ramach planów płatnych są naliczane zgodnie z aktualnym cennikiem dostępnym na stronie usługi w kwocie <code className="text-[#E2E8F0] bg-[#1C1C27] px-1.5 py-0.5 rounded font-mono text-xs">19 PLN / miesiąc</code>.
                </p>
                <p>
                  <strong className="text-[#E2E8F0]">Obsługa płatności:</strong> Wszystkie płatności, faktury i transakcje są obsługiwane za pośrednictwem certyfikowanego procesora <strong className="text-[#E2E8F0]">Stripe, Inc.</strong> z wykorzystaniem Stripe Checkout. Serwis nie przechowuje ani nie przetwarza danych kart płatniczych użytkowników.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#E2E8F0] font-heading border-b border-[#2A2A3A] pb-2 mt-8 mb-4">5. Anulowanie Subskrypcji</h2>
              <p>
                Użytkownicy mogą anulować odnawianie planu płatnego w dowolnym momencie w trybie samoobsługowym poprzez portal rozliczeniowy Stripe dostępny w ustawieniach konta.
              </p>
              <p>
                Po anulowaniu subskrypcja zachowa status aktywny do końca opłaconego okresu rozliczeniowego, po czym konto zostanie automatycznie zdegradowane do planu bezpłatnego.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#E2E8F0] font-heading border-b border-[#2A2A3A] pb-2 mt-8 mb-4">6. Polityka Zwrotów</h2>
              <p>
                Zasady odstąpienia od umowy oraz zwrotu kosztów subskrypcji regulują poniższe warunki:
              </p>
              <div className="rounded-xl border border-[#A78BFA]/20 bg-[#A78BFA]/5 p-4 text-xs font-semibold text-[#94A3B8] space-y-2">
                <p>
                  <strong className="text-[#E2E8F0]">Warunki zwrotu środków:</strong> <code className="text-[#E2E8F0] bg-[#1C1C27] px-1.5 py-0.5 rounded font-mono text-xs">Zwroty realizowane są do 14 dni od zakupu w przypadku braku wykorzystania limitu analiz w danym okresie rozliczeniowym.</code>
                </p>
                <p>
                  Wszelkie wnioski reklamacyjne oraz zgłoszenia dotyczące zwrotów płatności prosimy kierować na adres e-mail: <a href="mailto:kontakt@promptpolish.pl" className="text-[#A78BFA] hover:text-[#C4B5FD] transition-colors underline">kontakt@promptpolish.pl</a>.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#E2E8F0] font-heading border-b border-[#2A2A3A] pb-2 mt-8 mb-4">7. Dozwolony Użytek (Acceptable Use)</h2>
              <p>
                Użytkownik zobowiązuje się do korzystania z platformy zgodnie z prawem i dobrymi obyczajami. Zabrania się:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-[#94A3B8]">
                <li>Przesyłania do optymalizacji treści bezprawnych, naruszających dobra osobiste, prawa autorskie lub nawołujących do nienawiści.</li>
                <li>Prób automatycznego pobierania danych, omijania limitów zapytań (rate limiting) oraz wykonywania ataków przeciążeniowych.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#E2E8F0] font-heading border-b border-[#2A2A3A] pb-2 mt-8 mb-4">8. Odpowiedzialność za Dane Wrażliwe</h2>
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-[#F87171]">
                <p className="text-xs uppercase font-bold text-[#F87171] mb-1">⚠️ Odpowiedzialność za dane poufne:</p>
                <p className="text-xs leading-relaxed text-[#F87171]/90">
                  Zabrania się wklejania w polach analizy promptów jakichkolwiek haseł, kluczy API, tokenów dostępowych, wrażliwych danych osobowych (PII), danych medycznych, informacji finansowych, bądź poufnych tajemnic handlowych osób trzecich. PromptPolish nie odpowiada za skutki ujawnienia takich danych w zapytaniach. Użytkownik ponosi pełną i wyłączną odpowiedzialność za treść promptów przekazanych do analizy.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#E2E8F0] font-heading border-b border-[#2A2A3A] pb-2 mt-8 mb-4">9. Wyłączenie Odpowiedzialności i Brak Gwarancji AI</h2>
              <p>
                PromptPolish korzysta z zewnętrznych modeli sztucznej inteligencji (Google Gemini API). Użytkownik przyjmuje do wiadomości, że:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-[#94A3B8]">
                <li>Wyniki działania algorytmów AI mogą być niepełne, niedokładne lub zawierać tzw. halucynacje.</li>
                <li>Serwis nie gwarantuje, że ulepszone wersje promptów przyniosą określony rezultat biznesowy, wydajnościowy lub techniczny w docelowych systemach LLM.</li>
                <li>Użytkownik jest zobowiązany do samodzielnego przetestowania i zatwierdzenia zoptymalizowanego promptu we własnym środowisku przed wdrożeniem produkcyjnym. Usługa jest świadczona w stanie &quot;as-is&quot; (w takim stanie, w jakim się znajduje).</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#E2E8F0] font-heading border-b border-[#2A2A3A] pb-2 mt-8 mb-4">10. Prawo Właściwe i Jurysdykcja</h2>
              <p>
                Wszelkie spory wynikające ze świadczenia usług na rzecz użytkowników będą rozstrzygane polubownie, a w przypadku braku porozumienia — przez sąd właściwy dla jurysdykcji:
              </p>
              <p className="font-semibold">
                <code className="text-[#E2E8F0] bg-[#1C1C27] px-1.5 py-0.5 rounded font-mono text-xs">Prawo polskie, a spory rozstrzygane będą przez sąd powszechny właściwy dla siedziby Administratora.</code>
              </p>
            </section>

            <section className="space-y-3 border-t border-[#2A2A3A] pt-6">
              <h2 className="text-lg font-bold text-[#E2E8F0] font-heading mb-3">11. Kontakt i Zgłoszenia</h2>
              <p className="text-sm leading-relaxed text-[#94A3B8]">
                Wszelkie pytania, zgłoszenia błędów oraz wnioski dotyczące warunków świadczenia usług prosimy kierować na poniższe dane kontaktowe:
              </p>
              <ul className="list-none space-y-2 text-sm text-[#94A3B8]">
                <li><strong className="text-[#E2E8F0]">E-mail wsparcia i zapytania prawne:</strong> <a href="mailto:kontakt@promptpolish.pl" className="text-[#A78BFA] hover:text-[#C4B5FD] transition-colors underline">kontakt@promptpolish.pl</a></li>
                <li><strong className="text-[#E2E8F0]">Nazwa podmiotu (Usługodawca):</strong> <code className="text-[#E2E8F0] bg-[#1C1C27] px-1.5 py-0.5 rounded font-mono text-xs">PromptPolish Project</code></li>
                <li><strong className="text-[#E2E8F0]">Adres rejestrowy:</strong> <code className="text-[#E2E8F0] bg-[#1C1C27] px-1.5 py-0.5 rounded font-mono text-xs">Warszawa, Polska (Online Service)</code></li>
                <li><strong className="text-[#E2E8F0]">Dane rejestrowe (NIP/KRS/REGON):</strong> <code className="text-[#E2E8F0] bg-[#1C1C27] px-1.5 py-0.5 rounded font-mono text-xs">Brak (Projekt MVP w fazie testów)</code></li>
              </ul>
            </section>

          </div>
        </article>
      </main>

      <AppFooter />
    </div>
  )
}
