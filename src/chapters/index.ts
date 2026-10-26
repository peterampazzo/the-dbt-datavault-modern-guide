import { lazy } from 'react'

export type Audience = 'essential' | 'skim-if-dv' | 'practitioner'
export type ChapterQuiz = { q: string; options: string[]; answer: number; why: string }

type ChapterDefinition = {
  slug: string
  title: string
  short: string
  minutes: number
  part: 1 | 2 | 3 | 4
  audience: Audience
  summary: [string, string, string]
  recap: [string, string, string]
  quiz: [ChapterQuiz, ChapterQuiz, ...ChapterQuiz[]]
  Component: ReturnType<typeof lazy>
}

export const PARTS = [
  { n: 1, title: 'The method' },
  { n: 2, title: 'Building it with dbt' },
  { n: 3, title: 'Going further' },
  { n: 4, title: 'Running it for real' },
] as const

export const CHAPTERS = [
  {
    slug: 'what-is-data-vault',
    title: 'What is Data Vault',
    short: 'Basics',
    minutes: 6,
    part: 1,
    audience: 'skim-if-dv',
    summary: [
      'Data Vault splits a warehouse into hubs (business keys), links (relationships) and satellites (descriptive history).',
      'New sources and changes arrive as new rows and new tables, not by rewriting what is already there.',
      'It sits between staging and the marts; the business vault adds PITs and bridges to make it easy to query.',
    ],
    recap: [
      'A hub holds a business key, a link holds a relationship, and a satellite holds descriptive history for one hub or link.',
      'Unified decomposition separates identity, relationships and changing context, then relates them through shared keys.',
      'The raw vault preserves source history; business rules and query helpers belong above it.',
    ],
    quiz: [
      {
        q: 'Where does a customer name belong?',
        options: ['In the customer hub', 'In a satellite attached to the customer hub', 'In a link between customer and nation'],
        answer: 1,
        why: 'A name is descriptive context, so it belongs in a satellite for the customer hub.',
      },
      {
        q: 'What does a Data Vault link represent?',
        options: ['A relationship between hubs', 'A list of a hub’s descriptive attributes', 'A report-ready star schema'],
        answer: 0,
        why: 'Links record relationships between business concepts represented by hubs.',
      },
    ],
    Component: lazy(() => import('./WhatIsDataVault')),
  },
  {
    slug: 'modelling',
    title: 'Modelling three datasets',
    short: 'Modelling',
    minutes: 6,
    part: 1,
    audience: 'skim-if-dv',
    summary: [
      'Start with the business keys: customer, nation and order each become a hub.',
      'Each relationship between keys becomes a link, such as customer to nation and order to customer.',
      'Descriptive columns go into satellites, split by source and by how often they change.',
    ],
    recap: [
      'Identify core business concepts and choose stable business keys before designing tables.',
      'Model natural relationships as links, grouping the keys that form one unit of work.',
      'Split satellite context by source, rate of change, subject area or sensitivity.',
    ],
    quiz: [
      {
        q: 'Which dataset columns are the first candidates for hubs?',
        options: ['Customer, nation and order business keys', 'Customer names and addresses', 'Order dates and prices'],
        answer: 0,
        why: 'Hubs identify core business concepts with their business keys.',
      },
      {
        q: 'What should usually happen when a customer moves to another nation?',
        options: ['Update the old link row', 'Add a link row for the new relationship', 'Move nation attributes into the customer hub'],
        answer: 1,
        why: 'Raw-vault links are insert-only; a newly observed relationship gets a new row.',
      },
    ],
    Component: lazy(() => import('./Modelling')),
  },
  {
    slug: 'dv-names',
    title: "Data Vault in this guide's names",
    short: 'Names',
    minutes: 2,
    part: 1,
    audience: 'practitioner',
    summary: [
      'Model names use suffixes such as _h, _l and _s to show the vault object type.',
      'The guide uses datavault4dbt names such as sat_v0, ma_sat_v0, eff_sat_v0 and control_snap_v1.',
      'Hashkey, hashdiff, load date, record source and ghost-row names match the guide’s models.',
    ],
    recap: [
      'The guide’s model names use _h for hubs, _l for links and _s for standard satellites.',
      'Variant satellites and snapshot/PIT helpers use the exact names shown in datavault4dbt models.',
      'hk_, hd_, ldts and rsrc identify keys, payload fingerprints, load time and record source.',
    ],
    quiz: [
      {
        q: 'Which model is the customer hub?',
        options: ['customer_h', 'customer_n_s', 'customer_nation_l'],
        answer: 0,
        why: 'The _h suffix identifies the hub; customer_h stores the customer business key.',
      },
      {
        q: 'Which object is the guide’s multi-active satellite?',
        options: ['customer_rts', 'customer_phone_ma_s', 'customer_nation_es'],
        answer: 1,
        why: 'customer_phone_ma_s is the phone satellite with a multi-active key.',
      },
    ],
    Component: lazy(() => import('./DvNames')),
  },
  {
    slug: 'dbt',
    title: 'Building it with dbt',
    short: 'dbt',
    minutes: 7,
    part: 2,
    audience: 'essential',
    summary: [
      'datavault4dbt turns a few lines of YAML per model into the stage, hub, link and satellite SQL.',
      'The stage model computes hashkeys and hashdiffs once, and every vault table reuses them.',
      'dbt build runs the models in dependency order: stage first, then hubs, links and satellites.',
    ],
    recap: [
      'A dbt model is a SQL file; ref() declares dependencies so dbt can build the project graph.',
      'datavault4dbt macros read YAML metadata and generate SQL for Data Vault objects.',
      'dbt build follows dependencies, so stages run before the vault models that use them.',
    ],
    quiz: [
      {
        q: 'Where does the guide compute hashkeys and hashdiffs?',
        options: ['In each satellite macro separately', 'In the stage models', 'In the PIT model'],
        answer: 1,
        why: 'The stage models calculate hashes once so downstream vault models reuse the columns.',
      },
      {
        q: 'What tells dbt that a vault model depends on a stage?',
        options: ['A ref() call', 'The file name alone', 'The model description'],
        answer: 0,
        why: 'ref() creates a dependency in dbt’s model graph and determines build order.',
      },
    ],
    Component: lazy(() => import('./BuildWithDbt')),
  },
  {
    slug: 'hash-lab',
    title: 'Hash lab',
    short: 'Hashing',
    minutes: 5,
    part: 2,
    audience: 'essential',
    summary: [
      'A hashkey is the MD5 (or SHA-256) of the trimmed, upper-cased business key, with parts joined by ||.',
      'A NULL part becomes ^^, and a key that is all NULL maps to the zero key.',
      'A hashdiff fingerprints a satellite’s payload: if it changes, the satellite gets a new row.',
    ],
    recap: [
      'The guide’s default hash standard casts and trims values, uses ^^ for NULL and joins parts with ||.',
      'Hashkeys are upper-cased; hashdiffs are case-sensitive and detect payload changes.',
      'Unknown and error ghost keys let downstream joins retain rows with missing references.',
    ],
    quiz: [
      {
        q: 'What does a hashdiff help the satellite loader decide?',
        options: ['Whether payload changed since the latest row', 'Which hub owns a business key', 'Which snapshot date to create'],
        answer: 0,
        why: 'The loader compares the staged hashdiff with the latest satellite hashdiff to detect change.',
      },
      {
        q: 'What placeholder does the guide use for a NULL hash input?',
        options: ['NULL', '^^', '0000…'],
        answer: 1,
        why: 'The default standard uses ^^ for a NULL part; all-NULL input maps to the unknown zero key.',
      },
    ],
    Component: lazy(() => import('./HashLab')),
  },
  {
    slug: 'load-player',
    title: 'Loading, batch by batch',
    short: 'Loading',
    minutes: 6,
    part: 2,
    audience: 'essential',
    summary: [
      'Each batch lands in staging, is hashed, then loads the hubs, links and satellites.',
      'Hubs and links are insert-only: a key that is already in the vault is skipped.',
      'A satellite gets a new row only when the hashdiff differs from the latest row for that key.',
    ],
    recap: [
      'A load passes from landed rows to stages, then to hubs, links and satellites.',
      'Hubs and links insert new keys or relationships; existing raw-vault rows are not updated.',
      'Satellite versions are inserted when the latest hashdiff differs from the staged one.',
    ],
    quiz: [
      {
        q: 'What does the incremental high-water mark do in this simulation?',
        options: ['Reads only staged rows newer than the latest loaded ldts', 'Updates old hub keys', 'Deletes records absent from the current batch'],
        answer: 0,
        why: 'The incremental run selects staged rows with an ldts later than the latest loaded timestamp.',
      },
      {
        q: 'What happens when an existing relationship is seen again?',
        options: ['The link row is updated', 'It is skipped as already present', 'The related hub is deleted'],
        answer: 1,
        why: 'Links are insert-only; an existing link hashkey is not inserted a second time.',
      },
    ],
    Component: lazy(() => import('./LoadPlayer')),
  },
  {
    slug: 'satellite-flavours',
    title: 'Satellite flavours',
    short: 'Satellites',
    minutes: 4,
    part: 3,
    audience: 'essential',
    summary: [
      'A standard satellite keeps every version of a key’s attributes, each with its load date.',
      'The v1 view adds an end date to each version, so you can see when it was valid.',
      'Other flavours (multi-active, effectivity and record-tracking satellites) fit data that changes differently.',
    ],
    recap: [
      'sat_v0 is the insert-only satellite table; sat_v1 derives end dates and a current flag as a view.',
      'A multi-active satellite versions the active set together, using its multi-active key to distinguish rows.',
      'Effectivity tracks link activity; record tracking records which loads and sources observed a key.',
    ],
    quiz: [
      {
        q: 'What does sat_v1 add to sat_v0 in this guide?',
        options: ['A derived load end date and is_current flag', 'A new business key', 'An update that overwrites old payloads'],
        answer: 0,
        why: 'The v1 view derives ledts from the next ldts and marks the open version as current.',
      },
      {
        q: 'What does a record-tracking satellite record?',
        options: ['Every payload attribute', 'Loads and sources where a key appeared', 'Whether a link is active'],
        answer: 1,
        why: 'Record tracking has no payload; it logs observation by load and source.',
      },
    ],
    Component: lazy(() => import('./SatelliteFlavours')),
  },
  {
    slug: 'pit',
    title: 'Business vault: snapshots and PITs',
    short: 'PIT',
    minutes: 3,
    part: 3,
    audience: 'essential',
    summary: [
      'A snapshot table lists the moments you want to report on.',
      'A PIT table stores, per customer and snapshot, which satellite row was valid at that moment.',
      'Joining through the PIT gives plain equality joins instead of date-range joins.',
    ],
    recap: [
      'The snapshot control defines the dates at which PIT rows are built.',
      'A PIT stores a pointer to the satellite version valid for each tracked key and snapshot.',
      'PIT pointers turn repeated time-range lookups into equality joins; missing rows can point to a ghost.',
    ],
    quiz: [
      {
        q: 'What does a snapshot control table define?',
        options: ['The reporting snapshot dates', 'Which source owns a hub', 'The hash algorithm'],
        answer: 0,
        why: 'The control snapshot provides the snapshot dates that trigger PIT rows.',
      },
      {
        q: 'What does a PIT row point to?',
        options: ['The valid satellite row for a key at a snapshot', 'The source file for the next load', 'A row in the customer hub only'],
        answer: 0,
        why: 'A PIT stores the hashkey and load date of the satellite version valid at its snapshot.',
      },
    ],
    Component: lazy(() => import('./Pit')),
  },
  {
    slug: 'dbt-project',
    title: 'The whole dbt project',
    short: 'Lineage',
    minutes: 3,
    part: 3,
    audience: 'essential',
    summary: [
      'The lineage graph shows every model, from seeds to the PIT.',
      'Select a model to see its code and what it depends on.',
      'The arrows follow the order in which dbt build runs the project.',
    ],
    recap: [
      'The dbt graph connects landed data, stages, raw-vault models and business-vault helpers.',
      'Each ref() dependency becomes an edge in the project lineage.',
      'dbt build follows the graph from upstream inputs to downstream models.',
    ],
    quiz: [
      {
        q: 'What does an arrow into a dbt model show?',
        options: ['A model dependency', 'A satellite end date', 'A relationship’s effectivity'],
        answer: 0,
        why: 'The lineage arrows represent dbt model dependencies.',
      },
      {
        q: 'Which layer normally feeds the raw-vault models in this guide?',
        options: ['Stage models', 'Information marts', 'PIT outputs'],
        answer: 0,
        why: 'The raw-vault models depend on staging models that prepare source rows and hashes.',
      },
    ],
    Component: lazy(() => import('./Lineage')),
  },
  {
    slug: 'replay',
    title: 'Replay: one history, two shapes',
    short: 'Replay',
    minutes: 6,
    part: 4,
    audience: 'essential',
    summary: [
      'Persistent staging preserves the source deliveries; the raw vault is a derived view of them.',
      'A full refresh can rebuild changed models only from inputs that are still available.',
      'Compare rebuilt tables with production and guard raw-vault models until replay is safe.',
    ],
    recap: [
      'Persistent staging is append-only evidence of what each source sent and when.',
      'The raw vault is derived from that evidence, so a changed model needs the source history to rebuild all versions.',
      'A full refresh does not restore deliveries that were deleted from landing.',
    ],
    quiz: [
      {
        q: 'What lets a changed model replay the full source history?',
        options: ['Keep every delivery in persistent staging', 'Run a full refresh after truncating landing', 'Add more columns to the current vault'],
        answer: 0,
        why: 'The changed model needs the original deliveries; a refresh cannot recreate deleted source data.',
      },
      {
        q: 'What can --full-refresh rebuild after landing was truncated?',
        options: ['Every historical delivery', 'Only the data still available to the model', 'The deleted source files'],
        answer: 1,
        why: 'A full refresh rebuilds from current inputs; it does not restore unavailable history.',
      },
    ],
    Component: lazy(() => import('./Replay')),
  },
  {
    slug: 'one-lake',
    title: 'One lake, any engine',
    short: 'One lake',
    minutes: 4,
    part: 4,
    audience: 'essential',
    summary: [
      'Open Delta files can hold source history while different Spark engines read them in place.',
      'Staging and vault layers are derived from the source copy and can be rebuilt.',
      'Named engine-specific macros and consistent hash rules help keep dbt models portable.',
    ],
    recap: [
      'Keep source history in open storage; change the compute connection rather than copying the source data.',
      'Only persistent staging is source data; dv_stage, raw_vault, business_vault and gold are derived.',
      'Keep engine differences in named macros and vars, and test identical hashkeys on both engines.',
    ],
    quiz: [
      {
        q: 'Which layer holds the original source data?',
        options: ['Persistent staging', 'The raw vault', 'Gold'],
        answer: 0,
        why: 'Persistent staging preserves the source deliveries; later layers are derived.',
      },
      {
        q: 'Where should engine-specific SQL details go?',
        options: ['Named macros and vars', 'Every raw-vault model', 'The business keys'],
        answer: 0,
        why: 'Named macros and vars isolate engine differences and keep model code portable.',
      },
    ],
    Component: lazy(() => import('./OneLake')),
  },
] as const satisfies readonly ChapterDefinition[]
