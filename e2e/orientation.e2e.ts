import { expect, test } from '@playwright/test'
import { open } from './helpers'

const stored = (page: import('@playwright/test').Page) => page.evaluate(() => localStorage.getItem('dv-guide-progress') ?? '')

test('chapter header shows position, time and the 30-second summary', async ({ page }) => {
  await open(page, 'hash-lab')
  await expect(page.getByText(/Chapter 6 of 17 · Part 2: Building it with dbt · about \d+ min/)).toBeVisible()
  await expect(page.getByRole('region', { name: 'In 30 seconds' }).getByRole('listitem')).toHaveCount(3)
})

test('interactive state survives a reload', async ({ page }) => {
  await open(page, 'pit')
  const slider = page.getByRole('slider', { name: 'Snapshot date' })
  const before = await slider.getAttribute('aria-valuenow')
  await slider.focus()
  await page.keyboard.press(before === '0' ? 'ArrowRight' : 'ArrowLeft')
  const after = await slider.getAttribute('aria-valuenow')
  expect(after).not.toBe(before)
  await page.reload()
  await expect(page.getByRole('slider', { name: 'Snapshot date' })).toHaveAttribute('aria-valuenow', after!)
})

test('Home offers to continue where you left off, at the same section', async ({ page }) => {
  await open(page, 'what-is-data-vault')
  await page.locator('#where-it-sits').evaluate((el) => el.scrollIntoView({ block: 'start' }))
  await expect.poll(() => stored(page)).toContain('where-it-sits')
  await page.goto('/#/')
  const cont = page.getByRole('link', { name: /Continue: What is Data Vault, .*Where it sits/ })
  await expect(cont).toBeVisible()
  await cont.click()
  await expect(page.locator('#where-it-sits')).toBeInViewport()
})

test('a chapter is ticked once you reach its end, and Start over clears it', async ({ page }) => {
  await open(page, 'load-player')
  const bar = page.getByRole('progressbar', { name: 'Chapters done' })
  await expect(bar).toHaveAttribute('aria-valuenow', '0')
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await expect(bar).toHaveAttribute('aria-valuenow', '1')
  await page.goto('/#/')
  await page.getByRole('button', { name: 'Start over' }).click()
  await expect(bar).toHaveAttribute('aria-valuenow', '0')
  await expect(page.getByRole('link', { name: /Start reading/ })).toBeVisible()
})
