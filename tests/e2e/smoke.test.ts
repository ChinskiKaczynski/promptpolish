import { test, expect } from '@playwright/test'

test.describe('PromptPolish E2E Smoke Journey', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      const text = msg.text()
      if (
        msg.type() === 'error' &&
        (text.includes('hydration') ||
          text.includes('did not match') ||
          text.includes('server rendered HTML'))
      ) {
        throw new Error(`CRITICAL HYDRATION ERROR DETECTED: ${text}`)
      }
    })
  })

  test('successfully navigates from / to /analyze and displays mock results', async ({ page }) => {
    // 1. Visit Landing Page
    await page.goto('/')
    await expect(page.locator('header')).toContainText('PromptPolish')

    // 2. Click through to the Analyze form
    const startButton = page.locator('text=Rozpocznij bezpłatnie')
    await expect(startButton).toBeVisible()
    await startButton.click()

    // 3. Verify we arrived on the /analyze page
    await expect(page).toHaveURL(/\/analyze$/)
    await expect(page.locator('h1')).toContainText('Przeanalizuj prompt')

    // 4. Locate form elements
    const textarea = page.locator('textarea')
    await expect(textarea).toBeVisible()

    // 5. Fill out the textarea with a valid prompt (>= 20 characters)
    await textarea.fill('To jest przykładowy i w pełni poprawny prompt o minimalnej długości dwudziestu znaków potrzebny do pomyślnego przejścia testu.')

    // 6. Intercept POST /api/analyze to return a predictable response
    // Set up intercepting rule before trigger submit
    await page.route('**/api/analyze', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'mock',
          overall_score: 85,
          score_level: 'strong',
          improved_prompt: 'This is a polished, structured prompt that is optimized for Gemini 3.5 Flash.',
          change_explanations: ['Dodano rolę i konkretny cel.'],
          analysis: {
            overall_summary: 'Oryginalny prompt był poprawny, ale dodano uściślenia.',
            detected_task_type: 'general_prompt_improvement',
            criteria_scores: [],
            top_weaknesses: [],
            improvement_plan: [],
            improved_prompt: 'This is a polished, structured prompt that is optimized for Gemini 3.5 Flash.',
            change_explanations: []
          },
          sensitive_data: {
            riskLevel: 'none',
            findings: []
          }
        })
      })
    })

    // 7. Click submit button to trigger analysis and redirect
    const submitBtn = page.locator('button[type="submit"]')
    await expect(submitBtn).toBeVisible()
    await submitBtn.click()

    // 8. Assert that the client loading overlay shows up
    // Loader displays "Trwa inżynieryjny audyt promptu..."
    const loadingText = page.locator('h3:has-text("Trwa inżynieryjny audyt")')
    await expect(loadingText).toBeVisible({ timeout: 5000 })

    // 9. Assert that the redirection is triggered successfully
    // Since id returned from API is 'mock', it redirects to `/result/mock`
    await expect(page).toHaveURL(/\/result\/mock$/, { timeout: 15000 })

    // 10. Verify elements on the /result/mock page
    // ResultView renders MockResultPage content, which contains score and details
    await expect(page.locator('h1')).toContainText('Raport audytu promptu')
    
    // Check for circular score display presence (mockAnalysisResult has score 62)
    await expect(page.locator('text=62')).toBeVisible()
    await expect(page.locator('text=Dostateczny')).toBeVisible()

    // Verify copy button is visible and active
    const copyButton = page.locator('text=Skopiuj ulepszony prompt')
    await expect(copyButton).toBeVisible()

    // Verify criteria detailed section title exists
    await expect(page.locator('text=Kryteria szczegółowe')).toBeVisible()

    // Verify the feedback buttons work and are responsive
    const thumbsUp = page.locator('#feedback-btn-up')
    await expect(thumbsUp).toBeVisible()
  })

})
