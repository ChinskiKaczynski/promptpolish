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
  createUsageEvent: vi.fn()
}))

vi.mock('@/lib/plans/config', () => ({
  getPlanSlugForUser: vi.fn(),
  canExportPdf: vi.fn(),
  canExportMarkdown: vi.fn(),
  canExportText: vi.fn(),
}))

import { GET } from '@/app/api/export/[id]/route'
import { getOwnerIdFromCookies } from '@/lib/identity/anonymous'
import { getAuthUser } from '@/lib/identity/auth'
import { getPromptAnalysisForOwner, createUsageEvent } from '@/lib/supabase/queries'
import { getPlanSlugForUser, canExportPdf, canExportMarkdown, canExportText } from '@/lib/plans/config'
import type { PromptAnalysisRow } from '@/lib/supabase/types'
import { formatAnalysis } from '@/lib/export/format-analysis'

const ANALYSIS_ID = 'a1b2c3d4-e5f6-4789-abcd-ef1234567890'
const OWNER_ID = 'owner-anon-uuid'
const SAFE_ID = ANALYSIS_ID.slice(0, 8)

const mockAnalysisRecord: PromptAnalysisRow = {
  id: ANALYSIS_ID,
  owner_anonymous_id: OWNER_ID,
  user_id: null,
  input_prompt: 'Prosty prompt testowy',
  working_language: 'pl',
  selected_profile_slug: 'general-llm',
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
  share_token: 'dummy-share-token-123',
  is_share_enabled: false,
  expires_at: null,
  title: 'Test',
  is_favorite: false,
  deleted_at: null,
  created_at: '2026-06-04T00:00:00Z'
}

