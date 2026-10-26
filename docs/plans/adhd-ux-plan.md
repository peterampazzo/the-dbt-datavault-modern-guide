# Plan: make the guide work for ADHD readers, plus a UX audit

Repo: `peterampazzo/the-dbt-datavault-modern-guide`. Live site: https://the-dbt-datavault-modern-guide.pages.dev

## 1. Goal and who we design for

**Goal:** someone with ADHD can start any chapter, follow it, be interrupted, come back, and leave knowing the 3 key ideas.

This is also a stated benefit for everyone. The COGA guidance and Mayer's segmenting research show the same changes help all learners.

Design personas:
- **Primary: the "interrupted learner".** Has ADHD and reads on a laptop in a 10–15 minute window. Gets pulled away mid-chapter. Is drawn to motion, but gets tired by it if it never stops.
- **Secondary: Casey.** Impeccable's "distracted mobile user": on a phone, uses one hand, returns later.
- **Secondary: Jordan.** Impeccable's "confused first-timer": has never heard of a hashdiff.

Success criteria (checked before and after):

| # | Criterion | How it is checked |
|---|---|---|
| S1 | No content is hidden, clipped or unreachable at 320px, 390px or 1280px, or at 200% zoom. | Playwright script: overflow plus a hidden-element scan on every route. |
| S2 | No motion that starts on its own and lasts more than 5s without a pause control. Movement is turned off when the OS reduced-motion setting is on. | Code grep for `repeat: Infinity` / `setInterval`; Playwright with `reducedMotion: 'reduce'`. |
| S3 | Every chapter shows, above the fold: what you'll learn, time to read, and where you are in the guide. | Visual check at 1280px and 390px. |
| S4 | Leaving and coming back restores the chapter, the section and the state of each interactive. | Playwright: interact, reload, assert. |
| S5 | No decision point shows more than about 4 primary controls. Advanced options are tucked away. | Manual count per interactive. |
| S6 | Each chapter ends with a short self-check that gives instant feedback. | Unit test on the quiz data, plus a visual check. |
| S7 | `pnpm lint`, `test` and `build` pass, plus a keyboard-only walkthrough of every chapter. | CI, plus a manual check (no recording). |

## 2. Principles and where they come from

Each rule cites its source; these are the rules that will be written into the repo (section 6).

| Principle | What it means here | Source |
|---|---|---|
| **Help users focus** | Limit interruptions, keep the critical path short, avoid too much content, tell the reader up front what a task involves. | W3C COGA, Objective 5 |
| **Make each step clear** | Show done, current and next steps, so a reader who lost focus can pick up again without re-reading. | W3C COGA design guide |
| **Processes don't rely on memory** | Never make the reader remember something from 3 screens ago. Repeat it, or keep it visible. | UK DfE COGA guideline 6; impeccable "Memory Bridge" |
| **Support personalisation** | The reader can turn distractions down (motion, density). | UK DfE COGA guideline 8; WAI cognitive page |
| **Pause, Stop, Hide** | Anything that moves by itself for more than 5s needs a pause control. | WCAG 2.2 SC 2.2.2 (Level A) |
| **Animation from interactions** | Movement can be turned off unless it is essential. | WCAG 2.2 SC 2.3.3; better-ui "Gate motion behind reduced motion" |
| **Segmenting** | People learn more deeply when learner-paced segments replace one continuous unit (median effect size 0.98). | Mayer, segmenting principle |
| **Pre-training** | Learn the names of key concepts before the complex explanation (median effect size 0.92). | Mayer, pre-training principle |
| **Short chunks plus pauses help ADHD learners most** | Single-instruction chunks with pauses improved everyone's results, and reduced errors and hesitations for ADHD participants to the level of others. | ACM 2026, temporal video segmentation study |
| **Retrieval practice works for ADHD learners** | The benefit of retrieval practice did not depend on ADHD status. | Learning and Instruction 2020, ScienceDirect |
| **Do, Show and Tell** | Use interactivity only where it explains best: text for abstract ideas, animation for time, interactives for processes. | Nicky Case, "Explorable Explanations" |
| **Interest curve; See, Model, Apply** | Hook first, build up from basics, end by using what you learnt. Embed small tasks. | Nicky Case |
| **The demo comes first** | Open with a working model and a one-line instruction to touch it. | learn-ui.com, analysis of Bartosz Ciechanowski's explainers |
| **Working-memory rule** | Keep to about 4 options per decision point. One primary action per view. | impeccable critique (Cowan 2001); better-layout |
| **Escalation triggers** | Reduced motion ignored, content clipped at 320px, meaning shown only by colour, focus not visible: each is HIGH. | jakubkrehel/skills better-interface |
| **Craft-floor bans** | No eyebrow label above headings, no gradient text, no thick left-border callouts, no monospace as decoration. | pbakaus/impeccable craft-floor |

## 3. Audit findings (evidence)

Evidence comes from Playwright runs on the dev build plus code reading.

