import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getOwnerIdFromCookies } from '@/lib/identity/anonymous'
import { disableShareLink, createUsageEvent } from '@/lib/supabase/queries'

const disableShareRequestSchema = z.object({
  analysis_id: z.string().uuid()
})

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const parsed = disableShareRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'invalid_input',
          message: 'Invalid analysis identifier provided.'
        },
        { status: 400 }
      )
    }

    const { analysis_id } = parsed.data

    // 1. Resolve owner identity from signed secure cookie
    const ownerAnonymousId = await getOwnerIdFromCookies()
    if (!ownerAnonymousId) {
      return NextResponse.json(
        {
          error: 'unauthorized',
          message: 'Anonymous session required to perform this action.'
        },
        { status: 401 }
      )
    }

    // 2. Disable sharing
    const success = await disableShareLink(analysis_id, ownerAnonymousId)
    if (!success) {
      return NextResponse.json(
        {
          error: 'forbidden',
          message: 'You do not have permission to disable sharing for this analysis or the record does not exist.'
        },
        { status: 403 }
      )
    }

    // 3. Save telemetry log event
    await createUsageEvent({
      owner_anonymous_id: ownerAnonymousId,
      event_type: 'share_link_disabled',
      metadata_json: {
        analysis_id
      }
    })

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error('[POST /api/share/disable Error]:', error)
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'An unexpected server error occurred.'
      },
      { status: 500 }
    )
  }
}
