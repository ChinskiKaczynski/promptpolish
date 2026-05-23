import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''

export const supabaseClient: SupabaseClient<Database> = createClient<Database>(supabaseUrl, supabaseAnonKey)
