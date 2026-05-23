import { describe, expect, it, vi, beforeEach } from 'vitest'

// 1. Mock server-only since it doesn't resolve in Node/Vitest
vi.mock('server-only', () => ({}))

// 2. Mock next/navigation notFound
vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    const err = new Error('NEXT_NOT_FOUND')
    ;(err as unknown as { digest: string }).digest = 'NEXT_NOT_FOUND'
    throw err
  })
}))

// 3. Mock individual layers
vi.mock('@/lib/identity/anonymous', () => ({
  getOwnerIdFromCookies: vi.fn()
}))

vi.mock('@/lib/supabase/queries', () => ({
  getPromptAnalysisForOwner: vi.fn()
}))

vi.mock('@/components/result/result-view', () => ({
  ResultView: vi.fn(() => null)
}))

// Import page and mocked functions
import PrivateResultPage from '@/app/result/[id]/page'
import { getOwnerIdFromCookies } from '@/lib/identity/anonymous'
import { getPromptAnalysisForOwner } from '@/lib/supabase/queries'
import { notFound } from 'next/navigation'
import { ResultView } from '@/components/result/result-view'
import type { PromptAnalysisRow } from '@/lib/supabase/types'

describe('PrivateResultPage Access Control Orchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('successfully renders ResultView when cookie owner matches result record owner', async () => {
    vi.mocked(getOwnerIdFromCookies).mockResolvedValue('owner-cookie-uuid')
    
    const dbRecord = {
      overall_score: 92,
      score_level: 'excellent',
      improved_prompt: 'Polished prompt content',
      analysis_json: {
        overall_summary: 'Test summary',
        criteria_scores: []
      }
    }
    vi.mocked(getPromptAnalysisForOwner).mockResolvedValue(dbRecord as unknown as PromptAnalysisRow)

    const params = Promise.resolve({ id: 'analysis-uuid' })
    const jsx = await PrivateResultPage({ params })

    expect(jsx).toBeDefined()
    expect(getOwnerIdFromCookies).toHaveBeenCalled()
    expect(getPromptAnalysisForOwner).toHaveBeenCalledWith('analysis-uuid', 'owner-cookie-uuid')
    
    // Inspect the returned React Element JSX tree directly
    expect(jsx.type).toBe('main')
    const child = jsx.props.children
    expect(child.type).toBe(ResultView)
    expect(child.props.mode).toBe('private')
    expect(child.props.result).toEqual(
      expect.objectContaining({
        overallScore: 92,
        scoreLevel: 'excellent',
        improved_prompt: 'Polished prompt content',
        overall_summary: 'Test summary'
      })
    )
  })

  it('triggers safe notFound() when session owner cookie is missing', async () => {
    vi.mocked(getOwnerIdFromCookies).mockResolvedValue(null)

    const params = Promise.resolve({ id: 'analysis-uuid' })
    await expect(PrivateResultPage({ params })).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFound).toHaveBeenCalled()
    expect(getPromptAnalysisForOwner).not.toHaveBeenCalled()
  })

  it('triggers safe notFound() when result is not owned by the session owner', async () => {
    vi.mocked(getOwnerIdFromCookies).mockResolvedValue('owner-cookie-uuid')
    // Mismatch or missing result from data layer
    vi.mocked(getPromptAnalysisForOwner).mockResolvedValue(null)

    const params = Promise.resolve({ id: 'analysis-uuid' })
    await expect(PrivateResultPage({ params })).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFound).toHaveBeenCalled()
    expect(getPromptAnalysisForOwner).toHaveBeenCalledWith('analysis-uuid', 'owner-cookie-uuid')
  })
})
