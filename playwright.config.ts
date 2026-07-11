import { defineConfig, devices } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables from local files if not already set in the environment
const envFiles = ['.env.local', '.env.production.local', '.env']
for (const file of envFiles) {
  const envPath = path.join(__dirname, file)
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8')
    const lines = content.split(/\r?\n/)
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const firstEquals = trimmed.indexOf('=')
      if (firstEquals !== -1) {
        const key = trimmed.slice(0, firstEquals).trim()
        let val = trimmed.slice(firstEquals + 1).trim()
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1)
        }
        if (process.env[key] === undefined) {
          process.env[key] = val
        }
      }
    }
  }
}

const freeAuthFile = path.join(__dirname, 'playwright/.auth/free.json')
const proAuthFile = path.join(__dirname, 'playwright/.auth/pro.json')

const freeStorage = fs.existsSync(freeAuthFile) ? freeAuthFile : { cookies: [], origins: [] }
const proStorage = fs.existsSync(proAuthFile) ? proAuthFile : { cookies: [], origins: [] }

const externalBaseUrl = process.env.E2E_BASE_URL
const baseURL = externalBaseUrl ?? 'http://localhost:3001'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium-free',
      use: {
        ...devices['Desktop Chrome'],
        storageState: freeStorage,
      },
      dependencies: ['setup'],
      testMatch: /free-authenticated\.test\.ts/,
    },
    {
      name: 'chromium-pro',
      use: {
        ...devices['Desktop Chrome'],
        storageState: proStorage,
      },
      dependencies: ['setup'],
      testMatch: /pro-authenticated\.test\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /auth\.setup\.ts|free-authenticated\.test\.ts|pro-authenticated\.test\.ts/,
    },
  ],
  webServer: externalBaseUrl ? undefined : {
    command: 'npx next dev -p 3001',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
})
