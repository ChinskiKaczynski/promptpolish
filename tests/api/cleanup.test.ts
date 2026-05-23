import { describe, expect, it, vi, beforeEach } from 'vitest'

// Mock server-only since it doesn't resolve in Node/Vitest
vi.mock('server-only', () => ({}))

// Mock the retention engine
vi.mock('@/lib/privacy/retention', () => ({
  runRetentionCleanup: vi.fn()
}))

// Mock env
vi.mock('@/lib/env/server', () => ({
  serverEnv: {
    CRON_SECRET: 'super-secret-cron-token-xyz'
  }
}))

import { GET, POST } from '@/app/api/cron/cleanup/route'
import { runRetentionCleanup } from '@/lib/privacy/retention'

describe('Scheduled Cron Endpoint: /api/cron/cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const makeCronRequest = (url: string, token?: string, method = 'POST') => {
    const headers: Record<string, string> = {}
    if (token !== undefined) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return new Request(url, {
      method,
      headers
    })
  }

  describe('Authentication Boundaries', () => {
    it('returns 401 Unauthorized when Authorization header is completely missing', async () => {
      const request = makeCronRequest('http://localhost/api/cron/cleanup')
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('unauthorized')
      expect(runRetentionCleanup).not.toHaveBeenCalled()
    })

    it('returns 401 Unauthorized when Authorization token does not match CRON_SECRET', async () => {
      const request = makeCronRequest('http://localhost/api/cron/cleanup', 'wrong-token')
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('unauthorized')
      expect(runRetentionCleanup).not.toHaveBeenCalled()
    })
  })

  describe('Successful Cleanup Execution', () => {
    it('executes cleanup in active mode when authorized and query parameter is missing', async () => {
      vi.mocked(runRetentionCleanup).mockResolvedValue({
        dryRun: false,
        promptAnalysesDeleted: 5,
        usageEventsDeleted: 10,
        feedbackEventsDeleted: 2
      })

      const request = makeCronRequest('http://localhost/api/cron/cleanup', 'super-secret-cron-token-xyz')
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.dryRun).toBe(false)
      expect(data.promptAnalysesDeleted).toBe(5)
      expect(runRetentionCleanup).toHaveBeenCalledWith({ dryRun: false })
    })

    it('executes cleanup in dry-run mode when authorized and ?dryRun=true is provided', async () => {
      vi.mocked(runRetentionCleanup).mockResolvedValue({
        dryRun: true,
        promptAnalysesDeleted: 8,
        usageEventsDeleted: 15,
        feedbackEventsDeleted: 4
      })

      const request = makeCronRequest('http://localhost/api/cron/cleanup?dryRun=true', 'super-secret-cron-token-xyz', 'GET')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.dryRun).toBe(true)
      expect(data.promptAnalysesDeleted).toBe(8)
      expect(runRetentionCleanup).toHaveBeenCalledWith({ dryRun: true })
    })
  })

  describe('Error Boundaries', () => {
    it('returns 500 Internal Error when database cleanup throws an error', async () => {
      vi.mocked(runRetentionCleanup).mockRejectedValue(new Error('Supabase outage'))

      const request = makeCronRequest('http://localhost/api/cron/cleanup', 'super-secret-cron-token-xyz')
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('internal_error')
      expect(data.message).toBe('Supabase outage')
    })
  })
})
