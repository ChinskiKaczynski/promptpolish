import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getSharedPromptAnalysis } from '@/lib/supabase/queries'
import { ResultView } from '@/components/result/result-view'
import type { AnalysisResult } from '@/lib/ai/schemas'
import { AppHeader } from '@/components/layout/app-header'
import { AppFooter } from '@/components/layout/app-footer'

export const metadata: Metadata = {
  title: 'Publiczny Raport Audytu — PromptPolish',
  robots: {
    index: false,
    follow: false,
  },
}

export const dynamic = 'force-dynamic'
// Prevent any persistent cache — revoked share links must return 404 immediately
export const revalidate = 0

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
    improved_prompt: record.improved_prompt,
    selected_profile_slug: record.selected_profile_slug,
    working_language: record.working_language
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0C0C10] text-[#E2E8F0] selection:bg-[#A78BFA]/20 antialiased font-sans">
      <AppHeader publicShare={true} />
      
      <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-10">
        <ResultView result={mappedResult} mode="share" />
      </main>

      <AppFooter />
    </div>
  )
}
