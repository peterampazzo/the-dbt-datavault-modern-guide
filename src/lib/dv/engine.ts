import { BATCHES, CUSTOMER_EMAIL, CUSTOMERS, LATE_CUSTOMER, NATIONS, ORDERS, PHONES, SHOP_CUSTOMERS } from './dataset'
import { ERROR_KEY, hd, hk, standardiseAttribute, ZERO_KEY } from './hash'

/**
 * A small in-memory simulation of how datavault4dbt loads a raw vault:
 * stage (hashes + ghost records) → incremental, insert-only hubs, links and satellites,
 * guarded by a high-water mark (HWM) on ldts.
 */

export const BEGIN = '0001-01-01 00:00:01'
export const END = '8888-12-31 23:59:59'
export const UNKNOWN_RSRC = 'SYSTEM'
export const ERROR_RSRC = 'ERROR'
export const UNKNOWN_KEY = ZERO_KEY.MD5
export const ERR_KEY = ERROR_KEY.MD5

export type Cell = string | number | boolean | null
export type Row = Record<string, Cell>
export type Ghost = 'unknown' | 'error'

export type TableName =
  | 'customer_h'
  | 'nation_h'
  | 'order_h'
  | 'customer_nation_l'
  | 'order_customer_nh_l'
  | 'customer_n_s'
  | 'nation_n_s'
  | 'customer_phone_ma_s'
  | 'customer_nation_es'
  | 'customer_rts'

export type StageName = 'stg_customer' | 'stg_nation' | 'stg_customer_phone' | 'stg_orders'

export type SkipReason = 'hwm' | 'exists' | 'unchanged' | 'duplicate' | 'still_active' | 'still_inactive'

export interface Decision {
  row: Row
  status: 'inserted' | 'skipped'
  reason?: SkipReason
  ghost?: Ghost
}

export const REASON_LABEL: Record<SkipReason, string> = {
  hwm: 'ldts ≤ high-water mark',
  exists: 'key already in target',
  unchanged: 'hashdiff unchanged',
  duplicate: 'duplicate in batch',
  still_active: 'already active',
  still_inactive: 'already inactive',
}

export interface BatchRun {
  index: number
  ldts: string
  source: Record<'customer' | 'nation' | 'phone' | 'orders', Row[]>
  stage: Record<StageName, Row[]>
  decisions: Record<TableName, Decision[]>
  tables: Record<TableName, Row[]>
  hwm: Record<TableName, string | null>
}

export interface SimOptions {
  lateArrival?: boolean
  change?: ReplayChange
  legacyAcctbalCast?: boolean
  batchIndexes?: readonly number[]
}

export type ReplayChange = 'none' | 'new-column' | 'cast-fix'

export interface ReplayOptions {
  landing: 'truncate' | 'persistent'
  change: ReplayChange
  fullRefresh: boolean
}

export type ReplayTableName =
  | 'customer_h'
  | 'nation_h'
  | 'order_h'
  | 'customer_nation_l'
  | 'order_customer_nh_l'
  | 'customer_n_s'
  | 'nation_n_s'

export type ReplayCellStatus = 'match' | 'wrong' | 'missing' | 'extra'
export type ReplayRowStatus = 'match' | 'missing' | 'extra'

export interface ReplayRowDiff {
  key: string
  status: ReplayRowStatus
  truth?: Row
  rebuilt?: Row
  cells: Record<string, ReplayCellStatus>
}

export interface ReplayTableDiff {
  rowsTruth: number
  rowsRebuilt: number
  missingRows: number
  wrongCells: number
  missingCells: number
  rows: ReplayRowDiff[]
}

export type ReplayResult = {
  truth: Record<TableName, Row[]>
  rebuilt: Record<TableName, Row[]>
  diff: Record<ReplayTableName, ReplayTableDiff>
}

export const REPLAY_TABLES: readonly ReplayTableName[] = [
  'customer_h',
  'nation_h',
  'order_h',
  'customer_nation_l',
  'order_customer_nh_l',
  'customer_n_s',
  'nation_n_s',
]

