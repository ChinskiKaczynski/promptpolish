import { describe, expect, it } from 'vitest'
import { criterionTranslations } from '@/components/result/result-view'

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
})
