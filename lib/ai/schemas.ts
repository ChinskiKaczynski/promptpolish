import { z } from 'zod'
import { scoringCriteria, type ScoringCriterion } from '@/lib/scoring/scoring-config'

export const analysisSchemaVersion = '1.0.0'

export const analysisCriterionSchema = z.object({
  criterion: z.enum(scoringCriteria as [ScoringCriterion, ...ScoringCriterion[]]),
  raw_score_0_10: z.number().min(0).max(10),
  rationale: z.string().min(1),
  improvement_suggestion: z.string().min(1)
})

export const analysisResultSchema = z.object({
  analysis_schema_version: z.string().min(1),
  overall_summary: z.string().min(1),
  detected_task_type: z.string().min(1),
  criteria_scores: z.array(analysisCriterionSchema).length(scoringCriteria.length),
  top_weaknesses: z.array(z.string()).min(1).max(8),
  improvement_plan: z.array(z.string()).min(1).max(10),
  improved_prompt: z.string().min(1),
  change_explanations: z.array(z.string()).min(1).max(10),
  model_fit_notes: z.array(z.string()).max(8),
  uncertainty_warnings: z.array(z.string()).max(8),
  safety_notes: z.array(z.string()).max(8)
})

export type AnalysisResult = z.infer<typeof analysisResultSchema>