const replayKeys: Record<ReplayTableName, string[]> = {
  customer_h: ['hk_customer_h'],
  nation_h: ['hk_nation_h'],
  order_h: ['hk_order_h'],
  customer_nation_l: ['hk_customer_nation_l'],
  order_customer_nh_l: ['hk_order_customer_nh_l'],
  customer_n_s: ['hk_customer_h', 'ldts'],
  nation_n_s: ['hk_nation_h', 'ldts'],
}

const ghostRow = (kind: Ghost, columns: Record<string, 'string' | 'number' | 'hash'>): Row => {
  const row: Row = {}
  for (const [col, type] of Object.entries(columns)) {
    if (type === 'hash') row[col] = kind === 'unknown' ? UNKNOWN_KEY : ERR_KEY
    else if (type === 'number') row[col] = kind === 'unknown' ? -1 : -2
    else row[col] = kind === 'unknown' ? '(unknown)' : '(error)'
  }
  row.ldts = kind === 'unknown' ? BEGIN : END
  row.rsrc = kind === 'unknown' ? UNKNOWN_RSRC : ERROR_RSRC
  row.__ghost = kind
  return row
}

export const isGhost = (row: Row): Ghost | undefined => (row.__ghost as Ghost | undefined) ?? undefined

function withGhosts(rows: Row[], columns: Record<string, 'string' | 'number' | 'hash'>): Row[] {
  return [...rows, ghostRow('unknown', columns), ghostRow('error', columns)]
}

// ---------- staging ----------

export const CUSTOMER_PAYLOAD = ['c_name', 'c_address', 'c_mktsegment', 'c_acctbal', 'c_comment'] as const
export const SHOP_CUSTOMER_PAYLOAD = ['c_name', 'c_address'] as const

export function stageCustomer(source: Row[]): Row[] {
  const payload: readonly string[] = source.some((r) => r.c_email !== undefined) ? [...CUSTOMER_PAYLOAD, 'c_email'] : CUSTOMER_PAYLOAD
  const rows = source.map((r) => ({
    ...r,
    hk_customer_h: hk(r.c_custkey as number),
    hk_nation_h: hk(r.c_nationkey as number),
    hk_customer_nation_l: hk(r.c_custkey as number, r.c_nationkey as number),
    hd_customer_n_s: hd(...payload.map((c) => r[c] as string | number)),
  }))
  const columns: Record<string, 'string' | 'number' | 'hash'> = {
    c_custkey: 'number',
    c_name: 'string',
    c_address: 'string',
    c_nationkey: 'number',
    c_mktsegment: 'string',
    c_acctbal: 'number',
    c_comment: 'string',
    hk_customer_h: 'hash',
    hk_nation_h: 'hash',
    hk_customer_nation_l: 'hash',
    hd_customer_n_s: 'hash',
  }
  if (payload.includes('c_email')) columns.c_email = 'string'
  return withGhosts(rows, columns)
}

export function stageShopCustomer(source: Row[]): Row[] {
  const rows = source.map((r) => ({
    ...r,
    hk_customer_h: hk(r.c_custkey as number),
    hd_customer_shop_s: hd(r.c_name as string, r.c_address as string),
  }))
  return withGhosts(rows, {
    c_custkey: 'number',
    c_name: 'string',
    c_address: 'string',
    hk_customer_h: 'hash',
    hd_customer_shop_s: 'hash',
  })
}

function stageNation(source: Row[]): Row[] {
  const rows = source.map((r) => ({
    ...r,
    hk_nation_h: hk(r.n_nationkey as number),
    hd_nation_n_s: hd(r.n_name as string, r.n_region as string),
  }))
  return withGhosts(rows, {
    n_nationkey: 'number',
    n_name: 'string',
    n_region: 'string',
    hk_nation_h: 'hash',
    hd_nation_n_s: 'hash',
  })
}

