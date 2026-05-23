import { NextResponse } from 'next/server'
import { z } from 'zod'
import { detectSensitiveData } from '@/lib/privacy/sensitive-data-detector'
import { resolveOrCreateOwnerId } from '@/lib/identity/anonymous'
import {
  createPromptAnalysis,
  createUsageEvent,
  getModelProfileBySlug
} from '@/lib/supabase/queries'
import { analyzePrompt } from '@/lib/ai/analyze-prompt'
import { ProviderError } from '@/lib/ai/provider-errors'
import { serverEnv } from '@/lib/env/server'
import { checkAnonymousLimit } from '@/lib/rate-limit/check-limit'
import { hashValue } from '@/lib/rate-limit/hash-ip'

// Input validation schema using Zod
const analyzeRequestSchema = z.object({
  input_prompt: z.string(),
  working_language: z.enum(['pl', 'en']),
  selected_profile_slug: z.enum(['general-llm', 'google-gemini-3-5-flash']),
  task_goal: z.string().max(2000).optional().nullable(),
  task_type: z.string().max(200).optional().nullable(),
  expected_output_format: z.string().max(1000).optional().nullable(),
  constraints: z.string().max(2000).optional().nullable()
})

export async function POST(request: Request) {
  try {
    // 1. Validate request syntax and structure with Zod
    const body = await request.json().catch(() => null)
    const parsed = analyzeRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'invalid_input',
          message: 'Invalid request payload structure or data types.',
          details: parsed.error.flatten()
        },
        { status: 400 }
      )
    }

    const {
      input_prompt,
      working_language,
      selected_profile_slug,
      task_goal,
      task_type,
      expected_output_format,
      constraints
    } = parsed.data

    // 2. Resolve owner_anonymous_id server-side from signed HTTP cookie (do not trust request body)
    const { id: ownerAnonymousId } = await resolveOrCreateOwnerId()

    // 2a. Hash IP and User-Agent server-side for abuse telemetry.
    //     Raw values are never stored — only SHA-256 hashes salted with APP_URL.
    //     Headers may be absent (null) — we never fabricate values.
    const rawIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? request.headers.get('x-real-ip')
      ?? null
    const rawUa = request.headers.get('user-agent') ?? null
    const ipHash = rawIp ? hashValue(rawIp) : null
    const userAgentHash = rawUa ? hashValue(rawUa) : null

    // 3. Run sensitive-data detection server-side
    const detection = detectSensitiveData(input_prompt)

    // 4. If high-risk secret is detected, block and do not save raw prompt
    if (detection.riskLevel === 'high' && serverEnv.SENSITIVE_DATA_BLOCK_HIGH_RISK) {
      // Record a sensitive data blocked telemetry usage event without saving the raw prompt
      await createUsageEvent({
        owner_anonymous_id: ownerAnonymousId,
        event_type: 'sensitive_data_blocked',
        metadata_json: {
          selected_profile_slug,
          working_language,
          findings: detection.findings.map(f => ({
            type: f.type,
            riskLevel: f.riskLevel,
            message: f.message,
            redactedValue: f.redactedValue
          }))
        },
        ip_hash: ipHash,
        user_agent_hash: userAgentHash
      })

      // Exclude prompt value from logs for privacy
      console.warn('[Sensitive Data Blocked]: High-risk credentials detected in input prompt.')

      return NextResponse.json(
        {
          error: 'high_risk_sensitive_data_detected',
          message: 'Wykryto poufne dane wysokiego ryzyka (np. klucze API). Usuń je przed kontynuowaniem.',
          findings: detection.findings
        },
        { status: 422 }
      )
    }

    // 5. Validate prompt min/max character lengths
    if (input_prompt.length < serverEnv.MIN_PROMPT_CHARS) {
      return NextResponse.json(
        {
          error: 'invalid_input',
          message: `Wprowadzony prompt jest za krótki. Minimalna długość to ${serverEnv.MIN_PROMPT_CHARS} znaków.`
        },
        { status: 400 }
      )
    }

    if (input_prompt.length > serverEnv.MAX_PROMPT_CHARS) {
      return NextResponse.json(
        {
          error: 'prompt_too_long',
          message: `Przekroczono maksymalną długość promptu (${serverEnv.MAX_PROMPT_CHARS} znaków).`
        },
        { status: 413 }
      )
    }

    // 6. Check daily anonymous usage limits.
    //    checkAnonymousLimit also saves a limit_reached event when blocked.
    const limitCheck = await checkAnonymousLimit(ownerAnonymousId, ipHash, userAgentHash)
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: 'limit_reached',
          message: 'Przekroczono dzienny limit analiz dla użytkownika anonimowego. Spróbuj ponownie jutro.',
          limit: limitCheck.limit
        },
        { status: 429 }
      )
    }

    // 7. Load selected model profile from database
    const dbProfile = await getModelProfileBySlug(selected_profile_slug)
    if (!dbProfile) {
      return NextResponse.json(
        {
          error: 'model_profile_unavailable',
          message: `Wybrany profil modelu (${selected_profile_slug}) jest niedostępny.`
        },
        { status: 404 }
      )
    }

    // 8-12. Build prompt, call Gemini, validate response, and calculate weighted score
    const isMockMode = process.env.GEMINI_MOCK_MODE === 'true' || process.env.NODE_ENV === 'test'
    
    const analysisResult = await analyzePrompt(
      {
        inputPrompt: input_prompt,
        workingLanguage: working_language,
        selectedProfileSlug: selected_profile_slug,
        taskGoal: task_goal || null,
        taskType: task_type || null,
        expectedOutputFormat: expected_output_format || null,
        constraints: constraints || null
      },
      {
        mockMode: isMockMode
      }
    )

    // 13. Save prompt_analyses record to database
    const createdRecord = await createPromptAnalysis({
      owner_anonymous_id: ownerAnonymousId,
      input_prompt,
      working_language,
      selected_profile_slug,
      task_goal: task_goal || null,
      task_type: task_type || null,
      expected_output_format: expected_output_format || null,
      constraints: constraints || null,
      sensitive_data_risk_level: detection.riskLevel as 'none' | 'low' | 'medium' | 'high',
      sensitive_data_findings_json: detection.findings,
      overall_score: analysisResult.scores.overallScore,
      score_level: analysisResult.scores.scoreLevel as 'weak' | 'needs_work' | 'decent' | 'strong' | 'excellent',
      analysis_json: analysisResult.analysis,
      improved_prompt: analysisResult.analysis.improved_prompt,
      model_id_used: process.env.GEMINI_MODEL_ID || 'gemini-3.5-flash',
      provider_used: dbProfile.provider,
      analysis_schema_version: process.env.ANALYSIS_SCHEMA_VERSION || '1.0.0',
      scoring_version: process.env.SCORING_VERSION || '1.0.0',
      model_profile_version: dbProfile.profile_version || '1.0.0',
      prompt_template_version: process.env.PROMPT_TEMPLATE_VERSION || '1.0.0'
    })

    if (!createdRecord) {
      return NextResponse.json(
        {
          error: 'database_error',
          message: 'Błąd podczas zapisywania analizy w bazie danych.'
        },
        { status: 500 }
      )
    }

    // 14. Save successful usage_event record
    await createUsageEvent({
      owner_anonymous_id: ownerAnonymousId,
      event_type: 'analyze',
      metadata_json: {
        analysis_id: createdRecord.id,
        selected_profile_slug,
        working_language
      },
      ip_hash: ipHash,
      user_agent_hash: userAgentHash
    })

    // 15. Return analysis ID and result payload safely
    return NextResponse.json({
      id: createdRecord.id,
      overall_score: createdRecord.overall_score,
      score_level: createdRecord.score_level,
      criteria_scores: analysisResult.analysis.criteria_scores,
      improved_prompt: analysisResult.analysis.improved_prompt,
      change_explanations: analysisResult.analysis.change_explanations,
      analysis: analysisResult.analysis,
      sensitive_data: detection
    })

  } catch (error) {
    // Graceful error boundaries and standardized provider error recovery
    if (error instanceof ProviderError) {
      const isTransient = error.statusCode === 429 || error.statusCode === 503
      const status = isTransient ? 503 : 502
      return NextResponse.json(
        {
          error: isTransient ? 'provider_unavailable' : 'provider_error',
          message: error.userMessage,
          details: error.message
        },
        { status }
      )
    }

    console.error('[POST /api/analyze Error]:', error)
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'Wystąpił nieoczekiwany błąd serwera. Spróbuj ponownie później.'
      },
      { status: 500 }
    )
  }
}
