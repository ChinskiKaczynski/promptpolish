import { APICallError, NoObjectGeneratedError } from 'ai'

export class ProviderError extends Error {
  public rawError: unknown
  public statusCode?: number
  public userMessage: string

  constructor(message: string, userMessage: string, rawError: unknown, statusCode?: number) {
    super(message)
    this.name = 'ProviderError'
    this.userMessage = userMessage
    this.rawError = rawError
    this.statusCode = statusCode
    Object.setPrototypeOf(this, ProviderError.prototype)
  }
}

/**
 * Normalizes live provider errors (Vercel AI SDK APICallError, NoObjectGeneratedError,
 * network timeouts, rate limit hits) into a clean internal ProviderError wrapper.
 * Logs full diagnostic information server-side while providing a safe generic user-facing message.
 */
export function normalizeProviderError(error: unknown): ProviderError {
  // Log the raw error internally for server-side developer diagnostics
  console.error('[AI Provider Error - Internal Diagnostics]:', error)

  const highVolumeMessage = 'Our prompt analysis engine is currently handling high volume. Please wait a few moments and try again.'
  const generalErrorMessage = 'Our prompt analysis engine encountered an error while processing your request. Please try again.'

  if (error instanceof Error) {
    // 1. Catch Vercel AI SDK APICallError
    if (APICallError.isInstance(error)) {
      const statusCode = error.statusCode
      const isTransient =
        statusCode !== undefined &&
        (statusCode === 429 || statusCode === 408 || (statusCode >= 500 && statusCode < 600))
      const userMessage = isTransient ? highVolumeMessage : generalErrorMessage
      return new ProviderError(
        error.message,
        userMessage,
        error,
        statusCode
      )
    }

    // 2. Catch Vercel AI SDK NoObjectGeneratedError
    if (NoObjectGeneratedError.isInstance(error)) {
      return new ProviderError(
        `Failed to generate structured object: ${error.message}`,
        generalErrorMessage,
        error
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
      return new ProviderError(
        error.message,
        highVolumeMessage,
        error
      )
    }

    return new ProviderError(
      error.message,
      generalErrorMessage,
      error
    )
  }

  // Fallback for non-Error throws
  return new ProviderError(
    'Unknown AI provider error',
    generalErrorMessage,
    error
  )
}
