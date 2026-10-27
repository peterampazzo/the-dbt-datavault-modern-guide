import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

async function openLab(page: import('@playwright/test').Page, suffix = 'the-replay-lab') {
  await page.addInitScript(() => localStorage.setItem('reading-mode', 'paged'))
  await page.goto(`/#/replay/${suffix}`)
  await expect(page.getByRole('heading', { name: suffix === 'the-replay-lab' ? 'The replay lab' : 'What truncated landing loses' })).toBeVisible()
}

test('the replay lab starts with the current model and four primary controls', async ({ page }) => {
  await openLab(page)
  const controls = page.getByRole('group', { name: 'Replay lab controls' })
  await expect(controls.getByRole('switch', { name: 'Landing data' })).toHaveAttribute('aria-checked', 'false')
  await expect(controls.getByLabel('Model change')).toHaveValue('none')
  await expect(controls.getByRole('button', { name: 'Run dbt build --full-refresh' })).toBeVisible()
  await expect(controls.getByRole('button', { name: 'Reset' })).toBeVisible()
  await expect(page.getByRole('status')).toContainText('current model rebuild matches')
  await expect(controls.getByRole('switch')).toHaveCount(1)
  await expect(controls.getByRole('combobox')).toHaveCount(1)
  await expect(controls.getByRole('button')).toHaveCount(2)
})

test('persistent staging matches after a full refresh', async ({ page }) => {
  await openLab(page)
  await page.getByRole('switch', { name: 'Landing data' }).click()
  await page.getByRole('button', { name: 'Run dbt build --full-refresh' }).click()
  await expect(page.getByRole('status')).toHaveText('Persistent staging: the rebuild matches. Nothing lost.')
})

test('truncated landing plus a full refresh labels missing rows', async ({ page }) => {
  await openLab(page)
  await page.getByRole('button', { name: 'Run dbt build --full-refresh' }).click()
  await expect(page.getByRole('status')).toContainText('7 customer satellite versions missing')
  await expect(page.getByText('Missing row').first()).toBeVisible()
  await expect(page.getByText('Missing', { exact: true }).first()).toBeVisible()
})

test('the email and cast-fix presets show missing and wrong cells', async ({ page }) => {
  await openLab(page)
  const change = page.getByLabel('Model change')
  await change.selectOption('new-column')
  await expect(page.getByRole('status')).toContainText('1 customer satellite version missing')
  await expect(page.getByText('Missing in rebuilt').first()).toBeVisible()
  await change.selectOption('cast-fix')
  await expect(page.getByRole('status')).toContainText('6 wrong cells')
  await expect(page.getByText('Wrong').first()).toBeVisible()
})

test('Reset restores the default state and loss-table preset links select their model change', async ({ page }) => {
  await openLab(page)
  await page.getByRole('button', { name: 'Run dbt build --full-refresh' }).click()
  await page.getByRole('button', { name: 'Reset' }).click()
  await expect(page.getByLabel('Model change')).toHaveValue('none')
  await expect(page.getByRole('switch', { name: 'Landing data' })).toHaveAttribute('aria-checked', 'false')
  await expect(page.getByRole('status')).toContainText('current model rebuild matches')

  await page.goto('/#/replay/what-truncated-landing-loses')
  await page.getByRole('link', { name: 'Try new-column preset' }).click()
  await expect(page).toHaveURL(/change=new-column/)
  await expect(page.getByLabel('Model change')).toHaveValue('new-column')
})

test('the four replay controls work from the keyboard', async ({ page }) => {
  await openLab(page)
  const persistent = page.getByRole('switch', { name: 'Landing data' })
  await persistent.focus()
  await page.keyboard.press('Space')
  await expect(persistent).toHaveAttribute('aria-checked', 'true')

  const change = page.getByLabel('Model change')
  await change.focus()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(change).toHaveValue('new-column')

  const run = page.getByRole('button', { name: 'Run dbt build --full-refresh' })
  await run.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('status')).toContainText('Persistent staging: the rebuild matches')

  const reset = page.getByRole('button', { name: 'Reset' })
  await reset.focus()
  await page.keyboard.press('Enter')
  await expect(change).toHaveValue('none')
  await expect(persistent).toHaveAttribute('aria-checked', 'false')
})

test('the engine switch changes compute and connection while storage stays put', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('reading-mode', 'paged'))
  await page.goto('/#/one-lake/switch-engines')
  await expect(page.getByText('Storage unchanged. Fabric Spark uses OneLake shortcut.')).toBeVisible()
  await page.getByRole('button', { name: 'Databricks' }).click()
  await expect(page.getByText('Storage unchanged. Databricks uses Unity Catalog external location.')).toBeVisible()
  await expect(page.getByText('ADLS Gen2')).toBeVisible()
  await expect(page.getByText('dbt-databricks')).toBeVisible()
})

