
function scrubString(text: string): string {
  if (!text) return text
  let scrubbed = text

  // 1. private-key-block
  scrubbed = scrubbed.replace(/-----BEGIN (RSA |EC |OPENSSH |DSA |)?PRIVATE KEY-----[\s\S]*?-----END (RSA |EC |OPENSSH |DSA |)?PRIVATE KEY-----/gi, '[REDACTED_PRIVATE_KEY]')

  // 2. env-secret-key (e.g. GEMINI_API_KEY = value)
  scrubbed = scrubbed.replace(/(\b(?:OPENAI_API_KEY|OPENROUTER_API_KEY|GOOGLE_GENERATIVE_AI_API_KEY|GOOGLE_API_KEY|GEMINI_API_KEY|SUPABASE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY|AWS_SECRET_ACCESS_KEY|AWS_ACCESS_KEY_ID)\s*=\s*)([^\s'"]+)/gi, '$1[REDACTED_ENV_SECRET]')

  // 3. google-api-key
  scrubbed = scrubbed.replace(/\bAIzaSy[A-Za-z0-9_-]{20,40}\b/g, '[REDACTED_GEMINI_KEY]')

  // 4. bearer-token
  scrubbed = scrubbed.replace(/(\bBearer\s+)([A-Za-z0-9._~+\/-]{20,})/gi, '$1[REDACTED_BEARER_TOKEN]')

  // 5. jwt-like
  scrubbed = scrubbed.replace(/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, '[REDACTED_JWT]')

  // 6. Stripe API key
  scrubbed = scrubbed.replace(/\b(?:sk|pk)_(?:test|live)_[A-Za-z0-9]{24,255}\b/g, '[REDACTED_STRIPE_KEY]')

  // 7. Stripe webhook secret
  scrubbed = scrubbed.replace(/\bwhsec_[A-Za-z0-9_]{32,255}\b/g, '[REDACTED_STRIPE_WEBHOOK_SECRET]')

  // 8. github-pat (ghp_ and github_pat_)
  scrubbed = scrubbed.replace(/\b(?:ghp_[A-Za-z0-9_]{36,255}|github_pat_[A-Za-z0-9_]{82,255})\b/g, '[REDACTED_GITHUB_PAT]')

  // 9. huggingface-token (hf_)
  scrubbed = scrubbed.replace(/\bhf_[A-Za-z0-9]{34,255}\b/g, '[REDACTED_HUGGINGFACE_TOKEN]')

  // 10. npm-token (npm_)
  scrubbed = scrubbed.replace(/\bnpm_[A-Za-z0-9_]{36,255}\b/g, '[REDACTED_NPM_TOKEN]')

  // 11. slack-token (xoxb- and xoxp-)
  scrubbed = scrubbed.replace(/\bxox[bprs]-[A-Za-z0-9-]{10,255}\b/g, '[REDACTED_SLACK_TOKEN]')

  // 12. database-url
  scrubbed = scrubbed.replace(/(\b(?:postgresql|postgres|mongodb|mysql|redis):\/\/[^\s@:]+:)(.+?)(@[A-Za-z0-9_.-]+(?::\d+)?\/[A-Za-z0-9_.-]*\b)/gi, '$1[REDACTED_DB_PASSWORD]$3')

  // 13. provider-key-sk (OpenAI sk-* and sk-proj-*)
  // Run after Stripe key replace because Stripe key matches sk_
  scrubbed = scrubbed.replace(/\bsk-[A-Za-z0-9_-]{20,}\b/g, '[REDACTED_AI_KEY]')

  // 14. password-assignment
  scrubbed = scrubbed.replace(/(\b[A-Za-z0-9_-]*(?:password|passwd|pwd)\s*[:=]\s*)([^\s'"]{6,})/gi, '$1[REDACTED_PASSWORD]')

  // 15. email-address
  scrubbed = scrubbed.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[REDACTED_EMAIL]')

  // 16. credit-card
  scrubbed = scrubbed.replace(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{1,4}\b/g, '[REDACTED_CARD]')

  return scrubbed
}

function safeScrubObject(obj: unknown, depth = 0, seen = new Set<object>()): unknown {
  if (depth > 5) return '[Object Max Depth Reached]'
  if (obj === null || obj === undefined) return obj
  if (typeof obj === 'string') return scrubString(obj)
  if (typeof obj !== 'object') return obj

  if (seen.has(obj)) return '[Circular Reference]'
  seen.add(obj)

  if (Array.isArray(obj)) {
    const arr = obj.map(item => safeScrubObject(item, depth + 1, seen))
    seen.delete(obj)
    return arr
  }

  if (obj instanceof Error) {
    seen.delete(obj)
    return {
      name: obj.name,
      message: scrubString(obj.message),
      stack: obj.stack ? scrubString(obj.stack) : undefined
    }
  }

  const result: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    if (['password', 'secret', 'token', 'key', 'authorization', 'cookie'].some(k => key.toLowerCase().includes(k))) {
      result[key] = '[REDACTED]'
    } else {
      result[key] = safeScrubObject(val, depth + 1, seen)
    }
  }
  seen.delete(obj)
  return result
}

export function scrubSensitiveDataForLogs(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Error) {
    const cleanMessage = scrubString(value.message)
    const cleanStack = value.stack ? scrubString(value.stack) : ''
    return `[Error: ${value.name}] ${cleanMessage}${cleanStack ? '\nStack: ' + cleanStack : ''}`
  }
  if (typeof value === 'object') {
    try {
      const scrubbedObj = safeScrubObject(value)
      return JSON.stringify(scrubbedObj)
    } catch (err) {
      return `[Unserializable Object Error: ${err instanceof Error ? err.message : String(err)}]`
    }
  }
  return scrubString(String(value))
}

// Simple helper to scrub standard secrets and payment formats (backward compatibility)
export function scrubSensitiveData(text: string): string {
  return scrubString(text)
}

export function recordProviderError(error: unknown, context?: Record<string, unknown>): void {
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
  const cleanMessage = scrubString(errorMessage)
  const cleanStack = scrubString(errorStack)

  const logContext: Record<string, unknown> = {}
  if (context) {
    for (const [key, value] of Object.entries(context)) {
      // Skip high-risk fields that could contain raw prompt contents
      if (['input_prompt', 'prompt', 'inputPrompt', 'improvedPrompt', 'improved_prompt'].includes(key)) {
        continue
      }
      logContext[key] = typeof value === 'string' ? scrubString(value) : safeScrubObject(value)
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

  const cleanMessage = scrubString(errorMessage)

  console.error(`[STRIPE_WEBHOOK_FAILURE] timestamp=${timestamp} event=${event} name=${errorName} message="${cleanMessage}"`)
}
