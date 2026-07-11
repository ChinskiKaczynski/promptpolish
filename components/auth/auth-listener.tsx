'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'

/**
 * Global authentication listener that synchronizes the client-side
 * Supabase auth state with our secure server-side session cookies.
 */
export function AuthListener() {
  const router = useRouter()
  const lastUserIdRef = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    if (!supabaseClient) return

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      const currentUserId = session?.user?.id || null

      if (lastUserIdRef.current === undefined) {
        // Initialize on first event
        lastUserIdRef.current = currentUserId
        
        // If logged in initially, sync session
        if (currentUserId) {
          try {
            await fetch('/api/auth/session', {
              method: 'POST',
              keepalive: true
            })
            router.refresh()
          } catch (err) {
            console.error('Failed to sync auth session server-side:', err)
          }
        }
        return
      }

      if (currentUserId === lastUserIdRef.current) {
        return
      }

      lastUserIdRef.current = currentUserId

      if (event === 'SIGNED_IN' || currentUserId) {
        try {
          await fetch('/api/auth/session', {
            method: 'POST',
            keepalive: true
          })
          if (window.location.pathname === '/login') {
            router.push('/account')
          } else {
            router.refresh()
          }
        } catch (err) {
          console.error('Failed to sync auth session server-side:', err)
        }
      } else if (event === 'SIGNED_OUT' || !currentUserId) {
        try {
          await fetch('/api/auth/session', {
            method: 'DELETE',
            keepalive: true
          })
          const protectedRoutes = ['/account', '/history']
          const isProtected = protectedRoutes.some(route => window.location.pathname.startsWith(route))
          if (isProtected) {
            router.push('/login')
          } else {
            router.refresh()
          }
        } catch (err) {
          console.error('Failed to clear auth session server-side:', err)
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  return null
}

