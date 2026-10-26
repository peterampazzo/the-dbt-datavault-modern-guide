import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { open, ROUTES } from './helpers'

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const h2 = (page: import('@playwright/test').Page, name: string) => page.locator('main').getByRole('heading', { level: 2, name, exact: true })

test('chapters read one page at a time by default', async ({ page }) => {
  await page.goto('/#/dbt')
  await expect(h2(page, 'dbt in one minute')).toBeVisible()
  await expect(h2(page, 'By hand vs with dbt')).toHaveCount(0)
  await expect(page.getByText('Page 1 of 5')).toBeVisible()
  await page.getByRole('link', { name: 'Next: From canvas to code' }).click()
  await expect(page).toHaveURL(/#\/dbt\/from-canvas-to-code$/)
  await expect(h2(page, 'From canvas to code')).toBeFocused()
  await expect(h2(page, 'dbt in one minute')).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(0)
})

test('arrow keys turn pages, and the dots jump to any page', async ({ page }) => {
  await open(page, 'dbt', { paged: true })
  await page.keyboard.press('ArrowRight')
  await expect(h2(page, 'From canvas to code')).toBeVisible()
  await page.keyboard.press('ArrowRight')
  await expect(h2(page, 'What the hub macro generates')).toBeVisible()
  await page.keyboard.press('ArrowLeft')
  await expect(h2(page, 'From canvas to code')).toBeVisible()
  await page.getByRole('link', { name: 'Page 5: Run it' }).click()
  await expect(page.getByText('Page 5 of 5')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Next chapter: Hash lab' })).toBeVisible()
})

test('a page address survives a reload and Continue returns to it', async ({ page }) => {
  await open(page, 'what-is-data-vault', { paged: true })
  await page.goto('/#/what-is-data-vault/where-it-sits')
  await page.reload()
  await expect(h2(page, 'Where it sits')).toBeVisible()
  await page.goto('/#/')
  await page.getByRole('link', { name: /Continue: What is Data Vault, Where it sits/ }).click()
  await expect(page).toHaveURL(/where-it-sits$/)
  await expect(h2(page, 'Where it sits')).toBeVisible()
})

test('old ?s= links open the right page', async ({ page }) => {
  await open(page, 'hash-lab', { paged: true })
  await page.goto('/#/hash-lab?s=hashdiff-did-anything-change')
  await expect(page).toHaveURL(/#\/hash-lab\/hashdiff-did-anything-change$/)
  await expect(h2(page, 'Hashdiff: did anything change?')).toBeVisible()
})

test('reaching the last page ticks the chapter', async ({ page }) => {
  await open(page, 'hash-lab', { paged: true })
  const bar = page.getByRole('progressbar', { name: 'Chapters done' })
  await expect(bar).toHaveAttribute('aria-valuenow', '0')
  await page.getByRole('link', { name: 'Next: Hashdiff: did anything change?' }).click()
  await expect(h2(page, 'Hashdiff: did anything change?')).toBeFocused()
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await expect(bar).toHaveAttribute('aria-valuenow', '1')
})

test('"Show as one page" is remembered', async ({ page }) => {
  await open(page, 'dbt', { paged: true })
  const toggle = page.getByRole('button', { name: 'Show as one page' })
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  await toggle.click()
  await expect(page.locator('main h2')).toHaveCount(6)
  await page.evaluate(() => localStorage.removeItem('dv-guide-progress'))
  await page.goto('/#/hash-lab')
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  await expect(h2(page, 'Hashdiff: did anything change?')).toBeVisible()
})

test.describe('paged reader passes WCAG 2.2 AA and has no overflow at 320px', () => {
  for (const r of ROUTES.slice(1)) {
    test(r.title, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 700 })
      const errors = await open(page, r.slug, { paged: true })
      await page.waitForTimeout(800)
      const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze()
      expect(violations.map((v) => `${v.id} (${v.nodes[0].target.join(' ')})`)).toEqual([])
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0)
      expect(errors).toEqual([])
    })
  }
})
