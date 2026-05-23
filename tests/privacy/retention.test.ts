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

// 3. Mock serverEnv to ensure predictable configured retention limits
vi.mock('@/lib/env/server', () => ({
  serverEnv: {
    RETENTION_ANONYMOUS_ANALYSIS_DAYS: 30,
    RETENTION_USAGE_EVENT_DAYS: 90,
    RETENTION_FEEDBACK_EVENT_DAYS: 180,
    CRON_SECRET: 'test-cron-secret'
  }
}))

describe('Data Retention & Deletion Lifecycle Engine', () => {
  const mockFrom = vi.fn()
  const mockSelect = vi.fn()
  const mockDelete = vi.fn()
  const mockEq = vi.fn()
  const mockLt = vi.fn()

  const mockSupabaseClient = {
    from: mockFrom
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getSupabaseAdminClient).mockReturnValue(mockSupabaseClient as any)

    // Reset standard builder chain functions
    mockFrom.mockReturnValue({
      select: mockSelect,
      delete: mockDelete
    })
  })

  describe('Dry-Run Mode (Preview Mode)', () => {
    it('queries and returns deletion counts without invoking any delete operations', async () => {
      // Mock the builder chain for dry run counts
      const mockChain = {
        eq: mockEq,
        lt: mockLt
      }
      mockSelect.mockReturnValue(mockChain)
      mockEq.mockReturnValue(mockChain)
      
      // Setup mock return counts for each table
      mockLt.mockImplementation(async (col, val) => {
        // Find which table is being queried by checking the last from() call
        const lastTable = mockFrom.mock.calls[mockFrom.mock.calls.length - 1]?.[0]
        if (lastTable === 'prompt_analyses') {
          return { count: 12, error: null }
        } else if (lastTable === 'usage_events') {
          return { count: 45, error: null }
        } else if (lastTable === 'feedback_events') {
          return { count: 3, error: null }
        }
        return { count: 0, error: null }
      })

      const result = await runRetentionCleanup({ dryRun: true })

      // Assert result counts match our mocked tables
      expect(result).toEqual({
        dryRun: true,
        promptAnalysesDeleted: 12,
        usageEventsDeleted: 45,
        feedbackEventsDeleted: 3
      })

      // Verify no delete method was ever called
      expect(mockDelete).not.toHaveBeenCalled()
      expect(mockFrom).toHaveBeenCalledWith('prompt_analyses')
      expect(mockFrom).toHaveBeenCalledWith('usage_events')
      expect(mockFrom).toHaveBeenCalledWith('feedback_events')

      // Verify the correct filters were applied for prompt analyses
      expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true })
      expect(mockEq).toHaveBeenCalledWith('is_share_enabled', false)
      expect(mockLt).toHaveBeenCalled()
    })

    it('gracefully throws if any DB query fails during count fetching', async () => {
      const mockChain = {
        eq: mockEq,
        lt: mockLt
      }
      mockSelect.mockReturnValue(mockChain)
      mockEq.mockReturnValue(mockChain)
      mockLt.mockResolvedValue({
        count: null,
        error: { message: 'Supabase select failed' }
      })

      await expect(runRetentionCleanup({ dryRun: true })).rejects.toThrow(
        'Dry run failed for prompt analyses: Supabase select failed'
      )
    })
  })

  describe('Active Delete Mode (Permanent Purge)', () => {
    it('executes deletions on expired unshared analyses, usage events, and feedback events', async () => {
      // Mock the builder chain for delete operations
      const mockChain = {
        eq: mockEq,
        lt: mockLt
      }
      mockDelete.mockReturnValue(mockChain)
      mockEq.mockReturnValue(mockChain)

      // Setup simulated select('id') deletes resolving to deleted arrays
      mockLt.mockImplementation((col, val) => {
        const lastTable = mockFrom.mock.calls[mockFrom.mock.calls.length - 1]?.[0]
        let data: Array<{ id: string }> = []
        if (lastTable === 'prompt_analyses') {
          data = [{ id: 'a1' }, { id: 'a2' }]
        } else if (lastTable === 'usage_events') {
          data = [{ id: 'u1' }, { id: 'u2' }, { id: 'u3' }]
        } else if (lastTable === 'feedback_events') {
          data = [{ id: 'f1' }]
        }

        return {
          select: vi.fn().mockResolvedValue({
            data,
            error: null
          })
        }
      })

      const result = await runRetentionCleanup({ dryRun: false })

      // Assert deletion counts
      expect(result).toEqual({
        dryRun: false,
        promptAnalysesDeleted: 2,
        usageEventsDeleted: 3,
        feedbackEventsDeleted: 1
      })

      // Verify delete operations were called
      expect(mockDelete).toHaveBeenCalledTimes(3)
      expect(mockEq).toHaveBeenCalledWith('is_share_enabled', false)
      expect(mockLt).toHaveBeenCalledTimes(3)
    })

    it('gracefully throws if deletion fails on any table', async () => {
      const mockChain = {
        eq: mockEq,
        lt: mockLt
      }
      mockDelete.mockReturnValue(mockChain)
      mockEq.mockReturnValue(mockChain)
      
      mockLt.mockImplementation((col, val) => {
        return {
          select: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database constraint violation' }
          })
        }
      })

      await expect(runRetentionCleanup({ dryRun: false })).rejects.toThrow(
        'Failed to delete expired prompt analyses: Database constraint violation'
      )
    })
  })
})
