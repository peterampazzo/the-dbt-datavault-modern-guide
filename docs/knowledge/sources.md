# Reference sources

| Source | Use it for |
|---|---|
| [DV Standards, *Data Vault Modeling Guide* (Hultgren, 2019)](http://dvstandards.com/wp-content/uploads/2021/02/data_vault_modeling_guide_2019_v3.pdf) | The modelling method (steps 1.1 to 3.3), the unified decomposition idea, the four sources of change, satellite split criteria, unit of work. The authority for modelling. |
| [Databricks, *What is a Data Vault?*](https://www.databricks.com/blog/what-is-data-vault) | Hub/link/satellite overview, raw vs business vault, PITs and bridges, mapping to medallion (bronze/silver/gold) in a lakehouse. |
| [OvalEdge, *Data Vault architecture*](https://www.ovaledge.com/blog/data-vault-architecture) | Architecture layers (staging, raw vault, business vault, marts), benefits and trade-offs, comparison with traditional warehouses. |
| [datavault4dbt wiki](https://github.com/ScalefreeCOM/datavault4dbt/wiki) and package source | Macro names, YAML parameters, hashing and loading behaviour. The authority for code. |
| [dbt blog: Data Vault with dbt](https://docs.getdbt.com/blog/data-vault-with-dbt) | How dbt fits: incremental models, `ref()` lineage, automation of repetitive patterns. |

When adding content, cite the source in the chapter's further-reading section.
