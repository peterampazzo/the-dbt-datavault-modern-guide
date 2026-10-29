import { expect, type Page } from '@playwright/test'

export const ROUTES = [
  { slug: '', title: 'Home' },
  { slug: 'what-is-data-vault', title: 'What is Data Vault' },
  { slug: 'modelling', title: 'Modelling three datasets' },
  { slug: 'dv-names', title: "Data Vault in this guide's names" },
  { slug: 'dbt-primer', title: 'dbt primer' },
  { slug: 'dbt', title: 'Building it with dbt' },
  { slug: 'hash-lab', title: 'Hash lab' },
  { slug: 'load-player', title: 'Loading, batch by batch' },
  { slug: 'satellite-flavours', title: 'Satellite flavours' },
  { slug: 'pit', title: 'Business vault: snapshots and PITs' },
  { slug: 'dbt-project', title: 'The whole dbt project' },
  { slug: 'replay', title: 'Replay: one history, two shapes' },
  { slug: 'one-lake', title: 'One lake, any engine' },
  { slug: 'modern-way', title: 'Working the modern way' },
  { slug: 'scheduling', title: 'Running dbt on a schedule' },
  { slug: 'from-sql-server', title: 'From a hand-written SQL Server vault' },
  { slug: 'hash-parity', title: 'Hash parity and restoring history' },
  { slug: 'business-vault', title: 'The modern business vault' },
  { slug: 'migration-checklist', title: 'Migration checklist' },
] as const

/** Opens a route, by default as one long page so every section is on screen. */
export async function open(page: Page, slug: string, { paged = false } = {}) {
  await page.addInitScript((m) => localStorage.setItem('reading-mode', m), paged ? 'paged' : 'scroll')
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  await page.goto(`/#/${slug}`)
  await expect(page.locator('main h1').first()).toBeVisible()
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
