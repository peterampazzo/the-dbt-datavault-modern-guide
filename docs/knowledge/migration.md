# Replay and engine portability

## Keep evidence, rebuild models

Persistent staging keeps each source delivery as received, with its arrival time and source identifier. Treat it as append-only evidence: do not rewrite it to match a later model. The raw vault is a derived, organised history by business key. If its model changes, persistent staging gives dbt the inputs to rebuild that history.

If landing data is truncated after each load, an insert-only vault keeps the rows already loaded but cannot recover unmapped columns, discarded source values, filtered rows or older model shapes. A full refresh rebuilds from available inputs; it does not recreate deleted deliveries.

## Use full refresh deliberately

Test a scheduled rebuild in a development target, for example:

```sh
dbt build --full-refresh --target dev
```

Compare row counts and a stable hash-of-hashes for each raw-vault table with the production result. Keep production unchanged during the test. A mismatch calls for investigation into source availability, model rules and reproducibility.

A `full_refresh: false` resource config can protect selected models from a broad `--full-refresh` run. Check that the adapter honours the config. Keep production backups and limit who can run dbt against production. Delta time travel can help undo an accident only until `VACUUM` removes the older files; it is not a substitute for persistent staging.

Plan how persistent staging can delete personal data when needed, such as by partitioning deliveries by subject. This is an engineering design note, not legal advice.

## Keep the project portable

Store source deliveries once in open formats, then point the selected Spark engine at that storage. Keep engine-specific SQL in named macros and vars, and keep the same global hash rules on each target. A cross-engine unit test should prove that the same business keys produce identical hashkeys before switching the raw-vault build.

The source layer stays; derived staging and vault tables can be rebuilt. Permissions, orchestration and BI connections may need to be reconfigured for the new compute engine. Check the dbt and datavault4dbt release notes for current adapter support before planning the move.

## Legacy patterns and hash parity

When replacing hand-written SQL Server loading procedures, keep the raw vault insert-only and move precedence, snapshot and end-date logic into derived dbt models. Persistent staging is the first history source; a one-to-one legacy-vault copy can be loaded as an additional `legacy/...` source when deliveries are unavailable.

Hash parity is a rule comparison, not a guess. Record the input datatype, encoding, delimiter, NULL text, quote character, escaping and upper-casing behavior, then run fixed vectors such as trailing spaces, `ß` and delimiters inside keys. If other systems do not consume the old hashkeys, recompute keys from retained business keys and keep an auditable old-hash → business-key → new-hash map; recompute hashdiffs from payload under the new rule.

## Business vault and checklist

Keep reusable integration rules above the raw vault. A business vault can choose
source precedence, calculate derived measures and create PIT helpers while leaving
the source satellites insert-only. Store the rule in dbt code, test it with fixed
inputs and rebuild it from the raw vault instead of maintaining a second mutable
copy with `MERGE`.

Before a migration cut-over, verify the eight gates in the guide's checklist:
retained deliveries, protected refresh settings, hash parity, business-rule unit
tests, replay, rebuild comparison, a parallel reconciliation and a documented
cut-over. The checklist is a local review aid; its saved state is not warehouse
evidence. Keep the comparison queries and run results with the migration record.
