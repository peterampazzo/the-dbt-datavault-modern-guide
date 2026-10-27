import { describe, expect, it } from 'vitest'
import { dvHash, ZERO_KEY } from './hash'

const vectors: [string[], string][] = [
  [['1'], '2f7bb230c70819aeb10b45a709bcf48f'],
  [['7'], 'e4a7afdacb8b63d1de55011d2202c77e'],
  [['1001', '1'], '86f99031ab8627d87e93785498bbe260'],
  [['Straße'], '10d7e0b83c2ffe881f913eae0497a732'],
  [[' 42 '], 'c5d54f6aa2e5c79cdb098eabd3805ebc'],
  [['a;b', 'c'], '26afea6662a4ae4b464e3d36e6c2ba60'],
  [['a', 'b;c'], '02c5e56082b4345a5fdbae0482b8b2cc'],
  [[null, '5'] as unknown as string[], '45e984cd8757b1f059e473c7920ad28f'],
]

describe('dvHash', () => {
  it.each(vectors)('keeps the datavault4dbt default vector for %j', (values, expected) => {
    expect(dvHash(values).hash).toBe(expected)
  })

  it('uses configured NULL text and delimiter for the all-NULL key', () => {
    expect(dvHash([null, null], { encoding: 'utf16le', delimiter: ';', nullAs: '', quote: '' }).hash).toBe(ZERO_KEY.MD5)
  })

  it('escapes the configured delimiter unless escaping is disabled', () => {
    const options = { encoding: 'utf16le' as const, delimiter: ';', nullAs: '', quote: '' }
    expect(dvHash(['a;b', 'c'], options).hash).not.toBe(dvHash(['a;b', 'c'], { ...options, escape: false }).hash)
  })
})
