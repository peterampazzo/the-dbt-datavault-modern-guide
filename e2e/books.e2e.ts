import { expect, test } from '@playwright/test'

test('links from before the bookshelf open the same page in the Data Vault book', async ({ page }) => {
  await page.goto('/#/replay/recap')
  await expect(page).toHaveURL(/#\/datavault\/replay\/recap$/)
  await expect(page.locator('main h1').first()).toBeVisible()

  await page.goto('/#/hash-lab?s=hashdiff-did-anything-change')
  await expect(page).toHaveURL(/#\/datavault\/hash-lab\/hashdiff-did-anything-change$/)

  await page.goto('/')
  await expect(page).toHaveURL(/#\/datavault$/)
  await expect(page.locator('main h1').first()).toBeVisible()
})

test('an old link typed into an open tab is rewritten too', async ({ page }) => {
  await page.goto('/#/datavault/')
  await page.evaluate(() => (window.location.hash = '#/pit'))
  await expect(page).toHaveURL(/#\/datavault\/pit$/)
  await expect(page.locator('main h1').first()).toBeVisible()
})
