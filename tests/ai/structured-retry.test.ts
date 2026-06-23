import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

const mockExecuteAnalysis = vi.fn()

vi.mock('@/lib/ai/openrouter-client', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/ai/openrouter-client')>()
  return {
    ...original,
    executeOpenRouterAnalysis: (sys: string, prompt: string, options: unknown) => mockExecuteAnalysis(sys, prompt, options)
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
          slug: 'openrouter-deepseek-v4-flash',
          displayName: 'DeepSeek v4 Flash Profile',
          provider: 'openrouter',
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
          slug: 'openrouter-deepseek-v4-flash',
          displayName: 'DeepSeek v4 Flash Profile',
          provider: 'openrouter',
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
          slug: 'openrouter-deepseek-v4-flash',
          displayName: 'DeepSeek v4 Flash Profile',
          provider: 'openrouter',
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
      selectedProfileSlug: 'openrouter-deepseek-v4-flash' as const
    }

    it('retries exactly once when executeOpenRouterAnalysis throws malformed_provider_output, and returns result if retry succeeds', async () => {
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
          selectedModel: 'deepseek/deepseek-v4-flash',
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
          selectedModel: 'deepseek/deepseek-v4-flash',
          attempt: 1,
          durationMs: 200
        })
        .mockResolvedValueOnce({
          output: mockAnalysisResult,
          usage: { promptTokens: 50, completionTokens: 50, totalTokens: 100 },
          selectedModel: 'deepseek/deepseek-v4-flash',
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

    it('does not trigger fallback to other models during retry (stays on deepseek/deepseek-v4-flash)', async () => {
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
          selectedModel: 'deepseek/deepseek-v4-flash',
          attempt: 1,
          durationMs: 200
        })

      const res = await analyzePrompt(validParams)
      expect(mockExecuteAnalysis).toHaveBeenCalledTimes(2)
      expect(res.selectedModel).toBe('deepseek/deepseek-v4-flash')
    })
  })

  describe('3. Retry Exclusions', () => {
    const validParams = {
      inputPrompt: 'Ta walidacja potrzebuje przynajmniej dwudziestu znaków w swoim body.',
      workingLanguage: 'pl' as const,
      selectedProfileSlug: 'openrouter-deepseek-v4-flash' as const
    }

    it('does not retry when executeOpenRouterAnalysis throws a timeout error', async () => {
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

    it('does not retry when executeOpenRouterAnalysis throws a rate limit error', async () => {
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

    it('does not retry when executeOpenRouterAnalysis throws an authentication/authorization error', async () => {
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
})
