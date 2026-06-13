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

    // Validate X-Content-Type-Options value
    const xcto = globalHeaders.find((h: { key: string }) => h.key === 'X-Content-Type-Options')
    expect(xcto?.value).toBe('nosniff')

    // Validate Referrer-Policy
    const refPolicy = globalHeaders.find((h: { key: string }) => h.key === 'Referrer-Policy')
    expect(refPolicy?.value).toBe('strict-origin-when-cross-origin')

    // Validate HSTS presence
    const hsts = globalHeaders.find((h: { key: string }) => h.key === 'Strict-Transport-Security')
    expect(hsts?.value).toContain('max-age=')
    expect(hsts?.value).toContain('includeSubDomains')

    // Validate frame-ancestors block
    const csp = globalHeaders.find((h: { key: string }) => h.key === 'Content-Security-Policy')
    expect(csp).toBeDefined()
    expect(csp?.value).toContain("default-src 'self'")
    expect(csp?.value).toContain("frame-ancestors 'none'")
    expect(csp?.value).toContain("base-uri 'self'")
    expect(csp?.value).toContain("form-action 'self'")

    // Validate no broad wildcard for scripts or frames
    expect(csp?.value).not.toContain("script-src *")
    expect(csp?.value).not.toContain("frame-src *")

    // script-src must include 'unsafe-inline' (required for Next.js Turbopack inline bootstrap scripts)
    // See: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
    // A nonce-based CSP would be the ideal long-term solution, but requires custom middleware.
    // For this MVP, 'unsafe-inline' is the documented workaround.
    expect(csp?.value).toContain("'unsafe-inline'")
    expect(csp?.value).toContain("script-src")

    // Validate framing protection
    const xframe = globalHeaders.find((h: { key: string }) => h.key === 'X-Frame-Options')
    expect(xframe?.value).toBe('DENY')

    // Validate XSS protection
    const xss = globalHeaders.find((h: { key: string }) => h.key === 'X-XSS-Protection')
    expect(xss?.value).toBe('1; mode=block')

    // Validate Permissions-Policy restricts sensitive hardware
    const perm = globalHeaders.find((h: { key: string }) => h.key === 'Permissions-Policy')
    expect(perm?.value).toContain('camera=()')
    expect(perm?.value).toContain('microphone=()')
    expect(perm?.value).toContain('geolocation=()')
  })
})
