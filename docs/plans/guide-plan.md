# The dbt + Data Vault guide: full plan

Status: agreed; PR B in progress.

---

## 1. Goal and scope

**Goal (unchanged):** teach *how Data Vault modelling is done*, then *how dbt + datavault4dbt builds it*, then *how to run it safely*, using one dataset (customer / nation / orders, plus the phone feed).

**Scope rule** (goes into `AGENTS.md`): every page must teach Data Vault modelling, or how dbt builds, loads, tests or protects the vault. Platform detail appears only where it changes a Data Vault decision.

| In scope | Out of scope (link out instead) |
|---|---|
| The DV2 method, datavault4dbt, dbt basics needed for DV | Tool setup: Python, pyenv, VS Code, Azure CLI, profiles, credentials |
| Persistent staging, replay, `--full-refresh`, portability | Fabric operations: workspaces, Livy, RLS, orchestration, Power BI |
| Git / PR / CI/CD *for a dbt vault* | General dbt topics with no DV angle: marts design, MCP/Copilot |
| Migrating hand-written SQL Server vault patterns | Anything naming a company, its systems, sources, servers or volumes |

**Public and generic only.** Examples use the guide's own dataset. No company, system or source names, and no figures from real projects, go into the repo or the site.

---

## 2. Readers

| Reader | Already knows | Needs | Path |
|---|---|---|---|
| **R1 Data Vault learner** | dbt, git, CI | The method → how datavault4dbt builds it → running it | Full book |
| **R2 Newcomers** | SQL at most | DV from zero → dbt from zero → running it safely | Full book (the primer matters most) |
| **R3 Data Vault engineers new to dbt** | Hubs/links/sats on SQL Server, T-SQL procedures | Why dbt, dbt mapped to T-SQL, git/PR/CI, replay and persistent staging, migration | "I know Data Vault" path |

The success criteria per reader decide what "done" means, and are checked manually before each Part ships:

- **R2** can explain hub, link and satellite, and read a datavault4dbt model, without outside help.
- **R3** can map each of their T-SQL habits to a dbt equivalent. They can say why truncated landing breaks replay, and walk one change from branch to prod.
- **All:** can stop at any page and resume exactly there (already true after PR #10). Never more than about 4 primary controls on screen.

---

## 3. Target structure

Times are estimates; ✱ = new.

**Part I. The method**
1. What is Data Vault (6 min)
2. Modelling three datasets (6 min)
3. ✱ *Data Vault in this guide's names*: a one-page bridge for R3 (2 min). Their terms → ours: `_h` / `_l` / `_s` suffixes, `hk_`, `hd_`, `ldts`, `rsrc`, ghost records, insert-only.

**Part II. Building it with dbt**

4. ✱ **dbt primer** (10 min, 7 pages)
5. Building it with dbt (reordered: By hand vs with dbt is page 2)
6. Hash lab
7. Loading, batch by batch

**Part III. Going further**

8. Satellite flavours
9. Business vault: snapshots and PITs
10. The whole dbt project (lineage)

**Part IV. ✱ Running it for real**

11. Replay: one history, two shapes
12. One lake, any engine
13. Working the modern way
14. From a hand-written SQL Server vault
15. Hash parity and restoring history
16. The modern business vault
17. Migration checklist

**Reading paths** (Home, "Start here"; remembered; nothing hidden):

| Path | Chapters |
|---|---|
| New to Data Vault and dbt | 1 → 17 in order |
| I know Data Vault, new to dbt | 3 → 4 → 5 → 7 → 11 → 12 → 13 → 14 → 15 → 16 → 17, with 1–2, 6, 8–10 marked "optional refresher" |
| Just browsing | Chapter list, no path |

When a path is active, Previous/Next follow the path's order, and the sidebar dims (doesn't hide) chapters outside the path.

---

## 4. The page model (every chapter)

- **Cover page:**
  - number, title, one-line promise;
  - "In 30 seconds" (3 bullets, moved here from the chapter header);
  - pages with minutes;
  - "Who it's for": *Essential* or *Skim if you know Data Vault*;
  - a Start button.
- **Content pages:** a numbered title (e.g. 5.2); one sentence on "what you'll see"; **one** interactive; short prose; a "Key point" line. Each page is at most about 1.5 screens on desktop. Longer sections get split.
- **Recap page:** 3 key points; an optional quick check (2–3 questions, instant feedback, never blocks); "Next chapter".
- One-page mode shows all pages in order, with numbered dividers.

---
## 5. Chapter-by-chapter detail

### Existing chapters (changed in PR B, plus PR E for chapter 5)

