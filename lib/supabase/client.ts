import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'
import { clientEnv } from '@/lib/env/client'

const supabaseUrl = clientEnv.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

export const supabaseClient: SupabaseClient<Database> | null =
  supabaseUrl && supabaseAnonKey
    ? createClient<Database>(supabaseUrl, supabaseAnonKey)
    : null
