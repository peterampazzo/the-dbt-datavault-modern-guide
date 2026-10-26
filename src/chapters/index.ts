import { lazy } from 'react'

export const CHAPTERS = [
  { slug: 'what-is-data-vault', title: 'What is Data Vault', short: 'Basics', Component: lazy(() => import('./WhatIsDataVault')) },
  { slug: 'modelling', title: 'Modelling three datasets', short: 'Modelling', Component: lazy(() => import('./Modelling')) },
  { slug: 'dbt', title: 'Building it with dbt', short: 'dbt', Component: lazy(() => import('./BuildWithDbt')) },
  { slug: 'hash-lab', title: 'Hash lab', short: 'Hashing', Component: lazy(() => import('./HashLab')) },
  { slug: 'load-player', title: 'Loading, batch by batch', short: 'Loading', Component: lazy(() => import('./LoadPlayer')) },
  { slug: 'satellite-flavours', title: 'Satellite flavours', short: 'Satellites', Component: lazy(() => import('./SatelliteFlavours')) },
  { slug: 'pit', title: 'Business vault: snapshots and PITs', short: 'PIT', Component: lazy(() => import('./Pit')) },
  { slug: 'dbt-project', title: 'The whole dbt project', short: 'Lineage', Component: lazy(() => import('./Lineage')) },
] as const