test('new chapter covers, content pages and recaps pass axe and mobile overflow in both reading modes', async ({ page }) => {
  test.setTimeout(60_000)
  const surfaces = [
    { chapter: 'replay', route: 'replay', title: 'Replay: one history, two shapes' },
    { chapter: 'replay', route: 'replay/the-replay-lab', id: 'the-replay-lab', title: 'The replay lab' },
    { chapter: 'replay', route: 'replay/what-truncated-landing-loses', id: 'what-truncated-landing-loses', title: 'What truncated landing loses' },
    { chapter: 'replay', route: 'replay/two-histories-one-record', id: 'two-histories-one-record', title: 'Two histories, one record' },
    { chapter: 'replay', route: 'replay/prove-it', id: 'prove-it', title: 'Prove it' },
    { chapter: 'replay', route: 'replay/until-you-re-replay-safe', id: 'until-you-re-replay-safe', title: 'Until you’re replay-safe' },
    { chapter: 'replay', route: 'replay/recap', id: 'chapter-recap', title: 'Recap' },
    { chapter: 'one-lake', route: 'one-lake', title: 'One lake, any engine' },
    { chapter: 'one-lake', route: 'one-lake/switch-engines', id: 'switch-engines', title: 'Switch engines' },
    { chapter: 'one-lake', route: 'one-lake/storage-vs-compute', id: 'storage-vs-compute', title: 'Storage vs compute' },
    { chapter: 'one-lake', route: 'one-lake/the-layers', id: 'the-layers', title: 'The layers' },
    { chapter: 'one-lake', route: 'one-lake/what-moves-what-s-rebuilt', id: 'what-moves-what-s-rebuilt', title: 'What moves, what’s rebuilt' },
    { chapter: 'one-lake', route: 'one-lake/keep-it-portable', id: 'keep-it-portable', title: 'Keep it portable' },
    { chapter: 'one-lake', route: 'one-lake/recap', id: 'chapter-recap', title: 'Recap' },
  ]

  for (const mode of ['paged', 'scroll'] as const) {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.evaluate((value) => localStorage.setItem('reading-mode', value), mode)
    await page.reload()
    for (const surface of surfaces) {
      await page.goto(`/#/${mode === 'paged' ? surface.route : surface.chapter}`)
      const target = surface.id ? page.locator(`#${surface.id}`) : page.locator('main')
      if (surface.id && mode === 'scroll') await target.scrollIntoViewIfNeeded()
      await expect(page.getByRole('heading', { name: surface.title }).first()).toBeVisible()
      await page.waitForTimeout(250)
      const axe = new AxeBuilder({ page }).withTags(WCAG)
      if (mode === 'scroll' && surface.id) {
        axe.include(surface.id === 'chapter-recap' ? '#chapter-recap' : `section:has(> h2#${surface.id})`)
      }
      const { violations } = await axe.analyze()
      const summary = violations.map((violation) => `${violation.id}: ${violation.nodes.map((node) => `${node.target.join(' ')} ${node.html} ${node.failureSummary}`).join(' | ')}`)
      expect(summary).toEqual([])
      const overflow = await page.evaluate(() => {
        const nav = document.querySelector('header nav')
        const parent = nav?.parentElement
        const details = (element: Element | null) => {
          if (!element) return null
          const rect = element.getBoundingClientRect()
          const style = getComputedStyle(element)
          return {
            tag: element.tagName,
            className: element.className,
            rect: { left: rect.left, right: rect.right, width: rect.width },
            scrollWidth: (element as HTMLElement).scrollWidth,
            clientWidth: (element as HTMLElement).clientWidth,
            overflowX: style.overflowX,
            minWidth: style.minWidth,
            width: style.width,
          }
        }
        return {
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          nav: details(nav),
          parent: details(parent),
          elements: [...document.body.querySelectorAll<HTMLElement>('*')]
            .map((element) => {
              const rect = element.getBoundingClientRect()
              return { tag: element.tagName, className: element.className, text: element.textContent?.trim().slice(0, 60) ?? '', right: rect.right }
            })
            .filter((element) => element.right > window.innerWidth + 1)
            .sort((a, b) => b.right - a.right)
            .slice(0, 8),
        }
      })
      expect(overflow.scrollWidth - overflow.clientWidth, JSON.stringify(overflow)).toBeLessThanOrEqual(0)
    }
  }
})
