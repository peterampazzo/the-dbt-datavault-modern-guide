# datavault4dbt reference (as used in this guide)

Package: [ScalefreeCOM/datavault4dbt](https://github.com/ScalefreeCOM/datavault4dbt) ([wiki](https://github.com/ScalefreeCOM/datavault4dbt/wiki)). The demos replicate its default behaviour in `src/lib/dv/`.

## Model pattern

Every model is: `config(...)` + a `yaml_metadata` block + one macro call.

```sql
{{ config(materialized='incremental') }}
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
{{ datavault4dbt.hub(yaml_metadata=yaml_metadata) }}
```

## Macros and key YAML

| Macro | Materialization | Key YAML |
|---|---|---|
| `stage` | view | `source_model`, `ldts`, `rsrc`, `hashed_columns` (`is_hashdiff: true` + `columns` for hashdiffs) |
| `hub` | incremental | `hashkey`, `business_keys`, `source_models` (`rsrc_static`, `bk_columns`) |
| `link` | incremental | `link_hashkey`, `foreign_hashkeys`, `source_models` |
| `nh_link` | incremental | `link_hashkey`, `foreign_hashkeys`, `payload`, `source_models` |
| `sat_v0` | incremental | `parent_hashkey`, `src_hashdiff`, `src_payload`, `source_model` |
| `sat_v1` | view | `sat_v0`, `hashkey`, `hashdiff`, `ledts_alias`, `add_is_current_flag` |
| `ma_sat_v0` | incremental | as `sat_v0` plus `src_ma_key` |
| `eff_sat_v0` | incremental | `tracked_hashkey`, `source_model`, `is_active_alias` |
| `rec_track_sat` | incremental | `tracked_hashkey`, `source_models` |
| `control_snap_v0` / `control_snap_v1` | table / view | `start_date`, `daily_snapshot_time`; v1 adds `log_logic` |
| `pit` | incremental | `pit_type`, `tracked_entity`, `hashkey`, `sat_names`, `snapshot_relation`, `snapshot_trigger_column`, `dimension_key` |

Check `src/lib/dv/models.ts` and the package source before adding or changing keys.

## Hashing defaults

- Algorithm **MD5** (SHA256 optional); hex output.
- Values cast to string and **trimmed**. NULL becomes `^^`. Values are wrapped in the quote char `"`, and the delimiter, null placeholder, quote and backslash are escaped.
- Concatenated with `||`.
- **Hashkeys are upper-cased** (case-insensitive). **Hashdiffs are not** (case-sensitive), and hashdiff columns are sorted alphabetically.
- All-NULL input gives the zero key `00000000…` (unknown). The error key is `ffffffff…`.

## Ghost records

The stage adds two rows: **unknown** (`rsrc = 'SYSTEM'`, zero key, `ldts = 0001-01-01 00:00:01`) and **error** (`rsrc = 'ERROR'`, ff key, `ldts = 8888-12-31 23:59:59`). This lets PITs and marts use inner equi-joins.

## Loading semantics

- **High-water mark**: incremental runs read only stage rows with `ldts > max(ldts)` already in the target (excluding the end-of-time ghost). Late rows with older `ldts` are skipped.
- **Hub / link**: union all sources, keep the earliest row per hashkey, insert only hashkeys not in the target.
- **Satellite v0**: insert when the stage hashdiff differs from the latest hashdiff for that parent; deduplicates consecutive identical payloads within a batch.
- **sat_v1**: `ledts = LEAD(ldts) - 1 microsecond` or `8888-12-31 23:59:59`; `is_current` is true for the open row.
- **Multi-active**: the hashdiff covers the whole active set, so any change versions every row in the set.
- **PIT**: one row per tracked key per active snapshot. It stores each satellite's hashkey + `ldts` valid at `sdts`, falling back to the unknown ghost.
