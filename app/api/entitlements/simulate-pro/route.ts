import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/identity/auth'
import { getUserProfile, createUserProfile } from '@/lib/supabase/queries'

export async function POST() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const profile = await getUserProfile(user.id)
    const currentPlan = profile?.plan_slug || 'free'
    const nextPlan = currentPlan === 'pro' ? 'free' : 'pro'

    await createUserProfile({
      user_id: user.id,
      email: user.email || '',
      display_name: profile?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || null,
      plan_slug: nextPlan
    })

    return NextResponse.redirect(new URL('/pricing', process.env.APP_URL || 'http://localhost:3000'), 303)
  } catch (error) {
    console.error('Failed to toggle simulated plan:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
