import { CUSTOMERS, ORDERS } from './dataset'
import { hk } from './hash'
import type { Row } from './engine'

export const CUSTOMER_KEY_COLUMNS = ['c_custkey', 'c_name', 'c_address', 'c_mktsegment'] as const
export type CustomerKeyColumn = (typeof CUSTOMER_KEY_COLUMNS)[number]

export interface CustomerKeyProfile {
  column: CustomerKeyColumn
  duplicateRowsByBatch: number[]
  emptyValues: number
  changedCustomerCount: number
  orderKeysFound: number
  orderKeysTotal: number
  distinctValues: (string | number)[]
  customerCount: number
  hubRows: Row[]
}

export function profileCustomerKey(column: CustomerKeyColumn): CustomerKeyProfile {
  const duplicateRowsByBatch = CUSTOMERS.map((batch) => {
    const seen = new Set<string | number>()
    let duplicates = 0
    for (const row of batch) {
      const value = row[column]
      if (seen.has(value)) duplicates += 1
      else seen.add(value)
    }
    return duplicates
  })

  const allRows = CUSTOMERS.flat()
  const distinctValues = [...new Set(allRows.map((row) => row[column]))]
  const emptyValues = allRows.filter((row) => {
    const value = row[column]
    return value === null || value === undefined || String(value).trim() === ''
  }).length

  const previousValue = new Map<number, string | number>()
  const changedCustomers = new Set<number>()
  for (const batch of CUSTOMERS) {
    for (const row of batch) {
      const value = row[column]
      if (previousValue.has(row.c_custkey) && previousValue.get(row.c_custkey) !== value) {
        changedCustomers.add(row.c_custkey)
      }
      previousValue.set(row.c_custkey, value)
    }
  }

  const orderKeys = new Set(ORDERS.flatMap((batch) => batch.map((row) => row.o_custkey)))
  const distinctSet = new Set(distinctValues)
  const customerCount = new Set(allRows.map((row) => row.c_custkey)).size
  const hubRows = distinctValues.map((value) => ({ [column]: value, hk_customer_h: hk(value) }))

  return {
    column,
    duplicateRowsByBatch,
    emptyValues,
    changedCustomerCount: changedCustomers.size,
    orderKeysFound: [...orderKeys].filter((key) => distinctSet.has(key)).length,
    orderKeysTotal: orderKeys.size,
    distinctValues,
    customerCount,
    hubRows,
  }
}
