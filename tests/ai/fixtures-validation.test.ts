import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'
import { z } from 'zod'

// Strict Zod schema mirroring the calibration requirements in docs/evaluation-fixtures.md
const fixtureSchema = z.object({
  id: z.string().min(1),
  input_prompt: z.string().min(1),
  working_language: z.enum(['pl', 'en']),
  profile_slug: z.enum(['general-llm']),
  task_type: z.string().min(1),
  expected_score_range: z.array(z.number().int().min(0).max(100)).length(2),
  expected_strengths: z.array(z.string()).optional(),
  expected_weaknesses: z.array(z.string()),
  must_include_in_improved_prompt: z.array(z.string()),
  must_not_include: z.array(z.string()),
  should_warn_sensitive_data: z.boolean(),
  should_warn_uncertain_facts: z.boolean(),
  max_reasonable_improved_length_ratio: z.number().positive(),
  notes_for_manual_review: z.string().min(1),
  fixture_category: z.enum(['production_case', 'stress_case', 'regression_case', 'safety_case', 'uncertainty_case', 'calibration_case']).optional(),
  assertion_strictness: z.enum(['low', 'medium', 'high']).optional(),
  calibration_notes: z.string().optional()
})

type Fixture = z.infer<typeof fixtureSchema>

describe('AI Evaluation Fixtures Schema Validation', () => {
  const fixturesDir = path.resolve(__dirname, '../ai-fixtures')

  const testFileValidity = (fileName: string, minCount: number) => {
    const filePath = path.join(fixturesDir, fileName)
    
    it(`verifies that "${fileName}" parses, contains at least ${minCount} items, and strictly matches the Zod schema`, () => {
      expect(fs.existsSync(filePath), `Fixture file ${fileName} does not exist`).toBe(true)

      const raw = fs.readFileSync(filePath, 'utf-8')
      let parsed: unknown
      
      expect(() => {
        parsed = JSON.parse(raw)
      }, `File "${fileName}" contains malformed JSON`).not.toThrow()

      expect(Array.isArray(parsed), `File "${fileName}" must be a JSON array`).toBe(true)
      const arr = parsed as unknown[]
      expect(arr.length).toBeGreaterThanOrEqual(minCount)

      for (let i = 0; i < arr.length; i++) {
        const item = arr[i]
        const parseResult = fixtureSchema.safeParse(item)
        
        expect(
          parseResult.success,
          `Validation failed for "${fileName}" at index ${i}:\n${JSON.stringify(parseResult.error?.flatten(), null, 2)}`
        ).toBe(true)

        const fixture = parseResult.data as Fixture
        const [minScore, maxScore] = fixture.expected_score_range
        expect(minScore, `Index ${i} in "${fileName}": expected_score_range min (${minScore}) must be <= max (${maxScore})`).toBeLessThanOrEqual(maxScore)
      }
    })
  }

  // 1. Weak PL Prompts
  testFileValidity('weak-pl.json', 10)

  // 2. Strong PL Prompts
  testFileValidity('strong-pl.json', 10)

  // 3. Weak EN Prompts
  testFileValidity('weak-en.json', 10)

  // 4. Strong EN Prompts
  testFileValidity('strong-en.json', 10)

  // 5. Coding Prompts
  testFileValidity('coding.json', 5)

  // 6. Marketing Prompts
  testFileValidity('marketing.json', 5)

  // 7. Research Prompts
  testFileValidity('research.json', 5)

  // 8. Data Analysis Prompts
  testFileValidity('data-analysis.json', 5)

  // 9. Sensitive Data Prompts
  testFileValidity('sensitive-data.json', 6)

  // 10. Hallucination/Uncertain Facts Vectors
  testFileValidity('uncertain-facts.json', 5)

  // 11. Too Long Output Prompts
  testFileValidity('too-long-output.json', 5)
})
