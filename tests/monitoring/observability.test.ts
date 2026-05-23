import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  scrubSensitiveData,
  recordProviderError,
  recordStripeWebhookFailure
} from '@/lib/monitoring/observability'

describe('Operational Observability Telemetry Tests', () => {
  let consoleErrorSpy: any

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Sensitive Data Log Scrubbing', () => {
    test('redacts Google Generative AI keys correctly', () => {
      const dirty = 'Error calling model with key AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q'
      const clean = scrubSensitiveData(dirty)
      expect(clean).toContain('[REDACTED_GEMINI_KEY]')
      expect(clean).not.toContain('AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q')
    })

    test('redacts Stripe secret and publishable keys correctly', () => {
      const dirty1 = 'Failed to connect using sk_test_51NxXxXxXxXxXxXxXyYyYyYyY'
      const dirty2 = 'Failed to connect using pk_live_51NxXxXxXxXxXxXxXzZzZzZzZ'
      expect(scrubSensitiveData(dirty1)).toContain('[REDACTED_STRIPE_KEY]')
      expect(scrubSensitiveData(dirty2)).toContain('[REDACTED_STRIPE_KEY]')
    })

    test('redacts email addresses correctly to protect customer privacy', () => {
      const dirty = 'Error resolving user account for customer.support@promptpolish.com'
      const clean = scrubSensitiveData(dirty)
      expect(clean).toContain('[REDACTED_EMAIL]')
      expect(clean).not.toContain('customer.support@promptpolish.com')
    })

    test('redacts credit card numbers correctly to protect financial records', () => {
      const dirty = 'Payment declined for card number 4242-4242-4242-4242'
      const clean = scrubSensitiveData(dirty)
      expect(clean).toContain('[REDACTED_CARD]')
      expect(clean).not.toContain('4242-4242-4242-4242')
    })

    test('leaves normal technical messages untouched', () => {
      const safe = 'Database query resolved successfully in 23ms'
      expect(scrubSensitiveData(safe)).toBe(safe)
    })
  })

  describe('recordProviderError logging hook', () => {
    test('logs provider errors with exact structural signatures', () => {
      const testError = new Error('Out of quota on endpoint')
      recordProviderError(testError, { model: 'gemini-1.5-flash' })

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const output = consoleErrorSpy.mock.calls[0][0]
      expect(output).toContain('[PROVIDER_ERROR]')
      expect(output).toContain('message="Out of quota on endpoint"')
      expect(output).toContain('context={"model":"gemini-1.5-flash"}')
    })

    test('omits prompt variables from context payload entirely for safety', () => {
      const testError = new Error('Internal validation failed')
      recordProviderError(testError, {
        model: 'gemini-1.5-flash',
        input_prompt: 'Write an email containing secrets',
        prompt: 'Secret prompt content',
        improved_prompt: 'Polished prompt content'
      })

      const output = consoleErrorSpy.mock.calls[0][0]
      expect(output).toContain('[PROVIDER_ERROR]')
      expect(output).toContain('context={"model":"gemini-1.5-flash"}')
      expect(output).not.toContain('input_prompt')
      expect(output).not.toContain('Polished prompt content')
    })

    test('scrubs credentials embedded within provider error stack traces', () => {
      const testError = new Error('Failure contacting API: key=AIzaSyDirtyKeyHereStuffAndThings')
      recordProviderError(testError)

      const output = consoleErrorSpy.mock.calls[0][0]
      expect(output).toContain('[REDACTED_GEMINI_KEY]')
      expect(output).not.toContain('AIzaSyDirtyKeyHereStuffAndThings')
    })
  })

  describe('recordStripeWebhookFailure logging hook', () => {
    test('logs Stripe webhook signature and processing failures cleanly', () => {
      const testError = new Error('Database transaction timeout')
      recordStripeWebhookFailure('customer.subscription.created', testError)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const output = consoleErrorSpy.mock.calls[0][0]
      expect(output).toContain('[STRIPE_WEBHOOK_FAILURE]')
      expect(output).toContain('event=customer.subscription.created')
      expect(output).toContain('message="Database transaction timeout"')
    })

    test('scrubs sensitive credentials from webhook failure log strings', () => {
      const testError = new Error('Failed with secret key sk_live_someSecretStripeKeyGoesHere')
      recordStripeWebhookFailure('invoice.payment_succeeded', testError)

      const output = consoleErrorSpy.mock.calls[0][0]
      expect(output).toContain('[STRIPE_WEBHOOK_FAILURE]')
      expect(output).toContain('[REDACTED_STRIPE_KEY]')
      expect(output).not.toContain('sk_live_someSecretStripeKeyGoesHere')
    })
  })
})
