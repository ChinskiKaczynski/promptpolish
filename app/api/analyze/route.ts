import { NextResponse } from 'next/server'
import { z } from 'zod'
import { detectSensitiveData } from '@/lib/privacy/sensitive-data-detector'
import { mockAnalysisResult } from '@/lib/ai/mock-analysis'

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

  const detection = detectSensitiveData(parsed.data.input_prompt)
  if (detection.riskLevel === 'high') {
    return NextResponse.json({ error: 'high_risk_sensitive_data_detected', findings: detection.findings }, { status: 422 })
  }

  // Starter behavior only. Replace with real API flow after docs check, Supabase DAL and Gemini smoke test.
  return NextResponse.json({
    id: 'mock',
    result: mockAnalysisResult,
    sensitive_data: detection
  })
}
