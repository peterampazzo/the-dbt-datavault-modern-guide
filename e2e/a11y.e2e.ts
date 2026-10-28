import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { open, ROUTES } from './helpers'

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

for (const theme of ['dark', 'light'] as const) {
  test.describe(`WCAG 2.2 AA (${theme})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('theme', t), theme)
    })
    for (const r of ROUTES) {
      test(r.title, async ({ page }) => {
        await open(page, r.slug)
        await page.waitForTimeout(800)
        const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze()
        const summary = violations.map((v) => `${v.impact} ${v.id}: ${v.help} (${v.nodes.length}×, e.g. ${v.nodes[0].target.join(' ')})`)
        expect(summary).toEqual([])
      })
    }
  })
}

test('desktop Contents dialog passes axe with the practitioner path active', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'The Contents dialog is checked on desktop.')
  await page.addInitScript(() => localStorage.setItem('reading-path', 'dv-practitioner'))
  await open(page, 'hash-lab')
  await page.getByRole('button', { name: 'Contents' }).click()
  await expect(page.getByRole('dialog', { name: 'Contents' })).toBeVisible()
  await page.waitForTimeout(800)
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze()
  const summary = violations.map((v) => `${v.impact} ${v.id}: ${v.help} (${v.nodes.length}×, e.g. ${v.nodes[0].target.join(' ')})`)
  expect(summary).toEqual([])
})
