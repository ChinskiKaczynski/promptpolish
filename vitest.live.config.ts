import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['scripts/live-ai/**/*.live.test.ts'],
    exclude: [],
    setupFiles: ['./tests/setup.ts']
  },
  resolve: {
    alias: {
      '@': new URL('./', import.meta.url).pathname
    }
  }
})
