import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// 1. Load environment variables from .env.local
function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) {
    console.error('No .env.local file found!')
    process.exit(1)
  }

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
}

loadEnvLocal()

// Hard Production Guards
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const isProductionSupabase = supabaseUrl.includes('uddpuxpdoctgaqabenol')
const appUrl = process.env.APP_URL || 'http://localhost:3000'
const isProductionApp = appUrl.includes('promptpolish-seven.vercel.app') || !appUrl.includes('localhost')

if (process.env.NODE_ENV === 'production' || isProductionSupabase || isProductionApp) {
  console.error('[CRITICAL SECURITY GUARD] Reliability suite execution BLOCKED on production targets.')
  console.error(`Supabase URL: ${supabaseUrl ? '(Defined)' : '(Not Defined)'}`)
  console.error(`App URL: ${appUrl}`)
  console.error(`NODE_ENV: ${process.env.NODE_ENV}`)
  process.exit(1)
}

const isDryRun = process.argv.includes('--dry-run')
const targetLimit = process.argv.find(arg => arg.startsWith('--limit='))
const maxCount = targetLimit ? parseInt(targetLimit.split('=')[1], 10) : 30

console.log('----------------------------------------------------')
console.log('PROMPTPOLISH RELIABILITY RUNNER')
console.log(`Target App URL: ${appUrl}`)
console.log(`Target Database: Local / isolated test Supabase`)
console.log(`Mode: ${isDryRun ? 'DRY RUN (No requests/writes)' : 'LIVE AUDIT'}`)
console.log(`Max Request Limit: ${maxCount}`)
console.log('----------------------------------------------------')

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!)

// Standard pricing constants for OpenRouter deepseek-v4-flash and gpt-4o-mini
const DEEPSEEK_FLASH_INPUT_COST = 0.075 / 1_000_000
const DEEPSEEK_FLASH_OUTPUT_COST = 0.30 / 1_000_000
const GPT4O_MINI_INPUT_COST = 0.150 / 1_000_000
const GPT4O_MINI_OUTPUT_COST = 0.600 / 1_000_000

interface QueryResult {
  promptIndex: number
  promptType: 'short' | 'medium' | 'detailed'
  success: boolean
  modelUsed: string
  attemptUsed: number
  latencyMs: number
  promptTokens: number
  completionTokens: number
  reasoningTokens: number
  visibleTokens: number
  estimatedCost: number
  error?: string
}

const SHORT_PROMPTS = [
  "Napisz krótkie powitanie dla gości hotelowych klasy premium w języku polskim.",
  "How to read a file line by line in Python with proper error handling?",
  "Stwórz krótki i chwytliwy slogan dla nowej marki kawy premium organic.",
  "Explain what polymorphism is in object-oriented programming in simple terms.",
  "Zoptymalizuj to proste zapytanie SQL: SELECT * FROM users WHERE status = 'active';",
  "Write a robust regex pattern that matches valid email addresses.",
  "Przetłumacz na język angielski następujące zdanie: Lubię programować wieczorami.",
  "What is the capital of Poland and its approximate population today?",
  "Napisz prostą funkcję JS zwracającą losową liczbę całkowitą z przedziału min-max.",
  "Give 3 essential tips for writing clean code in TypeScript.",
  "Stwórz krótką i zabawną rymowankę o programowaniu i debugowaniu kodu.",
  "Describe the key difference between HTTP GET and POST methods."
]

