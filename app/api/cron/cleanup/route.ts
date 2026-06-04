import { NextResponse } from 'next/server'
import { runRetentionCleanup } from '@/lib/privacy/retention'
import { serverEnv } from '@/lib/env/server'

async function handleCleanup(request: Request) {
  try {
    // 1. Verify cron authorization bearer token if configured
    const authHeader = request.headers.get('Authorization')
    const cronSecret = serverEnv.CRON_SECRET

    if (process.env.NODE_ENV === 'production' && !cronSecret) {
      console.error('[Retention Cron Error]: CRON_SECRET is not configured in production. Blocking execution for safety.')
      return NextResponse.json(
        {
          error: 'misconfigured',
          message: 'Cron secret is not configured in production.'
        },
        { status: 500 }
      )
    }

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        {
          error: 'unauthorized',
          message: 'Invalid or missing cron authorization token.'
        },
        { status: 401 }
      )
    }

    // 2. Parse dryRun flag from URL query string
    const { searchParams } = new URL(request.url)
    const isDryRun = searchParams.get('dryRun') === 'true'

    // 3. Execute retention cleanup
    const result = await runRetentionCleanup({ dryRun: isDryRun })

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error: unknown) {
    console.error('[Retention Cron Error]: Cleanup execution failed:', error)
    const message = error instanceof Error ? error.message : 'An unexpected error occurred during database cleanup.'
    return NextResponse.json(
      {
        success: false,
        error: 'internal_error',
        message
      },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  return handleCleanup(request)
}

export async function POST(request: Request) {
  return handleCleanup(request)
}
