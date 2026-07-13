import {
  APICallError,
  NoObjectGeneratedError,
} from 'ai'

export class ProviderError extends Error {
  public rawError: unknown
  public statusCode?: number
  public userMessage: string
  public errorCode?: string

  constructor(
    message: string,
    userMessage: string,
    rawError: unknown,
    statusCode?: number,
    errorCode?: string
  ) {
    super(message)

    this.name = 'ProviderError'
    this.userMessage = userMessage
    this.rawError = rawError
    this.statusCode = statusCode
    this.errorCode = errorCode

    Object.setPrototypeOf(
      this,
      ProviderError.prototype
    )
  }
}

const TIMEOUT_ERROR_NAMES = new Set([
  'AbortError',
  'TimeoutError',
  'ConnectTimeoutError',
  'HeadersTimeoutError',
  'BodyTimeoutError',
])

const TIMEOUT_ERROR_CODES = new Set([
  'ETIMEDOUT',
  'ESOCKETTIMEDOUT',
  'ERR_REQUEST_ABORTED',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_BODY_TIMEOUT',
])

const TIMEOUT_MESSAGE_MARKERS = [
  'provider_timeout',
  'request aborted after',
  'request timed out',
  'request timeout',
  'operation timed out',
  'operation timeout',
  'deadline exceeded',
  'deadline_exceeded',
  'function_invocation_timeout',
  'task_timeout',
  'vercel platform timeout',
  'und_err_connect_timeout',
  'und_err_headers_timeout',
  'und_err_body_timeout',
  'esockettimedout',
  'etimedout',
]

const PLATFORM_TIMEOUT_MARKERS = [
  'function_invocation_timeout',
  'task_timeout',
  'vercel platform timeout',
]

/**
 * Reads a direct numeric HTTP status code from an unknown error object.
 */
function getStatusCode(
  error: unknown
): number | undefined {
  if (
    !error ||
    typeof error !== 'object'
  ) {
    return undefined
  }

  const record =
    error as Record<string, unknown>

  return typeof record.statusCode ===
    'number'
    ? record.statusCode
    : undefined
}

/**
 * Returns a readable error message without assuming that the thrown value
 * is an Error instance.
 */
function getErrorMessage(
  error: unknown
): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

/**
 * Detects explicit timeout markers only.
 *
 * Arbitrary model output or JSON containing the standalone words "timeout"
 * or "abort" must not cause timeout classification.
 */
function containsTimeoutMarker(
  value: unknown
): boolean {
  if (typeof value !== 'string') {
    return false
  }

  const normalized =
    value.toLowerCase()

  return TIMEOUT_MESSAGE_MARKERS.some(
    (marker) =>
      normalized.includes(marker)
  )
}

/**
 * Checks whether an error chain contains an explicit platform timeout.
 */
function isPlatformTimeout(
  error: unknown
): boolean {
  const visited =
    new WeakSet<object>()

  function check(
    value: unknown,
    depth: number
  ): boolean {
    if (
      value === null ||
      value === undefined ||
      depth > 5
    ) {
      return false
    }

    if (typeof value === 'string') {
      const normalized =
        value.toLowerCase()

      return PLATFORM_TIMEOUT_MARKERS.some(
        (marker) =>
          normalized.includes(marker)
      )
    }

    if (
      typeof value !== 'object'
    ) {
      return false
    }

    if (visited.has(value)) {
      return false
    }

    visited.add(value)

    const record =
      value as Record<
        string,
        unknown
      >

    if (
      typeof record.message ===
      'string'
    ) {
      const normalized =
        record.message.toLowerCase()

      if (
        PLATFORM_TIMEOUT_MARKERS.some(
          (marker) =>
            normalized.includes(marker)
        )
      ) {
        return true
      }
    }

    if (
      record.cause &&
      check(
        record.cause,
        depth + 1
      )
    ) {
      return true
    }

    if (
      record.rawError &&
      check(
        record.rawError,
        depth + 1
      )
    ) {
      return true
    }

    return false
  }

  return check(error, 0)
}

/**
 * Safely inspects an error chain for real timeout indicators.
 *
 * Detection is based on:
 * - known timeout error names,
 * - known network timeout codes,
 * - explicit timeout messages,
 * - nested cause/rawError objects.
 */
export function isNestedTimeout(
  error: unknown
): boolean {
  const visited =
    new WeakSet<object>()

  function check(
    value: unknown,
    depth: number
  ): boolean {
    if (
      value === null ||
      value === undefined ||
      depth > 5
    ) {
      return false
    }

    if (typeof value === 'string') {
      return containsTimeoutMarker(
        value
      )
    }

    if (
      typeof value !== 'object'
    ) {
      return false
    }

    if (visited.has(value)) {
      return false
    }

    visited.add(value)

    const record =
      value as Record<
        string,
        unknown
      >

    if (
      typeof record.name ===
        'string' &&
      TIMEOUT_ERROR_NAMES.has(
        record.name
      )
    ) {
      return true
    }

    if (
      typeof record.code ===
        'string' &&
      TIMEOUT_ERROR_CODES.has(
        record.code.toUpperCase()
      )
    ) {
      return true
    }

    if (
      typeof record.message ===
        'string' &&
      containsTimeoutMarker(
        record.message
      )
    ) {
      return true
    }

    if (
      record.cause &&
      check(
        record.cause,
        depth + 1
      )
    ) {
      return true
    }

    if (
      record.rawError &&
      check(
        record.rawError,
        depth + 1
      )
    ) {
      return true
    }

    return false
  }

  return check(error, 0)
}

/**
 * Detects AI SDK structured-output errors before generic timeout and
 * network classification.
 */
