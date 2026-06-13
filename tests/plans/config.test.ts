import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/supabase/queries', () => ({
  getUserProfile: vi.fn()
}))

import {
  PLAN_LIMITS,
  canAnalyzePrompt,
  canExportMarkdown,
  canExportText,
  canExportPdf,
  canShare,
  canUseBatchAudit,
  getPlanSlugForUser
} from '@/lib/plans/config'
import { getUserProfile } from '@/lib/supabase/queries'
import type { UserProfileRow } from '@/lib/supabase/types'

describe('Plans Configuration and Capability Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Canonical Limits (PLAN_LIMITS)', () => {
    it('correctly configures the anonymous plan capabilities', () => {
      const anon = PLAN_LIMITS.anonymous
      expect(anon.slug).toBe('anonymous')
      expect(anon.monthlyAnalyses).toBe(10)
      expect(anon.dailyAnalyses).toBe(3)
      expect(anon.maxPromptChars).toBe(12000)
      expect(anon.exportMarkdown).toBe(true)
      expect(anon.exportText).toBe(true)
      expect(anon.exportPdf).toBe(false)
      expect(anon.shareResult).toBe(true)
      expect(anon.batchAudit).toBe(false)
    })

    it('correctly configures the free plan capabilities', () => {
      const free = PLAN_LIMITS.free
      expect(free.slug).toBe('free')
      expect(free.monthlyAnalyses).toBe(20)
      expect(free.dailyAnalyses).toBe(5)
      expect(free.maxPromptChars).toBe(12000)
      expect(free.exportMarkdown).toBe(true)
      expect(free.exportText).toBe(true)
      expect(free.exportPdf).toBe(false)
      expect(free.shareResult).toBe(true)
      expect(free.batchAudit).toBe(false)
    })

    it('correctly configures the pro plan capabilities', () => {
      const pro = PLAN_LIMITS.pro
      expect(pro.slug).toBe('pro')
      expect(pro.monthlyAnalyses).toBe(500)
      expect(pro.dailyAnalyses).toBe(100)
      expect(pro.maxPromptChars).toBe(24000)
      expect(pro.exportMarkdown).toBe(true)
      expect(pro.exportText).toBe(true)
      expect(pro.exportPdf).toBe(true)
      expect(pro.shareResult).toBe(true)
      expect(pro.batchAudit).toBe(false)
    })
  })

  describe('Check Analyze Prompt Limit (canAnalyzePrompt)', () => {
    it('allows prompt analysis when counts are within limit boundaries', () => {
      const result = canAnalyzePrompt('anonymous', 2, 1)
      expect(result.allowed).toBe(true)
    })

    it('blocks and reports daily abuse limit hit', () => {
      const result = canAnalyzePrompt('anonymous', 1, 3)
      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('daily_abuse_limit_reached')
      expect(result.limit).toBe(3)
    })

    it('blocks and reports monthly limit hit', () => {
      const result = canAnalyzePrompt('free', 20, 2)
      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('monthly_limit_reached')
      expect(result.limit).toBe(20)
    })
  })

  describe('Export Entitlements Checkers', () => {
    it('verifies canExportMarkdown behaves according to contract', () => {
      expect(canExportMarkdown('anonymous')).toBe(true)
      expect(canExportMarkdown('free')).toBe(true)
      expect(canExportMarkdown('pro')).toBe(true)
    })

    it('verifies canExportText behaves according to contract', () => {
      expect(canExportText('anonymous')).toBe(true)
      expect(canExportText('free')).toBe(true)
      expect(canExportText('pro')).toBe(true)
    })

    it('verifies canExportPdf behaves according to contract', () => {
      expect(canExportPdf('anonymous')).toBe(false)
      expect(canExportPdf('free')).toBe(false)
      expect(canExportPdf('pro')).toBe(true)
    })
  })

  describe('Share Entitlements Checkers', () => {
    it('verifies canShare behaves according to contract', () => {
      expect(canShare('anonymous')).toBe(true)
      expect(canShare('free')).toBe(true)
      expect(canShare('pro')).toBe(true)
    })
  })

  describe('Batch Audit Checker', () => {
    it('verifies canUseBatchAudit is false for all plans', () => {
      expect(canUseBatchAudit('anonymous')).toBe(false)
      expect(canUseBatchAudit('free')).toBe(false)
      expect(canUseBatchAudit('pro')).toBe(false)
    })
  })

  describe('User Plan Resolution (getPlanSlugForUser)', () => {
    it('resolves anonymous plan slug when user ID is null', async () => {
      const result = await getPlanSlugForUser(null)
      expect(result).toBe('anonymous')
      expect(getUserProfile).not.toHaveBeenCalled()
    })

    it('resolves pro plan slug when database profile is pro', async () => {
      vi.mocked(getUserProfile).mockResolvedValue({ plan_slug: 'pro' } as unknown as UserProfileRow)
      const result = await getPlanSlugForUser('user-id-1')
      expect(result).toBe('pro')
      expect(getUserProfile).toHaveBeenCalledWith('user-id-1')
    })

    it('resolves free plan slug when database profile is free', async () => {
      vi.mocked(getUserProfile).mockResolvedValue({ plan_slug: 'free' } as unknown as UserProfileRow)
      const result = await getPlanSlugForUser('user-id-2')
      expect(result).toBe('free')
      expect(getUserProfile).toHaveBeenCalledWith('user-id-2')
    })

    it('falls back to free plan slug when database profile lookup returns null', async () => {
      vi.mocked(getUserProfile).mockResolvedValue(null)
      const result = await getPlanSlugForUser('user-id-3')
      expect(result).toBe('free')
    })

    it('falls back to free plan slug when database profile plan slug is unknown', async () => {
      vi.mocked(getUserProfile).mockResolvedValue({ plan_slug: 'custom-unrecognized' } as unknown as UserProfileRow)
      const result = await getPlanSlugForUser('user-id-4')
      expect(result).toBe('free')
    })
  })
})
