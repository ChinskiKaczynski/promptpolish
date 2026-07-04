import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import type { User } from '@supabase/supabase-js'
import { z } from 'zod'
import { scanRequestFields } from '@/lib/privacy/sensitive-data-detector'
import { resolveOrCreateOwnerId } from '@/lib/identity/anonymous'
import { getAuthUser } from '@/lib/identity/auth'
import { calculateUsageCost } from '@/lib/ai/pricing'
import {
  createPromptAnalysis,
  createUsageEvent,
  getModelProfileBySlug,
  acquireReservation,
  completeReservation,
  releaseReservation
} from '@/lib/supabase/queries'
import { analyzePrompt } from '@/lib/ai/analyze-prompt'
import { SemanticValidationError } from '@/lib/ai/semantic-validation'
import { ProviderError } from '@/lib/ai/provider-errors'
import { normalizeNewlines } from '@/lib/export/format-analysis'
import { recordProviderError } from '@/lib/monitoring/observability'
import { serverEnv, checkProductionEnv } from '@/lib/env/server'
import { hashValue, getClientIp } from '@/lib/rate-limit/hash-ip'
import { PLAN_LIMITS, getPlanSlugForUser } from '@/lib/plans/config'
import { getOwnerConfiguredModelId } from '@/lib/ai/model-catalog'
export const runtime = "nodejs";
export const maxDuration = 220

/**
 * All values the `acquire_usage_reservation` DB procedure can return.
 * Derived from supabase/migrations/20260612210000_usage_reservations.sql.
 * If a new value is ever added to the procedure, TypeScript will force handling it here.
 */
type ReservationResult =
  | 'success:reserved'
  | 'success:completed'  // idempotent retry — reservation already existed
  | 'daily_limit_reached'
  | 'monthly_limit_reached'

// Input validation schema using Zod.
// input_prompt uses an absolute transport ceiling of 25,000 chars — larger than
// any valid plan limit (Pro: 24,000). Per-plan enforcement happens AFTER identity
// and plan resolution below, so Free/Anonymous are not accidentally granted extra capacity.
const analyzeRequestSchema = z.object({
  input_prompt: z.string().max(25000, 'Prompt exceeds maximum transport length.'),
  working_language: z.enum(['pl', 'en']),
  selected_profile_slug: z.enum(['general-llm']),
  audit_mode: z.enum(['universal', 'seo_content', 'coding', 'data_analysis', 'research', 'marketing_sales', 'agent_workflow']).default('universal'),
  task_goal: z.string().max(2000).optional().nullable(),
  task_type: z.string().max(200).optional().nullable(),
  expected_output_format: z.string().max(1000).optional().nullable(),
  constraints: z.string().max(2000).optional().nullable()
})

