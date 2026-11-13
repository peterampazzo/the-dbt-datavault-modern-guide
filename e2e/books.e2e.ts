import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

test('the bookshelf opens the Data Vault book, and the book links back', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('main h1')).toHaveText('Build it right')
  await page.getByRole('link', { name: /Open the book: Data Vault/ }).click()
  await expect(page).toHaveURL(/#\/datavault$/)
  await expect(page.locator('main h1').first()).toHaveText('Data Vault, modelled and built with dbt')
  await page.locator('main').getByRole('link', { name: 'All books' }).first().click()
  await expect(page.locator('main h1')).toHaveText('Build it right')
})

test('links from before the bookshelf open the same page in the Data Vault book', async ({ page }) => {
  await page.goto('/#/replay/recap')
  await expect(page).toHaveURL(/#\/datavault\/replay\/recap$/)
  await expect(page.locator('main h1').first()).toBeVisible()

  await page.goto('/#/hash-lab?s=hashdiff-did-anything-change')
  await expect(page).toHaveURL(/#\/datavault\/hash-lab\/hashdiff-did-anything-change$/)
})

test('an old link typed into an open tab is rewritten too', async ({ page }) => {
  await page.goto('/#/datavault/')
  await page.evaluate(() => (window.location.hash = '#/pit'))
  await expect(page).toHaveURL(/#\/datavault\/pit$/)
  await expect(page.locator('main h1').first()).toBeVisible()
})

test('the bookshelf opens Foundations, a book of its own', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /Open the book: Foundations/ }).click()
  await expect(page).toHaveURL(/#\/foundations$/)
  await expect(page.locator('main h1').first()).toHaveText('Shipping code in the age of AI tools')
  await expect(page.getByRole('banner').getByText('Foundations', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: /Start: Where am I\?/ }).click()
  await expect(page).toHaveURL(/#\/foundations\/where-am-i$/)
  await expect(page.getByText('Chapter 1 of 1 · Part 1: The terminal')).toBeVisible()
})

test('Foundations keeps its own progress, apart from the Data Vault book', async ({ page }) => {
  await page.goto('/#/foundations/where-am-i/recap')
  await expect(page.locator('main h1').first()).toBeVisible()
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('foundations-progress') ?? '{"done":[]}').done)).toContain('where-am-i')
  const dv = await page.evaluate(() => JSON.parse(localStorage.getItem('dv-guide-progress') ?? '{"done":[]}').done)
  expect(dv).not.toContain('where-am-i')

  await page.goto('/#/datavault/')
  await expect(page.locator('main h1').first()).toHaveText('Data Vault, modelled and built with dbt')
  await page.goto('/#/foundations/')
  await expect(page.getByRole('link', { name: /Where am I\?.*\(done\)/ })).toBeVisible()
})

test('the Foundations practice terminal runs commands in the browser', async ({ page }) => {
  await page.goto('/#/foundations/where-am-i/the-prompt')
  const terminal = page.getByRole('textbox').first()
  await terminal.fill('pwd')
  await terminal.press('Enter')
  await expect(page.getByText('/home/student/orders-report', { exact: true }).first()).toBeVisible()
})

for (const path of ['/#/foundations/', '/#/foundations/where-am-i/the-prompt']) {
  for (const theme of ['dark', 'light'] as const) {
    test(`${path} passes WCAG 2.2 AA (${theme})`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('theme', t), theme)
      await page.goto(path)
      await expect(page.locator('main').getByRole('heading').first()).toBeVisible()
      const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze()
      expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([])
    })
  }
}

for (const width of [320, 390, 1280]) {
  for (const path of ['/#/foundations/', '/#/foundations/where-am-i/move-around']) {
    test(`${path} has no horizontal overflow @${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 700 })
      await page.goto(path)
      await expect(page.locator('main').getByRole('heading').first()).toBeVisible()
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow).toBeLessThanOrEqual(0)
    })
  }
}

for (const theme of ['dark', 'light'] as const) {
  test(`the bookshelf passes WCAG 2.2 AA (${theme})`, async ({ page }) => {
    await page.addInitScript((t) => localStorage.setItem('theme', t), theme)
    await page.goto('/')
    await expect(page.locator('main h1')).toBeVisible()
    const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze()
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([])
  })
}

for (const width of [320, 390, 1280]) {
  test(`the bookshelf has no horizontal overflow @${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 700 })
    await page.goto('/')
    await expect(page.locator('main h1')).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })
}
