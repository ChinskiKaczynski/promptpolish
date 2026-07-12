import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    const err = new Error('NEXT_NOT_FOUND')
    ;(err as unknown as { digest: string }).digest = 'NEXT_NOT_FOUND'
    throw err
  })
}))

vi.mock('@/lib/supabase/queries', () => ({
  getSharedPromptAnalysis: vi.fn()
}))

vi.mock('@/components/result/result-view', () => ({
  ResultView: vi.fn(() => null)
}))

import SharedResultPage from '@/app/share/[token]/page'
import { getSharedPromptAnalysis } from '@/lib/supabase/queries'
import { notFound } from 'next/navigation'
import { ResultView } from '@/components/result/result-view'
import type { SharedPromptAnalysis } from '@/lib/supabase/queries'

const SCRUBBED_RECORD: SharedPromptAnalysis = {
  working_language: 'en',
  selected_profile_slug: 'general-llm',
  overall_score: 78,
  score_level: 'decent',
  analysis_json: {
    overall_summary: 'Decent prompt',
    detected_task_type: 'Summarization',
    criteria_scores: [
      { criterion: 'goal_clarity', raw_score_0_10: 8, rationale: 'Ok', improvement_suggestion: 'Better' },
      { criterion: 'context_completeness', raw_score_0_10: 8, rationale: 'Ok', improvement_suggestion: 'Better' },
      { criterion: 'structure', raw_score_0_10: 8, rationale: 'Ok', improvement_suggestion: 'Better' },
      { criterion: 'constraints', raw_score_0_10: 8, rationale: 'Ok', improvement_suggestion: 'Better' },
      { criterion: 'output_format', raw_score_0_10: 8, rationale: 'Ok', improvement_suggestion: 'Better' },
      { criterion: 'model_profile_fit', raw_score_0_10: 8, rationale: 'Ok', improvement_suggestion: 'Better' },
      { criterion: 'resistance_to_misinterpretation', raw_score_0_10: 8, rationale: 'Ok', improvement_suggestion: 'Better' },
      { criterion: 'cost_efficiency', raw_score_0_10: 8, rationale: 'Ok', improvement_suggestion: 'Better' },
      { criterion: 'safety', raw_score_0_10: 8, rationale: 'Ok', improvement_suggestion: 'Better' },
      { criterion: 'testability', raw_score_0_10: 8, rationale: 'Ok', improvement_suggestion: 'Better' }
    ],
    top_weaknesses: ['Weakness 1'],
    improvement_plan: ['Step 1'],
    improved_prompt: 'Please summarize the following contract...',
    change_explanations: ['Explanation 1'],
    model_fit_notes: [],
    uncertainty_warnings: [],
    safety_notes: [],
    analysis_schema_version: '1.0.0'
  },
  improved_prompt: 'Please summarize the following contract...',
  created_at: '2026-05-23T12:00:00Z'
}

describe('SharedResultPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Valid token', () => {
    it('renders ResultView with mode="share" when token resolves to an active share', async () => {
      vi.mocked(getSharedPromptAnalysis).mockResolvedValue(SCRUBBED_RECORD)

      const params = Promise.resolve({ token: 'valid-share-token-abc' })
      const jsx = await SharedResultPage({ params })

      expect(jsx).toBeDefined()
      expect(notFound).not.toHaveBeenCalled()
      expect(getSharedPromptAnalysis).toHaveBeenCalledWith('valid-share-token-abc')

      // Page should wrap in div and main with ResultView
      expect(jsx.type).toBe('div')
      const mainElement = jsx.props.children[1]
      expect(mainElement.type).toBe('main')
      const child = mainElement.props.children
      expect(child.type).toBe(ResultView)
      expect(child.props.mode).toBe('share')
    })

    it('passes overallScore and scoreLevel to ResultView from the scrubbed record', async () => {
      vi.mocked(getSharedPromptAnalysis).mockResolvedValue(SCRUBBED_RECORD)

      const params = Promise.resolve({ token: 'valid-share-token-abc' })
      const jsx = await SharedResultPage({ params })

      const resultProp = jsx.props.children[1].props.children.props.result
      expect(resultProp.overallScore).toBe(78)
      expect(resultProp.scoreLevel).toBe('decent')
      expect(resultProp.improved_prompt).toBe('Please summarize the following contract...')
    })

    it('does NOT pass id, shareToken, or isShareEnabled to ResultView props', async () => {
      vi.mocked(getSharedPromptAnalysis).mockResolvedValue(SCRUBBED_RECORD)

      const params = Promise.resolve({ token: 'valid-share-token-abc' })
      const jsx = await SharedResultPage({ params })

      const resultProp = jsx.props.children[1].props.children.props.result
      expect(resultProp).not.toHaveProperty('id')
      expect(resultProp).not.toHaveProperty('shareToken')
      expect(resultProp).not.toHaveProperty('isShareEnabled')
      expect(resultProp).not.toHaveProperty('owner_anonymous_id')
    })
  })

  describe('Disabled or nonexistent token', () => {
    it('calls notFound() when token does not resolve (disabled share)', async () => {
      vi.mocked(getSharedPromptAnalysis).mockResolvedValue(null)

      const params = Promise.resolve({ token: 'disabled-token' })
      await expect(SharedResultPage({ params })).rejects.toThrow('NEXT_NOT_FOUND')
      expect(notFound).toHaveBeenCalled()
    })

    it('calls notFound() for a nonexistent token', async () => {
      vi.mocked(getSharedPromptAnalysis).mockResolvedValue(null)

      const params = Promise.resolve({ token: 'completely-invalid-token' })
      await expect(SharedResultPage({ params })).rejects.toThrow('NEXT_NOT_FOUND')
      expect(notFound).toHaveBeenCalled()
    })

    it('does not render ResultView when token is disabled', async () => {
      vi.mocked(getSharedPromptAnalysis).mockResolvedValue(null)

      const params = Promise.resolve({ token: 'disabled-token' })
      await expect(SharedResultPage({ params })).rejects.toThrow()
      expect(ResultView).not.toHaveBeenCalled()
    })
  })
})