/** Multi-active hashdiff: one hash over the whole set of a parent's rows, ordered by the multi-active key. */
function stagePhone(source: Row[]): Row[] {
  const groups = new Map<string, Row[]>()
  for (const r of source) {
    const key = `${r.c_custkey}|${r.ldts}`
    groups.set(key, [...(groups.get(key) ?? []), r])
  }
  const rows: Row[] = []
  for (const group of groups.values()) {
    const sorted = [...group].sort((a, b) => String(a.phone_type).localeCompare(String(b.phone_type)))
    const setHash = hd(sorted.map((r) => `${standardiseAttribute(r.phone_type as string)}||${standardiseAttribute(r.phone_number as string)}`).join('||'))
    for (const r of sorted) {
      rows.push({ ...r, hk_customer_h: hk(r.c_custkey as number), hd_customer_phone_ma_s: setHash })
    }
  }
  return withGhosts(rows, {
    c_custkey: 'number',
    phone_type: 'string',
    phone_number: 'string',
    hk_customer_h: 'hash',
    hd_customer_phone_ma_s: 'hash',
  })
}

function stageOrders(source: Row[]): Row[] {
  const rows = source.map((r) => ({
    ...r,
    hk_order_h: hk(r.o_orderkey as number),
    hk_customer_h: hk(r.o_custkey as number),
    hk_order_customer_nh_l: hk(r.o_orderkey as number, r.o_custkey as number),
  }))
  return withGhosts(rows, {
    o_orderkey: 'number',
    o_custkey: 'number',
    o_orderdate: 'string',
    o_totalprice: 'number',
    hk_order_h: 'hash',
    hk_customer_h: 'hash',
    hk_order_customer_nh_l: 'hash',
  })
}

// ---------- loading ----------

const byLdts = (a: Row, b: Row) => String(a.ldts).localeCompare(String(b.ldts))

function highWaterMark(target: Row[]): string | null {
  const ldts = target.map((r) => String(r.ldts)).filter((l) => l !== END)
  return ldts.length ? ldts.sort().at(-1)! : null
}

function pick(row: Row, cols: string[]): Row {
  const out: Row = {}
  for (const c of cols) out[c] = row[c]
  if (row.__ghost) out.__ghost = row.__ghost
  return out
}

function aboveHwm(row: Row, hwm: string | null) {
  return hwm === null || String(row.ldts) > hwm
}

/** Hubs and links: insert keys never seen before, earliest occurrence wins. */
function loadKeys(target: Row[], stage: Row[], key: string, cols: string[]) {
  const hwm = highWaterMark(target)
  const existing = new Set(target.map((r) => r[key]))
  const decisions: Decision[] = []
  const inserted: Row[] = []
  for (const s of [...stage].sort(byLdts)) {
    const row = pick(s, cols)
    const ghost = isGhost(s)
    if (!aboveHwm(s, hwm)) decisions.push({ row, status: 'skipped', reason: 'hwm', ghost })
    else if (existing.has(s[key])) {
      const dup = inserted.some((r) => r[key] === s[key])
      decisions.push({ row, status: 'skipped', reason: dup ? 'duplicate' : 'exists', ghost })
    } else {
      existing.add(s[key])
      inserted.push(row)
      decisions.push({ row, status: 'inserted', ghost })
    }
  }
  return { rows: [...target, ...inserted], decisions, hwm }
}

/** Satellite v0: insert a row when the hashdiff differs from the latest version of that key. */
function loadSat(target: Row[], stage: Row[], key: string, hdCol: string, cols: string[]) {
  const hwm = highWaterMark(target)
  const latest = new Map<Cell, Cell>()
  for (const r of [...target].sort(byLdts)) latest.set(r[key], r[hdCol])
  const decisions: Decision[] = []
  const inserted: Row[] = []
  for (const s of [...stage].sort(byLdts)) {
    const row = pick(s, cols)
    const ghost = isGhost(s)
    if (!aboveHwm(s, hwm)) decisions.push({ row, status: 'skipped', reason: 'hwm', ghost })
    else if (latest.get(s[key]) === s[hdCol]) decisions.push({ row, status: 'skipped', reason: 'unchanged', ghost })
    else {
      latest.set(s[key], s[hdCol])
      inserted.push(row)
      decisions.push({ row, status: 'inserted', ghost })
    }
  }
  return { rows: [...target, ...inserted], decisions, hwm }
}

