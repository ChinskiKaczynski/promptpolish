'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'

/**
 * Global authentication listener that synchronizes the client-side
 * Supabase auth state with our secure server-side session cookies.
 */
export function AuthListener() {
  const router = useRouter()

  useEffect(() => {
    if (!supabaseClient) return

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.access_token) {
          try {
            await fetch('/api/auth/session', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ accessToken: session.access_token })
            })
            router.refresh()
          } catch (err) {
            console.error('Failed to sync auth session server-side:', err)
          }
        }
      } else if (event === 'SIGNED_OUT') {
        try {
          await fetch('/api/auth/session', {
            method: 'DELETE'
          })
          router.refresh()
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
