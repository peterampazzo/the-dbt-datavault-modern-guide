# Data Vault: concepts and modelling method

Distilled from the DV Standards modelling guide (Hultgren, 2019), the Databricks and OvalEdge articles (see `sources.md`). It is the reference for all chapter content.

## Why Data Vault

A warehouse has to absorb four kinds of change: **new sources, changing sources, new business rules and new delivery requirements**. Data Vault handles them by *unified decomposition*. Each source is split into its stable parts (business keys and relationships) and its changing parts (descriptive context). New things are added as new tables, and existing tables are never redesigned.

Properties to emphasise:
- **Additive / insert-only** raw vault: auditable and replayable. Every row carries `ldts` (load timestamp) and `rsrc` (record source).
- **Integration by business key**: the same concept from several systems lands in one hub.
- **Parallel loading**: hash keys are computed from business keys alone, so there are no lookups or sequence dependencies.
- **Separation of raw data from business rules**: the raw vault keeps source truth; rules live in the business vault and marts.

## The three core entity types

| Entity | Holds | Key | Notes |
|---|---|---|---|
| **Hub** | One row per distinct business key of a core business concept | hashkey of the BK | BK + `ldts` + `rsrc` only. No descriptive attributes. Insert-only. |
| **Link** | One row per unique relationship between hubs (unit of work) | hashkey of all participating BKs | Holds hub hashkeys. Insert-only. A changed relationship is a *new* link row. Many-to-many by design. |
| **Satellite** | Descriptive context and its history for exactly one hub or link | parent hashkey + `ldts` | Insert a row only when the **hashdiff** (payload fingerprint) changes. |

Anti-patterns to avoid in examples:
- descriptive attributes in a hub;
- satellite-to-satellite relationships, or a satellite with two parents;
- links that point to links or satellites (links connect hubs);
- choosing a source-system surrogate as the BK when a real business key exists;
- updating or deleting raw vault rows.

## The modelling method (DV Standards ordering)

1. **Hubs**
   1.1 Identify the core business concepts (CBCs), such as Customer, Nation and Order. Concepts come from the business, not from the source tables.
   1.2 Find, establish or create the business key for each concept. A good BK is unique, stable over time and meaningful across the enterprise. It is a business decision.
   1.3 Model the hubs.
2. **Links**
   2.1 Identify the natural business relationships between the concepts.
   2.2 Analyse the unit of work: which keys belong together in one relationship, so that a relationship isn't split apart.
   2.3 Model the links. Event or transaction relationships whose attributes never change can be **non-historized links**, which carry the event payload directly.
3. **Satellites**
   3.1 Gather the context attributes.
   3.2 Establish the satellite design criteria. Split satellites by:
       - **source system** (one satellite per source per parent is the default);
       - **rate of change** (fast-moving attributes such as balances go in their own satellite);
       - **subject area / type of data**;
       - **security / sensitivity** (PII in its own satellite).
   3.3 Model the satellites, each with `hd_*` hashdiff over its payload.

## Satellite variants

- **sat_v0 / sat_v1**: v0 is the physical insert-only table. v1 is a view adding `ledts` (load end date, from `LEAD`) and `is_current`.
- **Multi-active**: several rows are active at once per parent (e.g. phone numbers by type). The whole set is versioned together.
- **Effectivity**: tracks whether a link relationship is currently active (links can't express that an association ended).
- **Record tracking**: no payload. Logs in which loads and sources a key was seen; detects disappearance.
- **Non-historized**: immutable events; the payload lives on the link (or in a satellite without history).

## Architecture layers

Sources → **staging** (hashing, `ldts`/`rsrc`, ghost records; views) → **raw vault** (hubs, links, satellites; source truth) → **business vault** (business rules, PIT tables, bridges, derived satellites) → **information marts** (star schemas / flat views for BI).

In a lakehouse the Databricks article maps this onto medallion layers: raw/staging ≈ bronze, raw + business vault ≈ silver, marts ≈ gold.

## Query helpers (business vault)

- **Snapshot / control table**: defines the snapshot dates (`sdts`) to report on.
- **PIT (point-in-time)**: per parent key and snapshot, a pointer (hashkey + `ldts`) to the valid row of each satellite. It turns time-range joins into equi-joins. Missing satellite rows point at the ghost record.
- **Bridge**: precomputed paths across several links and hubs for faster traversal.

## Comparison (for the "vs traditional DW" content)

- **3NF / Inmon**: integrated, but schema changes ripple when sources change.
- **Kimball star**: optimised for consumption, but tied to current requirements, and history and restatement are hard.
- **Data Vault**: optimised for integration, history and change. Marts are still built on top for consumption. The trade-offs are more tables and joins, and the need for automation (hence dbt and datavault4dbt).

For the full rule checklist (entity variants, required fields, hub/link/satellite rules, deprecated practices, hard vs soft rules), see `data-vault-standards.md`.
