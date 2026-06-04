import { describe, expect, it } from 'vitest'
import nextConfig from '../../next.config'

describe('Global Security Headers Configuration', () => {
  it('defines all required security headers in next.config.ts', async () => {
    expect(nextConfig.headers).toBeDefined()
    if (!nextConfig.headers) return

    const headersConfig = await nextConfig.headers()
    expect(headersConfig).toBeInstanceOf(Array)
    expect(headersConfig.length).toBeGreaterThan(0)

    const routeHeaders = headersConfig[0]
    expect(routeHeaders.source).toBe('/(.*)')

    const globalHeaders = routeHeaders.headers
    expect(globalHeaders).toBeInstanceOf(Array)

    const headerKeys = globalHeaders.map((h: { key: string }) => h.key)

    expect(headerKeys).toContain('X-Frame-Options')
    expect(headerKeys).toContain('X-Content-Type-Options')
    expect(headerKeys).toContain('Referrer-Policy')
    expect(headerKeys).toContain('Permissions-Policy')
    expect(headerKeys).toContain('X-XSS-Protection')
    expect(headerKeys).toContain('Strict-Transport-Security')
    expect(headerKeys).toContain('Content-Security-Policy')

    // Validate frame-ancestors block
    const csp = globalHeaders.find((h: { key: string }) => h.key === 'Content-Security-Policy')
    expect(csp).toBeDefined()
    expect(csp?.value).toContain("default-src 'self'")
    expect(csp?.value).toContain("frame-ancestors 'none'")

    // Validate framing protection
    const xframe = globalHeaders.find((h: { key: string }) => h.key === 'X-Frame-Options')
    expect(xframe?.value).toBe('DENY')

    // Validate XSS protection
    const xss = globalHeaders.find((h: { key: string }) => h.key === 'X-XSS-Protection')
    expect(xss?.value).toBe('1; mode=block')
  })
})
