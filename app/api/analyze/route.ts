import { NextResponse } from 'next/server'
import { z } from 'zod'
import { detectSensitiveData } from '@/lib/privacy/sensitive-data-detector'
import { resolveOrCreateOwnerId } from '@/lib/identity/anonymous'
import { getAuthUser } from '@/lib/identity/auth'
import {
  createPromptAnalysis,
  createUsageEvent,
  getModelProfileBySlug,
  getUserProfile,
  getUsageCountTodayForUser,
  getUsageCountThisMonthForUser
} from '@/lib/supabase/queries'
import { analyzePrompt } from '@/lib/ai/analyze-prompt'
import { ProviderError } from '@/lib/ai/provider-errors'
import { recordProviderError } from '@/lib/monitoring/observability'
import { serverEnv, checkProductionEnv } from '@/lib/env/server'
import { hashValue } from '@/lib/rate-limit/hash-ip'
import { PLAN_LIMITS, canAnalyzePrompt } from '@/lib/plans/config'


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
  let selectedProfileSlug: string | undefined
  let workingLanguage: 'pl' | 'en' | undefined

  try {
    // 0. Ensure production environment is correctly configured
    const envCheck = checkProductionEnv()
    if (!envCheck.valid) {
      return NextResponse.json(
        {
          error: 'configuration_error',
          message: envCheck.error
        },
        { status: 500 }
      )
    }

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

    selectedProfileSlug = selected_profile_slug
    workingLanguage = working_language

    // 2. Resolve owner_anonymous_id and authenticated user server-side (do not trust request body)
    const { id: ownerAnonymousId } = await resolveOrCreateOwnerId()
    const user = await getAuthUser()
    const userId = user?.id || null

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
        user_id: userId,
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

    // 6. Check plan-based daily abuse and monthly usage limits.
    let planSlug: 'free' | 'pro' = 'free'
    if (userId) {
      const profile = await getUserProfile(userId)
      if (profile?.plan_slug === 'pro') {
        planSlug = 'pro'
      }
    }

    const dailyCount = await getUsageCountTodayForUser(ownerAnonymousId, userId)
    const monthlyCount = await getUsageCountThisMonthForUser(ownerAnonymousId, userId)

    const planConfig = PLAN_LIMITS[planSlug]
    const limitCheck = canAnalyzePrompt(planSlug, monthlyCount, dailyCount)

    if (!limitCheck.allowed) {
      await createUsageEvent({
        owner_anonymous_id: ownerAnonymousId,
        user_id: userId,
        event_type: 'limit_reached',
        metadata_json: {
          plan: planSlug,
          dailyCount,
          monthlyCount,
          reason: limitCheck.reason,
          limit: limitCheck.limit
        },
        ip_hash: ipHash,
        user_agent_hash: userAgentHash
      })

      if (limitCheck.reason === 'daily_abuse_limit_reached') {
        return NextResponse.json(
          {
            error: 'limit_reached',
            message: `Przekroczono dzienny limit analiz (${limitCheck.limit}) dla planu ${planConfig.name}. Spróbuj ponownie jutro.`,
            limit: limitCheck.limit,
            reason: 'daily_abuse_limit_reached'
          },
          { status: 429 }
        )
      } else {
        return NextResponse.json(
          {
            error: 'monthly_limit_reached',
            message: `Przekroczono miesięczny limit analiz (${limitCheck.limit}) dla planu ${planConfig.name}. Rozszerz plan do Pro, aby uzyskać większe limity.`,
            limit: limitCheck.limit,
            reason: 'monthly_limit_reached'
          },
          { status: 402 }
        )
      }
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
      user_id: userId,
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
    const promptTokens = analysisResult.usage?.promptTokens || 0
    const completionTokens = analysisResult.usage?.completionTokens || 0
    const totalTokens = analysisResult.usage?.totalTokens || 0
    const calculatedCost = (promptTokens * 0.075 + completionTokens * 0.30) / 1000000

    await createUsageEvent({
      owner_anonymous_id: ownerAnonymousId,
      user_id: userId,
      event_type: 'analyze',
      metadata_json: {
        analysis_id: createdRecord.id,
        selected_profile_slug,
        working_language,
        token_usage: analysisResult.usage ? {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: totalTokens
        } : null,
        cost_estimate: analysisResult.usage ? calculatedCost : null
      },
      ip_hash: ipHash,
      user_agent_hash: userAgentHash
    })

    // 14a. Save analysis_completed usage_event record
    await createUsageEvent({
      owner_anonymous_id: ownerAnonymousId,
      user_id: userId,
      event_type: 'analysis_completed',
      metadata_json: {
        analysis_id: createdRecord.id,
        selected_profile_slug,
        working_language,
        token_usage: analysisResult.usage ? {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: totalTokens
        } : null,
        cost_estimate: analysisResult.usage ? calculatedCost : null
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
    // Invoke provider error monitoring hook
    recordProviderError(error, {
      selected_profile_slug: selectedProfileSlug,
      working_language: workingLanguage
    })

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
