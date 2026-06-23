/* eslint-disable prefer-rest-params, @typescript-eslint/no-explicit-any */
// Mock 'server-only' in Node's module resolution before loading any dependencies
import Module from 'module'
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id: string) {
  if (id === 'server-only') {
    return {};
  }
  return originalRequire.apply(this, arguments as any);
};

import { analyzePrompt } from '../../lib/ai/analyze-prompt'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local')
const content = fs.readFileSync(envPath, 'utf8')
const lines = content.split(/\r?\n/)
for (const line of lines) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const firstEquals = trimmed.indexOf('=')
  if (firstEquals !== -1) {
    const key = trimmed.slice(0, firstEquals).trim()
    let val = trimmed.slice(firstEquals + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    process.env[key] = val
  }
}

// Build the long prompt
let longPrompt = `Stwórz kompleksowy brief marketingowy i pakiet tekstów sprzedażowych dla nowej platformy SaaS w języku polskim. 
Nazwa platformy to: "TaskFlow". Jest to system do zarządzania zadaniami dla mikro i małych przedsiębiorstw.
Oto szczegółowy opis założeń, funkcji, person, tonu głosu, konkurencji oraz celów, które musisz uwzględnić w analizie i wygenerowanych materiałach.

--- CZĘŚĆ 1: OPIS PRODUKTU I KORZYŚCI ---
TaskFlow to narzędzie, które pozwala zespołom od 3 do 15 osób na organizację pracy, śledzenie czasu oraz automatyzację powtarzalnych procesów bez konieczności przechodzenia skomplikowanych szkoleń.
Główne funkcje:
1. Kanban z automatycznymi powiadomieniami dla klientów o statusie prac.
2. Wbudowany moduł Time Tracking połączony z prostym generatorem raportów rentowności.
3. Integracja z polskimi systemami do fakturowania (Fakturownia, iFirma) za pomocą jednego kliknięcia.
4. Moduł „Szybki kontakt” umożliwiający wysyłanie SMS-ów i e-maili do podwykonawców bezpośrednio z poziomu karty zadania.

Unikalna Propozycja Wartości (USP):
„Zarządzaj projektami i fakturowaniem w jednym miejscu. Koniec z przepisywaniem danych z Trello do Excela i systemów księgowych. Stworzone specjalnie dla polskich agencji i firm usługowych.”

--- CZĘŚĆ 2: PERSONY ZAKUPOWE ---
Persona A: Tomasz, 34 lata, właściciel małej agencji interaktywnej zatrudniającej 8 osób.
Tomasz ma dość korzystania z 5 różnych narzędzi: Slacka do komunikacji, Asany do zadań, Toggl do mierzenia czasu, Fakturowni do faktur oraz Excela do wyliczania marży. Tomasz szuka jednego, zintegrowanego systemu, który nie będzie kosztował fortuny i będzie prosty w obsłudze dla jego zespołu. Jego główna obawa to opór pracowników przed wdrażaniem nowego oprogramowania.
Persona B: Karolina, 42 lata, dyrektor operacyjna w firmie szkoleniowej (12 osób).
Karolina spędza 4 dni w miesiącu na ręcznym zbieraniu raportów od trenerów, sprawdzaniu ile godzin przepracowali i wystawianiu na tej podstawie rozliczeń. Chce zautomatyzować ten proces, aby móc skupić się na rozwoju oferty szkoleniowej. Ceni sobie bezpieczeństwo danych (RODO) i stabilność działania systemu.

--- CZĘŚĆ 3: WYTYCZNE DOTYCZĄCE TONU GŁOSU (TONE OF VOICE) ---
Ton komunikacji powinien być:
- Profesjonalny, ale przystępny (unikamy sztywnego korporacyjnego żargonu).
- Skoncentrowany na konkretnych korzyściach i oszczędności czasu (zamiast pisać „innowacyjny algorytm”, piszemy „zaoszczędzisz 4 godziny w tygodniu”).
- Partnerski i pomocny (budujemy zaufanie jako doradca w biznesie).
- Nowoczesny i dynamiczny.

--- CZĘŚĆ 4: STRUKTURA WYMAGANYCH MATERIAŁÓW (OUTPUT FORMAT) ---
Chcę, abyś stworzył:
1. Landing Page Copy: Nagłówek H1 z USP, podnagłówek rozwijający korzyść, sekcja opisująca 3 główne bolączki (problem-solution), opis 4 najważniejszych funkcji produktu z call-to-action (CTA).
2. Serię 3 wiadomości e-mail w ramach sekwencji onboardingowej dla nowych użytkowników rejestrujących się na darmowy okres próbny (14 dni). E-mail 1: Powitanie i pierwsza konfiguracja. E-mail 2: Jak zmierzyć czas i połączyć z fakturowaniem. E-mail 3: Ostatnie 3 dni testów – zachęta do zakupu subskrypcji.
3. Reklamę na Facebooka (Ad Copy): 3 warianty tekstów reklamowych – jeden oparty na korzyściach, drugi na problemie Tomasza, trzeci krótki i dynamiczny ze zniżką 10% przy płatności rocznej.

--- CZĘŚĆ 5: PRZYKŁADY I INSPIRACJE ---
Dobry przykład nagłówka LP: "Przestań tracić czas na przepisywanie raportów. Zarządzaj projektami i rozliczeniami w jednej aplikacji."
Zły przykład: "Najlepsze w Polsce zintegrowane oprogramowanie klasy cloud-SaaS do optymalizacji efektywności operacyjnej przedsiębiorstw."

--- CZĘŚĆ 6: DODATKOWE KONTENST I OGRANICZENIA ---
- Pamiętaj o przestrzeganiu polskich norm językowych (zwracanie się per „Ty” lub „Państwo” w zależności od kontekstu – w LP lepiej bezpośrednio, w e-mailach partnersko).
- Wszystkie teksty muszą zawierać jasne, wyróżniające się wezwania do działania (CTA) w nawiasach kwadratowych, np. [Rozpocznij darmowy okres próbny].
- Nie używaj żadnych zmyślonych danych finansowych dotyczących konkurencji. Skup się wyłącznie na walorach TaskFlow.
`
const baseLen = longPrompt.length
const neededChars = 8200 - baseLen

