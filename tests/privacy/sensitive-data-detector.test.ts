import { describe, expect, it } from 'vitest'
import { detectSensitiveData, scanRequestFields } from '@/lib/privacy/sensitive-data-detector'

describe('detectSensitiveData - Security Preflights', () => {

  it('detects GOOGLE_GENERATIVE_AI_API_KEY without leaking full value', () => {
    const rawSecret = 'g15f_87a9b6c5d4e3f2g1h0j9k8l7m6n5o'
    const payload = `GOOGLE_GENERATIVE_AI_API_KEY=${rawSecret}`
    const result = detectSensitiveData(payload)
    
    expect(result.riskLevel).toBe('high')
    expect(result.findings.length).toBe(1)
    
    const finding = result.findings[0]!
    expect(finding.type).toBe('env_secret_key')
    expect(finding.riskLevel).toBe('high')
    expect(finding.message).toContain('zmiennej środowiskowej')
    
    // Redaction preview check
    expect(finding.redactedValue).toContain('GOOGLE_GENERATIVE_AI_API_KEY=')
    expect(finding.redactedValue).not.toContain(rawSecret)
    expect(finding.redactedValue).toContain('g15f…6n5o')
  })

  it('detects OPENROUTER_API_KEY without leaking full value', () => {
    const rawSecret = 'or-v1-87a9b6c5d4e3f2g1h0j9k8l7m6n5o'
    const payload = `OPENROUTER_API_KEY=${rawSecret}`
    const result = detectSensitiveData(payload)
    
    expect(result.riskLevel).toBe('high')
    expect(result.findings.length).toBe(1)
    
    const finding = result.findings[0]!
    expect(finding.type).toBe('env_secret_key')
    expect(finding.riskLevel).toBe('high')
    expect(finding.message).toContain('zmiennej środowiskowej')
    
    // Redaction preview check
    expect(finding.redactedValue).toContain('OPENROUTER_API_KEY=')
    expect(finding.redactedValue).not.toContain(rawSecret)
    expect(finding.redactedValue).toContain('or-v…6n5o')
  })

  it('detects AIzaSy... Google API key pattern (google-api-key rule)', () => {
    // Real-looking Google API key (33 chars after AIzaSy)
    const rawKey = 'AIzaSyABCDEFGHIJKLMNOPQRSTUVWXYZ1234567'
    const payload = `My Google key is ${rawKey} — do not share!`
    const result = detectSensitiveData(payload)

    expect(result.riskLevel).toBe('high')
    const finding = result.findings.find(f => f.type === 'provider_api_key')!
    expect(finding).toBeDefined()
    expect(finding.message).toContain('AIzaSy')
  })

  it('does NOT flag AIzaSy placeholder strings that are too short', () => {
    // AIzaSy prefix but only 5 chars after — below the 33-char minimum
    const payload = 'Set GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy12345'
    const result = detectSensitiveData(payload)
    // The env-var rule uses a whitelist-based placeholder check,
    // and the google-api-key pattern requires exactly 33 chars after AIzaSy
    const googleKeyFindings = result.findings.filter(f => f.type === 'provider_api_key' && f.message?.includes('AIzaSy'))
    expect(googleKeyFindings.length).toBe(0)
  })

  it('detects SUPABASE_SECRET_KEY', () => {
    const rawSecret = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.supersecretvaluehere.abcdefg'
    const payload = `SUPABASE_SECRET_KEY=${rawSecret}`
    const result = detectSensitiveData(payload)
    
    expect(result.riskLevel).toBe('high')
    expect(result.findings.some(f => f.type === 'env_secret_key')).toBe(true)
  })

  it('detects AWS_SECRET_ACCESS_KEY', () => {
    const rawSecret = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
    const payload = `AWS_SECRET_ACCESS_KEY=${rawSecret}`
    const result = detectSensitiveData(payload)
    
    expect(result.riskLevel).toBe('high')
    expect(result.findings.some(f => f.type === 'env_secret_key')).toBe(true)
  })

  it('detects Bearer tokens', () => {
    const rawToken = 'ya29.a0AfH6SMDIu123456789abcdefghijklmnopqrstuvwxyz'
    const payload = `Authorization: Bearer ${rawToken}`
    const result = detectSensitiveData(payload)
    
    expect(result.riskLevel).toBe('high')
    const finding = result.findings.find(f => f.type === 'bearer_token')!
    expect(finding).toBeDefined()
    expect(finding.redactedValue).toContain('Bearer ya29…')
    expect(finding.redactedValue).not.toContain(rawToken)
  })

  it('detects private key blocks', () => {
    const payload = `
-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0yGz7V+abc123xyz
-----END RSA PRIVATE KEY-----
`
    const result = detectSensitiveData(payload)
    expect(result.riskLevel).toBe('high')
    const finding = result.findings.find(f => f.type === 'private_key_block')!
    expect(finding).toBeDefined()
    expect(finding.redactedValue).toBe('-----BEGIN PRIVATE KEY----- … -----END PRIVATE KEY-----')
  })

  it('detects JWT-like structural tokens', () => {
    const jwtToken = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
    const result = detectSensitiveData(jwtToken)
    
    expect(result.riskLevel).toBe('high')
    const finding = result.findings.find(f => f.type === 'jwt_like_token')!
    expect(finding).toBeDefined()
    expect(finding.redactedValue).not.toContain(jwtToken)
  })

  it('detects password assignments (medium risk)', () => {
    const payload = 'db_password = mySuperSecretPassword123'
    const result = detectSensitiveData(payload)
    
    expect(result.riskLevel).toBe('medium')
    const finding = result.findings.find(f => f.type === 'password_assignment')!
    expect(finding).toBeDefined()
    expect(finding.redactedValue).toContain('db_password=mySu…d123')
    expect(finding.redactedValue).not.toContain('mySuperSecretPassword123')
  })

  it('avoids obvious false positives on tutorial/test placeholders', () => {
    const payload = `
      Ustaw GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
      Użyj Bearer token-here
      Hasło: my_password
    `
    const result = detectSensitiveData(payload)
    expect(result.riskLevel).not.toBe('high')
    expect(result.riskLevel).not.toBe('medium')
    expect(result.findings.length).toBe(0)
  })

  it('allows disabling high-risk rules completely via config blockHighRisk=false override', () => {
    const payload = 'GOOGLE_GENERATIVE_AI_API_KEY=g15f_87a9b6c5d4e3f2g1h0j9k8l7m6n5o'
    
    // When config explicitly skips high risk checks
    const result = detectSensitiveData(payload, { blockHighRisk: false })
    
    expect(result.riskLevel).toBe('none')
    expect(result.findings.length).toBe(0)
  })

  it('allows specifying custom enabledRuleIds to run localized scans', () => {
    const payload = `
      Mój e-mail: test@example.com
      Mój klucz: sk-abc123xyz7890123456789
    `
    // Only search for email_address (rule id: 'email-address')
    const result = detectSensitiveData(payload, { enabledRuleIds: ['email-address'] })
    
    expect(result.riskLevel).toBe('low')
    expect(result.findings.length).toBe(1)
    expect(result.findings[0]!.type).toBe('email_address')
  })

  it('does not flag normal prompts under secure guidelines', () => {
    const normalPrompt = 'Napisz artykuł na bloga na temat inżynierii promptów w 500 słowach z tabelą markdown.'
    const result = detectSensitiveData(normalPrompt)
    
    expect(result.riskLevel).toBe('none')
    expect(result.findings.length).toBe(0)
  })

  it('detects database URLs (database_url)', () => {
    const rawSecret = 'postgresql://postgres:secret-password123@localhost:5432/mydb'
    const result = detectSensitiveData(rawSecret)
    
    expect(result.riskLevel).toBe('high')
    expect(result.findings.length).toBe(1)
    const finding = result.findings[0]!
    expect(finding.type).toBe('database_url')
    expect(finding.redactedValue).toBe('postgresql://postgres:[redacted]@localhost:5432/mydb')
  })

  it('scans multiple request fields and aggregates findings', () => {
    const fields = {
      input_prompt: 'Napisz artykuł na bloga.',
      task_goal: 'database connection: postgresql://postgres:p@localhost/db',
      constraints: 'Bearer token1234567890abcdefg'
    }

    const result = scanRequestFields(fields)

    expect(result.riskLevel).toBe('high')
    expect(result.findings.length).toBe(3)
    
    const goalFinding = result.findings.find(f => f.field === 'task_goal')!
    expect(goalFinding).toBeDefined()
    expect(goalFinding.type).toBe('database_url')
    
    const constraintsFinding = result.findings.find(f => f.field === 'constraints')!
    expect(constraintsFinding).toBeDefined()
    expect(constraintsFinding.type).toBe('bearer_token')
  })
})
