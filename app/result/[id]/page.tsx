import { notFound } from 'next/navigation'
import { getPromptAnalysisForOwner } from '@/lib/supabase/queries'
import { getOwnerIdFromCookies } from '@/lib/identity/anonymous'
import { ResultView } from '@/components/result/result-view'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PrivateResultPage({ params }: PageProps) {
  const { id } = await params

  // 1. Resolve owner identity from signed secure cookie
  const ownerAnonymousId = await getOwnerIdFromCookies()
  if (!ownerAnonymousId) {
    notFound()
  }

  // 2. Fetch prompt analysis and strictly verify owner identity in database filter
  const record = await getPromptAnalysisForOwner(id, ownerAnonymousId)
  if (!record) {
    notFound()
  }

  // 3. Map database values to schema structure expected by the ResultView UI component
  const mappedResult = {
    ...(record.analysis_json as any),
    overallScore: record.overall_score,
    scoreLevel: record.score_level,
    improved_prompt: record.improved_prompt
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <ResultView result={mappedResult} mode="private" />
    </main>
  )
}
