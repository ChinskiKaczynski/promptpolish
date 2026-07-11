import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fakeStripeSecretKey } from '../helpers/fake-secrets'

// Mock 'server-only' so it does not crash when run inside Vitest test environment
vi.mock('server-only', () => ({}))

import { checkProductionEnv } from '@/lib/env/server'
import { clientEnv } from '@/lib/env/client'

describe('Production Readiness Env Safeguards', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('allows empty keys in non-production environments', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const env = process.env as any
    env.NODE_ENV = 'development'
    delete env.GOOGLE_GENERATIVE_AI_API_KEY
    delete env.SUPABASE_SECRET_KEY
    
    const result = checkProductionEnv()
    expect(result.valid).toBe(true)
    expect(result.missing).toHaveLength(0)
  })

  it('fails validation in production if critical keys are missing', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const env = process.env as any
    env.NODE_ENV = 'production'
    delete env.GOOGLE_GENERATIVE_AI_API_KEY
    delete env.SUPABASE_SECRET_KEY
    delete env.NEXT_PUBLIC_SUPABASE_URL
    delete env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    delete env.COOKIE_SIGNING_SECRET

    const result = checkProductionEnv()
    expect(result.valid).toBe(false)
    expect(result.missing).toContain('GOOGLE_GENERATIVE_AI_API_KEY')
    expect(result.missing).toContain('SUPABASE_SECRET_KEY')
    expect(result.missing).toContain('NEXT_PUBLIC_SUPABASE_URL')
    expect(result.missing).toContain('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
    expect(result.missing).toContain('COOKIE_SIGNING_SECRET')
  })

  it('fails validation in production if COOKIE_SIGNING_SECRET is too short', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const env = process.env as any
    env.NODE_ENV = 'production'
    env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-google-key'
    env.SUPABASE_SECRET_KEY = 'test-secret'
    env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-pub-key'
    env.STRIPE_SECRET_KEY = fakeStripeSecretKey('test')
    env.STRIPE_WEBHOOK_SECRET = 'whsec_key'
    env.STRIPE_PRICE_ID_PRO = 'price_pro'
    env.RATE_LIMIT_HMAC_SECRET = 'test-hmac-secret-key'
    env.COOKIE_SIGNING_SECRET = 'too-short-123'

    const result = checkProductionEnv()
    expect(result.valid).toBe(false)
    expect(result.missing).toContain('COOKIE_SIGNING_SECRET')
    expect(result.error).toContain('COOKIE_SIGNING_SECRET jest zbyt krótki')
  })

  it('passes validation in production when all critical keys are present', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const env = process.env as any
    env.NODE_ENV = 'production'
    env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-google-key'
    env.SUPABASE_SECRET_KEY = 'test-secret'
    env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-pub-key'
    env.STRIPE_SECRET_KEY = fakeStripeSecretKey('test')
    env.STRIPE_WEBHOOK_SECRET = 'whsec_key'
    env.STRIPE_PRICE_ID_PRO = 'price_pro'
    env.RATE_LIMIT_HMAC_SECRET = 'test-hmac-secret-key'
    env.COOKIE_SIGNING_SECRET = 'super-secure-cookie-signing-secret-key-32chars'

    const result = checkProductionEnv()
    expect(result.valid).toBe(true)
    expect(result.missing).toHaveLength(0)
  })

  it('exposes only NEXT_PUBLIC values on clientEnv', () => {
    expect(clientEnv).toHaveProperty('NEXT_PUBLIC_SUPABASE_URL')
    expect(clientEnv).toHaveProperty('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
    expect(clientEnv).toHaveProperty('NEXT_PUBLIC_ENABLE_MOCK_RESULT')
    
    // Server secrets should never be exposed
    expect(clientEnv).not.toHaveProperty('OPENROUTER_API_KEY')
    expect(clientEnv).not.toHaveProperty('SUPABASE_SECRET_KEY')
  })
})