/** Build the second customer satellite with the same insert-only loader as the CRM satellite. */
export function shopCustomerSatellite(): Row[] {
  let target: Row[] = []
  for (const [index, ldts] of BATCHES.entries()) {
    const source = SHOP_CUSTOMERS[index].map((row) => ({ ...row, ldts, rsrc: 'shop/customer' }))
    target = loadSat(
      target,
      stageShopCustomer(source),
      'hk_customer_h',
      'hd_customer_shop_s',
      ['hk_customer_h', 'hd_customer_shop_s', 'ldts', 'rsrc', 'c_custkey', ...SHOP_CUSTOMER_PAYLOAD],
    ).rows
  }
  return target
}

/** Multi-active satellite: the whole set of a key is (re)inserted when the set hashdiff changes. */
function loadMaSat(target: Row[], stage: Row[], key: string, hdCol: string, cols: string[]) {
  const hwm = highWaterMark(target)
  const latest = new Map<Cell, Cell>()
  for (const r of [...target].sort(byLdts)) latest.set(r[key], r[hdCol])
  const decisions: Decision[] = []
  const inserted: Row[] = []
  const decidedGroups = new Map<string, boolean>()
  for (const s of [...stage].sort(byLdts)) {
    const row = pick(s, cols)
    const ghost = isGhost(s)
    const group = `${s[key]}|${s.ldts}`
    if (!aboveHwm(s, hwm)) {
      decisions.push({ row, status: 'skipped', reason: 'hwm', ghost })
      continue
    }
    if (!decidedGroups.has(group)) {
      const changed = latest.get(s[key]) !== s[hdCol]
      decidedGroups.set(group, changed)
      if (changed) latest.set(s[key], s[hdCol])
    }
    if (decidedGroups.get(group)) {
      inserted.push(row)
      decisions.push({ row, status: 'inserted', ghost })
    } else decisions.push({ row, status: 'skipped', reason: 'unchanged', ghost })
  }
  return { rows: [...target, ...inserted], decisions, hwm }
}

/** Effectivity satellite on full loads: a link becomes active when it appears and inactive when it disappears. */
function loadEffSat(target: Row[], stage: Row[], key: string, ldts: string) {
  const hwm = highWaterMark(target)
  const status = new Map<Cell, boolean>()
  for (const r of [...target].sort(byLdts)) status.set(r[key], r.is_active as boolean)
  const present = new Map<Cell, Row>()
  for (const s of stage) if (!isGhost(s) && aboveHwm(s, hwm)) present.set(s[key], s)
  const decisions: Decision[] = []
  const inserted: Row[] = []
  const keys = new Set<Cell>([...status.keys(), ...present.keys()])
  for (const k of keys) {
    const was = status.get(k)
    const is = present.has(k)
    const row: Row = { [key]: k, ldts, rsrc: (present.get(k)?.rsrc as string) ?? 'seed/customer', is_active: is }
    if (is === was || (!is && was === undefined)) {
      decisions.push({ row, status: 'skipped', reason: is ? 'still_active' : 'still_inactive' })
    } else {
      inserted.push(row)
      decisions.push({ row, status: 'inserted' })
    }
  }
  return { rows: [...target, ...inserted], decisions, hwm }
}

/** Record-tracking satellite: one row per key, source and load in which the key was seen. */
function loadRts(target: Row[], stages: { rows: Row[]; key: string }[]) {
  const hwm = highWaterMark(target)
  const seen = new Set(target.map((r) => `${r.hk_customer_h}|${r.ldts}|${r.rsrc}`))
  const decisions: Decision[] = []
  const inserted: Row[] = []
  for (const { rows, key } of stages) {
    for (const s of rows) {
      if (isGhost(s)) continue
      const row: Row = { hk_customer_h: s[key], ldts: s.ldts, rsrc: s.rsrc }
      const id = `${row.hk_customer_h}|${row.ldts}|${row.rsrc}`
      if (seen.has(id)) decisions.push({ row, status: 'skipped', reason: 'duplicate' })
      else {
        seen.add(id)
        inserted.push(row)
        decisions.push({ row, status: 'inserted' })
      }
    }
  }
  return { rows: [...target, ...inserted], decisions, hwm }
}

