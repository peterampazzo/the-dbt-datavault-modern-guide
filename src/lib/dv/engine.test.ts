import { describe, expect, it } from 'vitest'
import { dvHash, hk } from './hash'
import { END, isGhost, pit, satV1, simulate, UNKNOWN_KEY } from './engine'
import { createHash } from 'node:crypto'

const md5 = (s: string) => createHash('md5').update(s).digest('hex')

describe('dvHash', () => {
  it('matches the datavault4dbt default standardisation', () => {
    expect(hk(1)).toBe(md5('"1"'))
    expect(hk('  alice ', 'b')).toBe(md5('"ALICE"||"B"'))
    expect(dvHash(['Alice', null], { kind: 'hashdiff' }).hash).toBe(md5('"Alice"||^^'))
  })
  it('maps all-NULL input to the zero key', () => {
    expect(dvHash([null, null]).hash).toBe(UNKNOWN_KEY)
  })
  it('escapes delimiters inside the data', () => {
    expect(dvHash(['a||b'], { kind: 'hashdiff' }).hash).toBe(md5('"adv4dbt-concat-replacementb"'))
  })
})

const real = (rows: { __ghost?: unknown }[]) => rows.filter((r) => !isGhost(r as never))

describe('simulate', () => {
  const runs = simulate()
  const last = runs[2].tables

  it('loads hubs insert-only with ghost records', () => {
    expect(runs[0].tables.customer_h).toHaveLength(5 + 2)
    expect(real(runs[1].tables.customer_h)).toHaveLength(6)
    expect(real(last.customer_h)).toHaveLength(7)
  })

  it('versions satellites only on real payload changes', () => {
    // 5 initial + Bruno (b2) + Farah (b2) + Alice (b3) + Gabriel (b3); Daniel's return and Emi's spaces are no-ops
    expect(real(last.customer_n_s)).toHaveLength(9)
    expect(real(last.nation_n_s)).toHaveLength(7)
  })

  it('creates a new link when a customer changes nation and tracks effectivity', () => {
    expect(real(last.customer_nation_l)).toHaveLength(8)
    const es = last.customer_nation_es
    expect(es.filter((r) => r.is_active === false)).toHaveLength(2)
    expect(es).toHaveLength(5 + 4 + 2)
  })

  it('re-inserts the whole multi-active set on change', () => {
    expect(real(last.customer_phone_ma_s)).toHaveLength(3 + 3 + 1)
  })

  it('drops late arriving rows below the high-water mark', () => {
    const late = simulate({ lateArrival: true })
    expect(real(late[2].tables.customer_h)).toHaveLength(7)
    expect(late[2].decisions.customer_h.some((d) => d.row.c_custkey === 8 && d.reason === 'hwm')).toBe(true)
  })

  it('end-dates satellite versions in v1', () => {
    const v1 = satV1(real(last.customer_n_s) as never, 'hk_customer_h')
    expect(v1.filter((r) => r.is_current)).toHaveLength(7)
    expect(v1.find((r) => r.c_custkey === undefined && r.c_name === 'Bruno Costa' && r.ledts !== END)?.ledts).toBe('2024-01-02 05:59:59.999999')
  })

  it('builds PIT pointers per snapshot', () => {
    const p = pit(last)
    expect(p.filter((r) => r.sdts === '2024-01-01 07:00:00')).toHaveLength(5)
    const daniel = p.find((r) => r.c_custkey === 4 && r.sdts === '2024-01-04 07:00:00')!
    expect(daniel.customer_n_s_ldts).toBe('2024-01-01 06:00:00')
    expect(daniel.customer_phone_ma_s_hk).toBe(UNKNOWN_KEY)
  })
})