describe('Export v1 API Dynamic Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getOwnerIdFromCookies).mockResolvedValue(OWNER_ID)
    vi.mocked(getAuthUser).mockResolvedValue(null)
    vi.mocked(getPromptAnalysisForOwner).mockResolvedValue(mockAnalysisRecord)
    vi.mocked(getPlanSlugForUser).mockResolvedValue('pro')
    vi.mocked(canExportPdf).mockReturnValue(true)
    vi.mocked(canExportMarkdown).mockReturnValue(true)
    vi.mocked(canExportText).mockReturnValue(true)
  })

  it('rejects with 400 if format is missing or invalid', async () => {
    const req = new Request(`http://localhost/api/export/${ANALYSIS_ID}`)
    const params = Promise.resolve({ id: ANALYSIS_ID })
    const res = await GET(req, { params })

    expect(res.status).toBe(400)
    expect(res.headers.get('Cache-Control')).toBe('private, no-store')
    expect(res.headers.get('Pragma')).toBe('no-cache')
    expect(await res.text()).toContain('Invalid or missing format')
  })

  it('returns 200 and formatted Markdown for authorized owner', async () => {
    const req = new Request(`http://localhost/api/export/${ANALYSIS_ID}?format=markdown`)
    const params = Promise.resolve({ id: ANALYSIS_ID })
    const res = await GET(req, { params })

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('text/markdown')
    expect(res.headers.get('Content-Disposition')).toBe(`attachment; filename="promptpolish-report-${SAFE_ID}.md"`)
    expect(res.headers.get('Cache-Control')).toBe('private, no-store')
    expect(res.headers.get('Pragma')).toBe('no-cache')

    const text = await res.text()
    
    // Core inclusions
    expect(text).toContain('PromptPolish')
    expect(text).toContain('4 czerwca 2026') // Date formatted in PL locale
    expect(text).toContain('85 / 100')
    expect(text).toContain('Bardzo dobry')
    expect(text).toContain('Model uniwersalny (General LLM)')
    expect(text).toContain('Swietne podsumowanie.')
    expect(text).toContain('Poprawiony prompt testowy')
    expect(text).toContain('Jasny cel.')
    expect(text).toContain('Drobne poprawki.')
    expect(text).toContain('Uwaga: Wygenerowany raport') // PL disclaimer

    // Core scrubbing: check no sensitive fields are present
    expect(text).not.toContain(OWNER_ID)
    expect(text).not.toContain('dummy-share-token-123')
    expect(text).not.toContain('analysis_schema_version')
    expect(text).not.toContain('scoring_version')

    // Telemetry log check
    expect(createUsageEvent).toHaveBeenCalledWith({
      owner_anonymous_id: OWNER_ID,
      user_id: null,
      event_type: 'export_markdown',
      metadata_json: {
        analysis_id: ANALYSIS_ID,
        export_type: 'markdown'
      }
    })
  })

  it('returns 200 and formatted Plain Text for authorized owner', async () => {
    const req = new Request(`http://localhost/api/export/${ANALYSIS_ID}?format=txt`)
    const params = Promise.resolve({ id: ANALYSIS_ID })
    const res = await GET(req, { params })

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('text/plain')
    expect(res.headers.get('Content-Disposition')).toBe(`attachment; filename="promptpolish-report-${SAFE_ID}.txt"`)
    expect(res.headers.get('Cache-Control')).toBe('private, no-store')
    expect(res.headers.get('Pragma')).toBe('no-cache')

    const text = await res.text()

    // Core inclusions
    expect(text.toLowerCase()).toContain('promptpolish')
    expect(text).toContain('4 czerwca 2026')
    expect(text).toContain('85 / 100')
    expect(text).toContain('BARDZO DOBRY')
    expect(text).toContain('Model uniwersalny (General LLM)')
    expect(text).toContain('Poprawiony prompt testowy')
    expect(text).toContain('Analiza: Jasny cel.')
    expect(text).toContain('Sugerowane ulepszenie: Drobne poprawki.')
    expect(text).toContain('Uwaga: Wygenerowany raport') // PL disclaimer

    // Core scrubbing
    expect(text).not.toContain(OWNER_ID)
    expect(text).not.toContain('dummy-share-token-123')

    // Telemetry log check
    expect(createUsageEvent).toHaveBeenCalledWith({
      owner_anonymous_id: OWNER_ID,
      user_id: null,
      event_type: 'export_txt',
      metadata_json: {
        analysis_id: ANALYSIS_ID,
        export_type: 'txt'
      }
    })
  })

  it('returns 404 for non-owners (unauthorized)', async () => {
    vi.mocked(getPromptAnalysisForOwner).mockResolvedValue(null)

    const req = new Request(`http://localhost/api/export/${ANALYSIS_ID}?format=markdown`)
    const params = Promise.resolve({ id: ANALYSIS_ID })
    const res = await GET(req, { params })

    expect(res.status).toBe(404)
    expect(res.headers.get('Cache-Control')).toBe('private, no-store')
    expect(res.headers.get('Pragma')).toBe('no-cache')
    expect(await res.text()).toContain('Not Found or Access Denied')
    expect(createUsageEvent).not.toHaveBeenCalled()
  })

  it('returns 404 for soft-deleted analyses', async () => {
    vi.mocked(getPromptAnalysisForOwner).mockResolvedValue(null)

    const req = new Request(`http://localhost/api/export/${ANALYSIS_ID}?format=txt`)
    const params = Promise.resolve({ id: ANALYSIS_ID })
    const res = await GET(req, { params })

    expect(res.status).toBe(404)
    expect(res.headers.get('Cache-Control')).toBe('private, no-store')
    expect(res.headers.get('Pragma')).toBe('no-cache')
    expect(createUsageEvent).not.toHaveBeenCalled()
  })

  it('returns 200 and PDF binary for authorized owner with Pro subscription', async () => {
    const req = new Request(`http://localhost/api/export/${ANALYSIS_ID}?format=pdf`)
    const params = Promise.resolve({ id: ANALYSIS_ID })
    const res = await GET(req, { params })

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('application/pdf')
    expect(res.headers.get('Content-Disposition')).toBe(`attachment; filename="promptpolish-report-${SAFE_ID}.pdf"`)
    expect(res.headers.get('Cache-Control')).toBe('private, no-store')
    expect(res.headers.get('Pragma')).toBe('no-cache')

    const body = await res.arrayBuffer()
    expect(body.byteLength).toBeGreaterThan(0)

    expect(createUsageEvent).toHaveBeenCalledWith({
      owner_anonymous_id: OWNER_ID,
      user_id: null,
      event_type: 'export_pdf',
      metadata_json: {
        analysis_id: ANALYSIS_ID,
        export_type: 'pdf'
      }
    })
  })

  it('returns 403 Forbidden JSON for authorized owner with Free subscription requesting PDF', async () => {
    vi.mocked(getPlanSlugForUser).mockResolvedValue('free')
    vi.mocked(canExportPdf).mockReturnValue(false)

    const req = new Request(`http://localhost/api/export/${ANALYSIS_ID}?format=pdf`)
    const params = Promise.resolve({ id: ANALYSIS_ID })
    const res = await GET(req, { params })

    expect(res.status).toBe(403)
    expect(res.headers.get('Cache-Control')).toBe('private, no-store')
    expect(res.headers.get('Pragma')).toBe('no-cache')
    
    const json = await res.json()
    expect(json).toEqual({
      error: 'entitlement_denied',
      feature: 'exportPdf',
      plan: 'free',
      upgradeRequired: true,
      message: 'PDF export is available on the Pro plan.'
    })
    expect(createUsageEvent).not.toHaveBeenCalled()
  })

  it('returns 404 for non-owners requesting PDF', async () => {
    vi.mocked(getPromptAnalysisForOwner).mockResolvedValue(null)

    const req = new Request(`http://localhost/api/export/${ANALYSIS_ID}?format=pdf`)
    const params = Promise.resolve({ id: ANALYSIS_ID })
    const res = await GET(req, { params })

    expect(res.status).toBe(404)
    expect(res.headers.get('Cache-Control')).toBe('private, no-store')
    expect(res.headers.get('Pragma')).toBe('no-cache')
    expect(createUsageEvent).not.toHaveBeenCalled()
  })

  it('returns 200 for Free plan requesting Markdown/TXT export when entitled', async () => {
    vi.mocked(getPlanSlugForUser).mockResolvedValue('free')
    vi.mocked(canExportMarkdown).mockReturnValue(true)
    vi.mocked(canExportText).mockReturnValue(true)

    // Markdown
    const reqMd = new Request(`http://localhost/api/export/${ANALYSIS_ID}?format=markdown`)
    const resMd = await GET(reqMd, { params: Promise.resolve({ id: ANALYSIS_ID }) })
    expect(resMd.status).toBe(200)

    // TXT
    const reqTxt = new Request(`http://localhost/api/export/${ANALYSIS_ID}?format=txt`)
    const resTxt = await GET(reqTxt, { params: Promise.resolve({ id: ANALYSIS_ID }) })
    expect(resTxt.status).toBe(200)
  })

  it('returns 403 Forbidden JSON if canExportMarkdown returns false', async () => {
    vi.mocked(getPlanSlugForUser).mockResolvedValue('free')
    vi.mocked(canExportMarkdown).mockReturnValue(false)

    const req = new Request(`http://localhost/api/export/${ANALYSIS_ID}?format=markdown`)
    const params = Promise.resolve({ id: ANALYSIS_ID })
    const res = await GET(req, { params })

    expect(res.status).toBe(403)
    expect(res.headers.get('Cache-Control')).toBe('private, no-store')
    expect(res.headers.get('Pragma')).toBe('no-cache')

    const json = await res.json()
    expect(json.error).toBe('entitlement_denied')
    expect(json.feature).toBe('exportMarkdown')
    expect(createUsageEvent).not.toHaveBeenCalled()
  })

  it('returns 403 Forbidden JSON if canExportText returns false', async () => {
    vi.mocked(getPlanSlugForUser).mockResolvedValue('free')
    vi.mocked(canExportText).mockReturnValue(false)

    const req = new Request(`http://localhost/api/export/${ANALYSIS_ID}?format=txt`)
    const params = Promise.resolve({ id: ANALYSIS_ID })
    const res = await GET(req, { params })

    expect(res.status).toBe(403)
    expect(res.headers.get('Cache-Control')).toBe('private, no-store')
    expect(res.headers.get('Pragma')).toBe('no-cache')

    const json = await res.json()
    expect(json.error).toBe('entitlement_denied')
    expect(json.feature).toBe('exportText')
    expect(createUsageEvent).not.toHaveBeenCalled()
  })

  it('correctly handles nested backticks in markdown export fencing', () => {
    const testRecord = {
      ...mockAnalysisRecord,
      improved_prompt: 'Code:\n```javascript\nconsole.log("hello");\n```\nNested:\n````\nfour backticks\n````'
    }
    const md = formatAnalysis(testRecord, 'markdown')
    // Should wrap with 5 backticks because the content contains up to 4 backticks
    expect(md).toContain('`````text\nCode:\n```javascript\nconsole.log("hello");\n```\nNested:\n````\nfour backticks\n````\n`````')
  })
})
