import { describe, expect, it, vi } from 'vitest'
import { constructUserAnalysisPrompt } from '@/lib/ai/prompts'

import { ModelProfile } from '@/lib/ai/gemini-client'

vi.mock('server-only', () => ({}))

describe('Time-Sensitive Guardrails & Context Verification Checks', () => {
  const dummyModelProfile = {
    displayName: 'Gemini 2.5 Flash',
    provider: 'google',
    verificationStatus: 'verified',
    confidenceLevel: 'high',
    profileVersion: 'v1.0'
  } as unknown as ModelProfile

  const checkHasGuardrail = (promptText: string): boolean => {
    const result = constructUserAnalysisPrompt({
      inputPrompt: promptText,
      workingLanguage: 'pl',
      modelProfile: dummyModelProfile
    })
    return result.includes('CRITICAL TIME-SENSITIVE DATA GUARDRAIL') || 
           result.includes('KRYTYCZNA INSTRUKCJA DLA DANYCH ZMIENNYCH W CZASIE')
  }

  // ── Positive fixtures (should trigger) ──────────────────────────────
  it('1. triggers guardrails for prompt asking for AI model pricing', () => {
    const prompt = 'Jaka jest cena modelu GPT-4o i ile kosztuje 1M tokenów wejściowych?'
    expect(checkHasGuardrail(prompt)).toBe(true)
  })

  it('2. triggers guardrails for prompt asking for current role owners / CEO', () => {
    const prompt = 'Who is the current CEO of Microsoft and when did they take the role?'
    expect(checkHasGuardrail(prompt)).toBe(true)
  })

  it('3. triggers guardrails for prompt asking for latest regulations and laws', () => {
    const prompt = 'Jakie regulacje prawne wprowadza EU AI Act w sierpniu 2026 roku?'
    expect(checkHasGuardrail(prompt)).toBe(true)
  })

  // ── Negative fixtures (should NOT trigger) ──────────────────────────
  it('4. does NOT trigger guardrails for a static creative task', () => {
    const prompt = 'Napisz opowiadanie fantasy o smoku, który bał się ciemności. Ma być barwne i pełne humoru.'
    expect(checkHasGuardrail(prompt)).toBe(false)
  })

  it('5. does NOT trigger guardrails for a static coding question', () => {
    const prompt = 'Popraw poniższy kod TypeScript, aby poprawnie obsługiwał interfejs: \ninterface User { id: string }'
    expect(checkHasGuardrail(prompt)).toBe(false)
  })

  // ── False-positive regression fixtures ─────────────────────────────
  it('6. does NOT falsely trigger on "ocena" (contains "cena" as substring)', () => {
    // "ocena" (assessment/grade) should NOT match "cena" (price)
    const prompt = 'Oceń jakość poniższego eseju i podaj ocenę punktową.'
    expect(checkHasGuardrail(prompt)).toBe(false)
  })

  it('7. does NOT falsely trigger on "React" (contains "act" as substring)', () => {
    // "React" framework should NOT match the legal keyword "act"
    const prompt = 'Jak skonfigurować React Router v6 w aplikacji TypeScript?'
    expect(checkHasGuardrail(prompt)).toBe(false)
  })

  it('8. does NOT falsely trigger on "interakcja" or "działanie" (abstract Polish words)', () => {
    const prompt = 'Opisz interakcję między komponentami w architekturze mikroserwisów.'
    expect(checkHasGuardrail(prompt)).toBe(false)
  })

  it('9. does NOT trigger when negation phrase "bez podawania ceny" is present', () => {
    const prompt = 'Napisz opis produktu bez podawania ceny — skup się na korzyściach.'
    expect(checkHasGuardrail(prompt)).toBe(false)
  })

  it('10. does NOT trigger when "without pricing" negation is present', () => {
    const prompt = 'Write a product landing page without pricing, focusing on features only.'
    expect(checkHasGuardrail(prompt)).toBe(false)
  })

  it('11. triggers for "koszt" correctly (standalone word in context)', () => {
    const prompt = 'Jaki jest koszt miesięczny hostingu na AWS EC2 t3.medium?'
    expect(checkHasGuardrail(prompt)).toBe(true)
  })

  it('12. triggers for English "pricing" in SaaS comparison context', () => {
    const prompt = 'Compare the pricing tiers of Vercel vs Netlify for a Next.js deployment.'
    expect(checkHasGuardrail(prompt)).toBe(true)
  })
})

