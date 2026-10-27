import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { open } from './helpers'

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

test('Term definitions open by keyboard and close with Escape', async ({ page }) => {
  await open(page, 'what-is-data-vault')
  const trigger = page.getByRole('button', { name: 'hubs', exact: true }).first()
  await trigger.focus()
  await page.keyboard.press('Enter')
  const popup = page.getByRole('dialog')
  await expect(popup).toContainText('A hub stores one row for each distinct business key')
  await expect(popup.getByRole('link', { name: /Read more/ })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(popup).not.toBeVisible()
})

test('glossary filtering narrows terms and About renders its sources and versions', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Browse the glossary' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'About this guide' }).first()).toBeVisible()
  await page.goto('/#/glossary')
  const filter = page.getByRole('searchbox', { name: 'Filter terms' })
  await filter.fill('precedence')
  await expect(page.locator('#precedence')).toBeVisible()
  await expect(page.locator('#hub')).toHaveCount(0)
  await page.goto('/#/about')
  await expect(page.getByRole('heading', { name: 'About this guide' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Sources' })).toBeVisible()
  await expect(page.getByText(/dbt-core: 1\.11\.16/)).toBeVisible()
  await expect(page.getByText(/dbt-duckdb: 1\.11\.0/)).toBeVisible()
})

test('About and Glossary pass axe and fit a 320px viewport', async ({ page }, info) => {
  test.setTimeout(90_000)
  const width = info.project.name === 'mobile' ? 320 : 1280
  await page.setViewportSize({ width, height: 800 })
  for (const [path, heading] of [['about', 'About this guide'], ['glossary', 'Glossary']] as const) {
    await page.goto(`/#/${path}`)
    await expect(page.getByRole('heading', { name: heading })).toBeVisible()
    const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze()
    expect(violations.map((violation) => violation.id)).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0)
  }
})
