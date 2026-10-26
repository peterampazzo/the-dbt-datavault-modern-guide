# The dbt + Data Vault modern guide

An interactive guide to Data Vault modelling and building it with dbt and [datavault4dbt](https://github.com/ScalefreeCOM/datavault4dbt).

Three small datasets (customers, nations, orders) are modelled step by step into hubs, links and satellites, then built as dbt models. Hashing, batch loading, satellite variants, PITs and the dbt lineage are all interactive. The loading demos run on a TypeScript simulation of the datavault4dbt defaults (MD5, `||`, `^^`, trimmed and upper-cased hashkeys), covered by unit tests.

## Develop

```bash
pnpm install
pnpm dev      # http://localhost:5173
pnpm test     # vitest
pnpm lint     # oxlint
pnpm build    # type-check + production build
```

Stack: Vite, React 19, TypeScript, Tailwind CSS v4, shadcn/ui (Base UI), Motion, React Flow, Shiki.

## Sources

- Hans Hultgren, *Introductory Guide to Data Vault Modeling* (Genesee Academy, 2019)
- Databricks, *What is a Data Vault?*
- OvalEdge, *Data Vault architecture*
- datavault4dbt wiki
