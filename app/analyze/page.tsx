import { AnalyzeForm } from '@/components/analyzer/analyze-form'

export default function AnalyzePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">PromptPolish</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Przeanalizuj prompt</h1>
        <p className="mt-3 text-slate-600">
          Starter używa lokalnego mocka. Prawdziwe API, Supabase i Gemini dodaj dopiero w kolejnych misjach.
        </p>
      </div>
      <AnalyzeForm />
    </main>
  )
}
