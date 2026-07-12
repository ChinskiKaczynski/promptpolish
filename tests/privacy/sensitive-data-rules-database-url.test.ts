/**
 * CRIT-01 — database-url regex regression suite
 *
 * Purpose: Prove the database-url pattern detects passwords that contain `@`
 * (previously truncated by [^\s@]+ which stopped at the first `@`).
 *
 * Mandatory matrix from the security audit:
 *   ✅ postgresql://user:P@ssw0rd!@host/db
 *   ✅ postgresql://user:pass#123@host/db
 *   ✅ postgresql://user:p@$$w0rd@host:5432/db
 *   ✅ postgresql://user:multi@ple@at@signs@host/db
 *   ✅ mysql://root:Sup3r@Secret@localhost:3306/mydb
 *   ✅ mongodb://admin:M0ng0@P@ss@cluster.example.com/db
 *   ❌ negative: plain URL with @ in query string must NOT be flagged
 */
import { describe, expect, it } from 'vitest'
import { detectSensitiveData } from '@/lib/privacy/sensitive-data-detector'

describe('CRIT-01 — database-url pattern: passwords containing @', () => {
  // --- POSITIVE CASES (must all be detected) ---

  it('detects postgresql URL with P@ssw0rd! password', () => {
    const input = 'postgresql://user:P@ssw0rd!@host/db'
    const result = detectSensitiveData(input)
    expect(result.riskLevel).toBe('high')
    const finding = result.findings.find(f => f.type === 'database_url')
    expect(finding).toBeDefined()
  })

  it('detects postgresql URL with pass#123 password (non-@ special chars)', () => {
    const input = 'postgresql://user:pass#123@host/db'
    const result = detectSensitiveData(input)
    expect(result.riskLevel).toBe('high')
    const finding = result.findings.find(f => f.type === 'database_url')
    expect(finding).toBeDefined()
  })

  it('detects postgresql URL with p@$$w0rd password and port', () => {
    const input = 'postgresql://user:p@$$w0rd@host:5432/db'
    const result = detectSensitiveData(input)
    expect(result.riskLevel).toBe('high')
    const finding = result.findings.find(f => f.type === 'database_url')
    expect(finding).toBeDefined()
  })

  it('detects postgresql URL with multiple @ in password (multi@ple@at@signs)', () => {
    const input = 'postgresql://user:multi@ple@at@signs@host/db'
    const result = detectSensitiveData(input)
    expect(result.riskLevel).toBe('high')
    const finding = result.findings.find(f => f.type === 'database_url')
    expect(finding).toBeDefined()
  })

  it('detects mysql URL with Sup3r@Secret password', () => {
    const input = 'mysql://root:Sup3r@Secret@localhost:3306/mydb'
    const result = detectSensitiveData(input)
    expect(result.riskLevel).toBe('high')
    const finding = result.findings.find(f => f.type === 'database_url')
    expect(finding).toBeDefined()
  })

  it('detects mongodb URL with M0ng0@P@ss password on subdomain host', () => {
    const input = 'mongodb://admin:M0ng0@P@ss@cluster.example.com/db'
    const result = detectSensitiveData(input)
    expect(result.riskLevel).toBe('high')
    const finding = result.findings.find(f => f.type === 'database_url')
    expect(finding).toBeDefined()
  })

  // --- NEGATIVE CASE (must NOT produce false positive) ---

  it('does NOT flag a plain HTTPS URL that contains @ in query string', () => {
    const input = 'Check out https://example.com/page?ref=user@domain.com for details'
    const result = detectSensitiveData(input, { enabledRuleIds: ['database-url'] })
    const dbFindings = result.findings.filter(f => f.type === 'database_url')
    expect(dbFindings.length).toBe(0)
  })
})
