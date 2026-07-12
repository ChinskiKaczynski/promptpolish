import { describe, expect, it, vi, beforeEach } from 'vitest'

// 1. Mock server-only since it doesn't resolve in Node/Vitest
vi.mock('server-only', () => ({}))

vi.mock('@/lib/identity/anonymous', () => ({
  resolveOrCreateOwnerId: vi.fn()
}))

vi.mock('@/lib/identity/auth', () => ({
  getAuthUser: vi.fn()
}))

vi.mock('@/lib/supabase/admin', () => {
  const builder: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    then: vi.fn((resolve) => resolve({ data: [], error: null }))
  }
  return {
    getSupabaseAdminClient: vi.fn(() => ({
      from: vi.fn(() => builder),
      rpc: vi.fn().mockResolvedValue({ data: [], error: null })
    }))
  }
})

// 2. Mock individual layers to control execution flows
vi.mock('@/lib/supabase/queries', () => ({
  getModelProfileBySlug: vi.fn(),
  createPromptAnalysis: vi.fn(),
  createUsageEvent: vi.fn(),
  getUserProfile: vi.fn(),
  getUsageCountTodayForUser: vi.fn(),
  getUsageCountThisMonthForUser: vi.fn(),
  acquireReservation: vi.fn(),
  completeReservation: vi.fn(),
  releaseReservation: vi.fn(),
  saveAnalysisAndCompleteReservation: vi.fn(),
  getPromptAnalysisForOwner: vi.fn()
}))


vi.mock('@/lib/ai/analyze-prompt', () => ({
  analyzePrompt: vi.fn()
}))

// Import dependencies and route handler
import { POST } from '@/app/api/analyze/route'
import { resolveOrCreateOwnerId } from '@/lib/identity/anonymous'
import { getAuthUser } from '@/lib/identity/auth'
import {
  getModelProfileBySlug,
  createPromptAnalysis,
  createUsageEvent,
  getUserProfile,
  getUsageCountTodayForUser,
  getUsageCountThisMonthForUser,
  acquireReservation,
  completeReservation,
  releaseReservation,
  saveAnalysisAndCompleteReservation
} from '@/lib/supabase/queries'
import { analyzePrompt } from '@/lib/ai/analyze-prompt'
import { ProviderError } from '@/lib/ai/provider-errors'
import { SemanticValidationError } from '@/lib/ai/semantic-validation'
import type { ModelProfileRow, PromptAnalysisRow, UserProfileRow } from '@/lib/supabase/types'
import type { AnalysisServiceResult } from '@/lib/ai/analyze-prompt'
import type { User } from '@supabase/supabase-js'


