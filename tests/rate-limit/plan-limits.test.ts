import { describe, expect, it, vi } from 'vitest'

// Mock server-only sentinel
vi.mock('server-only', () => ({}))

// Mock queries
vi.mock('@/lib/supabase/queries', () => ({
  getUserProfile: vi.fn(),
  getUsageCountTodayForUser: vi.fn(),
  getUsageCountThisMonthForUser: vi.fn(),
  createUsageEvent: vi.fn()
}))

import { PLAN_LIMITS, canAnalyzePrompt, canExportMarkdown, canExportPdf, canUseBatchAudit } from '@/lib/plans/config'

describe('Plan Entitlements Logic', () => {
  it('has correct static limits configured', () => {
    expect(PLAN_LIMITS.free.monthlyAnalyses).toBe(20)
    expect(PLAN_LIMITS.free.dailyAbuseLimit).toBe(5)
    expect(PLAN_LIMITS.free.exportMarkdown).toBe(false)
    expect(PLAN_LIMITS.free.exportPdf).toBe(false)
    
    expect(PLAN_LIMITS.pro.monthlyAnalyses).toBe(500)
    expect(PLAN_LIMITS.pro.dailyAbuseLimit).toBe(100)
    expect(PLAN_LIMITS.pro.exportMarkdown).toBe(true)
    expect(PLAN_LIMITS.pro.exportPdf).toBe(true)
  })

  it('correctly returns export and batch entitlements', () => {
    expect(canExportMarkdown('free')).toBe(false)
    expect(canExportMarkdown('pro')).toBe(true)

    expect(canExportPdf('free')).toBe(false)
    expect(canExportPdf('pro')).toBe(true)

    expect(canUseBatchAudit('free')).toBe(false)
    expect(canUseBatchAudit('pro')).toBe(true)
  })

  describe('canAnalyzePrompt', () => {
    it('allows active analysis when counts are within limits', () => {
      const freeResult = canAnalyzePrompt('free', 10, 2)
      expect(freeResult.allowed).toBe(true)

      const proResult = canAnalyzePrompt('pro', 400, 50)
      expect(proResult.allowed).toBe(true)
    })

    it('blocks free users when daily limit is reached', () => {
      const result = canAnalyzePrompt('free', 10, 5)
      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('daily_abuse_limit_reached')
      expect(result.limit).toBe(5)
    })

    it('blocks free users when monthly limit is reached', () => {
      const result = canAnalyzePrompt('free', 20, 2)
      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('monthly_limit_reached')
      expect(result.limit).toBe(20)
    })

    it('blocks pro users when daily limit is reached', () => {
      const result = canAnalyzePrompt('pro', 400, 100)
      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('daily_abuse_limit_reached')
      expect(result.limit).toBe(100)
    })

    it('blocks pro users when monthly limit is reached', () => {
      const result = canAnalyzePrompt('pro', 500, 50)
      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('monthly_limit_reached')
      expect(result.limit).toBe(500)
    })
  })
})
