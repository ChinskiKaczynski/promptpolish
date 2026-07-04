import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { POST } from '@/app/api/analyze/route'
import path from 'path'
import fs from 'fs'

// Load environment variables from .env.local manually
function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
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
        if (process.env[key] === undefined) {
          process.env[key] = val
        }
      }
    }
  }
}

loadEnvLocal()

import { enforceLiveAiGuards } from './live-guard'

// Enforce Guards
enforceLiveAiGuards()

// Mock analyzePrompt to bypass Route Handler's default test-mocking in Vitest environment
vi.mock('@/lib/ai/analyze-prompt', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/ai/analyze-prompt')>()
  return {
    ...original,
    analyzePrompt: vi.fn().mockImplementation((params, options) => {
      return original.analyzePrompt(params, { ...options, mockMode: false })
    })
  }
})

// Mock Supabase queries to isolate database access
const mockAnalyses: Record<string, unknown>[] = []
const mockUsageEvents: Record<string, unknown>[] = []

vi.mock('@/lib/supabase/queries', () => ({
  getModelProfileBySlug: vi.fn().mockResolvedValue({
    id: 'profile-uuid',
    slug: 'general-llm',
    display_name: 'DeepSeek v4 Flash Profile',
    provider: 'openrouter',
    capabilities_json: {
      model_id: 'gemini-2.5-flash',
      temperature: 0.1,
      max_tokens: 4000
    },
    profile_version: '1.0.0',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }),
  createPromptAnalysis: vi.fn().mockImplementation(async (analysis) => {
    const record = { ...analysis, id: 'analysis-uuid-' + Math.random() }
    mockAnalyses.push(record)
    return record
  }),
  createUsageEvent: vi.fn().mockImplementation(async (event) => {
    mockUsageEvents.push(event)
    return event
  }),
  acquireReservation: vi.fn().mockResolvedValue('success:reserved'),
  completeReservation: vi.fn().mockResolvedValue(true),
  releaseReservation: vi.fn().mockResolvedValue(true)
}))

vi.mock('@/lib/identity/anonymous', () => ({
  resolveOrCreateOwnerId: vi.fn().mockResolvedValue({ id: '00000000-0000-4000-a000-000000000001', isNew: false })
}))

vi.mock('@/lib/identity/auth', () => ({
  getAuthUser: vi.fn().mockResolvedValue(null)
}))

// Mock generateText to fail on deepseek and succeed by executing the real call on gpt-4o-mini (fallback)
vi.mock('ai', async (importOriginal) => {
  const original = await importOriginal<typeof import('ai')>()
  return {
    ...original,
    generateText: vi.fn().mockImplementation(async (options: unknown) => {
      const opts = options as { model: { modelId: string } }
      const modelId = opts.model.modelId
      if (modelId === 'gemini-2.5-flash') {
        console.log(`[Live Check] Simulating primary model failure for: ${modelId}`)
        throw new Error('PROVIDER_TIMEOUT: Request aborted after 55000ms')
      }
      console.log(`[Live Check] Routing request to real OpenRouter fallback: ${modelId}`)
      return original.generateText(options as Parameters<typeof original.generateText>[0])
    })
  }
})

describe('Live Route Handler Fallback Verification', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    mockAnalyses.length = 0
    mockUsageEvents.length = 0
    process.env = { ...originalEnv } as NodeJS.ProcessEnv
    process.env.AI_MOCK_MODE = 'false'
    process.env.NEXT_PUBLIC_ENABLE_MOCK_RESULT = 'false'
  })

  afterEach(() => {
    process.env = originalEnv
    vi.clearAllMocks()
  })

  it('verifies that Route Handler triggers a real OpenRouter request on fallback and returns successfully', async () => {
    console.log('\n==================================================')
    console.log('LIVE ROUTE HANDLER CHECK')
    console.log('Database: MOCKED / ISOLATED')
    console.log('Next.js Server: NOT STARTED (Route Handler POST imported directly)')
    console.log('API call: primary DeepSeek is mocked to fail, fallback GPT-4o-mini is LIVE')
    console.log('==================================================\n')

    const req = new Request('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.1'
      },
      body: JSON.stringify({
        input_prompt: 'Polished marketing email for organic coffee. Short and catchy.',
        working_language: 'en',
        selected_profile_slug: 'general-llm',
        audit_mode: 'marketing_sales'
      })
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    const data = await res.json()
    console.log('[Live Check] Route response status:', res.status)
    console.log('[Live Check] Analysis ID:', data.id)
    console.log('[Live Check] Selected Fallback Model:', mockAnalyses[0].model_id_used)

    // Ensure the fallback model was actually used in the database save
    expect(mockAnalyses.length).toBe(1)
    expect(mockAnalyses[0].model_id_used).toBe(process.env.OPENROUTER_FALLBACK_MODEL_ID)

    // Verify usage events
    const completedEvent = mockUsageEvents.find(e => e.event_type === 'analysis_completed')
    expect(completedEvent).toBeDefined()
    const metadata = completedEvent?.metadata_json as Record<string, unknown> | undefined
    expect(metadata?.fallback_used).toBe(true)
    expect(metadata?.attempt_number).toBe(2)
  }, 60000)
})
