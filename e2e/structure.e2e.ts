import { expect, test } from '@playwright/test'
import { ROUTES } from './helpers'

test('Start here remembers the practitioner path and updates next links and sidebar', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Sidebar groups are a desktop surface.')
  await page.goto('/#/')
  const practitioner = page.getByRole('button', { name: 'I know Data Vault, new to dbt' })
  await page.getByRole('link', { name: 'Start this path: I know Data Vault, new to dbt' }).click()
  await expect(page).toHaveURL(/#\/dv-names$/)
  await expect.poll(() => page.evaluate(() => localStorage.getItem('reading-path'))).toBe('dv-practitioner')
  await page.goto('/#/')
  await expect(practitioner).toHaveAttribute('aria-pressed', 'true')
  await page.reload()
  await expect(page.getByRole('button', { name: 'I know Data Vault, new to dbt' })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('link', { name: 'Start this path: I know Data Vault, new to dbt' }).click()

  await expect(page.getByText(/Chapter 3 of 15/)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Part 1: The method' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Part 2: Building it with dbt' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Part 3: Going further' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Part 4: Running it for real' })).toBeVisible()
  const sidebar = page.locator('aside')
  const refresher = sidebar.getByRole('link', { name: /What is Data Vault.*refresher/ })
  await expect(refresher).toHaveClass(/text-muted-foreground/)
  await expect(refresher).not.toHaveClass(/opacity-/)
  await expect(sidebar.getByRole('link', { name: /Hash lab.*refresher/ })).toBeVisible()

  await page.goto('/#/dv-names/recap')
  await expect(page.locator('#chapter-recap').getByRole('link', { name: 'Next chapter: dbt primer' })).toBeVisible()
  await page.goto('/#/dbt-primer/recap')
  await expect(page.locator('#chapter-recap').getByRole('link', { name: 'Next chapter: Building it with dbt' })).toBeVisible()
  await page.goto('/#/dbt/recap')
  await expect(page.locator('#chapter-recap').getByRole('link', { name: 'Next chapter: Loading, batch by batch' })).toBeVisible()
  await page.goto('/#/hash-lab')
  await expect(page.getByRole('navigation', { name: 'Pages' }).getByRole('link', { name: /Building it with dbt/ })).toBeVisible()
  await page.goto('/#/hash-lab/recap')
  await expect(page.locator('#chapter-recap').getByRole('link', { name: 'Next chapter: Loading, batch by batch' })).toBeVisible()
  await page.goto('/#/load-player/recap')
  await expect(page.locator('#chapter-recap').getByRole('link', { name: 'Next chapter: Replay: one history, two shapes' })).toBeVisible()
  await page.goto('/#/replay/recap')
  await expect(page.locator('#chapter-recap').getByRole('link', { name: 'Next chapter: One lake, any engine' })).toBeVisible()
  await page.goto('/#/one-lake/recap')
  await expect(page.locator('#chapter-recap').getByRole('link', { name: 'Next chapter: Working the modern way' })).toBeVisible()
  await page.goto('/#/modern-way/recap')
  await expect(page.locator('#chapter-recap').getByRole('link', { name: 'Next chapter: From a hand-written SQL Server vault' })).toBeVisible()
  await page.goto('/#/from-sql-server/recap')
  await expect(page.locator('#chapter-recap').getByRole('link', { name: 'Next chapter: Hash parity and restoring history' })).toBeVisible()
  await page.goto('/#/dv-names/the-names-we-use')
  await expect(page.getByRole('link', { name: 'dbt primer', exact: true })).toBeVisible()
})

test('every paged chapter surface stays within the 1200px height target at 1280×800', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Height audit runs at its specified desktop viewport.')
  test.setTimeout(90_000)
  await page.setViewportSize({ width: 1280, height: 800 })

  // Only a standalone interactive that cannot fit may be listed here, with its measured height and rationale.
  const PAGE_HEIGHT_EXCEPTIONS = new Set<string>([])
  const measurements: string[] = []
  const overflows: string[] = []

  for (const route of ROUTES.slice(1)) {
    await page.addInitScript(() => localStorage.setItem('reading-mode', 'paged'))
    await page.goto(`/#/${route.slug}`)
    await expect(page.locator('main h1').first()).toBeVisible()
    const pageLinks = page.locator('main article nav[aria-label="Pages"] ol a')
    const count = await pageLinks.count()
    for (let index = 0; index < count; index += 1) {
      const link = pageLinks.nth(index)
      const label = await link.getAttribute('aria-label')
      await link.click()
      await page.waitForTimeout(120)
      const height = await page.locator('main article > div').first().evaluate((element) => element.scrollHeight)
      const key = `${route.slug}:${label}`
      measurements.push(`${key} ${height}px`)
      if (!PAGE_HEIGHT_EXCEPTIONS.has(key) && height > 1200) overflows.push(`${key} ${height}px`)
    }
  }
  console.log(`1280×800 page heights:\n${measurements.join('\n')}`)
  expect(overflows, `Paged content over 1200px:\n${overflows.join('\n')}`).toEqual([])
})
