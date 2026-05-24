import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'

// Helper to recursively walk a directory and gather all files of specific extensions
function getAllFiles(dirPath: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dirPath)) return fileList

  const files = fs.readdirSync(dirPath)

  for (const file of files) {
    const absolutePath = path.join(dirPath, file)
    if (fs.statSync(absolutePath).isDirectory()) {
      // Exclude special Next.js route groups or folders if needed, but scanning everything is safer
      getAllFiles(absolutePath, fileList)
    } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
      fileList.push(absolutePath)
    }
  }

  return fileList
}

describe('Static Security & Secret Exposure Checks', () => {
  const workspaceRoot = path.resolve(__dirname, '../../')
  const appDir = path.join(workspaceRoot, 'app')
  const componentsDir = path.join(workspaceRoot, 'components')

  const clientFiles = [
    ...getAllFiles(appDir),
    ...getAllFiles(componentsDir)
  ].filter(filePath => {
    // We only care about client-facing files:
    // 1. Files containing "use client" or 'use client'
    // 2. Any file under components/ (as they form part of client bundles)
    const content = fs.readFileSync(filePath, 'utf-8')
    const isExplicitClient = content.includes('"use client"') || content.includes("'use client'")
    const isUnderComponents = filePath.includes(path.sep + 'components' + path.sep)
    
    // API endpoints or route handlers are strictly server-side
    const isApiRoute = filePath.includes(path.sep + 'api' + path.sep)
    
    return (isExplicitClient || isUnderComponents) && !isApiRoute
  })

  it('ensures zero client-side files contain references to server-side secrets', () => {
    const forbiddenSecrets = [
      'GOOGLE_GENERATIVE_AI_API_KEY',
      'OPENROUTER_API_KEY',
      'SUPABASE_SECRET_KEY',
      'CRON_SECRET',
      'serverEnv'
    ]

    const violations: string[] = []

    for (const filePath of clientFiles) {
      const content = fs.readFileSync(filePath, 'utf-8')
      const basename = path.basename(filePath)

      for (const secret of forbiddenSecrets) {
        // Exclude comments that might document them safely (e.g. env example explanation)
        // Check for process.env.SECRET or import serverEnv
        const regex = new RegExp(`(process\\.env\\.${secret}|serverEnv|serverEnvSchema)`, 'g')
        if (regex.test(content)) {
          violations.push(`${basename} (${path.relative(workspaceRoot, filePath)}): references forbidden key/import "${secret}"`)
        }
      }
    }

    expect(violations, `Found secret exposure leaks in client components:\n${violations.join('\n')}`).toEqual([])
  })

  it('ensures zero client-side files import server-side database handlers or admin clients', () => {
    const forbiddenImports = [
      '@/lib/supabase/admin',
      'getSupabaseAdminClient',
      'supabaseAdmin',
      '@/lib/supabase/server',
      'getSupabaseServerClient'
    ]

    const violations: string[] = []

    for (const filePath of clientFiles) {
      const content = fs.readFileSync(filePath, 'utf-8')
      const basename = path.basename(filePath)

      for (const imp of forbiddenImports) {
        if (content.includes(imp)) {
          violations.push(`${basename} (${path.relative(workspaceRoot, filePath)}): imports or references server-only database code "${imp}"`)
        }
      }
    }

    expect(violations, `Found server database imports in client components:\n${violations.join('\n')}`).toEqual([])
  })

  it('asserts that the private "prompt_analyses" database table is never read/queried in client code', () => {
    const violations: string[] = []

    for (const filePath of clientFiles) {
      const content = fs.readFileSync(filePath, 'utf-8')
      const basename = path.basename(filePath)

      // Ensure no raw SQL or Supabase JS client refers directly to "prompt_analyses" table client-side
      const directTableReference = /['"]prompt_analyses['"]/g
      if (directTableReference.test(content)) {
        violations.push(`${basename} (${path.relative(workspaceRoot, filePath)}): references database table "prompt_analyses"`)
      }
    }

    expect(violations, `Found forbidden private table "prompt_analyses" references in client files:\n${violations.join('\n')}`).toEqual([])
  })
})
