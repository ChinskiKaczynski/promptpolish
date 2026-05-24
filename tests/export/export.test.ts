import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/identity/anonymous', () => ({
  getOwnerIdFromCookies: vi.fn()
}))

vi.mock('@/lib/identity/auth', () => ({
  getAuthUser: vi.fn()
}))

vi.mock('@/lib/supabase/queries', () => ({
  getPromptAnalysisForOwner: vi.fn(),
  getUserProfile: vi.fn(),
  createUsageEvent: vi.fn()
}))

import { GET as getMarkdown } from '@/app/api/export/markdown/route'
import { GET as getPdf } from '@/app/api/export/pdf/route'
import { getOwnerIdFromCookies } from '@/lib/identity/anonymous'
import { getAuthUser } from '@/lib/identity/auth'
import { getPromptAnalysisForOwner, getUserProfile, createUsageEvent } from '@/lib/supabase/queries'
import type { PromptAnalysisRow, UserProfileRow } from '@/lib/supabase/types'
import type { User } from '@supabase/supabase-js'

const ANALYSIS_ID = 'a1b2c3d4-e5f6-4789-abcd-ef1234567890'
const OWNER_ID = 'owner-anon-uuid'

const mockAnalysisRecord: PromptAnalysisRow = {
  id: ANALYSIS_ID,
  owner_anonymous_id: OWNER_ID,
  user_id: null,
  input_prompt: 'Prosty prompt testowy',
  working_language: 'pl',
  selected_profile_slug: 'openrouter-deepseek-v4-flash',
  audit_mode: null,
  task_goal: 'Test',
  task_type: 'simple',
  expected_output_format: 'text',
  constraints: 'none',
  sensitive_data_risk_level: 'none',
  sensitive_data_findings_json: [],
  overall_score: 85,
  score_level: 'strong',
  analysis_json: {
    analysis_schema_version: '1.0.0',
    detected_task_type: 'General',
    improved_prompt: 'Poprawiony prompt testowy',
    overall_summary: 'Swietne podsumowanie.',
    top_weaknesses: ['Slabosc 1'],
    improvement_plan: ['Krok 1'],
    criteria_scores: [
      {
        criterion: 'goal_clarity',
        raw_score_0_10: 9,
        rationale: 'Jasny cel.',
        improvement_suggestion: 'Drobne poprawki.'
      }
    ],
    change_explanations: ['Zmiana 1'],
    model_fit_notes: ['Zgodny.'],
    uncertainty_warnings: ['Brak.'],
    safety_notes: ['Bezpieczny.']
  },
  improved_prompt: 'Poprawiony prompt testowy',
  model_id_used: 'gemini-1.5-flash',
  provider_used: 'google',
  analysis_schema_version: '1.0',
  scoring_version: '1.0',
  model_profile_version: '1.0',
  prompt_template_version: '1.0',
  share_token: null,
  is_share_enabled: false,
  expires_at: null,
  title: 'Test',
  is_favorite: false,
  deleted_at: null,
  created_at: new Date().toISOString()
}

describe('Export API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getOwnerIdFromCookies).mockResolvedValue(OWNER_ID)
    vi.mocked(getAuthUser).mockResolvedValue(null)
    vi.mocked(getPromptAnalysisForOwner).mockResolvedValue(mockAnalysisRecord)
    vi.mocked(getUserProfile).mockResolvedValue(null)
  })

  describe('GET /api/export/markdown', () => {
    it('returns 400 when analysis id is missing', async () => {
      const req = new Request('http://localhost/api/export/markdown')
      const res = await getMarkdown(req)

      expect(res.status).toBe(400)
      expect(await res.text()).toContain('Missing analysis ID')
    })

    it('returns 404 when user does not own the analysis', async () => {
      vi.mocked(getPromptAnalysisForOwner).mockResolvedValue(null)
      const req = new Request(`http://localhost/api/export/markdown?id=${ANALYSIS_ID}`)
      const res = await getMarkdown(req)

      expect(res.status).toBe(404)
      expect(await res.text()).toContain('Not Found or Access Denied')
    })

    it('returns 403 when free user tries to export Markdown', async () => {
      const req = new Request(`http://localhost/api/export/markdown?id=${ANALYSIS_ID}`)
      const res = await getMarkdown(req)

      expect(res.status).toBe(403)
      expect(await res.text()).toContain('Pro plan required for Markdown export')
    })

    it('returns 200 and triggers download when Pro user exports Markdown', async () => {
      // Mock logged in Pro user
      vi.mocked(getAuthUser).mockResolvedValue({ id: 'user-uuid', email: 'pro@test.com' } as unknown as User)
      vi.mocked(getUserProfile).mockResolvedValue({ plan_slug: 'pro' } as UserProfileRow)
      vi.mocked(getPromptAnalysisForOwner).mockResolvedValue({ ...mockAnalysisRecord, user_id: 'user-uuid' })

      const req = new Request(`http://localhost/api/export/markdown?id=${ANALYSIS_ID}`)
      const res = await getMarkdown(req)

      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toContain('text/markdown')
      expect(res.headers.get('Content-Disposition')).toContain('attachment; filename="promptpolish-audit-')
      
      const content = await res.text()
      expect(content).toContain('# Raport Audytu Promptu — PromptPolish')
      expect(content).toContain('Poprawiony prompt testowy')
      expect(content).not.toContain('owner_anonymous_id')
      expect(content).not.toContain('user_uuid')

      expect(createUsageEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'export_markdown',
          metadata_json: { analysis_id: ANALYSIS_ID }
        })
      )
    })
  })

  describe('GET /api/export/pdf', () => {
    it('returns 400 when analysis id is missing', async () => {
      const req = new Request('http://localhost/api/export/pdf')
      const res = await getPdf(req)

      expect(res.status).toBe(400)
      expect(await res.text()).toContain('Missing analysis ID')
    })

    it('returns 404 when user does not own the analysis', async () => {
      vi.mocked(getPromptAnalysisForOwner).mockResolvedValue(null)
      const req = new Request(`http://localhost/api/export/pdf?id=${ANALYSIS_ID}`)
      const res = await getPdf(req)

      expect(res.status).toBe(404)
      expect(await res.text()).toContain('Not Found or Access Denied')
    })

    it('returns 403 when free user tries to export PDF', async () => {
      const req = new Request(`http://localhost/api/export/pdf?id=${ANALYSIS_ID}`)
      const res = await getPdf(req)

      expect(res.status).toBe(403)
      expect(await res.text()).toContain('Pro plan required for PDF export')
    })

    it('returns 200 and triggers download when Pro user exports PDF', async () => {
      // Mock logged in Pro user
      vi.mocked(getAuthUser).mockResolvedValue({ id: 'user-uuid', email: 'pro@test.com' } as unknown as User)
      vi.mocked(getUserProfile).mockResolvedValue({ plan_slug: 'pro' } as UserProfileRow)
      vi.mocked(getPromptAnalysisForOwner).mockResolvedValue({ ...mockAnalysisRecord, user_id: 'user-uuid' })

      const req = new Request(`http://localhost/api/export/pdf?id=${ANALYSIS_ID}`)
      const res = await getPdf(req)

      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toBe('application/pdf')
      expect(res.headers.get('Content-Disposition')).toContain('attachment; filename="promptpolish-audit-')
      
      const buffer = await res.arrayBuffer()
      expect(buffer.byteLength).toBeGreaterThan(0)

      expect(createUsageEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'export_pdf',
          metadata_json: { analysis_id: ANALYSIS_ID }
        })
      )
    })
  })
})
