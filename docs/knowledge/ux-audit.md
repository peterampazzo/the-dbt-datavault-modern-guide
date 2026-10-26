# Running a UX and accessibility audit

Run the audit before each UX-facing PR and after any layout or motion change.

## 1. Automated scan

```bash
pnpm dev --host 0.0.0.0 --port 5173   # in one shell
pnpm ux:check                         # in another (needs a Chromium; see below)
```

`scripts/ux-check.mjs` visits every route at 320px, 390px and 1280px. It runs once with `reducedMotion: 'reduce'` and once without. On each route it reports:

- horizontal overflow (`scrollWidth > clientWidth`): breaks S1;
- elements that are still `opacity < 0.5` after load, without scrolling: breaks S1;
- page errors: always a failure.

It exits with code 1 on any failure.

Browser: set `CHROME_PATH` to a Chrome/Chromium binary, or `CDP_URL` to connect to a running browser (e.g. `http://localhost:9222`). Set `BASE_URL` to audit a deployed build (default `http://localhost:5173`).

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

## 5. Latest findings (2026-10, before the ADHD pass)

| Sev | Finding | Status |
|---|---|---|
| HIGH | PIT "Drag the snapshot" section stayed invisible at 390px (`whileInView` never fired). | Fixed in PR #3 |
| HIGH | Satellite v0/v1 timeline bars stuck at `scaleX(0)` on phones (same `whileInView` cause); hover-only details. | Fixed in PR #3 (visible bars; tap or focus to inspect) |
| HIGH | No reduced-motion support. | Fixed in PR #3 |
| HIGH | Loops started on their own with no pause (Decomposition, architecture flow, terminal). | Fixed in PR #3 |
| MED | No progress, resume or time estimate. | Planned (orientation and resume) |
| MED | Ch1 (727 words) and Ch3 (662 words, 22 controls) are long for one sitting. | Planned (less at once, Focus mode) |
| MED | The load player shows about 11 controls at once. | Planned (progressive disclosure) |
| MED | Jargon used before it is defined (`ldts`, HWM, hashdiff). | Planned (glossary) |
| MED | No self-check. | Planned (quick checks) |
| LOW | Eyebrow label, gradient text, `border-l-4` callouts, uppercase micro-labels; no `scroll-padding-top`. | Planned (polish) |