// ---------- orchestration ----------

const emptyTables = (): Record<TableName, Row[]> => ({
  customer_h: [],
  nation_h: [],
  order_h: [],
  customer_nation_l: [],
  order_customer_nh_l: [],
  customer_n_s: [],
  nation_n_s: [],
  customer_phone_ma_s: [],
  customer_nation_es: [],
  customer_rts: [],
})

export function sourceFor(index: number, opts: SimOptions = {}): BatchRun['source'] {
  const ldts = BATCHES[index]
  const stamp = (rsrc: string) => (r: object): Row => ({ ...(r as Row), ldts, rsrc })
  const customer = CUSTOMERS[index].map(stamp('crm/customer')).map((row) => {
    const withCast = opts.legacyAcctbalCast ? { ...row, c_acctbal: Math.trunc(row.c_acctbal as number) } : row
    if (opts.change !== 'new-column') return withCast
    return { ...withCast, c_email: CUSTOMER_EMAIL[index][withCast.c_custkey as number] }
  })
  if (opts.lateArrival && index === 2) {
    const { ldts: lateLdts, ...rest } = LATE_CUSTOMER
    customer.push({
      ...rest,
      ...(opts.change === 'new-column' ? { c_email: CUSTOMER_EMAIL[1][8] } : {}),
      ldts: lateLdts,
      rsrc: 'crm/customer',
    })
  }
  return {
    customer,
    nation: NATIONS[index].map(stamp('erp/nation')),
    phone: PHONES[index].map(stamp('crm/phone')),
    orders: ORDERS[index].map(stamp('shop/orders')),
  }
}

export function simulate(opts: SimOptions = {}): BatchRun[] {
  let tables = emptyTables()
  const runs: BatchRun[] = []
  const batchIndexes = opts.batchIndexes ?? BATCHES.map((_, index) => index)
  for (const index of batchIndexes) {
    const ldts = BATCHES[index]
    const source = sourceFor(index, opts)
    const stage: BatchRun['stage'] = {
      stg_customer: stageCustomer(source.customer),
      stg_nation: stageNation(source.nation),
      stg_customer_phone: stagePhone(source.phone),
      stg_orders: stageOrders(source.orders),
    }
    const customerPayload: readonly string[] =
      opts.change === 'new-column' ? [...CUSTOMER_PAYLOAD, 'c_email'] : CUSTOMER_PAYLOAD
    const results = {
      customer_h: loadKeys(tables.customer_h, [...stage.stg_customer, ...stage.stg_orders.filter((r) => !isGhost(r))], 'hk_customer_h', [
        'hk_customer_h',
        'c_custkey',
        'ldts',
        'rsrc',
      ]),
      nation_h: loadKeys(tables.nation_h, stage.stg_nation, 'hk_nation_h', ['hk_nation_h', 'n_nationkey', 'ldts', 'rsrc']),
      order_h: loadKeys(tables.order_h, stage.stg_orders, 'hk_order_h', ['hk_order_h', 'o_orderkey', 'ldts', 'rsrc']),
      customer_nation_l: loadKeys(tables.customer_nation_l, stage.stg_customer, 'hk_customer_nation_l', [
        'hk_customer_nation_l',
        'hk_customer_h',
        'hk_nation_h',
        'ldts',
        'rsrc',
      ]),
      order_customer_nh_l: loadKeys(tables.order_customer_nh_l, stage.stg_orders, 'hk_order_customer_nh_l', [
        'hk_order_customer_nh_l',
        'hk_order_h',
        'hk_customer_h',
        'ldts',
        'rsrc',
        'o_orderdate',
        'o_totalprice',
      ]),
      customer_n_s: loadSat(tables.customer_n_s, stage.stg_customer, 'hk_customer_h', 'hd_customer_n_s', [
        'hk_customer_h',
        'hd_customer_n_s',
        'ldts',
        'rsrc',
        ...customerPayload,
      ]),
      nation_n_s: loadSat(tables.nation_n_s, stage.stg_nation, 'hk_nation_h', 'hd_nation_n_s', [
        'hk_nation_h',
        'hd_nation_n_s',
        'ldts',
        'rsrc',
        'n_name',
        'n_region',
      ]),
      customer_phone_ma_s: loadMaSat(tables.customer_phone_ma_s, stage.stg_customer_phone, 'hk_customer_h', 'hd_customer_phone_ma_s', [
        'hk_customer_h',
        'hd_customer_phone_ma_s',
        'ldts',
        'rsrc',
        'phone_type',
        'phone_number',
      ]),
      customer_nation_es: loadEffSat(tables.customer_nation_es, stage.stg_customer, 'hk_customer_nation_l', ldts),
      customer_rts: loadRts(tables.customer_rts, [
        { rows: stage.stg_customer, key: 'hk_customer_h' },
        { rows: stage.stg_orders, key: 'hk_customer_h' },
      ]),
    }
    tables = Object.fromEntries(Object.entries(results).map(([k, v]) => [k, v.rows])) as BatchRun['tables']
    runs.push({
      index,
      ldts,
      source,
      stage,
      tables,
      decisions: Object.fromEntries(Object.entries(results).map(([k, v]) => [k, v.decisions])) as BatchRun['decisions'],
      hwm: Object.fromEntries(Object.entries(results).map(([k, v]) => [k, v.hwm])) as BatchRun['hwm'],
    })
  }
  return runs
}

