'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'

export function SignOutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    if (!supabaseClient) return
    setLoading(true)
    try {
      await supabaseClient.auth.signOut()
      router.push('/')
      router.refresh()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
    >
      {loading ? 'Wylogowywanie...' : 'Wyloguj się'}
    </button>
  )
}
