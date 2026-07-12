import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthUser } from '@/lib/identity/auth'
import { getOwnerIdFromCookies } from '@/lib/identity/anonymous'
import { toggleFavoriteAnalysis, createUsageEvent } from '@/lib/supabase/queries'

import { validateSameOrigin } from '@/lib/security/csrf'

export const dynamic = 'force-dynamic'

const favoriteSchema = z.object({
  analysisId: z.string().uuid(),
  isFavorite: z.boolean()
}).strict()

export async function POST(request: Request) {
  try {
    // CSRF Same-Origin validation
    if (!(await validateSameOrigin())) {
      return NextResponse.json({ error: 'CSRF validation failed.' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const parsed = favoriteSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 })
    }

    const { analysisId, isFavorite } = parsed.data


    // 1. Resolve session ownership identities
    const user = await getAuthUser()
    const ownerAnonymousId = await getOwnerIdFromCookies()

    if (!user && !ownerAnonymousId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    // 2. Perform DB update with strict ownership checks
    const success = await toggleFavoriteAnalysis(
      analysisId,
      ownerAnonymousId,
      user?.id,
      isFavorite
    )

    if (!success) {
      return NextResponse.json({ error: 'Record not found or access denied.' }, { status: 403 })
    }

    // 3. Log usage event
    if (ownerAnonymousId) {
      await createUsageEvent({
        owner_anonymous_id: ownerAnonymousId,
        user_id: user?.id || null,
        event_type: isFavorite ? 'history_favorite_added' : 'history_favorite_removed',
        metadata_json: { analysis_id: analysisId }
      }).catch(err => {
        console.error('Failed to log favorite usage event:', err)
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Favorite action error:', err)
    return NextResponse.json({ error: 'Internal system error.' }, { status: 500 })
  }
}
