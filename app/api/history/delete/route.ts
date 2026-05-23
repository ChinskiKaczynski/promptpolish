import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/identity/auth'
import { getOwnerIdFromCookies } from '@/lib/identity/anonymous'
import { softDeleteAnalysis } from '@/lib/supabase/queries'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { analysisId } = body

    if (!analysisId) {
      return NextResponse.json({ error: 'Missing analysisId.' }, { status: 400 })
    }

    // 1. Resolve session ownership identities
    const user = await getAuthUser()
    const ownerAnonymousId = await getOwnerIdFromCookies()

    if (!user && !ownerAnonymousId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    // 2. Perform DB update with strict ownership checks
    const success = await softDeleteAnalysis(
      analysisId,
      ownerAnonymousId || '',
      user?.id
    )

    if (!success) {
      return NextResponse.json({ error: 'Record not found or access denied.' }, { status: 403 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete action error:', err)
    return NextResponse.json({ error: 'Internal system error.' }, { status: 500 })
  }
}
