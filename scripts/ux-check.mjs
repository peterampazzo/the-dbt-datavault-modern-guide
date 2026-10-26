// Scans every route for horizontal overflow, content left hidden after load, and page errors.
// Usage: pnpm ux:check   (env: BASE_URL, CHROME_PATH or CDP_URL)
import { chromium } from 'playwright-core'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173'
const ROUTES = ['', 'what-is-data-vault', 'modelling', 'dbt', 'hash-lab', 'load-player', 'satellite-flavours', 'pit', 'dbt-project']
const RUNS = [
  { width: 320, height: 640, reducedMotion: 'no-preference' },
  { width: 390, height: 600, reducedMotion: 'no-preference' },
  { width: 1280, height: 800, reducedMotion: 'reduce' },
]

const browser = process.env.CDP_URL
  ? await chromium.connectOverCDP(process.env.CDP_URL)
  : await chromium.launch({ executablePath: process.env.CHROME_PATH })

let failures = 0
for (const { width, height, reducedMotion } of RUNS) {
  const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  for (const route of ROUTES) {
    await page.goto(`${BASE_URL}/#/${route}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    const r = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      hidden: [...document.querySelectorAll('main section, main h2, main p, main li')]
        .filter((e) => parseFloat(getComputedStyle(e).opacity) < 0.5)
        .map((e) => e.textContent?.trim().slice(0, 40)),
    }))
    const ok = r.overflow <= 0 && r.hidden.length === 0 && errors.length === 0
    if (!ok) failures++
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${width}px ${reducedMotion.padEnd(13)} #/${route}`, ok ? '' : JSON.stringify({ ...r, errors }))
    errors.length = 0
  }
  await ctx.close()
}
await browser.close()
process.exit(failures ? 1 : 0)
