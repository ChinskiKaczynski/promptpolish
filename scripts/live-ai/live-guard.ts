export function validateLiveAiEnvironment(env: Record<string, string | undefined>): {
  allowed: boolean
  reasons: string[]
} {
  const runLive = env.RUN_LIVE_AI_TESTS === 'true'
  const nodeEnv = env.NODE_ENV
  const apiKey = env.GOOGLE_GENERATIVE_AI_API_KEY
  const appUrl = env.APP_URL || ''
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || ''

  const isProductionSupabase = supabaseUrl.includes('uddpuxpdoctgaqabenol')
  const isProductionApp =
    appUrl.includes('promptpolish-seven.vercel.app') ||
    (appUrl !== '' && !appUrl.includes('localhost') && !appUrl.includes('127.0.0.1'))

  const reasons: string[] = []
  if (nodeEnv === 'production') reasons.push('NODE_ENV is production')
  if (!runLive) reasons.push('RUN_LIVE_AI_TESTS is not true')
  if (!apiKey || apiKey.trim() === '') reasons.push('GOOGLE_GENERATIVE_AI_API_KEY is missing')
  if (isProductionSupabase) reasons.push('Supabase URL points to production')
  if (isProductionApp) reasons.push('App URL points to production')

  return {
    allowed: reasons.length === 0,
    reasons
  }
}

export function enforceLiveAiGuards(): void {
  const validation = validateLiveAiEnvironment(process.env)
  if (!validation.allowed) {
    const errorMsg = `[CRITICAL GUARD FAILED] Live AI script execution blocked. Reasons: ${validation.reasons.join(', ')}`
    console.error(`\n${errorMsg}\n`)
    process.exit(1)
    throw new Error(errorMsg)
  }
}
