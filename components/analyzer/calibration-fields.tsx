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
    <div className="grid gap-4 sm:grid-cols-2 font-mono text-xs">
      <label className="space-y-2 block">
        <span className="font-bold text-pp-text uppercase tracking-wider block">
          {workingLanguage === 'pl' ? 'Cel zadania (Goal)' : 'Task goal (Goal)'}
        </span>
        <input 
          className="pp-input"
          placeholder={workingLanguage === 'pl' ? 'np. Napisanie posta blogowego SEO' : 'e.g. Writing an SEO blog post'}
          value={taskGoal} 
          onChange={(e) => setTaskGoal(e.target.value)} 
        />
      </label>

      <label className="space-y-2 block">
        <span className="font-bold text-pp-text uppercase tracking-wider block">
          {workingLanguage === 'pl' ? 'Typ zadania (Task Type)' : 'Task type (Task Type)'}
        </span>
        <input 
          className="pp-input"
          placeholder={workingLanguage === 'pl' ? 'np. Kreatywne pisanie, Analiza danych, Kodowanie' : 'e.g. Creative writing, Data analysis, Coding'}
          value={taskType} 
          onChange={(e) => setTaskType(e.target.value)} 
        />
      </label>

      <label className="space-y-2 block">
        <span className="font-bold text-pp-text uppercase tracking-wider block">
          {workingLanguage === 'pl' ? 'Oczekiwany format wyjściowy (Expected Format)' : 'Expected output format (Expected Format)'}
        </span>
        <input 
          className="pp-input"
          placeholder={workingLanguage === 'pl' ? 'np. Tabela Markdown, Lista bulletpoints, Kod JSON' : 'e.g. Markdown table, Bulletpoints, JSON code'}
          value={expectedOutputFormat} 
          onChange={(e) => setExpectedOutputFormat(e.target.value)} 
        />
      </label>

      <label className="space-y-2 block">
        <span className="font-bold text-pp-text uppercase tracking-wider block">
          {workingLanguage === 'pl' ? 'Szczególne ograniczenia (Constraints)' : 'Specific constraints (Constraints)'}
        </span>
        <input 
          className="pp-input"
          placeholder={workingLanguage === 'pl' ? 'np. Maksymalnie 300 słów, Ton profesjonalny' : 'e.g. Maximum 300 words, Professional tone'}
          value={constraints} 
          onChange={(e) => setConstraints(e.target.value)} 
        />
      </label>
    </div>
  )
}
