import { expect, test } from '@playwright/test'
import { open, ROUTES } from './helpers'

test('every chapter opens from the home page with no errors', async ({ page }) => {
  const errors = await open(page, '')
  for (const r of ROUTES.slice(1)) {
    await page.locator(`a[href="#/${r.slug}"]`).filter({ visible: true }).first().click()
    await expect(page.locator('main h1').first()).toHaveText(r.title)
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
  const group = page.getByRole('heading', { name: 'Step through the hubs' }).locator('xpath=..')
  const step = group.getByText(/^Step \S+ · /)
  const first = await step.textContent()
  await group.getByRole('button', { name: 'Next →' }).click()
  await expect(step).not.toHaveText(first ?? '')
  await group.getByRole('button', { name: 'Back' }).click()
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

test('load player: Next step advances the phase, batches switch', async ({ page }) => {
  await open(page, 'load-player')
  const phase = page.getByRole('button', { name: 'Stage hashes' })
  await page.getByRole('button', { name: 'Next step' }).click()
  await expect(phase).toHaveAttribute('aria-pressed', 'true')
  const batchTwo = page.getByRole('tab', { name: /Batch 2/ })
  await batchTwo.click()
  await expect(batchTwo).toHaveAttribute('aria-selected', 'true')
})

test('satellites: a bar shows its interval and the other flavours are separate pages', async ({ page }, info) => {
  await open(page, 'satellite-flavours')
  const bar = page.getByRole('button', { name: /Alice, valid from 2024-01-01/ })
  if (info.project.name === 'mobile') await bar.tap()
  else await bar.click()
  await expect(bar).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText(/ldts 2024-01-01 06:00:00/)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Multi-active satellites', exact: true })).toBeVisible()
  await expect(page.getByRole('region', { name: 'customer_phone_ma_s' })).toBeVisible()
})

test('lineage: clicking a node selects it', async ({ page }) => {
  await open(page, 'dbt-project')
  await page.locator('.react-flow__node', { hasText: 'customer_pit' }).first().click()
  await expect(page.locator('main .font-mono.text-lg')).toHaveText('customer_pit')
})

test('dbt: hand-written vs datavault4dbt comparison', async ({ page }) => {
  await open(page, 'dbt')
  const box = page.getByTestId('hand-vs-dbt')
  await box.getByRole('button', { name: 'Satellite' }).click()
  await expect(box.getByText('c_email')).toHaveCount(0)
  await box.getByRole('switch').click()
  await expect(box.getByText(/c_email/).first()).toBeVisible()
  await box.getByRole('button', { name: 'Link' }).click()
  await expect(box.getByText(/hk_customer_nation_l/).first()).toBeVisible()
})