export async function POST(request: Request) {
  let selectedProfileSlug: string | undefined
  let workingLanguage: 'pl' | 'en' | undefined
  let ownerAnonymousId: string | null = null
  let userId: string | null = null
  let ipHash: string | null = null
  let userAgentHash: string | null = null
  let requestId: string | undefined
  let reservationAcquired = false

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
          error: 'validation_error',
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
      audit_mode,
      task_goal,
      task_type,
      expected_output_format,
      constraints
    } = parsed.data

    selectedProfileSlug = selected_profile_slug
    workingLanguage = working_language

    // 2. Resolve authenticated user server-side first (do not trust request body)
    let user: User | null = null
    try {
      user = await getAuthUser()
    } catch (err) {
      if (err instanceof Error && err.name === 'TransientAuthError') {
        throw err
      }
      console.error('Non-transient auth error in resolve:', err)
    }

    const resolvedOwner = await resolveOrCreateOwnerId()
    ownerAnonymousId = resolvedOwner.id
    userId = user?.id || null

    // 2a. Hash IP and User-Agent server-side for abuse telemetry.
    //     Raw values are never stored — only SHA-256 hashes salted with APP_URL.
    //     Headers may be absent (null) — we never fabricate values.
    const rawIp = getClientIp(request.headers)
    const rawUa = request.headers.get('user-agent') ?? null
    ipHash = rawIp ? hashValue(rawIp) : null
    userAgentHash = rawUa ? hashValue(rawUa) : null

    // 2b. Resolve plan server-side BEFORE any validation that is plan-dependent.
    //     The client must never supply or override the plan.
    const resolvedPlanSlug = await getPlanSlugForUser(userId)
    const planConfig = PLAN_LIMITS[resolvedPlanSlug]

    // 2c. Validate prompt minimum length
    if (input_prompt.length < serverEnv.MIN_PROMPT_CHARS) {
      await createUsageEvent({
        owner_anonymous_id: ownerAnonymousId,
        user_id: userId,
        event_type: 'analysis_failed',
        metadata_json: {
          profile_slug: selected_profile_slug,
          working_language: working_language,
          error_code: 'PROMPT_TOO_SHORT'
        },
        ip_hash: ipHash,
        user_agent_hash: userAgentHash
      })
      return NextResponse.json(
        {
          error: 'validation_error',
          message: `Wprowadzony prompt jest za krótki. Minimalna długość to ${serverEnv.MIN_PROMPT_CHARS} znaków.`
        },
        { status: 400 }
      )
    }

    // 2d. Validate prompt maximum length using the resolved plan limit.
    //     Pro: 24,000 chars; Free/Anonymous: 12,000 chars.
    //     This runs AFTER plan resolution so Pro is never blocked by a global lower limit.
    if (input_prompt.length > planConfig.maxPromptChars) {
      await createUsageEvent({
        owner_anonymous_id: ownerAnonymousId,
        user_id: userId,
        event_type: 'analysis_failed',
        metadata_json: {
          profile_slug: selected_profile_slug,
          working_language: working_language,
          error_code: 'PROMPT_TOO_LONG',
          plan_slug: resolvedPlanSlug,
          max_chars: planConfig.maxPromptChars
        },
        ip_hash: ipHash,
        user_agent_hash: userAgentHash
      })
      return NextResponse.json(
        {
          error: 'validation_error',
          message: `Przekroczono maksymalną długość promptu dla planu ${planConfig.name} (${planConfig.maxPromptChars} znaków).`,
          plan: resolvedPlanSlug,
          maxPromptChars: planConfig.maxPromptChars
        },
        { status: 400 }
      )
    }

    // 3. Run sensitive-data detection server-side on all user-controlled text fields
    const scanResult = scanRequestFields({
      input_prompt,
      task_goal,
      task_type,
      expected_output_format,
      constraints
    })

    // Log sensitive data warning shown if alert is low or medium risk
    if (scanResult.riskLevel === 'low' || scanResult.riskLevel === 'medium') {
      await createUsageEvent({
        owner_anonymous_id: ownerAnonymousId,
        user_id: userId,
        event_type: 'sensitive_data_warning_shown',
        metadata_json: {
          profile_slug: selected_profile_slug,
          working_language: working_language,
          risk_level: scanResult.riskLevel,
          findings: scanResult.findings
        },
        ip_hash: ipHash,
        user_agent_hash: userAgentHash
      })
    }

    // 4. If high-risk secret is detected, block and do not save raw prompt or other fields
    if (scanResult.riskLevel === 'high' && serverEnv.SENSITIVE_DATA_BLOCK_HIGH_RISK) {
      // Record a sensitive data blocked telemetry usage event without saving the raw prompt
      await createUsageEvent({
        owner_anonymous_id: ownerAnonymousId,
        user_id: userId,
        event_type: 'sensitive_data_blocked',
        metadata_json: {
          profile_slug: selected_profile_slug,
          working_language: working_language,
          risk_level: 'high',
          findings: scanResult.findings
        },
        ip_hash: ipHash,
        user_agent_hash: userAgentHash
      })

      // Record a companion analysis_failed event for correct funnel calculation
      await createUsageEvent({
        owner_anonymous_id: ownerAnonymousId,
        user_id: userId,
        event_type: 'analysis_failed',
        metadata_json: {
          profile_slug: selected_profile_slug,
          working_language: working_language,
          error_code: 'SENSITIVE_DATA_BLOCKED'
        },
        ip_hash: ipHash,
        user_agent_hash: userAgentHash
      })

      // Exclude prompt value from logs for privacy
      console.warn('[Sensitive Data Blocked]: High-risk credentials detected in request fields.')

      return NextResponse.json(
        {
          error: 'sensitive_data_detected',
          message: 'Wykryto poufne dane wysokiego ryzyka (np. klucze API lub hasła). Usuń je przed kontynuowaniem.',
          findings: scanResult.findings
        },
        { status: 422 }
      )
    }

    // 5. (Prompt length is now validated above in step 2c/2d, after plan resolution.)

    // 6. Check plan-based daily abuse and monthly usage limits using atomic reservation ledger.
    requestId = randomUUID()
    let reservationResult: ReservationResult
    try {
      reservationResult = await acquireReservation(requestId, ownerAnonymousId, userId) as ReservationResult
    } catch (dbError) {
      console.error('[POST /api/analyze Reservation DB Error]:', dbError)
      return NextResponse.json(
        {
          error: 'temporary_service_error',
          message: 'Usługa jest tymczasowo niedostępna ze względu na błąd bazy danych. Spróbuj ponownie później.'
        },
        { status: 500 }
      )
    }

    if (reservationResult === 'daily_limit_reached' || reservationResult === 'monthly_limit_reached') {
      const errCode = reservationResult === 'daily_limit_reached' ? 'DAILY_LIMIT_REACHED' : 'MONTHLY_LIMIT_REACHED'
      const planSlug = await getPlanSlugForUser(userId)
      const planConfig = PLAN_LIMITS[planSlug]
      const limitVal = reservationResult === 'daily_limit_reached' ? planConfig.dailyAnalyses : planConfig.monthlyAnalyses

      await createUsageEvent({
        owner_anonymous_id: ownerAnonymousId,
        user_id: userId,
        event_type: 'limit_reached',
        metadata_json: {
          profile_slug: selected_profile_slug,
          working_language: working_language,
          error_code: errCode,
          limit: limitVal
        },
        ip_hash: ipHash,
        user_agent_hash: userAgentHash
      })

      // Companion analysis_failed event for correct funnel telemetry
      await createUsageEvent({
        owner_anonymous_id: ownerAnonymousId,
        user_id: userId,
        event_type: 'analysis_failed',
        metadata_json: {
          profile_slug: selected_profile_slug,
          working_language: working_language,
          error_code: errCode
        },
        ip_hash: ipHash,
        user_agent_hash: userAgentHash
      })

      if (reservationResult === 'daily_limit_reached') {
        return NextResponse.json(
          {
            error: 'entitlement_error',
            message: `Przekroczono dzienny limit analiz (${limitVal}) dla planu ${planConfig.name}. Spróbuj ponownie jutro.`,
            limit: limitVal,
            reason: 'daily_abuse_limit_reached'
          },
          { status: 429 }
        )
      } else {
        return NextResponse.json(
          {
            error: 'entitlement_error',
            message: `Przekroczono miesięczny limit analiz (${limitVal}) dla planu ${planConfig.name}. Rozszerz plan do Pro, aby uzyskać większe limity.`,
            limit: limitVal,
            reason: 'monthly_limit_reached'
          },
          { status: 402 }
        )
      }
    }

    // Exhaustiveness guard: any value from the DB other than the known success variants
    // must never silently fall through as "ok". If the DB procedure gains a new return
    // value (e.g. 'abuse_block'), TypeScript will catch it at compile-time here, and
    // at runtime the check below provides a hard safety net.
    if (reservationResult !== 'success:reserved' && reservationResult !== 'success:completed') {
      // At this point TypeScript knows reservationResult is `never` if the union is
      // exhaustive. If it is somehow NOT never at runtime, it means the DB returned an
      // unknown value — treat that as an internal error, never allow the analysis through.
      const _exhaustiveCheck: never = reservationResult
      console.error('[POST /api/analyze] Unknown reservationResult from DB:', _exhaustiveCheck)
      throw new Error(`Unknown reservationResult from DB: ${String(_exhaustiveCheck)}`)
    }

    // Mark that we have successfully reserved quota for this request
    reservationAcquired = true

    // Log analysis_started only after confirmed quota reservation — prevents bots from
    // generating fake funnel events without consuming a real rate-limit slot.
    await createUsageEvent({
      owner_anonymous_id: ownerAnonymousId,
      user_id: userId,
      event_type: 'analysis_started',
      metadata_json: {
        profile_slug: selected_profile_slug,
        working_language: working_language
      },
      ip_hash: ipHash,
      user_agent_hash: userAgentHash
    })

    // 7. Load selected model profile from database
    const dbProfile = await getModelProfileBySlug(selected_profile_slug)
    if (!dbProfile) {
      await createUsageEvent({
        owner_anonymous_id: ownerAnonymousId,
        user_id: userId,
        event_type: 'analysis_failed',
        metadata_json: {
          profile_slug: selected_profile_slug,
          working_language: working_language,
          error_code: 'MODEL_PROFILE_UNAVAILABLE'
        },
        ip_hash: ipHash,
        user_agent_hash: userAgentHash
      })

      return NextResponse.json(
        {
          error: 'model_profile_unavailable',
          message: `Wybrany profil modelu (${selected_profile_slug}) jest niedostępny.`
        },
        { status: 404 }
      )
    }

    const capabilities = (dbProfile.capabilities_json || {}) as Record<string, unknown>
    const isProfileEnabled = capabilities.enabled !== false
    if (!isProfileEnabled) {
      await createUsageEvent({
        owner_anonymous_id: ownerAnonymousId,
        user_id: userId,
        event_type: 'analysis_failed',
        metadata_json: {
          profile_slug: selected_profile_slug,
          working_language: working_language,
          error_code: 'MODEL_PROFILE_DISABLED'
        },
        ip_hash: ipHash,
        user_agent_hash: userAgentHash
      })

      return NextResponse.json(
        {
          error: 'model_profile_unavailable',
          message: `Wybrany profil modelu (${selected_profile_slug}) jest niedostępny.`
        },
        { status: 404 }
      )
    }

    // 8-12. Build prompt, call Gemini, validate response, and calculate weighted score
    const isMockMode = process.env.AI_MOCK_MODE === 'true' || process.env.NODE_ENV === 'test'

    // AI provider timeout budget.
    // Vercel HTTP response gateway cuts off at ~60s regardless of maxDuration.
    // DB overhead before (auth/plan/reservation) + after (save/events) costs ~7–10s.
    // We leave a 15s margin: 60s - 15s = 45s for the AI call itself.
    // This ensures the route can return a controlled error before the platform 504.
    const timeoutMs = Math.min(90000, serverEnv.AI_PROVIDER_TIMEOUT_MS)

    const routeAiStartMs = Date.now()
    console.info('[analyze/route]', JSON.stringify({
      event: 'ai_call_start',
      request_id: requestId,
      timeout_budget_ms: timeoutMs,
      model_profile: selected_profile_slug,
      working_language: working_language
    }))

    const analysisResult = await analyzePrompt(
      {
        inputPrompt: input_prompt,
        workingLanguage: working_language,
        selectedProfileSlug: selected_profile_slug,
        auditMode: audit_mode,
        taskGoal: task_goal || null,
        taskType: task_type || null,
        expectedOutputFormat: expected_output_format || null,
        constraints: constraints || null,
        dbProfile
      },
      {
        mockMode: isMockMode,
        abortSignal: request.signal || undefined,
        timeoutMs,
        requestId
      }
    )

    console.info('[analyze/route]', JSON.stringify({
      event: 'ai_call_end',
      request_id: requestId,
      ai_duration_ms: Date.now() - routeAiStartMs
    }))

    // Bounding output size validation
    if (!analysisResult.analysis.improved_prompt || analysisResult.analysis.improved_prompt.length > 50000) {
      throw new Error('MALFORMED_OUTPUT: Improved prompt is empty or exceeds limits.')
    }

    // Normalize newlines in the generated improved prompt
    const normalizedImprovedPrompt = normalizeNewlines(analysisResult.analysis.improved_prompt)
    analysisResult.analysis.improved_prompt = normalizedImprovedPrompt

    // 13. Save prompt_analyses record to database
    const createdRecord = await createPromptAnalysis({
      owner_anonymous_id: ownerAnonymousId,
      user_id: userId,
      input_prompt,
      working_language,
      selected_profile_slug,
      audit_mode,
      task_goal: task_goal || null,
      task_type: task_type || null,
      expected_output_format: expected_output_format || null,
      constraints: constraints || null,
      sensitive_data_risk_level: scanResult.riskLevel as 'none' | 'low' | 'medium' | 'high',
      sensitive_data_findings_json: scanResult.findings,
      overall_score: analysisResult.scores.overallScore,
      score_level: analysisResult.scores.scoreLevel as 'weak' | 'needs_work' | 'decent' | 'strong' | 'excellent',
      analysis_json: analysisResult.analysis,
      improved_prompt: analysisResult.analysis.improved_prompt,
      model_id_used: analysisResult.selectedModel || (capabilities.model_id as string | undefined) || getOwnerConfiguredModelId(),
      provider_used: dbProfile.provider || 'google',
      analysis_schema_version: process.env.ANALYSIS_SCHEMA_VERSION || '1.0.0',
      scoring_version: process.env.SCORING_VERSION || '1.0.0',
      model_profile_version: dbProfile.profile_version || '1.0.0',
      prompt_template_version: process.env.PROMPT_TEMPLATE_VERSION || '1.0.0'
    })

    if (!createdRecord) {
      if (reservationAcquired && requestId) {
        await releaseReservation(requestId).catch((err) => {
          console.error('Failed to release reservation:', err)
        })
        reservationAcquired = false
      }

      await createUsageEvent({
        owner_anonymous_id: ownerAnonymousId,
        user_id: userId,
        event_type: 'analysis_failed',
        metadata_json: {
          profile_slug: selected_profile_slug,
          working_language: working_language,
          error_code: 'DATABASE_ERROR'
        },
        ip_hash: ipHash,
        user_agent_hash: userAgentHash
      })

      return NextResponse.json(
        {
          error: 'database_error',
          message: 'Błąd podczas zapisywania analizy w bazie danych.'
        },
        { status: 500 }
      )
    }

    // Mark reservation as completed since database record was saved successfully
    if (reservationAcquired && requestId) {
      await completeReservation(requestId).catch((err) => {
        console.error('Failed to complete reservation:', err)
      })
      reservationAcquired = false
    }

    // 14. Validate numeric usage values and calculate cost server-side
    let promptTokens = 0
    let completionTokens = 0
    let totalTokens = 0
    let usageStatus: 'measured' | 'estimated' | 'unavailable' = 'unavailable'

    if (analysisResult.usage) {
      const p = analysisResult.usage.promptTokens
      const c = analysisResult.usage.completionTokens
      const t = analysisResult.usage.totalTokens

      if (typeof p === 'number' && Number.isFinite(p) && p >= 0 &&
          typeof c === 'number' && Number.isFinite(c) && c >= 0 &&
          typeof t === 'number' && Number.isFinite(t) && t >= 0) {
        promptTokens = p
        completionTokens = c
        totalTokens = t >= p + c ? t : p + c
        usageStatus = isMockMode ? 'estimated' : 'measured'
      }
    }

    const primaryModelId = (capabilities.model_id as string | undefined) || getOwnerConfiguredModelId()
    const modelId = analysisResult.selectedModel || primaryModelId
    const providerUsed = dbProfile.provider || 'google'
    const fallbackUsed = analysisResult.attempt > 1
    const attemptNumber = analysisResult.attempt
    const calculatedCost = usageStatus !== 'unavailable'
      ? calculateUsageCost(providerUsed, modelId, promptTokens, completionTokens)
      : null

    await createUsageEvent({
      owner_anonymous_id: ownerAnonymousId,
      user_id: userId,
      event_type: 'analysis_completed',
      metadata_json: {
        analysis_id: createdRecord.id,
        profile_slug: selected_profile_slug,
        working_language: working_language,
        primary_model_id: primaryModelId,
        model_id_used: modelId,
        fallback_used: fallbackUsed,
        attempt_number: attemptNumber,
        token_usage: usageStatus !== 'unavailable' ? {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: totalTokens,
          status: usageStatus
        } : null,
        cost_estimate: calculatedCost
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
      sensitive_data: scanResult
    })

  } catch (error) {
    if (reservationAcquired && requestId) {
      await releaseReservation(requestId).catch((err) => {
        console.error('Failed to release reservation in catch block:', err)
      })
      reservationAcquired = false
    }

    const errorId = randomUUID()

    // Invoke provider error monitoring hook
    recordProviderError(error, {
      request_id: requestId,
      error_id: errorId,
      selected_profile_slug: selectedProfileSlug,
      working_language: workingLanguage
    })

    const logFailureEvent = async (errCode: string) => {
      if (!ownerAnonymousId) {
        console.warn(`[logFailureEvent skipped] No anonymous identity available to log event ${errCode}`)
        return
      }
      await createUsageEvent({
        owner_anonymous_id: ownerAnonymousId,
        user_id: userId,
        event_type: 'analysis_failed',
        metadata_json: {
          profile_slug: selectedProfileSlug,
          working_language: workingLanguage,
          error_code: errCode,
          error_id: errorId
        },
        ip_hash: ipHash,
        user_agent_hash: userAgentHash
      }).catch(() => null)
    }

    // 1. Transient Auth Failure
    if (error instanceof Error && error.name === 'TransientAuthError') {
      await logFailureEvent('TRANSIENT_AUTH_ERROR')
      return NextResponse.json(
        {
          error: 'authentication_error',
          message: 'Usługa autoryzacji jest tymczasowo niedostępna. Spróbuj ponownie później.',
          error_id: errorId
        },
        { status: 503 }
      )
    }

    // 2. Client Cancellation
    const isClientCancelled = (
      (error instanceof Error && error.message === 'CLIENT_CLOSED') ||
      (request.signal && request.signal.aborted)
    )

    if (isClientCancelled) {
      await logFailureEvent('CLIENT_CANCELLED')
      console.warn(`[CLIENT_CANCELLED]: Request aborted by client. request_id=${requestId}`)
      return NextResponse.json(
        {
          error: 'client_cancelled',
          message: 'Połączenie zostało przerwane przez klienta.',
          error_id: errorId
        },
        { status: 499 }
      )
    }

    // 3. Timeout Errors
    const isTimeout = (
      (error instanceof Error && error.message.includes('PROVIDER_TIMEOUT')) ||
      (error instanceof ProviderError && (
        error.errorCode === 'provider_timeout' ||
        error.errorCode === 'upstream_provider_error' ||
        error.errorCode === 'function_platform_timeout'
      ))
    )

    if (isTimeout) {
      let publicCode = 'provider_timeout'
      // "Nie pobraliśmy limitu" is safe to state: reservation is released in the catch block above
      // before we reach this handler, so quota is not consumed on timeout.
      let message = 'Analiza trwała zbyt długo i została bezpiecznie przerwana. Nie pobraliśmy limitu za tę próbę. Spróbuj ponownie za chwilę albo skróć prompt.'

      if (error instanceof ProviderError) {
        if (error.errorCode === 'upstream_provider_error') {
          publicCode = 'upstream_provider_error'
          message = 'Analiza trwała zbyt długo i została bezpiecznie przerwana. Nie pobraliśmy limitu za tę próbę. Spróbuj ponownie za chwilę albo skróć prompt.'
        } else if (error.errorCode === 'function_platform_timeout') {
          publicCode = 'function_platform_timeout'
          message = 'Analiza trwała zbyt długo i została bezpiecznie przerwana. Nie pobraliśmy limitu za tę próbę. Spróbuj ponownie za chwilę albo skróć prompt.'
        }
      }

      await logFailureEvent(publicCode.toUpperCase())
      return NextResponse.json(
        {
          error: publicCode,
          message,
          error_id: errorId
        },
        { status: 504 }
      )
    }

    // 4. Semantic Validation Failures (Invalid Structured Output)
    if (
      error instanceof SemanticValidationError ||
      (error instanceof Error && error.message.startsWith('MALFORMED_OUTPUT'))
    ) {
      await logFailureEvent('INVALID_STRUCTURED_OUTPUT')

      console.error('[POST /api/analyze SemanticValidationError]:', error)
      return NextResponse.json(
        {
          error: 'malformed_provider_output',
          message: 'Nie udało się poprawnie złożyć raportu z odpowiedzi modelu. Spróbuj ponownie albo skróć prompt.',
          error_id: errorId
        },
        { status: 502 }
      )
    }

    // 5. Provider Rate Limits or Failures
    if (error instanceof ProviderError) {
      const isRateLimit = error.errorCode === 'provider_rate_limit'
      const isAuthError = error.errorCode === 'provider_authentication_error'
      const isConfigError = error.errorCode === 'provider_configuration_error'
      const isTimeoutError = error.errorCode === 'provider_timeout'
      const isUpstreamTimeout = error.errorCode === 'upstream_provider_error'
      const isPlatformTimeout = error.errorCode === 'function_platform_timeout'
      const isMalformed = error.errorCode === 'malformed_provider_output'
      const isUnknownAbort = error.errorCode === 'unknown_abort'

      const publicCode = isRateLimit
        ? 'provider_rate_limit'
        : isAuthError
        ? 'provider_authentication_error'
        : isConfigError
        ? 'provider_configuration_error'
        : isTimeoutError
        ? 'provider_timeout'
        : isUpstreamTimeout
        ? 'upstream_provider_error'
        : isPlatformTimeout
        ? 'function_platform_timeout'
        : isMalformed
        ? 'malformed_provider_output'
        : isUnknownAbort
        ? 'unknown_abort'
        : 'provider_unavailable'

      const status = isRateLimit
        ? 429
        : isAuthError || isMalformed
        ? 502
        : isTimeoutError || isUpstreamTimeout || isPlatformTimeout
        ? 504
        : isUnknownAbort
        ? 499
        : 503

      await logFailureEvent(publicCode.toUpperCase())
      return NextResponse.json(
        {
          error: publicCode,
          message: isMalformed
            ? 'Nie udało się poprawnie złożyć raportu z odpowiedzi modelu. Spróbuj ponownie albo skróć prompt.'
            : error.userMessage,
          error_id: errorId
        },
        { status }
      )
    }

    // 6. Catch-all Internal System Failures (including Database errors)
    const isDbError = error instanceof Error && (
      error.message.includes('Database error') ||
      error.message.includes('db') ||
      error.message.includes('PG') ||
      error.message.includes('foreign key') ||
      error.message.includes('violates')
    )
    const systemErrCode = isDbError ? 'DATABASE_ERROR' : 'INTERNAL_ERROR'
    await logFailureEvent(systemErrCode)

    console.error(`[SYSTEM_ERROR] error_id=${errorId} message="${error instanceof Error ? error.message : String(error)}"`)
    return NextResponse.json(
      {
        error: isDbError ? 'database_error' : 'internal_error',
        message: 'Wystąpił nieoczekiwany błąd serwera. Spróbuj ponownie później.',
        error_id: errorId
      },
      { status: 500 }
    )
  } finally {
    // No-op
  }
}