| Ch | Pages after the split | Changes |
|---|---|---|
| 1 What is Data Vault | cover · Built for change · Unified decomposition · Three building blocks · Where it sits (layers) · DV vs traditional (table) · recap | "Where it sits" split from the comparison table; Further reading moves to the recap |
| 2 Modelling | cover · Business keys · Relationships · Context → satellites · The full model · recap | The long stepper is split at its step groups; "What to take away" becomes the recap |
| 5 Building with dbt | cover · dbt in one minute → *replaced by a link to the primer* · **By hand vs with dbt** · From canvas to code · What the hub macro generates · Run it · recap | Reordered. **Dialect switch** on By hand (Generic SQL / T-SQL procedure with `MERGE` + `HASHBYTES`): remembered; the highlights and "Add a column" work in both |
| 6 Hash lab | cover · Build a hash · Hashdiff · Ghost keys · recap | Callouts become their own short page |
| 7 Load player | cover · Play the batches · The rules you watched · recap | Advanced toggles go behind "More options" (≤ 4 controls) |
| 8–10 | cover · existing sections · recap | Covers and recaps only |

### 3 · Data Vault in this guide's names (new)
A single page with a two-column table (your term → this guide's term → where it's taught). It has links into chapters 1–2 for anything unfamiliar. For R3 only; R2 sees it as a short glossary.

### 4 · dbt primer (new)

Every example uses our data. Every page ends with an "In SQL Server you'd…" line so R3 readers can connect each idea to what they already do. Live SQL panels run real `dbt-duckdb` compiled SQL in DuckDB-WASM in the plain-dbt primer only (section 7).

| Page | Show | Teach |
|---|---|---|
| 4.1 Why dbt | Before/after: a folder of procedures and a job schedule vs a dbt project tree | dbt = SQL `SELECT`s + YAML + Jinja; version-controlled and testable |
| 4.2 From SSIS and stored procedures | **Three-way switch:** *SSIS package* (control flow: Execute SQL → Data Flow (source → derived column → lookup → destination), precedence constraints) / *Stored procedure* (temp tables, `MERGE`, `TRY…CATCH`, called from a SQL Agent job) / *dbt* (one model per target + YAML), all loading the same `stg_customer` → `customer_h` step. Click a part on one side to highlight its counterpart on the others | **The SQL Server → dbt map:** SSIS package / procedure → model; precedence constraints / call order → `ref()` DAG; Derived Column / Lookup → SQL in the model; Data Flow destination → materialization; `MERGE` → incremental; SQL Agent job → scheduled `dbt build`; package configurations / environments → targets and vars; `.dtsx` XML in shared folders → plain text in git; deploy by hand → CI/CD; checks done by hand → tests; documentation done by hand → `dbt docs` lineage. What stays the same: it's still SQL, still the same Data Vault patterns |
| 4.3 Models and `ref()` | A 3-model graph; click a model to see its SQL; **live:** run it and query the result | A model is a `SELECT` in a file; `ref()` / `source()` give the run order |
| 4.4 Jinja and compile | Toggle "Jinja ↔ compiled SQL" on a small macro (`safe_divide`-style) | `dbt compile` shows exactly what runs; macros = reuse |
| 4.5 Materializations | Switch view / table / incremental on one model; see the DDL change | view ≈ `CREATE VIEW`; table ≈ `SELECT INTO`; incremental ≈ `INSERT`/`MERGE` |
| 4.6 Incremental and `--full-refresh` | **Run player (live):** batch 1 → batch 2 incremental → truncate landing → `--full-refresh`. `count(*)` before and after; the `is_incremental()` branch lights up | The high-water mark; a full refresh rebuilds from `source`, which leads into chapter 11 |
| 4.7 Tests and docs | **Live:** a `unique` test fails on a duplicate, then passes after the fix; the lineage view | Tests as the safety net; docs and lineage replace documentation done by hand |

### 11 · Replay: one history, two shapes (new)

**Replay lab.** Controls:
- landing: *Truncate after load* / *Persistent*;
- change: none / add `c_comment` / fix a cast bug / split `customer_n_s` / "who sent what on day 2?";
- **Run `--full-refresh`** and **Rebuild**.

The output is a cell-level diff of the rebuilt vault against the "true" vault: lost cells red, matching cells neutral, with a count.

Pages:
- 11.1 the lab;
- 11.2 what gets lost, a table of 8 losses, each a lab preset: unmapped columns, hard-rule bytes, rows filtered in staging, collapsed repeat deliveries (`sat_v0` keeps changes only; `rec_track_sat`), undetected deletes, updated end-dates, hash bugs, model changes;
- 11.3 two histories, one record: staging = evidence, vault = derived, the "bank statements vs ledger" table;
- 11.4 prove it: a scheduled rebuild-and-compare check (`dbt build --full-refresh --target dev`, then compare counts and a hash of hashes);
- 11.5 until you're replay-safe: `+full_refresh: false` on the raw-vault folder, backups, limited prod access; Delta time travel is not persistent staging; deleting personal data from persistent staging.

