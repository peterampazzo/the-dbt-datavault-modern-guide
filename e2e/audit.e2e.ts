import { expect, test } from '@playwright/test'
import { open, ROUTES, scrollThrough } from './helpers'

// Learning-design checks from docs/knowledge/learning-design.md (S1, S2).
test.describe('layout and visibility', () => {
  for (const width of [320, 390, 1280]) {
    for (const r of ROUTES) {
      test(`${r.title} @${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 700 })
        const errors = await open(page, r.slug)
        await scrollThrough(page)
        await page.waitForTimeout(1200)
        const res = await page.evaluate(() => {
          const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth
          const hidden = [...document.querySelectorAll<HTMLElement>('main section, main h1, main h2, main p, main li, main button')]
            .filter((e) => e.getClientRects().length && parseFloat(getComputedStyle(e).opacity) < 0.5 && !e.closest('[aria-hidden="true"], :disabled, .react-flow'))
            .map((e) => `${e.tagName} "${e.textContent?.trim().slice(0, 40)}"`)
          const collapsed = [...document.querySelectorAll<HTMLElement>('main *')]
            .filter((e) => /^matrix\(0, 0, 0, 1|^matrix\(1, 0, 0, 0/.test(getComputedStyle(e).transform))
            .map((e) => `${e.tagName} "${e.textContent?.trim().slice(0, 40)}"`)
          return { overflow, hidden, collapsed }
        })
        expect(res.overflow, 'horizontal overflow (px)').toBeLessThanOrEqual(0)
        expect(res.hidden, 'content left invisible').toEqual([])
        expect(res.collapsed, 'elements stuck at scale 0').toEqual([])
        expect(errors).toEqual([])
      })
    }
  }
})

// WCAG 2.2.2: nothing that starts by itself may keep moving for more than 5 s.
test.describe('no unprompted motion after 5s', () => {
  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    for (const r of ROUTES) {
      test(`${r.title} (${reducedMotion})`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion })
        await open(page, r.slug)
        await page.waitForTimeout(5500)
        const snap = () =>
          page.evaluate(() =>
            [...document.querySelectorAll<HTMLElement>('main *')].map((e) => {
              const s = getComputedStyle(e)
              return `${s.transform}|${s.opacity}|${s.left}|${s.width}`
            }),
          )
        const a = await snap()
        await page.waitForTimeout(700)
        const b = await snap()
        const moving = a.filter((v, i) => v !== b[i]).length
        expect(moving, 'elements still animating').toBe(0)
        const infinite = await page.evaluate(
          () => document.getAnimations().filter((x) => x.playState === 'running' && x.effect?.getTiming().iterations === Infinity).length,
        )
        expect(infinite, 'infinite CSS/WAAPI animations').toBe(0)
      })
    }
  }
})
