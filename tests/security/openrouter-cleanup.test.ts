import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'

// Helper to recursively walk a directory and gather all source files
function getAllFiles(dirPath: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dirPath)) return fileList

  const files = fs.readdirSync(dirPath)

  for (const file of files) {
    const absolutePath = path.join(dirPath, file)
    if (fs.statSync(absolutePath).isDirectory()) {
      getAllFiles(absolutePath, fileList)
    } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
      fileList.push(absolutePath)
    }
  }

  return fileList
}

describe('Static Cleanliness: No OpenRouter references in production code', () => {
  const workspaceRoot = path.resolve(__dirname, '../../')
  const appDir = path.join(workspaceRoot, 'app')
  const libDir = path.join(workspaceRoot, 'lib')
  const componentsDir = path.join(workspaceRoot, 'components')

  const activeCodeFiles = [
    ...getAllFiles(appDir),
    ...getAllFiles(libDir),
    ...getAllFiles(componentsDir)
  ]

  it('ensures zero production runtime files contain active OpenRouter variable references', () => {
    const forbiddenPatterns = [
      'OPENROUTER_API_KEY',
      'OPENROUTER_FALLBACK_MODEL_ID',
      'OPENROUTER_MODEL_ID',
      '@openrouter/ai-sdk-provider'
    ]

    const violations: string[] = []

    for (const filePath of activeCodeFiles) {
      // Skip the decision log or archive files just in case, but scan lib/app/components
      if (filePath.endsWith('sensitive-data-rules.ts') || filePath.endsWith('observability.ts')) {
        continue
      }
      const content = fs.readFileSync(filePath, 'utf-8')
      const relativePath = path.relative(workspaceRoot, filePath)

      for (const pattern of forbiddenPatterns) {
        if (content.includes(pattern)) {
          violations.push(`${relativePath}: references forbidden legacy pattern "${pattern}"`)
        }
      }
    }

    expect(violations, `Found active OpenRouter code references:\n${violations.join('\n')}`).toEqual([])
  })
})
