import { test, expect } from '@playwright/test'

test.describe('Microsoft Clarity Removal Regression Tests', () => {
  test('Clarity should not be loaded, requested, or present in CSP', async ({ page }) => {
    let clarityRequested = false
    let hasClarityInCsp = false

    // Monitor network requests
    page.on('request', (request) => {
      const url = request.url()
      if (url.includes('clarity.ms')) {
        clarityRequested = true
      }
    })

    // Navigate to homepage and check CSP header
    const response = await page.goto('/')
    expect(response).not.toBeNull()

    const headers = response!.headers()
    const csp = headers['content-security-policy'] || ''
    if (csp.includes('clarity.ms')) {
      hasClarityInCsp = true
    }

    // Also check page content for Clarity script tag
    const clarityScript = await page.locator('script[id="microsoft-clarity"]').count()
    expect(clarityScript).toBe(0)

    // Assertions
    expect(clarityRequested).toBe(false)
    expect(hasClarityInCsp).toBe(false)
  })
})
