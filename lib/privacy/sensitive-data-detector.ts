import { riskRank, sensitiveDataRules, type SensitiveRiskLevel } from './sensitive-data-rules'

export type SensitiveDataFinding = {
  type: string
  riskLevel: Exclude<SensitiveRiskLevel, 'none'>
  message: string
  redactedValue: string
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
    // Extract everything after the :// and before the @ (the password)
    const matches = match.match(/:\/\/([^:]+):([^@]+)@/)
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
    return value.replace(/(:\/\/[^:]+:)[^@]+(@)/, '$1[redacted]$2')
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

export function detectSensitiveData(
  input: string,
  config?: DetectionConfig
): SensitiveDataDetectionResult {
  const findings: SensitiveDataFinding[] = []
  let riskLevel: SensitiveRiskLevel = 'none'

  // Apply configuration overrides: filter rules by enabledRuleIds
  const rulesToApply = config?.enabledRuleIds
    ? sensitiveDataRules.filter((r) => config.enabledRuleIds!.includes(r.id))
    : sensitiveDataRules

  for (const rule of rulesToApply) {
    // If high risk rules are config-blocked, skip executing them entirely
    if (rule.riskLevel === 'high' && config?.blockHighRisk === false) {
      continue
    }

    const matches =
      input.match(
        new RegExp(
          rule.pattern.source,
          rule.pattern.flags.includes('g') ? rule.pattern.flags : `${rule.pattern.flags}g`
        )
      ) ?? []

    for (const match of matches) {
      const secretVal = extractSecretValue(match, rule.id)

      // Skip obvious test examples / placeholder values
      if (isPlaceholderValue(secretVal)) {
        continue
      }

      findings.push({
        type: rule.type,
        riskLevel: rule.riskLevel,
        message: rule.message,
        redactedValue: redactSecret(match, rule.id)
      })

      if (riskRank[rule.riskLevel] > riskRank[riskLevel]) {
        riskLevel = rule.riskLevel
      }
    }
  }

  return { riskLevel, findings: dedupeFindings(findings) }
}

function dedupeFindings(findings: SensitiveDataFinding[]): SensitiveDataFinding[] {
  const seen = new Set<string>()
  return findings.filter((finding) => {
    const key = `${finding.type}:${finding.redactedValue}`
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