| Sev | Finding | Evidence | Principle |
|---|---|---|---|
| HIGH | The PIT section "Drag the snapshot" stays invisible at 390px even after scrolling to the bottom. The scroll-reveal never fires. | `src/components/Prose.tsx:35-36` (`whileInView`, `margin: '-80px'`); Playwright scan | Escalation trigger: hidden content |
| HIGH | No reduced-motion support anywhere: no `MotionConfig` and no `motion-safe:`. | grep found 0 hits | WCAG 2.3.3; better-ui |
| HIGH | Animations that start and loop on their own with no pause control. | `Decomposition.tsx:67` toggles every 3.2s; `WhatIsDataVault.tsx:95` uses `repeat: Infinity`; `BuildWithDbt.tsx:188` auto-types | WCAG 2.2.2 |
| MED | No progress, resume or time estimate. Only the theme is stored. | `Layout.tsx:10` | COGA "Make each step clear"; Casey |
| MED | Long pages for one sitting. | Ch1: 727 words, about 4 screens. Ch3: 662 words, 22 controls, about 4 screens. | Segmenting; "Avoid too much content" |
| MED | Too many controls at once. | The load player shows 3 batches, Play, Step, Restart, 2 toggles and 5 phases at the same time. | Working-memory rule |
| MED | Jargon used before it is defined. | `ldts`, HWM and hashdiff appear in Ch2/3/5 before the Hash lab (Ch4). | Pre-training; "Jargon Barrier" |
| MED | No self-check anywhere. | — | Retrieval practice; See, Model, Apply |
| MED | Layer meaning is carried by colour (legend dots; table tones). | `Layout.tsx` legend; `DataTable` tones | Escalation trigger: colour alone |
| LOW | Eyebrow "Chapter N" above every h1; gradient text on Home; `border-l-4` callouts; uppercase tracked micro-labels. | `Prose.tsx` ChapterHeader, `Prose.tsx:57`, `Home.tsx:32-33`, `Layout.tsx:78,105` | impeccable craft-floor |
| LOW | No `scroll-padding-top` for the sticky header, so anchored headings land under it. | `index.css` | better-layout |

Already working: show-then-explain, a single dataset story, steppers with keyboard arrows, short Home, visible focus rings on shadcn controls.

## 4. The plan

### Phase 0: fixes (1 PR, small)

1. **Content visible by default.** Replace `whileInView` reveals in `Prose.Section`, `WhatIsDataVault` and `Home` with a fade that starts from visible (no hidden initial state), or reveal with `amount: 0` and no negative margin. Acceptance: S1.
2. **Reduced motion.** Wrap the app in `<MotionConfig reducedMotion="user">` and use `motion-safe:` for Tailwind animations. Acceptance: S2, checked with Playwright `reducedMotion: 'reduce'`.
3. **No unprompted loops.** `Decomposition` and the architecture flow play once and then wait for a Replay control. The terminal starts on "Run". Acceptance: S2.
4. **Meaning not by colour alone.** Add a layer icon and label next to every coloured layer chip: H, L, S and BV glyphs from lucide.

### Phase 1: the ADHD layer (3 PRs)

