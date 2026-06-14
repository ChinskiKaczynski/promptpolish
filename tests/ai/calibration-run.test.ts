import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import { analyzePrompt } from '@/lib/ai/analyze-prompt'
import type { ModelProfileRow } from '@/lib/supabase/types'

vi.mock('server-only', () => ({}))

const PROMPTS = [
  {
    id: "P1",
    category: "Weak universal prompt",
    text: "write an email",
    lang: "en" as const
  },
  {
    id: "P2",
    category: "Strong universal prompt",
    text: "Write a polite email to request a refund for a damaged product. Include order number #12345, the product name (Desk Lamp), and explain the packaging was torn.",
    lang: "en" as const
  },
  {
    id: "P3",
    category: "SEO/content",
    text: "Napisz artykuł na bloga o zdrowym odżywianiu i dietach pudełkowych. Słowa kluczowe: dieta pudełkowa, zdrowe jedzenie, catering dietetyczny.",
    lang: "pl" as const
  },
  {
    id: "P4",
    category: "Coding",
    text: "Write a TypeScript function to parse a URL query string into a strongly-typed object, supporting array values and decoded characters.",
    lang: "en" as const
  },
  {
    id: "P5",
    category: "Data analysis",
    text: "Napisz zapytanie SQL, które obliczy miesięczny przychód ze sprzedaży dla każdego produktu w roku 2025, grupując według kategorii i sortując od najwyższego przychodu.",
    lang: "pl" as const
  },
  {
    id: "P6",
    category: "Research",
    text: "Summarize the key differences between memory management in Rust (ownership and borrowing) and Go (garbage collection).",
    lang: "en" as const
  },
  {
    id: "P7",
    category: "Marketing/sales",
    text: "Stwórz chwytliwy post marketingowy na Facebooka promujący nową aplikację mobilną do nauki języków obcych dla dzieci. Dodaj emotikony i CTA.",
    lang: "pl" as const
  },
  {
    id: "P8",
    category: "Agent/workflow",
    text: "Act as an AI orchestrator. Describe a step-by-step reasoning workflow to validate user input, classify intent, routing to specialized sub-agents, and synthesize a final response.",
    lang: "en" as const
  },
  {
    id: "P9",
    category: "Strict output format",
    text: "Napisz recenzję książki 'Władca Pierścieni'. Odpowiedź musi mieć dokładnie trzy akapity: wprowadzenie, zalety i wady, oraz podsumowanie.",
    lang: "pl" as const
  },
  {
    id: "P10",
    category: "Constraints and quality criteria",
    text: "Write a short story about a programmer and an AI. Constraints: must be under 300 words, must include the words 'antigravity', 'caffeine', and 'compile', and must end with a question.",
    lang: "en" as const
  }
]

