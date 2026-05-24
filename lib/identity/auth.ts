import 'server-only'
import { cookies } from 'next/headers'
import { getSupabaseServerClient } from '../supabase/server'
import type { User } from '@supabase/supabase-js'

const AUTH_COOKIE_NAME = 'sb-session'

/**
 * Resolves the authenticated user server-side from secure cookies.
 * Verifies the token directly with Supabase Auth to guarantee cryptographic validity.
 */
export async function getAuthUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const tokenCookie = cookieStore.get(AUTH_COOKIE_NAME)
    if (!tokenCookie?.value) return null

    const supabase = getSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser(tokenCookie.value)

    if (error || !user) {
      return null
    }

    return user
  } catch (err) {
    if (err instanceof Error) {
      // Rethrow Next.js internal dynamic server usage errors to allow correct dynamic pre-render bailout
      if (err.name === 'DynamicServerError' || (err as any).digest === 'DYNAMIC_SERVER_USAGE') {
        throw err
      }
      // Silence Next.js cookie errors thrown in test environments outside of request contexts
      if (err.message?.includes('outside a request scope')) {
        return null
      }
    }
    console.error('Error resolving auth user:', err)
    return null
  }
}
