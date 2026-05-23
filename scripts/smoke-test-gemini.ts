import fs from 'fs'
import path from 'path'
import { generateText, Output } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'

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

async function runSmokeTest() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  const modelId = process.env.GEMINI_MODEL_ID || 'gemini-1.5-flash'

  console.log('=== Gemini Structured Output Smoke Test ===')
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

  console.log('API Key detected. Initiating live minimal structured output smoke test...')

  try {
    const result = await generateText({
      model: google(modelId),
      output: Output.object({
        schema: z.object({
          recipe: z.object({
            name: z.string(),
            key_ingredient: z.string(),
            prep_time_minutes: z.number()
          })
        })
      }),
      prompt: 'Give me a simple recipe for a cup of black coffee.'
    })

    console.log('\n[SUCCESS] Live Gemini structured output smoke test completed successfully!')
    console.log('Returned Object:', JSON.stringify(result.output, null, 2))
  } catch (error) {
    console.error('\n[FAILURE] Live Gemini structured output smoke test failed!')
    console.error(error)
    process.exit(1)
  }
}

runSmokeTest()
