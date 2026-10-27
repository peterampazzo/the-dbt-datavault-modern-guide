# The three datasets

Fictional TPC-H-style data in three daily full loads (`BATCHES` in `src/lib/dv/dataset.ts`, `2024-01-01..03 06:00`).

| Source | Columns | Vault |
|---|---|---|
| `customer` (crm) | `c_custkey`, `c_name`, `c_address`, `c_nationkey`, `c_mktsegment`, `c_acctbal`, `c_comment` | `c_custkey` → `customer_h`. `c_custkey` + `c_nationkey` → `customer_nation_l`. Descriptive fields → `customer_n_s`. `c_acctbal` can split into `customer_balance_s` (rate of change). |
| `nation` (erp) | `n_nationkey`, `n_name`, `n_region` | `n_nationkey` → `nation_h`. Name and region → `nation_n_s`. |
| `orders` (shop) | `o_orderkey`, `o_custkey`, `o_orderdate`, `o_totalprice` | `o_orderkey` → `order_h`. `o_custkey` also feeds `customer_h` (`bk_columns`). The order–customer relationship → `order_customer_nh_l` with date and price as payload. |
| `customer_phone` (crm) | `c_custkey`, `phone_type`, `phone_number` | → `customer_phone_ma_s` (multi-active). |
| `customer` (shop) | `c_custkey`, `c_name`, `c_address` | → `customer_shop_s`, then the integrated business-vault satellite. |

Derived: `customer_nation_es` (effectivity), `customer_rts` (record tracking), `customer_n_s_v1`, `control_snap_v0/v1`, `customer_pit`, `dim_customer`.

## What each batch demonstrates (`STORY`)

1. **Initial load**: five customers, six nations, phones, three orders. Everything is new.
2. **Day two**: Bruno moves (new satellite version). Chiara changes nation (new link, effectivity flip). Daniel is missing (record tracking gap). Farah is new. Alice adds a work phone (multi-active set versioned).
3. **Day three**: Alice changes segment (new version). Daniel returns unchanged (no new row). Emi's comment gains trailing spaces (trimmed, so no change). Germany is renamed "Deutschland". Gabriel is new.

Optional: a late-arriving customer with an `ldts` below the high-water mark, which gets skipped.

Keep chapter copy consistent with these outcomes. `engine.test.ts` asserts the counts.

The web-shop customer feed is a second profile for a subset of keys. Alice agrees with
the CRM, Bruno changes address and briefly uses the name “Bruno C.”, Chiara later uses
“Kiki Rossi”, and Hana (#8) exists only in the shop feed. The business vault can choose
CRM-first or shop-first per attribute without changing the raw source satellites.

The replay lab also exports `CUSTOMER_EMAIL`, keyed by delivery batch and `c_custkey`. It is joined only for the `new-column` replay preset; Bruno's email changes in the third delivery so the added attribute creates a new satellite version without changing the default simulation.
