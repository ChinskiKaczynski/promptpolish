import fs from 'fs'
import path from 'path'

const TARGET_URL = 'http://localhost:3000'

const normalPrompts = [
  {
    name: 'Normal Polish LinkedIn',
    input_prompt: 'napisz mi posta na LinkedIna o tym że moja firma robi strony internetowe i że warto mieć dobrą stronę',
    working_language: 'pl'
  },
  {
    name: 'Normal Polish Soy Candle',
    input_prompt: 'stwórz opis produktu dla świecy sojowej lawendowej, ma być ładny i sprzedażowy',
    working_language: 'pl'
  },
  {
    name: 'Normal English Email',
    input_prompt: 'write a polite reminder email to a client for an overdue payment, firm but friendly',
    working_language: 'en'
  }
]

// Construct the long prompt
let longPromptBase = `Stwórz kompleksowy brief marketingowy i pakiet tekstów sprzedażowych dla nowej platformy SaaS w języku polskim. 
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
Tomasz ma dość korzystania z 5 różnych narzędzi: Slacka do komunikacji, Asany do zadań, Toggl do mierzenia czasu, Fakturowni do faktur oraz Excela do wyliczania marży. Tomasz szuka jednego, zintegrowwego systemu, który nie będzie kosztował fortuny i będzie prosty w obsłudze dla jego zespołu. Jego główna obawa to opór pracowników przed wdrażaniem nowego oprogramowania.
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
let filler = '\n\n--- SUPELEMENTARY SPECIFICATIONS AND DETAILS FOR THE SYSTEM ---\n'
let counter = 0
while (longPromptBase.length + filler.length < 8000) {
  filler += `Specyfikacja techniczna dla modułu ${counter++}: Każdy element interfejsu musi być responsywny i zgodny z WCAG 2.1. Integracja płatności PCI-DSS. Dane na terenie UE. \n`
}
const longPrompt = longPromptBase + filler

async function runLiveCheck() {
  console.log('=== STARTING LOCAL LIVE CHECK ===')
  
  // Reset daily limit temporarily to bypass local rate limits if needed
  // Note: we forced it to 3 in tests, but locally the dev server reads from .env.local (which has 9999)
  
  const results = []

  // Run normal prompts
  for (const p of normalPrompts) {
    console.log(`\n[Normal Prompt] Sending: "${p.name}" (len: ${p.input_prompt.length})`)
    const start = Date.now()
    try {
      const res = await fetch(`${TARGET_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input_prompt: p.input_prompt,
          working_language: p.working_language,
          selected_profile_slug: 'openrouter-deepseek-v4-flash',
          audit_mode: 'universal'
        })
      })
      
      const duration = (Date.now() - start) / 1000
      const status = res.status
      const data = await res.json().catch(() => ({}))
      
      console.log(`[Response] Status: ${status}, Duration: ${duration.toFixed(1)}s`)
      results.push({
        name: p.name,
        type: 'normal',
        status,
        duration: `${duration.toFixed(1)}s`,
        success: status === 200,
        error: status !== 200 ? (data.message || data.error) : null
      })
    } catch (e: any) {
      console.error('Request failed:', e)
      results.push({
        name: p.name,
        type: 'normal',
        status: -1,
        duration: 'N/A',
        success: false,
        error: e.message
      })
    }
  }

  // Run long prompt
  console.log(`\n[Long Prompt] Sending long prompt (len: ${longPrompt.length})`)
  const startLong = Date.now()
  try {
    const res = await fetch(`${TARGET_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input_prompt: longPrompt,
        working_language: 'pl',
        selected_profile_slug: 'openrouter-deepseek-v4-flash',
        audit_mode: 'universal'
      })
    })

    const duration = (Date.now() - startLong) / 1000
    const status = res.status
    const data = await res.json().catch(() => ({}))

    console.log(`[Response Long] Status: ${status}, Duration: ${duration.toFixed(1)}s`)
    results.push({
      name: 'Long Prompt Audit',
      type: 'long',
      status,
      duration: `${duration.toFixed(1)}s`,
      success: status === 200,
      error: status !== 200 ? (data.message || data.error) : null
    })
  } catch (e: any) {
    console.error('Request failed:', e)
    results.push({
      name: 'Long Prompt Audit',
      type: 'long',
      status: -1,
      duration: 'N/A',
      success: false,
      error: e.message
    })
  }

  console.log('\n=== LIVE CHECK RESULTS ===')
  console.table(results)
}

runLiveCheck().catch(console.error)
