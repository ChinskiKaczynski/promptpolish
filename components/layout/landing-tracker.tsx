'use client'

import { useEffect } from 'react'

/**
 * LandingTracker — fires a lightweight `landing_viewed` telemetry event
 * on first mount. Fire-and-forget; errors are silently swallowed.
 * No prompt content or PII is sent.
 */
export function LandingTracker() {
  useEffect(() => {
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'landing_viewed' }),
    }).catch(() => null)
  }, [])

  return null
}
