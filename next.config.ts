import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {},
  poweredByHeader: false,
  async headers() {
    const isProd = process.env.NODE_ENV === 'production'
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseWsUrl = supabaseUrl.replace(/^http/, 'ws')

    const cspDirectives = [
      "default-src 'self'",
      // Next.js Turbopack (and the App Router) injects inline bootstrap scripts during hydration.
      // A static CSP header without 'unsafe-inline' blocks all of them, breaking client components.
      // The correct long-term fix is a nonce-based CSP via custom middleware (Next.js docs §CSP).
      // For this MVP, 'unsafe-inline' is the documented workaround. Remove once nonce flow is wired.
      isProd ? "script-src 'self' 'unsafe-inline'" : "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self'",
      "img-src 'self' data: blob:",
      `connect-src 'self'${supabaseUrl ? ` ${supabaseUrl} ${supabaseWsUrl}` : ''}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests"
    ]

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'Content-Security-Policy',
            value: cspDirectives.join('; ')
          }
        ]
      }
    ]
  }
}

export default nextConfig

