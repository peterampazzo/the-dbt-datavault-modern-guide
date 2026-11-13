import { BATCHES } from '../dv/dataset'
import { hk, hd, type Value } from '../dv/hash'
import { isGhost, simulate, type Row } from '../dv/engine'
import { legacyHash } from './parity'

export interface LegacyCustomerHub {
  CustomerHashKey: string
  CustomerNumber: number
  LoadDate: string
  RecordSource: string
}

export interface LegacyCustomerSat {
  CustomerHashKey: string
  LoadDate: string
  LoadEndDate: string
  CustomerName: string
  CustomerAddress: string
  CustomerMarketSegment: string
  CustomerAccountBalance: number
  CustomerComment: string
  HashDiff: string
  RecordSource: string
}

export interface SeededCustomerHub {
  hk_customer_h: string
  c_custkey: number
  ldts: string
  rsrc: string
}

export interface SeededCustomerSat {
  hk_customer_h: string
  hd_customer_n_s: string
  c_name: string
  c_address: string
  c_mktsegment: string
  c_acctbal: number
  c_comment: string
  ldts: string
  rsrc: string
}

export interface KeyMapRow {
  legacyHashKey: string
  customerNumber: number
  newHashKey: string
}

export interface Reconciliation {
  legacyHubRows: number
  newHubRows: number
  legacySatVersions: number
  newSatVersions: number
  payloadMismatches: number
  hashdiffMismatches: number
}

const runs = simulate({ batchIndexes: [0, 1] })
const history = runs.at(-1)!
const real = (row: Row) => !isGhost(row)
const hubRows = history.tables.customer_h.filter(real)
const satRows = history.tables.customer_n_s.filter(real)

const minusMicrosecond = (date: string) => {
  const [day, time] = date.split(' ')
  const [h, m, s] = time.split(':').map(Number)
  let seconds = h * 3600 + m * 60 + s
  seconds -= 1
  if (seconds < 0) return `${day} 23:59:59.999999`
  const hh = String(Math.floor(seconds / 3600)).padStart(2, '0')
  const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return `${day} ${hh}:${mm}:${ss}.999999`
}

const hubByHashKey = new Map(hubRows.map((row) => [row.hk_customer_h, row.c_custkey as number]))

export const LEGACY_CUSTOMER_HUB: LegacyCustomerHub[] = hubRows.map((row) => ({
  CustomerHashKey: legacyHash([row.c_custkey as Value]),
  CustomerNumber: row.c_custkey as number,
  LoadDate: String(row.ldts),
  RecordSource: String(row.rsrc),
}))

export const LEGACY_CUSTOMER_SAT: LegacyCustomerSat[] = satRows
  .map((row) => {
    const key = hubByHashKey.get(row.hk_customer_h) as number
    return {
      CustomerHashKey: legacyHash([key]),
      LoadDate: String(row.ldts),
      LoadEndDate: '',
      CustomerName: String(row.c_name ?? ''),
      CustomerAddress: String(row.c_address ?? ''),
      CustomerMarketSegment: String(row.c_mktsegment ?? ''),
      CustomerAccountBalance: row.c_acctbal as number,
      CustomerComment: String(row.c_comment ?? ''),
      HashDiff: legacyHash([row.c_name as Value, row.c_address as Value, row.c_mktsegment as Value, row.c_acctbal as Value, row.c_comment as Value]),
      RecordSource: String(row.rsrc),
    }
  })
  .sort((a, b) => a.CustomerHashKey.localeCompare(b.CustomerHashKey) || a.LoadDate.localeCompare(b.LoadDate))
  .map((row, index, rows) => {
    const next = rows[index + 1]
    const sameKey = next?.CustomerHashKey === row.CustomerHashKey
    return { ...row, LoadEndDate: sameKey ? minusMicrosecond(next.LoadDate) : '9999-12-31' }
  })

export function seedFromLegacy() {
  const customerNumberByLegacyHash = new Map(LEGACY_CUSTOMER_HUB.map((row) => [row.CustomerHashKey, row.CustomerNumber]))
  const newHubs: SeededCustomerHub[] = LEGACY_CUSTOMER_HUB.map((row) => ({
    hk_customer_h: hk(row.CustomerNumber),
    c_custkey: row.CustomerNumber,
    ldts: row.LoadDate,
    rsrc: row.RecordSource,
  }))
  const newSats: SeededCustomerSat[] = LEGACY_CUSTOMER_SAT.map((row) => ({
    hk_customer_h: hk(customerNumberByLegacyHash.get(row.CustomerHashKey)!),
    hd_customer_n_s: hd(row.CustomerName, row.CustomerAddress, row.CustomerMarketSegment, row.CustomerAccountBalance, row.CustomerComment),
    c_name: row.CustomerName,
    c_address: row.CustomerAddress,
    c_mktsegment: row.CustomerMarketSegment,
    c_acctbal: row.CustomerAccountBalance,
    c_comment: row.CustomerComment,
    ldts: row.LoadDate,
    rsrc: row.RecordSource,
  }))
  const keyMap: KeyMapRow[] = LEGACY_CUSTOMER_HUB.map((row) => ({
    legacyHashKey: row.CustomerHashKey,
    customerNumber: row.CustomerNumber,
    newHashKey: hk(row.CustomerNumber),
  }))
  const engineSats = satRows
  const engineByVersion = new Map(engineSats.map((row) => [`${hubByHashKey.get(row.hk_customer_h)}|${row.ldts}`, row]))
  let payloadMismatches = 0
  let hashdiffMismatches = 0
  for (const [index, row] of newSats.entries()) {
    const customerNumber = customerNumberByLegacyHash.get(LEGACY_CUSTOMER_SAT[index].CustomerHashKey)
    const truth = engineByVersion.get(`${customerNumber}|${row.ldts}`)
    if (!truth || truth.c_name !== row.c_name || truth.c_address !== row.c_address || truth.c_mktsegment !== row.c_mktsegment || truth.c_acctbal !== row.c_acctbal || truth.c_comment !== row.c_comment) payloadMismatches += 1
    if (!truth || truth.hd_customer_n_s !== row.hd_customer_n_s) hashdiffMismatches += 1
  }
  const reconciliation: Reconciliation = {
    legacyHubRows: LEGACY_CUSTOMER_HUB.length,
    newHubRows: newHubs.length,
    legacySatVersions: LEGACY_CUSTOMER_SAT.length,
    newSatVersions: newSats.length,
    payloadMismatches,
    hashdiffMismatches,
  }
  return { newHubs, newSats, keyMap, reconciliation }
}

export const LEGACY_HISTORY_LOADS = BATCHES.slice(0, 2)