### 12 · One lake, any engine (new)
- **Architecture diagram** with a "Switch engine" toggle (Fabric ↔ Databricks): storage boxes stay put, the compute box and the dbt target swap, and the connections relabel (OneLake shortcut ↔ Unity Catalog external location).
- **Pages:** storage vs compute; the layers (bronze → `dv_stage` → `raw_vault` → `business_vault` → gold); what moves and what's rebuilt; portability rules (plain Spark SQL, engine specifics in named macros/vars, one hash rule plus a cross-engine unit test).
- **datavault4dbt on Fabric Spark** is one short page: upstream support is coming; how to install and set the global vars. No dispatch internals.

### 13 · Working the modern way (new)
**Change player**, which steps through one change:
1. A git branch.
2. Add `c_mktsegment` to `customer_n_s` (a YAML diff).
3. A pull request with the diff and a review comment.
4. CI runs `dbt build --select state:modified+` into a throwaway schema; a test goes red.
5. Fix the change; CI goes green.
6. Merge.
7. Deploy to prod.
8. Optional: roll back with `git revert`.

Pages also cover dev/test/prod targets, what a reviewer checks in vault YAML, and slim CI. It uses generic Git and CI terms, with no vendor setup.

### 14 · From a hand-written SQL Server vault (new)

Before/after gallery (T-SQL ↔ dbt), one pair per page:

| Legacy pattern | dbt + datavault4dbt |
|---|---|
| `LoadEndDate` updated in place | Insert-only `sat_v0` plus the `sat_v1` view |
| Transient staging | Persistent staging (chapter 11) |
| One procedure per target, cloned per source | YAML metadata |
| Inline `HASHBYTES` with mixed casts | One hash macro |
| Business-vault objects cloned per source | One integrated satellite with explicit precedence |
| Business rules inside raw staging | Rules only in the business vault |
| No snapshot control | `control_snap_v0`/`v1` plus PIT |

### 15 · Hash parity and restoring history (new)
- **Hash lab extension:** encoding (UTF-8 / UTF-16LE), delimiter (`||` / `;`), NULL handling, upper-case on or off, compared against a "legacy" key (match ✓ / ✗).
- **Pages:**
  - keep hashkeys compatible so history can be seeded; recompute hashdiffs;
  - test vectors as dbt unit tests, with edge cases (`ß`, trailing spaces, a delimiter inside a key);
  - where history comes from, best source first: archived files, then a 1:1 copy of the legacy vault;
  - the load player replaying legacy rows;
  - an old→new key map and reconciliation.

### 16 · The modern business vault (new)
- **Precedence toggle:** two sources merge into one integrated satellite.
- **Computed satellite** example, a customer's order total, with a dbt unit test.
- **Pages:** what belongs in the business vault vs marts; one snapshot control for every PIT; views first; business date vs load date; no copies maintained by `MERGE`.

### 17 · Migration checklist (new)
A tickable list, saved locally:
1. Persistent staging is live.
2. `full_refresh: false` is set until then.
3. A hash parity test passes.
4. Unit tests cover the business rules.
5. Replaying several deliveries works.
6. Rebuild-and-compare is green.
7. The parallel run reconciles.
8. Cut-over.

---

## 6. Engine, data and model changes

| File | Change | Tests |
|---|---|---|
| `src/lib/dv/dataset.ts` | A "legacy" view of the customer data (prefixed names, `LoadEndDate`, one bad cast) and an extra delivery repeating batch 2 unchanged. Existing counts unchanged | Existing `engine.test.ts` counts still pass |
| `src/lib/dv/engine.ts` | `replay(deliveries, { landing }, change)`, `fullRefresh(state)` → `{ vault, diff }`; integrated sat with precedence; computed sat | New unit tests per preset (expected lost-cell counts) |
| `src/lib/dv/hash.ts` | Options `encoding: 'utf8' \| 'utf16le'`, `delimiter`, `nullAs` | Test vectors for both encodings |
| `src/lib/dv/models.ts` | `rec_track_sat`, integrated BV sat, `control_snap_v1`, computed sat + unit-test YAML, `dbt_project.yml` with `+full_refresh: false`, T-SQL hand-written variants | Snapshot tests that each model renders |
| `src/lib/reading.ts` | Reading path (`full` / `dv-practitioner` / `browse`) next to the reading mode | Unit test for the order per path |
| `docs/knowledge/migration.md` | Generic patterns, the replay and portability answers | — |
| `docs/knowledge/sources.md` | Public references: DV2 persistent staging, dbt incremental / `full_refresh` / unit tests / state selection, Delta, OneLake shortcuts, Unity Catalog external locations, DuckDB-WASM | — |

