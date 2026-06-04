import 'server-only'

/**
 * Safely serializes raw database or system error objects to prevent logs truncation or
 * failures when displaying details in production monitoring dashboards.
 */
export function serializeDbError(error: unknown) {
  if (!error) return null

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    }
  }

  if (typeof error === 'object') {
    return {
      ...error,
      ownProperties: Object.getOwnPropertyNames(error),
      json: JSON.stringify(error),
    }
  }

  return {
    value: String(error),
  }
}
