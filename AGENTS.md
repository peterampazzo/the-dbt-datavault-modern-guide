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
pnpm build     # tsc -b + vite build (BASE_PATH env sets the Pages base)
pnpm ux:check  # overflow / hidden-content / reduced-motion scan against the dev server (see docs/knowledge/ux-audit.md)
```

Run lint, test and build before pushing. CI (`.github/workflows/deploy.yml`) runs the same, and deploys to GitHub Pages on `main`.

## Layout

- `src/chapters/`: one file per chapter, registered in `src/chapters/index.ts` (order = navigation order).
- `src/components/`: shared UI (`CodeBlock` Shiki, `DataTable`, `Prose`, `Decomposition`, `Layout`). `src/components/ui/` is shadcn (Base UI).
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
7. Keep the routing hash-based (`HashRouter`) so GitHub Pages works without rewrites.
8. Keep a future DuckDB-WASM playground possible: chapters shouldn't depend on engine internals beyond the exported functions.
9. **Follow the learning design rules** in `docs/knowledge/learning-design.md`. The guide must work for interrupted, attention-variable readers (ADHD). The non-negotiables:
   - content is visible by default;
   - no motion that starts by itself and loops without a pause;
   - `prefers-reduced-motion` is respected;
   - new terms are defined where they are first used;
   - about 4 primary controls per interactive;
   - each chapter has an optional, never-blocking quick check.
   Run `pnpm ux:check` and the steps in `docs/knowledge/ux-audit.md` before UX-facing PRs.

## Knowledge base

- `docs/knowledge/data-vault-method.md`: concepts, the 9-step modelling method, satellite split criteria, architecture layers, anti-patterns.
- `docs/knowledge/datavault4dbt.md`: macros, YAML keys, hashing defaults, loading semantics.
- `docs/knowledge/datasets.md`: how the three datasets map to the vault, and what each batch demonstrates.
- `docs/knowledge/sources.md`: the reference material and what each one is used for (Data Vault, and learning design/accessibility).
- `docs/knowledge/learning-design.md`: rules for ADHD-friendly, cognitively accessible chapters, with success criteria S1–S7.
- `docs/plans/adhd-ux-plan.md`: the agreed ADHD/UX roadmap (phases, per-chapter changes, decisions).
- `docs/knowledge/ux-audit.md`: how to audit the UI (automated scan, code greps, the referenced review skills), severity scale, latest findings.
