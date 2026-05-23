import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getOwnerIdFromCookies } from '@/lib/identity/anonymous'
import { createUserProfile, linkAnonymousAnalyses } from '@/lib/supabase/queries'

const AUTH_COOKIE_NAME = 'sb-session'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { accessToken } = body

    if (!accessToken) {
      return NextResponse.json({ error: 'Missing access token.' }, { status: 400 })
    }

    // 1. Verify token cryptographically with Supabase
    const supabase = getSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid session token.' }, { status: 401 })
    }

    // 2. Set secure HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.set(AUTH_COOKIE_NAME, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365 // 1 year fallback
    })

    // 3. Upsert user profile to local user_profiles table
    await createUserProfile({
      user_id: user.id,
      email: user.email || '',
      display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || null,
      plan_slug: 'free'
    })

    // 4. Perform anonymous to logged-in user history linking
    const ownerAnonymousId = await getOwnerIdFromCookies()
    if (ownerAnonymousId) {
      await linkAnonymousAnalyses(ownerAnonymousId, user.id)
    }

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email } })
  } catch (err) {
    console.error('Session POST error:', err)
    return NextResponse.json({ error: 'Internal system error.' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete(AUTH_COOKIE_NAME)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Session DELETE error:', err)
    return NextResponse.json({ error: 'Internal system error.' }, { status: 500 })
  }
}
