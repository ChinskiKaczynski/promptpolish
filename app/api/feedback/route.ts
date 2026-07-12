import { NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { getOwnerIdFromCookies } from '@/lib/identity/anonymous'
import { getAuthUser } from '@/lib/identity/auth'
import {
  getPromptAnalysisForOwner,
  createFeedbackEvent,
  insertUsageEventWithLimit
} from '@/lib/supabase/queries'
import { checkProductionEnv } from '@/lib/env/server'

export const dynamic = 'force-dynamic'

import { validateSameOrigin } from '@/lib/security/csrf'

const feedbackSchema = z.object({
  analysis_id: z.string().uuid('analysis_id must be a valid UUID'),
  rating: z.enum(['up', 'down']),
  comment: z.string().max(500, 'Comment must be 500 characters or fewer').optional().nullable()
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

    // 1. Parse and validate request body
    const body = await request.json().catch(() => null)
    const parsed = feedbackSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'invalid_input',
          message: 'Invalid feedback payload.',
          details: parsed.error.flatten()
        },
        { status: 400 }
      )
    }

    const { analysis_id, rating, comment } = parsed.data

    // 2. Resolve secure auth session and signed anonymous cookie
    const user = await getAuthUser()
    const ownerAnonymousId = await getOwnerIdFromCookies()

    if (!user && !ownerAnonymousId) {
      return NextResponse.json(
        {
          error: 'unauthorized',
          message: 'Authentication or anonymous session required to submit feedback.'
        },
        { status: 401 }
      )
    }

    const userId = user?.id || null
    const finalAnonId = ownerAnonymousId || randomUUID()

    // 3. Atomic rate limiting and telemetry event insertion (max 10 feedbacks per 60 seconds per identity)
    const eventId = randomUUID()
    const rateLimitOk = await insertUsageEventWithLimit({
      eventId,
      ownerAnonymousId: finalAnonId,
      userId,
      eventType: 'feedback_submitted',
      metadataJson: {
        analysis_id,
        rating
      },
      windowSeconds: 60,
      maxCount: 10
    })

    if (!rateLimitOk) {
      return NextResponse.json(
        {
          error: 'rate_limit_exceeded',
          message: 'Too many requests. Please try again later.'
        },
        { status: 429 }
      )
    }

    // 4. Verify ownership — non-owners and share viewers cannot submit feedback
    const ownedRecord = await getPromptAnalysisForOwner(
      analysis_id,
      finalAnonId,
      userId || undefined
    )

    if (!ownedRecord) {
      return NextResponse.json(
        {
          error: 'forbidden',
          message: 'You do not have permission to submit feedback for this analysis.'
        },
        { status: 403 }
      )
    }

    // 5. Persist/upsert feedback event with correct identity values
    const saved = await createFeedbackEvent({
      analysis_id,
      rating,
      comment: comment ?? null,
      user_id: userId,
      owner_anonymous_id: finalAnonId
    })

    if (!saved) {
      return NextResponse.json(
        {
          error: 'database_error',
          message: 'Failed to save feedback. Please try again.'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[POST /api/feedback Error]:', error)
    const isDbError = error instanceof Error && error.message.includes('Database error')
    return NextResponse.json(
      {
        error: isDbError ? 'database_error' : 'internal_error',
        message: isDbError ? error.message : 'An unexpected server error occurred.'
      },
      { status: 500 }
    )
  }
}