function isNoObjectGeneratedError(
  error: unknown
): boolean {
  if (
    NoObjectGeneratedError.isInstance(
      error
    )
  ) {
    return true
  }

  if (!(error instanceof Error)) {
    return false
  }

  return (
    error.name ===
      'NoObjectGeneratedError' ||
    error.name ===
      'AI_NoObjectGeneratedError' ||
    error.message.includes(
      'No object generated'
    ) ||
    error.message.includes(
      'No output generated'
    )
  )
}

/**
 * Normalizes live provider errors into a stable internal ProviderError.
 *
 * Classification order is important:
 * 1. already classified ProviderError,
 * 2. malformed structured output,
 * 3. provider HTTP/API errors,
 * 4. explicit timeout errors,
 * 5. generic network/provider errors.
 */
export function normalizeProviderError(
  error: unknown
): ProviderError {
  const highVolumeMessage =
    'Our prompt analysis engine is currently handling high volume. Please wait a few moments and try again.'

  const generalErrorMessage =
    'Our prompt analysis engine encountered an error while processing your request. Please try again.'

  /*
   * Preserve only ProviderErrors which already have an explicit stable
   * classification.
   *
   * Older or manually created ProviderErrors without errorCode must still be
   * inspected because their rawError/cause can contain a real timeout.
   */
  if (
    error instanceof ProviderError &&
    error.errorCode
  ) {
    return error
  }

  /*
   * Structured-output errors must be handled before generic timeout
   * detection. Their generated text or validation details can contain words
   * associated with timeouts without the provider request timing out.
   */
  if (
    isNoObjectGeneratedError(error)
  ) {
    const originalMessage =
      getErrorMessage(error)

    return new ProviderError(
      `Failed to generate structured object: ${originalMessage}`,
      generalErrorMessage,
      error,
      undefined,
      'malformed_provider_output'
    )
  }

  /*
   * Handle explicit AI SDK HTTP/API errors.
   */
  if (
    APICallError.isInstance(error)
  ) {
    const statusCode =
      error.statusCode

    /*
     * Some providers return an APICallError with a nominal status while the
     * nested cause contains an explicit transport timeout.
     */
    if (isNestedTimeout(error)) {
      return new ProviderError(
        `PROVIDER_TIMEOUT (UPSTREAM_TIMEOUT): ${error.message}`,
        'The AI provider request timed out. Please try again.',
        error,
        statusCode ?? 504,
        'upstream_provider_error'
      )
    }

    let errorCode =
      'provider_error'

    let userMessage =
      generalErrorMessage

    if (statusCode === 429) {
      errorCode =
        'provider_rate_limit'

      userMessage =
        highVolumeMessage
    } else if (
      statusCode === 401 ||
      statusCode === 403
    ) {
      errorCode =
        'provider_authentication_error'
    } else if (
      statusCode === 408 ||
      statusCode === 504
    ) {
      errorCode =
        'upstream_provider_error'

      userMessage =
        'The AI provider request timed out. Please try again.'
    } else if (
      statusCode !== undefined &&
      statusCode >= 500 &&
      statusCode < 600
    ) {
      errorCode =
        'provider_unavailable'

      userMessage =
        highVolumeMessage
    }

    return new ProviderError(
      error.message,
      userMessage,
      error,
      statusCode,
      errorCode
    )
  }

  /*
   * Detect explicit timeout errors only after ruling out more specific AI SDK
   * structured-output errors.
   */
  if (isNestedTimeout(error)) {
    const statusCode =
      getStatusCode(error)

    const originalMessage =
      getErrorMessage(error)

    if (isPlatformTimeout(error)) {
      return new ProviderError(
        `PROVIDER_TIMEOUT (PLATFORM_TIMEOUT): ${originalMessage}`,
        'The prompt analysis request timed out at the platform level. Please try again.',
        error,
        statusCode ?? 504,
        'function_platform_timeout'
      )
    }

    return new ProviderError(
      `PROVIDER_TIMEOUT (UPSTREAM_TIMEOUT): ${originalMessage}`,
      'The AI provider request timed out. Please try again.',
      error,
      statusCode ?? 504,
      'upstream_provider_error'
    )
  }

  /*
   * Handle other Error instances, including generic network failures.
   */
  if (error instanceof Error) {
    const lowerMessage =
      error.message.toLowerCase()

    const isRateLimit =
      lowerMessage.includes(
        'rate limit'
      ) ||
      lowerMessage.includes(
        'too many requests'
      ) ||
      lowerMessage.includes(
        'status code 429'
      ) ||
      lowerMessage.includes(
        'status 429'
      )

    if (isRateLimit) {
      return new ProviderError(
        error.message,
        highVolumeMessage,
        error,
        429,
        'provider_rate_limit'
      )
    }

    const isNetworkFailure =
      lowerMessage.includes(
        'failed to fetch'
      ) ||
      lowerMessage.includes(
        'fetch failed'
      ) ||
      lowerMessage.includes(
        'network error'
      ) ||
      lowerMessage.includes(
        'network request failed'
      ) ||
      lowerMessage.includes(
        'econnrefused'
      ) ||
      lowerMessage.includes(
        'econnreset'
      ) ||
      lowerMessage.includes(
        'enotfound'
      ) ||
      lowerMessage.includes(
        'eai_again'
      ) ||
      lowerMessage.includes(
        'socket hang up'
      )

    if (isNetworkFailure) {
      return new ProviderError(
        error.message,
        highVolumeMessage,
        error,
        undefined,
        'provider_unavailable'
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

  /*
   * Fallback for non-Error throws.
   */
  return new ProviderError(
    'Unknown AI provider error',
    generalErrorMessage,
    error,
    undefined,
    'provider_unavailable'
  )
}