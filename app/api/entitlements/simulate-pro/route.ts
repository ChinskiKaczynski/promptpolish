import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/identity/auth'
import { getUserProfile, createUserProfile } from '@/lib/supabase/queries'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Pro simulation security gate
    const isDev = process.env.NODE_ENV === 'development'
    const rawAdminEmails = process.env.ADMIN_EMAILS || ''
    const adminEmails = rawAdminEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)

    if (!isDev) {
      if (adminEmails.length === 0 || !user.email) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      const isEmailAdmin = adminEmails.includes(user.email.trim().toLowerCase())
      if (!isEmailAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const profile = await getUserProfile(user.id)
    const currentPlan = profile?.plan_slug || 'free'
    const nextPlan = currentPlan === 'pro' ? 'free' : 'pro'

    const updated = await createUserProfile({
      user_id: user.id,
      email: user.email || '',
      display_name: profile?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || null,
      plan_slug: nextPlan
    })

    if (!updated) {
      return NextResponse.json({ error: 'Could not update entitlement' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, plan: nextPlan }, { status: 200 })
  } catch (error) {
    console.error('Failed to toggle simulated plan:', error)
    return NextResponse.json({ error: 'Could not update entitlement' }, { status: 500 })
  }
}
