import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/identity/auth'
import { setUserPlanSlug } from '@/lib/supabase/queries'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const user = await getAuthUser()

    if (!user?.id || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isDev = process.env.NODE_ENV === 'development'
    const rawAdminEmails = process.env.ADMIN_EMAILS || ''
    const adminEmails = rawAdminEmails
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)

    if (!isDev) {
      const isEmailAdmin = adminEmails.includes(user.email.trim().toLowerCase())

      if (adminEmails.length === 0 || !isEmailAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
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

    return NextResponse.json(
      {
        ok: true,
        plan: 'pro',
        userId: updated.user_id,
        email: updated.email,
        dbPlan: updated.plan_slug,
        debugVersion: 'simulate-pro-set-user-plan-slug-v1',
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