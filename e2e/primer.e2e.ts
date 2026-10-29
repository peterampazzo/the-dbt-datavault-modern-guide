import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { CUSTOMERS } from '../src/lib/dv/dataset'
import { EMAIL_HASHDIFFS } from '../src/lib/primer/email-hashdiffs'
import { open } from './helpers'

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

test('4.2 switches representations and highlights matching workflow concepts', async ({ page }) => {
  await open(page, 'dbt-primer/from-ssis-and-stored-procedures')
  const switcher = page.getByRole('group', { name: 'Choose a SQL Server or dbt representation' })
  await page.getByRole('button', { name: 'Lookup', exact: true }).click()
  await expect(page.getByText(/Selected: Lookup ↔/)).toHaveCount(3)

  await switcher.getByRole('button', { name: 'Stored procedure' }).click()
  await expect(page.getByRole('button', { name: /MERGE match/ })).toHaveAttribute('aria-pressed', 'true')
  await switcher.getByRole('button', { name: 'dbt' }).click()
  await expect(page.getByRole('button', { name: /Hub macro matches known keys/ })).toHaveAttribute('aria-pressed', 'true')
})

test('4.6 counts follow the four incremental and full-refresh steps', async ({ page }) => {
  await open(page, 'dbt-primer/incremental-and-full-refresh')
  const first = CUSTOMERS[0].length
  const firstAndSecond = first + CUSTOMERS[1].length
  const batchThree = CUSTOMERS[2].length
  const countRows = async (label: string, landing: number, target: number) => {
    const result = page.getByRole('region', { name: `count(*) · ${label}` })
    await expect(result.getByRole('row', { name: `landing.customer ${landing}` })).toBeVisible()
    await expect(result.getByRole('row', { name: `stg_customer_incremental ${target}` })).toBeVisible()
  }

  await countRows('Batch 1 · first run', first, first)
  const next = page.getByRole('button', { name: 'Next', exact: true })
  await next.click()
  await countRows('Batch 2 · incremental', first + CUSTOMERS[1].length, firstAndSecond)
  await next.click()
  await countRows('Landing truncated, batch 3 arrives', batchThree, firstAndSecond + batchThree)
  await next.click()
  await countRows('Run --full-refresh', batchThree, batchThree)
})

test('primer pages request no DuckDB assets before a reader starts a live panel', async ({ page }) => {
  const requests: string[] = []
  page.on('request', (request) => {
    if (/duckdb|jsdelivr/i.test(request.url())) requests.push(request.url())
  })
  for (const route of ['models-and-ref', 'incremental-and-full-refresh', 'tests-and-docs']) {
    await open(page, `dbt-primer/${route}`)
    expect(requests).toEqual([])
  }
})

test('4.6 live playback follows the static steps and stays accessible on mobile', async ({ page }) => {
  test.setTimeout(120_000)
  await page.setViewportSize({ width: 375, height: 812 })
  await open(page, 'dbt-primer/incremental-and-full-refresh')
  await page.getByRole('region', { name: 'count(*) · Batch 1 · first run' })
    .locator('xpath=..')
    .getByRole('button', { name: /Run it live in DuckDB/ }).click()
  const live = page.getByRole('region', { name: 'Live DuckDB result' })
  await expect(live).toBeVisible({ timeout: 60_000 })
  const checkLiveCounts = async (landing: number, target: number) => {
    const table = live.getByRole('region', { name: 'Query results' }).getByRole('table')
    await expect(table.getByRole('row', { name: `${landing} ${target}` })).toBeVisible()
  }

  await checkLiveCounts(5, 5)
  const next = page.getByRole('button', { name: 'Next', exact: true })
  await next.click()
  await checkLiveCounts(10, 10)
  await next.click()
  await checkLiveCounts(7, 17)
  await next.click()
  await checkLiveCounts(7, 7)

  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0)
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze()
  expect(violations.map((violation) => violation.id)).toEqual([])
})

test('4.7 live unique test goes red with a duplicate and green after it is removed', async ({ page }) => {
  test.setTimeout(120_000)
  await open(page, 'dbt-primer/tests-and-docs')
  await page.getByRole('region', { name: 'Failing rows · none' })
    .locator('xpath=..')
    .getByRole('button', { name: /Run it live in DuckDB/ }).click()
  const live = page.getByRole('region', { name: 'Live DuckDB result' })
  await expect(live).toBeVisible({ timeout: 60_000 })
  const liveRows = live.getByRole('region', { name: 'Query results' })
  await expect(liveRows).toContainText('0 rows returned')
  await page.getByRole('button', { name: 'Add duplicate customer' }).click()
  await expect(liveRows).toContainText('1 rows returned')
  await page.getByRole('button', { name: 'Remove duplicate customer' }).click()
  await expect(liveRows).toContainText('0 rows returned')
})

test('DuckDB load failure leaves the static result visible', async ({ page }) => {
  test.setTimeout(120_000)
  await page.route('https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.32.0/**', (route) => route.abort())
  await open(page, 'dbt-primer/models-and-ref')
  const panel = page.getByRole('region', { name: 'Static result · landing.customer' }).locator('xpath=..')
  await panel
    .getByRole('button', { name: /Run it live in DuckDB/ }).click()
  await expect(panel.getByRole('status')).toContainText('DuckDB could not run this panel', { timeout: 60_000 })
  await expect(page.getByRole('region', { name: 'Static result · landing.customer' })).toBeVisible()
})