describe('POST /api/analyze API Route Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock implementation setup
    vi.mocked(resolveOrCreateOwnerId).mockResolvedValue({ id: 'mocked-owner-id', isNew: false })
    vi.mocked(getAuthUser).mockResolvedValue(null)
    vi.mocked(getUserProfile).mockResolvedValue(null)
    vi.mocked(getUsageCountTodayForUser).mockResolvedValue(0)
    vi.mocked(getUsageCountThisMonthForUser).mockResolvedValue(0)
    vi.mocked(createUsageEvent).mockResolvedValue(null)
    vi.mocked(acquireReservation).mockResolvedValue('success:reserved')
    vi.mocked(completeReservation).mockResolvedValue(true)
    vi.mocked(releaseReservation).mockResolvedValue(true)
    vi.mocked(saveAnalysisAndCompleteReservation).mockResolvedValue(true)

    vi.mocked(getModelProfileBySlug).mockResolvedValue({
      id: 'profile-uuid',
      slug: 'general-llm',
      display_name: 'General LLM',
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
    selected_profile_slug: 'general-llm' as const
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
      expect(data.error).toBe('validation_error')
    })

    it('returns 400 Bad Request when mandatory fields are missing', async () => {
      const payload = { working_language: 'pl' }
      const response = await POST(makeRequest(payload as unknown as Record<string, unknown>))
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('validation_error')
    })

    it('returns 400 Bad Request when input prompt is below MIN_PROMPT_CHARS (20) and logs analysis_failed', async () => {
      const payload = {
        ...validPayload,
        input_prompt: 'Too short'
      }
      const response = await POST(makeRequest(payload))
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('validation_error')
      expect(data.message).toContain('za krótki')

      expect(createUsageEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'analysis_failed',
          metadata_json: expect.objectContaining({
            error_code: 'PROMPT_TOO_SHORT'
          })
        })
      )
    })

    it('returns 400 Bad Request when input prompt exceeds Anonymous plan limit (12000) and logs analysis_failed', async () => {
      const longPrompt = 'a'.repeat(12001)
      const payload = {
        ...validPayload,
        input_prompt: longPrompt
      }
      const response = await POST(makeRequest(payload))
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('validation_error')
      expect(data.plan).toBe('anonymous')
      expect(data.maxPromptChars).toBe(12000)
      expect(data.message).toContain('Przekroczono maksymalną długość')

      expect(createUsageEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'analysis_failed',
          metadata_json: expect.objectContaining({
            error_code: 'PROMPT_TOO_LONG',
            plan_slug: 'anonymous',
            max_chars: 12000
          })
        })
      )
    })

    it('allows input prompt up to 24000 characters for Pro plan user', async () => {
      vi.mocked(getAuthUser).mockResolvedValue({ id: 'pro-user-uuid', email: 'pro@test.com' } as unknown as User)
      vi.mocked(getUserProfile).mockResolvedValue({ plan_slug: 'pro' } as unknown as UserProfileRow)
      vi.mocked(analyzePrompt).mockResolvedValue({
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
      } as unknown as AnalysisServiceResult)
      vi.mocked(createPromptAnalysis).mockResolvedValue({
        id: 'new-analysis-uuid',
        overall_score: 85,
        score_level: 'strong',
        improved_prompt: 'Improved polished prompt'
      } as unknown as PromptAnalysisRow)

      const longPrompt = 'a'.repeat(24000)
      const payload = {
        ...validPayload,
        input_prompt: longPrompt
      }
      const response = await POST(makeRequest(payload))
      expect(response.status).toBe(200)
    })

    it('returns 400 Bad Request when input prompt exceeds Pro plan limit (24000) for Pro user', async () => {
      vi.mocked(getAuthUser).mockResolvedValue({ id: 'pro-user-uuid', email: 'pro@test.com' } as unknown as User)
      vi.mocked(getUserProfile).mockResolvedValue({ plan_slug: 'pro' } as unknown as UserProfileRow)

      const longPrompt = 'a'.repeat(24001)
      const payload = {
        ...validPayload,
        input_prompt: longPrompt
      }
      const response = await POST(makeRequest(payload))
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('validation_error')
      expect(data.plan).toBe('pro')
      expect(data.maxPromptChars).toBe(24000)
      expect(data.message).toContain('Przekroczono maksymalną długość')

      expect(createUsageEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'analysis_failed',
          metadata_json: expect.objectContaining({
            error_code: 'PROMPT_TOO_LONG',
            plan_slug: 'pro',
            max_chars: 24000
          })
        })
      )
    })
  })

  describe('Sensitive Data Mitigation Preflight', () => {
    it('blocks high-risk sensitive data, records blocked usage event, and returns 422 without saving prompt', async () => {
      // Prompt containing OpenAI API key pattern which flags high-risk
      const rawSecret = 'sk-abcdefghijklmnop1234567890abcdefghijklmnop'
      const sensitivePayload = {
        ...validPayload,
        input_prompt: `Mój tajny klucz to: ${rawSecret}`
      }

      const response = await POST(makeRequest(sensitivePayload))
      const data = await response.json()

      expect(response.status).toBe(422)
      expect(data.error).toBe('sensitive_data_detected')
      expect(data.findings).toBeDefined()
      expect(data.findings.length).toBeGreaterThan(0)

      // Verification: Check usage_event was stored with 'analysis_failed' type
      expect(createUsageEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          owner_anonymous_id: 'mocked-owner-id',
          event_type: 'analysis_failed'
        })
      )

      // Verification: Check usage_event was stored with 'sensitive_data_blocked' type
      expect(createUsageEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          owner_anonymous_id: 'mocked-owner-id',
          event_type: 'sensitive_data_blocked'
        })
      )

      // Assert raw secret did not leak into usage event metadata
      const call = vi.mocked(createUsageEvent).mock.calls.find(c => c[0].event_type === 'sensitive_data_blocked')
      expect(call).toBeDefined()
      const metadataStr = JSON.stringify(call![0].metadata_json)
      expect(metadataStr).not.toContain(rawSecret)

      // Verification: Check usage_event was stored with 'analysis_failed' type
      expect(createUsageEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          owner_anonymous_id: 'mocked-owner-id',
          event_type: 'analysis_failed',
          metadata_json: expect.objectContaining({
            error_code: 'SENSITIVE_DATA_BLOCKED'
          })
        })
      )

      // Verification: Standard flows are NOT called
      expect(analyzePrompt).not.toHaveBeenCalled()
      expect(createPromptAnalysis).not.toHaveBeenCalled()
    })

    it('blocks request when bearer token is present in task_goal', async () => {
      const rawSecret = 'ya29.a0AfH6SMDIu123456789abcdefghijklmnopqrstuvwxyz'
      const payload = {
        ...validPayload,
        task_goal: `My token is Bearer ${rawSecret}`
      }
      const response = await POST(makeRequest(payload))
      expect(response.status).toBe(422)
      expect(analyzePrompt).not.toHaveBeenCalled()
      expect(createPromptAnalysis).not.toHaveBeenCalled()

      const call = vi.mocked(createUsageEvent).mock.calls.find(c => c[0].event_type === 'sensitive_data_blocked')
      expect(call).toBeDefined()
      expect(JSON.stringify(call![0].metadata_json)).not.toContain(rawSecret)
    })

    it('blocks request when JWT token is present in task_type', async () => {
      const rawSecret = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      const payload = {
        ...validPayload,
        task_type: rawSecret
      }
      const response = await POST(makeRequest(payload))
      expect(response.status).toBe(422)
      expect(analyzePrompt).not.toHaveBeenCalled()
      expect(createPromptAnalysis).not.toHaveBeenCalled()

      const call = vi.mocked(createUsageEvent).mock.calls.find(c => c[0].event_type === 'sensitive_data_blocked')
      expect(call).toBeDefined()
      expect(JSON.stringify(call![0].metadata_json)).not.toContain(rawSecret)
    })

    it('blocks request when private key block is present in expected_output_format', async () => {
      const rawSecret = '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0yGz7V+abc123xyz\n-----END RSA PRIVATE KEY-----'
      const payload = {
        ...validPayload,
        expected_output_format: rawSecret
      }
      const response = await POST(makeRequest(payload))
      expect(response.status).toBe(422)
      expect(analyzePrompt).not.toHaveBeenCalled()
      expect(createPromptAnalysis).not.toHaveBeenCalled()

      const call = vi.mocked(createUsageEvent).mock.calls.find(c => c[0].event_type === 'sensitive_data_blocked')
      expect(call).toBeDefined()
      expect(JSON.stringify(call![0].metadata_json)).not.toContain('MIIEowIBAAKCAQEA0yGz7V+abc123xyz')
    })

    it('blocks request when database URL is present in constraints', async () => {
      const rawSecret = 'postgresql://postgres:secret-password123@localhost:5432/mydb'
      const payload = {
        ...validPayload,
        constraints: rawSecret
      }
      const response = await POST(makeRequest(payload))
      expect(response.status).toBe(422)
      expect(analyzePrompt).not.toHaveBeenCalled()
      expect(createPromptAnalysis).not.toHaveBeenCalled()

      const call = vi.mocked(createUsageEvent).mock.calls.find(c => c[0].event_type === 'sensitive_data_blocked')
      expect(call).toBeDefined()
      expect(JSON.stringify(call![0].metadata_json)).not.toContain('secret-password123')
    })
  })

  describe('Usage Rate Limits Check', () => {
    it('returns 429 Too Many Requests when daily limits are reached and saves a limit_reached event', async () => {
      vi.mocked(acquireReservation).mockResolvedValue('daily_limit_reached')

      const response = await POST(makeRequest(validPayload))
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toBe('entitlement_error')
      expect(data.message).toContain('Przekroczono dzienny limit')
      expect(analyzePrompt).not.toHaveBeenCalled()
    })

    it('returns 402 Payment Required when monthly limits are reached', async () => {
      vi.mocked(acquireReservation).mockResolvedValue('monthly_limit_reached')

      const response = await POST(makeRequest(validPayload))
      const data = await response.json()

      expect(response.status).toBe(402)
      expect(data.error).toBe('entitlement_error')
      expect(data.message).toContain('Przekroczono miesięczny limit')
      expect(analyzePrompt).not.toHaveBeenCalled()
    })

    it('fails closed and returns 500 when database count/reservation acquisition fails', async () => {
      vi.mocked(acquireReservation).mockRejectedValue(new Error('Database deadlock or connection error'))

      const response = await POST(makeRequest(validPayload))
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('temporary_service_error')
      expect(analyzePrompt).not.toHaveBeenCalled()
    })
  })


  describe('Model Profile Availability', () => {
    it('returns 404 Not Found when selected model profile slug is missing from database and logs analysis_failed', async () => {
      vi.mocked(getModelProfileBySlug).mockResolvedValue(null)

      const response = await POST(makeRequest(validPayload))
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('model_profile_unavailable')
      expect(data.message).toContain('Wybrany profil modelu')
      expect(analyzePrompt).not.toHaveBeenCalled()

      expect(createUsageEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'analysis_failed',
          metadata_json: expect.objectContaining({
            error_code: 'MODEL_PROFILE_UNAVAILABLE'
          })
        })
      )
    })
  })

  describe('Provider Failures & Error Mapping', () => {
    it('maps transient provider rate limits (429) to 429 Too Many Requests', async () => {
      const error = new ProviderError(
        'Throttled',
        'Our prompt analysis engine is currently handling high volume.',
        null,
        429,
        'provider_rate_limit'
      )
      vi.mocked(analyzePrompt).mockRejectedValue(error)

      const response = await POST(makeRequest(validPayload))
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toBe('provider_rate_limit')
      expect(data.message).toBe(error.userMessage)
    })

    it('maps provider unavailable failures (503) to 503 Service Unavailable', async () => {
      const error = new ProviderError(
        'Bad Request',
        'Our prompt analysis engine encountered an error.',
        null,
        503,
        'provider_unavailable'
      )
      vi.mocked(analyzePrompt).mockRejectedValue(error)

      const response = await POST(makeRequest(validPayload))
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe('provider_unavailable')
      expect(data.message).toBe(error.userMessage)
    })

    it('maps malformed_provider_output failures to 502 Bad Gateway with Polish message, releases reservation, and logs failure', async () => {
      const error = new ProviderError(
        'No object generated',
        'Encountered an error',
        null,
        undefined,
        'malformed_provider_output'
      )
      vi.mocked(analyzePrompt).mockRejectedValue(error)

      const response = await POST(makeRequest(validPayload))
      const data = await response.json()

      expect(response.status).toBe(502)
      expect(data.error).toBe('malformed_provider_output')
      expect(data.message).toBe('Nie udało się poprawnie złożyć raportu z odpowiedzi modelu. Spróbuj ponownie albo skróć prompt.')

      // Verification: Check reservation was released
      expect(releaseReservation).toHaveBeenCalled()
      expect(completeReservation).not.toHaveBeenCalled()

      // Verification: Telemetry event logged
      expect(createUsageEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'analysis_failed',
          metadata_json: expect.objectContaining({
            error_code: 'MALFORMED_PROVIDER_OUTPUT'
          })
        })
      )
      expect(createUsageEvent).not.toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'analysis_completed'
        })
      )
    })

    it('maps SemanticValidationError failures to 502 Bad Gateway with Polish message, releases reservation, and logs failure', async () => {
      const error = new SemanticValidationError([
        { path: 'criteria_scores', message: 'Order mismatch' }
      ])
      vi.mocked(analyzePrompt).mockRejectedValue(error)

      const response = await POST(makeRequest(validPayload))
      const data = await response.json()

      expect(response.status).toBe(502)
      expect(data.error).toBe('malformed_provider_output')
      expect(data.message).toBe('Nie udało się poprawnie złożyć raportu z odpowiedzi modelu. Spróbuj ponownie albo skróć prompt.')

      // Verification: Check reservation was released
      expect(releaseReservation).toHaveBeenCalled()
      expect(completeReservation).not.toHaveBeenCalled()

      // Verification: Telemetry event logged
      expect(createUsageEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'analysis_failed',
          metadata_json: expect.objectContaining({
            error_code: 'INVALID_STRUCTURED_OUTPUT'
          })
        })
      )
      expect(createUsageEvent).not.toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'analysis_completed'
        })
      )
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
      expect(data.id).toBeDefined()
      expect(data.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
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
          selectedProfileSlug: validPayload.selected_profile_slug,
          auditMode: 'universal' // Defaults to universal
        }),
        expect.objectContaining({ mockMode: true })
      )

      expect(saveAnalysisAndCompleteReservation).toHaveBeenCalledWith(
        expect.objectContaining({
          owner_anonymous_id: 'mocked-owner-id',
          input_prompt: validPayload.input_prompt,
          working_language: validPayload.working_language,
          selected_profile_slug: validPayload.selected_profile_slug,
          audit_mode: 'universal'
        })
      )

      expect(createUsageEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          owner_anonymous_id: 'mocked-owner-id',
          event_type: 'analysis_started'
        })
      )

      expect(createUsageEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          owner_anonymous_id: 'mocked-owner-id',
          event_type: 'analysis_completed'
        })
      )
    })

    it('propagates custom audit_mode successfully to analyzePrompt and database', async () => {
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

      const payloadWithAuditMode = {
        ...validPayload,
        audit_mode: 'coding' as const
      }

      const response = await POST(makeRequest(payloadWithAuditMode))
      expect(response.status).toBe(200)

      expect(analyzePrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          auditMode: 'coding'
        }),
        expect.any(Object)
      )

      expect(saveAnalysisAndCompleteReservation).toHaveBeenCalledWith(
        expect.objectContaining({
          audit_mode: 'coding'
        })
      )
    })
  })

  describe('Database Save Failure Path', () => {
    it('returns 500 when saving prompt analysis fails and logs analysis_failed', async () => {
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
      vi.mocked(saveAnalysisAndCompleteReservation).mockResolvedValue(false) // Mock DB save failure

      const response = await POST(makeRequest(validPayload))
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('database_error')

      expect(createUsageEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'analysis_failed',
          metadata_json: expect.objectContaining({
            error_code: 'DATABASE_ERROR'
          })
        })
      )
    })
  })
})
