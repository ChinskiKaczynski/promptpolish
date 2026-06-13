import type { Metadata } from 'next'
import { AppHeader } from '@/components/layout/app-header'
import { AppFooter } from '@/components/layout/app-footer'

export const metadata: Metadata = {
  title: 'Regulamin (Draft) — PromptPolish',
  robots: {
    index: false,
    follow: false,
  },
}

export default function TermsPage() {
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
              <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider">Wersja Robocza Regulaminu / Draft Terms</h3>
              <p className="mt-1 text-xs leading-relaxed text-amber-900 font-semibold">
                To jest roboczy draft regulaminu (warunków korzystania) dla platformy <strong>PromptPolish</strong>. Dokument służy celom deweloperskim i testowym, nie stanowi oficjalnej opinii prawnej i musi przejść pełną weryfikację przez certyfikowanego radcę prawnego przed udostępnieniem dla publicznego ruchu lub transakcji płatniczych. Wdrożenie systemu płatności produkcyjnych (Paid Production) pozostaje nieaktywne/zawieszone do czasu ukończenia pełnego audytu podatkowego i konsumenckiego. Zgodność z przepisami RODO (GDPR) nie jest na tym etapie gwarantowana.
              </p>
            </div>
          </div>
        </div>

        {/* Article Container */}
        <article className="prose prose-slate max-w-none">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            Regulamin Korzystania (Draft MVP)
          </h1>
          <p className="mt-2 text-xs text-slate-400">Ostatnia aktualizacja: 4 czerwca 2026 r.</p>
          
          <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-700">
            
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">1. Opis i Charakterystyka Usługi</h2>
              <p>
                PromptPolish jest oprogramowaniem typu SaaS (Software-as-a-Service) służącym do audytowania, oceniania, punktowania i optymalizacji instrukcji tekstowych (&quot;promptów&quot;) kierowanych do wielkich modeli językowych (LLM). Narzędzie analizuje strukturę instrukcji, wskazuje ich luki oraz sugeruje ulepszone wersje wejściowych promptów.
              </p>
              <p>
                Usługa jest udostępniana w formule <strong>Anonymous-first MVP</strong> (podstawowa bezpłatna analiza do określonego limitu bez rejestracji) oraz w formule rejestrowanej (z dostępem do historii analiz, ulubionych raportów oraz potencjalnych planów premium po zalogowaniu).
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">2. Dostęp Anonimowy i Pliki Cookie</h2>
              <p>
                Użytkownicy mogą korzystać z podstawowych funkcji audytu bez zakładania konta. W tym scenariuszu, powiązanie przeglądarki z wygenerowanymi raportami w formacie <code>/result/[id]</code> opiera się wyłącznie na niezbędnym pliku cookie o nazwie <code>owner_anonymous_id</code> (atrybuty HttpOnly, Secure, SameSite=Strict).
              </p>
              <p className="font-semibold text-slate-900">
                ⚠️ WAŻNE OSTRZEŻENIE: Wyczyszczenie plików cookie, pamięci podręcznej przeglądarki lub zmiana urządzenia spowoduje bezpowrotną utratę dostępu do Twoich prywatnych stron wyników. Nasz zespół techniczny nie posiada możliwości odzyskania lub przywrócenia dostępu do danych powiązanych z sesją anonimową po usunięciu ciasteczka identyfikacyjnego.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">3. Konta Użytkowników i Rejestracja</h2>
              <p>
                Dostęp do dodatkowych funkcji (takich jak przechowywanie i filtrowanie historii analiz, favorites, czy eksporty raportów) wymaga rejestracji konta przy użyciu dostawcy uwierzytelniania (Supabase Auth).
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 font-semibold">
                <li>Użytkownik rejestrujący konto zobowiązuje się do zachowania poufności swoich danych uwierzytelniających oraz odpowiada za wszystkie operacje wykonane w ramach swojego profilu.</li>
                <li>Z usługi mogą korzystać wyłącznie osoby, które ukończyły osiemnaście (18) lat lub osiągnęły pełnoletność w swojej jurysdykcji.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">4. Subskrypcja Pro Plan i Płatności Stripe</h2>
              <p>
                Platforma przewiduje płatny plan premium (&quot;Pro Plan&quot;), oferujący wyższe limity (np. do 500 analiz miesięcznie), rozszerzoną długość znaków (do 24 000), eksporty PDF/Markdown oraz zbiorcze audyty (Batch Audit).
              </p>
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/20 p-4 text-xs space-y-2 font-semibold">
                <p>
                  <strong>Stan wdrożenia:</strong> Subskrypcje płatne Pro Plan <strong>nie zostały jeszcze uruchomione produkcyjnie</strong>. Bramka płatności jest wyłączona dla transakcji komercyjnych.
                </p>
                <p>
                  <strong>Cennik i Waluta:</strong> <code>[PRIMARY CURRENCY AND PRICE TBD — requires pricing/tax decision]</code>.
                </p>
                <p>
                  <strong>Obsługa płatności:</strong> Kiedy subskrypcje zostaną wdrożone produkcyjnie, wszystkie płatności, faktury i transakcje będą obsługiwane wyłącznie za pośrednictwem certyfikowanego procesora <strong>Stripe, Inc.</strong> z wykorzystaniem Stripe Checkout. Nasz serwis nie przechowuje ani nie przetwarza danych kart płatniczych (PCI-DSS compliant).
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">5. Anulowanie Subskrypcji</h2>
              <p>
                Po pełnym uruchomieniu subskrypcji Pro, użytkownicy będą mogli anulować odnawianie planu w dowolnym momencie w trybie samoobsługowym poprzez przekierowanie do portalu <strong>Stripe Customer Portal</strong> w zakładce ustawień konta.
              </p>
              <p>
                Po anulowaniu, subskrypcja zachowa status aktywny do końca opłaconego okresu rozliczeniowego (<code>cancel_at_period_end = true</code>), po czym konto zostanie automatycznie zdegradowane do planu bezpłatnego.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">6. Polityka Zwrotów (Refund Policy)</h2>
              <p>
                Warunki zwrotu środków oraz odstąpienia od umowy w ramach płatnych subskrypcji są obecnie w trakcie ewaluacji prawnej:
              </p>
              <p className="font-semibold text-slate-900">
                <code>[REFUND POLICY TBD — legal review required]</code>
              </p>
              <p className="text-xs text-slate-500 font-semibold">
                Rozważana polityka zakłada 14-dniowe okno na zgłoszenie zwrotu, pod warunkiem zużycia poniżej 10 analiz promptów w danym okresie rozliczeniowym (w celu pokrycia bezpośrednich kosztów API). Wszelkie zgłoszenia po uruchomieniu płatności będą musiały być kierowane na adres: <code>[SUPPORT EMAIL TBD]</code>.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">7. Dozwolony Użytek (Acceptable Use)</h2>
              <p>
                Użytkownik zobowiązuje się do korzystania z platformy zgodnie z prawem i dobrymi obyczajami. Zabrania się:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 font-semibold">
                <li>Przesyłania do optymalizacji treści bezprawnych, naruszających dobra osobiste, prawa autorskie lub nawołujących do nienawiści.</li>
                <li>Prób automatycznego scrapowania danych, omijania limitów zapytań (rate limiting), tudzież wykonywania ataków typu DoS/DDoS.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">8. Odpowiedzialność Użytkownika za Dane Wrażliwe</h2>
              <div className="rounded-2xl border border-rose-100 bg-rose-50/20 p-4 text-rose-950 font-semibold">
                <p className="text-xs uppercase font-bold text-rose-800 mb-1">⚠️ Czego kategorycznie nie wolno wklejać:</p>
                <p className="text-xs leading-relaxed">
                  Zabrania się wklejania w polach analizy promptów jakichkolwiek haseł, kluczy API, tokenów dostępowych, wrażliwych danych osobowych (PII), danych medycznych, informacji finansowych, bądź poufnych tajemnic handlowych osób trzecich. PromptPolish nie odpowiada za skutki ujawnienia takich danych w zapytaniach. Użytkownik ponosi pełną i wyłączną odpowiedzialność za treść promptów przekazanych do analizy.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">9. Wyłączenie Odpowiedzialności i Brak Gwarancji AI</h2>
              <p>
                PromptPolish korzysta z zewnętrznych interfejsów programistycznych sztucznej inteligencji (takich jak OpenRouter / skonfigurowany dostawca modelu AI). Użytkownik przyjmuje do wiadomości, że:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 font-semibold">
                <li>Wyniki działania sztucznej inteligencji mogą być niepełne, niedokładne lub zawierać tzw. halucynacje.</li>
                <li>Serwis nie gwarantuje, że ulepszone wersje promptów przyniosą określony rezultat biznesowy, wydajnościowy lub techniczny w docelowych systemach LLM.</li>
                <li>Użytkownik jest zobowiązany do samodzielnego przetestowania i zatwierdzenia zoptymalizowanego promptu we własnym środowisku przed wdrożeniem produkcyjnym. Usługa jest świadczona w stanie &quot;as-is&quot; (w takim stanie, w jakim się znajduje).</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">10. Prawo Właściwe</h2>
              <p>
                Niniejszy regulamin oraz wszelkie spory z nim związane podlegają prawu: <code>[GOVERNING LAW JURISDICTION TBD — requires legal decision]</code>.
              </p>
            </section>

            <section className="space-y-3 border-t border-slate-200 pt-6">
              <h2 className="text-base font-bold text-slate-900">11. Kontakt i Zgłoszenia</h2>
              <p className="text-xs">
                Wszelkie pytania, zgłoszenia błędów oraz wnioski dotyczące warunków świadczenia usług prosimy kierować na poniższe dane kontaktowe:
              </p>
              <ul className="list-none space-y-1 text-xs text-slate-600 font-semibold">
                <li><strong>E-mail wsparcia:</strong> <code>[SUPPORT EMAIL TBD]</code></li>
                <li><strong>Zapytania prawne:</strong> <code>[SUPPORT EMAIL TBD]</code></li>
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
