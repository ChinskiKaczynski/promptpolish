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
      isProd 
        ? "script-src 'self' 'unsafe-inline' https://js.stripe.com https://challenges.cloudflare.com" 
        : "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self'",
      "img-src 'self' data: blob:",
      `connect-src 'self' https://api.stripe.com https://challenges.cloudflare.com${supabaseUrl ? ` ${supabaseUrl} ${supabaseWsUrl}` : ''}`,
      "frame-src 'self' https://js.stripe.com https://challenges.cloudflare.com",
      "frame-ancestors 'none'",
      "object-src 'none'",
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

