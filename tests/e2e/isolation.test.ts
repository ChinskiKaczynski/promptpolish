import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const missingVars: string[] = []
if (!process.env.E2E_FREE_EMAIL) missingVars.push('E2E_FREE_EMAIL')
if (!process.env.E2E_FREE_PASSWORD) missingVars.push('E2E_FREE_PASSWORD')
if (!process.env.E2E_PRO_EMAIL) missingVars.push('E2E_PRO_EMAIL')
if (!process.env.E2E_PRO_PASSWORD) missingVars.push('E2E_PRO_PASSWORD')

const isBlocked = missingVars.length > 0

let freeUserId: string | null = null
let proUserId: string | null = null
const freeAnalysisId = crypto.randomUUID()
const proAnalysisId = crypto.randomUUID()

test.describe('Anonymous Data Isolation Flows', () => {
  test.beforeAll(async () => {
    if (isBlocked) return

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    )

    // Resolve user IDs from profiles table
    const { data: freeProf } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('email', process.env.E2E_FREE_EMAIL!)
      .single()
    freeUserId = freeProf?.user_id || null

    const { data: proProf } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('email', process.env.E2E_PRO_EMAIL!)
      .single()
    proUserId = proProf?.user_id || null

    if (!freeUserId || !proUserId) {
      throw new Error('E2E Free or Pro profiles not found in database')
    }

    const mockAnalysisJson = (summary: string, improvedPrompt: string) => ({
      analysis_schema_version: '1.0.0',
      overall_summary: summary,
      detected_task_type: 'general_prompt_improvement',
      criteria_scores: [
        { criterion: 'goal_clarity', raw_score_0_10: 8, rationale: 'Clear goal.', improvement_suggestion: 'None.' },
        { criterion: 'context_completeness', raw_score_0_10: 7, rationale: 'Good context.', improvement_suggestion: 'Add more details.' },
        { criterion: 'structure', raw_score_0_10: 9, rationale: 'Structured well.', improvement_suggestion: 'None.' },
        { criterion: 'constraints', raw_score_0_10: 8, rationale: 'Has constraints.', improvement_suggestion: 'None.' },
        { criterion: 'output_format', raw_score_0_10: 8, rationale: 'Specify format.', improvement_suggestion: 'None.' },
        { criterion: 'model_profile_fit', raw_score_0_10: 8, rationale: 'Fits profile.', improvement_suggestion: 'None.' },
        { criterion: 'resistance_to_misinterpretation', raw_score_0_10: 8, rationale: 'Clear language.', improvement_suggestion: 'None.' },
        { criterion: 'cost_efficiency', raw_score_0_10: 8, rationale: 'Cost efficient.', improvement_suggestion: 'None.' },
        { criterion: 'safety', raw_score_0_10: 8, rationale: 'Safe prompt.', improvement_suggestion: 'None.' },
        { criterion: 'testability', raw_score_0_10: 8, rationale: 'Testable.', improvement_suggestion: 'None.' }
      ],
      top_weaknesses: ['Słabość 1', 'Słabość 2'],
      improvement_plan: ['Krok planu 1', 'Krok planu 2'],
      improved_prompt: improvedPrompt,
      change_explanations: ['Wyjaśnienie zmiany 1', 'Wyjaśnienie zmiany 2'],
      model_fit_notes: ['Zgodność z profilem 1'],
      uncertainty_warnings: ['Ostrzeżenie 1'],
      safety_notes: ['Bezpieczeństwo 1']
    })

    // Insert mock prompt analyses with unique run IDs
    await supabase.from('prompt_analyses').insert([
      {
        id: freeAnalysisId,
        owner_anonymous_id: crypto.randomUUID(),
        user_id: freeUserId,
        input_prompt: 'To jest prywatny prompt uzytkownika Free, który ma minimalna poprawna dlugosc.',
        working_language: 'pl',
        selected_profile_slug: 'general-llm',
        overall_score: 80,
        score_level: 'strong',
        analysis_json: mockAnalysisJson('Summary of free prompt.', 'Improved free prompt'),
        improved_prompt: 'Improved free prompt',
        model_id_used: 'gemini-2.5-flash',
        provider_used: 'google',
        analysis_schema_version: '1.0.0',
        scoring_version: '1.0.0',
        model_profile_version: '1.0.0',
        prompt_template_version: '1.0.0'
      },
      {
        id: proAnalysisId,
        owner_anonymous_id: crypto.randomUUID(),
        user_id: proUserId,
        input_prompt: 'To jest prywatny prompt uzytkownika Pro, który ma minimalna poprawna dlugosc.',
        working_language: 'pl',
        selected_profile_slug: 'general-llm',
        overall_score: 90,
        score_level: 'strong',
        analysis_json: mockAnalysisJson('Summary of pro prompt.', 'Improved pro prompt'),
        improved_prompt: 'Improved pro prompt',
        model_id_used: 'gemini-2.5-flash',
        provider_used: 'google',
        analysis_schema_version: '1.0.0',
        scoring_version: '1.0.0',
        model_profile_version: '1.0.0',
        prompt_template_version: '1.0.0'
      }
    ])
  })

  test.afterAll(async () => {
    if (isBlocked) return
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    )
    await supabase.from('prompt_analyses').delete().in('id', [freeAnalysisId, proAnalysisId])
  })

  test.beforeEach(async ({ page }, testInfo) => {
    page.on('console', (msg) => {
      const text = msg.text()
      if (
        msg.type() === 'error' &&
        (text.includes('hydration') ||
          text.includes('did not match') ||
          text.includes('server rendered HTML'))
      ) {
        throw new Error(`CRITICAL HYDRATION ERROR DETECTED: ${text}`)
      }
    })

    if (isBlocked) {
      console.log(`BLOCKED_MISSING_CREDENTIALS: ${missingVars.join(', ')}`)
      testInfo.skip(true, `BLOCKED_MISSING_CREDENTIALS: ${missingVars.join(', ')}`)
    }
  })

  test('Isolation: anonymous cannot open Free or Pro private result', async ({ page }) => {
    await page.goto(`/result/${freeAnalysisId}`)
    await expect(page.locator('h1')).toContainText('Nie odnaleziono strony')

    await page.goto(`/result/${proAnalysisId}`)
    await expect(page.locator('h1')).toContainText('Nie odnaleziono strony')
  })
})
