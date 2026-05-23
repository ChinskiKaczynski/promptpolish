import { describe, expect, it, vi, beforeEach } from 'vitest'

// 1. Mock server-only since it doesn't resolve in Node/Vitest
vi.mock('server-only', () => ({}))

// 2. Mock individual layers to control execution flows
vi.mock('@/lib/identity/anonymous', () => ({
  resolveOrCreateOwnerId: vi.fn()
}))

vi.mock('@/lib/supabase/queries', () => ({
  getModelProfileBySlug: vi.fn(),
  createPromptAnalysis: vi.fn(),
  createUsageEvent: vi.fn()
}))

// checkAnonymousLimit is the route's direct rate-limit dependency
vi.mock('@/lib/rate-limit/check-limit', () => ({
  checkAnonymousLimit: vi.fn()
}))

vi.mock('@/lib/ai/analyze-prompt', () => ({
  analyzePrompt: vi.fn()
}))

// Import dependencies and route handler
import { POST } from '@/app/api/analyze/route'
import { resolveOrCreateOwnerId } from '@/lib/identity/anonymous'
import {
  getModelProfileBySlug,
  createPromptAnalysis,
  createUsageEvent
} from '@/lib/supabase/queries'
import { checkAnonymousLimit } from '@/lib/rate-limit/check-limit'
import { analyzePrompt } from '@/lib/ai/analyze-prompt'
import { ProviderError } from '@/lib/ai/provider-errors'
import { serverEnv } from '@/lib/env/server'
import type { ModelProfileRow, PromptAnalysisRow } from '@/lib/supabase/types'
import type { AnalysisServiceResult } from '@/lib/ai/analyze-prompt'

