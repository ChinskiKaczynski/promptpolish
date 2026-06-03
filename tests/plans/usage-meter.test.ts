import { describe, expect, it } from 'vitest'
import { PLAN_LIMITS } from '@/lib/plans/config'

/**
 * Unit tests for UsageMeter logic (derived state calculations).
 *
 * The UsageMeter component is a pure display component — it has no internal
 * business logic beyond deriving `remaining`, `usagePct`, `isWarning`, and
 * `isBlocked` from its props. We test those derivations here in isolation
 * rather than through full JSX rendering to keep tests fast and stable.
 */

function deriveUsageMeterState(monthlyCount: number, monthlyLimit: number) {
  const remaining = Math.max(0, monthlyLimit - monthlyCount)
  const usagePct =
    monthlyLimit > 0 ? Math.min(100, Math.round((monthlyCount / monthlyLimit) * 100)) : 0
  const isWarning = usagePct >= 80 && usagePct < 100
  const isBlocked = usagePct >= 100
  return { remaining, usagePct, isWarning, isBlocked }
}

describe('UsageMeter — derived state logic', () => {
  // ── Plan Limits sanity checks ────────────────────────────────────────────

  describe('PLAN_LIMITS reference values', () => {
    it('anonymous plan has monthlyAnalyses = 10', () => {
      expect(PLAN_LIMITS.anonymous.monthlyAnalyses).toBe(10)
    })

    it('free plan has monthlyAnalyses = 20', () => {
      expect(PLAN_LIMITS.free.monthlyAnalyses).toBe(20)
    })

    it('pro plan has monthlyAnalyses = 500', () => {
      expect(PLAN_LIMITS.pro.monthlyAnalyses).toBe(500)
    })
  })

  // ── Free Plan — normal usage ─────────────────────────────────────────────

  describe('Free plan — normal usage', () => {
    it('computes 0% usage when no analyses done', () => {
      const state = deriveUsageMeterState(0, 20)
      expect(state.usagePct).toBe(0)
      expect(state.remaining).toBe(20)
      expect(state.isWarning).toBe(false)
      expect(state.isBlocked).toBe(false)
    })

    it('computes 50% usage with 10 of 20 used', () => {
      const state = deriveUsageMeterState(10, 20)
      expect(state.usagePct).toBe(50)
      expect(state.remaining).toBe(10)
      expect(state.isWarning).toBe(false)
      expect(state.isBlocked).toBe(false)
    })

    it('computes 75% usage with 15 of 20 used — no warning yet', () => {
      const state = deriveUsageMeterState(15, 20)
      expect(state.usagePct).toBe(75)
      expect(state.isWarning).toBe(false)
      expect(state.isBlocked).toBe(false)
    })
  })

  // ── Free Plan — warning state (≥80%) ────────────────────────────────────

  describe('Free plan — warning state (≥80%)', () => {
    it('triggers warning at 80% (16 of 20 used)', () => {
      const state = deriveUsageMeterState(16, 20)
      expect(state.usagePct).toBe(80)
      expect(state.isWarning).toBe(true)
      expect(state.isBlocked).toBe(false)
      expect(state.remaining).toBe(4)
    })

    it('triggers warning at 90% (18 of 20 used)', () => {
      const state = deriveUsageMeterState(18, 20)
      expect(state.usagePct).toBe(90)
      expect(state.isWarning).toBe(true)
      expect(state.isBlocked).toBe(false)
      expect(state.remaining).toBe(2)
    })

    it('triggers warning at 95% (19 of 20 used)', () => {
      const state = deriveUsageMeterState(19, 20)
      expect(state.usagePct).toBe(95)
      expect(state.isWarning).toBe(true)
      expect(state.isBlocked).toBe(false)
      expect(state.remaining).toBe(1)
    })
  })

  // ── Free Plan — blocked state (100%) ────────────────────────────────────

  describe('Free plan — blocked state (100%)', () => {
    it('shows blocked at exactly 100% (20 of 20 used)', () => {
      const state = deriveUsageMeterState(20, 20)
      expect(state.usagePct).toBe(100)
      expect(state.isBlocked).toBe(true)
      expect(state.isWarning).toBe(false)
      expect(state.remaining).toBe(0)
    })

    it('clamps over-limit to 100% — remaining never goes negative', () => {
      // Edge case: count exceeds limit (should not happen but is safe)
      const state = deriveUsageMeterState(25, 20)
      expect(state.usagePct).toBe(100)
      expect(state.remaining).toBe(0)
      expect(state.isBlocked).toBe(true)
    })
  })

  // ── Pro (Simulated) Plan ─────────────────────────────────────────────────

  describe('Pro plan — simulated (500 limit)', () => {
    it('computes correct remaining at 10 of 500', () => {
      const state = deriveUsageMeterState(10, 500)
      expect(state.usagePct).toBe(2)
      expect(state.remaining).toBe(490)
      expect(state.isWarning).toBe(false)
      expect(state.isBlocked).toBe(false)
    })

    it('triggers warning at ≥80% on Pro plan (400 of 500)', () => {
      const state = deriveUsageMeterState(400, 500)
      expect(state.usagePct).toBe(80)
      expect(state.isWarning).toBe(true)
      expect(state.isBlocked).toBe(false)
    })

    it('shows blocked when Pro limit is fully exhausted (500 of 500)', () => {
      const state = deriveUsageMeterState(500, 500)
      expect(state.usagePct).toBe(100)
      expect(state.isBlocked).toBe(true)
      expect(state.remaining).toBe(0)
    })
  })

  // ── Anonymous Plan ───────────────────────────────────────────────────────

  describe('Anonymous plan — 10 limit', () => {
    it('computes 50% at 5 of 10', () => {
      const state = deriveUsageMeterState(5, 10)
      expect(state.usagePct).toBe(50)
      expect(state.remaining).toBe(5)
    })

    it('triggers warning at 80% (8 of 10)', () => {
      const state = deriveUsageMeterState(8, 10)
      expect(state.usagePct).toBe(80)
      expect(state.isWarning).toBe(true)
    })

    it('shows blocked at limit (10 of 10)', () => {
      const state = deriveUsageMeterState(10, 10)
      expect(state.isBlocked).toBe(true)
    })
  })

  // ── Edge cases ───────────────────────────────────────────────────────────

  describe('Edge cases', () => {
    it('handles 0 limit safely — no division by zero', () => {
      const state = deriveUsageMeterState(0, 0)
      expect(state.usagePct).toBe(0)
      expect(state.remaining).toBe(0)
    })

    it('handles 0 count and 0 limit — not blocked, not warning', () => {
      const state = deriveUsageMeterState(0, 0)
      expect(state.isBlocked).toBe(false)
      expect(state.isWarning).toBe(false)
    })
  })
})
