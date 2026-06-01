import { notFound } from 'next/navigation'
import { getSharedPromptAnalysis } from '@/lib/supabase/queries'
import { ResultView } from '@/components/result/result-view'
import type { AnalysisResult } from '@/lib/ai/schemas'

interface PageProps {
  params: Promise<{ token: string }>
}

/**
 * Public share page — accessible to anyone with the share token URL.
 *
 * Privacy guarantees:
 * - Access is by random share_token only, never by internal UUID.
 * - getSharedPromptAnalysis returns a scrubbed Pick<> that excludes:
 *   owner_anonymous_id, user_id, id, share_token, sensitive_data_findings_json,
 *   model_id_used, provider_used, all *_version fields, task_goal, constraints, etc.
 * - ResultView is rendered with mode="share" which hides the feedback section,
 *   share controls, and owner-specific UI.
 * - Sharing is disabled by default; this page returns 404 for any token where
 *   is_share_enabled = false or the token does not exist.
 */
export default async function SharedResultPage({ params }: PageProps) {
  const { token } = await params

  // Load scrubbed public payload — returns null for disabled or nonexistent tokens
  const record = await getSharedPromptAnalysis(token)
  if (!record) {
    notFound()
  }

  // Map scrubbed DB fields to ResultView props.
  // Deliberately omit: id, shareToken, isShareEnabled — none should leak to the client.
  const analysisJson = record.analysis_json as unknown as AnalysisResult
  const mappedResult = {
    ...analysisJson,
    overallScore: record.overall_score,
    scoreLevel: record.score_level,
    improved_prompt: record.improved_prompt
    // id intentionally absent — prevents private UUID exposure
    // isShareEnabled intentionally absent
    // shareToken intentionally absent
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <ResultView result={mappedResult} mode="share" />
    </main>
  )
}