describe('POST /api/analyze API Route Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock implementation setup
    vi.mocked(resolveOrCreateOwnerId).mockResolvedValue({ id: 'mocked-owner-id', isNew: false })
    // Default: limit not reached
    vi.mocked(checkAnonymousLimit).mockResolvedValue({ allowed: true, count: 0, limit: serverEnv.ANONYMOUS_DAILY_LIMIT })
    vi.mocked(getModelProfileBySlug).mockResolvedValue({
      id: 'profile-uuid',
      slug: 'google-gemini-3-5-flash',
      display_name: 'Gemini 3.5 Flash',
      provider: 'google',
      model_family: 'gemini',
      profile_type: 'provider_model',
      source_type: 'internal',
      verification_status: 'verified',
      confidence_level: 'high',
      stale_after_days: 30,
      capabilities_json: {},
      prompting_recommendations_json: {},
      known_limitations_json: {},
      profile_version: '1.0.0',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as unknown as ModelProfileRow)
  })

  // Helper to create a request
  const makeRequest = (body: Record<string, unknown>) => {
    return new Request('http://localhost/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  }

  const validPayload = {
    input_prompt: 'To jest w pełni poprawny prompt o minimalnej długości dwudziestu znaków potrzebny do pomyślnego przejścia walidacji.',
    working_language: 'pl' as const,
    selected_profile_slug: 'google-gemini-3-5-flash' as const
  }

  describe('Request Schema & Validation Checks', () => {
    it('returns 400 Bad Request when request body is empty or invalid JSON', async () => {
      const request = new Request('http://localhost/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json'
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('invalid_input')
    })

    it('returns 400 Bad Request when mandatory fields are missing', async () => {
      const payload = { working_language: 'pl' }
      const response = await POST(makeRequest(payload as unknown as Record<string, unknown>))
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('invalid_input')
    })

    it('returns 400 Bad Request when input prompt is below MIN_PROMPT_CHARS (20)', async () => {
      const payload = {
        ...validPayload,
        input_prompt: 'Too short'
      }
      const response = await POST(makeRequest(payload))
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('invalid_input')
      expect(data.message).toContain('za krótki')
    })

    it('returns 413 Payload Too Large when input prompt exceeds MAX_PROMPT_CHARS (12000)', async () => {
      const longPrompt = 'a'.repeat(serverEnv.MAX_PROMPT_CHARS + 1)
      const payload = {
        ...validPayload,
        input_prompt: longPrompt
      }
      const response = await POST(makeRequest(payload))
      const data = await response.json()

      expect(response.status).toBe(413)
      expect(data.error).toBe('prompt_too_long')
      expect(data.message).toContain('Przekroczono maksymalną długość')
    })
  })

  describe('Sensitive Data Mitigation Preflight', () => {
    it('blocks high-risk sensitive data, records blocked usage event, and returns 422 without saving prompt', async () => {
      // Prompt containing OpenAI API key pattern which flags high-risk
      const sensitivePayload = {
        ...validPayload,
        input_prompt: 'Mój tajny klucz to: sk-abcdefghijklmnop1234567890abcdefghijklmnop'
      }

      const response = await POST(makeRequest(sensitivePayload))
      const data = await response.json()

      expect(response.status).toBe(422)
      expect(data.error).toBe('high_risk_sensitive_data_detected')
      expect(data.findings).toBeDefined()
      expect(data.findings.length).toBeGreaterThan(0)

      // Verification: Check usage_event was stored with 'sensitive_data_blocked' type
      expect(createUsageEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          owner_anonymous_id: 'mocked-owner-id',
          event_type: 'sensitive_data_blocked'
        })
      )

      // Verification: Standard flows are NOT called
      expect(analyzePrompt).not.toHaveBeenCalled()
      expect(createPromptAnalysis).not.toHaveBeenCalled()
    })
  })

  describe('Usage Rate Limits Check', () => {
    it('returns 429 Too Many Requests when daily anonymous limits are reached and saves a limit_reached event', async () => {
      vi.mocked(checkAnonymousLimit).mockResolvedValue({
        allowed: false,
        count: serverEnv.ANONYMOUS_DAILY_LIMIT,
        limit: serverEnv.ANONYMOUS_DAILY_LIMIT
      })

      const response = await POST(makeRequest(validPayload))
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toBe('limit_reached')
      expect(data.message).toContain('Przekroczono dzienny limit')
      expect(analyzePrompt).not.toHaveBeenCalled()

      // checkAnonymousLimit is called with the verified owner id;
      // ip/ua hashes are null in this headerless test environment (correct — no headers sent)
      expect(checkAnonymousLimit).toHaveBeenCalledWith(
        'mocked-owner-id',
        null, // no x-forwarded-for / x-real-ip header in test request
        null  // no user-agent header in test request
      )
    })
  })

  describe('Model Profile Availability', () => {
    it('returns 404 Not Found when selected model profile slug is missing from database', async () => {
      vi.mocked(getModelProfileBySlug).mockResolvedValue(null)

      const response = await POST(makeRequest(validPayload))
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('model_profile_unavailable')
      expect(data.message).toContain('Wybrany profil modelu')
      expect(analyzePrompt).not.toHaveBeenCalled()
    })
  })

  describe('Provider Failures & Error Mapping', () => {
    it('maps transient provider rate limits (429) to 503 Service Unavailable', async () => {
      const error = new ProviderError(
        'Throttled',
        'Our prompt analysis engine is currently handling high volume.',
        null,
        429
      )
      vi.mocked(analyzePrompt).mockRejectedValue(error)

      const response = await POST(makeRequest(validPayload))
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe('provider_unavailable')
      expect(data.message).toBe(error.userMessage)
    })

    it('maps non-transient provider failures (400) to 502 Bad Gateway', async () => {
      const error = new ProviderError(
        'Bad Request',
        'Our prompt analysis engine encountered an error.',
        null,
        400
      )
      vi.mocked(analyzePrompt).mockRejectedValue(error)

      const response = await POST(makeRequest(validPayload))
      const data = await response.json()

      expect(response.status).toBe(502)
      expect(data.error).toBe('provider_error')
      expect(data.message).toBe(error.userMessage)
    })

    it('returns 500 Internal Error when unexpected generic throw occurs', async () => {
      vi.mocked(analyzePrompt).mockRejectedValue(new Error('Unexpected system collapse'))

      const response = await POST(makeRequest(validPayload))
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('internal_error')
    })
  })

  describe('Successful Request Path', () => {
    it('executes analysis, calculates score, persists records, and returns full successful payload', async () => {
      const mockResult = {
        analysis: {
          overall_summary: 'Prompt jest poprawny.',
          detected_task_type: 'General',
          criteria_scores: [
            { criterion: 'goal_clarity', raw_score_0_10: 8, rationale: 'Ok', improvement_suggestion: 'None' }
          ],
          top_weaknesses: [],
          improvement_plan: [],
          improved_prompt: 'Improved polished prompt',
          change_explanations: ['Explanations']
        },
        scores: {
          overallScore: 85,
          scoreLevel: 'strong'
        }
      }

      vi.mocked(analyzePrompt).mockResolvedValue(mockResult as unknown as AnalysisServiceResult)
      vi.mocked(createPromptAnalysis).mockResolvedValue({
        id: 'new-analysis-uuid',
        overall_score: 85,
        score_level: 'strong'
      } as unknown as PromptAnalysisRow)

      const response = await POST(makeRequest(validPayload))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe('new-analysis-uuid')
      expect(data.overall_score).toBe(85)
      expect(data.score_level).toBe('strong')
      expect(data.improved_prompt).toBe('Improved polished prompt')
      expect(data.change_explanations).toEqual(['Explanations'])
      expect(data.analysis).toEqual(mockResult.analysis)
      expect(data.sensitive_data).toBeDefined()

      // Verification: Check all database persistence was invoked correctly
      expect(analyzePrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          inputPrompt: validPayload.input_prompt,
          workingLanguage: validPayload.working_language,
          selectedProfileSlug: validPayload.selected_profile_slug
        }),
        expect.objectContaining({ mockMode: true })
      )

      expect(createPromptAnalysis).toHaveBeenCalled()
      expect(createUsageEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          owner_anonymous_id: 'mocked-owner-id',
          event_type: 'analyze'
        })
      )
    })
  })
})
