import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { verifyAndExtractId, signId } from '@/lib/identity/anonymous'

export async function middleware(request: NextRequest) {
  // Defense-in-depth: immediately bypass middleware for M2M endpoints
  const { pathname } = request.nextUrl
  if (
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/api/cron')
  ) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 1. Check and provision owner_anonymous_id if needed
  const ownerCookie = request.cookies.get('owner_anonymous_id')
  let validOwnerId: string | null = null
  if (ownerCookie?.value) {
    validOwnerId = await verifyAndExtractId(ownerCookie.value)
  }

  if (!validOwnerId) {
    const newOwnerId = crypto.randomUUID()
    const signedValue = await signId(newOwnerId)

    request.cookies.set('owner_anonymous_id', signedValue)
    response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
    response.cookies.set('owner_anonymous_id', signedValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365 // 1 year
    })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return response
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })

        // Preserve owner_anonymous_id cookie
        const currentOwnerCookie = request.cookies.get('owner_anonymous_id')
        if (currentOwnerCookie?.value) {
          response.cookies.set('owner_anonymous_id', currentOwnerCookie.value, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 365
          })
        }
      },
    },
  })

  // Refresh the user session if expired
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/webhooks (machine-to-machine webhook endpoints)
     * - api/cron (scheduled cron job endpoints)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks|api/cron).*)',
  ],
}
