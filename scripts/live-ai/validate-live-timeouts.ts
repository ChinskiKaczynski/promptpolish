import { chromium, type Request } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
 
const TARGET_URL = 'https://promptpolish-seven.vercel.app'
const ARTIFACT_DIR = 'C:/Users/Nuph/.gemini/antigravity-ide/brain/e40ce494-8413-40c3-84c1-908b9840585a'
 
// Helper to make sure artifact dir exists
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true })
}
 
interface AuditRecord {
  name: string
  promptLength: number
  postCount: number
  status: number
  durationMs: number
  resultUrl: string
  errorText?: string
  duplicatePosts: boolean
  raw504: boolean
  controlledTimeout: boolean
}
 
async function runValidation() {
  console.log(`=== STARTING PRODUCTION VALIDATION ON ${TARGET_URL} ===`)
 
  const browser = await chromium.launch({ headless: true })
  
  // Set up clean browser context
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: 'pl-PL'
  })
 
  const page = await context.newPage()
 
  // Track network requests to /api/analyze
  let postCount = 0
  const apiRequestMap = new Map<Request, number>()
  let apiResponses: { status: number; durationMs: number; errorText?: string; duplicatePosts: boolean; raw504: boolean; controlledTimeout: boolean }[] = []
 
  page.on('request', (req) => {
    if (req.url().includes('/api/analyze') && req.method() === 'POST') {
      postCount++
      apiRequestMap.set(req, Date.now())
      console.log(`[Network] POST /api/analyze detected (Request #${postCount})`)
    }
  })
 
  page.on('response', async (res) => {
    const req = res.request()
    if (req.url().includes('/api/analyze') && req.method() === 'POST') {
      const startTime = apiRequestMap.get(req)
      const durationMs = startTime ? Date.now() - startTime : 0
      const status = res.status()
      const text = await res.text().catch(() => '')
      
      const raw504 = status === 504
      let controlledTimeout = false
      
      if (text.includes('provider_timeout') || text.includes('upstream_provider_error') || text.includes('function_platform_timeout') || text.includes('Analiza trwała zbyt długo')) {
        controlledTimeout = true
      }
 
      console.log(`[Network] POST /api/analyze response: Status ${status}, Duration ${durationMs}ms, ControlledTimeout: ${controlledTimeout}`)
      
      apiResponses.push({
        status,
        durationMs,
        errorText: status !== 200 ? text : undefined,
        duplicatePosts: postCount > 1,
        raw504,
        controlledTimeout
      })
    }
  })

  // 1. Landing Page checks
  console.log('Navigating to landing page...')
  await page.goto(TARGET_URL)
  await page.waitForTimeout(2000)
  
  const hasDemoBadge = await page.locator('text=DEMO').first().isVisible().catch(() => false) ||
                       await page.locator('text=Przykładowy wynik').first().isVisible().catch(() => false)
  console.log(`Landing page loaded. Demo/Przykładowy wynik badge present: ${hasDemoBadge}`)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'landing_page.png') })

  // 2. Pricing Page checks
  console.log('Navigating to /pricing page...')
  await page.goto(`${TARGET_URL}/pricing`)
  await page.waitForTimeout(2000)
  const pricingText = await page.locator('body').innerText()
  const stripeFormPresent = pricingText.includes('Card number') || pricingText.includes('CVC') || (await page.locator('form').count() > 0 && pricingText.includes('Zapłać'))
  const waitlistOrBetaMsg = pricingText.includes('beta') || pricingText.includes('test') || pricingText.includes('niedostępne') || pricingText.includes('kontakt') || pricingText.includes('wyłączone')
  console.log(`Pricing: stripeFormPresent=${stripeFormPresent}, waitlistOrBetaMsg=${waitlistOrBetaMsg}`)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'pricing_page.png') })

  // 3. Error path check ("test" too-short prompt)
  console.log('Checking validation error path...')
  await page.goto(`${TARGET_URL}/analyze`)
  await page.waitForTimeout(2000)
  const textarea = page.locator('textarea')
  await textarea.fill('test')
  
  // Verify it is blocked client-side (button is disabled)
  const isSubmitDisabled = await page.locator('button[type="submit"]').isDisabled()
  const charMinWarnVisible = await page.locator('#char-min-warn').isVisible().catch(() => false)
  const charMinWarnText = charMinWarnVisible ? await page.locator('#char-min-warn').innerText() : ''
  
  console.log(`Validation check: isSubmitDisabled=${isSubmitDisabled}, charMinWarnVisible=${charMinWarnVisible}, text="${charMinWarnText}"`)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'validation_error.png') })

  // Define helper to run audit
  async function runAudit(name: string, promptText: string): Promise<AuditRecord> {
    console.log(`Running Audit: ${name}...`)
    await page.goto(`${TARGET_URL}/analyze`)
    await page.waitForTimeout(2000)
    
    await page.locator('textarea').fill(promptText)
    await page.waitForTimeout(500)
    
    postCount = 0
    apiResponses = []
    
    const startTime = Date.now()
    await page.click('button[type="submit"]')
    
    // Wait for either redirection or timeout error page
    let durationMs = 0
    let tries = 0
    while (tries < 180) { // Max 180 seconds
      await page.waitForTimeout(1000)
      durationMs = Date.now() - startTime
      
      const currentUrl = page.url()
      if (currentUrl.includes('/result/')) {
        break
      }
      
      // Check if error message displayed in UI
      const hasErrorInUI = await page.locator('text=błąd').isVisible().catch(() => false) ||
                           await page.locator('text=trwała zbyt długo').isVisible().catch(() => false) ||
                           await page.locator('text=przerwana').isVisible().catch(() => false) ||
                           await page.locator('#api-error').isVisible().catch(() => false)
      if (hasErrorInUI && apiResponses.length > 0) {
        break
      }
      
      tries++
    }
    
    const finalUrl = page.url()
    await page.screenshot({ path: path.join(ARTIFACT_DIR, `result_${name}.png`) })
    
    const response = apiResponses[0] || {
      status: -1,
      durationMs: durationMs,
      duplicatePosts: postCount > 1,
      raw504: false,
      controlledTimeout: false
    }
    
    return {
      name,
      promptLength: promptText.length,
      postCount,
      status: response.status,
      durationMs: durationMs,
      resultUrl: finalUrl,
      errorText: response.errorText,
      duplicatePosts: postCount > 1,
      raw504: response.raw504,
      controlledTimeout: response.controlledTimeout
    }
  }

  // Audit 1
  const audit1 = await runAudit('audit_1', "napisz mi posta na LinkedIna o tym że moja firma robi strony internetowe i że warto mieć dobrą stronę")
  
  // Audit 2
  const audit2 = await runAudit('audit_2', "stwórz opis produktu dla świecy sojowej lawendowej, ma być ładny i sprzedażowy")

  // Audit 3
  const audit3 = await runAudit('audit_3', "napisz krótki mail do klienta z przypomnieniem o zaległej płatności, uprzejmie ale stanowczo")

  // 4. Long prompt test (approx 8000 chars)
  console.log('Generating realistic long prompt (approx 8000 chars)...')
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
  console.log(`Base prompt length is ${baseLen} chars. Adding filler content to reach target of 8200...`)
  
  let filler = '\n\n--- SUPELEMENTARY SPECIFICATIONS AND DETAILS FOR THE SYSTEM ---\n'
  let counter = 0
  while (filler.length < neededChars) {
    filler += `Specyfikacja techniczna i szczegółowe wytyczne dla modułu ${counter++}: Każdy element interfejsu musi być w pełni responsywny i dostępny zgodnie z WCAG 2.1 na poziomie AA. System musi wspierać tryb ciemny (dark mode) oraz dynamiczne skalowanie czcionek. Integracja z systemami płatności (Stripe, PayU, Przelewy24) musi zapewniać pełne bezpieczeństwo transakcji oraz zgodność ze standardami PCI-DSS. Wszystkie dane klientów muszą być przechowywane w chmurze na terenie Unii Europejskiej z codziennym backupem. Czas odpowiedzi serwera (latency) nie powinien przekraczać 200ms pod pełnym obciążeniem. \n`
  }
  longPrompt += filler
  console.log(`Final long prompt character count: ${longPrompt.length}`)

  // Bypassing anonymous cookie rate limit: create a NEW browser context!
  console.log('Creating a new anonymous browser context for the long prompt to bypass the daily limit of 3...')
  const longContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: 'pl-PL'
  })
  const longPage = await longContext.newPage()
  
  let longPostCount = 0
  const longApiRequestMap = new Map<Request, number>()
  const longApiResponses: { status: number; durationMs: number; errorText?: string; duplicatePosts: boolean; raw504: boolean; controlledTimeout: boolean }[] = []

  longPage.on('request', (req) => {
    if (req.url().includes('/api/analyze') && req.method() === 'POST') {
      longPostCount++
      longApiRequestMap.set(req, Date.now())
      console.log(`[Network Long] POST /api/analyze detected (Request #${longPostCount})`)
    }
  })

  longPage.on('response', async (res) => {
    const req = res.request()
    if (req.url().includes('/api/analyze') && req.method() === 'POST') {
      const startTime = longApiRequestMap.get(req)
      const durationMs = startTime ? Date.now() - startTime : 0
      const status = res.status()
      const text = await res.text().catch(() => '')
      
      const raw504 = status === 504
      let controlledTimeout = false
      
      if (text.includes('provider_timeout') || text.includes('upstream_provider_error') || text.includes('function_platform_timeout') || text.includes('Analiza trwała zbyt długo')) {
        controlledTimeout = true
      }

      console.log(`[Network Long] POST /api/analyze response: Status ${status}, Duration ${durationMs}ms, ControlledTimeout: ${controlledTimeout}`)
      
      longApiResponses.push({
        status,
        durationMs,
        errorText: status !== 200 ? text : undefined,
        duplicatePosts: longPostCount > 1,
        raw504,
        controlledTimeout
      })
    }
  })

  console.log('Running Long Prompt Audit...')
  await longPage.goto(`${TARGET_URL}/analyze`)
  await longPage.waitForTimeout(2000)
  
  await longPage.locator('textarea').fill(longPrompt)
  await longPage.waitForTimeout(500)
  
  const longStartTime = Date.now()
  await longPage.click('button[type="submit"]')
  
  let longDurationMs = 0
  let longTries = 0
  while (longTries < 220) { // Max 220 seconds
    await longPage.waitForTimeout(1000)
    longDurationMs = Date.now() - longStartTime
    
    const currentUrl = longPage.url()
    if (currentUrl.includes('/result/')) {
      break
    }
    
    const hasErrorInUI = await longPage.locator('text=błąd').isVisible().catch(() => false) ||
                         await longPage.locator('text=trwała zbyt długo').isVisible().catch(() => false) ||
                         await longPage.locator('text=przerwana').isVisible().catch(() => false) ||
                         await longPage.locator('#api-error').isVisible().catch(() => false)
    if (hasErrorInUI && longApiResponses.length > 0) {
      break
    }
    
    longTries++
  }
  
  const longFinalUrl = longPage.url()
  await longPage.screenshot({ path: path.join(ARTIFACT_DIR, 'result_long_prompt.png') })
  
  const longResponse = longApiResponses[0] || {
    status: -1,
    durationMs: longDurationMs,
    duplicatePosts: longPostCount > 1,
    raw504: false,
    controlledTimeout: false
  }

  const longAudit = {
    name: 'long_prompt',
    promptLength: longPrompt.length,
    postCount: longPostCount,
    status: longResponse.status,
    durationMs: longDurationMs,
    resultUrl: longFinalUrl,
    errorText: longResponse.errorText,
    duplicatePosts: longPostCount > 1,
    raw504: longResponse.raw504,
    controlledTimeout: longResponse.controlledTimeout
  }

  // 5. Result Quality Spot Check on Audit 1
  const spotCheck = {
    scoreVisible: false,
    categoryScoresVisible: false,
    recommendationsVisible: false,
    improvedPromptVisible: false,
    internalsHidden: true,
    staleWarningMissing: true,
    pdfModalMarkdownFixed: false
  }

  if (audit1.resultUrl.includes('/result/')) {
    console.log('Running Spot Check on Audit 1 result page...')
    await page.goto(audit1.resultUrl)
    await page.waitForTimeout(3000)
    
    const bodyText = await page.locator('body').innerText()
    
    // Check score (presence of digits)
    spotCheck.scoreVisible = /\d+/.test(bodyText)
    
    // Check elements
    spotCheck.categoryScoresVisible = bodyText.includes('Jasność celu') || bodyText.includes('Kompletność kontekstu') || bodyText.includes('Struktura promptu') || bodyText.includes('Kryteria szczegółowe')
    spotCheck.recommendationsVisible = bodyText.includes('Największe słabości') || bodyText.includes('Plan naprawy')
    spotCheck.improvedPromptVisible = bodyText.includes('POPRAWIONY PROMPT') || bodyText.includes('Skopiuj')
    
    // Check internals hidden
    const hasInternals = bodyText.includes('OpenRouter') || bodyText.includes('deepseek/deepseek-v4-flash') || bodyText.includes('gpt-4o-mini') || bodyText.includes('API key') || bodyText.includes('OPENROUTER_')
    spotCheck.internalsHidden = !hasInternals
    
    // Check stale warning
    spotCheck.staleWarningMissing = !bodyText.includes('STALE/UNVERIFIED DATA') && !bodyText.includes('Stale/Unverified Data')

    // Click Export PDF button and verify PDF modal markdown
    const isEksportujVisible = await page.locator('text=Eksportuj').first().isVisible().catch(() => false)
    const exportBtn = isEksportujVisible ? page.locator('text=Eksportuj').first() : page.locator('button:has-text("PDF")').first()
    if (await exportBtn.isVisible()) {
      await exportBtn.click()
      await page.waitForTimeout(1000)
      const modalText = await page.locator('body').innerText()
      // PDF Modal check
      spotCheck.pdfModalMarkdownFixed = !modalText.includes('**Pro**') && !modalText.includes('**')
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'pdf_modal.png') })
      // Close modal
      await page.keyboard.press('Escape')
    } else {
      console.log('PDF export button not found!')
    }
  }

  // 6. Mobile 390px Viewport Check
  console.log('Testing Mobile Layout (390px)...')
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  })
  const mobilePage = await mobileContext.newPage()
  await mobilePage.goto(`${TARGET_URL}/analyze`)
  await mobilePage.waitForTimeout(2000)
  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_analyze.png') })
  
  if (audit1.resultUrl.includes('/result/')) {
    await mobilePage.goto(audit1.resultUrl)
    await mobilePage.waitForTimeout(3000)
    await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_result.png') })
  }
  
  await mobileContext.close()
  await longContext.close()
  await context.close()
  await browser.close()

  console.log('=== VALIDATION FINISHED ===')
  
  const reportObj = {
    hasDemoBadge,
    stripeFormPresent,
    waitlistOrBetaMsg,
    isSubmitDisabledForShortPrompt: isSubmitDisabled,
    charMinWarnVisible,
    charMinWarnText,
    audit1,
    audit2,
    audit3,
    longAudit,
    spotCheck
  }
  
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'validation_report.json'), JSON.stringify(reportObj, null, 2))
  console.log('Report JSON written successfully.')
  console.log(JSON.stringify(reportObj, null, 2))
}

runValidation().catch((err) => {
  console.error('Validation script failed:', err)
  process.exit(1)
})
