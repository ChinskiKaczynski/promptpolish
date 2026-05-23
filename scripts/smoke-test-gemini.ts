import fs from 'fs'
import path from 'path'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText, Output } from 'ai'
import { analysisResultSchema } from '../lib/ai/schemas'
import { mvpModelProfiles } from '../lib/ai/model-profiles'
import { analysisSystemInstruction, constructUserAnalysisPrompt } from '../lib/ai/prompts'

// Custom robust env loader to parse .env.local directly without node_modules resolution dependencies
function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return

  const content = fs.readFileSync(envPath, 'utf8')
  const lines = content.split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const firstEquals = trimmed.indexOf('=')
    if (firstEquals !== -1) {
      const key = trimmed.slice(0, firstEquals).trim()
      let val = trimmed.slice(firstEquals + 1).trim()
      // Remove optional surrounding quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      process.env[key] = val
    }
  }
}

loadEnvLocal()

const GEMINI_FLASH_INPUT_COST_PER_1M = 0.075 // $0.075 per 1M tokens
const GEMINI_FLASH_OUTPUT_COST_PER_1M = 0.30 // $0.30 per 1M tokens

interface Telemetry {
  totalCalls: number
  invalidSchemaCount: number
  providerErrorsCount: number
  retryCount: number
  tokenUsage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  costEstimation: number
}

