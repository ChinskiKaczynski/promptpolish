import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { config, proxy } from '@/proxy'

describe('Middleware Matcher & Routing Security Suite', () => {
  describe('Matcher Configuration Patterns', () => {
    const matcherPattern = config.matcher[0]
    // Convert Next.js lookahead matcher to a JS RegExp
    // The matcher is: /((?!_next/static|_next/image|favicon.ico|api/webhooks|api/cron).*)
    const regexStr = matcherPattern.replace('(.*)', '$')
    const regex = new RegExp(`^${regexStr}`)

    const shouldMatch = (path: string) => regex.test(path)

    it('should match browser-facing routes and browser-owned API routes', () => {
      expect(shouldMatch('/analyze')).toBe(true)
      expect(shouldMatch('/pricing')).toBe(true)
      expect(shouldMatch('/history')).toBe(true)
      expect(shouldMatch('/account')).toBe(true)
      expect(shouldMatch('/result/some-uuid-123')).toBe(true)
      expect(shouldMatch('/api/analyze')).toBe(true)
      expect(shouldMatch('/api/feedback')).toBe(true)
      expect(shouldMatch('/api/share')).toBe(true)
      expect(shouldMatch('/api/auth/session')).toBe(true)
    })

    it('should NOT match static assets, webhooks, or cron routes', () => {
      expect(shouldMatch('/_next/static/chunks/main.js')).toBe(false)
      expect(shouldMatch('/_next/image?url=foo')).toBe(false)
      expect(shouldMatch('/favicon.ico')).toBe(false)
      expect(shouldMatch('/api/webhooks/stripe')).toBe(false)
      expect(shouldMatch('/api/cron/cleanup')).toBe(false)
    })
  })

  describe('Middleware Runtime Bypass', () => {
    it('bypasses /api/webhooks/stripe requests and sets no cookies', async () => {
      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({ event: 'test' }),
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'sig_123'
        }
      })
      const response = await proxy(request)
      // Assert that no cookies are modified/set on the response
      expect(response.headers.get('set-cookie')).toBeNull()
    })

    it('bypasses /api/cron/cleanup requests and sets no cookies', async () => {
      const request = new NextRequest('http://localhost/api/cron/cleanup', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-secret'
        }
      })
      const response = await proxy(request)
      // Assert that no cookies are modified/set on the response
      expect(response.headers.get('set-cookie')).toBeNull()
    })

    it('does NOT bypass browser routes (e.g. /analyze) and provisions cookies', async () => {
      const request = new NextRequest('http://localhost/analyze')
      const response = await proxy(request)
      // Assert that cookie generation is triggered
      expect(response.headers.get('set-cookie')).not.toBeNull()
      expect(response.cookies.get('owner_anonymous_id')).toBeDefined()
    })
  })
})
