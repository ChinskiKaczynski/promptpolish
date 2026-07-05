import 'server-only'
import { serverEnv } from '../env/server'
import { getUserProfile } from '../supabase/queries'
import { getSubscriptionByUserId } from '../supabase/billing'

export type PlanSlug = 'anonymous' | 'free' | 'pro'

export interface PlanConfig {
  slug: PlanSlug
  name: string
  /** UTC monthly analysis allowance */
  monthlyAnalyses: number
  /** UTC daily abuse ceiling (canonical name) */
  dailyAnalyses: number
  /**
   * Maximum input prompt characters allowed.
   * The backend must enforce this AFTER resolving the plan server-side.
   */
  maxPromptChars: number
  /** Whether the plan allows Markdown (.md) export */
  exportMarkdown: boolean
  /**
   * Whether the plan allows plain-text (.txt) export.
   * Governed independently from exportMarkdown — do NOT alias.
   */
  exportText: boolean
  /** Whether the plan allows PDF export */
  exportPdf: boolean
  /** Whether the plan allows creating a public opt-in share link */
  shareResult: boolean
  /** Batch audit — always false in MVP scope */
  batchAudit: boolean
}

/**
 * Canonical plan capability and limit configuration.
 *
 * This is the SINGLE source of truth for ALL plan-gated behavior.
 * Every backend route, API handler, and UI capability derivation
 * must use this config. Do not duplicate numeric limits elsewhere.
 *
 * Product contract:
 * | Capability       | Anonymous | Free  | Pro    |
 * |------------------|----------:|------:|-------:|
 * | Daily analyses   |         3 |     5 |    100 |
 * | Monthly analyses |        10 |    20 |    500 |
 * | Max prompt chars |    12,000 |12,000 | 24,000 |
 * | exportMarkdown   |       Yes |   Yes |    Yes |
 * | exportText       |       Yes |   Yes |    Yes |
 * | exportPdf        |        No |    No |    Yes |
 * | shareResult      |       Yes |   Yes |    Yes |
 */
export const PLAN_LIMITS: Record<PlanSlug, PlanConfig> = {
  anonymous: {
    slug: 'anonymous',
    name: 'Anonymous',
    monthlyAnalyses: 10,
    dailyAnalyses: serverEnv.ANONYMOUS_DAILY_LIMIT,
    maxPromptChars: 12000,
    exportMarkdown: true,
    exportText: true,
    exportPdf: false,
    shareResult: true,
    batchAudit: false,
  },
  free: {
    slug: 'free',
    name: 'Free',
    monthlyAnalyses: 20,
    dailyAnalyses: 5,
    maxPromptChars: 12000,
    exportMarkdown: true,
    exportText: true,
    exportPdf: false,
    shareResult: true,
    batchAudit: false,
  },
  pro: {
    slug: 'pro',
    name: 'Pro',
    monthlyAnalyses: 500,
    dailyAnalyses: 100,
    maxPromptChars: 24000,
    exportMarkdown: true,
    exportText: true,
    exportPdf: true,
    shareResult: true,
    batchAudit: false,
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

  if (dailyCount >= limits.dailyAnalyses) {
    return {
      allowed: false,
      reason: 'daily_abuse_limit_reached',
      limit: limits.dailyAnalyses
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
 * Check if the plan allows Markdown (.md) export.
 * Anonymous, Free and Pro all return true per product contract.
 */
export function canExportMarkdown(planSlug: PlanSlug): boolean {
  return PLAN_LIMITS[planSlug].exportMarkdown
}

/**
 * Check if the plan allows plain-text (.txt) export.
 * Anonymous, Free and Pro all return true per product contract.
 * TXT is governed independently of Markdown.
 */
export function canExportText(planSlug: PlanSlug): boolean {
  return PLAN_LIMITS[planSlug].exportText
}

/**
 * Check if the plan allows PDF export.
 * Only Pro returns true.
 */
export function canExportPdf(planSlug: PlanSlug): boolean {
  return PLAN_LIMITS[planSlug].exportPdf
}

/**
 * Check if the plan allows creating or revoking a public share link.
 * Anonymous, Free and Pro all return true per product contract.
 */
export function canShare(planSlug: PlanSlug): boolean {
  return PLAN_LIMITS[planSlug].shareResult
}

/**
 * Check if the user is allowed to perform a batch audit.
 * Always false in MVP scope.
 */
export function canUseBatchAudit(planSlug: PlanSlug): boolean {
  return PLAN_LIMITS[planSlug].batchAudit
}

/**
 * Resolves the plan slug for a user from the database.
 *
 * - Anonymous (userId === null): always 'anonymous'
 * - Authenticated: reads user_profiles.plan_slug
 *   - 'pro' → 'pro'
 *   - 'free' → 'free'
 *   - null / unknown / missing → safe fallback 'free'
 *
 * The client MUST NOT supply, override, or be trusted for the plan slug.
 * This function is the authoritative server-side plan resolver.
 */
export async function getPlanSlugForUser(userId: string | null): Promise<PlanSlug> {
  if (!userId) return 'anonymous'

  if (process.env.STRIPE_ENABLED === 'true') {
    try {
      const subscription = await getSubscriptionByUserId(userId)
      if (subscription) {
        const hasPro =
          subscription.plan_slug === 'pro' &&
          ['active', 'trialing', 'past_due'].includes(subscription.status) &&
          !subscription.ended_at
        if (hasPro) {
          return 'pro'
        }
      }
    } catch (err) {
      console.error('Error resolving plan slug from subscription:', err)
    }
  }

  const profile = await getUserProfile(userId)
  if (profile?.plan_slug === 'pro') return 'pro'
  if (profile?.plan_slug === 'free') return 'free'
  // Unknown / missing stored plan → safe fallback to free
  return 'free'
}
