import { ResultView } from '@/components/result/result-view'
import { mockAnalysisResult } from '@/lib/ai/mock-analysis'

export default function MockResultPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <ResultView result={mockAnalysisResult} mode="private" />
    </main>
  )
}
