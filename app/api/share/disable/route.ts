import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getOwnerIdFromCookies } from '@/lib/identity/anonymous'
import { getAuthUser } from '@/lib/identity/auth'
import { disableShareLink, createUsageEvent } from '@/lib/supabase/queries'
import { checkProductionEnv } from '@/lib/env/server'

export const dynamic = 'force-dynamic'

import { validateSameOrigin } from '@/lib/security/csrf'

const disableShareRequestSchema = z.object({
  analysis_id: z.string().uuid()
})

export async function POST(request: Request) {
  try {
    // CSRF Same-Origin validation
    if (!(await validateSameOrigin())) {
      return NextResponse.json({ error: 'CSRF validation failed.' }, { status: 403 })
    }

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

    // 1. Resolve owner identity from signed secure cookie or authenticated session.
    //    The client must never supply or override the identity.
    const user = await getAuthUser()
    const ownerAnonymousId = await getOwnerIdFromCookies()

    if (!user && !ownerAnonymousId) {
      return NextResponse.json(
        {
          error: 'unauthorized',
          message: 'Authentication or anonymous session required to perform this action.'
        },
        { status: 401 }
      )
    }

    // 2. Per product contract, ALL plans (anonymous, free, pro) can revoke share links.
    //    No plan-based entitlement check is performed.
    //    Only the owner can revoke; disableShareLink atomically verifies ownership.

    // 3. Disable sharing atomically:
    //    Sets is_share_enabled = false AND share_token = NULL in a single owner-scoped UPDATE.
    //    Non-owner attempts affect zero rows and return false.
    const success = await disableShareLink(analysis_id, ownerAnonymousId, user?.id)
    if (!success) {
      return NextResponse.json(
        {
          error: 'forbidden',
          message: 'You do not have permission to disable sharing for this analysis or the record does not exist.'
        },
        { status: 403 }
      )
    }

    // 4. Save telemetry log event
    if (ownerAnonymousId) {
      await createUsageEvent({
        owner_anonymous_id: ownerAnonymousId,
        user_id: user?.id || null,
        event_type: 'share_link_disabled',
        metadata_json: {
          analysis_id
        }
      })
    }

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
