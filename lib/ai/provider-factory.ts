import 'server-only'

import { generateObject } from 'ai'
import { google } from '@ai-sdk/google'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { ProviderError } from './provider-errors'
import type { AIProvider } from './runtime-config'

type GenerateObjectProviderOptions =
  Parameters<typeof generateObject>[0]['providerOptions'] 

function requireEnvironmentValue(
  key: 'GOOGLE_GENERATIVE_AI_API_KEY' | 'OPENROUTER_API_KEY'
): string {
  const value = process.env[key]

  if (!value || value.trim() === '') {
    throw new ProviderError(
      `Missing required provider credential: ${key}`,
      'Wybrany dostawca AI nie został poprawnie skonfigurowany przez administratora.',
      new Error(`${key} is not defined in environment variables.`),
      500,
      'provider_configuration_error'
    )
  }

  return value.trim()
}

/**
 * Creates a Vercel AI SDK model using a server-controlled provider.
 */
export function createRuntimeLanguageModel(
  provider: AIProvider,
  modelId: string
) {
  if (provider === 'google') {
    requireEnvironmentValue(
      'GOOGLE_GENERATIVE_AI_API_KEY'
    )

    return google(modelId)
  }

  if (provider === 'openrouter') {
    const apiKey = requireEnvironmentValue(
      'OPENROUTER_API_KEY'
    )

    const openrouter = createOpenRouter({
      apiKey,
    })

    return openrouter(modelId)
  }

  const exhaustiveProvider: never = provider

  throw new ProviderError(
    `Unsupported AI provider: ${String(exhaustiveProvider)}`,
    'Wybrany dostawca AI nie jest obsługiwany.',
    new Error('Unsupported AI provider.'),
    500,
    'provider_configuration_error'
  )
}

/**
 * Returns provider-specific options for structured generation.
 */
export function getRuntimeProviderOptions(
  provider: AIProvider,
  thinkingBudget: number
): GenerateObjectProviderOptions {
  if (provider === 'google') {
    return {
      google: {
        thinkingConfig: {
          thinkingBudget,
          includeThoughts: false,
        },
      },
    }
  }

  return undefined
}