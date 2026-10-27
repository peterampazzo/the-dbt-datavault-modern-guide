import { describe, expect, it } from 'vitest'
import { LEGACY_CUSTOMER_HUB, LEGACY_CUSTOMER_SAT, seedFromLegacy } from './history'

describe('legacy history seed', () => {
  it('reconciles the sample without payload or hashdiff mismatches', () => {
    const { keyMap, reconciliation } = seedFromLegacy()
    expect(reconciliation).toEqual({
      legacyHubRows: reconciliation.newHubRows,
      newHubRows: reconciliation.newHubRows,
      legacySatVersions: reconciliation.newSatVersions,
      newSatVersions: reconciliation.newSatVersions,
      payloadMismatches: 0,
      hashdiffMismatches: 0,
    })
    expect(LEGACY_CUSTOMER_HUB).toHaveLength(6)
    expect(LEGACY_CUSTOMER_SAT).toHaveLength(7)
    expect(new Set(keyMap.map((row) => row.legacyHashKey)).size).toBe(keyMap.length)
    expect(new Set(keyMap.map((row) => row.newHashKey)).size).toBe(keyMap.length)
    expect(new Set(keyMap.map((row) => row.customerNumber)).size).toBe(keyMap.length)
  })
})