let filler = '\n\n--- SUPELEMENTARY SPECIFICATIONS AND DETAILS FOR THE SYSTEM ---\n'
let counter = 0
while (filler.length < neededChars) {
  filler += `Specyfikacja techniczna i szczegółowe wytyczne dla modułu ${counter++}: Każdy element interfejsu musi być w pełni responsywny i dostępny zgodnie z WCAG 2.1 na poziomie AA. System musi wspierać tryb ciemny (dark mode) oraz dynamiczne skalowanie czcionek. Integracja z systemami płatności (Stripe, PayU, Przelewy24) musi zapewniać pełne bezpieczeństwo transakcji oraz zgodność ze standardami PCI-DSS. Wszystkie dane klientów muszą być przechowywane w chmurze na terenie Unii Europejskiej z codziennym backupem. Czas odpowiedzi serwera (latency) nie powinien przekraczać 200ms pod pełnym obciążeniem. \n`
}
longPrompt += filler

async function runDebug() {
  console.log('Starting local debugging of long prompt audit...')
  try {
    const result = await analyzePrompt({
      inputPrompt: longPrompt,
      workingLanguage: 'pl',
      selectedProfileSlug: 'general-llm'
    }, {
      timeoutMs: 90000
    })
    console.log('Success! Result:')
    console.log(JSON.stringify(result, null, 2))
  } catch (err) {
    const error = err as Error & { errors?: unknown }
    console.error('Failed with error:')
    console.error(error)
    if (error.errors) {
      console.error('Validation errors detail:')
      console.error(JSON.stringify(error.errors, null, 2))
    }
  }
}

runDebug().catch(console.error)
