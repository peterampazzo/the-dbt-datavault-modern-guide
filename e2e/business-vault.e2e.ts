import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { open } from './helpers'

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

test('precedence changes the winning customer cells', async ({ page }) => {
  await open(page, 'business-vault')
  const toggle = page.getByTestId('precedence-toggle')
  const table = page.getByTestId('integrated-customer')
  await expect(table).toContainText('Chiara Rossi')
  await toggle.getByRole('button', { name: 'Shop first' }).click()
  await expect(table).toContainText('Kiki Rossi')
  await expect(table.getByText('changed').first()).toBeVisible()
})

test('computed order totals are shown', async ({ page }) => {
  await open(page, 'business-vault')
  const totals = page.getByRole('region', { name: 'customer_order_total_s' })
  await expect(totals).toContainText('310')
  await expect(totals).toContainText('1800')
})

test('migration checklist survives reload and reset clears it', async ({ page }) => {
  await open(page, 'migration-checklist')
  const checks = page.getByRole('checkbox')
  await checks.first().check()
  await expect(page.getByTestId('migration-count')).toHaveText('1 of 8 done')
  await page.reload()
  await expect(checks.first()).toBeChecked()
  await page.getByTestId('migration-reset').click()
  await expect(page.getByTestId('migration-count')).toHaveText('0 of 8 done')
  await expect(checks.first()).not.toBeChecked()
})

test('business vault chapters pass axe', async ({ page }) => {
  for (const slug of ['business-vault', 'migration-checklist']) {
    await open(page, slug)
    const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze()
    expect(violations.map((violation) => violation.id)).toEqual([])
  }
})

test('business vault chapters fit 320px mobile width', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'Run the 320px overflow check in the mobile project.')
  await page.setViewportSize({ width: 320, height: 700 })
  for (const slug of ['business-vault', 'migration-checklist']) {
    await open(page, slug)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0)
  }
})
