/** The dbt project this guide is built around: model files as you would write them with datavault4dbt. */

export type Layer = 'seed' | 'stage' | 'hub' | 'link' | 'sat' | 'bv' | 'mart'
export type Materialization = 'seed' | 'view' | 'incremental' | 'table'

export interface DbtModel {
  name: string
  layer: Layer
  materialized: Materialization
  macro?: string
  deps: string[]
  description: string
  code: string
}

const cfg = (m: Materialization) => `{{ config(materialized='${m}') }}`

export const MODELS: DbtModel[] = [
  ...['customer', 'nation', 'customer_phone', 'orders'].map<DbtModel>((s) => ({
    name: `raw_${s}`,
    layer: 'seed',
    materialized: 'seed',
    deps: [],
    description: `Landed source extract (seeds/raw_${s}.csv). In real projects this is a source() on your landing zone.`,
    code: `# seeds/raw_${s}.csv — one file per daily full load, every row carries ldts + rsrc`,
  })),
  {
    name: 'stg_customer',
    layer: 'stage',
    materialized: 'view',
    macro: 'stage',
    deps: ['raw_customer'],
    description: 'Adds hashkeys, the hashdiff, ldts/rsrc and the two ghost records. Everything downstream only reads from stages.',
    code: `${cfg('view')}

{%- set yaml_metadata -%}
source_model: 'raw_customer'
ldts: 'ldts'
rsrc: 'rsrc'
hashed_columns:
    hk_customer_h:
        - c_custkey
    hk_nation_h:
        - c_nationkey
    hk_customer_nation_l:
        - c_custkey
        - c_nationkey
    hd_customer_n_s:
        is_hashdiff: true
        columns:
            - c_name
            - c_address
            - c_mktsegment
            - c_acctbal
            - c_comment
{%- endset -%}

{{ datavault4dbt.stage(yaml_metadata=yaml_metadata) }}`,
  },
  {
    name: 'stg_nation',
    layer: 'stage',
    materialized: 'view',
    macro: 'stage',
    deps: ['raw_nation'],
    description: 'Nation stage: hashkey on n_nationkey, hashdiff over name and region.',
    code: `${cfg('view')}

{%- set yaml_metadata -%}
source_model: 'raw_nation'
ldts: 'ldts'
rsrc: 'rsrc'
hashed_columns:
    hk_nation_h:
        - n_nationkey
    hd_nation_n_s:
        is_hashdiff: true
        columns: [n_name, n_region]
{%- endset -%}

{{ datavault4dbt.stage(yaml_metadata=yaml_metadata) }}`,
  },
  {
    name: 'stg_customer_phone',
    layer: 'stage',
    materialized: 'view',
    macro: 'stage',
    deps: ['raw_customer_phone'],
    description: 'Several phones per customer and load: the multi-active key phone_type goes into the hashdiff config.',
    code: `${cfg('view')}

{%- set yaml_metadata -%}
source_model: 'raw_customer_phone'
ldts: 'ldts'
rsrc: 'rsrc'
hashed_columns:
    hk_customer_h:
        - c_custkey
    hd_customer_phone_ma_s:
        is_hashdiff: true
        columns: [phone_type, phone_number]
multi_active_config:
    multi_active_key: 'phone_type'
    main_hashkey_column: 'hk_customer_h'
{%- endset -%}

{{ datavault4dbt.stage(yaml_metadata=yaml_metadata) }}`,
  },
  {
    name: 'stg_orders',
    layer: 'stage',
    materialized: 'view',
    macro: 'stage',
    deps: ['raw_orders'],
    description: 'Orders are events: the non-historized link hashkey combines order and customer.',
    code: `${cfg('view')}

{%- set yaml_metadata -%}
source_model: 'raw_orders'
ldts: 'ldts'
rsrc: 'rsrc'
hashed_columns:
    hk_order_h: [o_orderkey]
    hk_customer_h: [o_custkey]
    hk_order_customer_nh_l: [o_orderkey, o_custkey]
{%- endset -%}

{{ datavault4dbt.stage(yaml_metadata=yaml_metadata) }}`,
  },
  {
    name: 'customer_h',
    layer: 'hub',
    materialized: 'incremental',
    macro: 'hub',
    deps: ['stg_customer', 'stg_orders'],
    description: 'One row per customer business key, ever. Fed by two sources: a customer only seen on an order still gets a hub row.',
    code: `${cfg('incremental')}

{%- set yaml_metadata -%}
hashkey: 'hk_customer_h'
business_keys:
    - c_custkey
source_models:
    - name: stg_customer
      rsrc_static: 'crm/customer'
    - name: stg_orders
      bk_columns: [o_custkey]
      rsrc_static: 'shop/orders'
{%- endset -%}

{{ datavault4dbt.hub(yaml_metadata=yaml_metadata) }}`,
  },
  {
    name: 'nation_h',
    layer: 'hub',
    materialized: 'incremental',
    macro: 'hub',
    deps: ['stg_nation'],
    description: 'One row per nation key.',
    code: `${cfg('incremental')}

{%- set yaml_metadata -%}
hashkey: 'hk_nation_h'
business_keys: [n_nationkey]
source_models: stg_nation
{%- endset -%}

{{ datavault4dbt.hub(yaml_metadata=yaml_metadata) }}`,
  },
  {
    name: 'order_h',
    layer: 'hub',
    materialized: 'incremental',
    macro: 'hub',
    deps: ['stg_orders'],
    description: 'One row per order key.',
    code: `${cfg('incremental')}

{%- set yaml_metadata -%}
hashkey: 'hk_order_h'
business_keys: [o_orderkey]
source_models: stg_orders
{%- endset -%}

{{ datavault4dbt.hub(yaml_metadata=yaml_metadata) }}`,
  },
  {
    name: 'customer_nation_l',
    layer: 'link',
    materialized: 'incremental',
    macro: 'link',
    deps: ['stg_customer'],
    description: 'One row per customer–nation combination ever observed. A move creates a new link row; the old one is never updated.',
    code: `${cfg('incremental')}

{%- set yaml_metadata -%}
link_hashkey: 'hk_customer_nation_l'
foreign_hashkeys:
    - 'hk_customer_h'
    - 'hk_nation_h'
source_models: stg_customer
{%- endset -%}

{{ datavault4dbt.link(yaml_metadata=yaml_metadata) }}`,
  },
  {
    name: 'order_customer_nh_l',
    layer: 'link',
    materialized: 'incremental',
    macro: 'nh_link',
    deps: ['stg_orders'],
    description: 'Non-historized link: each order is an immutable event, so its payload sits directly on the link.',
    code: `${cfg('incremental')}

{%- set yaml_metadata -%}
link_hashkey: 'hk_order_customer_nh_l'
foreign_hashkeys:
    - 'hk_order_h'
    - 'hk_customer_h'
payload:
    - o_orderdate
    - o_totalprice
source_models: stg_orders
{%- endset -%}

{{ datavault4dbt.nh_link(yaml_metadata=yaml_metadata) }}`,
  },
  {
    name: 'customer_n_s',
    layer: 'sat',
    materialized: 'incremental',
    macro: 'sat_v0',
    deps: ['stg_customer'],
    description: 'Descriptive customer attributes. A new row only when hd_customer_n_s differs from the latest version of that key.',
    code: `${cfg('incremental')}

{%- set yaml_metadata -%}
parent_hashkey: 'hk_customer_h'
src_hashdiff: 'hd_customer_n_s'
src_payload:
    - c_name
    - c_address
    - c_mktsegment
    - c_acctbal
    - c_comment
source_model: 'stg_customer'
{%- endset -%}

{{ datavault4dbt.sat_v0(yaml_metadata=yaml_metadata) }}`,
  },
  {
    name: 'customer_n_s_v1',
    layer: 'sat',
    materialized: 'view',
    macro: 'sat_v1',
    deps: ['customer_n_s'],
    description: 'View on top of the v0 satellite: adds the load end date (ledts) and an is_current flag.',
    code: `${cfg('view')}

{%- set yaml_metadata -%}
sat_v0: 'customer_n_s'
hashkey: 'hk_customer_h'
hashdiff: 'hd_customer_n_s'
ledts_alias: 'ledts'
add_is_current_flag: true
{%- endset -%}

{{ datavault4dbt.sat_v1(yaml_metadata=yaml_metadata) }}`,
  },
  {
    name: 'nation_n_s',
    layer: 'sat',
    materialized: 'incremental',
    macro: 'sat_v0',
    deps: ['stg_nation'],
    description: 'Nation attributes over time.',
    code: `${cfg('incremental')}

{%- set yaml_metadata -%}
parent_hashkey: 'hk_nation_h'
src_hashdiff: 'hd_nation_n_s'
src_payload: [n_name, n_region]
source_model: 'stg_nation'
{%- endset -%}

{{ datavault4dbt.sat_v0(yaml_metadata=yaml_metadata) }}`,
  },
  {
    name: 'customer_phone_ma_s',
    layer: 'sat',
    materialized: 'incremental',
    macro: 'ma_sat_v0',
    deps: ['stg_customer_phone'],
    description: 'Multi-active satellite: several active rows per customer (one per phone_type). The whole set is versioned together.',
    code: `${cfg('incremental')}

{%- set yaml_metadata -%}
parent_hashkey: 'hk_customer_h'
src_hashdiff: 'hd_customer_phone_ma_s'
src_ma_key: 'phone_type'
src_payload:
    - phone_number
source_model: 'stg_customer_phone'
{%- endset -%}

{{ datavault4dbt.ma_sat_v0(yaml_metadata=yaml_metadata) }}`,
  },
  {
    name: 'customer_nation_es',
    layer: 'sat',
    materialized: 'incremental',
    macro: 'eff_sat_v0',
    deps: ['stg_customer'],
    description: 'Effectivity satellite on the link: is this customer–nation relationship currently delivered by the source?',
    code: `${cfg('incremental')}

{%- set yaml_metadata -%}
tracked_hashkey: 'hk_customer_nation_l'
is_active_alias: 'is_active'
source_model: 'stg_customer'
source_is_single_batch: true
{%- endset -%}

{{ datavault4dbt.eff_sat_v0(yaml_metadata=yaml_metadata) }}`,
  },
  {
    name: 'customer_rts',
    layer: 'sat',
    materialized: 'incremental',
    macro: 'rec_track_sat',
    deps: ['stg_customer', 'stg_orders'],
    description: 'Record-tracking satellite: in which load and source was each customer key seen?',
    code: `${cfg('incremental')}

{%- set yaml_metadata -%}
tracked_hashkey: 'hk_customer_h'
source_models:
    - name: stg_customer
      rsrc_static: 'crm/customer'
    - name: stg_orders
      hk_column: 'hk_customer_h'
      rsrc_static: 'shop/orders'
{%- endset -%}

{{ datavault4dbt.rec_track_sat(yaml_metadata=yaml_metadata) }}`,
  },
  {
    name: 'control_snap_v0',
    layer: 'bv',
    materialized: 'incremental',
    macro: 'control_snap_v0',
    deps: [],
    description: 'Snapshot calendar: one row per daily snapshot timestamp (sdts).',
    code: `${cfg('incremental')}

{%- set yaml_metadata -%}
start_date: '2024-01-01'
daily_snapshot_time: '07:00:00'
{%- endset -%}

{{ datavault4dbt.control_snap_v0(yaml_metadata=yaml_metadata) }}`,
  },
  {
    name: 'control_snap_v1',
    layer: 'bv',
    materialized: 'view',
    macro: 'control_snap_v1',
    deps: ['control_snap_v0'],
    description: 'Adds is_active and a retention policy (log_logic): which snapshots should PITs keep?',
    code: `${cfg('view')}

{%- set yaml_metadata -%}
control_snap_v0: 'control_snap_v0'
log_logic:
    daily:
        duration: 3
        unit: 'MONTH'
    weekly:
        duration: 1
        unit: 'YEAR'
    monthly:
        forever: true
{%- endset -%}

{{ datavault4dbt.control_snap_v1(yaml_metadata=yaml_metadata) }}`,
  },
  {
    name: 'customer_pit',
    layer: 'bv',
    materialized: 'incremental',
    macro: 'pit',
    deps: ['customer_h', 'customer_n_s', 'customer_phone_ma_s', 'control_snap_v1'],
    description: 'Point-in-time table: for each customer and active snapshot, which version of each satellite was valid.',
    code: `{{ config(materialized='incremental',
          post_hook="{{ datavault4dbt.clean_up_pit('control_snap_v1') }}") }}

{%- set yaml_metadata -%}
pit_type: 'Regular PIT'
tracked_entity: 'customer_h'
hashkey: 'hk_customer_h'
sat_names:
    - customer_n_s
    - customer_phone_ma_s
snapshot_relation: 'control_snap_v1'
snapshot_trigger_column: 'is_active'
dimension_key: 'hk_customer_d'
{%- endset -%}

{{ datavault4dbt.pit(yaml_metadata=yaml_metadata) }}`,
  },
  {
    name: 'dim_customer',
    layer: 'mart',
    materialized: 'view',
    deps: ['customer_pit', 'customer_n_s', 'customer_phone_ma_s'],
    description: 'A plain SQL dimension for BI tools: PIT pointers turn history joins into equi-joins.',
    code: `${cfg('view')}

SELECT
    pit.hk_customer_d,
    pit.sdts,
    s.c_name,
    s.c_address,
    s.c_mktsegment,
    ph.phone_number AS mobile_phone
FROM {{ ref('customer_pit') }} pit
JOIN {{ ref('customer_n_s') }} s
  ON s.hk_customer_h = pit.hk_customer_n_s
 AND s.ldts          = pit.ldts_customer_n_s
LEFT JOIN {{ ref('customer_phone_ma_s') }} ph
  ON ph.hk_customer_h = pit.hk_customer_phone_ma_s
 AND ph.ldts          = pit.ldts_customer_phone_ma_s
 AND ph.phone_type    = 'mobile'`,
  },
]

export const MODEL = Object.fromEntries(MODELS.map((m) => [m.name, m])) as Record<string, DbtModel>

export const LAYER_META: Record<Layer, { label: string; color: string; ring: string; text: string }> = {
  seed: { label: 'Seed / landing', color: 'bg-zinc-500', ring: 'ring-zinc-400/50', text: 'text-zinc-600 dark:text-zinc-400' },
  stage: { label: 'Stage', color: 'bg-slate-500', ring: 'ring-slate-400/50', text: 'text-slate-300' },
  hub: { label: 'Hub', color: 'bg-sky-500', ring: 'ring-sky-400/50', text: 'text-sky-400' },
  link: { label: 'Link', color: 'bg-emerald-500', ring: 'ring-emerald-400/50', text: 'text-emerald-400' },
  sat: { label: 'Satellite', color: 'bg-amber-500', ring: 'ring-amber-400/50', text: 'text-amber-400' },
  bv: { label: 'Business vault', color: 'bg-violet-500', ring: 'ring-violet-400/50', text: 'text-violet-400' },
  mart: { label: 'Mart', color: 'bg-rose-500', ring: 'ring-rose-400/50', text: 'text-rose-400' },
}
