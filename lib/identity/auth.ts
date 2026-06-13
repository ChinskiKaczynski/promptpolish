import 'server-only'
import { getSupabaseServerClient } from '../supabase/server'
import type { User } from '@supabase/supabase-js'

export class TransientAuthError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message)
    this.name = 'TransientAuthError'
    Object.setPrototypeOf(this, TransientAuthError.prototype)
  }
}

/**
 * Resolves the authenticated user server-side from secure cookies.
 * Verifies the token directly with Supabase Auth to guarantee cryptographic validity.
 */
export async function getAuthUser(): Promise<User | null> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      // Detect transient network/service failure vs expired token
      // 5xx status or network/fetch error means transient
      const errMessage = error.message ? error.message.toLowerCase() : ''
      const isTransient =
        error.status === undefined ||
        error.status >= 500 ||
        errMessage.includes('fetch') ||
        errMessage.includes('network') ||
        errMessage.includes('timeout')
      if (isTransient) {
        throw new TransientAuthError('Supabase auth service transient failure', error)
      }
      return null
    }

    return user
  } catch (err) {
    if (err instanceof Error) {
      // Rethrow Next.js internal dynamic server usage errors to allow correct dynamic pre-render bailout
      if (err.name === 'DynamicServerError' || (typeof err === 'object' && err !== null && 'digest' in err && (err as { digest: unknown }).digest === 'DYNAMIC_SERVER_USAGE')) {
        throw err
      }
      // Silence Next.js cookie errors thrown in test environments outside of request contexts
      if (err.message?.includes('outside a request scope')) {
        return null
      }
    }
    if (err instanceof TransientAuthError) {
      throw err
    }
    console.error('Error resolving auth user:', err)
    return null
  }
}
