import { APICallError, NoObjectGeneratedError } from 'ai'

export class ProviderError extends Error {
  public rawError: unknown
  public statusCode?: number
  public userMessage: string
  public errorCode?: string

  constructor(message: string, userMessage: string, rawError: unknown, statusCode?: number, errorCode?: string) {
    super(message)
    this.name = 'ProviderError'
    this.userMessage = userMessage
    this.rawError = rawError
    this.statusCode = statusCode
    this.errorCode = errorCode
    Object.setPrototypeOf(this, ProviderError.prototype)
  }
}

/**
 * Safely inspects error chains recursively to identify nested provider timeouts.
 * Checks messages, names, causes, and rawErrors up to a depth of 5.
 */
export function isNestedTimeout(error: unknown): boolean {
  const timeoutSubstrings = [
    'PROVIDER_TIMEOUT',
    'Request aborted after',
    'AbortError',
    'aborted',
    'timeout'
  ]

  function containsTimeoutString(val: unknown): boolean {
    if (typeof val === 'string') {
      const lower = val.toLowerCase()
      return timeoutSubstrings.some(sub => val.includes(sub)) ||
             lower.includes('timeout') ||
             lower.includes('abort')
    }
    return false
  }

  function check(err: unknown, depth: number): boolean {
    if (!err || typeof err !== 'object' || depth > 5) {
      return false
    }

    const e = err as Record<string, unknown>

    if (e.message && typeof e.message === 'string' && containsTimeoutString(e.message)) {
      return true
    }

    if (e.name && typeof e.name === 'string' && containsTimeoutString(e.name)) {
      return true
    }

    // Check cause
    if (e.cause) {
      if (typeof e.cause === 'string' && containsTimeoutString(e.cause)) {
        return true
      }
      if (check(e.cause, depth + 1)) {
        return true
      }
    }

    // Check rawError
    if (e.rawError) {
      if (typeof e.rawError === 'string' && containsTimeoutString(e.rawError)) {
        return true
      }
      if (check(e.rawError, depth + 1)) {
        return true
      }
    }

    return false
  }

  if (typeof error === 'string') {
    return containsTimeoutString(error)
  }

  return check(error, 0)
}

/**
 * Normalizes live provider errors (Vercel AI SDK APICallError, NoObjectGeneratedError,
 * network timeouts, rate limit hits) into a clean internal ProviderError wrapper.
 * Logs full diagnostic information server-side while providing a safe generic user-facing message.
 */
export function normalizeProviderError(error: unknown): ProviderError {

  const highVolumeMessage = 'Our prompt analysis engine is currently handling high volume. Please wait a few moments and try again.'
  const generalErrorMessage = 'Our prompt analysis engine encountered an error while processing your request. Please try again.'

  // 0. Detect nested timeouts first
  if (isNestedTimeout(error)) {
    const statusCode = (error && typeof error === 'object' && 'statusCode' in error) ? (error as Record<string, unknown>).statusCode as number | undefined : undefined
    const originalMessage = error instanceof Error ? error.message : String(error)
    const formattedMessage = originalMessage.startsWith('PROVIDER_TIMEOUT:')
      ? originalMessage
      : `PROVIDER_TIMEOUT: ${originalMessage}`
    
    const isNetworkOrFetch = originalMessage.toLowerCase().includes('fetch') || originalMessage.toLowerCase().includes('network')
    const userMsg = isNetworkOrFetch 
      ? highVolumeMessage 
      : 'The prompt analysis request timed out. Please try again.'

    return new ProviderError(
      formattedMessage,
      userMsg,
      error,
      statusCode,
      'provider_timeout'
    )
  }

  if (error instanceof ProviderError) {
    return error
  }

  if (error instanceof Error) {
    // 1. Catch Vercel AI SDK APICallError
    if (APICallError.isInstance(error)) {
      const statusCode = error.statusCode
      const isTransient =
        statusCode !== undefined &&
        (statusCode === 429 || statusCode === 408 || (statusCode >= 500 && statusCode < 600))
      const userMessage = isTransient ? highVolumeMessage : generalErrorMessage
      
      let errorCode = 'provider_error'
      if (statusCode === 429) {
        errorCode = 'provider_rate_limit'
      } else if (statusCode === 401 || statusCode === 403) {
        errorCode = 'provider_authentication_error'
      } else if (statusCode === 408 || (statusCode && statusCode >= 500)) {
        errorCode = 'provider_unavailable'
      }

      return new ProviderError(
        error.message,
        userMessage,
        error,
        statusCode,
        errorCode
      )
    }

    // 2. Catch Vercel AI SDK NoObjectGeneratedError
    if (NoObjectGeneratedError.isInstance(error)) {
      return new ProviderError(
        `Failed to generate structured object: ${error.message}`,
        generalErrorMessage,
        error,
        undefined,
        'malformed_provider_output'
      )
    }

    // 3. Catch generic network/timeout/fetch failures
    const lowerMessage = error.message.toLowerCase()
    if (
      lowerMessage.includes('fetch') ||
      lowerMessage.includes('network') ||
      lowerMessage.includes('timeout') ||
      lowerMessage.includes('429') ||
      lowerMessage.includes('econnrefused')
    ) {
      let errorCode = 'provider_unavailable'
      if (lowerMessage.includes('429')) {
        errorCode = 'provider_rate_limit'
      } else if (lowerMessage.includes('timeout')) {
        errorCode = 'provider_timeout'
      }

      return new ProviderError(
        error.message,
        highVolumeMessage,
        error,
        undefined,
        errorCode
      )
    }

    return new ProviderError(
      error.message,
      generalErrorMessage,
      error,
      undefined,
      'provider_unavailable'
    )
  }

  // Fallback for non-Error throws
  return new ProviderError(
    'Unknown AI provider error',
    generalErrorMessage,
    error,
    undefined,
    'provider_unavailable'
  )
}
