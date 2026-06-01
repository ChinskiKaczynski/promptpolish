import 'server-only'
import { getUserProfile } from '../supabase/queries'

export type PlanSlug = 'anonymous' | 'free' | 'pro'

export interface PlanConfig {
  slug: PlanSlug
  name: string
  monthlyAnalyses: number
  dailyAbuseLimit: number
  maxPromptChars: number
  exportMarkdown: boolean
  exportPdf: boolean
  batchAudit: boolean
}

export const PLAN_LIMITS: Record<PlanSlug, PlanConfig> = {
  anonymous: {
    slug: 'anonymous',
    name: 'Anonymous',
    monthlyAnalyses: 10,
    dailyAbuseLimit: Number(process.env.ANONYMOUS_DAILY_LIMIT || 3),
    maxPromptChars: 12000,
    exportMarkdown: false,
    exportPdf: false,
    batchAudit: false,
  },
  free: {
    slug: 'free',
    name: 'Free',
    monthlyAnalyses: 20,
    dailyAbuseLimit: 5,
    maxPromptChars: 12000,
    exportMarkdown: false,
    exportPdf: false,
    batchAudit: false,
  },
  pro: {
    slug: 'pro',
    name: 'Pro',
    monthlyAnalyses: 500,
    dailyAbuseLimit: 100,
    maxPromptChars: 24000,
    exportMarkdown: true,
    exportPdf: true,
    batchAudit: true,
  },
} as const

export interface LimitCheckResult {
  allowed: boolean
  reason?: 'monthly_limit_reached' | 'daily_abuse_limit_reached'
  limit?: number
}

/**
 * Checks if a user is permitted to run a new prompt analysis.
 */
export function canAnalyzePrompt(
  planSlug: PlanSlug,
  monthlyCount: number,
  dailyCount: number
): LimitCheckResult {
  const limits = PLAN_LIMITS[planSlug]
  
  if (dailyCount >= limits.dailyAbuseLimit) {
    return {
      allowed: false,
      reason: 'daily_abuse_limit_reached',
      limit: limits.dailyAbuseLimit
    }
  }

  if (monthlyCount >= limits.monthlyAnalyses) {
    return {
      allowed: false,
      reason: 'monthly_limit_reached',
      limit: limits.monthlyAnalyses
    }
  }

  return { allowed: true }
}

/**
 * Check if the user is allowed to export a report as Markdown.
 */
export function canExportMarkdown(planSlug: PlanSlug): boolean {
  return PLAN_LIMITS[planSlug].exportMarkdown
}

/**
 * Check if the user is allowed to export a report as PDF.
 */
export function canExportPdf(planSlug: PlanSlug): boolean {
  return PLAN_LIMITS[planSlug].exportPdf
}

/**
 * Check if the user is allowed to perform a batch audit.
 */
export function canUseBatchAudit(planSlug: PlanSlug): boolean {
  return PLAN_LIMITS[planSlug].batchAudit
}

/**
 * Resolves the plan slug for a user dynamically.
 */
export async function getPlanSlugForUser(userId: string | null): Promise<PlanSlug> {
  if (!userId) return 'anonymous'
  const profile = await getUserProfile(userId)
  return profile?.plan_slug === 'pro' ? 'pro' : 'free'
}
