# Reference sources

| Source | Use it for |
|---|---|
| [DV Standards, *Data Vault Modeling Guide* (Hultgren, 2019)](http://dvstandards.com/wp-content/uploads/2021/02/data_vault_modeling_guide_2019_v3.pdf) | The modelling method (steps 1.1 to 3.3), the unified decomposition idea, the four sources of change, satellite split criteria, unit of work. The authority for modelling. |
| [Databricks, *What is a Data Vault?*](https://www.databricks.com/blog/what-is-data-vault) | Hub/link/satellite overview, raw vs business vault, PITs and bridges, mapping to medallion (bronze/silver/gold) in a lakehouse. |
| [OvalEdge, *Data Vault architecture*](https://www.ovaledge.com/blog/data-vault-architecture) | Architecture layers (staging, raw vault, business vault, marts), benefits and trade-offs, comparison with traditional warehouses. |
| [datavault4dbt wiki](https://github.com/ScalefreeCOM/datavault4dbt/wiki) and package source | Macro names, YAML parameters, hashing and loading behaviour. The authority for code. |
| [dbt blog: Data Vault with dbt](https://docs.getdbt.com/blog/data-vault-with-dbt) | How dbt fits: incremental models, `ref()` lineage, automation of repetitive patterns. |

When adding content, cite the source in the chapter's further-reading section.

## dbt primer and change workflow

| Source | Use it for |
|---|---|
| [dbt unit tests](https://docs.getdbt.com/docs/build/unit-tests) | Unit-test support from dbt v1.8, static `given` inputs and `expect` results. |
| [dbt incremental models](https://docs.getdbt.com/docs/build/incremental-models) | Incremental model behavior and the `is_incremental()` context variable. |
| [dbt materializations](https://docs.getdbt.com/docs/build/materializations) | The built-in materializations and how they determine a model’s stored relation. |
| [dbt `ref()`](https://docs.getdbt.com/reference/dbt-jinja-functions/ref) and [`source()`](https://docs.getdbt.com/reference/dbt-jinja-functions/source) | Declaring model dependencies and source-table dependencies in SQL. |
| [dbt `compile`](https://docs.getdbt.com/reference/commands/compile) | Rendering model SQL and Jinja into compiled SQL. |
| [dbt documentation](https://docs.getdbt.com/docs/build/documentation) | Generating project documentation and model lineage. |
| [dbt profiles](https://docs.getdbt.com/docs/core/connect-data-platform/profiles.yml) and [`env_var()`](https://docs.getdbt.com/reference/dbt-jinja-functions/env_var) | Targets, connection configuration and environment-provided values. |
| [dbt state selection](https://docs.getdbt.com/reference/node-selection/methods#the-state-method) and [`--defer`](https://docs.getdbt.com/reference/node-selection/defer) | Selecting modified resources and resolving eligible unselected references from a saved manifest. |

## Replay and lakehouse portability

| Source | Use it for |
|---|---|
| [dbt `full_refresh` config](https://docs.getdbt.com/reference/resource-configs/full_refresh) | How the resource config overrides the `--full-refresh` flag. |
| [dbt incremental models](https://docs.getdbt.com/docs/build/incremental-models) | How dbt builds and updates incremental relations. |
| [Delta Lake time travel](https://docs.delta.io/delta-batch.html#query-an-older-snapshot-of-a-table-time-travel) and [VACUUM](https://docs.delta.io/delta-utility/#vacuum) | Reading older snapshots and removing files no longer referenced by a table. |
| [Microsoft Fabric OneLake shortcuts](https://learn.microsoft.com/en-us/fabric/onelake/onelake-shortcuts) | Connecting OneLake to data stored in another location. |
| [Databricks Unity Catalog external locations](https://docs.databricks.com/aws/en/connect/unity-catalog/cloud-storage/external-locations) | Governing access to cloud storage paths. |
| [datavault4dbt release notes](https://github.com/ScalefreeCOM/datavault4dbt/releases) | Checking package support and adapter changes before upgrading or switching engines. |
| [DuckDB-WASM documentation](https://duckdb.org/docs/stable/clients/wasm/overview.html) and [jsDelivr](https://www.jsdelivr.com/) | Running the primer's captured plain-dbt SQL on demand; the browser loads its large WASM files from jsDelivr. |

## Running dbt and scheduling

| Source | Use it for |
|---|---|
| [dbt `retry`](https://docs.getdbt.com/reference/commands/retry) | Resuming a failed dbt invocation from its failure point. |
| [dbt connection profiles](https://docs.getdbt.com/docs/core/connect-data-platform/connection-profiles) | Profile names, output targets and connection configuration. |
| [dbt `env_var()`](https://docs.getdbt.com/reference/dbt-jinja-functions/env_var) | Supplying environment-specific values without storing secrets in project files. |
| [dbt node-selection syntax](https://docs.getdbt.com/reference/node-selection/syntax) | Selecting a node and its parents or children in a dbt command. |
| [dbt deploy jobs](https://docs.getdbt.com/docs/deploy/deploy-jobs) | Configuring and triggering dbt platform jobs. |
| [Astronomer Cosmos basic DAG](https://github.com/astronomer/astronomer-cosmos/blob/main/dev/dags/basic_cosmos_dag.py) | Defining a dbt DAG and limiting active Airflow runs. |
| [dagster-dbt API](https://docs.dagster.io/api/libraries/dagster-dbt) | Building dbt assets from a manifest and streaming a CLI build. |
| [Databricks dbt task](https://docs.databricks.com/aws/en/jobs/dbt) | Running dbt commands as a Databricks job task. |
| [Microsoft Fabric dbt job overview](https://learn.microsoft.com/en-us/fabric/data-factory/dbt-job-overview) and [common dbt job patterns](https://learn.microsoft.com/en-us/fabric/data-factory/common-dbt-job-patterns) | Fabric dbt job support and pipeline patterns. |
| [OneLake security](https://learn.microsoft.com/en-us/fabric/onelake/security/read-secured-data) | How access controls apply to data read paths. |

## Learning design and accessibility

These sources back the rules in `learning-design.md` and the audit in `ux-audit.md`.

| Source | Use it for |
|---|---|
| [W3C COGA, *Making Content Usable for People with Cognitive and Learning Disabilities*](https://www.w3.org/TR/coga-usable/) | The objectives and design patterns. Most used: Objective 5 [Help Users Focus](https://www.w3.org/WAI/WCAG2/supplemental/objectives/o5-user-focus/), "Make Each Step Clear", "Make the Purpose of Your Page Clear", "Use a Consistent Visual Design". |
| [W3C WAI, *Cognitive, learning and neurological disabilities*](https://www.w3.org/WAI/people-use-web/abilities-barriers/cognitive/) | Who is affected (including ADHD) and the barriers they meet. |
| [UK DfE, *Cognitive accessibility guidelines*](https://deliver-good-services.education.gov.uk/guides/cognitive-accessibility-guidelines) | The 8 practical guidelines. Most used: 5 "Help users focus", 6 "Ensure processes do not rely on memory", 8 "Support adaptation and personalisation". |
| [MDN, *Cognitive accessibility*](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Cognitive_accessibility) | Timers, moving content, navigation and heading structure, multiple ways to find content. |
| [Section508.gov, *Designing digital content for users with cognitive disabilities*](https://www.section508.gov/design/digital-content-users-with-cognitive-disabilities/) | Plain language, predictable layout, avoiding distraction. |
| [WCAG 2.2 SC 2.2.2 *Pause, Stop, Hide*](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) | Motion that starts automatically and lasts more than 5s needs pause, stop or hide (Level A). |
| [WCAG 2.2 SC 2.3.3 *Animation from Interactions*](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) | Interaction-triggered motion can be disabled (`prefers-reduced-motion`). |
| [Mayer, *Segmenting, pretraining and modality principles* (Cambridge Handbook of Multimedia Learning)](https://doi.org/10.1017/cbo9780511816819.012) | Learner-paced segments (median d = 0.98); naming key concepts first (median d = 0.92). |
| [Knouse et al., retrieval practice in college students with ADHD (*Learning and Instruction*, 2020)](https://www.sciencedirect.com/science/article/abs/pii/S0959475219305092) | The retrieval-practice benefit did not depend on ADHD status: the reason for the quick checks. |
| [Temporal video segmentation for learners with ADHD (ACM, 2026)](https://doi.org/10.1145/3797867.3829033) | Short single-instruction chunks followed by pauses reduced errors and hesitations. |
| [Technology support for focus, comprehension and retention in e-learning for students with ADHD (ACM, 2025)](https://doi.org/10.1145/3663547.3759705) | Segmentation, summaries, quizzes and annotated visuals as support patterns. |
| [Nicky Case, *Explorable Explanations*](https://blog.ncase.me/explorable-explanations/) | Do, Show and Tell (medium by purpose), interest curves, "See, Model, Apply", cognitive gates. |
| [learn-ui.com, *Explorable explanations*](https://learn-ui.com/chapters/explaining/explorable-explanations) | "The demo comes first", legible controls, handing the reader the controls. |
| [jakubkrehel/skills](https://github.com/jakubkrehel/skills) (MIT) | `better-interface`, `better-layout`, `better-writing`, `better-ui`: review method, severity escalation triggers, motion rules. Referenced only, not vendored. |
| [pbakaus/impeccable](https://github.com/pbakaus/impeccable) (Apache-2.0) | `critique` (cognitive-load checks, personas, Read vs Operate mode) and `craft-floor` (banned patterns). Referenced only, not vendored. |
