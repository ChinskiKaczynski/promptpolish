import { notFound } from 'next/navigation'
import { getPromptAnalysisForOwner } from '@/lib/supabase/queries'
import { getOwnerIdFromCookies } from '@/lib/identity/anonymous'
import { getAuthUser } from '@/lib/identity/auth'
import { ResultView } from '@/components/result/result-view'
import type { AnalysisResult } from '@/lib/ai/schemas'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PrivateResultPage({ params }: PageProps) {
  const { id } = await params

  // 1. Resolve owner identity from signed secure cookie and logged-in user
  const ownerAnonymousId = await getOwnerIdFromCookies()
  const user = await getAuthUser()

  if (!ownerAnonymousId && !user) {
    notFound()
  }

  // 2. Fetch prompt analysis and strictly verify owner identity in database filter
  const record = user
    ? await getPromptAnalysisForOwner(id, ownerAnonymousId || '', user.id)
    : await getPromptAnalysisForOwner(id, ownerAnonymousId || '')
  if (!record) {
    notFound()
  }

  // 3. Map database values to schema structure expected by the ResultView UI component
  const analysisJson = record.analysis_json as unknown as AnalysisResult
  const mappedResult = {
    ...analysisJson,
    overallScore: record.overall_score,
    scoreLevel: record.score_level,
    improved_prompt: record.improved_prompt,
    id: record.id,
    isShareEnabled: record.is_share_enabled,
    shareToken: record.share_token
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <ResultView result={mappedResult} mode="private" />
    </main>
  )
}
