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

describe('Data Retention & Deletion Lifecycle Engine', () => {
  const mockRpc = vi.fn()

  const mockSupabaseClient = {
    rpc: mockRpc
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    vi.mocked(getSupabaseAdminClient).mockReturnValue(
      mockSupabaseClient as unknown as ReturnType<typeof getSupabaseAdminClient>
    )

    // Set up default positive env values
    serverEnv.RETENTION_ANONYMOUS_ANALYSIS_DAYS = 30
    serverEnv.RETENTION_USAGE_EVENT_DAYS = 90
    serverEnv.RETENTION_FEEDBACK_EVENT_DAYS = 180
  })

  describe('Dry-Run Mode (Preview Mode)', () => {
    it('queries and returns deletion counts without invoking any delete operations', async () => {
      mockRpc.mockResolvedValue({
        data: {
          dryRun: true,
          promptAnalysesDeleted: 12,
          usageEventsDeleted: 45,
          feedbackEventsDeleted: 3
        },
        error: null
      })

      const result = await runRetentionCleanup({ dryRun: true })

      expect(result).toEqual({
        dryRun: true,
        promptAnalysesDeleted: 12,
        usageEventsDeleted: 45,
        feedbackEventsDeleted: 3
      })

      expect(mockRpc).toHaveBeenCalledWith('run_retention_cleanup', expect.objectContaining({
        p_dry_run: true
      }))
    })

    it('gracefully throws if any DB query fails during count fetching', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Supabase select failed' }
      })

      await expect(runRetentionCleanup({ dryRun: true })).rejects.toThrow(
        'Database error: Supabase select failed'
      )
    })
  })

  describe('Active Delete Mode (Permanent Purge)', () => {
    it('executes deletions on expired records and returns number of deleted rows', async () => {
      mockRpc.mockResolvedValue({
        data: {
          dryRun: false,
          promptAnalysesDeleted: 2,
          usageEventsDeleted: 3,
          feedbackEventsDeleted: 1
        },
        error: null
      })

      const result = await runRetentionCleanup({ dryRun: false })

      expect(result).toEqual({
        dryRun: false,
        promptAnalysesDeleted: 2,
        usageEventsDeleted: 3,
        feedbackEventsDeleted: 1
      })

      expect(mockRpc).toHaveBeenCalledWith('run_retention_cleanup', expect.objectContaining({
        p_dry_run: false
      }))
    })

    it('gracefully throws if deletion fails on any table', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Database constraint violation' }
      })

      await expect(runRetentionCleanup({ dryRun: false })).rejects.toThrow(
        'Database error: Database constraint violation'
      )
    })
  })
})
