import { ResultView } from '@/components/result/result-view'
import { mockAnalysisResult } from '@/lib/ai/mock-analysis'
import { AppHeader } from '@/components/layout/app-header'
import { AppFooter } from '@/components/layout/app-footer'

export default function MockResultPage() {
  return (
    <div className="flex min-h-screen flex-col pp-grid-bg text-pp-text selection:bg-pp-border-bright selection:text-white antialiased font-mono">
      <AppHeader />
      
      <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-10 z-10 relative">
        <ResultView result={mockAnalysisResult} mode="private" />
      </main>

      <AppFooter />
    </div>
  )
}