---

## 7. Live SQL with DuckDB (primer only)

- **Scope:** only plain-dbt primer pages 4.3, 4.6 and 4.7. Chapter 13 and all Data Vault/datavault4dbt chapters remain DuckDB-free.
- **How:**
  - A tiny plain-dbt project in `primer-dbt/` (`dbt-duckdb`) is compiled at build time by `pnpm primer:compile`.
  - `src/lib/primer/compiled.json` contains captured `target/run` and `target/compiled` SQL plus landing setup SQL generated from `dataset.ts`.
- The browser replays those statements in `@duckdb/duckdb-wasm`. It's loaded only after a reader activates a live panel, never automatically. Large WASM assets load from jsDelivr because they exceed the Pages per-file limit.
  - CI checks that `compiled.json` is up to date.
- **D2 status:** The compiler, generated-SQL correctness test, and lazy live panels are implemented for pages 4.3, 4.6 and 4.7 only.
- **UI:** a preloaded query, Run, Reset, and a results table. Keyboard-accessible, and no empty box to start from.
- **Fallback:** if WebAssembly fails, the panel shows the precomputed results and a note.
- **Cost:** DuckDB's raw WASM builds are 33–38 MiB; the EH bundle transfers 6,764,975 bytes with Brotli from jsDelivr (about 6.8 MB). Downloads remain on demand, and the lazy chunk must not increase the normal-page bundle.

---

## 8. PR sequence

| PR | Contents | Depends on | Acceptance |
|---|---|---|---|
| **#10** | Paged reader (in review) | — | Merged |
| **B** | Cover/recap pages, Parts I–IV in the sidebar, page splits (section 5), dbt chapter reorder, chapter 3 bridge, reading paths on Home, scope rule in `AGENTS.md`, this plan in `docs/plans/` | #10 | Every page ≤ 1.5 screens on desktop; paths change Previous/Next; e2e + axe pass on every page in both modes |
| **C** | Chapter 11 Replay lab + chapter 12 One lake; engine `replay`/`fullRefresh`; `migration.md` part 1 | B | Each loss preset gives the expected diff (unit tests); the lab works by keyboard; ≤ 4 primary controls |
| **D** | Chapter 4 dbt primer + chapter 13 Working the modern way; `primer-dbt/`; DuckDB-WASM panels only on primer pages 4.3, 4.6 and 4.7 | B | Build-time dbt replay; lazy live panels with static fallback; no DuckDB in chapter 13 or vault chapters |
| **E** | Chapter 14 legacy patterns, chapter 15 hash parity, dialect switch on By hand | C | Hash vectors for both encodings; dialect switch remembered |
| **F** | Chapter 16 business vault, chapter 17 checklist, `migration.md` part 2 | E | Unit tests for precedence and computed sat |
| **G** | Glossary popovers (with a "SQL Server name" line), quick checks on every recap, polish (impeccable craft floor), About page | F | The ADHD plan's success criteria S1–S7 all pass |

Every PR passes `pnpm lint`, `test`, `build`, `e2e` and `ux:check`, adds e2e tests for its interactives, and gets the manual keyboard pass from `ux-audit.md`. Nothing is recorded.

**PR E status:** Implemented in the legacy-parity feature branch: the T-SQL dialect switch, chapters 14–15, configurable hash vectors, and legacy-history reconciliation are wired into the practitioner path.

---

## 9. Decisions so far

- Paged by default, with a remembered "Show as one page" switch.
- Quick checks are optional and never block.
- External UX projects are referenced in the docs only.
- A public About page.
- datavault4dbt only. On Fabric Spark: keep it brief, since upstream support is coming.
- "By hand vs with dbt": a switchable Generic SQL / T-SQL hand-written side.
- The dbt primer includes an SSIS / stored procedure / dbt comparison (page 4.2) and an "In SQL Server you'd…" line on every page.
- DuckDB only for plain dbt (the primer), not for datavault4dbt. No Trino.
- Public and generic content only.

## 10. Resolved defaults

1. There are three reading paths: full, Data Vault practitioner, and browse.
2. Chapters outside the active path are dimmed, not hidden.
3. Part IV starts with Replay and One lake.
4. The CI chapter stays tool-neutral.
5. PR C comes before PR D.