export type CustomerPrecedence =
  | readonly ['crm/customer', 'shop/customer']
  | readonly ['shop/customer', 'crm/customer']

const INTEGRATED_ATTRIBUTES = ['c_name', 'c_address', 'c_mktsegment', 'c_acctbal', 'c_comment'] as const

/** Integrate source satellites at each observed load timestamp using explicit source precedence. */
export function integratedCustomer(crmSat: Row[], shopSat: Row[], precedence: CustomerPrecedence): Row[] {
  const sources: Record<CustomerPrecedence[number], Row[]> = {
    'crm/customer': crmSat.filter((row) => !isGhost(row)),
    'shop/customer': shopSat.filter((row) => !isGhost(row)),
  }
  const keys = new Set([...crmSat, ...shopSat].filter((row) => !isGhost(row)).map((row) => String(row.hk_customer_h)))
  const snapshots = [...new Set(Object.values(sources).flatMap((rows) => rows.map((row) => String(row.ldts))))].sort()
  const output: Row[] = []

  for (const hkValue of keys) {
    for (const ldts of snapshots) {
      const latest = Object.fromEntries(
        precedence.map((source) => [
          source,
          [...sources[source]]
            .filter((row) => String(row.hk_customer_h) === hkValue && String(row.ldts) <= ldts)
            .sort(byLdts)
            .at(-1),
        ]),
      ) as Record<CustomerPrecedence[number], Row | undefined>
      if (!latest[precedence[0]] && !latest[precedence[1]]) continue
      const row: Row = { hk_customer_h: hkValue, ldts, rsrc: UNKNOWN_RSRC }
      const keySource = precedence.map((source) => latest[source]).find((candidate) => candidate?.c_custkey !== null && candidate?.c_custkey !== undefined)
      row.c_custkey = keySource?.c_custkey ?? null

      for (const attribute of INTEGRATED_ATTRIBUTES) {
        const winner = precedence
          .map((source) => ({ source, value: latest[source]?.[attribute] }))
          .find(({ value }) => value !== null && value !== undefined)
        row[attribute] = winner?.value ?? null
        row[`source_of_${attribute}`] = winner?.source ?? null
      }
      output.push(row)
    }
  }
  return output.sort((a, b) => String(a.hk_customer_h).localeCompare(String(b.hk_customer_h)) || String(a.ldts).localeCompare(String(b.ldts)))
}

