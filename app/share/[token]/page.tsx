import { notFound } from 'next/navigation'
import { getSharedPromptAnalysis } from '@/lib/supabase/queries'
import { ResultView } from '@/components/result/result-view'
import type { AnalysisResult } from '@/lib/ai/schemas'
import { AppHeader } from '@/components/layout/app-header'
import { AppFooter } from '@/components/layout/app-footer'

interface PageProps {
  params: Promise<{ token: string }>
}

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
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/30 selection:bg-indigo-100 antialiased font-sans">
      <AppHeader publicShare={true} />
      
      <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-10">
        <ResultView result={mappedResult} mode="share" />
      </main>

      <AppFooter />
    </div>
  )
}
