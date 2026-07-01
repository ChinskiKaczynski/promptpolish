import { describe, expect, it } from 'vitest'

describe('Standard Test Network Block', () => {
  it('blocks requests to openrouter.ai in normal test suite', async () => {
    await expect(fetch('https://openrouter.ai/api/v1/chat/completions')).rejects.toThrow(
      '[SECURITY BLOCK] Attempted external network request to OpenRouter during offline tests'
    )
  })

  it('blocks requests to generativelanguage.googleapis.com in normal test suite', async () => {
    await expect(fetch('https://generativelanguage.googleapis.com/v1beta/models')).rejects.toThrow(
      '[SECURITY BLOCK] Attempted external network request to Google AI API during offline tests'
    )
  })

  it('does not block localhost requests', async () => {
    try {
      await fetch('http://localhost:3000/api/health')
    } catch (err) {
      const error = err as Error
      expect(error.message).not.toContain('[SECURITY BLOCK]')
    }
  })
})
