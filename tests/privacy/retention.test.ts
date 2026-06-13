import { describe, expect, it, vi, beforeEach } from 'vitest'

// 1. Mock server-only since it doesn't resolve in Node/Vitest
vi.mock('server-only', () => ({}))

import { runRetentionCleanup } from '@/lib/privacy/retention'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { serverEnv } from '@/lib/env/server'

// 2. Mock getSupabaseAdminClient
vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdminClient: vi.fn()
}))

// 3. Mock serverEnv with default mock values
vi.mock('@/lib/env/server', () => ({
  serverEnv: {
    RETENTION_ANONYMOUS_ANALYSIS_DAYS: 30,
    RETENTION_USAGE_EVENT_DAYS: 90,
    RETENTION_FEEDBACK_EVENT_DAYS: 180,
    CRON_SECRET: 'test-cron-secret'
  }
}))

interface MockChain {
  tableName: string
  calls: string[]
  shouldFail: boolean
  errorMessage: string
  resultValue: unknown
  delete: () => MockChain
  select: (projection?: string, options?: unknown) => MockChain
  is: (column: string, value: unknown) => MockChain
  eq: (column: string, value: unknown) => MockChain
  lt: (column: string, value: unknown) => MockChain
  then: (onfulfilled?: (value: unknown) => unknown, onrejected?: (reason: unknown) => unknown) => Promise<unknown>
}

