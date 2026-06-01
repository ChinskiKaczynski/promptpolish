import { AnalyzeForm } from '@/components/analyzer/analyze-form'
import { AppHeader } from '@/components/layout/app-header'
import { AppFooter } from '@/components/layout/app-footer'

export default function AnalyzePage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50/30 selection:bg-indigo-100 antialiased font-sans">
      <AppHeader />
      
      <main className="flex-1 mx-auto w-full max-w-4xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">PromptPolish</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Przeanalizuj prompt</h1>
          <p className="mt-3 text-slate-600 text-sm">
            Wprowadź treść swojej instrukcji, zdefiniuj opcjonalny cel i rozpocznij audyt jakości promptu.
          </p>
        </div>
        <AnalyzeForm />
      </main>

      <AppFooter />
    </div>
  )
}
