import { describe, expect, it } from 'vitest'
import { dvHash, type Value } from '../dv/hash'
import { legacyHash } from './parity'

const vectors: { values: Value[]; datavault: string; legacy: string; ambiguous?: boolean }[] = [
  { values: ['1'], datavault: '2f7bb230c70819aeb10b45a709bcf48f', legacy: '06d49632c9dc9bcb62aeaef99612ba6b' },
  { values: ['7'], datavault: 'e4a7afdacb8b63d1de55011d2202c77e', legacy: 'a734c94d6e046c4667fea57758c5b6f6' },
  { values: ['1001', '1'], datavault: '86f99031ab8627d87e93785498bbe260', legacy: '554973ff1fa600d1504ccb31bfd7c2bb' },
  { values: ['Straße'], datavault: '10d7e0b83c2ffe881f913eae0497a732', legacy: '40f6824248a6d7b317e6df8c60a8bef0' },
  { values: [' 42 '], datavault: 'c5d54f6aa2e5c79cdb098eabd3805ebc', legacy: 'd721737a1cbbfb3b7e54c60c38882e08' },
  { values: ['a;b', 'c'], datavault: '26afea6662a4ae4b464e3d36e6c2ba60', legacy: 'd971790a1fbfd1d9e07dfdcd35c3b2cd', ambiguous: true },
  { values: ['a', 'b;c'], datavault: '02c5e56082b4345a5fdbae0482b8b2cc', legacy: 'd971790a1fbfd1d9e07dfdcd35c3b2cd', ambiguous: true },
  { values: [null, '5'], datavault: '45e984cd8757b1f059e473c7920ad28f', legacy: '65a0808b0c40192806c21c5ade0583b3' },
]

describe('legacyHash parity vectors', () => {
  it.each(vectors)('matches the independently computed vector for %j', ({ values, datavault, legacy }) => {
    expect(dvHash(values).hash).toBe(datavault)
    expect(legacyHash(values)).toBe(legacy)
  })

  it('matches the legacy procedure settings except where delimiter escaping prevents parity', () => {
    const options = { encoding: 'utf16le' as const, delimiter: ';', nullAs: '', quote: '' }
    for (const vector of vectors.filter(({ ambiguous }) => !ambiguous)) {
      expect(dvHash(vector.values, options).hash).toBe(legacyHash(vector.values))
    }
    for (const vector of vectors.filter(({ ambiguous }) => ambiguous)) {
      expect(dvHash(vector.values, options).hash).not.toBe(legacyHash(vector.values))
    }
    expect(legacyHash(vectors[5].values)).toBe(legacyHash(vectors[6].values))
  })
})
