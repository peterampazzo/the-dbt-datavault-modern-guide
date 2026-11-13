/** The small sales dataset inside the practice project `orders-report`. Foundations keeps its own copy so it can change without touching the Data Vault book. */
export const CUSTOMERS = [
  {
    c_custkey: 1,
    c_name: 'Alice Martin',
    c_address: '12 Rue Lafayette',
    c_nationkey: 4,
    c_mktsegment: 'MACHINERY',
    c_acctbal: 1200.5,
    c_comment: 'prefers email',
  },
  {
    c_custkey: 2,
    c_name: 'Bruno Costa',
    c_address: 'Rua Augusta 15',
    c_nationkey: 1,
    c_mktsegment: 'AUTOMOBILE',
    c_acctbal: 830,
    c_comment: '',
  },
  {
    c_custkey: 3,
    c_name: 'Chiara Rossi',
    c_address: 'Via Roma 3',
    c_nationkey: 2,
    c_mktsegment: 'MACHINERY',
    c_acctbal: 2400,
    c_comment: 'key account',
  },
  {
    c_custkey: 4,
    c_name: 'Daniel Weber',
    c_address: 'Hauptstr. 7',
    c_nationkey: 2,
    c_mktsegment: 'HOUSEHOLD',
    c_acctbal: 150.25,
    c_comment: '',
  },
  {
    c_custkey: 5,
    c_name: 'Emi Tanaka',
    c_address: '2-1 Shibuya',
    c_nationkey: 3,
    c_mktsegment: 'FURNITURE',
    c_acctbal: 990,
    c_comment: 'night deliveries   ',
  },
  {
    c_custkey: 6,
    c_name: 'Farah Khan',
    c_address: '88 King St W',
    c_nationkey: 5,
    c_mktsegment: 'BUILDING',
    c_acctbal: 3100,
    c_comment: '',
  },
  {
    c_custkey: 7,
    c_name: 'Gabriel Silva',
    c_address: 'Rua Oscar Freire 2',
    c_nationkey: 1,
    c_mktsegment: 'AUTOMOBILE',
    c_acctbal: 640,
    c_comment: '',
  },
] as const

export const NATIONS = [
  {
    n_nationkey: 1,
    n_name: 'Brazil',
    n_region: 'America',
  },
  {
    n_nationkey: 2,
    n_name: 'Germany',
    n_region: 'Europe',
  },
  {
    n_nationkey: 3,
    n_name: 'Japan',
    n_region: 'Asia',
  },
  {
    n_nationkey: 4,
    n_name: 'France',
    n_region: 'Europe',
  },
  {
    n_nationkey: 5,
    n_name: 'Canada',
    n_region: 'America',
  },
  {
    n_nationkey: 6,
    n_name: 'Italy',
    n_region: 'Europe',
  },
] as const

export const ORDERS = [
  {
    o_orderkey: 101,
    o_custkey: 1,
    o_orderdate: '2023-12-30',
    o_totalprice: 250,
  },
  {
    o_orderkey: 102,
    o_custkey: 3,
    o_orderdate: '2023-12-31',
    o_totalprice: 1800,
  },
  {
    o_orderkey: 103,
    o_custkey: 5,
    o_orderdate: '2023-12-31',
    o_totalprice: 95.9,
  },
  {
    o_orderkey: 104,
    o_custkey: 6,
    o_orderdate: '2024-01-01',
    o_totalprice: 420,
  },
  {
    o_orderkey: 105,
    o_custkey: 1,
    o_orderdate: '2024-01-01',
    o_totalprice: 60,
  },
  {
    o_orderkey: 106,
    o_custkey: 7,
    o_orderdate: '2024-01-02',
    o_totalprice: 310,
  },
] as const