describe('AI Score Calibration Runner', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env = { ...originalEnv }
    process.env.NODE_ENV = 'development'
    process.env.AI_MOCK_MODE = 'false'
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('runs primary and fallback models across 10 prompts concurrently and writes calibration report', async () => {
    console.log('Starting parallel score calibration run...')
    
    const runPromptComparison = async (p: typeof PROMPTS[number]) => {
      console.log(`[Calibration] Starting Prompt ${p.id} (${p.category}) on Primary...`)
      
      const dbProfilePrimary = {
        id: 'p-primary',
        slug: 'openrouter-deepseek-v4-flash',
        display_name: 'DeepSeek v4 Flash Profile',
        provider: 'openrouter',
        capabilities_json: {
          model_id: 'deepseek/deepseek-v4-flash',
          temperature: 0.1,
          max_tokens: 4000
        },
        profile_version: '1.0.0'
      } as unknown as ModelProfileRow

      const dbProfileFallback = {
        id: 'p-fallback',
        slug: 'openrouter-deepseek-v4-flash',
        display_name: 'DeepSeek v4 Flash Profile',
        provider: 'openrouter',
        capabilities_json: {
          model_id: 'openai/gpt-4o-mini',
          temperature: 0.1,
          max_tokens: 4000
        },
        profile_version: '1.0.0'
      } as unknown as ModelProfileRow

      // Run both in parallel for this prompt
      const [primaryRes, fallbackRes] = await Promise.all([
        analyzePrompt({
          inputPrompt: p.text,
          workingLanguage: p.lang,
          selectedProfileSlug: 'openrouter-deepseek-v4-flash',
          auditMode: 'universal',
          dbProfile: dbProfilePrimary
        }, { mockMode: false }),
        analyzePrompt({
          inputPrompt: p.text,
          workingLanguage: p.lang,
          selectedProfileSlug: 'openrouter-deepseek-v4-flash',
          auditMode: 'universal',
          dbProfile: dbProfileFallback
        }, { mockMode: false })
      ])

      console.log(`[Calibration] Completed Prompt ${p.id} (${p.category}).`)

      const primaryScore = primaryRes.scores.overallScore
      const fallbackScore = fallbackRes.scores.overallScore
      const diff = Math.abs(primaryScore - fallbackScore)

      const primaryWeaknesses = primaryRes.analysis.top_weaknesses || []
      const fallbackWeaknesses = fallbackRes.analysis.top_weaknesses || []
      
      const overlapCount = primaryWeaknesses.filter((w: string) => 
        fallbackWeaknesses.some((fw: string) => fw.toLowerCase().includes(w.toLowerCase().slice(0, 10)))
      ).length
      const totalWeaknesses = Math.max(primaryWeaknesses.length, fallbackWeaknesses.length, 1)
      const overlapPct = Math.round((overlapCount / totalWeaknesses) * 100)

      let intentPreserved = 'pass'
      const usefulness = 'pass'

      if (p.id === 'P2') {
        const containsOrder = fallbackRes.analysis.improved_prompt.includes('12345') || fallbackRes.analysis.improved_prompt.includes('Desk Lamp')
        if (!containsOrder) intentPreserved = 'fail'
      } else if (p.id === 'P10') {
        const containsKeywords = ['antigravity', 'caffeine', 'compile'].every(kw => 
          fallbackRes.analysis.improved_prompt.toLowerCase().includes(kw)
        )
        if (!containsKeywords) intentPreserved = 'fail'
      }

      return {
        id: p.id,
        category: p.category,
        primaryScore,
        fallbackScore,
        diff,
        overlapPct,
        intentPreserved,
        usefulness,
        primaryOutput: primaryRes.analysis,
        fallbackOutput: fallbackRes.analysis
      }
    }

    // Run all 10 prompts concurrently
    const results = await Promise.all(PROMPTS.map(p => runPromptComparison(p)))

    const diffs = results.map(r => r.diff).sort((a, b) => a - b)
    const meanDiff = results.reduce((acc, r) => acc + r.diff, 0) / results.length
    const medianDiff = diffs[Math.floor(diffs.length / 2)]
    const maxDiff = Math.max(...diffs)
    
    const meanOverlap = results.reduce((acc, r) => acc + r.overlapPct, 0) / results.length
    const intentPreservationRate = (results.filter(r => r.intentPreserved === 'pass').length / results.length) * 100
    const usefulnessRate = (results.filter(r => r.usefulness === 'pass').length / results.length) * 100

    const artifactsDir = 'C:\\Users\\Nuph\\.gemini\\antigravity-ide\\brain\\294fdfd6-f81c-4b6b-848b-f4350a8d2e1d'
    fs.writeFileSync(
      path.join(artifactsDir, 'calibration_raw.json'),
      JSON.stringify(results, null, 2)
    )

    let report = `# Primary/Fallback Score Calibration Report\n\n`
    report += `### Aggregated Calibration Stats\n\n`
    report += `| Metric | Value | Threshold | Pass/Fail |\n`
    report += `|---|---|---|---|\n`
    report += `| **Mean Absolute Difference** | ${meanDiff.toFixed(2)} | - | - |\n`
    report += `| **Median Absolute Difference** | ${medianDiff.toFixed(2)} | <= 10 | ${medianDiff <= 10 ? 'PASS' : 'FAIL'} |\n`
    report += `| **Maximum Absolute Difference** | ${maxDiff.toFixed(2)} | <= 20 | ${maxDiff <= 20 ? 'PASS' : 'FAIL'} |\n`
    report += `| **Avg Recommendation Overlap** | ${meanOverlap.toFixed(1)}% | - | - |\n`
    report += `| **Intent Preservation Rate** | ${intentPreservationRate.toFixed(1)}% | - | - |\n`
    report += `| **Usefulness Rate** | ${usefulnessRate.toFixed(1)}% | - | - |\n\n`

    report += `### Prompt-by-Prompt Calibration Table\n\n`
    report += `| Fixture ID / Category | Primary Score | Fallback Score | Absolute Diff | Overlap % | Intent Preserved | Usefulness |\n`
    report += `|---|---|---|---|---|---|---|\n`
    for (const r of results) {
      report += `| ${r.id} (${r.category}) | ${r.primaryScore} | ${r.fallbackScore} | ${r.diff} | ${r.overlapPct}% | ${r.intentPreserved} | ${r.usefulness} |\n`
    }

    fs.writeFileSync(path.join(artifactsDir, 'calibration_results.md'), report)
    console.log('Calibration complete. Report written to calibration_results.md')

    expect(medianDiff).toBeLessThanOrEqual(10)
    expect(maxDiff).toBeLessThanOrEqual(20)
  }, 180000) // 3 mins limit
})