/** Build cumulative order totals as an insert-only computed satellite. */
export function orderTotals(tables: Pick<BatchRun['tables'], 'order_customer_nh_l'>): Row[] {
  const orders = tables.order_customer_nh_l.filter((row) => !isGhost(row))
  const snapshots = [...new Set(orders.map((row) => String(row.ldts)))].sort()
  const keys = [...new Set(orders.map((row) => String(row.hk_customer_h)))].sort()
  const output: Row[] = []

  for (const hkValue of keys) {
    let previousHash: string | undefined
    for (const ldts of snapshots) {
      const customerOrders = orders.filter((row) => String(row.hk_customer_h) === hkValue && String(row.ldts) <= ldts)
      if (!customerOrders.length) continue
      const orderCount = customerOrders.length
      const totalPrice = customerOrders.reduce((sum, row) => sum + Number(row.o_totalprice ?? 0), 0)
      const hashdiff = hd(orderCount, totalPrice)
      if (hashdiff === previousHash) continue
      previousHash = hashdiff
      output.push({
        hk_customer_h: hkValue,
        ldts,
        rsrc: UNKNOWN_RSRC,
        order_count: orderCount,
        total_price: totalPrice,
        hd_customer_order_total_s: hashdiff,
      })
    }
  }
  return output.sort((a, b) => String(a.hk_customer_h).localeCompare(String(b.hk_customer_h)) || String(a.ldts).localeCompare(String(b.ldts)))
}

function replayRowKey(table: ReplayTableName, row: Row) {
  return replayKeys[table].map((column) => String(row[column] ?? '')).join('|')
}

function replayTableDiff(table: ReplayTableName, truth: Row[], rebuilt: Row[]): ReplayTableDiff {
  const truthRows = truth.filter((row) => !isGhost(row))
  const rebuiltRows = rebuilt.filter((row) => !isGhost(row))
  const truthByKey = new Map(truthRows.map((row) => [replayRowKey(table, row), row]))
  const rebuiltByKey = new Map(rebuiltRows.map((row) => [replayRowKey(table, row), row]))
  const keys = [...new Set([...truthByKey.keys(), ...rebuiltByKey.keys()])]
  let missingRows = 0
  let wrongCells = 0
  let missingCells = 0
  const rows = keys.map((key): ReplayRowDiff => {
    const truthRow = truthByKey.get(key)
    const rebuiltRow = rebuiltByKey.get(key)
    if (!rebuiltRow && truthRow) {
      missingRows += 1
      return {
        key,
        status: 'missing',
        truth: truthRow,
        cells: Object.fromEntries(Object.keys(truthRow).filter((col) => col !== '__ghost').map((col) => [col, 'missing'])),
      }
    }
    if (!truthRow && rebuiltRow) {
      return {
        key,
        status: 'extra',
        rebuilt: rebuiltRow,
        cells: Object.fromEntries(Object.keys(rebuiltRow).filter((col) => col !== '__ghost').map((col) => [col, 'extra'])),
      }
    }
    const cellNames = new Set([...Object.keys(truthRow ?? {}), ...Object.keys(rebuiltRow ?? {})].filter((col) => col !== '__ghost'))
    const cells: Record<string, ReplayCellStatus> = {}
    for (const column of cellNames) {
      const hasTruth = Object.hasOwn(truthRow ?? {}, column)
      const hasRebuilt = Object.hasOwn(rebuiltRow ?? {}, column)
      if (!hasRebuilt && hasTruth) {
        cells[column] = 'missing'
        missingCells += 1
      } else if (!hasTruth && hasRebuilt) {
        cells[column] = 'extra'
      } else if (truthRow?.[column] !== rebuiltRow?.[column]) {
        cells[column] = 'wrong'
        wrongCells += 1
      } else cells[column] = 'match'
    }
    return { key, status: 'match', truth: truthRow, rebuilt: rebuiltRow, cells }
  })
  return {
    rowsTruth: truthRows.length,
    rowsRebuilt: rebuiltRows.length,
    missingRows,
    wrongCells,
    missingCells,
    rows,
  }
}

