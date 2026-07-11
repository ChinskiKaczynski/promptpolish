import { test as setup, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const authDir = path.join(process.cwd(), 'playwright/.auth')

setup('setup free user', async ({ page }) => {
  const missingVars: string[] = []
  if (!process.env.E2E_FREE_EMAIL) missingVars.push('E2E_FREE_EMAIL')
  if (!process.env.E2E_FREE_PASSWORD) missingVars.push('E2E_FREE_PASSWORD')

  if (missingVars.length > 0) {
    console.log(`BLOCKED_MISSING_CREDENTIALS: ${missingVars.join(', ')}`)
    setup.skip(true, `BLOCKED_MISSING_CREDENTIALS: ${missingVars.join(', ')}`)
    return
  }

  const email = process.env.E2E_FREE_EMAIL!
  const password = process.env.E2E_FREE_PASSWORD!

  await page.goto('/login')
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.locator('button[type="submit"]').click()
  
  await expect(page).toHaveURL(/\/account/, { timeout: 15000 })
  await expect(page.locator('text=Twój plan')).toBeVisible({ timeout: 10000 })
  await expect(page.locator('text=Free').first()).toBeVisible({ timeout: 5000 })

  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true })
  }
  await page.context().storageState({ path: path.join(authDir, 'free.json') })
})

setup('setup pro user', async ({ page }) => {
  const missingVars: string[] = []
  if (!process.env.E2E_PRO_EMAIL) missingVars.push('E2E_PRO_EMAIL')
  if (!process.env.E2E_PRO_PASSWORD) missingVars.push('E2E_PRO_PASSWORD')

  if (missingVars.length > 0) {
    console.log(`BLOCKED_MISSING_CREDENTIALS: ${missingVars.join(', ')}`)
    setup.skip(true, `BLOCKED_MISSING_CREDENTIALS: ${missingVars.join(', ')}`)
    return
  }

  const email = process.env.E2E_PRO_EMAIL!
  const password = process.env.E2E_PRO_PASSWORD!

  await page.goto('/login')
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.locator('button[type="submit"]').click()
  
  await expect(page).toHaveURL(/\/account/, { timeout: 15000 })
  await expect(page.locator('text=Twój plan')).toBeVisible({ timeout: 10000 })
  await expect(page.locator('text=Pro').first()).toBeVisible({ timeout: 5000 })

  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true })
  }
  await page.context().storageState({ path: path.join(authDir, 'pro.json') })
})
