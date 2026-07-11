import { describe, expect, it } from 'vitest'
import { criterionTranslations, criterionDescriptions } from '@/components/result/result-view'

describe('Result Page Aesthetics & Polish UI Consistency', () => {
  it('translates all criterion keys to clean Polish without English parenthetical subtitles', () => {
    expect(criterionTranslations.goal_clarity).toBe('Jasność celu')
    expect(criterionTranslations.model_profile_fit).toBe('Dopasowanie do profilu audytu')
    expect(criterionTranslations.resistance_to_misinterpretation).toBe('Odporność na błędy interpretacji')
    
    // Ensure no English parentheses exist in the Polish translation labels
    for (const key in criterionTranslations) {
      expect(criterionTranslations[key]).not.toContain('(')
      expect(criterionTranslations[key]).not.toContain(')')
    }
  })

  it('contains clear Polish descriptions for all scoring criteria (tooltips)', () => {
    expect(criterionDescriptions).toBeDefined()
    expect(criterionDescriptions.testability).toBeDefined()
    expect(criterionDescriptions.cost_efficiency).toBeDefined()
    expect(criterionDescriptions.model_profile_fit).toBeDefined()
    expect(criterionDescriptions.resistance_to_misinterpretation).toBeDefined()
    expect(criterionDescriptions.safety).toBeDefined()

    // Verify format and that they are not empty
    for (const key in criterionDescriptions) {
      expect(criterionDescriptions[key].length).toBeGreaterThan(15)
      expect(criterionDescriptions[key]).toContain(':') // contains name prefix
    }
  })
})
