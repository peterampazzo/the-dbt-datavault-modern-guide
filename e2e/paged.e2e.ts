import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { open, ROUTES } from './helpers'

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const h2 = (page: import('@playwright/test').Page, name: string) => page.locator('main').getByRole('heading', { level: 2, name, exact: true })

test('the cover starts a paged chapter and content pages stay separate', async ({ page }) => {
  await page.goto('/#/dbt')
  await expect(page.getByText(/Chapter 5 of 17 · Part 2: Building it with dbt · about/)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Building it with dbt', exact: true })).toBeVisible()
  await expect(page.getByRole('region', { name: 'In 30 seconds' })).toBeVisible()
  await expect(page.getByText('Essential', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: '1. By hand vs with dbt' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Start' })).toBeVisible()
  await expect(page.getByText('Page 1 of 6')).toBeVisible()
  await expect(h2(page, 'By hand vs with dbt')).toHaveCount(0)
  await page.getByRole('link', { name: 'Start' }).click()
  await expect(page).toHaveURL(/#\/dbt\/by-hand-vs-with-dbt$/)
  await expect(h2(page, 'By hand vs with dbt')).toBeFocused()
  await expect(page.getByText('Page 2 of 6')).toBeVisible()
  await expect(h2(page, 'From canvas to code')).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(0)
})

test('arrow keys turn pages, and the dots jump to any page', async ({ page }) => {
  await open(page, 'dbt', { paged: true })
  await page.keyboard.press('ArrowRight')
  await expect(h2(page, 'By hand vs with dbt')).toBeVisible()
  await page.keyboard.press('ArrowRight')
  await expect(h2(page, 'From canvas to code')).toBeVisible()
  await page.keyboard.press('ArrowLeft')
  await expect(h2(page, 'By hand vs with dbt')).toBeVisible()
  await page.getByRole('link', { name: 'Page 5: Run it' }).click()
  await expect(page.getByText('Page 5 of 6')).toBeVisible()
  await expect(h2(page, 'Run it')).toBeVisible()
  await page.getByRole('link', { name: 'Next: Recap' }).click()
  await expect(page.getByText('Page 6 of 6')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Recap' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Next chapter: Hash lab' }).first()).toBeVisible()
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

test('chapter completion is marked on recap, not the last content page', async ({ page }) => {
  await open(page, 'hash-lab', { paged: true })
  const bar = page.getByRole('progressbar', { name: 'Chapters done' })
  await expect(bar).toHaveAttribute('aria-valuenow', '0')
  await page.getByRole('link', { name: 'Start' }).click()
  await page.getByRole('link', { name: 'Next: Hashdiff: did anything change?' }).click()
  await expect(h2(page, 'Hashdiff: did anything change?')).toBeFocused()
  await page.getByRole('link', { name: 'Next: Ghost keys and why we hash' }).click()
  await expect(h2(page, 'Ghost keys and why we hash')).toBeVisible()
  await expect(bar).toHaveAttribute('aria-valuenow', '0')
  await page.getByRole('link', { name: 'Next: Recap' }).click()
  await expect(bar).toHaveAttribute('aria-valuenow', '1')
})

test('"Show as one page" is remembered', async ({ page }) => {
  await open(page, 'dbt', { paged: true })
  const toggle = page.getByRole('button', { name: 'Show as one page' })
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  await toggle.click()
  await expect(h2(page, 'By hand vs with dbt')).toBeVisible()
  await expect(h2(page, 'Run it')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Quick check (optional)' })).toBeVisible()
  await page.evaluate(() => localStorage.removeItem('dv-guide-progress'))
  await page.goto('/#/hash-lab')
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  await expect(h2(page, 'Ghost keys and why we hash')).toBeVisible()
})

test('chapter 3 is the Data Vault name bridge', async ({ page }) => {
  await open(page, 'dv-names', { paged: true })
  await expect(page.getByText(/Chapter 3 of 17 · Part 1: The method · about/)).toBeVisible()
  await expect(page.getByRole('heading', { name: "Data Vault in this guide's names" })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Start' })).toBeVisible()
  await page.getByRole('link', { name: 'Start' }).click()
  await expect(page).toHaveURL(/#\/dv-names\/the-names-we-use$/)
  await expect(h2(page, 'The names we use')).toBeVisible()
})

test('recap quick check is optional and gives correct and incorrect feedback', async ({ page }) => {
  await open(page, 'dv-names', { paged: true })
  await page.goto('/#/dv-names/recap')
  const next = page.locator('#chapter-recap').getByRole('link', { name: 'Next chapter: dbt primer' })
  await expect(next).toBeVisible()
  await next.click()
  await expect(page).toHaveURL(/#\/dbt-primer$/)

  await page.goto('/#/dv-names/recap')
  const question = page.getByRole('group', { name: 'Which model is the customer hub?' })
  await expect(question.getByRole('radio')).toHaveCount(3)
  await expect(question.getByRole('button', { name: 'Check' })).toHaveCount(1)
  const check = question.getByRole('button', { name: 'Check' })
  await expect(check).toBeDisabled()
  await question.getByRole('radio', { name: 'customer_n_s' }).check()
  await check.click()
  await expect(question.getByRole('status')).toContainText('Not quite.')
  await question.getByRole('radio', { name: 'customer_h' }).check()
  await question.getByRole('button', { name: 'Check' }).click()
  await expect(question.getByRole('status')).toContainText('Correct.')
})

test('covers, recaps and the name bridge pass mobile axe and overflow checks in both modes', async ({ page }) => {
  for (const mode of ['paged', 'scroll'] as const) {
    for (const surface of [
      { slug: 'dbt', heading: 'Building it with dbt' },
      { slug: 'dbt/recap', heading: 'Recap' },
      { slug: 'dv-names/the-names-we-use', heading: 'The names we use' },
    ]) {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.addInitScript((value) => localStorage.setItem('reading-mode', value), mode)
      await page.goto(`/#/${surface.slug}`)
      await expect(page.getByRole('heading', { name: surface.heading }).first()).toBeVisible()
      await page.waitForTimeout(200)
      const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze()
      expect(violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([])
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0)
    }
  }
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
