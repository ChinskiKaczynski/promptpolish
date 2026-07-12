import { riskRank, sensitiveDataRules, type SensitiveRiskLevel } from './sensitive-data-rules'

export type SensitiveDataFinding = {
  type: string
  riskLevel: Exclude<SensitiveRiskLevel, 'none'>
  message: string
}

export type SensitiveDataDetectionResult = {
  riskLevel: SensitiveRiskLevel
  findings: SensitiveDataFinding[]
}

export type DetectionConfig = {
  blockHighRisk?: boolean
  enabledRuleIds?: string[]
}

// Check for common test placeholder text to avoid obvious false positives
function isPlaceholderValue(val: string): boolean {
  const normalized = val.toLowerCase().trim()
  
  // Exact matches that represent typical placeholders
  const exactPlaceholders = [
    'placeholder', 'your_key', 'key_here', 'secret_value', 'my_password',
    'somepassword', 'insert_here', 'example', 'todo', 'null', 'undefined',
    'your-key', 'yourkey', 'mysecret', 'your_secret', 'secret-key', 'key-here',
    'token-here', 'token_here', 'secret', 'password-here', 'password_here',
    'your_key_here', 'my_password_here'
  ]
  if (exactPlaceholders.includes(normalized)) return true

  // Common descriptive keyword combinations
  const containsKeywords = [
    'your_key_here', 'insert_here', 'token-here', 'placeholder', 'your-key'
  ]
  if (containsKeywords.some((kw) => normalized.includes(kw))) return true

  return false
}

