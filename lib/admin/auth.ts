import 'server-only'
import { getAuthUser } from '../identity/auth'
import type { User } from '@supabase/supabase-js'

export async function verifyAdminAccess(): Promise<{
  authorized: boolean
  status: 200 | 401 | 403
  user: User | null
  error?: string
}> {
  const user = await getAuthUser()
  if (!user || !user.email) {
    return {
      authorized: false,
      status: 401,
      user: null,
      error: 'Unauthorized'
    }
  }

  const rawAdminEmails = process.env.ADMIN_EMAILS || ''
  const adminEmails = rawAdminEmails
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)

  const isEmailAdmin = adminEmails.includes(user.email.trim().toLowerCase())
  if (!isEmailAdmin) {
    return {
      authorized: false,
      status: 403,
      user,
      error: 'Forbidden'
    }
  }

  return {
    authorized: true,
    status: 200,
    user
  }
}
