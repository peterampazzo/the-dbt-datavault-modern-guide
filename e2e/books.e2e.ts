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
  await expect(page.getByText('Chapter 1 of 3 · Part 1: The terminal')).toBeVisible()
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

test('Running a program: exit codes, && and the approval exercise', async ({ page }) => {
  await page.goto('/#/foundations/running-a-program/did-it-work')
  const terminal = page.getByRole('textbox').first()
  for (const line of ['python3 nope.py', 'echo $?']) {
    await terminal.fill(line)
    await terminal.press('Enter')
  }
  await expect(page.locator('pre').getByText('2', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Done: Run something that fails, then print its exit code.')).toBeAttached()

  await page.goto('/#/foundations/running-a-program/approve-or-not')
  await page.getByRole('group', { name: 'Your call on rm -rf data' }).getByRole('button', { name: 'Look closer first' }).click()
  await expect(page.getByText('Good call.')).toBeVisible()
  await page.getByRole('group', { name: 'Your call on python3 -m pytest tests' }).getByRole('button', { name: 'Look closer first' }).click()
  await expect(page.getByText('This one is fine to run.')).toBeVisible()
})

test('Snapshots: commit, then read what the AI tool changed', async ({ page }) => {
  await page.goto('/#/foundations/snapshots/take-a-snapshot')
  const terminal = page.getByRole('textbox').first()
  for (const line of ['git add .', 'git commit -m "Add the orders report"']) {
    await terminal.fill(line)
    await terminal.press('Enter')
  }
  await expect(page.locator('[data-git-panel]').getByRole('region', { name: 'History' }).getByText('Add the orders report')).toBeVisible()
  await expect(page.getByText('Done: Take the snapshot, with a message.')).toBeAttached()

  await page.goto('/#/foundations/snapshots/what-did-the-tool-change')
  await page.getByRole('button', { name: /Ask your AI tool/ }).click()
  await expect(page.getByRole('region', { name: 'Your folder' }).getByText('report.py')).toBeVisible()
  await page.getByRole('textbox').first().fill('git diff')
  await page.getByRole('textbox').first().press('Enter')
  await expect(page.getByRole('log').getByText('+    totals[nation] = (count + 1, revenue + round(float(order["o_totalprice"])))')).toBeVisible()
  await expect(page.getByText('Done: Show the changed lines and find the one you did not ask for.')).toBeAttached()
})

for (const path of ['/#/foundations/', '/#/foundations/where-am-i/the-prompt', '/#/foundations/snapshots/any-text-file', '/#/foundations/snapshots/what-did-the-tool-change', '/#/foundations/running-a-program/press-enter', '/#/foundations/running-a-program/approve-or-not']) {
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
  for (const path of ['/#/foundations/', '/#/foundations/where-am-i/move-around', '/#/foundations/running-a-program/press-enter', '/#/foundations/snapshots/any-text-file', '/#/foundations/snapshots/what-did-the-tool-change']) {
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
