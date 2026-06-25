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
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="space-y-1.5">
        <label htmlFor="task-goal" className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] block">
          {workingLanguage === 'pl' ? 'Cel zadania (Goal)' : 'Task goal (Goal)'}
        </label>
        <input 
          id="task-goal"
          className="w-full rounded-lg border border-[#2A2A3A] bg-[#0C0C10] text-[#E2E8F0] placeholder:text-[#8290A2] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#A78BFA]/20 focus:outline-none px-4 py-3 text-sm transition"
          placeholder={workingLanguage === 'pl' ? 'np. Napisanie posta blogowego SEO' : 'e.g. Writing an SEO blog post'}
          value={taskGoal} 
          onChange={(e) => setTaskGoal(e.target.value)} 
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="task-type" className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] block">
          {workingLanguage === 'pl' ? 'Typ zadania (Task Type)' : 'Task type (Task Type)'}
        </label>
        <input 
          id="task-type"
          className="w-full rounded-lg border border-[#2A2A3A] bg-[#0C0C10] text-[#E2E8F0] placeholder:text-[#8290A2] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#A78BFA]/20 focus:outline-none px-4 py-3 text-sm transition"
          placeholder={workingLanguage === 'pl' ? 'np. Kreatywne pisanie, Analiza danych, Kodowanie' : 'e.g. Creative writing, Data analysis, Coding'}
          value={taskType} 
          onChange={(e) => setTaskType(e.target.value)} 
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="expected-output-format" className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] block">
          {workingLanguage === 'pl' ? 'Oczekiwany format wyjściowy (Expected Format)' : 'Expected output format (Expected Format)'}
        </label>
        <input 
          id="expected-output-format"
          className="w-full rounded-lg border border-[#2A2A3A] bg-[#0C0C10] text-[#E2E8F0] placeholder:text-[#8290A2] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#A78BFA]/20 focus:outline-none px-4 py-3 text-sm transition"
          placeholder={workingLanguage === 'pl' ? 'np. Tabela Markdown, Lista bulletpoints, Kod JSON' : 'e.g. Markdown table, Bulletpoints, JSON code'}
          value={expectedOutputFormat} 
          onChange={(e) => setExpectedOutputFormat(e.target.value)} 
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="constraints" className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] block">
          {workingLanguage === 'pl' ? 'Szczególne ograniczenia (Constraints)' : 'Specific constraints (Constraints)'}
        </label>
        <input 
          id="constraints"
          className="w-full rounded-lg border border-[#2A2A3A] bg-[#0C0C10] text-[#E2E8F0] placeholder:text-[#8290A2] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#A78BFA]/20 focus:outline-none px-4 py-3 text-sm transition"
          placeholder={workingLanguage === 'pl' ? 'np. Maksymalnie 300 słów, Ton profesjonalny' : 'e.g. Maximum 300 words, Professional tone'}
          value={constraints} 
          onChange={(e) => setConstraints(e.target.value)} 
        />
      </div>
    </div>
  )
}
