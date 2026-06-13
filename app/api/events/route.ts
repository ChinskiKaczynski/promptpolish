import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getOwnerIdFromCookies } from '@/lib/identity/anonymous'
import { getAuthUser } from '@/lib/identity/auth'
import { createUsageEvent, getPromptAnalysisForOwner, getRecentEventsCount } from '@/lib/supabase/queries'
import { checkProductionEnv } from '@/lib/env/server'

// Event-specific schemas using Zod discriminated union
const eventSchema = z.discriminatedUnion('event_type', [
  z.object({
    event_type: z.literal('copy_improved_prompt'),
    analysis_id: z.string().uuid('analysis_id must be a valid UUID')
  }).strict(),
  z.object({
    event_type: z.literal('history_result_opened'),
    analysis_id: z.string().uuid('analysis_id must be a valid UUID')
  }).strict(),
  z.object({
    event_type: z.literal('upgrade_cta_clicked')
  }).strict(),
  z.object({
    event_type: z.literal('signup_started')
  }).strict()
])

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

    // 1. Parse and validate using strict Zod discriminated union
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

    const { event_type } = parsed.data
    // Cast appropriately since parsed is a discriminated union
    const analysis_id = 'analysis_id' in parsed.data ? (parsed.data as { analysis_id: string }).analysis_id : undefined

    // 2. Resolve owner identity server-side (never trust client-supplied identity / plan / user fields)
    const ownerAnonymousId = await getOwnerIdFromCookies()
    const user = await getAuthUser()
    const userId = user?.id || null

    if (!ownerAnonymousId) {
      return NextResponse.json(
        {
          error: 'unauthorized',
          message: 'Anonymous session required to record events.'
        },
        { status: 401 }
      )
    }

    // 3. Rate limiting check (max 30 events per 60 seconds per identity)
    const recentCount = await getRecentEventsCount(ownerAnonymousId, userId, 60)
    if (recentCount >= 30) {
      return NextResponse.json(
        {
          error: 'rate_limit_exceeded',
          message: 'Too many requests. Please try again later.'
        },
        { status: 429 }
      )
    }

    // 4. Validate ownership for analysis-related UI events
    if (analysis_id) {
      const owned = await getPromptAnalysisForOwner(analysis_id, ownerAnonymousId, userId || undefined)
      if (!owned) {
        return NextResponse.json(
          {
            error: 'forbidden',
            message: 'You do not have permission to submit events for this analysis.'
          },
          { status: 403 }
        )
      }
    }

    // 5. Persist usage event with strict metadata schema and reject any client-supplied user/owner/plan fields
    await createUsageEvent({
      owner_anonymous_id: ownerAnonymousId,
      user_id: userId,
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
