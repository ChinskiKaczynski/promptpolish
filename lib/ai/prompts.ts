import { type ModelProfile } from './model-profiles'

export const analysisSystemInstruction = `
You are a PromptPolish engine, an advanced prompt analysis and polishing assistant.

Core Operation Rules:
1. Return output strictly according to the provided JSON schema.
2. Carefully preserve the user's core intent. Never change the semantic meaning, objective, or key details of the prompt.
3. Improve clarity, context, structure, constraints, and output format.
4. Do not make the improved prompt unnecessarily long. Keep it concise, functional, and efficient.
5. Use ONLY the model profile details provided in the prompt to evaluate model compatibility.
6. Absolutely DO NOT invent or assume any unverified model capabilities, pricing structures, context windows, token limits, benchmark scores, or provider recommendations.
7. If model profile data is missing or marked unverified/stale, treat it as unknown/unverified. Do not suggest or assert specifications.
8. Under no circumstances should you repeat full secret values (such as passwords, API keys, tokens, or private database keys) if the input contains sensitive data. Redact them or speak about them generally without copying the sensitive value itself.
9. To combat hallucination, always include anti-hallucination guardrails and instructions in the generated improved prompt, instructing the model to reject ungrounded assumptions or state when information is unavailable.
`

export interface ConstructPromptParams {
  inputPrompt: string
  workingLanguage: 'pl' | 'en'
  modelProfile: ModelProfile
  auditMode?: string | null
  taskGoal?: string | null
  taskType?: string | null
  expectedOutputFormat?: string | null
  constraints?: string | null
}

/**
 * Constructs the rich, context-aware prompt instructions for the OpenRouter API call.
 * Integrates optional user constraints, goals, audit mode, and the exact model profile.
 */
export function constructUserAnalysisPrompt(params: ConstructPromptParams): string {
  const {
    inputPrompt,
    workingLanguage,
    modelProfile,
    auditMode,
    taskGoal,
    taskType,
    expectedOutputFormat,
    constraints
  } = params

  const langContext = workingLanguage === 'pl'
    ? 'Ensure that all generated critiques, rationales, suggestions, plans, and improved prompts are written in Polish.'
    : 'Ensure that all generated critiques, rationales, suggestions, plans, and improved prompts are written in English.'

  const profileSection = `
[MODEL PROFILE DATA]
- Display Name: ${modelProfile.displayName}
- Provider: ${modelProfile.provider}
- Verification Status: ${modelProfile.verificationStatus}
- Confidence Level: ${modelProfile.confidenceLevel}
- Profile Version: ${modelProfile.profileVersion}
`

  let contextSection = ''
  if (auditMode) contextSection += `- Audit Mode / Task Context: ${auditMode}\n`
  if (taskGoal) contextSection += `- User Specified Task Goal: ${taskGoal}\n`
  if (taskType) contextSection += `- User Specified Task Type: ${taskType}\n`
  if (expectedOutputFormat) contextSection += `- User Specified Expected Output Format: ${expectedOutputFormat}\n`
  if (constraints) contextSection += `- User Specified Constraints: ${constraints}\n`

  return `
Analyze and improve the following prompt:

[INPUT PROMPT TO POLISH]
${inputPrompt}

[METADATA AND ATTRIBUTES]
- Target Working Language: ${workingLanguage === 'pl' ? 'Polish (PL)' : 'English (EN)'}
${langContext}

${profileSection}

[CONTEXTUAL ATTRIBUTES]
${contextSection || '(None specified)'}

Instructions for evaluation:
- Complete coverage of all 10 required scoring criteria in the JSON schema.
- For "model_profile_fit", evaluate compatibility strictly against the [MODEL PROFILE DATA] provided above. Do not reference external benchmarks or claim knowledge of pricing or context windows not listed in the profile.
- Redact/Avoid echoing any sensitive credentials or secrets found in the input prompt.
- Retain the original intent and core objectives of the input prompt.
- Make the improved prompt highly professional, beautifully structured (using markdown headers, checklists, and instruction blocks), and optimized for the target model profile without being overly verbose.
`
}
