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

test('modelling: the satellite split appears at step 3.2', async ({ page }) => {
  await open(page, 'modelling')
  const group = page.getByRole('heading', { name: 'Step through the satellites' }).locator('xpath=..')
  await group.getByRole('button', { name: 'Next →' }).click()
  await expect(group.getByText('Step 3.2 · Satellites')).toBeVisible()
  const splitNode = group.locator('div.absolute.w-44').filter({ hasText: 'customer_balance_s' })
  await expect(group.locator('div.absolute.w-44').filter({ hasText: 'customer_n_s' })).toBeVisible()
  await expect(splitNode).toHaveCount(0)
  await group.getByRole('switch').click()
  await expect(splitNode).toBeVisible()
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

test('load player: the staged batch-one phone rows are visible', async ({ page }) => {
  await open(page, 'load-player')
  await page.getByRole('button', { name: 'Next step' }).click()
  const phones = page.getByRole('region', { name: 'stg_customer_phone' })
  await expect(phones).toBeVisible()
  await expect(phones.getByText('home')).toBeVisible()
  await expect(phones.getByText('mobile').first()).toBeVisible()
})

test('satellites: a bar shows its interval and the other flavours are separate pages', async ({ page }, info) => {
  await open(page, 'satellite-flavours')
  const bar = page.getByRole('button', { name: /Alice, valid from 2024-01-01/ })
  await expect(bar).toHaveAccessibleName(/to 2024-01-03 05:59:59\.999999/)
  const barBox = await bar.boundingBox()
  const trackBox = await bar.locator('xpath=..').boundingBox()
  expect(barBox && trackBox ? barBox.width / trackBox.width : 0).toBeGreaterThan(0.5)
  if (info.project.name === 'mobile') await bar.tap()
  else await bar.click()
  await expect(bar).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText(/ldts 2024-01-01 06:00:00/)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Multi-active satellites', exact: true })).toBeVisible()
  await expect(page.getByRole('region', { name: 'customer_phone_ma_s' })).toBeVisible()
})

test('PIT: the customer hub key sits beside the snapshot dimension key', async ({ page }) => {
  await open(page, 'pit')
  await expect(page.getByText(/dimension key per customer per snapshot/)).toBeVisible()
  const table = page.getByRole('region', { name: 'customer_pit' })
  await expect(table.getByRole('columnheader', { name: 'hk_customer_h' })).toBeVisible()
  await expect(table.getByRole('columnheader', { name: 'hk_customer_d' })).toBeVisible()
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
