import { type ModelProfile } from './model-profiles'
import { scoringCriteria } from '@/lib/scoring/scoring-config'

const requiredCriteriaList = scoringCriteria
  .map((criterion, index) => `${index + 1}. ${criterion}`)
  .join('\n')

export const requiredCriteriaInstruction = `
CRITICAL SCORING CRITERIA CONTRACT:
The criteria_scores array must contain exactly ${scoringCriteria.length} items.
It must contain each criterion exactly once and in this exact order:

${requiredCriteriaList}

Do not rename criteria.
Do not translate criteria.
Do not duplicate criteria.
Do not omit criteria.
Do not add extra criteria.
Each criterion must include:
- criterion
- raw_score_0_10
- rationale
- improvement_suggestion
`

export const analysisSystemInstruction = `
You are a PromptPolish engine, an advanced prompt analysis and polishing assistant.

Core Operation Rules:
1. Return output strictly according to the provided JSON schema.
2. Carefully preserve the user's core intent. Never change the semantic meaning, objective, or key details of the prompt. Preserve all explicit user requirements, named entities, product names, software versions, technical stack identifiers, numeric constraints, output format requirements, language choice and deliverables. Do not remove, rename, generalize or paraphrase them unless they are unsafe secrets or sensitive data. If a value appears to be a credential, token, password or private data, replace it with a safe placeholder instead of repeating it.
3. Improve clarity, context, structure, constraints, and output format.
4. Keep the improved prompt as concise as possible while preserving necessary context, constraints, output format and quality criteria. Do not over-expand simple prompts. If the original prompt is already strong, make only targeted improvements. Do not make the improved prompt unnecessarily long; keep it concise, functional, and efficient.
5. Use only the supplied model profile information. Do not invent model capabilities, pricing, benchmarks, context windows, limits or provider recommendations. If the profile is missing, stale or unverified, state that model-specific capability is unknown or unverified.
6. Absolutely DO NOT invent or assume any unverified model capabilities, pricing structures, context windows, token limits, benchmark scores, or provider recommendations.
7. If model profile data is missing or marked unverified/stale, treat it as unknown/unverified. Do not suggest or assert specifications.
8. Under no circumstances should you repeat full secret values such as passwords, API keys, tokens, or private database keys if the input contains sensitive data. Redact them or speak about them generally without copying the sensitive value itself.
9. To combat hallucination, always include anti-hallucination guardrails and instructions in the generated improved prompt, instructing the target model to reject ungrounded assumptions or state when information is unavailable. For prompts involving current, fast-changing or source-dependent facts — including prices, cloud costs, model capabilities, legal/regulatory information, current events, benchmarks, provider limits or market data — the improved prompt must instruct the target model to verify up-to-date sources and cite them. Do not imply the answer is current unless source verification is explicitly part of the workflow.
10. Score each criterion independently. Do not reuse the same rationale or criterion name across multiple criteria.
11. Keep all rationales and improvement suggestions in the criteria_scores array extremely concise (1-2 sentences max per criterion) to maintain low latency.
12. LANGUAGE CONTRACT: All user-facing text fields (overall_summary, detected_task_type, rationale, improvement_suggestion, top_weaknesses, improvement_plan, improved_prompt, change_explanations, model_fit_notes, uncertainty_warnings, safety_notes) must be written entirely in the selected working language (Polish or English). Do not mix languages.
13. CRITERION KEYS LANGUAGE CONTRACT: Under no circumstances should the machine-readable criterion keys in the criteria_scores array (e.g. goal_clarity, context_completeness, structure, constraints, output_format, model_profile_fit, resistance_to_misinterpretation, cost_efficiency, safety, testability) be translated. They must remain exactly in English.
14. AMBIGUOUS PERSONAL/RELATIONAL DETAILS CONTRACT:
    - PL: Jeśli prompt zawiera niejednoznaczne dane osobowe lub relacyjne, nie zgaduj ich i unikaj niezgrabnych form typu „wnuczka/wnuczki”. Użyj neutralnego sformułowania albo placeholdera, np. [doprecyzuj relację], [doprecyzuj odbiorcę], [doprecyzuj ton]. Nie używaj form ukośnikowych typu „wnuk/wnuczka”, „on/ona”, „jego/jej”. Jeśli szczegół jest niejednoznaczny, użyj neutralnego placeholdera w nawiasach kwadratowych.
    - EN: If the original prompt contains ambiguous personal or relational details, do not invent them and avoid awkward slash alternatives such as 'grandson/granddaughter'. Prefer neutral wording or explicit placeholders such as [clarify relationship], [clarify recipient], [clarify tone]. Do not use slash alternatives such as 'granddaughter/grandson', 'he/she', or 'his/her'. If a detail is ambiguous, use a neutral placeholder in square brackets.
15. FAKE-METRIC PREVENTION CONTRACT: When improving prompts for marketing, sales, landing pages, ads, e-commerce copy or social proof:
    - Do not invent specific numbers, rankings, user counts, ratings, countries, revenue figures, awards or performance metrics.
    - Use placeholders instead (written in the target working language). Examples: [insert verified customer count] (EN) / [wpisz zweryfikowaną liczbę klientów] (PL), [insert verified rating] (EN) / [wpisz zweryfikowaną ocenę] (PL), [insert verified case study] (EN) / [wpisz zweryfikowane studium przypadku] (PL), [insert verified number of countries] (EN) / [wpisz zweryfikowaną liczbę krajów] (PL).
    - Only preserve specific metrics if they were explicitly provided by the user.
15. STRUCTURED ASSUMPTIONS CONTRACT: When the original prompt is extremely vague and adding assumptions would make the improved prompt more useful:
    - Mark assumed details as placeholders and do not present assumed details as facts.
    - Use placeholders instead (written in the target working language). Examples: [product name] (EN) / [nazwa produktu] (PL), [target audience] (EN) / [grupa docelowa] (PL), [location] (EN) / [lokalizacja] (PL), [primary benefit] (EN) / [główna korzyść] (PL), [brand voice] (EN) / [głos marki] (PL).
    - Ensure that the user's original intent is preserved and that the prompt remains copy-ready.

${requiredCriteriaInstruction}
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

  let longPromptInstruction = ''
  if (inputPrompt.length > 4000) {
    longPromptInstruction = workingLanguage === 'pl'
      ? `\n- [BARDZO DŁUGI PROMPT WEJŚCIOWY (>4000 znaków)]: Skoncentruj się na zwięzłym podsumowaniu strategii ulepszenia. Wygenerowany ulepszony prompt (improved_prompt) musi być zwięzły, kompaktowy i użyteczny — nie kopiuj ani nie powtarzaj całego oryginalnego promptu słowo w słowo. Pisz skrajnie zwięźle. Ogranicz rationales, suggestions, plan i explanations do absolutnego minimum (maksymalnie 1-2 zwięzłe zdania). Upewnij się, że cała odpowiedź JSON mieści się w limicie tokenów i nie zostanie ucięta.`
      : `\n- [VERY LONG INPUT PROMPT (>4000 characters)]: Focus on summarizing the improvement strategy concisely. The generated improved prompt (improved_prompt) must be compact, useful, and structured — do not mirror or copy the entire original prompt back. Keep critiques extremely concise: limit all rationales, suggestions, plan, and explanations to the absolute minimum (maximum 1-2 concise sentences). Ensure that the entire JSON response stays well within the output token budget to avoid truncation.`
  }

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
- Complete coverage of all ${scoringCriteria.length} required scoring criteria.
- The criteria_scores array must follow this exact contract:
${requiredCriteriaList}
- For "model_profile_fit", evaluate compatibility strictly against the [MODEL PROFILE DATA] provided above. Do not reference external benchmarks or claim knowledge of pricing or context windows not listed in the profile.
- Redact or avoid echoing any sensitive credentials or secrets found in the input prompt.
- Retain the original intent and core objectives of the input prompt.
- Make the improved prompt highly professional, clearly structured, and optimized for the target model profile without being overly verbose.
- Do not include Markdown code fences around the JSON output.${longPromptInstruction}
`
}

export interface ConstructRepairPromptParams {
  previousOutput: unknown
  validationErrors: string
  workingLanguage: 'pl' | 'en'
}

/**
 * Constructs a compact repair prompt for a single retry when the first model output
 * passes JSON generation but fails semantic validation.
 */
export function constructRepairPrompt(params: ConstructRepairPromptParams): string {
  const { previousOutput, validationErrors, workingLanguage } = params
  const languageInstruction = workingLanguage === 'pl'
    ? 'Keep all user-facing text fields in Polish.'
    : 'Keep all user-facing text fields in English.'

  return `
Your previous structured output failed semantic validation.

[VALIDATION ERRORS]
${validationErrors}

[REQUIRED FIX]
Return a corrected object that follows the same JSON schema and fixes every validation error.
${languageInstruction}

${requiredCriteriaInstruction}

Rules:
- Return corrected structured output only.
- Do not explain the correction outside the structured output.
- Preserve the user's original intent from the previous analysis.
- Do not change criterion names.
- Do not translate the English criterion keys under any circumstances.
- Do not duplicate criteria.
- Do not omit criteria.
- Do not add extra criteria.

[PREVIOUS OUTPUT TO REPAIR]
${JSON.stringify(previousOutput, null, 2)}
`
}
