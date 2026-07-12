import { z } from 'zod'
import { scoringCriteria, type ScoringCriterion } from '@/lib/scoring/scoring-config'

export const analysisSchemaVersion = '1.0.0'

export const analysisCriterionSchema = z.object({
  criterion: z.enum(scoringCriteria as [ScoringCriterion, ...ScoringCriterion[]]),
  raw_score_0_10: z.number().min(0).max(10),
  rationale: z.string().min(1).max(2000),
  improvement_suggestion: z.string().min(1).max(2000)
}).strict()

export const analysisResultSchema = z.object({
  analysis_schema_version: z.string().min(1).max(50),
  overall_summary: z.string().min(1).max(10000),
  detected_task_type: z.string().min(1).max(100),
  criteria_scores: z.array(analysisCriterionSchema).length(scoringCriteria.length),
  top_weaknesses: z.array(z.string().min(1).max(1000)).min(1).max(8),
  improvement_plan: z.array(z.string().min(1).max(1000)).min(1).max(10),
  improved_prompt: z.string().min(1).max(100000),
  change_explanations: z.array(z.string().min(1).max(1000)).min(1).max(10),
  model_fit_notes: z.array(z.string().min(1).max(1000)).max(8),
  uncertainty_warnings: z.array(z.string().min(1).max(1000)).max(8),
  safety_notes: z.array(z.string().min(1).max(1000)).max(8)
}).strict()

export type AnalysisCriterion = z.infer<typeof analysisCriterionSchema>
export type AnalysisResult = z.infer<typeof analysisResultSchema>