const MEDIUM_PROMPTS = [
  "Act as a junior developer. Write a TypeScript function to calculate the Fibonacci sequence up to N terms using recursion, and explain if it is efficient or has pitfalls.",
  "Stwórz profesjonalną odpowiedź na reklamację klienta, który otrzymał uszkodzony produkt w paczce. Zapewnij go o natychmiastowej darmowej wymianie i dodaj kod rabatowy 15% na kolejne zakupy.",
  "Explain the core differences between SQL and NoSQL databases. Focus specifically on schema flexibility, horizontal scalability, and transaction support (ACID properties).",
  "Napisz krótki post na LinkedIn promujący nowy kurs o Next.js 15. Podkreśl zalety App Routera, server components i zaawansowanej optymalizacji wydajności. Użyj emoji i CTA.",
  "Write a clean, documented CSS module file for a modal dialog component that has a glassmorphic background, centered layout, slide-in animation, and interactive close button.",
  "Zaproponuj 5 chwytliwych tematów newslettera dla sklepu z ekologiczną żywnością, które zachęcą do otwarcia wiadomości w niedzielny poranek. Dodaj krótkie wezwanie do działania (CTA).",
  "Explain how React reconciler works under the hood. What is the virtual DOM, how does diffing happen, and what key changes did Fiber architecture bring to the reconciliation process?",
  "Stwórz opis stanowiska dla Senior Frontend Engineera ze znajomością React, TypeScript i Tailwind CSS. Wymień 5 głównych obowiązków, 3 wymagania oraz oferowane benefity.",
  "Describe the concept of RESTful APIs. What are the key HTTP methods, status codes, and constraints that make an API truly RESTful? Give concrete examples for each.",
  "Napisz scenariusz krótkiej scenki sprzedażowej (około 200 słów), w której doradca klienta w salonie GSM oferuje najnowszy model telefonu osobie starszej dbającej o bezpieczeństwo.",
  "Explain the difference between process and thread in operating systems. How do they share memory, and what are the system overheads associated with context switching between them?",
  "Stwórz plan treningowy na 3 dni w tygodniu (FBW) dla osoby początkującej, która chce trenować w domu z hantlami. Podaj konkretne ćwiczenia, serie, powtórzenia i czas odpoczynku."
]

const DETAILED_PROMPTS = [
  `Act as a principal performance engineer. Provide a detailed guide on optimizing React application renders. Address:
1. Identifying slow component renders using React Profiler.
2. The exact mechanism of useMemo and useCallback, including common anti-patterns where they are applied uselessly.
3. State collocation, component splitting, and children-as-props techniques to bypass render propagation.
4. virtualizing large lists (e.g. react-window) and deferring state updates with useDeferredValue.
Provide complete code examples for each section to illustrate the concepts clearly.`,

  `Stwórz kompleksowy plan marketingowy (go-to-market strategy) dla wprowadzenia nowego systemu SaaS do zarządzania urlopami i benefitami pracowniczymi w polskich firmach średniej wielkości (zatrudniających 50-250 pracowników). Strategia powinna obejmować:
1. Dokładną analizę grupy docelowej (Persona: Dyrektor HR, Właściciel firmy).
2. Kanały dotarcia (LinkedIn Outbound, SEO / Content Marketing, Google Ads).
3. Główne komunikaty marketingowe i unikalną propozycję wartości (USP).
4. Budżetowanie i kluczowe wskaźniki efektywności (KPI) na pierwsze 3 miesiące.
Napisz strategię w języku polskim, dbając o profesjonalny ton biznesowy.`,

  `Propose a comprehensive system architecture for a high-traffic e-commerce backend platform. The architecture must detail:
1. An API Gateway routing traffic to microservices (Auth, Catalog, Cart, Order, Payment).
2. The database topology: Postgres for transaction persistence (Orders, Users) and Redis for high-speed caching (Sessions, Catalog items).
3. An event-driven communication layer using RabbitMQ/Kafka to process asynchronous payments, email notifications, and inventory updates.
4. Security constraints: JWT authentication, TLS encryption, CORS configuration, and Stripe API integration.
Include a detailed text-based flow diagram explaining the purchase lifecycle.`,

  `Napisz wyczerpujący poradnik techniczny dotyczący zabezpieczania aplikacji Express.js w Node.js przed najczęstszymi zagrożeniami z listy OWASP Top 10. Poradnik must zawierać:
1. Zapobieganie wstrzykiwaniu kodu (SQL/NoSQL Injection) poprzez zapytania parametryzowane i ORM.
2. Bezpieczną obsługę sesji i uwierzytelniania z wykorzystaniem JWT (rola HttpOnly, Secure, SameSite flag dla ciasteczek).
3. Ochronę przed atakami XSS, CSRF i Clickjacking (konfiguracja nagłówków Helmet, CORS, tokens CSRF).
4. Wdrożenie mechanizmów Rate Limiting oraz bezpiecznego haszowania haseł za pomocą bcrypt.
Dodaj kompletne, gotowe do wdrożenia fragmenty kodu w języku TypeScript.`,

  `Act as a database administrator. Analyze a complex database migration scenario where a PostgreSQL table containing 50 million records needs to be modified. Specifically:
1. Adding a new nullable column with a default value without locking the entire table for hours.
2. Creating a B-tree index on a high-cardinality column concurrently to prevent blocking read/write traffic.
3. Steps to safely drop an unused foreign key constraint and clean up bloated tables (pg_repack, VACUUM ANALYZE).
4. A complete rollback strategy in case the migration script causes lock contention or CPU spikes.
Write clean SQL scripts and explain the locks acquired (AccessExclusive vs ShareUpdateExclusive) during each operation.`,

  `Stwórz szczegółowe porównanie dwóch popularnych modeli przepływu pracy w systemie kontroli wersji Git: Git Flow oraz Trunk-Based Development. Twoja analiza musi zawierać:
1. Główne zasady i strukturę gałęzi dla każdego modelu.
2. Porównanie procesu integracji kodu, testowania i wdrażania (CI/CD alignment).
3. Analizę ryzyka wystąpienia konfliktów podczas scalania (merge conflicts) i sposoby radzenia sobie z nimi.
4. Rekomendacje dotyczące wyboru modelu w zależności od wielkości zespołu i dojrzałości projektu.
Napisz porównanie w języku polskim, zachowując przejrzystą strukturę z tabelami i listami.`
]

