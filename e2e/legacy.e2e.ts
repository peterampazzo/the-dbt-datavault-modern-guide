import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { open } from './helpers'

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

async function openPagedSection(page: Parameters<typeof open>[0], slug: string, title: string) {
  await page.goto('/#/')
  await page.evaluate(() => localStorage.setItem('reading-mode', 'paged'))
  await page.reload()
  await page.goto(`/#/${slug}`)
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
}

test('T-SQL dialect is remembered and Add a column highlights its lines', async ({ page }) => {
  await open(page, 'dbt/by-hand-vs-with-dbt')
  const panel = page.getByTestId('hand-vs-dbt')
  const dialect = panel.getByRole('group', { name: 'Dialect' })
  await dialect.getByRole('button', { name: 'T-SQL procedure' }).click()
  await expect(panel.getByText(/HASHBYTES/).first()).toBeVisible()
  await page.reload()
  const reloaded = page.getByTestId('hand-vs-dbt')
  await expect(reloaded.getByRole('group', { name: 'Dialect' }).getByRole('button', { name: 'T-SQL procedure' })).toHaveAttribute('aria-pressed', 'true')
  await reloaded.getByRole('switch', { name: 'Add a column' }).click()
  const emailLine = reloaded.getByText(/c_email NVARCHAR\(200\)/).last()
  await expect(emailLine).toBeVisible()
  await expect(emailLine.locator('xpath=..')).toHaveClass(/bg-sky-500\/10/)
})

test('parity lab starts at zero and matching settings leave only the ambiguous delimiter rows', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'The one-screen check uses the specified 1280x800 desktop viewport.')
  await page.setViewportSize({ width: 1280, height: 800 })
  await openPagedSection(page, 'hash-parity/parity-lab', 'Parity lab')
  const lab = page.getByTestId('parity-lab')
  await expect(lab.getByRole('status')).toHaveText(/0 of \d+ rows match/)
  await lab.getByLabel('Input cast').selectOption('utf16le')
  await lab.getByLabel('Delimiter').selectOption(';')
  await lab.getByLabel('NULL as').selectOption('')
  await lab.getByLabel('Quote character').selectOption('')
  await expect(lab.getByRole('status')).toHaveText(/16 of \d+ rows match/)
  await expect(lab.getByRole('row', { name: /edge · \('a;b','c'\)/ })).toContainText('✗')
  await expect(lab.getByRole('row', { name: /edge · \('a','b;c'\)/ })).toContainText('✗')
  const header = lab.locator('table thead tr').first()
  const firstRow = lab.locator('table tbody tr').first()
  const headerBounds = await header.boundingBox()
  const rowBounds = await firstRow.boundingBox()
  expect(headerBounds).not.toBeNull()
  expect(rowBounds).not.toBeNull()
  expect(headerBounds!.y + headerBounds!.height).toBeLessThanOrEqual(800)
  expect(rowBounds!.y + rowBounds!.height).toBeLessThanOrEqual(800)
})

test('new chapters pass axe and fit 320px mobile width', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'Mobile accessibility and overflow check.')
  test.setTimeout(120_000)
  await page.setViewportSize({ width: 320, height: 700 })
  for (const slug of ['from-sql-server', 'hash-parity']) {
    await open(page, slug)
    const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze()
    expect(violations.map((violation) => violation.id)).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0)
  }
})

test('save requested legacy parity screenshots at desktop size', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Screenshots use the 1280x800 desktop viewport.')
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openPagedSection(page, 'dbt/by-hand-vs-with-dbt', 'By hand vs with dbt')
  const hand = page.getByTestId('hand-vs-dbt')
  const dialect = hand.getByRole('group', { name: 'Dialect' })
  await dialect.getByRole('button', { name: 'T-SQL procedure' }).click()
  await expect(dialect.getByRole('button', { name: 'T-SQL procedure' })).toHaveAttribute('aria-pressed', 'true')
  await expect(hand.getByText(/HASHBYTES/).first()).toBeVisible()
  await page.screenshot({ path: '/home/ubuntu/screenshots/legacy-by-hand-tsql.png', fullPage: false, animations: 'disabled' })

  const parityPage = await page.context().newPage()
  await parityPage.setViewportSize({ width: 1280, height: 800 })
  await parityPage.emulateMedia({ reducedMotion: 'reduce' })
  await openPagedSection(parityPage, 'hash-parity/parity-lab', 'Parity lab')
  const lab = parityPage.getByTestId('parity-lab')
  await lab.getByLabel('Input cast').selectOption('utf16le')
  await lab.getByLabel('Delimiter').selectOption(';')
  await lab.getByLabel('NULL as').selectOption('')
  await lab.getByLabel('Quote character').selectOption('')
  await expect(lab.getByRole('status')).toHaveText(/16 of \d+ rows match/)
  await parityPage.screenshot({ path: '/home/ubuntu/screenshots/legacy-parity-matching.png', fullPage: false, animations: 'disabled' })
  await parityPage.close()

  const keyMapPage = await page.context().newPage()
  await keyMapPage.setViewportSize({ width: 1280, height: 800 })
  await keyMapPage.emulateMedia({ reducedMotion: 'reduce' })
  await openPagedSection(keyMapPage, 'hash-parity/old-new-key-map-and-reconciliation', 'Old → new key map and reconciliation')
  await expect(keyMapPage.getByText(/sat_v1 rebuilds the end dates/i)).toBeVisible()
  await keyMapPage.screenshot({ path: '/home/ubuntu/screenshots/legacy-key-map.png', fullPage: false, animations: 'disabled' })
})
