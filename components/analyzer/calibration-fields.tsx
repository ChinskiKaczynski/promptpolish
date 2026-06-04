'use client'

interface CalibrationFieldsProps {
  taskGoal: string
  setTaskGoal: (val: string) => void
  taskType: string
  setTaskType: (val: string) => void
  expectedOutputFormat: string
  setExpectedOutputFormat: (val: string) => void
  constraints: string
  setConstraints: (val: string) => void
  workingLanguage: 'pl' | 'en'
}

export function CalibrationFields({
  taskGoal,
  setTaskGoal,
  taskType,
  setTaskType,
  expectedOutputFormat,
  setExpectedOutputFormat,
  constraints,
  setConstraints,
  workingLanguage
}: CalibrationFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="space-y-2 text-sm font-semibold text-slate-800 block">
        {workingLanguage === 'pl' ? 'Cel zadania (Goal)' : 'Task goal (Goal)'}
        <input 
          className="w-full rounded-2xl border border-slate-200 bg-slate-50/30 focus:border-indigo-500 focus:bg-white focus:outline-none px-4 py-3 text-sm transition"
          placeholder={workingLanguage === 'pl' ? 'np. Napisanie posta blogowego SEO' : 'e.g. Writing an SEO blog post'}
          value={taskGoal} 
          onChange={(e) => setTaskGoal(e.target.value)} 
        />
      </label>

      <label className="space-y-2 text-sm font-semibold text-slate-800 block">
        {workingLanguage === 'pl' ? 'Typ zadania (Task Type)' : 'Task type (Task Type)'}
        <input 
          className="w-full rounded-2xl border border-slate-200 bg-slate-50/30 focus:border-indigo-500 focus:bg-white focus:outline-none px-4 py-3 text-sm transition"
          placeholder={workingLanguage === 'pl' ? 'np. Kreatywne pisanie, Analiza danych, Kodowanie' : 'e.g. Creative writing, Data analysis, Coding'}
          value={taskType} 
          onChange={(e) => setTaskType(e.target.value)} 
        />
      </label>

      <label className="space-y-2 text-sm font-semibold text-slate-800 block">
        {workingLanguage === 'pl' ? 'Oczekiwany format wyjściowy (Expected Format)' : 'Expected output format (Expected Format)'}
        <input 
          className="w-full rounded-2xl border border-slate-200 bg-slate-50/30 focus:border-indigo-500 focus:bg-white focus:outline-none px-4 py-3 text-sm transition"
          placeholder={workingLanguage === 'pl' ? 'np. Tabela Markdown, Lista bulletpoints, Kod JSON' : 'e.g. Markdown table, Bulletpoints, JSON code'}
          value={expectedOutputFormat} 
          onChange={(e) => setExpectedOutputFormat(e.target.value)} 
        />
      </label>

      <label className="space-y-2 text-sm font-semibold text-slate-800 block">
        {workingLanguage === 'pl' ? 'Szczególne ograniczenia (Constraints)' : 'Specific constraints (Constraints)'}
        <input 
          className="w-full rounded-2xl border border-slate-200 bg-slate-50/30 focus:border-indigo-500 focus:bg-white focus:outline-none px-4 py-3 text-sm transition"
          placeholder={workingLanguage === 'pl' ? 'np. Maksymalnie 300 słów, Ton profesjonalny' : 'e.g. Maximum 300 words, Professional tone'}
          value={constraints} 
          onChange={(e) => setConstraints(e.target.value)} 
        />
      </label>
    </div>
  )
}
