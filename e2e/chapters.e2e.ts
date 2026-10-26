import { expect, test } from '@playwright/test'
import { open, ROUTES } from './helpers'

test('every chapter opens from the home page with no errors', async ({ page }) => {
  const errors = await open(page, '')
  for (const r of ROUTES.slice(1)) {
    await page.locator(`a[href="#/${r.slug}"]`).filter({ visible: true }).first().click()
    await expect(page.locator('main h1')).toHaveText(r.title)
  }
  expect(errors).toEqual([])
})

test('theme choice survives a reload', async ({ page }) => {
  await open(page, '')
  const dark = () => page.evaluate(() => document.documentElement.classList.contains('dark'))
  const before = await dark()
  await page.getByRole('button', { name: 'Toggle theme' }).click()
  await page.reload()
  await expect.poll(dark).toBe(!before)
})

test('modelling: Next and Back walk the steps', async ({ page }) => {
  await open(page, 'modelling')
  const step = page.getByText(/^Step \S+ · /)
  const first = await step.textContent()
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(step).not.toHaveText(first ?? '')
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(step).toHaveText(first ?? '')
})

test('dbt: the terminal only runs when asked and finishes', async ({ page }) => {
  await open(page, 'dbt')
  const done = page.getByText(/Completed successfully\. PASS=\d+/)
  await page.waitForTimeout(1500)
  await expect(done).toHaveCount(0)
  await page.getByRole('button', { name: /Run dbt build/ }).click()
  await expect(done).toBeVisible({ timeout: 15_000 })
})

test('hash lab: all-NULL input gives the zero key', async ({ page }) => {
  await open(page, 'hash-lab')
  await page.getByRole('button', { name: /All NULL/ }).click()
  await expect(page.getByText('00000000000000000000000000000000').first()).toBeVisible()
})

test('load player: Step advances the phase, batches switch', async ({ page }) => {
  await open(page, 'load-player')
  const phase = page.getByRole('button', { name: 'Stage hashes' })
  await page.getByRole('button', { name: 'Step' }).click()
  await expect(phase.locator('div').nth(2)).toHaveClass(/text-foreground/)
  await page.getByRole('button', { name: /Batch 2/ }).click()
  await expect(page.getByRole('button', { name: /Batch 2/ })).toHaveClass(/border-sky-500/)
})

test('satellites: tapping a bar shows its interval, tabs switch', async ({ page }, info) => {
  await open(page, 'satellite-flavours')
  const bar = page.getByRole('button', { name: /Alice, valid from 2024-01-01/ })
  if (info.project.name === 'mobile') await bar.tap()
  else await bar.click()
  await expect(bar).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText(/ldts 2024-01-01 06:00:00/)).toBeVisible()
  await page.getByRole('tab', { name: 'Multi-active' }).click()
  await expect(page.getByRole('tab', { name: 'Multi-active' })).toHaveAttribute('aria-selected', 'true')
})

test('lineage: clicking a node selects it', async ({ page }) => {
  await open(page, 'dbt-project')
  await page.locator('.react-flow__node', { hasText: 'customer_pit' }).first().click()
  await expect(page.locator('main .font-mono.text-lg')).toHaveText('customer_pit')
})
