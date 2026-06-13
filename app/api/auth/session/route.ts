import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getOwnerIdFromCookies } from '@/lib/identity/anonymous'
import { ensureUserProfile, linkAnonymousAnalyses } from '@/lib/supabase/queries'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const supabase = await getSupabaseServerClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid session token.' },
        { status: 401 },
      )
    }

    const displayName =
      typeof user.user_metadata?.display_name === 'string'
        ? user.user_metadata.display_name
        : user.email?.split('@')[0] || null

    await ensureUserProfile({
      user_id: user.id,
      email: user.email || '',
      display_name: displayName,
    })

    const ownerAnonymousId = await getOwnerIdFromCookies()

    if (ownerAnonymousId) {
      await linkAnonymousAnalyses(ownerAnonymousId, user.id)
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
    })
  } catch (err) {
    console.error('Session POST error:', err)

    return NextResponse.json(
      { error: 'Internal system error.' },
      { status: 500 },
    )
  }
}

export async function DELETE() {
  try {
    const supabase = await getSupabaseServerClient()
    await supabase.auth.signOut()

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Session DELETE error:', err)

    return NextResponse.json(
      { error: 'Internal system error.' },
      { status: 500 },
    )
  }
}