**PR 1a – Orientation and resume**
- **Chapter header block.** Replaces the eyebrow and holds:
  - the h1;
  - an "In 30 seconds" box with 3 bullets (what you'll learn);
  - "About N min";
  - "Uses: hub, link" chips linking to the glossary.
- **Guide progress.** A slim bar in the header, a tick on each chapter in the sidebar, and "You're on 3 of 8".
- **Resume.** `localStorage` saves the last chapter, the scroll section and each interactive's state (modelling step, load-player batch and phase, PIT snapshot, hash inputs). Home shows "Continue: Loading, batch by batch, step 3".
- **Section mini-map.** On desktop, a sticky "On this page" list highlights the current section. On mobile it collapses into the header.
- Acceptance: S3, S4.

**PR 1b – Less at once**
- **Segment long chapters.** Ch1 and Ch3 split into learner-paced sections with a "Next: …" button at the end of each (segmenting). Scrolling still works; the button is a guide, not a gate.
- **Focus mode** (toggle in the header, remembered). Hides the sidebar and legend, shows one section at a time with Back/Next and a step counter, and turns motion down. This is the personalisation lever from COGA guideline 8.
- **Progressive disclosure in the interactives.**
  - Load player: batches and Play/Step stay visible; "Late-arriving row", "Ghost records" and the phase jump go behind "More options".
  - Build with dbt: the model list starts at the 4 groups collapsed.
- **One primary action per interactive**, visually distinct. Acceptance: S5.

**PR 1c – Understanding checks and glossary**
- **Glossary.** One `glossary.ts` (term, one-line definition, link to the chapter that explains it). A `<Term>` component gives a dotted underline and a keyboard-reachable popover. Terms: business key, hashkey, hashdiff, ldts, rsrc, HWM, ghost record, PIT, snapshot, effectivity. Pre-training: Ch1 gets a "6 words you'll meet" strip.
- **Quick check** at the end of each chapter: 2–3 questions, instant feedback that explains why, answers stored with progress. All questions reuse the dataset story ("Chiara moved to Germany. Which tables get a new row?"). Questions live next to the engine so `engine.test.ts` can assert the answers match the simulation.
- **"Try it" prompts** inside the interactives (See, Model, Apply), e.g. "Change Alice's segment and predict the hashdiff before you look".
- Acceptance: S6.

### Phase 2: polish from the audits (1 PR)
- Remove the eyebrow label, gradient text, `border-l-4` callouts and the uppercase tracked micro-labels; sentence-case labels throughout (impeccable craft-floor, better-writing).
- Body measure of about 65–75ch; `scroll-padding-top` set to the header height; tap targets of 44px or more on mobile (better-layout, Casey).
- Copy pass: verb-first buttons, link text that names its destination (better-writing).
- Run the impeccable critique flow and the better-interface review on the finished build and fix the remaining HIGH/MEDIUM findings.

### Per-chapter summary

| Chapter | Changes |
|---|---|
| 1 What is DV | Split into 3 segments; Decomposition plays on click; architecture flow plays once; "6 words you'll meet". |
| 2 Modelling | Already stepper-based; add the 30s box, resume step, quick check. |
| 3 dbt | Split into 3 segments; collapsed model groups; terminal starts on Run. |
| 4 Hash lab | "Predict then reveal" prompt; glossary links. |
| 5 Load player | Advanced toggles behind More options; resume batch and phase; quick check about Chiara/Daniel. |
| 6 Satellites | One tab at a time with a "why this flavour" line. |
| 7 PIT | Fix the hidden section; resume snapshot; quick check. |
| 8 Lineage | "Click a hub to trace it" prompt; a short list fallback on mobile. |

## 5. PR sequence

1. **P0 fixes.** Small, ships the bug fix fast.
2. **Docs.** The sources and rules files (section 6), so later PRs cite them.
3. **1a.** Orientation and resume.
4. **1b.** Less at once and Focus mode.
5. **1c.** Glossary and quick checks.
6. **P2.** Polish and the final audit pass.

Each PR passes `pnpm lint`, `test` and `build`, plus the Playwright suite in `e2e/` (`pnpm e2e`, which includes axe WCAG 2.2 AA scans). Each new feature adds its own e2e test; S4 (resume) gets one with the orientation PR. No screen recordings.

## 6. Documenting the sources (in the repo)

- **New `docs/knowledge/learning-design.md`.** The principles table in section 2, written as rules for agents ("Do / Don't / Why / Source"), plus the success criteria S1–S7.
- **New `docs/knowledge/ux-audit.md`.** How to run the audit: the Playwright scripts, the impeccable and better-interface review steps, the severity scale, and the latest findings table (updated each pass).
- **Extend `docs/knowledge/sources.md`** with a "Learning design and accessibility" table listing each source and what it is used for:
  - W3C COGA "Making Content Usable": https://www.w3.org/TR/coga-usable/ ; Objective 5: https://www.w3.org/WAI/WCAG2/supplemental/objectives/o5-user-focus/
  - W3C WAI, Cognitive and learning abilities: https://www.w3.org/WAI/people-use-web/abilities-barriers/cognitive/
  - UK DfE cognitive accessibility guidelines: https://deliver-good-services.education.gov.uk/guides/cognitive-accessibility-guidelines
  - MDN, Cognitive accessibility: https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Cognitive_accessibility
  - Section508.gov, Content for users with cognitive disabilities: https://www.section508.gov/design/digital-content-users-with-cognitive-disabilities/
  - WCAG 2.2 SC 2.2.2: https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html ; SC 2.3.3: https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html
  - Mayer, segmenting, pre-training and modality principles: https://doi.org/10.1017/cbo9780511816819.012
  - Retrieval practice and ADHD: https://www.sciencedirect.com/science/article/abs/pii/S0959475219305092
  - Temporal video segmentation for ADHD: https://doi.org/10.1145/3797867.3829033
  - E-learning support for HE students with ADHD: https://doi.org/10.1145/3663547.3759705
  - Nicky Case, Explorable Explanations: https://blog.ncase.me/explorable-explanations/
  - learn-ui.com, Explorable explanations: https://learn-ui.com/chapters/explaining/explorable-explanations
  - jakubkrehel/skills (MIT): https://github.com/jakubkrehel/skills
  - pbakaus/impeccable (Apache-2.0): https://github.com/pbakaus/impeccable
- **`AGENTS.md`** gets a short "Learning design rules" section with the non-negotiables (S1–S7, no unprompted loops, reduced motion, glossary for new terms, a quick check per chapter) and links to the files above.
- **On-site "About this guide" page** (optional): a short, public credit of the learning-design sources.

## 7. Decisions (agreed with Pietro, 2026-10-26)

1. **Focus mode** is a reader toggle, off by default and remembered.
2. **Quick checks** are optional and never block progress or "done" ticks.
3. **impeccable and jakubkrehel/skills** are referenced in the docs only, not vendored into the repo.
4. **"About this guide" page:** yes, a public page crediting the learning-design sources.

## Out of scope
- Audio narration (Mayer's modality principle): possible later.
- AI chat or summaries.
- DuckDB-WASM.
- Gamification beyond progress ticks.
