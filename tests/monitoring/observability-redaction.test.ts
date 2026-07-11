import { describe, expect, it } from 'vitest'
import { scrubSensitiveDataForLogs } from '@/lib/monitoring/observability'
import { fakeStripeSecretKey, fakeStripePublishableKey } from '../helpers/fake-secrets'

describe('Observability Log Redactor — scrubSensitiveDataForLogs', () => {
  
  it('scrubs typical environment variable secret declarations', () => {
    const text = 'Config is GEMINI_API_KEY=AIzaSySecretStuffHere and OPENAI_API_KEY = sk-abc123xyz'
    const clean = scrubSensitiveDataForLogs(text)
    expect(clean).toContain('GEMINI_API_KEY=[REDACTED_ENV_SECRET]')
    expect(clean).toMatch(/OPENAI_API_KEY\s*=\s*\[REDACTED_ENV_SECRET\]/)
    expect(clean).not.toContain('AIzaSySecretStuffHere')
    expect(clean).not.toContain('sk-abc123xyz')
  })

  it('scrubs raw Google API keys (AIzaSy...)', () => {
    const text = 'API connection error with key AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q'
    const clean = scrubSensitiveDataForLogs(text)
    expect(clean).toContain('[REDACTED_GEMINI_KEY]')
    expect(clean).not.toContain('AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q')
  })

  it('scrubs OpenAI API keys (sk-...) and project keys (sk-proj-...)', () => {
    const text = 'Failed calling sk-proj-1234567890abcdef1234567890abcdef and sk-1234567890abcdef1234'
    const clean = scrubSensitiveDataForLogs(text)
    expect(clean).toContain('[REDACTED_AI_KEY]')
    expect(clean).not.toContain('sk-proj-')
    expect(clean).not.toContain('sk-1234')
  })

  it('scrubs Stripe secret keys (sk_live_...) and publishable keys (pk_test_...)', () => {
    const fakeLiveSecret = fakeStripeSecretKey('live')
    const fakeTestPub = fakeStripePublishableKey('test')
    const text = `Stripe key ${fakeLiveSecret} or ${fakeTestPub} failed`
    const clean = scrubSensitiveDataForLogs(text)
    expect(clean).toContain('[REDACTED_STRIPE_KEY]')
    expect(clean).not.toContain(fakeLiveSecret)
    expect(clean).not.toContain(fakeTestPub)
  })

  it('scrubs Stripe webhook secrets (whsec_...)', () => {
    const text = 'Secret verification failed for signature whsec_87a9b6c5d4e3f2g1h0j9k8l7m6n5o4p3'
    const clean = scrubSensitiveDataForLogs(text)
    expect(clean).toContain('[REDACTED_STRIPE_WEBHOOK_SECRET]')
    expect(clean).not.toContain('whsec_87')
  })

  it('scrubs GitHub Personal Access Tokens (ghp_... and github_pat_...)', () => {
    const text = 'Using ghp_1234567890abcdef1234567890abcdef1234 or github_pat_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234'
    const clean = scrubSensitiveDataForLogs(text)
    expect(clean).toContain('[REDACTED_GITHUB_PAT]')
    expect(clean).not.toContain('ghp_')
    expect(clean).not.toContain('github_pat_')
  })

  it('scrubs HuggingFace tokens (hf_...)', () => {
    const text = 'HF download failed with token hf_1234567890abcdef1234567890abcdef12'
    const clean = scrubSensitiveDataForLogs(text)
    expect(clean).toContain('[REDACTED_HUGGINGFACE_TOKEN]')
    expect(clean).not.toContain('hf_1234')
  })

  it('scrubs npm tokens (npm_...)', () => {
    const text = 'npm publish token: npm_1234567890abcdef1234567890abcdef1234'
    const clean = scrubSensitiveDataForLogs(text)
    expect(clean).toContain('[REDACTED_NPM_TOKEN]')
    expect(clean).not.toContain('npm_1234')
  })

  it('scrubs Slack tokens (xoxb-... and xoxp-...)', () => {
    const text = 'Post to Slack using xoxb-1234567890-abcdef12345 or xoxp-1234567890-abcdef12345'
    const clean = scrubSensitiveDataForLogs(text)
    expect(clean).toContain('[REDACTED_SLACK_TOKEN]')
    expect(clean).not.toContain('xoxb-')
    expect(clean).not.toContain('xoxp-')
  })

  it('scrubs JWT tokens (eyJ...)', () => {
    const text = 'Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
    const clean = scrubSensitiveDataForLogs(text)
    expect(clean).toContain('[REDACTED_JWT]')
    expect(clean).not.toContain('eyJhbGciOi')
  })

  it('scrubs Database URL passwords', () => {
    const text = 'Database link: postgresql://admin:MySecureP@ssw0rd!123@db-host.supabase.co:5432/postgres'
    const clean = scrubSensitiveDataForLogs(text)
    expect(clean).toContain('postgresql://admin:[REDACTED_DB_PASSWORD]@db-host.supabase.co:5432/postgres')
    expect(clean).not.toContain('MySecureP@ssw0rd')
  })

  it('scrubs Bearer Authorization tokens', () => {
    const text = 'Headers: Authorization: Bearer someSecretTokenStringHere12345'
    const clean = scrubSensitiveDataForLogs(text)
    expect(clean).toContain('Bearer [REDACTED_BEARER_TOKEN]')
    expect(clean).not.toContain('someSecretTokenStringHere12345')
  })

  it('scrubs emails', () => {
    const text = 'Contact support@promptpolish.com for assistance.'
    const clean = scrubSensitiveDataForLogs(text)
    expect(clean).toContain('[REDACTED_EMAIL]')
    expect(clean).not.toContain('support@promptpolish.com')
  })

  it('scrubs credit card numbers', () => {
    const text = 'Payment with card 4111 1111 1111 1111'
    const clean = scrubSensitiveDataForLogs(text)
    expect(clean).toContain('[REDACTED_CARD]')
    expect(clean).not.toContain('4111 1111 1111 1111')
  })

  it('scrubs Errors recursively (message and stack)', () => {
    const fakeLiveSecret = fakeStripeSecretKey('live')
    const originalError = new Error(`Stripe API failed with secret key ${fakeLiveSecret}`)
    const scrubbed = scrubSensitiveDataForLogs(originalError)
    expect(scrubbed).toContain('[Error: Error]')
    expect(scrubbed).toContain('[REDACTED_STRIPE_KEY]')
    expect(scrubbed).not.toContain(fakeLiveSecret)
  })

  it('scrubs objects recursively while handling circular references and depth limits safely', () => {
    const obj: Record<string, unknown> & { circular?: unknown } = {
      user: 'John Doe',
      details: {
        email: 'john@doe.com',
        google_val: 'AIzaSyKey1234567890abcdef123',
        nested: {
          key: 'someSecret',
          deep: {
            deepest: {
              tooDeep: 'value'
            }
          }
        }
      }
    }
    // Create circular reference
    obj.circular = obj

    const scrubbedStr = scrubSensitiveDataForLogs(obj)
    const scrubbed = JSON.parse(scrubbedStr)

    expect(scrubbed.user).toBe('John Doe')
    expect(scrubbed.details.email).toBe('[REDACTED_EMAIL]')
    expect(scrubbed.details.google_val).toBe('[REDACTED_GEMINI_KEY]')
    expect(scrubbed.details.nested.key).toBe('[REDACTED]')
    expect(scrubbed.circular).toBe('[Circular Reference]')
  })
})
