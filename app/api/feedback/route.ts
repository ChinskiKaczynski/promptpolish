import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getOwnerIdFromCookies } from '@/lib/identity/anonymous'
import { getAuthUser } from '@/lib/identity/auth'
import {
  getPromptAnalysisForOwner,
  createFeedbackEvent,
  createUsageEvent
} from '@/lib/supabase/queries'
import { checkProductionEnv } from '@/lib/env/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/feedback
 *
 * Saves a thumbs-up/down rating (and optional short comment) for a prompt analysis.
 *
 * Ownership rule: the caller must own the analysis (verified via signed cookie
 * against the `owner_anonymous_id` column). Non-owners and share-link viewers
 * receive 403. Feedback on shared /share/[token] views is intentionally disabled
 * in the UI (mode="share" hides the feedback block) and enforced here.
 *
 * Privacy:
 * - Only analysis_id, rating, and comment are stored.
 * - No IP address, user-agent, or prompt content is collected.
 * - Comment is capped at 500 characters server-side.
 */

const feedbackSchema = z.object({
  analysis_id: z.string().uuid('analysis_id must be a valid UUID'),
  rating: z.enum(['up', 'down']),
  comment: z.string().max(500, 'Comment must be 500 characters or fewer').optional().nullable()
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

    // 3. Verify ownership — non-owners and share viewers cannot submit feedback
    const ownedRecord = await getPromptAnalysisForOwner(
      analysis_id,
      ownerAnonymousId || '',
      user?.id
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

    // 4. Persist feedback event
    const saved = await createFeedbackEvent({
      analysis_id,
      rating,
      comment: comment ?? null
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

    // Telemetry: record feedback_submitted event
    await createUsageEvent({
      owner_anonymous_id: ownerAnonymousId || '',
      user_id: ownedRecord.user_id,
      event_type: 'feedback_submitted',
      metadata_json: {
        analysis_id,
        rating,
        feedback_id: saved.id
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[POST /api/feedback Error]:', error)
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'An unexpected server error occurred.'
      },
      { status: 500 }
    )
  }
}
