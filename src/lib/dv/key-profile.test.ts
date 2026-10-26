import { describe, expect, it } from 'vitest'
import { CUSTOMER_KEY_COLUMNS, profileCustomerKey } from './key-profile'

const expected = {
  c_custkey: { duplicates: [0, 0, 0], empty: 0, changed: 0, ordersFound: 5, distinct: 7 },
  c_name: { duplicates: [0, 0, 0], empty: 0, changed: 0, ordersFound: 0, distinct: 7 },
  c_address: { duplicates: [0, 0, 0], empty: 0, changed: 1, ordersFound: 0, distinct: 8 },
  c_mktsegment: { duplicates: [0, 1, 2], empty: 0, changed: 1, ordersFound: 0, distinct: 5 },
} as const

describe('profileCustomerKey', () => {
  for (const column of CUSTOMER_KEY_COLUMNS) {
    it(`profiles ${column} across all deliveries`, () => {
      const profile = profileCustomerKey(column)
      const want = expected[column]

      expect(profile.duplicateRowsByBatch).toEqual(want.duplicates)
      expect(profile.emptyValues).toBe(want.empty)
      expect(profile.changedCustomerCount).toBe(want.changed)
      expect(profile.orderKeysFound).toBe(want.ordersFound)
      expect(profile.orderKeysTotal).toBe(5)
      expect(profile.distinctValues).toHaveLength(want.distinct)
      expect(profile.customerCount).toBe(7)
      expect(profile.hubRows).toHaveLength(want.distinct)
      expect(profile.hubRows.every((row) => typeof row.hk_customer_h === 'string' && row.hk_customer_h.length === 32)).toBe(true)
    })
  }
})
