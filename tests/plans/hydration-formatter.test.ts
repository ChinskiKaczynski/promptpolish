import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { integerFormatter } from '@/components/analyzer/analyze-form'

describe('integerFormatter', () => {
  it('correctly formats values with pl-PL locale', () => {
    expect(integerFormatter.format(0)).toBe('0')
    expect(integerFormatter.format(20)).toBe('20')
    
    const formatted3000 = integerFormatter.format(3000)
    expect(formatted3000.replace(/\s/g, ' ')).toBe('3 000')

    const formatted12000 = integerFormatter.format(12000)
    expect(formatted12000.replace(/\s/g, ' ')).toBe('12 000')
  })
})
