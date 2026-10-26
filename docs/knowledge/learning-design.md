# Learning design rules

How this guide stays usable for people who learn with an interrupted or variable attention span (ADHD especially). These rules help every reader: segmenting and clear orientation benefit all learners, not only those with ADHD. Sources are listed in `sources.md` (section "Learning design and accessibility").

## Who we design for

- **Interrupted learner (primary).** Has ADHD. Reads in 10–15 minute windows and gets pulled away mid-chapter. Motion draws them in, but motion that never stops tires them.
- **Distracted mobile user.** On a phone, one hand, comes back later.
- **Confused first-timer.** Has never heard of a hashkey.

## Success criteria (every change must keep these true)

| # | Criterion | Checked by |
|---|---|---|
| S1 | No content is hidden, clipped or unreachable at 320px, 390px or 1280px, or at 200% zoom. | `pnpm ux:check` (overflow and hidden-element scan) |
| S2 | Nothing moves for more than 5s on its own without a pause control. Movement is removed under `prefers-reduced-motion`. | `pnpm ux:check` (reduced-motion run) plus a grep for `repeat: Infinity` / `setInterval` |
| S3 | Above the fold, each chapter says what you'll learn, how long it takes, and where you are in the guide. | Visual check |
| S4 | Leaving and coming back restores the chapter, the section and the state of each interactive. | Reload test |
| S5 | No decision point shows more than about 4 primary controls; advanced options are tucked away. | Manual count |
| S6 | Each chapter ends with an optional self-check that gives instant feedback. It never blocks progress. | Unit test plus visual check |
| S7 | Lint, test and build pass, and every interactive works with the keyboard alone. | CI plus a manual keyboard pass |

## Rules

Each rule gives Do, Don't, Why and Source.

1. **Content is visible by default.**
   - Do: render content visible, and animate only after it is on screen.
   - Don't: use `initial={{ opacity: 0 }}` with `whileInView` for prose, sections or cards. On short viewports the reveal can fail to fire. That bug hid the PIT slider section on phones.
   - Why: hidden content is a HIGH-severity issue.
   - Source: jakubkrehel/skills `better-interface`.
2. **Respect reduced motion.**
   - Do: keep `<MotionConfig reducedMotion="user">` at the root, and use `motion-safe:` for Tailwind animations.
   - Don't: add motion that bypasses either.
   - Why: WCAG 2.2 SC 2.3.3, and better-ui "gate motion behind reduced motion".
3. **No unprompted loops.**
   - Do: start motion from a reader action ("Run", "Play", "Decompose", picking a layer). One short intro animation (under 5s) is OK.
   - Don't: use `repeat: Infinity` or a `setInterval` that runs without a pause or stop control.
   - Why: WCAG 2.2 SC 2.2.2 Pause, Stop, Hide; COGA "Help users focus".
4. **The demo comes first, then the words.**
   - Do: open a section with the working model and a one-line instruction ("Drag the snapshot", "Change Alice's segment").
   - Don't: write a paragraph that explains a widget the reader hasn't seen yet.
   - Why: learn-ui "the demo comes first"; Nicky Case "Do, Show and Tell"; the repo's AGENTS rule 5.
5. **Pick the medium by purpose.**
   - Do: text for abstract ideas, diagrams for relationships, animation for change over time (loads, history), interactives for processes (hashing, modelling steps).
   - Don't: animate something that has no time dimension.
   - Why: Nicky Case, "Explorable Explanations".
6. **Segment, and let the learner set the pace.**
   - Do: write sections of one idea each, with a "Next" affordance at the end. Aim for 2 screens or less per section.
   - Don't: write a continuous long page or use auto-advancing steps.
   - Why: Mayer, segmenting principle (median d = 0.98); the ACM 2026 ADHD study found short single-instruction chunks with pauses cut errors and hesitations.
7. **Name things before using them.**
   - Do: define a term at its first use (glossary `<Term>`), and introduce the key words up front.
   - Don't: use `ldts`, HWM, hashdiff or PIT unexplained.
   - Why: Mayer, pre-training principle (median d = 0.92); impeccable "Jargon Barrier".
8. **Don't make the reader remember.**
   - Do: keep the source row visible next to the vault row it produced, and repeat the key fact where it is used.
   - Don't: write "as we saw in chapter 2" without showing it again.
   - Why: UK DfE COGA guideline 6; impeccable "Memory Bridge".
9. **Always show where you are.**
   - Do: show the chapter position (n of 8), section progress, a done tick, and "continue where you left off".
   - Why: W3C COGA "Make Each Step Clear" and "Help users focus".
10. **About 4 choices per decision.**
    - Do: give one primary action per interactive and put the rest behind "More options".
    - Why: impeccable critique (working memory, Cowan 2001); better-layout.
11. **Let readers check themselves, and never gate.**
    - Do: end each chapter with 2–3 questions about the dataset story, give instant feedback that explains why, and make them optional. Answers must agree with `engine.ts` and be tested.
    - Why: retrieval practice helps students with ADHD as much as other students (Learning and Instruction, 2020); Nicky Case "See, Model, Apply".
12. **Let readers turn things down.**
    - Do: read one page at a time by default (each `<Section>` in a `<Chapter>` is a page with its own address, Previous/Next, "Page N of M" and ← → keys), and offer a remembered "Show as one page" switch for skimming.
    - Why: UK DfE COGA guideline 8, "Support adaptation and personalisation".
13. **Meaning is never colour only.**
    - Do: pair layer colours with a name, a suffix (`_h`, `_l`, `_s`) or an icon.
    - Why: WCAG 1.4.1; better-interface escalation trigger.
14. **Plain words.**
    - Do: sentence case, verb-first buttons ("Run dbt build"), and link text that names its destination.
    - Why: better-writing; COGA "Use clear and understandable content".
15. **Craft floor.**
    - Don't: eyebrow labels above headings, gradient text, thick left-border callouts, uppercase tracked micro-labels, or monospace as decoration.
    - Why: these are pbakaus/impeccable craft-floor bans.
