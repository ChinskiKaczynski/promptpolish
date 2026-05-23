/**
 * Observability & Telemetry Logging System for PromptPolish SaaS Operations.
 * Enforces strict compliance with data privacy policies:
 * - Omit any raw user prompts or credentials from log strings.
 * - Scrub potential API keys, secrets, or credit card patterns.
 */

// Simple helper to scrub standard secrets and payment formats
export function scrubSensitiveData(text: string): string {
  if (!text) return text
  let scrubbed = text
  // 1. Scrub Google Generative AI API Keys (AIzaSy...)
  scrubbed = scrubbed.replace(/AIzaSy[A-Za-z0-9_\-]{20,40}/g, '[REDACTED_GEMINI_KEY]')
  // 2. Scrub Stripe Secret/Publishable Keys (sk_test_..., sk_live_..., etc.)
  scrubbed = scrubbed.replace(/(sk|pk)_(test|live)_[A-Za-z0-9]{24,100}/g, '[REDACTED_STRIPE_KEY]')
  // 3. Scrub potential email patterns to protect user identities
  scrubbed = scrubbed.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
  // 4. Scrub potential credit card numbers (simple 13-16 digit sequence check)
  scrubbed = scrubbed.replace(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{1,4}\b/g, '[REDACTED_CARD]')
  return scrubbed
}

export function recordProviderError(error: unknown, context?: Record<string, any>): void {
  const timestamp = new Date().toISOString()
  let errorMessage = 'Unknown AI Provider error occurred'
  let errorName = 'UnknownError'
  let errorStack = ''
  let statusCode: number | undefined

  if (error instanceof Error) {
    errorName = error.name
    errorMessage = error.message
    errorStack = error.stack || ''
    if ('statusCode' in error) {
      statusCode = (error as { statusCode?: number }).statusCode
    }
  } else if (typeof error === 'string') {
    errorMessage = error
  } else if (error && typeof error === 'object') {
    errorMessage = JSON.stringify(error)
  }

  // Scrub error contents
  const cleanMessage = scrubSensitiveData(errorMessage)
  const cleanStack = scrubSensitiveData(errorStack)

  const logContext: Record<string, any> = {}
  if (context) {
    for (const [key, value] of Object.entries(context)) {
      // Skip high-risk fields that could contain raw prompt contents
      if (['input_prompt', 'prompt', 'inputPrompt', 'improvedPrompt', 'improved_prompt'].includes(key)) {
        continue
      }
      logContext[key] = typeof value === 'string' ? scrubSensitiveData(value) : value
    }
  }

  console.error(`[PROVIDER_ERROR] timestamp=${timestamp} name=${errorName} message="${cleanMessage}" status=${statusCode || 'N/A'} context=${JSON.stringify(logContext)}`)
  if (cleanStack && process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    console.error(`[PROVIDER_ERROR_STACK]: ${cleanStack}`)
  }
}

export function recordStripeWebhookFailure(event: string, error: unknown): void {
  const timestamp = new Date().toISOString()
  let errorMessage = 'Unknown Stripe Webhook error occurred'
  let errorName = 'UnknownError'

  if (error instanceof Error) {
    errorName = error.name
    errorMessage = error.message
  } else if (typeof error === 'string') {
    errorMessage = error
  } else if (error && typeof error === 'object') {
    errorMessage = JSON.stringify(error)
  }

  const cleanMessage = scrubSensitiveData(errorMessage)

  console.error(`[STRIPE_WEBHOOK_FAILURE] timestamp=${timestamp} event=${event} name=${errorName} message="${cleanMessage}"`)
}
