import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getOwnerIdFromCookies } from '@/lib/identity/anonymous'
import { createUsageEvent } from '@/lib/supabase/queries'
import { checkProductionEnv } from '@/lib/env/server'

/**
 * POST /api/events
 *
 * Records lightweight client-side interaction events (e.g. copy_improved_prompt).
 * Designed to be called fire-and-forget from the client — non-200 responses are
 * silently swallowed in the UI to keep the UX non-blocking.
 *
 * Supported event types (allowlist):
 *   - copy_improved_prompt: user copied the AI-improved prompt to clipboard
 *
 * Privacy:
 * - Only owner_anonymous_id, event_type, and analysis_id are stored.
 * - No prompt content, IP address, or user-agent is collected.
 * - owner_anonymous_id is resolved from the signed server-side cookie.
 */

const ALLOWED_EVENT_TYPES = [
  'signup_started',
  'signup_completed',
  'checkout_started',
  'checkout_completed',
  'checkout_failed',
  'subscription_activated',
  'subscription_canceled',
  'subscription_past_due',
  'customer_portal_opened',
  'upgrade_cta_clicked',
  'limit_reached',
  'export_markdown',
  'export_pdf',
  'analysis_started',
  'analysis_completed',
  'analysis_failed',
  'copy_improved_prompt',
  'feedback_submitted',
  'share_link_created',
  'share_link_disabled',
  'sensitive_data_warning_shown',
  'sensitive_data_blocked',
  'provider_error',
  'invalid_structured_output'
] as const

const eventSchema = z.object({
  event_type: z.enum(ALLOWED_EVENT_TYPES, {
    message: `event_type must be one of: ${ALLOWED_EVENT_TYPES.join(', ')}`
  }),
  analysis_id: z.string().uuid('analysis_id must be a valid UUID').optional()
})

export async function POST(request: Request) {
  try {
    const envCheck = checkProductionEnv()
    if (!envCheck.valid) {
      return NextResponse.json(
        {
          error: 'configuration_error',
          message: envCheck.error
        },
        { status: 500 }
      )
    }

    // 1. Parse and validate
    const body = await request.json().catch(() => null)
    const parsed = eventSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'invalid_input',
          message: 'Invalid event payload.',
          details: parsed.error.flatten()
        },
        { status: 400 }
      )
    }

    const { event_type, analysis_id } = parsed.data

    // 2. Resolve owner identity from signed cookie (never trust client-supplied id)
    const ownerAnonymousId = await getOwnerIdFromCookies()
    if (!ownerAnonymousId) {
      return NextResponse.json(
        {
          error: 'unauthorized',
          message: 'Anonymous session required to record events.'
        },
        { status: 401 }
      )
    }

    // 3. Persist usage event — metadata contains only analysis_id, not prompt content
    await createUsageEvent({
      owner_anonymous_id: ownerAnonymousId,
      event_type,
      metadata_json: analysis_id ? { analysis_id } : {}
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[POST /api/events Error]:', error)
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'An unexpected server error occurred.'
      },
      { status: 500 }
    )
  }
}
