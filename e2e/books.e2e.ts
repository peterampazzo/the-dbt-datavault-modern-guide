import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

test('the bookshelf opens the Data Vault book, and the book links back', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('main h1')).toHaveText('Build it right')
  await expect(page.getByText('Coming soon')).toBeVisible()
  await page.getByRole('link', { name: /Open the book: Data Vault/ }).click()
  await expect(page).toHaveURL(/#\/datavault$/)
  await expect(page.locator('main h1').first()).toHaveText('Data Vault, modelled and built with dbt')
  await page.getByRole('link', { name: 'All books' }).click()
  await expect(page.locator('main h1')).toHaveText('Build it right')
})

test('links from before the bookshelf open the same page in the Data Vault book', async ({ page }) => {
  await page.goto('/#/replay/recap')
  await expect(page).toHaveURL(/#\/datavault\/replay\/recap$/)
  await expect(page.locator('main h1').first()).toBeVisible()

  await page.goto('/#/hash-lab?s=hashdiff-did-anything-change')
  await expect(page).toHaveURL(/#\/datavault\/hash-lab\/hashdiff-did-anything-change$/)
})

test('an old link typed into an open tab is rewritten too', async ({ page }) => {
  await page.goto('/#/datavault/')
  await page.evaluate(() => (window.location.hash = '#/pit'))
  await expect(page).toHaveURL(/#\/datavault\/pit$/)
  await expect(page.locator('main h1').first()).toBeVisible()
})

for (const theme of ['dark', 'light'] as const) {
  test(`the bookshelf passes WCAG 2.2 AA (${theme})`, async ({ page }) => {
    await page.addInitScript((t) => localStorage.setItem('theme', t), theme)
    await page.goto('/')
    await expect(page.locator('main h1')).toBeVisible()
    const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze()
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([])
  })
}

for (const width of [320, 390, 1280]) {
  test(`the bookshelf has no horizontal overflow @${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 700 })
    await page.goto('/')
    await expect(page.locator('main h1')).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })
}
