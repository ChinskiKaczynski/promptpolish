import { headers } from 'next/headers'

/**
 * Validates that requests are from the same origin to prevent CSRF on cookie-based mutation routes.
 * Non-browser client calls (like unit tests) where both origin and referer are missing are permitted.
 */
export async function validateSameOrigin(): Promise<boolean> {
  let reqHeaders
  try {
    reqHeaders = await headers()
  } catch {
    // Outside Next.js request context (e.g. unit tests), permit by default
    return true
  }

  const origin = reqHeaders.get('origin')
  const referer = reqHeaders.get('referer')

  if (!origin && !referer) {
    return true
  }

  const appUrl = process.env.APP_URL || ''
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''

  const checkUrl = (urlStr: string): boolean => {
    try {
      const url = new URL(urlStr)
      if (appUrl) {
        const appParsed = new URL(appUrl)
        if (url.host === appParsed.host) return true
      }
      if (vercelUrl) {
        const vercelParsed = new URL(vercelUrl)
        if (url.host === vercelParsed.host) return true
      }
      // Allow localhost for local development/testing
      if (process.env.NODE_ENV !== 'production' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) {
        return true
      }
    } catch {
      // Ignore URL parsing errors
    }
    return false
  }

  if (origin && !checkUrl(origin)) {
    return false
  }

  if (referer && !checkUrl(referer)) {
    return false
  }

  return true
}