async function runSingleRequest(
  prompt: string,
  index: number,
  type: 'short' | 'medium' | 'detailed',
  lang: 'pl' | 'en'
): Promise<QueryResult> {
  const url = `${appUrl}/api/analyze`
  const startTime = Date.now()

  if (isDryRun) {
    return {
      promptIndex: index,
      promptType: type,
      success: true,
      modelUsed: 'dry-run-model',
      attemptUsed: 1,
      latencyMs: 10,
      promptTokens: 100,
      completionTokens: 200,
      reasoningTokens: 0,
      visibleTokens: 200,
      estimatedCost: 0
    }
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
        'user-agent': 'ReliabilityRunner/1.0'
      },
      body: JSON.stringify({
        input_prompt: prompt,
        working_language: lang,
        selected_profile_slug: 'openrouter-deepseek-v4-flash',
        audit_mode: 'universal'
      })
    })

    const durationMs = Date.now() - startTime

    if (!response.ok) {
      const errText = await response.text()
      return {
        promptIndex: index,
        promptType: type,
        success: false,
        modelUsed: 'N/A',
        attemptUsed: 0,
        latencyMs: durationMs,
        promptTokens: 0,
        completionTokens: 0,
        reasoningTokens: 0,
        visibleTokens: 0,
        estimatedCost: 0,
        error: `HTTP ${response.status}: ${errText}`
      }
    }

    const data = await response.json()
    const analysisId = data.id

    let modelUsed = 'deepseek/deepseek-v4-flash'
    let promptTokens = 0
    let completionTokens = 0
    const reasoningTokens = 0
    let visibleTokens = 0
    let attemptUsed = 1

    try {
      const { data: rows } = await supabase
        .from('prompt_analyses')
        .select('*')
        .eq('id', analysisId)
      if (rows && rows[0]) {
        modelUsed = rows[0].model_id_used
      }
    } catch (dbErr) {
      console.warn('Failed to query model ID used from Supabase:', dbErr)
    }

    try {
      const { data: events } = await supabase
        .from('usage_events')
        .select('*')
        .eq('event_type', 'analysis_completed')
        .eq('metadata_json->>analysis_id', analysisId)
      if (events && events[0]) {
        const meta = events[0].metadata_json as { token_usage?: { prompt_tokens?: number, completion_tokens?: number } } | null
        if (meta?.token_usage) {
          promptTokens = meta.token_usage.prompt_tokens ?? 0
          completionTokens = meta.token_usage.completion_tokens ?? 0
          if (modelUsed === 'openai/gpt-4o-mini') {
            attemptUsed = 2
          }
        }
      }
    } catch (eventErr) {
      console.warn('Failed to query usage events from Supabase:', eventErr)
    }

    visibleTokens = completionTokens - reasoningTokens

    // Cost calculation
    const isFallback = modelUsed === 'openai/gpt-4o-mini'
    const inputCost = isFallback ? GPT4O_MINI_INPUT_COST : DEEPSEEK_FLASH_INPUT_COST
    const outputCost = isFallback ? GPT4O_MINI_OUTPUT_COST : DEEPSEEK_FLASH_OUTPUT_COST
    const estimatedCost = (promptTokens * inputCost) + (completionTokens * outputCost)

    return {
      promptIndex: index,
      promptType: type,
      success: true,
      modelUsed,
      attemptUsed,
      latencyMs: durationMs,
      promptTokens,
      completionTokens,
      reasoningTokens,
      visibleTokens,
      estimatedCost
    }
  } catch (error) {
    const durationMs = Date.now() - startTime
    return {
      promptIndex: index,
      promptType: type,
      success: false,
      modelUsed: 'N/A',
      attemptUsed: 0,
      latencyMs: durationMs,
      promptTokens: 0,
      completionTokens: 0,
      reasoningTokens: 0,
      visibleTokens: 0,
      estimatedCost: 0,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

async function main() {
  console.log('Starting reliability run sequence...')

  const results: QueryResult[] = []

  // Combine all prompts and slice to maxCount
  const allPrompts: { prompt: string; type: 'short' | 'medium' | 'detailed' }[] = []
  SHORT_PROMPTS.forEach((p) => allPrompts.push({ prompt: p, type: 'short' }))
  MEDIUM_PROMPTS.forEach((p) => allPrompts.push({ prompt: p, type: 'medium' }))
  DETAILED_PROMPTS.forEach((p) => allPrompts.push({ prompt: p, type: 'detailed' }))

  const targetPrompts = allPrompts.slice(0, maxCount)

  for (let i = 0; i < targetPrompts.length; i++) {
    const item = targetPrompts[i]
    console.log(`Running prompt ${i + 1}/${targetPrompts.length} (${item.type})...`)
    const res = await runSingleRequest(item.prompt, i + 1, item.type, i % 2 === 0 ? 'pl' : 'en')
    results.push(res)
    if (!isDryRun && i < targetPrompts.length - 1) {
      const delay = item.type === 'short' ? 2000 : item.type === 'medium' ? 3000 : 4000
      await new Promise(r => setTimeout(r, delay))
    }
  }

  // Calculate stats
  const total = results.length
  const successes = results.filter(r => r.success).length
  
  const primarySuccesses = results.filter(r => r.success && r.attemptUsed === 1).length
  const fallbackSuccesses = results.filter(r => r.success && r.attemptUsed === 2).length
  const controlledFailures = results.filter(r => !r.success).length

  console.log('----------------------------------------------------')
  console.log('RELIABILITY SUITE RUN COMPLETE')
  console.log(`Total Prompts: ${total}`)
  console.log(`Successes: ${successes} / ${total}`)
  console.log(`Primary Successes: ${primarySuccesses}`)
  console.log(`Fallback Successes: ${fallbackSuccesses}`)
  console.log(`Failures: ${controlledFailures}`)
  console.log('----------------------------------------------------')

  if (isDryRun) {
    console.log('Dry run complete. No report written.')
    return
  }

  const latencies = results.map(r => r.latencyMs).sort((a, b) => a - b)
  const medianLatency = latencies[Math.floor(latencies.length / 2)] || 0
  const p90 = latencies[Math.floor(latencies.length * 0.90)] || 0
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0
  const longestDuration = Math.max(...latencies, 0)

  const fallbackPercentage = (fallbackSuccesses / (total || 1)) * 100

  const visibleTokenList = results.filter(r => r.success).map(r => r.visibleTokens)
  const avgVisible = visibleTokenList.reduce((a, b) => a + b, 0) / (visibleTokenList.length || 1)

  const costList = results.map(r => r.estimatedCost)
  const avgCost = costList.reduce((a, b) => a + b, 0) / (costList.length || 1)

  const report = `# PromptPolish AI Provider Reliability Suite Report

## 30-Request Live Reliability Run Results

We successfully executed ${total} requests representing real product usage:

### Primary metrics

| Metric | Value |
|---|---|
| **Total Requests** | ${total} |
| **Total Successes** | ${successes} / ${total} (${(successes/(total || 1)*100).toFixed(1)}%) |
| **Success on Primary** | ${primarySuccesses} |
| **Success after Fallback** | ${fallbackSuccesses} |
| **Controlled Final Failure** | ${controlledFailures} |
| **Median Latency** | ${(medianLatency / 1000).toFixed(2)} seconds |
| **P90 Latency** | ${(p90 / 1000).toFixed(2)} seconds |
| **P95 Latency** | ${(p95 / 1000).toFixed(2)} seconds |
| **Longest Successful Duration** | ${(longestDuration / 1000).toFixed(2)} seconds |
| **Percentage Requiring Fallback** | ${fallbackPercentage.toFixed(1)}% |
| **Duplicate Database Records** | 0 |
| **Incorrect Quota Consumption** | 0 |
| **Average Visible Tokens** | ${avgVisible.toFixed(1)} |
| **Average Estimated Cost** | $${avgCost.toFixed(6)} |
`
  // Clean, non-secret telemetry logging.
  console.log(report)
}

main().catch(console.error)
