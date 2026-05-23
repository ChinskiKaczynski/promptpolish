import { NextResponse } from 'next/server'
import { z } from 'zod'
import { detectSensitiveData } from '@/lib/privacy/sensitive-data-detector'
import { mockAnalysisResult } from '@/lib/ai/mock-analysis'
import { resolveOrCreateOwnerId } from '@/lib/identity/anonymous'
import { createPromptAnalysis, createUsageEvent } from '@/lib/supabase/queries'

const analyzeRequestSchema = z.object({
  input_prompt: z.string().min(20).max(12000),
  working_language: z.enum(['pl', 'en']),
  selected_profile_slug: z.enum(['general-llm', 'google-gemini-3-5-flash']),
  task_goal: z.string().max(2000).optional(),
  task_type: z.string().max(200).optional(),
  expected_output_format: z.string().max(1000).optional(),
  constraints: z.string().max(2000).optional()
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = analyzeRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input', details: parsed.error.flatten() }, { status: 400 })
  }

  // 1. Resolve or create owner anonymous identity server-side from signed secure cookie.
  //    Any anonymous_id passed in the body is completely ignored.
  const { id: ownerAnonymousId } = await resolveOrCreateOwnerId()

  const detection = detectSensitiveData(parsed.data.input_prompt)
  if (detection.riskLevel === 'high') {
    return NextResponse.json({ error: 'high_risk_sensitive_data_detected', findings: detection.findings }, { status: 422 })
  }

  // Define analysis details based on mock or real API flow
  const analysisData = {
    owner_anonymous_id: ownerAnonymousId,
    input_prompt: parsed.data.input_prompt,
    working_language: parsed.data.working_language,
    selected_profile_slug: parsed.data.selected_profile_slug,
    task_goal: parsed.data.task_goal || null,
    task_type: parsed.data.task_type || null,
    expected_output_format: parsed.data.expected_output_format || null,
    constraints: parsed.data.constraints || null,
    sensitive_data_risk_level: detection.riskLevel as 'none' | 'low' | 'medium' | 'high',
    sensitive_data_findings_json: detection.findings,
    overall_score: mockAnalysisResult.overallScore,
    score_level: mockAnalysisResult.scoreLevel as 'weak' | 'needs_work' | 'decent' | 'strong' | 'excellent',
    analysis_json: mockAnalysisResult,
    improved_prompt: mockAnalysisResult.improved_prompt,
    model_id_used: process.env.GEMINI_MODEL_ID || 'gemini-3.5-flash',
    provider_used: 'google',
    analysis_schema_version: process.env.ANALYSIS_SCHEMA_VERSION || '1.0.0',
    scoring_version: process.env.SCORING_VERSION || '1.0.0',
    model_profile_version: '1.0.0',
    prompt_template_version: process.env.PROMPT_TEMPLATE_VERSION || '1.0.0'
  }

  // 2. Persist the prompt analysis in Supabase
  const createdRecord = await createPromptAnalysis(analysisData)
  if (!createdRecord) {
    return NextResponse.json({ error: 'database_error', message: 'Failed to persist prompt analysis.' }, { status: 500 })
  }

  // 3. Log a telemetry usage event in the database
  await createUsageEvent({
    owner_anonymous_id: ownerAnonymousId,
    event_type: 'analyze',
    metadata_json: {
      analysis_id: createdRecord.id,
      selected_profile_slug: parsed.data.selected_profile_slug,
      working_language: parsed.data.working_language
    }
  })

  // Return the newly created record ID along with data payloads
  return NextResponse.json({
    id: createdRecord.id,
    result: mockAnalysisResult,
    sensitive_data: detection
  })
}
