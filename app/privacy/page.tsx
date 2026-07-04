import type { Metadata } from 'next'
import { AppHeader } from '@/components/layout/app-header'
import { AppFooter } from '@/components/layout/app-footer'

export const metadata: Metadata = {
  title: 'Polityka Prywatności — PromptPolish',
  robots: {
    index: false,
    follow: true,
  },
}

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0C0C10] text-[#E2E8F0] selection:bg-[#A78BFA]/20 antialiased font-sans">
      <AppHeader />

      {/* Main Content Area */}
      <main className="flex-grow mx-auto max-w-3xl w-full px-6 py-12 sm:py-16">
        
        {/* Article Container */}
        <article className="max-w-none">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#E2E8F0] sm:text-4xl font-heading">
            Polityka Prywatności
          </h1>
          <p className="mt-2 text-xs text-[#8290A2]">Ostatnia aktualizacja: 4 czerwca 2026 r.</p>
          
          <div className="mt-8 space-y-8 text-sm leading-relaxed text-[#94A3B8]">
            
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#E2E8F0] font-heading border-b border-[#2A2A3A] pb-2 mt-8 mb-4">1. Ochrona Danych i Bezpieczeństwo Promptów</h2>
              <p>
                PromptPolish stawia bezpieczeństwo Twoich danych na pierwszym miejscu, działając w oparciu o model <strong className="text-[#E2E8F0]">anonymous-first</strong>. W przypadku wersji bezpłatnej nie wymagamy rejestracji, zakładania kont, ani podawania adresów e-mail do przeprowadzenia analizy. W przypadku wyboru płatnego abonamentu (Pro Plan) dane konta i powiązane dane transakcyjne będą przetwarzane wyłącznie w celach realizacji subskrypcji.
              </p>
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-[#F87171]">
                <p className="text-xs uppercase font-bold text-[#F87171] mb-1">⚠️ Bezwzględny zakaz wklejania danych wrażliwych:</p>
                <p className="text-xs leading-relaxed text-[#F87171]/90">
                  Pod żadnym pozorem nie wklejaj w polu analizy promptów haseł, kluczy API (np. tokenów dostępowych, kluczy OpenAI/Google), poufnych danych finansowych, danych osobowych swoich klientów ani tajemnic przedsiębiorstwa. Narzędzie uruchamia automatyczne lokalne filtry bezpieczeństwa (preflight), ale nie zastępują one zdrowego rozsądku i ostrożności użytkownika.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#E2E8F0] font-heading border-b border-[#2A2A3A] pb-2 mt-8 mb-4">2. Sesja Anonimowa i Pliki Cookie</h2>
              <p>
                W celach autoryzacyjnych i w celu zachowania własności nad audytami bez logowania, system generuje identyfikator sesji zapisywany w pliku cookie o nazwie <code className="text-[#A78BFA] bg-[#1C1C27] px-1.5 py-0.5 rounded font-mono text-xs">owner_anonymous_id</code> (atrybuty HttpOnly, Secure, SameSite=Strict).
              </p>
              <p>
                Identyfikator ten jest powiązany z wygenerowanymi przez Ciebie raportami przez okres <strong className="text-[#E2E8F0]">30 dni</strong>.
              </p>
              <p className="font-semibold text-[#E2E8F0]">
                Ważne: Wyszyszczenie plików cookie lub pamięci podręcznej w przeglądarce spowoduje bezpowrotną utratę dostępu do wygenerowanych wcześniej prywatnych linków typu <code className="text-[#A78BFA] bg-[#1C1C27] px-1.5 py-0.5 rounded font-mono text-xs">/result/[id]</code>. Serwer nie będzie w stanie zweryfikować Twoich uprawnień do odczytu lub edycji tych raportów.
              </p>
              <div className="rounded-xl border border-[#A78BFA]/20 bg-[#A78BFA]/5 p-4 text-xs font-semibold text-[#94A3B8]">
                <p className="font-bold text-[#E2E8F0] uppercase mb-1">Informacja dotycząca plików cookie:</p>
                <p className="leading-relaxed">
                  Serwis wykorzystuje pliki cookie wyłącznie w celu zapewnienia prawidłowego działania funkcji technicznych (pliki niezbędne). Nie stosujemy plików cookie do śledzenia użytkowników ani w celach marketingowych.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#E2E8F0] font-heading border-b border-[#2A2A3A] pb-2 mt-8 mb-4">3. Konta Użytkowników i Zbierane Dane</h2>
              <p>
                Po zalogowaniu się do serwisu (opcjonalna rejestracja), zbieramy i przetwarzamy następujące dane:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-[#94A3B8]">
                <li><strong className="text-[#E2E8F0]">Dane konta:</strong> Adres e-mail, identyfikator użytkownika oraz nazwa wyświetlana.</li>
                <li><strong className="text-[#E2E8F0]">Historia promptów:</strong> Treści przesyłanych zapytań tekstowych oraz wygenerowane ulepszenia (optymalizacje), oceny i diagnozy, aby umożliwić synchronizację i ponowny dostęp do zapytań na różnych urządzeniach.</li>
                <li><strong className="text-[#E2E8F0]">Metadane płatności Stripe:</strong> W przypadku korzystania z planów płatnych przetwarzane są podstawowe metadane płatnicze (np. status subskrypcji, identyfikator klienta Stripe) służące do zarządzania statusem konta.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#E2E8F0] font-heading border-b border-[#2A2A3A] pb-2 mt-8 mb-4">4. Zewnętrzni Dostawcy i Podmioty Przetwarzające</h2>
              <p>
                W celu prawidłowego świadczenia usług, PromptPolish współpracuje z zaufanymi dostawcami zewnętrznymi. Przekazywanie danych odbywa się na podstawie umów powierzenia przetwarzania danych osobowych (DPA) lub innych standardowych klauzul umownych zgodnych z RODO:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-[#94A3B8]">
                <li>
                  <strong className="text-[#E2E8F0]">Supabase, Inc. (Baza danych)</strong>: Odpowiada za bezpieczne przechowywanie danych sesji, historii analiz oraz danych kont użytkowników.
                </li>
                <li>
                  <strong className="text-[#E2E8F0]">Vercel Inc. (Hosting i infrastruktura sieciowa)</strong>: Odpowiada za hosting aplikacji, routing oraz funkcje bezserwerowe API.
                </li>
                <li>
                  <strong className="text-[#E2E8F0]">Stripe, Inc. (Obsługa płatności)</strong>: Odpowiada za bezpieczne procesowanie transakcji płatniczych oraz obsługę subskrypcji. Serwis nie przechowuje ani nie ma wglądu w dane kart płatniczych użytkowników.
                </li>
                <li>
                  <strong className="text-[#E2E8F0]">Google Gemini API (Silnik AI / Analiza promptów)</strong>: Przetwarza treści promptów za pomocą modelu Gemini 2.5 Flash w celu przeprowadzenia audytu i optymalizacji. Zapytania są przetwarzane zgodnie z polityką prywatności Google i nie są wykorzystywane do trenowania modeli bez zgody.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#E2E8F0] font-heading border-b border-[#2A2A3A] pb-2 mt-8 mb-4">5. Retencja Danych (Okres Przechowywania)</h2>
              <p>
                Dbamy o zasadę minimalizacji danych. Poszczególne kategorie danych są przechowywane wyłącznie przez czas niezbędny do realizacji celów świadczenia usługi:
              </p>
              
              <div className="overflow-x-auto my-4 rounded-xl border border-[#2A2A3A] bg-[#13131A] shadow-lg">
                <table className="min-w-full divide-y divide-[#2A2A3A] text-xs">
                  <thead>
                    <tr className="bg-[#1C1C27] text-left font-bold text-[#E2E8F0]">
                      <th className="px-4 py-3">Typ Danych</th>
                      <th className="px-4 py-3">Okres Przechowywania</th>
                      <th className="px-4 py-3">Cel i opis techniczny</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A2A3A] text-[#94A3B8]">
                    <tr className="hover:bg-[#1C1C27]/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-[#E2E8F0]">Anonimowe analizy promptów</td>
                      <td className="px-4 py-3 text-[#A78BFA] font-bold">30 Dni</td>
                      <td className="px-4 py-3">Automatycznie i trwale usuwane z bazy danych po upływie 30 dni od ich utworzenia.</td>
                    </tr>
                    <tr className="hover:bg-[#1C1C27]/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-[#E2E8F0]">Logi serwerowe i telemetria</td>
                      <td className="px-4 py-3 text-[#A78BFA] font-bold">90 Dni</td>
                      <td className="px-4 py-3">Używane do diagnozowania błędów systemowych oraz ochrony przed nadużyciami.</td>
                    </tr>
                    <tr className="hover:bg-[#1C1C27]/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-[#E2E8F0]">Oceny i opinie (Upvote/Downvote)</td>
                      <td className="px-4 py-3 text-[#A78BFA] font-bold">180 Dni</td>
                      <td className="px-4 py-3">Przechowywane w celu poprawy algorytmu ulepszania promptów.</td>
                    </tr>
                    <tr className="hover:bg-[#1C1C27]/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-[#E2E8F0]">Dane subskrypcyjne Stripe</td>
                      <td className="px-4 py-3 text-[#6EE7B7] font-bold">Zgodnie z przepisami</td>
                      <td className="px-4 py-3">Dane transakcyjne i faktury są przechowywane przez 5-7 lat zgodnie z wymogami przepisów podatkowo-rachunkowych.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#E2E8F0] font-heading border-b border-[#2A2A3A] pb-2 mt-8 mb-4">6. Udostępnianie Wyników i Generowane Pliki</h2>
              <p>
                Wszystkie analizy są domyślnie prywatne. Funkcje udostępniania i eksportu podlegają następującym zasadom:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-[#94A3B8]">
                <li><strong className="text-[#E2E8F0]">Publiczne linki (Share Links):</strong> Użytkownik może dobrowolnie wygenerować publiczny link w formacie <code className="text-[#A78BFA] bg-[#1C1C27] px-1.5 py-0.5 rounded font-mono text-xs">/share/[token]</code>. Wygenerowane w ten sposób publiczne analizy są wyłączone z automatycznej 30-dniowej procedury usuwania w celu zapobiegania uszkodzonym odnośnikom. Pozostają one aktywne do momentu wyłączenia udostępniania lub usunięcia analizy przez jej twórcę.</li>
                <li><strong className="text-[#E2E8F0]">Eksport plików (PDF/Markdown):</strong> Generowane pliki eksportu (PDF oraz Markdown) są tworzone w pamięci urządzenia użytkownika i nie są trwale przechowywane w systemowych magazynach plików.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#E2E8F0] font-heading border-b border-[#2A2A3A] pb-2 mt-8 mb-4">7. Prawa Użytkownika i Procedura Usuwania (RODO/GDPR Art. 17)</h2>
              <p>
                Każdemu użytkownikowi przysługuje prawo do dostępu do swoich danych, ich sprostowania, przenoszenia, ograniczenia przetwarzania oraz żądania ich trwałego usunięcia:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-[#94A3B8]">
                <li>
                  <strong className="text-[#E2E8F0]">Dla użytkowników anonimowych:</strong> Możesz usunąć pliki cookie w przeglądarce, co natychmiastowo zerwie powiązanie z Twoją sesją. Dane przypisane do identyfikatora sesji zostaną usunięte zgodnie z cyklem retencji.
                </li>
                <li>
                  <strong className="text-[#E2E8F0]">Dla użytkowników zalogowanych:</strong> Usunięcie konta w panelu ustawień aplikacji skutkuje natychmiastowym anulowaniem aktywnej subskrypcji w Stripe oraz całkowitym usunięciem profilu i powiązanej z nim historii z bazy danych.
                </li>
                <li>
                  <strong className="text-[#E2E8F0]">Wnioski e-mail:</strong> Pytania dotyczące przetwarzania danych oraz wnioski o ich ręczne usunięcie można kierować na adres: <a href="mailto:kontakt@promptpolish.pl" className="text-[#A78BFA] hover:text-[#C4B5FD] transition-colors underline">kontakt@promptpolish.pl</a>.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#E2E8F0] font-heading border-b border-[#2A2A3A] pb-2 mt-8 mb-4">8. Bezpieczeństwo i Ochrona Adresów IP</h2>
              <p>
                Adresy IP użytkowników są wykorzystywane wyłącznie w celach bezpieczeństwa (np. zapobieganie nadużyciom, ataki DDoS, rate limiting). Zgodnie z zasadą prywatności, adresy IP są natychmiast hashowane w pamięci operacyjnej z użyciem kryptograficznej soli przed zapisaniem do bazy danych. Sól ulega automatycznej rotacji co <strong className="text-[#E2E8F0]">24 godziny</strong>, co uniemożliwia trwałe śledzenie lub rekonstrukcję adresu IP.
              </p>
            </section>

            <section className="space-y-3 border-t border-[#2A2A3A] pt-6">
              <h2 className="text-lg font-bold text-[#E2E8F0] font-heading mb-3">9. Kontakt w Sprawach Prywatności</h2>
              <p className="text-sm leading-relaxed text-[#94A3B8]">
                Wszelkie pytania i wnioski dotyczące przetwarzania danych osobowych oraz realizacji przysługujących praw prosimy kierować na poniższe adresy:
              </p>
              <ul className="list-none space-y-2 text-sm text-[#94A3B8]">
                <li><strong className="text-[#E2E8F0]">E-mail wsparcia i prywatności:</strong> <a href="mailto:kontakt@promptpolish.pl" className="text-[#A78BFA] hover:text-[#C4B5FD] transition-colors underline">kontakt@promptpolish.pl</a></li>
                <li><strong className="text-[#E2E8F0]">Nazwa podmiotu (Administrator):</strong> <code className="text-[#E2E8F0] bg-[#1C1C27] px-1.5 py-0.5 rounded font-mono text-xs">[Nazwa firmy do uzupełnienia]</code></li>
                <li><strong className="text-[#E2E8F0]">Adres rejestrowy:</strong> <code className="text-[#E2E8F0] bg-[#1C1C27] px-1.5 py-0.5 rounded font-mono text-xs">[Adres rejestrowy do uzupełnienia]</code></li>
                <li><strong className="text-[#E2E8F0]">Dane rejestrowe (NIP/KRS/REGON):</strong> <code className="text-[#E2E8F0] bg-[#1C1C27] px-1.5 py-0.5 rounded font-mono text-xs">[NIP/KRS/REGON do uzupełnienia]</code></li>
              </ul>
            </section>

          </div>
        </article>
      </main>

      <AppFooter />
    </div>
  )
}
