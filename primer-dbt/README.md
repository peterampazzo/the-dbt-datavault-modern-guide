# Plain-dbt primer project

This small DuckDB project is the source of truth for the plain-dbt examples in chapter 4. The compile script loads the fictional rows from `src/lib/dv/dataset.ts`, runs dbt, and captures its model and test SQL in `src/lib/primer/compiled.json`.

Install `requirements.txt`, then run `pnpm primer:compile` from the repository root. The generated JSON is committed and must not be edited by hand. The temporary database and dbt `target/` directory are removed when compilation finishes.

The browser replays captured SQL in DuckDB-WASM only on pages 4.3, 4.6 and 4.7. dbt itself runs at build time, not in the browser.
