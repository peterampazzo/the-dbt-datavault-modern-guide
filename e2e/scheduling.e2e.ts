import { expect, test } from '@playwright/test'
import { open } from './helpers'

test('scheduler drawing narrow layout stays within the phone viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await open(page, 'scheduling/the-run')
  const drawing = page.locator('figure[data-drawing="scheduler"]')
  const narrow = drawing.locator('svg').nth(1)
  await expect(narrow).toBeVisible()
  const labels = (await narrow.textContent()) ?? ''
  expect(labels).toContain('delivery lands')
  expect(labels).toContain('marts / readers')
  expect(labels).toContain('solid = data')
  expect(labels).toContain('dashed = control')
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0)
})

test('scheduler tabs use CodeBlock and keep each source link in the figure', async ({ page }) => {
  await open(page, 'scheduling/same-job-different-schedulers')
  const panel = page.getByRole('tabpanel')
  await expect(panel.locator('[data-codeblock]')).toHaveCount(1)
  await expect(panel.locator('figure').getByRole('link')).toBeVisible()
  await page.getByRole('tab', { name: 'Databricks' }).click()
  await expect(panel.locator('[data-codeblock] pre > div').first()).toBeVisible()
  await expect(panel.locator('[data-codeblock]')).toContainText('max_concurrent_runs: 1')
  await expect(panel.locator('figure').getByRole('link')).toHaveAttribute('href', 'https://docs.databricks.com/aws/en/jobs/dbt')
})
