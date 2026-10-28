# AGENTS.md

Instructions for AI agents (and humans) working on this repo.

## What this is

An interactive website that teaches **how Data Vault modelling is done** and **how dbt + datavault4dbt builds it**. Three small datasets (`customer`, `nation`, `orders`) run through every chapter. It is a static Vite app. There is no backend; the loading demos run on a TypeScript simulation.

## Commands

```bash
pnpm install
pnpm dev --host 0.0.0.0 --port 5173
pnpm lint      # oxlint
pnpm test      # vitest (simulation engine)
pnpm build     # tsc -b + vite build (BASE_PATH env sets the base path, default /)
pnpm e2e       # Playwright suite: chapter flows, keyboard, axe WCAG 2.2 AA, overflow/hidden/motion audit
pnpm ux:check  # just the audit + WCAG specs (see docs/knowledge/ux-audit.md)
```

Run lint, test and build before pushing. CI (`.github/workflows/ci.yml`) runs the same plus `pnpm e2e`; `primer.yml` checks that `src/lib/primer/compiled.json` is up to date. Cloudflare Pages deploys: `deploy-preview.yml` (main → `preview`, each PR → `pr-<number>`; fork PRs only via a manual run with the PR number) and `deploy-production.yml` (published `vX.Y.Z` release → production). Both use the `preview`/`production` GitHub environments (`CLOUDFLARE_API_TOKEN` secret, `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_PROJECT_NAME` variables).

## Layout

- `src/chapters/`: one file per chapter, registered in `src/chapters/index.ts` (order = navigation order). Each chapter wraps its content in `<Chapter>` (`src/components/Chapter.tsx`): the chapter root is a generated cover, every `<Section>` is one page at `/#/<chapter>/<section-id>`, and `/#/<chapter>/recap` is the generated recap. Keep `ChapterHeader`, `Section` and optional `RecapExtras` as direct children of `<Chapter>`. The "Show as one page" switch (`src/lib/reading.ts`) renders the cover, sections and recap as one scroll. e2e helpers open routes as one page unless `{ paged: true }`.
- `src/components/`: shared UI (`CodeBlock` Shiki, `DataTable`, `Prose`, `Decomposition`, `Layout`). `src/components/ui/` is shadcn (Base UI).
- `src/components/drawing/`: explainer drawings. Each is a short `.tsx` file of inline SVG built from `kit.tsx` (`Card`, `Line`, `Badge`, `Mono`, `Small`, `Note`) inside `<Drawing>`, which takes a wide layout and a stacked phone layout. Keep labels as real text, colours as theme classes (`Tone`), a `title` and `desc` that say what the drawing shows, and values taken from `dataset.ts`/`engine.ts`, not typed in. Drawings are static: no motion.
- `src/lib/dv/hash.ts`: datavault4dbt-compatible hashing.
- `src/lib/dv/dataset.ts`: the three-batch fictional TPC-H-style dataset and its `STORY`.
- `src/lib/dv/engine.ts`: stage/hub/link/satellite/PIT simulation, with tests in `engine.test.ts`.
- `src/lib/dv/models.ts`: the guide's dbt project (model code shown in the UI and in the lineage graph).
- `docs/knowledge/`: domain knowledge distilled from the reference sources. **Read this before writing content.**

## Rules

1. **Content must be correct Data Vault 2.0.** Follow `docs/knowledge/data-vault-method.md`. Don't invent terminology. If a source and the code disagree, the DV Standards guide wins for modelling and the datavault4dbt source wins for macro behaviour.
2. **datavault4dbt only.** No AutomateDV or other packages in examples. Macro names and YAML keys must match the real package (`docs/knowledge/datavault4dbt.md`).
3. **One dataset story.** Use customer / nation / orders (plus the phone feed for multi-active) from `dataset.ts`. Don't add ad-hoc example data inside chapters.
4. **The simulation must match package defaults** (MD5, `||`, `^^`, trim, upper-case hashkeys, ghost records). If you change `engine.ts` or `dataset.ts`, update `engine.test.ts` and any chapter copy that quotes counts or outcomes.
5. **Show, then explain.** Every concept gets a visual or an interaction (Motion animation, stepper, toggle, slider) with short prose next to it. Keep the prose plain and brief.
6. **Model code is the single source.** Chapters pull SQL/YAML from `models.ts` (`MODEL[name].code`) rather than duplicating it.
7. Keep the routing hash-based (`HashRouter`) so static hosting works without rewrites.
8. DuckDB-WASM is allowed only in the plain-dbt primer; never add it to Data Vault or datavault4dbt chapters. `src/lib/primer/compiled.json` is generated: never hand-edit it; run `pnpm primer:compile`.
9. **Follow the learning design rules** in `docs/knowledge/learning-design.md`. The guide must work for interrupted, attention-variable readers (ADHD). The non-negotiables:
   - content is visible by default;
   - no motion that starts by itself and loops without a pause;
   - `prefers-reduced-motion` is respected;
   - new terms are defined where they are first used;
   - about 4 primary controls per interactive;
   - each chapter has an optional, never-blocking quick check.
   Run `pnpm e2e` and the manual steps in `docs/knowledge/ux-audit.md` before UX-facing PRs.
10. **Glossary terms.** Add new definitions to `src/lib/glossary.ts` and use `<Term id="...">` at the term's first explanatory use in each chapter.
11. **Scope.** Every page must teach Data Vault modelling, or how dbt builds, loads, tests or protects the vault. Platform detail belongs only where it changes a Data Vault decision. Tool setup, platform operations, general dbt topics with no Data Vault angle, and company-specific material stay out; link out instead.

## Knowledge base

- `docs/knowledge/data-vault-method.md`: concepts, the 9-step modelling method, satellite split criteria, architecture layers, anti-patterns.
- `docs/knowledge/datavault4dbt.md`: macros, YAML keys, hashing defaults, loading semantics.
- `docs/knowledge/datasets.md`: how the three datasets map to the vault, and what each batch demonstrates.
- `docs/knowledge/sources.md`: the reference material and what each one is used for (Data Vault, and learning design/accessibility).
- `docs/knowledge/learning-design.md`: rules for ADHD-friendly, cognitively accessible chapters, with success criteria S1–S7.
- `docs/plans/adhd-ux-plan.md`: the agreed ADHD/UX roadmap (phases, per-chapter changes, decisions).
- `docs/plans/guide-plan.md`: the agreed guide structure, scope and PR sequence.
- `docs/knowledge/ux-audit.md`: how to audit the UI (automated scan, code greps, the referenced review skills), severity scale, latest findings.