async function runSmokeTest() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  const modelId = process.env.GEMINI_MODEL_ID || 'gemini-3.5-flash'

  console.log('==================================================')
  console.log('   Gemini Production Schema Structured Smoke Test ')
  console.log('==================================================')
  console.log(`Target Model ID: ${modelId}`)

  if (!apiKey || apiKey.trim() === '') {
    console.warn('\n[STATUS] GOOGLE_GENERATIVE_AI_API_KEY is not defined or is empty in .env.local.')
    console.log('Live smoke test skipped. To run this test against the live Gemini API, follow these steps:')
    console.log('1. Open your ".env.local" file.')
    console.log('2. Provide a valid Gemini key: GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy...')
    console.log('3. Run this script: npx tsx scripts/smoke-test-gemini.ts')
    console.log('\nExiting gracefully. Live integration remains pending configuration (DO NOT FAKE SUCCESS).')
    process.exit(0)
  }

  console.log('API Key detected. Initiating live full-schema structured output smoke test...')

  const testCases = [
    {
      name: 'Polish (PL) Weak Prompt',
      prompt: 'Napisz opis produktu',
      lang: 'pl' as const,
      profile: 'general-llm' as const,
    },
    {
      name: 'Polish (PL) Strong Prompt',
      prompt: 'Działaj jako starszy copywriter e-commerce. Stwórz zwięzły opis produktu dla lampki biurkowej klasy premium dla pracowników zdalnych. Format wyjściowy: nagłówek, 3 punkty, krótkie wezwanie do działania. Unikaj niepotwierdzonych twierdzeń.',
      lang: 'pl' as const,
      profile: 'google-gemini-3-5-flash' as const,
    },
    {
      name: 'English (EN) Weak Prompt',
      prompt: 'Write a product description',
      lang: 'en' as const,
      profile: 'general-llm' as const,
    },
    {
      name: 'English (EN) Strong Prompt',
      prompt: 'Act as a senior e-commerce copywriter. Create a concise product description for a premium desk lamp for remote workers. Output: headline, 3 bullets, short CTA. Avoid unsupported claims.',
      lang: 'en' as const,
      profile: 'google-gemini-3-5-flash' as const,
    }
  ]

  const telemetry: Telemetry = {
    totalCalls: 0,
    invalidSchemaCount: 0,
    providerErrorsCount: 0,
    retryCount: 0,
    tokenUsage: {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0
    },
    costEstimation: 0
  }

  const googleInstance = createGoogleGenerativeAI({ apiKey })

  for (const tc of testCases) {
    console.log(`\n--- Running Case: ${tc.name} ---`)
    const modelProfile = mvpModelProfiles.find((p) => p.slug === tc.profile)
    if (!modelProfile) {
      console.error(`Error: Profile ${tc.profile} not found in mvpModelProfiles.`)
      continue
    }

    const systemInstruction = analysisSystemInstruction
    const userPrompt = constructUserAnalysisPrompt({
      inputPrompt: tc.prompt,
      workingLanguage: tc.lang,
      modelProfile
    })

    const maxRetries = 2
    let attempt = 0
    let success = false

    while (attempt <= maxRetries && !success) {
      telemetry.totalCalls++
      attempt++

      try {
        console.log(`Execution attempt ${attempt}/${maxRetries + 1}...`)
        const { output, usage } = await generateText({
          model: googleInstance(modelId),
          system: systemInstruction,
          prompt: userPrompt,
          temperature: 0.1,
          output: Output.object({
            schema: analysisResultSchema
          })
        })

        // Zod validation is handled implicitly by AI SDK output: Output.object,
        // but we double-check just to record precise invalid schema count.
        const parsed = analysisResultSchema.safeParse(output)
        if (!parsed.success) {
          telemetry.invalidSchemaCount++
          console.warn(`[WARNING] Schema validation failed:`, parsed.error.flatten())
        } else {
          success = true
          console.log(`[SUCCESS] Valid structured response generated!`)
          console.log(`- Detected Task Type: ${parsed.data.detected_task_type}`)
          console.log(`- Overall Summary: ${parsed.data.overall_summary.slice(0, 100)}...`)
        }

        if (usage) {
          const usageRecord = usage as Record<string, unknown>
          const pTokens = typeof usageRecord.promptTokens === 'number' ? usageRecord.promptTokens : 0
          const cTokens = typeof usageRecord.completionTokens === 'number' ? usageRecord.completionTokens : 0
          const tTokens = typeof usageRecord.totalTokens === 'number' ? usageRecord.totalTokens : 0

          telemetry.tokenUsage.promptTokens += pTokens
          telemetry.tokenUsage.completionTokens += cTokens
          telemetry.tokenUsage.totalTokens += tTokens

          const caseCost = 
            (pTokens * GEMINI_FLASH_INPUT_COST_PER_1M + 
             cTokens * GEMINI_FLASH_OUTPUT_COST_PER_1M) / 1000000
          telemetry.costEstimation += caseCost

          console.log(`- Token Usage: Prompt=${pTokens}, Completion=${cTokens}, Total=${tTokens}`)
          console.log(`- Case Cost Estimation: $${caseCost.toFixed(6)}`)
        }
      } catch (error) {
        telemetry.providerErrorsCount++
        console.error(`[ERROR] Attempt ${attempt} failed:`, error instanceof Error ? error.message : error)
        if (attempt <= maxRetries) {
          telemetry.retryCount++
          console.log('Retrying in 1s...')
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }
    }
  }

  const invalidOutputRate = telemetry.totalCalls > 0 
    ? (telemetry.invalidSchemaCount / telemetry.totalCalls) * 100 
    : 0

  console.log('\n==================================================')
  console.log('               Telemetry Summary                  ')
  console.log('==================================================')
  console.log(`Model ID Used:         ${modelId}`)
  console.log(`Total Calls Made:      ${telemetry.totalCalls}`)
  console.log(`Retries Executed:      ${telemetry.retryCount}`)
  console.log(`Provider Errors:       ${telemetry.providerErrorsCount}`)
  console.log(`Invalid Schema Count:  ${telemetry.invalidSchemaCount}`)
  console.log(`Invalid Output Rate:   ${invalidOutputRate.toFixed(2)}%`)
  console.log(`Total Prompt Tokens:   ${telemetry.tokenUsage.promptTokens}`)
  console.log(`Total Compl. Tokens:   ${telemetry.tokenUsage.completionTokens}`)
  console.log(`Total Cumulative Tok:  ${telemetry.tokenUsage.totalTokens}`)
  console.log(`Total Cost Estimation: $${telemetry.costEstimation.toFixed(6)}`)
  console.log('==================================================')
}

runSmokeTest()
