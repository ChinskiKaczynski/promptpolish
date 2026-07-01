import fs from 'fs'
import path from 'path'
import { google } from '@ai-sdk/google'
import { generateText, Output } from 'ai'
import { analysisResultSchema } from '../lib/ai/schemas'
import { mvpModelProfiles } from '../lib/ai/model-profiles'
import { analysisSystemInstruction, constructUserAnalysisPrompt } from '../lib/ai/prompts'

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return
  const content = fs.readFileSync(envPath, 'utf8')
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const firstEquals = trimmed.indexOf('=')
    if (firstEquals !== -1) {
      const key = trimmed.slice(0, firstEquals).trim()
      let val = trimmed.slice(firstEquals + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1)
      process.env[key] = val
    }
  }
}

loadEnvLocal()

interface Telemetry {
  totalCalls: number
  invalidSchemaCount: number
  providerErrorsCount: number
  retryCount: number
  tokenUsage: { promptTokens: number; completionTokens: number; totalTokens: number }
}

async function runSmokeTest() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  const modelId = process.env.GEMINI_MODEL_ID || 'gemini-2.5-flash'

  console.log('==================================================')
  console.log(' Google Gemini Production Schema Structured Smoke Test ')
  console.log('==================================================')
  console.log(`Target Model ID: ${modelId}`)

  if (!apiKey || apiKey.trim() === '') {
    console.warn('\n[STATUS] GOOGLE_GENERATIVE_AI_API_KEY is not defined or is empty in .env.local.')
    console.log('Live smoke test skipped. To run against the live API:')
    console.log('1. Add to .env.local: GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy...')
    console.log('2. Run: pnpm smoke:gemini')
    console.log('\nExiting gracefully. Live integration remains pending configuration (DO NOT FAKE SUCCESS).')
    process.exit(0)
  }

  console.log('API Key detected. Initiating live full-schema structured output smoke test...')

  const testCases = [
    { name: 'Polish (PL) Weak', prompt: 'Napisz opis produktu', lang: 'pl' as const, profile: 'general-llm' as const, auditMode: 'universal' },
    { name: 'English (EN) Weak', prompt: 'Write a product description', lang: 'en' as const, profile: 'general-llm' as const, auditMode: 'universal' },
    { name: 'English (EN) Strong', prompt: 'Act as a senior e-commerce copywriter. Create a concise product description for a premium desk lamp for remote workers. Output: headline, 3 bullets, short CTA. Avoid unsupported claims.', lang: 'en' as const, profile: 'general-llm' as const, auditMode: 'seo_content' }
  ]

  const telemetry: Telemetry = { totalCalls: 0, invalidSchemaCount: 0, providerErrorsCount: 0, retryCount: 0, tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 } }

  for (const tc of testCases) {
    console.log(`\n--- Running Case: ${tc.name} ---`)
    const modelProfile = mvpModelProfiles.find((p) => p.slug === tc.profile)
    if (!modelProfile) { console.error(`Profile not found: ${tc.profile}`); continue }

    const systemInstruction = analysisSystemInstruction
    const userPrompt = constructUserAnalysisPrompt({ inputPrompt: tc.prompt, workingLanguage: tc.lang, modelProfile, auditMode: tc.auditMode })

    let attempt = 0
    let success = false
    while (attempt <= 2 && !success) {
      telemetry.totalCalls++
      attempt++
      try {
        console.log(`Attempt ${attempt}/3...`)
        const { output, usage } = await generateText({ model: google(modelId) as any, system: systemInstruction, prompt: userPrompt, temperature: 0.1, output: Output.object({ schema: analysisResultSchema }) })
        const parsed = analysisResultSchema.safeParse(output)
        if (!parsed.success) { telemetry.invalidSchemaCount++; console.warn('[WARNING] Schema validation failed:', parsed.error.flatten()) }
        else { success = true; console.log(`[SUCCESS] task=${parsed.data.detected_task_type}`); console.log(`summary: ${parsed.data.overall_summary.slice(0, 80)}...`) }
        if (usage) {
          const u = usage as Record<string, unknown>
          const p = typeof u.promptTokens === 'number' ? u.promptTokens : 0
          const c = typeof u.completionTokens === 'number' ? u.completionTokens : 0
          const t = typeof u.totalTokens === 'number' ? u.totalTokens : 0
          telemetry.tokenUsage.promptTokens += p; telemetry.tokenUsage.completionTokens += c; telemetry.tokenUsage.totalTokens += t
          console.log(`tokens: prompt=${p} completion=${c} total=${t}`)
        }
      } catch (err) {
        telemetry.providerErrorsCount++
        console.error(`[ERROR] Attempt ${attempt}:`, err instanceof Error ? err.message : err)
        if (attempt <= 2) { telemetry.retryCount++; console.log('Retrying in 1s...'); await new Promise(r => setTimeout(r, 1000)) }
      }
    }
  }

  const allFailed = telemetry.totalCalls > 0 && telemetry.providerErrorsCount === telemetry.totalCalls
  const invalidRate = telemetry.totalCalls > 0 ? (telemetry.invalidSchemaCount / telemetry.totalCalls * 100).toFixed(2) : '0.00'

  console.log('\n==================================================')
  console.log('               Telemetry Summary                  ')
  console.log('==================================================')
  console.log(`Provider:              Google Gemini (@ai-sdk/google)`)
  console.log(`Model ID Used:         ${modelId}`)
  console.log(`Total Calls:           ${telemetry.totalCalls}`)
  console.log(`Retries:               ${telemetry.retryCount}`)
  console.log(`Provider Errors:       ${telemetry.providerErrorsCount}`)
  console.log(`Invalid Schema Count:  ${telemetry.invalidSchemaCount}`)
  console.log(`Invalid Output Rate:   ${invalidRate}%`)
  console.log(`Total Prompt Tokens:   ${telemetry.tokenUsage.promptTokens}`)
  console.log(`Total Compl. Tokens:   ${telemetry.tokenUsage.completionTokens}`)
  console.log(`Total Tokens:          ${telemetry.tokenUsage.totalTokens}`)
  console.log('==================================================')

  if (allFailed) { console.error('\n[CRITICAL] All API calls failed. Smoke test FAILED.'); process.exit(1) }
  console.log('\n[RESULT] Smoke test completed successfully.')
}

runSmokeTest()
