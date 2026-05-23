import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

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
    process.env.NODE_ENV = 'development'
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY
    delete process.env.SUPABASE_SECRET_KEY
    
    const result = checkProductionEnv()
    expect(result.valid).toBe(true)
    expect(result.missing).toHaveLength(0)
  })

  it('fails validation in production if critical keys are missing', () => {
    process.env.NODE_ENV = 'production'
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY
    delete process.env.SUPABASE_SECRET_KEY
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

    const result = checkProductionEnv()
    expect(result.valid).toBe(false)
    expect(result.missing).toContain('GOOGLE_GENERATIVE_AI_API_KEY')
    expect(result.missing).toContain('SUPABASE_SECRET_KEY')
    expect(result.missing).toContain('NEXT_PUBLIC_SUPABASE_URL')
    expect(result.missing).toContain('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
  })

  it('passes validation in production when all critical keys are present', () => {
    process.env.NODE_ENV = 'production'
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-key'
    process.env.SUPABASE_SECRET_KEY = 'test-secret'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-pub-key'
    process.env.STRIPE_SECRET_KEY = 'sk_test_key'
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_key'
    process.env.STRIPE_PRICE_ID_PRO = 'price_pro'

    const result = checkProductionEnv()
    expect(result.valid).toBe(true)
    expect(result.missing).toHaveLength(0)
  })

  it('exposes only NEXT_PUBLIC values on clientEnv', () => {
    expect(clientEnv).toHaveProperty('NEXT_PUBLIC_SUPABASE_URL')
    expect(clientEnv).toHaveProperty('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
    expect(clientEnv).toHaveProperty('NEXT_PUBLIC_ENABLE_MOCK_RESULT')
    
    // Server secrets should never be exposed
    expect(clientEnv).not.toHaveProperty('GOOGLE_GENERATIVE_AI_API_KEY')
    expect(clientEnv).not.toHaveProperty('SUPABASE_SECRET_KEY')
  })
})