test('4.7 unique test toggles from pass to fail and back', async ({ page }) => {
  await open(page, 'dbt-primer/tests-and-docs')
  await expect(page.getByRole('status')).toContainText('unique(c_custkey): PASS')
  await page.getByRole('button', { name: 'Add duplicate customer' }).click()
  await expect(page.getByRole('status')).toContainText('unique(c_custkey): FAIL')
  await expect(page.getByRole('region', { name: 'Failing rows · duplicate business key' })).toBeVisible()
  await page.getByRole('button', { name: 'Remove duplicate customer' }).click()
  await expect(page.getByRole('status')).toContainText('unique(c_custkey): PASS')
})

test('13.1 change player shows the failing test and then the fix', async ({ page }) => {
  await open(page, 'modern-way/change-player')
  const next = page.getByRole('button', { name: 'Next', exact: true })
  await next.click()
  await next.click()
  await next.click()
  await expect(page.getByRole('status')).toContainText('CI unit test: FAIL')
  await expect(page.getByText(EMAIL_HASHDIFFS[0].actualWithoutEmail, { exact: true })).toHaveCount(2)
  await next.click()
  await expect(page.getByRole('status')).toContainText('CI unit test: PASS')
  await expect(page.getByRole('status')).toContainText(EMAIL_HASHDIFFS[0].expected)
})

test('command selections use the selected model name', async ({ page }) => {
  await open(page, 'dbt-primer/running-dbt-from-the-command-line')
  const selection = page.getByRole('group', { name: 'Selection' })
  await expect(selection.getByRole('button', { name: 'stg_customer', exact: true })).toBeVisible()
  await selection.getByRole('button', { name: 'stg_customer+' }).click()
  await expect(page.getByLabel('Generated dbt command')).toHaveText('dbt build --select stg_customer+ --target dev')
  await selection.getByRole('button', { name: '+stg_customer' }).click()
  await expect(page.getByLabel('Generated dbt command')).toHaveText('dbt build --select +stg_customer --target dev')
})

test('profiles page switches between one full-width example at a time', async ({ page }) => {
  await open(page, 'dbt-primer/profiles-yml-how-dbt-connects')
  const figure = page.locator('main figure').first()
  await expect(figure.locator('[data-codeblock]')).toHaveCount(1)
  await page.getByRole('button', { name: 'Fabric Lakehouse' }).click()
  await expect(figure.getByText('profiles.yml · Fabric Lakehouse (illustrative)')).toBeVisible()
  await expect(figure.getByText("Check the adapter's README for the fields your version needs.")).toBeVisible()
  await expect(figure.locator('[data-codeblock]')).toHaveCount(1)
})

test('all new pages pass mobile axe and overflow checks in both reading modes', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'Mobile accessibility and overflow audit runs in the mobile project.')
  test.setTimeout(120_000)
  const surfaces = [
    { slug: 'dbt-primer', heading: 'dbt primer' },
    { slug: 'dbt-primer/why-dbt', heading: 'Why dbt' },
    { slug: 'dbt-primer/from-ssis-and-stored-procedures', heading: 'From SSIS and stored procedures' },
    { slug: 'dbt-primer/models-and-ref', heading: 'Models and ref()' },
    { slug: 'dbt-primer/jinja-and-compile', heading: 'Jinja and compile' },
    { slug: 'dbt-primer/materializations', heading: 'Materializations' },
    { slug: 'dbt-primer/incremental-and-full-refresh', heading: 'Incremental and --full-refresh' },
    { slug: 'dbt-primer/tests-and-docs', heading: 'Tests and docs' },
    { slug: 'dbt-primer/running-dbt-from-the-command-line', heading: 'Running dbt from the command line' },
    { slug: 'dbt-primer/profiles-yml-how-dbt-connects', heading: 'profiles.yml: how dbt connects' },
    { slug: 'dbt-primer/recap', heading: 'Recap' },
    { slug: 'modern-way', heading: 'Working the modern way' },
    { slug: 'modern-way/change-player', heading: 'Change player' },
    { slug: 'modern-way/targets', heading: 'Targets' },
    { slug: 'modern-way/what-a-reviewer-checks-in-vault-yaml', heading: 'What a reviewer checks in vault YAML' },
    { slug: 'modern-way/slim-ci', heading: 'Slim CI' },
    { slug: 'modern-way/recap', heading: 'Recap' },
  ]

  await page.setViewportSize({ width: 320, height: 700 })
  for (const mode of ['paged', 'scroll'] as const) {
    await page.goto('/#/')
    await page.evaluate((value) => localStorage.setItem('reading-mode', value), mode)
    await page.reload()
    for (const surface of surfaces) {
      await page.goto(`/#/${surface.slug}`)
      await expect(page.getByRole('heading', { name: surface.heading, exact: true }).first()).toBeVisible()
      await expect(page.locator('main article > div').first()).toHaveCSS('opacity', '1')
      const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze()
      const findings = violations.flatMap((violation) =>
        violation.nodes.map((node) => `${violation.id}: ${node.target.join(' ')} ${node.html} — ${node.failureSummary}`),
      )
      expect(findings).toEqual([])
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0)
    }
  }
})
