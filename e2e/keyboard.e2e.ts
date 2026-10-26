import { expect, test } from '@playwright/test'
import { open, ROUTES } from './helpers'

test.describe('keyboard', () => {
  for (const r of ROUTES) {
    test(`${r.title}: every control is reachable with Tab and shows focus`, async ({ page }, info) => {
      test.skip(info.project.name === 'mobile', 'keyboard pass runs on desktop')
      await open(page, r.slug)
      const expected = await page.evaluate(
        () =>
          [...document.querySelectorAll<HTMLElement>('main a[href], main button:not(:disabled), main input:not(:disabled), main [role="slider"], main [role="switch"], main [role="tab"][aria-selected="true"]')].filter(
            (e) => e.getClientRects().length && e.tabIndex >= 0 && !e.closest('.react-flow__controls'),
          ).length,
      )
      const seen = new Set<string>()
      const noRing: string[] = []
      for (let i = 0; i < expected + 40; i++) {
        await page.keyboard.press('Tab')
        const f = await page.evaluate(() => {
          const e = document.activeElement as HTMLElement | null
          if (!e || !e.closest('main')) return null
          const s = getComputedStyle(e)
          const ring = (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || s.boxShadow !== 'none'
          const r = e.getBoundingClientRect()
          return { id: `${e.tagName}:${Math.round(r.x + scrollX)},${Math.round(r.y + scrollY)}:${e.textContent?.slice(0, 20)}`, ring, label: `${e.tagName} "${(e.getAttribute('aria-label') ?? e.textContent ?? '').trim().slice(0, 30)}"` }
        })
        if (!f) continue
        if (seen.has(f.id)) continue
        seen.add(f.id)
        if (!f.ring) noRing.push(f.label)
      }
      expect(noRing, 'focused without a visible focus indicator').toEqual([])
      expect(seen.size).toBeGreaterThanOrEqual(expected)
    })
  }

  test('PIT slider moves with arrow keys', async ({ page }) => {
    await open(page, 'pit')
    const sdts = page.getByText(/^sdts = /)
    const before = await sdts.textContent()
    await page.getByRole('slider').focus()
    await page.keyboard.press('ArrowRight')
    await expect(sdts).not.toHaveText(before ?? '')
  })

  test('satellite timeline bars are focusable and describe their interval', async ({ page }) => {
    await open(page, 'satellite-flavours')
    const bar = page.getByRole('button', { name: /Bruno, valid from 2024-01-02/ })
    await bar.focus()
    await expect(page.getByText(/ldts 2024-01-02/)).toBeVisible()
  })
})

test('lineage: Enter on a focused node selects it', async ({ page }) => {
  await open(page, 'dbt-project')
  await page.locator('.react-flow__node', { hasText: 'customer_pit' }).first().focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('main .font-mono.text-lg')).toHaveText('customer_pit')
})
