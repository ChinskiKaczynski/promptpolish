import { notFound } from 'next/navigation'
import { getPromptAnalysisForOwner, getUserProfile } from '@/lib/supabase/queries'
import { getOwnerIdFromCookies } from '@/lib/identity/anonymous'
import { getAuthUser } from '@/lib/identity/auth'
import { ResultView } from '@/components/result/result-view'
import type { AnalysisResult } from '@/lib/ai/schemas'
import { AppHeader } from '@/components/layout/app-header'
import { AppFooter } from '@/components/layout/app-footer'

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

  // 2b. Resolve plan slug
  let planSlug: 'free' | 'pro' = 'free'
  if (user) {
    const profile = await getUserProfile(user.id)
    if (profile?.plan_slug === 'pro') {
      planSlug = 'pro'
    }
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
    <div className="flex min-h-screen flex-col bg-slate-50/30 selection:bg-indigo-100 antialiased font-sans">
      <AppHeader />
      
      <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-10">
        <ResultView result={mappedResult} mode="private" planSlug={planSlug} />
      </main>

      <AppFooter />
    </div>
  )
}