export function replay(opts: ReplayOptions): ReplayResult {
  const truth = simulate({ change: opts.change }).at(-1)!.tables
  const rebuiltRuns =
    opts.landing === 'persistent'
      ? simulate({ change: opts.change })
      : opts.fullRefresh
        ? simulate({ change: opts.change, batchIndexes: [BATCHES.length - 1] })
        : simulate({ legacyAcctbalCast: opts.change === 'cast-fix' })
  const rebuilt = rebuiltRuns.at(-1)!.tables
  const diff = Object.fromEntries(
    REPLAY_TABLES.map((table) => [table, replayTableDiff(table, truth[table], rebuilt[table])]),
  ) as ReplayResult['diff']
  return { truth, rebuilt, diff }
}

// ---------- views and business vault ----------

export function subtractMicro(ldts: string) {
  const d = new Date(ldts.replace(' ', 'T') + 'Z')
  d.setUTCSeconds(d.getUTCSeconds() - 1)
  return d.toISOString().replace('T', ' ').slice(0, 19) + '.999999'
}

/** sat_v1: ledts = next version's ldts minus one microsecond, open versions end at END. */
export function satV1(rows: Row[], key: string): Row[] {
  const groups = new Map<Cell, Row[]>()
  for (const r of [...rows].sort(byLdts)) groups.set(r[key], [...(groups.get(r[key]) ?? []), r])
  const out: Row[] = []
  for (const group of groups.values()) {
    group.forEach((r, i) => {
      const next = group[i + 1]
      const ledts = next ? subtractMicro(String(next.ldts)) : END
      out.push({ ...r, ledts, is_current: ledts === END })
    })
  }
  return out
}

export const SNAPSHOTS = ['2024-01-01 07:00:00', '2024-01-02 07:00:00', '2024-01-03 07:00:00', '2024-01-04 07:00:00']

export interface PitRow {
  hk_customer_d: string
  hk_customer_h: string
  c_custkey: Cell
  sdts: string
  customer_n_s_ldts: string
  customer_n_s_hk: string
  customer_phone_ma_s_ldts: string
  customer_phone_ma_s_hk: string
}

function pointer(sat: Row[], hkValue: Cell, sdts: string): { hk: string; ldts: string } {
  const candidates = sat.filter((r) => r.hk_customer_h === hkValue && String(r.ldts) <= sdts && !isGhost(r))
  if (!candidates.length) return { hk: UNKNOWN_KEY, ldts: BEGIN }
  return { hk: String(hkValue), ldts: String(candidates.sort(byLdts).at(-1)!.ldts) }
}

/** Regular PIT: for every hub key and active snapshot, the ldts of the satellite version valid at sdts. */
export function pit(tables: BatchRun['tables'], snapshots = SNAPSHOTS): PitRow[] {
  const out: PitRow[] = []
  for (const sdts of snapshots) {
    for (const h of tables.customer_h) {
      if (isGhost(h) || String(h.ldts) > sdts) continue
      const s = pointer(tables.customer_n_s, h.hk_customer_h, sdts)
      const p = pointer(tables.customer_phone_ma_s, h.hk_customer_h, sdts)
      out.push({
        hk_customer_d: hk(String(h.hk_customer_h), sdts),
        hk_customer_h: String(h.hk_customer_h),
        c_custkey: h.c_custkey,
        sdts,
        customer_n_s_hk: s.hk,
        customer_n_s_ldts: s.ldts,
        customer_phone_ma_s_hk: p.hk,
        customer_phone_ma_s_ldts: p.ldts,
      })
    }
  }
  return out
}

export const short = (v: Cell) => (typeof v === 'string' && /^[0-9a-f]{32,64}$/.test(v) ? v.slice(0, 8) + '…' : v)
