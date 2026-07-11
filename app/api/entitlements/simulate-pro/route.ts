import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/identity/auth'
import { setUserPlanSlug, createUsageEvent } from '@/lib/supabase/queries'
import { getOwnerIdFromCookies } from '@/lib/identity/anonymous'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const isDev = process.env.NODE_ENV === 'development'
    const isStripeEnabled =
      process.env.STRIPE_ENABLED === 'true' &&
      !!process.env.STRIPE_SECRET_KEY &&
      !!process.env.STRIPE_PRICE_ID_PRO

    if (!isDev || isStripeEnabled || process.env.ENABLE_DEV_PRO_SIMULATION !== 'true') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const user = await getAuthUser()

    if (!user?.id || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rawAdminEmails = process.env.ADMIN_EMAILS || ''
    const adminEmails = rawAdminEmails
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)

    const isEmailAdmin = adminEmails.includes(user.email.trim().toLowerCase())
    if (!isEmailAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updated = await setUserPlanSlug({
      user_id: user.id,
      email: user.email,
      display_name:
        (user.user_metadata?.display_name as string | undefined) ??
        user.email.split('@')[0] ??
        null,
      plan_slug: 'pro',
    })

    if (!updated || updated.plan_slug !== 'pro') {
      return NextResponse.json(
        { error: 'Could not update entitlement' },
        { status: 500 },
      )
    }

    // Fire simulate_pro_enabled telemetry event
    const ownerAnonymousId = await getOwnerIdFromCookies()
    if (ownerAnonymousId) {
      createUsageEvent({
        owner_anonymous_id: ownerAnonymousId,
        user_id: user.id,
        event_type: 'simulate_pro_enabled',
        metadata_json: {
          environment: process.env.NODE_ENV,
          triggered_by: 'simulate-pro-api',
        },
      }).catch((err) => {
        console.error('Failed to log simulate_pro_enabled event:', err)
      })
    }

    return NextResponse.json(
      {
        ok: true,
        plan: 'pro',
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Failed to simulate pro plan:', error)
    return NextResponse.json(
      { error: 'Could not update entitlement' },
      { status: 500 },
    )
  }
}