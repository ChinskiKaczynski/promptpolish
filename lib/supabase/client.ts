import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'
import { clientEnv } from '@/lib/env/client'

const supabaseUrl = clientEnv.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

export const supabaseClient =
  supabaseUrl && supabaseAnonKey
    ? createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
    : null
