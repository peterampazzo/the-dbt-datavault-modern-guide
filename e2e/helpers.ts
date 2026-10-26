import { expect, type Page } from '@playwright/test'

export const ROUTES = [
  { slug: '', title: 'Home' },
  { slug: 'what-is-data-vault', title: 'What is Data Vault' },
  { slug: 'modelling', title: 'Modelling three datasets' },
  { slug: 'dbt', title: 'Building it with dbt' },
  { slug: 'hash-lab', title: 'Hash lab' },
  { slug: 'load-player', title: 'Loading, batch by batch' },
  { slug: 'satellite-flavours', title: 'Satellite flavours' },
  { slug: 'pit', title: 'Business vault: snapshots and PITs' },
  { slug: 'dbt-project', title: 'The whole dbt project' },
] as const

/** Opens a route, waits for its heading and collects page and console errors. */
export async function open(page: Page, slug: string) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  await page.goto(`/#/${slug}`)
  await expect(page.locator('main h1')).toBeVisible()
  return errors
}

export async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 300) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 40))
    }
    window.scrollTo(0, 0)
  })
}
