import { AxeBuilder } from '@axe-core/playwright'
import { expect, test, type Locator } from '@playwright/test'
import { open } from './helpers'

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

async function expectInViewport(locator: Locator) {
  const box = await locator.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.y).toBeGreaterThanOrEqual(0)
  expect(box!.y + box!.height).toBeLessThanOrEqual(800)
}

async function expectNoOverflow(page: import('@playwright/test').Page) {
  const widths = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: window.innerWidth }))
  expect(widths.document).toBeLessThanOrEqual(widths.viewport)
}

async function expectAxeClean(page: import('@playwright/test').Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze()
  const summary = violations.map((violation) => `${violation.impact} ${violation.id}: ${violation.help}`)
  expect(summary).toEqual([])
}

test('source-to-reports shows all five stops on load', async ({ page }, info) => {
  test.setTimeout(120_000)
  test.skip(info.project.name !== 'desktop', 'The viewport placement check uses the 1280 × 800 desktop viewport.')
  await page.setViewportSize({ width: 1280, height: 800 })
  await open(page, 'what-is-data-vault', { paged: true })
  await page.goto('/#/what-is-data-vault/from-source-systems-to-reports')
  const flow = page.getByRole('list', { name: 'From source systems to reports' })
  const stops = flow.getByRole('button')
  await expect(stops).toHaveCount(5)
  for (let index = 0; index < 5; index += 1) await expectInViewport(stops.nth(index))
  await stops.nth(1).click()
  await expect(page.getByRole('region', { name: 'Getting the data out' })).toContainText('Delivery 1:')
  await expectNoOverflow(page)
  await expectAxeClean(page)
})

test('Fabric architecture shows its three dbt schemas', async ({ page }) => {
  test.setTimeout(120_000)
  await open(page, 'what-is-data-vault')
  await page.getByRole('button', { name: 'Medallion on Fabric' }).click()
  for (const schema of ['dv_stage', 'raw_vault', 'business_vault']) {
    await expect(page.getByText(new RegExp(schema)).last()).toBeVisible()
  }
  await expectNoOverflow(page)
  await expectAxeClean(page)
})

test('each customer-key candidate updates its computed profile', async ({ page }) => {
  test.setTimeout(120_000)
  await open(page, 'modelling')
  const feedback = page.getByTestId('key-profile-feedback')
  const scenarios = [
    { key: 'c_custkey', text: 'all 5 distinct orders.o_custkey values occur here' },
    { key: 'c_name', text: '7 distinct names; 0 returning customers changed names' },
    { key: 'c_address', text: '8 distinct addresses; 1 returning customer changed address' },
    { key: 'c_mktsegment', text: '5 distinct segments for 7 customers; 1 customer changed segment' },
  ]
  for (const scenario of scenarios) {
    await page.getByRole('radio', { name: scenario.key }).check()
    await expect(feedback).toContainText(scenario.text)
  }
  await expect(page.getByText('5 hub rows for 7 customers.')).toBeVisible()
  await page.getByRole('radio', { name: 'c_address' }).check()
  await expect(page.getByText('Got it wrong? Nothing is lost.', { exact: true })).toBeVisible()
  const replayLink = page.getByRole('link', { name: 'See the Replay lab.' })
  await expect(replayLink).toHaveAttribute('href', '#/replay')
  await expectNoOverflow(page)
  await expectAxeClean(page)
})

test('modelling stepper reveals the next step and a new marker', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'The viewport placement check uses the 1280 × 800 desktop viewport.')
  await open(page, 'modelling')
  const group = page.getByRole('heading', { name: 'Step through the hubs' }).locator('xpath=..')
  const jump = group.getByRole('combobox', { name: 'Jump to step' })
  await expect(jump).toBeVisible()
  await expect(group.getByText('Hubs appear here from step 1.3.')).toBeVisible()
  const placeholder = group.getByText('Hubs appear here from step 1.3.')
  expect((await placeholder.boundingBox())?.height).toBeLessThanOrEqual(112)
  await expect(group.getByRole('button', { name: 'Restart hubs steps' })).toHaveCount(0)
  await group.getByRole('button', { name: 'Next →' }).click()
  await expect(group.getByRole('button', { name: 'Restart hubs steps' })).toBeVisible()
  const title = group.getByText('Step 2 of 3 · Hubs')
  const marker = group.getByText('new', { exact: true }).first()
  await expect(title).toBeVisible()
  await expect(marker).toBeVisible()
  await expectInViewport(title)
  await expectInViewport(marker)
})

test('the focused Load player view passes axe and has no mobile overflow', async ({ page }) => {
  test.setTimeout(120_000)
  await open(page, 'load-player')
  await page.getByRole('tab', { name: /Batch 3/ }).click()
  await page.getByRole('button', { name: 'Satellites load' }).click()
  await expect(page.getByTestId('what-changed')).toContainText('customer_n_s')
  await expectNoOverflow(page)
  await expectAxeClean(page)
})

test('batch 3 keeps each phase result and focused table within one viewport', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'The viewport placement check uses the 1280 × 800 desktop viewport.')
  await open(page, 'load-player')
  const controls = page.getByTestId('load-player-controls')
  await page.getByRole('tab', { name: /Batch 3/ }).click()
  const cases = [
    { phase: 'Source lands', tables: ['source: raw_customer'], summary: 'Landing received' },
    { phase: 'Stage hashes', tables: ['stg_customer'], summary: 'Stage added hashkeys' },
    { phase: 'Hubs load', tables: ['customer_h'], summary: 'customer_h' },
    { phase: 'Links load', tables: ['customer_nation_l'], summary: 'customer_nation_l' },
    { phase: 'Satellites load', tables: ['customer_n_s', 'nation_n_s'], summary: 'customer_n_s' },
  ]

  for (let index = 0; index < cases.length; index += 1) {
    const current = cases[index]
    if (index > 0) await page.getByRole('button', { name: 'Next step' }).click()
    await expect(page.getByRole('button', { name: current.phase })).toHaveAttribute('aria-pressed', 'true')
    await controls.evaluate((element) => window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY))
    const result = page.getByTestId('what-changed')
    await expect(result).toContainText(current.summary)
    await expectInViewport(result)
    for (const tableName of current.tables) {
      const table = page.getByRole('region', { name: tableName })
      await expect(table).toBeVisible()
      await expectInViewport(table.getByRole('row').first())
      await expectInViewport(table.getByRole('row').nth(1))
    }
  }
})