// Extract secret portion from matching context assignments
function extractSecretValue(match: string, ruleId: string): string {
  if (ruleId === 'env-secret-key') {
    const parts = match.split('=')
    return (parts[1] ?? '').replace(/['"]/g, '').trim()
  }
  if (ruleId === 'password-assignment') {
    const parts = match.split(/[:=]/)
    return (parts[1] ?? '').replace(/['"]/g, '').trim()
  }
  if (ruleId === 'bearer-token') {
    return match.replace(/^Bearer\s+/i, '').trim()
  }
  if (ruleId === 'database-url') {
    // Match up to the LAST @ (which separates credentials from host).
    // Using .+ (greedy) for password ensures P@ssw0rd!-style passwords are captured fully.
    const matches = match.match(/:\/\/([^:]+):(.+)@[A-Za-z0-9_.-]+/)
    if (matches && matches[2]) {
      return matches[2].trim()
    }
    return match.trim()
  }
  return match.trim()
}

// Redact secret completely while preserving non-sensitive identifiers and structure
export function redactSecret(value: string, ruleId?: string): string {
  if (!ruleId) {
    const compact = value.replace(/\s+/g, ' ').trim()
    if (compact.length <= 8) return '[redacted]'
    return `${compact.slice(0, 4)}…${compact.slice(-4)}`
  }

  if (ruleId === 'private-key-block') {
    return '-----BEGIN PRIVATE KEY----- … -----END PRIVATE KEY-----'
  }

  if (ruleId === 'database-url') {
    // Replace everything between the last colon (before password) and last @ with [redacted]
    // Using a greedy match ensures passwords containing @ are fully redacted
    return value.replace(/(:\/\/[^:]+:).+(@[A-Za-z0-9_.-]+)/, '$1[redacted]$2')
  }

  const secretValue = extractSecretValue(value, ruleId)
  let prefix = ''

  if (ruleId === 'env-secret-key') {
    const keyName = value.split('=')[0]?.trim()
    prefix = `${keyName}=`
  } else if (ruleId === 'password-assignment') {
    const separator = value.includes(':') ? ':' : '='
    const keyName = value.split(/[:=]/)[0]?.trim()
    prefix = `${keyName}${separator}`
  } else if (ruleId === 'bearer-token') {
    prefix = 'Bearer '
  }

  const compact = secretValue.replace(/\s+/g, ' ').trim()
  let redacted = ''
  if (compact.length <= 8) {
    redacted = '[redacted]'
  } else {
    redacted = `${compact.slice(0, 4)}…${compact.slice(-4)}`
  }

  return `${prefix}${redacted}`
}

/**
 * Scans an input string for credentials and high-risk sensitive patterns.
 */
export function detectSensitiveData(
  input: string,
  config?: DetectionConfig
): SensitiveDataDetectionResult {
  const findings: SensitiveDataFinding[] = []
  let riskLevel: SensitiveRiskLevel = 'none'

  const rulesToApply = config?.enabledRuleIds
    ? sensitiveDataRules.filter((r) => config.enabledRuleIds!.includes(r.id))
    : sensitiveDataRules

  let workingInput = input

  for (const rule of rulesToApply) {
    // If high risk rules are config-blocked, skip executing them entirely
    if (rule.riskLevel === 'high' && config?.blockHighRisk === false) {
      continue
    }

    const regex = new RegExp(
      rule.pattern.source,
      rule.pattern.flags.includes('g') ? rule.pattern.flags : `${rule.pattern.flags}g`
    )

    let match: RegExpExecArray | null
    regex.lastIndex = 0

    while ((match = regex.exec(workingInput)) !== null) {
      const matchStr = match[0]
      const secretVal = extractSecretValue(matchStr, rule.id)

      // Skip obvious test examples / placeholder values
      if (isPlaceholderValue(secretVal)) {
        if (regex.lastIndex === match.index) {
          regex.lastIndex++
        }
        continue
      }

      findings.push({
        type: rule.type,
        riskLevel: rule.riskLevel,
        message: rule.message
      })

      if (riskRank[rule.riskLevel] > riskRank[riskLevel]) {
        riskLevel = rule.riskLevel
      }

      // Mask out the matched portion with spaces of equal length in workingInput
      const startIndex = match.index
      const len = matchStr.length
      workingInput =
        workingInput.substring(0, startIndex) +
        ' '.repeat(len) +
        workingInput.substring(startIndex + len)

      // Reposition lastIndex to the end of the masked segment
      regex.lastIndex = startIndex + len
    }
  }

  return { riskLevel, findings: dedupeFindings(findings) }
}

function dedupeFindings(findings: SensitiveDataFinding[]): SensitiveDataFinding[] {
  const seen = new Set<string>()
  return findings.filter((finding) => {
    const key = finding.type
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export type ScanFieldsResult = {
  riskLevel: SensitiveRiskLevel
  findings: (SensitiveDataFinding & { field: string })[]
  redactedValues: Record<string, string>
}

/**
 * Scans every user-controlled string field on the server before AI provider or DB write.
 */
export function scanRequestFields(
  fields: Record<string, string | null | undefined>,
  config?: DetectionConfig
): ScanFieldsResult {
  let overallRisk: SensitiveRiskLevel = 'none'
  const allFindings: (SensitiveDataFinding & { field: string })[] = []
  const redactedValues: Record<string, string> = {}

  for (const [fieldName, value] of Object.entries(fields)) {
    if (!value || typeof value !== 'string') {
      redactedValues[fieldName] = value || ''
      continue
    }

    const detection = detectSensitiveData(value, config)
    
    const findingsWithField = detection.findings.map(finding => ({
      ...finding,
      field: fieldName
    }))
    
    allFindings.push(...findingsWithField)

    if (riskRank[detection.riskLevel] > riskRank[overallRisk]) {
      overallRisk = detection.riskLevel
    }

    // Redact high-risk matches in the field value for telemetry/previews
    let redactedVal = value
    for (const finding of detection.findings) {
      if (finding.riskLevel === 'high') {
        // Redact the whole matched pattern in the preview
        redactedVal = '[redacted due to high risk sensitive data]'
        break
      }
    }
    redactedValues[fieldName] = redactedVal
  }

  return {
    riskLevel: overallRisk,
    findings: allFindings,
    redactedValues
  }
}
