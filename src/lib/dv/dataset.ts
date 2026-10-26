/** A tiny, fictional TPC-H-style extract delivered in three daily full loads. */

export const BATCHES = ['2024-01-01 06:00:00', '2024-01-02 06:00:00', '2024-01-03 06:00:00'] as const
export type Ldts = string

export interface CustomerRow {
  c_custkey: number
  c_name: string
  c_address: string
  c_nationkey: number
  c_mktsegment: string
  c_acctbal: number
  c_comment: string
}
export interface NationRow {
  n_nationkey: number
  n_name: string
  n_region: string
}
export interface PhoneRow {
  c_custkey: number
  phone_type: string
  phone_number: string
}
export interface OrderRow {
  o_orderkey: number
  o_custkey: number
  o_orderdate: string
  o_totalprice: number
}

const nations: NationRow[] = [
  { n_nationkey: 1, n_name: 'Brazil', n_region: 'America' },
  { n_nationkey: 2, n_name: 'Germany', n_region: 'Europe' },
  { n_nationkey: 3, n_name: 'Japan', n_region: 'Asia' },
  { n_nationkey: 4, n_name: 'France', n_region: 'Europe' },
  { n_nationkey: 5, n_name: 'Canada', n_region: 'America' },
  { n_nationkey: 6, n_name: 'Italy', n_region: 'Europe' },
]

const c = (
  c_custkey: number,
  c_name: string,
  c_address: string,
  c_nationkey: number,
  c_mktsegment: string,
  c_acctbal: number,
  c_comment = '',
): CustomerRow => ({ c_custkey, c_name, c_address, c_nationkey, c_mktsegment, c_acctbal, c_comment })

export interface BatchStory {
  title: string
  changes: string[]
}

/** What happens in each batch, used as captions by the load player. */
export const STORY: BatchStory[] = [
  {
    title: 'Initial load',
    changes: ['Five customers, six nations, two phone sets and three orders arrive for the first time.'],
  },
  {
    title: 'Day two',
    changes: [
      'Bruno (#2) moved: new address → new satellite version.',
      'Chiara (#3) relocated from Italy to Germany → new link, effectivity flips.',
      'Daniel (#4) is missing from the full load → record tracking shows a gap.',
      'Farah (#6) is a brand new customer → new hub row.',
      'Alice (#1) added a work phone → the whole multi-active set is versioned.',
    ],
  },
  {
    title: 'Day three',
    changes: [
      'Alice (#1) switched segment → new satellite version.',
      'Daniel (#4) is back, unchanged → no new satellite row (same hashdiff).',
      "Emi's (#5) comment only gained trailing spaces → trimmed, hashdiff unchanged.",
      'Germany got a new name spelling in the nation feed ("Deutschland").',
      'Gabriel (#7) is new.',
    ],
  },
]

export const CUSTOMERS: CustomerRow[][] = [
  [
    c(1, 'Alice Martin', '12 Rue Lafayette', 4, 'BUILDING', 1200.5, 'prefers email'),
    c(2, 'Bruno Costa', 'Av. Paulista 900', 1, 'AUTOMOBILE', 830),
    c(3, 'Chiara Rossi', 'Via Roma 3', 6, 'MACHINERY', 2400, 'key account'),
    c(4, 'Daniel Weber', 'Hauptstr. 7', 2, 'HOUSEHOLD', 150.25),
    c(5, 'Emi Tanaka', '2-1 Shibuya', 3, 'FURNITURE', 990, 'night deliveries'),
  ],
  [
    c(1, 'Alice Martin', '12 Rue Lafayette', 4, 'BUILDING', 1200.5, 'prefers email'),
    c(2, 'Bruno Costa', 'Rua Augusta 15', 1, 'AUTOMOBILE', 830),
    c(3, 'Chiara Rossi', 'Via Roma 3', 2, 'MACHINERY', 2400, 'key account'),
    c(5, 'Emi Tanaka', '2-1 Shibuya', 3, 'FURNITURE', 990, 'night deliveries'),
    c(6, 'Farah Khan', '88 King St W', 5, 'BUILDING', 3100),
  ],
  [
    c(1, 'Alice Martin', '12 Rue Lafayette', 4, 'MACHINERY', 1200.5, 'prefers email'),
    c(2, 'Bruno Costa', 'Rua Augusta 15', 1, 'AUTOMOBILE', 830),
    c(3, 'Chiara Rossi', 'Via Roma 3', 2, 'MACHINERY', 2400, 'key account'),
    c(4, 'Daniel Weber', 'Hauptstr. 7', 2, 'HOUSEHOLD', 150.25),
    c(5, 'Emi Tanaka', '2-1 Shibuya', 3, 'FURNITURE', 990, 'night deliveries   '),
    c(6, 'Farah Khan', '88 King St W', 5, 'BUILDING', 3100),
    c(7, 'Gabriel Silva', 'Rua Oscar Freire 2', 1, 'AUTOMOBILE', 640),
  ],
]

/** A row that shows up a day late, carrying yesterday's load timestamp. */
export const LATE_CUSTOMER = { ...c(8, 'Hana Sato', '5-3 Ginza', 3, 'HOUSEHOLD', 75), ldts: BATCHES[1] }

export const NATIONS: NationRow[][] = [
  nations,
  nations,
  nations.map((n) => (n.n_nationkey === 2 ? { ...n, n_name: 'Deutschland' } : n)),
]

export const PHONES: PhoneRow[][] = [
  [
    { c_custkey: 1, phone_type: 'home', phone_number: '+33 1 40 00 00 01' },
    { c_custkey: 1, phone_type: 'mobile', phone_number: '+33 6 12 34 56 78' },
    { c_custkey: 2, phone_type: 'mobile', phone_number: '+55 11 9 8765 4321' },
  ],
  [
    { c_custkey: 1, phone_type: 'home', phone_number: '+33 1 40 00 00 01' },
    { c_custkey: 1, phone_type: 'mobile', phone_number: '+33 6 12 34 56 78' },
    { c_custkey: 1, phone_type: 'work', phone_number: '+33 1 55 55 55 55' },
    { c_custkey: 2, phone_type: 'mobile', phone_number: '+55 11 9 8765 4321' },
  ],
  [
    { c_custkey: 1, phone_type: 'home', phone_number: '+33 1 40 00 00 01' },
    { c_custkey: 1, phone_type: 'mobile', phone_number: '+33 6 12 34 56 78' },
    { c_custkey: 1, phone_type: 'work', phone_number: '+33 1 55 55 55 55' },
    { c_custkey: 2, phone_type: 'mobile', phone_number: '+55 11 9 1111 2222' },
  ],
]

/** Orders are events: each feed only contains the new ones. */
export const ORDERS: OrderRow[][] = [
  [
    { o_orderkey: 101, o_custkey: 1, o_orderdate: '2023-12-30', o_totalprice: 250 },
    { o_orderkey: 102, o_custkey: 3, o_orderdate: '2023-12-31', o_totalprice: 1800 },
    { o_orderkey: 103, o_custkey: 5, o_orderdate: '2023-12-31', o_totalprice: 95.9 },
  ],
  [
    { o_orderkey: 104, o_custkey: 6, o_orderdate: '2024-01-01', o_totalprice: 420 },
    { o_orderkey: 105, o_custkey: 1, o_orderdate: '2024-01-01', o_totalprice: 60 },
  ],
  [{ o_orderkey: 106, o_custkey: 7, o_orderdate: '2024-01-02', o_totalprice: 310 }],
]
