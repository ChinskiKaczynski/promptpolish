import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/identity/auth'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

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

    // Always set plan_slug to "pro" — no toggle behaviour.
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(
        {
          user_id: user.id,
          email: user.email ?? '',
          display_name:
            (user.user_metadata?.display_name as string | undefined) ??
            user.email?.split('@')[0] ??
            null,
          plan_slug: 'pro',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select('user_id,email,plan_slug')
      .single()

    if (error || !data || data.plan_slug !== 'pro') {
      console.error('simulate-pro: DB upsert failed or plan_slug mismatch', error)
      return NextResponse.json({ error: 'Could not update entitlement' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, plan: 'pro' }, { status: 200 })
  } catch (error) {
    console.error('Failed to simulate pro plan:', error)
    return NextResponse.json({ error: 'Could not update entitlement' }, { status: 500 })
  }
}
