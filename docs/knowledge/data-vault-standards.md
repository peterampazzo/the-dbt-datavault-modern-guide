# Data Vault 2.0 modelling rules (checklist)

A condensed, own-words checklist of the Data Vault 2.0 modelling standard, for agents writing or reviewing content. It complements `data-vault-method.md`, which covers the *how* (modelling steps and layers); this file covers the *rules*. When content and this list disagree, fix the content.

## Entity catalogue

| Family | Variant | Use it when | datavault4dbt |
|---|---|---|---|
| Hub | standard | a business concept is identified by a business key | `hub` |
| Hub | stub hub | the key is known, but its sources or satellites are out of scope for this iteration; a placeholder you extend later | `hub` (no satellites yet) |
| Link | standard | a unique relationship (unit of work) between two or more hubs | `link` |
| Link | hierarchical | parent/child between keys of the *same* hub (e.g. a part made of parts) | `link` with two keys from one hub |
| Link | same-as | two keys of the same hub mean the same thing (deduplication, master data) | `link` |
| Link | non-historised | events or transactions that never change; the payload may sit on the link | `nh_link` |
| Satellite | standard | descriptive attributes of one hub or link, versioned by hashdiff | `sat_v0` + `sat_v1` |
| Satellite | multi-active | several valid rows per key at once (phone numbers); needs a multi-active key | `ma_sat_v0` + `ma_sat_v1` |
| Satellite | effectivity | when a relationship starts and stops being true (the driving key changes its partner) | `eff_sat_v0` |
| Satellite | system-driven | produced by system processes, not by a source of record; can be dropped and rebuilt (e.g. record tracking) | `rec_track_sat` |
| Other | reference table | code lists and lookups, not business keys | `ref_hub`, `ref_sat_v0`/`v1`, `ref_table` |
| Other | PIT / bridge | query helpers in the business vault; can be rebuilt | `pit`, `control_snap_v0`/`v1` |

## Required and optional fields

- **Required everywhere:** load date timestamp (`ldts`) and record source (`rsrc`).
- **Hub:** the business key(s) and the hashkey derived from them. Composite business keys are allowed.
- **Link:** the hashkeys of its parent hubs, plus its own hashkey over them.
- **Satellite:** the parent hashkey, `ldts`, `rsrc` and the descriptive attributes. The standard makes the hashdiff optional, but datavault4dbt uses it for change detection.
- **Optional:** a business key collision code (BKCC), when two systems use the same key value for different things; applied and extract timestamps.

## Hub rules

- A hub is built on the business key, never on a source system's surrogate or sequence key.
- One hub per business concept; it consolidates the keys from every source that uses them.
- A hub stands alone: no foreign keys to other hubs and no descriptive data.
- Insert-only: a key is loaded once, with the `ldts` and `rsrc` of its first arrival.

## Link rules

- A link records that a relationship *exists*; it carries no validity period. When a relationship starts or ends goes into an effectivity satellite.
- A link's grain is the set of hubs it joins. Changing the grain (adding or removing a hub) means a new link, not an altered one.
- The **driving key** is the part of the link key that stays stable. It decides which relationship an effectivity satellite end-dates when the other side changes.
- Link satellites are optional. Links are insert-only, like hubs.

## Satellite rules

- **One parent only:** a satellite hangs off exactly one hub or one link, never off another satellite (no snowflaking).
- Split satellites by source system, by rate of change, and by sensitivity or classification. The default is one satellite per source.
- Splitting or merging later is allowed, as long as no history and no audit trail is lost.
- Insert a new row only when the hashdiff changes; never update in place.

## Deprecated practices (and what replaces them)

| Don't (old practice) | Why it went | Do instead |
|---|---|---|
| Physical load end-dates in raw satellites | they need updates, scale badly, and break when data arrives out of order | compute end-dates virtually: `sat_v1` is a view over the insert-only `sat_v0` |
| "Last seen" dates on hubs and links | they need physical updates too | a record tracking satellite (`rec_track_sat`) |
| Sequence surrogate keys on hubs and satellites | they need lookups, force a load order and don't parallelise | hashkeys computed in staging |

## Architecture: where rules are applied

- **Hard rules** (aligning data types, trimming, hashing, adding `ldts` and `rsrc`) are applied before or in staging. They never change the meaning of the data.
- **Soft (business) rules** (cleansing, derivations, KPIs, deduplication) never touch the raw vault. They live in the business vault (computed satellites, PITs, bridges) or in the information marts.
- The raw vault is auditable, source-aligned history. A table that can't be rebuilt from the sources belongs in the raw vault; one that can is business vault or mart.
- Layers: landing/staging → raw vault → business vault → information marts (plus error or quality marts if needed).

## Delivery

- Build in small iterations, each scoped to business value. Pick one business question, model only the hubs, links and satellites it needs, deliver a mart, then extend. New sources add new satellites and links without rewriting what exists.
- Stub hubs let an iteration refer to a concept whose sources come later.
- Requirements come from the business concepts and their keys (what the business counts, identifies and relates), not from how the source tables are laid out.

## How the guide uses this

- `sat_v0` / `sat_v1` in the Satellite flavours chapter show the "no physical end-dates" rule; the copy should say so.
- The record tracking tab shows what replaced last-seen dates.
- Relationship validity goes in effectivity satellites, not links. The customer–nation link is a good example if a customer moves to another nation.
- In the dbt chapter, the stage model is where the hard rules live; any business logic in examples goes to the business vault.
- Candidate future content: same-as and hierarchical links, stub hubs, and a visual of hard vs soft rules.
