import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

const mockExecuteAnalysis = vi.fn()

vi.mock('@/lib/ai/gemini-client', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/ai/gemini-client')>()
  return {
    ...original,
    executeGeminiAnalysis: (sys: string, prompt: string, options: unknown) => mockExecuteAnalysis(sys, prompt, options)
  }
})

import { analyzePrompt } from '@/lib/ai/analyze-prompt'
import { constructUserAnalysisPrompt } from '@/lib/ai/prompts'
import { ProviderError } from '@/lib/ai/provider-errors'
import { mockAnalysisResult } from '@/lib/ai/mock-analysis'

describe('Structured Output Retry and Size Control Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('1. Long Prompt Size Control Instructions', () => {
    it('appends compact output instructions for inputs >4000 characters in Polish', () => {
      const longInput = 'a'.repeat(4001)
      const prompt = constructUserAnalysisPrompt({
        inputPrompt: longInput,
        workingLanguage: 'pl',
        modelProfile: {
          slug: 'general-llm',
          displayName: 'General LLM',
          provider: 'google',
          verificationStatus: 'unverified',
          confidenceLevel: 'low',
          profileVersion: '1.0.0'
        }
      })
      expect(prompt).toContain('[BARDZO DŁUGI PROMPT WEJŚCIOWY (>4000 znaków)]')
    })

    it('appends compact output instructions for inputs >4000 characters in English', () => {
      const longInput = 'a'.repeat(4001)
      const prompt = constructUserAnalysisPrompt({
        inputPrompt: longInput,
        workingLanguage: 'en',
        modelProfile: {
          slug: 'general-llm',
          displayName: 'General LLM',
          provider: 'google',
          verificationStatus: 'unverified',
          confidenceLevel: 'low',
          profileVersion: '1.0.0'
        }
      })
      expect(prompt).toContain('[VERY LONG INPUT PROMPT (>4000 characters)]')
    })

    it('does not append compact output instructions for inputs <=4000 characters', () => {
      const shortInput = 'a'.repeat(4000)
      const prompt = constructUserAnalysisPrompt({
        inputPrompt: shortInput,
        workingLanguage: 'en',
        modelProfile: {
          slug: 'general-llm',
          displayName: 'General LLM',
          provider: 'google',
          verificationStatus: 'unverified',
          confidenceLevel: 'low',
          profileVersion: '1.0.0'
        }
      })
      expect(prompt).not.toContain('[VERY LONG INPUT PROMPT')
    })
  })

  describe('2. Structured Output Retry Logic', () => {
    const validParams = {
      inputPrompt: 'Ta walidacja potrzebuje przynajmniej dwudziestu znaków w swoim body.',
      workingLanguage: 'pl' as const,
      selectedProfileSlug: 'general-llm' as const
    }

    it('retries exactly once when executeGeminiAnalysis throws malformed_provider_output, and returns result if retry succeeds', async () => {
      mockExecuteAnalysis
        .mockRejectedValueOnce(
          new ProviderError(
            'No output generated',
            'Encountered an error',
            null,
            undefined,
            'malformed_provider_output'
          )
        )
        .mockResolvedValueOnce({
          output: mockAnalysisResult,
          usage: { promptTokens: 50, completionTokens: 50, totalTokens: 100 },
          selectedModel: 'gemini-2.5-flash',
          attempt: 1,
          durationMs: 200
        })

      const res = await analyzePrompt(validParams)
      expect(mockExecuteAnalysis).toHaveBeenCalledTimes(2)
      
      const expectedSchemaFields = { ...mockAnalysisResult } as Record<string, unknown>
      delete expectedSchemaFields.id
      delete expectedSchemaFields.overallScore
      delete expectedSchemaFields.scoreLevel
      expect(res.analysis).toEqual(expectedSchemaFields)
      expect(res.attempt).toBe(1)
    })

    it('retries exactly once when Zod validation fails (schema parse failure), and returns result if retry succeeds', async () => {
      // Missing required fields (Zod fails)
      const invalidJson = {
        analysis_schema_version: '1.0.0'
        // missing all other fields
      }

      mockExecuteAnalysis
        .mockResolvedValueOnce({
          output: invalidJson,
          usage: { promptTokens: 50, completionTokens: 50, totalTokens: 100 },
          selectedModel: 'gemini-2.5-flash',
          attempt: 1,
          durationMs: 200
        })
        .mockResolvedValueOnce({
          output: mockAnalysisResult,
          usage: { promptTokens: 50, completionTokens: 50, totalTokens: 100 },
          selectedModel: 'gemini-2.5-flash',
          attempt: 1,
          durationMs: 200
        })

      const res = await analyzePrompt(validParams)
      expect(mockExecuteAnalysis).toHaveBeenCalledTimes(2)
      
      const expectedSchemaFields = { ...mockAnalysisResult } as Record<string, unknown>
      delete expectedSchemaFields.id
      delete expectedSchemaFields.overallScore
      delete expectedSchemaFields.scoreLevel
      expect(res.analysis).toEqual(expectedSchemaFields)
    })

    it('propagates the validation error if retry fails with malformed output', async () => {
      mockExecuteAnalysis
        .mockRejectedValueOnce(
          new ProviderError(
            'No output generated',
            'Encountered an error',
            null,
            undefined,
            'malformed_provider_output'
          )
        )
        .mockRejectedValueOnce(
          new ProviderError(
            'No output generated retry',
            'Encountered an error retry',
            null,
            undefined,
            'malformed_provider_output'
          )
        )

      await expect(analyzePrompt(validParams)).rejects.toThrow('No output generated retry')
      expect(mockExecuteAnalysis).toHaveBeenCalledTimes(2)
    })

    it('does not trigger fallback to other models during retry (stays on gemini-2.5-flash)', async () => {
      mockExecuteAnalysis
        .mockRejectedValueOnce(
          new ProviderError(
            'No output generated',
            'Encountered an error',
            null,
            undefined,
            'malformed_provider_output'
          )
        )
        .mockResolvedValueOnce({
          output: mockAnalysisResult,
          usage: { promptTokens: 50, completionTokens: 50, totalTokens: 100 },
          selectedModel: 'gemini-2.5-flash',
          attempt: 1,
          durationMs: 200
        })

      const res = await analyzePrompt(validParams)
      expect(mockExecuteAnalysis).toHaveBeenCalledTimes(2)
      expect(res.selectedModel).toBe('gemini-2.5-flash')
    })
  })

  describe('3. Retry Exclusions', () => {
    const validParams = {
      inputPrompt: 'Ta walidacja potrzebuje przynajmniej dwudziestu znaków w swoim body.',
      workingLanguage: 'pl' as const,
      selectedProfileSlug: 'general-llm' as const
    }

    it('does not retry when executeGeminiAnalysis throws a timeout error', async () => {
      mockExecuteAnalysis.mockRejectedValueOnce(
        new ProviderError(
          'Timeout occurred',
          'Timed out',
          null,
          504,
          'provider_timeout'
        )
      )

      await expect(analyzePrompt(validParams)).rejects.toThrow('Timeout occurred')
      expect(mockExecuteAnalysis).toHaveBeenCalledTimes(1)
    })

    it('does not retry when executeGeminiAnalysis throws a rate limit error', async () => {
      mockExecuteAnalysis.mockRejectedValueOnce(
        new ProviderError(
          'Quota exceeded',
          'Rate limit hit',
          null,
          429,
          'provider_rate_limit'
        )
      )

      await expect(analyzePrompt(validParams)).rejects.toThrow('Quota exceeded')
      expect(mockExecuteAnalysis).toHaveBeenCalledTimes(1)
    })

    it('does not retry when executeGeminiAnalysis throws an authentication/authorization error', async () => {
      mockExecuteAnalysis.mockRejectedValueOnce(
        new ProviderError(
          'Invalid credentials',
          'Authentication failed',
          null,
          401,
          'provider_authentication_error'
        )
      )

      await expect(analyzePrompt(validParams)).rejects.toThrow('Invalid credentials')
      expect(mockExecuteAnalysis).toHaveBeenCalledTimes(1)
    })
  })

  describe('4. Local JSON Repair Verification', () => {
    const validParams = {
      inputPrompt: 'Ta walidacja potrzebuje przynajmniej dwudziestu znaków w swoim body.',
      workingLanguage: 'pl' as const,
      selectedProfileSlug: 'general-llm' as const
    }

    it('successfully repairs valid JSON wrapped in markdown code fences and returns it directly without retry', async () => {
      const outputText = '```json\n' + JSON.stringify(mockAnalysisResult) + '\n```'
      mockExecuteAnalysis.mockResolvedValueOnce({
        output: outputText,
        usage: { promptTokens: 50, completionTokens: 50, totalTokens: 100 },
        selectedModel: 'gemini-2.5-flash',
        attempt: 1,
        durationMs: 200
      })

      const res = await analyzePrompt(validParams)
      expect(mockExecuteAnalysis).toHaveBeenCalledTimes(1)
      expect(res.attempt).toBe(1)
      expect(res.analysis.overall_summary).toBe(mockAnalysisResult.overall_summary)
    })

    it('safely coerces numeric strings in criteria_scores raw_score_0_10 if allowed', async () => {
      const resultWithNumericStrings = JSON.parse(JSON.stringify(mockAnalysisResult))
      resultWithNumericStrings.criteria_scores = resultWithNumericStrings.criteria_scores.map((score: Record<string, unknown>) => ({
        ...score,
        raw_score_0_10: '7'
      }))

      mockExecuteAnalysis.mockResolvedValueOnce({
        output: JSON.stringify(resultWithNumericStrings),
        usage: { promptTokens: 50, completionTokens: 50, totalTokens: 100 },
        selectedModel: 'gemini-2.5-flash',
        attempt: 1,
        durationMs: 200
      })

      const res = await analyzePrompt(validParams)
      expect(mockExecuteAnalysis).toHaveBeenCalledTimes(1)
      expect(res.analysis.criteria_scores[0].raw_score_0_10).toBe(7)
    })

    it('does NOT silently fill missing required analytical fields and triggers retry', async () => {
      const invalidJson = {
        analysis_schema_version: '1.0.0',
        detected_task_type: 'classification'
        // missing overall_summary, improved_prompt, top_weaknesses, etc.
      }

      mockExecuteAnalysis
        .mockResolvedValueOnce({
          output: JSON.stringify(invalidJson),
          usage: { promptTokens: 50, completionTokens: 50, totalTokens: 100 },
          selectedModel: 'gemini-2.5-flash',
          attempt: 1,
          durationMs: 200
        })
        .mockResolvedValueOnce({
          output: mockAnalysisResult,
          usage: { promptTokens: 50, completionTokens: 50, totalTokens: 100 },
          selectedModel: 'gemini-2.5-flash',
          attempt: 1,
          durationMs: 200
        })

      const res = await analyzePrompt(validParams)
      // Because fields are missing and cannot be repaired, it must trigger exactly one retry
      expect(mockExecuteAnalysis).toHaveBeenCalledTimes(2)
      expect(res.analysis.overall_summary).toBe(mockAnalysisResult.overall_summary)
    })
  })
})
