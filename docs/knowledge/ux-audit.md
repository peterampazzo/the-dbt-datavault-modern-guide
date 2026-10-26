# Running a UX and accessibility audit

Run the audit before each UX-facing PR and after any layout or motion change.

## 1. Automated tests (Playwright + axe)

```bash
pnpm exec playwright install chromium   # once per machine
pnpm e2e                                # whole suite; builds and serves dist/ on :4173 itself
pnpm ux:check                           # only the audit + WCAG specs
BASE_URL=https://the-dbt-datavault-modern-guide.pages.dev pnpm ux:check   # against a deployed site
```

The suite lives in `e2e/` and runs in two projects, `desktop` (1280×800) and `mobile` (Pixel 7, touch). CI runs it on every PR and uploads `playwright-report/`.

| Spec | Checks | Rule / criterion |
|---|---|---|
| `audit.e2e.ts` | Each route at 320, 390 and 1280px: no horizontal overflow; nothing left below opacity 0.5 or stuck at `scale(0)` after scrolling through; no page or console errors. | S1, learning-design rule 1 |
| `audit.e2e.ts` | 5.5s after load, with and without reduced motion: no element still changing transform, opacity or size, and no infinite CSS/WAAPI animation. | S2, WCAG 2.2.2, 2.3.3 |
| `a11y.e2e.ts` | axe-core with WCAG 2.0/2.1/2.2 A and AA tags on every route, in dark and light themes. Any violation fails. | WCAG 2.2 AA |
| `keyboard.e2e.ts` | Tab reaches every control, each focused control shows an outline or ring, the PIT slider moves with the arrow keys, and timeline bars are focusable. | WCAG 2.1.1, 2.4.7, S7 |
| `orientation.e2e.ts` | Chapter header shows position, time and the 3-bullet summary; interactive state and the last section survive a reload; Home's Continue link returns to that section; the progress bar ticks a chapter at its end and Start over clears it. | S3, S4 |
| `chapters.e2e.ts` | The main interaction in each chapter works (steppers, terminal, hash lab, load player, timeline tap, lineage click), and the theme survives a reload. | Regression |

`oxlint` also runs the `jsx-a11y` plugin, so missing labels and similar problems fail at lint time.

Automated checks find only part of what WCAG covers (often quoted at 30–50%). The manual review below is still required.

## 2. Code checks

```bash
grep -rn "repeat: Infinity\|setInterval" src     # every hit needs a reader-started trigger or a pause (S2)
grep -rn "whileInView" src                        # must not start content hidden (rule 1)
grep -rn "animate-\(pulse\|spin\|bounce\|ping\)" src | grep -v motion-safe   # must be motion-safe (S2)
```

## 3. Manual review

Use the two reference skill sets as checklists. They are referenced here, not installed in this repo.

- **jakubkrehel/skills, `better-interface`** (with `better-layout`, `better-writing`, `better-ui`). Review the whole flow, including loading, empty and narrow states. Rank findings by user impact. Escalate to HIGH any of: a missing accessible name, a path that can't be used with the keyboard, an invisible focus state, ignored reduced motion, content clipped at 320px or 200% zoom, low contrast, meaning shown only by colour.
- **pbakaus/impeccable, `critique` and `craft-floor`.** This site is a *Read*-mode product, so comprehension and hierarchy outrank visual novelty. Check the cognitive-load items: one primary focus, groups of about 4 or fewer, progressive disclosure, no memory bridges, clear orientation. Then check the craft-floor bans.
- **Keyboard pass.** Tab through every chapter. Every interactive must be reachable, the focus must be visible, and arrow keys must work on steppers and sliders.
- **Interrupted-learner pass.** Open a chapter, use one interactive, reload, and check you land in the same place with the same state (S4).

## 4. Severity scale

| Severity | Meaning |
|---|---|
| HIGH | Content is unreachable or hidden, a WCAG A/AA failure, or motion that can't be stopped. Fix before merge. |
| MED | Hurts focus or comprehension (density, jargon, no orientation). Fix in the current UX phase. |
| LOW | Polish or craft-floor issues. |

## 5. Latest findings (2026-10)

| Sev | Finding | Status |
|---|---|---|
| HIGH | PIT "Drag the snapshot" section stayed invisible at 390px (`whileInView` never fired). | Fixed in PR #3 |
| HIGH | Satellite v0/v1 timeline bars stuck at `scaleX(0)` on phones (same `whileInView` cause); hover-only details. | Fixed in PR #3 (visible bars; tap or focus to inspect) |
| HIGH | No reduced-motion support. | Fixed in PR #3 |
| HIGH | Loops started on their own with no pause (Decomposition, architecture flow, terminal). | Fixed in PR #3 |
| MED | No progress, resume or time estimate. | Fixed in the orientation PR |
| MED | Ch1 (727 words) and Ch3 (662 words, 22 controls) are long for one sitting. | Paged reader: one section per page, "Show as one page" switch |
| MED | The load player shows about 11 controls at once. | Planned (progressive disclosure) |
| MED | Jargon used before it is defined (`ldts`, HWM, hashdiff). | Planned (glossary) |
| MED | No self-check. | Planned (quick checks) |
| HIGH | Clicking from Home into a chapter crashed the app (blank page). `useEffect(() => window.scrollTo(...))` returned the Promise newer Chrome gives back from `scrollTo`, so React called it as a clean-up. Found by the `chapters.e2e.ts` navigation test. | Fixed in the e2e PR |
| HIGH | axe WCAG 2.2 AA: unlabelled Hash lab inputs and PIT slider, icon-only Home link on phones, code and table scroll areas unreachable by keyboard, timeline bar names not matching their visible text, accent text (`*-400`, chip `*-200/300`) too faint in light theme, dimmed code lines and line numbers below 4.5:1. | Fixed in the e2e PR |
| MED | Lineage graph nodes had no visible focus and could not be selected from the keyboard; animated edges looped forever. | Fixed in the e2e PR (focus ring, Enter selects, edges static) |
| LOW | Eyebrow label, gradient text, `border-l-4` callouts, uppercase micro-labels; no `scroll-padding-top`. | Planned (polish) |