describe('Data Retention & Deletion Lifecycle Engine', () => {
  const mockFrom = vi.fn()
  let activeChains: MockChain[] = []
  let mockTableResults: Record<string, { count?: number | null, data?: Array<{ id: string }> | null, error?: { message: string } | null }> = {}
  let mockTableShouldFail: Record<string, boolean> = {}

  const mockSupabaseClient = {
    from: mockFrom
  }

  beforeEach(() => {
    vi.clearAllMocks()
    activeChains = []
    mockTableResults = {}
    mockTableShouldFail = {}
    
    vi.mocked(getSupabaseAdminClient).mockReturnValue(
      mockSupabaseClient as unknown as ReturnType<typeof getSupabaseAdminClient>
    )

    // Set up default positive env values
    serverEnv.RETENTION_ANONYMOUS_ANALYSIS_DAYS = 30
    serverEnv.RETENTION_USAGE_EVENT_DAYS = 90
    serverEnv.RETENTION_FEEDBACK_EVENT_DAYS = 180

    // Setup mock fluent chain builder
    mockFrom.mockImplementation((tableName: string) => {
      const chain: MockChain = {
        tableName,
        calls: [],
        shouldFail: false,
        errorMessage: '',
        resultValue: null,
        
        delete: vi.fn().mockImplementation(() => {
          chain.calls.push('delete')
          return chain
        }),
        select: vi.fn().mockImplementation((projection?: string, options?: unknown) => {
          chain.calls.push(`select:${projection ?? '*'}:${JSON.stringify(options ?? '')}`)
          return chain
        }),
        is: vi.fn().mockImplementation((column: string, value: unknown) => {
          chain.calls.push(`is:${column}:${String(value)}`)
          return chain
        }),
        eq: vi.fn().mockImplementation((column: string, value: unknown) => {
          chain.calls.push(`eq:${column}:${String(value)}`)
          return chain
        }),
        lt: vi.fn().mockImplementation((column: string, value: unknown) => {
          chain.calls.push(`lt:${column}:${String(value)}`)
          return chain
        }),
        then: vi.fn().mockImplementation((onfulfilled?: (value: unknown) => unknown, onrejected?: (reason: unknown) => unknown) => {
          const promise = Promise.resolve().then(() => {
            const tableResult = mockTableResults[tableName]
            const shouldFail = mockTableShouldFail[tableName]
            if (shouldFail) {
              return { count: null, data: null, error: { message: tableResult?.error?.message || 'DB Error' } }
            }
            return tableResult || { count: 0, data: [], error: null }
          })
          return promise.then(onfulfilled, onrejected)
        })
      }
      activeChains.push(chain)
      return chain
    })
  })

  describe('Configuration Validation', () => {
    it('throws immediately and prevents cleanup if RETENTION_ANONYMOUS_ANALYSIS_DAYS is negative', async () => {
      serverEnv.RETENTION_ANONYMOUS_ANALYSIS_DAYS = -1
      await expect(runRetentionCleanup()).rejects.toThrow('Invalid configuration')
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it('throws immediately and prevents cleanup if RETENTION_USAGE_EVENT_DAYS is zero', async () => {
      serverEnv.RETENTION_USAGE_EVENT_DAYS = 0
      await expect(runRetentionCleanup()).rejects.toThrow('Invalid configuration')
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it('throws immediately and prevents cleanup if RETENTION_FEEDBACK_EVENT_DAYS is NaN/Infinity', async () => {
      serverEnv.RETENTION_FEEDBACK_EVENT_DAYS = Infinity
      await expect(runRetentionCleanup()).rejects.toThrow('Invalid configuration')
      expect(mockFrom).not.toHaveBeenCalled()
    })
  })

  describe('Dry-Run Mode (Preview Mode)', () => {
    it('queries and returns deletion counts without invoking any delete operations', async () => {
      // Setup mock return counts for dry run (which uses count endpoint returning { count, error })
      mockTableResults['prompt_analyses'] = { count: 12, error: null }
      mockTableResults['usage_events'] = { count: 45, error: null }
      mockTableResults['feedback_events'] = { count: 3, error: null }

      const result = await runRetentionCleanup({ dryRun: true })

      expect(result).toEqual({
        dryRun: true,
        promptAnalysesDeleted: 12,
        usageEventsDeleted: 45,
        feedbackEventsDeleted: 3
      })

      // Ensure no delete calls were added to any chain
      activeChains.forEach(chain => {
        expect(chain.calls).not.toContain('delete')
      })

      expect(activeChains.length).toBe(3)
      const [analysesChain, usageChain, feedbackChain] = activeChains

      // Validate prompt_analyses dry-run query filters
      expect(analysesChain.tableName).toBe('prompt_analyses')
      expect(analysesChain.calls).toContain('select:*:{"count":"exact","head":true}')
      expect(analysesChain.calls).toContain('is:user_id:null')
      expect(analysesChain.calls).toContain('eq:is_favorite:false')
      expect(analysesChain.calls).toContain('eq:is_share_enabled:false')
      expect(analysesChain.calls).toContain('is:deleted_at:null')
      expect(analysesChain.calls.some((c: string) => c.startsWith('lt:created_at:'))).toBe(true)

      // Validate usage_events dry-run query filters
      expect(usageChain.tableName).toBe('usage_events')
      expect(usageChain.calls).toContain('select:*:{"count":"exact","head":true}')
      expect(usageChain.calls.some((c: string) => c.startsWith('lt:created_at:'))).toBe(true)

      // Validate feedback_events dry-run query filters
      expect(feedbackChain.tableName).toBe('feedback_events')
      expect(feedbackChain.calls).toContain('select:*:{"count":"exact","head":true}')
      expect(feedbackChain.calls.some((c: string) => c.startsWith('lt:created_at:'))).toBe(true)
    })

    it('gracefully throws if any DB query fails during count fetching', async () => {
      mockTableShouldFail['prompt_analyses'] = true
      mockTableResults['prompt_analyses'] = { error: { message: 'Supabase select failed' } }

      await expect(runRetentionCleanup({ dryRun: true })).rejects.toThrow(
        'Dry run failed for prompt analyses: Supabase select failed'
      )
    })
  })

  describe('Active Delete Mode (Permanent Purge)', () => {
    it('executes deletions on expired records and returns number of deleted rows', async () => {
      // Active delete returns the list of deleted rows, returning { data: [...], error: null }
      mockTableResults['prompt_analyses'] = { data: [{ id: 'a1' }, { id: 'a2' }], error: null }
      mockTableResults['usage_events'] = { data: [{ id: 'u1' }, { id: 'u2' }, { id: 'u3' }], error: null }
      mockTableResults['feedback_events'] = { data: [{ id: 'f1' }], error: null }

      const result = await runRetentionCleanup({ dryRun: false })

      expect(result).toEqual({
        dryRun: false,
        promptAnalysesDeleted: 2,
        usageEventsDeleted: 3,
        feedbackEventsDeleted: 1
      })

      expect(activeChains.length).toBe(3)
      const [analysesChain, usageChain, feedbackChain] = activeChains

      // Validate deletion calls occurred
      expect(analysesChain.calls).toContain('delete')
      expect(analysesChain.calls).toContain('select:id:""')
      expect(analysesChain.calls).toContain('is:user_id:null')
      expect(analysesChain.calls).toContain('eq:is_favorite:false')
      expect(analysesChain.calls).toContain('eq:is_share_enabled:false')
      expect(analysesChain.calls).toContain('is:deleted_at:null')

      expect(usageChain.calls).toContain('delete')
      expect(usageChain.calls).toContain('select:id:""')

      expect(feedbackChain.calls).toContain('delete')
      expect(feedbackChain.calls).toContain('select:id:""')
    })

    it('gracefully throws if deletion fails on any table', async () => {
      mockTableShouldFail['prompt_analyses'] = true
      mockTableResults['prompt_analyses'] = { error: { message: 'Database constraint violation' } }

      await expect(runRetentionCleanup({ dryRun: false })).rejects.toThrow(
        'Failed to delete expired prompt analyses: Database constraint violation'
      )
    })
  })

  describe('Predicate Consistency', () => {
    it('uses identical predicates for dry-run and active delete modes', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-06-12T12:00:00.000Z'))

      // Setup mock data to prevent throws
      mockTableResults['prompt_analyses'] = { count: 0, data: [], error: null }
      mockTableResults['usage_events'] = { count: 0, data: [], error: null }
      mockTableResults['feedback_events'] = { count: 0, data: [], error: null }

      // Run dry-run first
      await runRetentionCleanup({ dryRun: true })
      const dryRunChainCalls = activeChains[0].calls.filter((c: string) => !c.startsWith('select:'))

      // Reset chains and run active delete
      activeChains = []
      await runRetentionCleanup({ dryRun: false })
      const activeDeleteChainCalls = activeChains[0].calls.filter((c: string) => !c.startsWith('select:') && c !== 'delete')

      // Restore timers
      vi.useRealTimers()

      // The predicates (is, eq, lt) must be identical between the two modes
      expect(dryRunChainCalls).toEqual(activeDeleteChainCalls)
    })
  })
})
