import { vi, beforeAll, afterAll } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

// Mock 'server-only' globally so Vitest tests can import server modules safely
vi.mock('server-only', () => ({}))

// Load environment variables from .env.local for testing
try {
  const envPath = path.resolve(__dirname, '../.env.local')
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8')
    for (const line of envConfig.split('\n')) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const parts = trimmed.split('=')
        if (parts.length >= 2) {
          const key = parts[0].trim()
          let value = parts.slice(1).join('=').trim()
          // Strip enclosing quotes if any
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.substring(1, value.length - 1)
          }
          if (!(key in process.env)) {
            process.env[key] = value
          }
        }
      }
    }
  }
} catch (err) {
  console.warn('Failed to load .env.local in test setup:', err)
}

// Global external network guard for OpenRouter in normal (offline) tests
let originalFetch: typeof globalThis.fetch;

beforeAll(() => {
  originalFetch = globalThis.fetch;
  globalThis.fetch = async function (input, init) {
    const urlString = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : (input as Request).url || '');

    if (urlString.includes('openrouter.ai') && process.env.RUN_LIVE_AI_TESTS !== 'true') {
      const errorMsg = `[SECURITY BLOCK] Attempted external network request to OpenRouter during offline tests: ${urlString}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    return originalFetch.call(this, input, init);
  };
});

afterAll(() => {
  if (originalFetch) {
    globalThis.fetch = originalFetch;
  }
});
