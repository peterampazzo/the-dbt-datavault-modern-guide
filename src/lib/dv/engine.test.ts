import { describe, expect, it } from 'vitest'
import { dvHash, hk } from './hash'
import {
  END,
  integratedCustomer,
  isGhost,
  oneShotEffSat,
  orderTotals,
  pit,
  replay,
  REPLAY_TABLES,
  satV1,
  shopCustomerSatellite,
  simulate,
  UNKNOWN_KEY,
} from './engine'
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

  it('keeps both of Chiara’s links active when effectivity is loaded from a union', () => {
    const chiara = runs[0].source.customer.find((row) => row.c_name === 'Chiara Rossi')!
    const italy = runs[0].source.nation.find((row) => row.n_name === 'Italy')!
    expect(chiara.c_nationkey).toBe(italy.n_nationkey)

    const germany = runs[0].source.nation.find((row) => row.n_name === 'Germany')!
    const links = new Map(
      runs.flatMap((run) => run.stage.stg_customer)
        .filter((row) => row.c_custkey === chiara.c_custkey)
        .map((row) => [row.c_nationkey, row.hk_customer_nation_l] as const),
    )
    const italyLink = links.get(italy.n_nationkey)
    const germanyLink = links.get(germany.n_nationkey)
    const orderedItaly = last.customer_nation_es.filter((row) => row.hk_customer_nation_l === italyLink)
    const orderedGermany = last.customer_nation_es.filter((row) => row.hk_customer_nation_l === germanyLink)
    const oneShot = oneShotEffSat()

    expect(orderedItaly.map((row) => row.is_active)).toEqual([true, false])
    expect(orderedGermany.map((row) => row.is_active)).toEqual([true])
    expect(oneShot.find((row) => row.hk_customer_nation_l === italyLink)?.is_active).toBe(true)
    expect(oneShot.find((row) => row.hk_customer_nation_l === germanyLink)?.is_active).toBe(true)
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

  it('keeps business dates on order-customer links for cutoff filtering', () => {
    const orderKeys = new Map(last.order_h.filter((row) => !isGhost(row)).map((row) => [String(row.hk_order_h), String(row.o_orderkey)] as const))
    const orders = real(last.order_customer_nh_l)
    const byBusinessDate = orders
      .filter((row) => String(row.o_orderdate) <= '2023-12-31')
      .map((row) => orderKeys.get(String(row.hk_order_h)))
      .sort()
    const byLoadDate = orders.filter((row) => String(row.ldts).slice(0, 10) <= '2023-12-31')

    expect(byBusinessDate).toEqual(['101', '102', '103'])
    expect(byLoadDate).toHaveLength(0)
  })

  it('multiplies Alice’s order totals across PIT snapshots until one snapshot is selected', () => {
    const aliceSnapshots = pit(last).filter((row) => row.c_custkey === 1)
    const aliceOrders = real(last.order_customer_nh_l).filter((row) => row.hk_customer_h === hk(1))
    const allSnapshotRows = aliceSnapshots.flatMap((snapshot) => aliceOrders.map((order) => ({ snapshot, order })))
    const latestSnapshotRows = aliceOrders

    expect(aliceSnapshots).toHaveLength(4)
    expect(aliceOrders).toHaveLength(2)
    expect(allSnapshotRows).toHaveLength(8)
    expect(allSnapshotRows.reduce((sum, row) => sum + Number(row.order.o_totalprice), 0)).toBe(1240)
    expect(latestSnapshotRows).toHaveLength(2)
    expect(latestSnapshotRows.reduce((sum, row) => sum + Number(row.o_totalprice), 0)).toBe(310)
  })
})

describe('business vault', () => {
  const runs = simulate()
  const crm = real(runs[2].tables.customer_n_s) as never
  const shop = real(shopCustomerSatellite()) as never

  it('integrates exact source values with CRM precedence', () => {
    const rows = integratedCustomer(crm, shop, ['crm/customer', 'shop/customer'])
      .filter((row) => [2, 3, 8].includes(Number(row.c_custkey)))
      .map(({ c_custkey, ldts, c_name, c_address, rsrc, source_of_c_name, source_of_c_address }) => ({
        c_custkey, ldts, c_name, c_address, rsrc, source_of_c_name, source_of_c_address,
      }))
      .sort((a, b) => Number(a.c_custkey) - Number(b.c_custkey) || String(a.ldts).localeCompare(String(b.ldts)))
    expect(rows).toEqual([
      { c_custkey: 2, ldts: '2024-01-01 06:00:00', c_name: 'Bruno Costa', c_address: 'Av. Paulista 900', rsrc: 'SYSTEM', source_of_c_name: 'crm/customer', source_of_c_address: 'crm/customer' },
      { c_custkey: 2, ldts: '2024-01-02 06:00:00', c_name: 'Bruno Costa', c_address: 'Rua Augusta 15', rsrc: 'SYSTEM', source_of_c_name: 'crm/customer', source_of_c_address: 'crm/customer' },
      { c_custkey: 2, ldts: '2024-01-03 06:00:00', c_name: 'Bruno Costa', c_address: 'Rua Augusta 15', rsrc: 'SYSTEM', source_of_c_name: 'crm/customer', source_of_c_address: 'crm/customer' },
      { c_custkey: 3, ldts: '2024-01-01 06:00:00', c_name: 'Chiara Rossi', c_address: 'Via Roma 3', rsrc: 'SYSTEM', source_of_c_name: 'crm/customer', source_of_c_address: 'crm/customer' },
      { c_custkey: 3, ldts: '2024-01-02 06:00:00', c_name: 'Chiara Rossi', c_address: 'Via Roma 3', rsrc: 'SYSTEM', source_of_c_name: 'crm/customer', source_of_c_address: 'crm/customer' },
      { c_custkey: 3, ldts: '2024-01-03 06:00:00', c_name: 'Chiara Rossi', c_address: 'Via Roma 3', rsrc: 'SYSTEM', source_of_c_name: 'crm/customer', source_of_c_address: 'crm/customer' },
      { c_custkey: 8, ldts: '2024-01-01 06:00:00', c_name: 'Hana Sato', c_address: '5-3 Ginza', rsrc: 'SYSTEM', source_of_c_name: 'shop/customer', source_of_c_address: 'shop/customer' },
      { c_custkey: 8, ldts: '2024-01-02 06:00:00', c_name: 'Hana Sato', c_address: 'Ginza 5-3', rsrc: 'SYSTEM', source_of_c_name: 'shop/customer', source_of_c_address: 'shop/customer' },
      { c_custkey: 8, ldts: '2024-01-03 06:00:00', c_name: 'Hana Sato', c_address: 'Tokyo storefront, 1-2', rsrc: 'SYSTEM', source_of_c_name: 'shop/customer', source_of_c_address: 'shop/customer' },
    ])
  })

  it('integrates exact source values with shop precedence and keeps shop-only keys', () => {
    const rows = integratedCustomer(crm, shop, ['shop/customer', 'crm/customer'])
      .filter((row) => [2, 3, 8].includes(Number(row.c_custkey)))
      .map(({ c_custkey, ldts, c_name, c_address, rsrc, source_of_c_name, source_of_c_address }) => ({
        c_custkey, ldts, c_name, c_address, rsrc, source_of_c_name, source_of_c_address,
      }))
      .sort((a, b) => Number(a.c_custkey) - Number(b.c_custkey) || String(a.ldts).localeCompare(String(b.ldts)))
    expect(rows).toEqual([
      { c_custkey: 2, ldts: '2024-01-01 06:00:00', c_name: 'Bruno Costa', c_address: 'Av. Paulista 900', rsrc: 'SYSTEM', source_of_c_name: 'shop/customer', source_of_c_address: 'shop/customer' },
      { c_custkey: 2, ldts: '2024-01-02 06:00:00', c_name: 'Bruno C.', c_address: 'Rua Augusta 15', rsrc: 'SYSTEM', source_of_c_name: 'shop/customer', source_of_c_address: 'shop/customer' },
      { c_custkey: 2, ldts: '2024-01-03 06:00:00', c_name: 'Bruno Costa', c_address: 'Rua Augusta 15', rsrc: 'SYSTEM', source_of_c_name: 'shop/customer', source_of_c_address: 'shop/customer' },
      { c_custkey: 3, ldts: '2024-01-01 06:00:00', c_name: 'Chiara Rossi', c_address: 'Via Roma 3', rsrc: 'SYSTEM', source_of_c_name: 'shop/customer', source_of_c_address: 'shop/customer' },
      { c_custkey: 3, ldts: '2024-01-02 06:00:00', c_name: 'Chiara Rossi', c_address: 'Via Roma 3', rsrc: 'SYSTEM', source_of_c_name: 'shop/customer', source_of_c_address: 'shop/customer' },
      { c_custkey: 3, ldts: '2024-01-03 06:00:00', c_name: 'Kiki Rossi', c_address: 'Via Roma 3', rsrc: 'SYSTEM', source_of_c_name: 'shop/customer', source_of_c_address: 'shop/customer' },
      { c_custkey: 8, ldts: '2024-01-01 06:00:00', c_name: 'Hana Sato', c_address: '5-3 Ginza', rsrc: 'SYSTEM', source_of_c_name: 'shop/customer', source_of_c_address: 'shop/customer' },
      { c_custkey: 8, ldts: '2024-01-02 06:00:00', c_name: 'Hana Sato', c_address: 'Ginza 5-3', rsrc: 'SYSTEM', source_of_c_name: 'shop/customer', source_of_c_address: 'shop/customer' },
      { c_custkey: 8, ldts: '2024-01-03 06:00:00', c_name: 'Hana Sato', c_address: 'Tokyo storefront, 1-2', rsrc: 'SYSTEM', source_of_c_name: 'shop/customer', source_of_c_address: 'shop/customer' },
    ])
    expect(rows.some((row) => row.c_custkey === 8)).toBe(true)
  })

  it('computes cumulative order totals by customer and load date', () => {
    const totals = orderTotals(runs[2].tables)
    // Orders: Alice 250 + 60 = 310; Chiara 1800; Emi 95.9; Farah 420; Gabriel 310.
    const expected = [
      { hk_customer_h: hk(1), ldts: '2024-01-01 06:00:00', order_count: 1, total_price: 250 },
      { hk_customer_h: hk(1), ldts: '2024-01-02 06:00:00', order_count: 2, total_price: 310 },
      { hk_customer_h: hk(3), ldts: '2024-01-01 06:00:00', order_count: 1, total_price: 1800 },
      { hk_customer_h: hk(5), ldts: '2024-01-01 06:00:00', order_count: 1, total_price: 95.9 },
      { hk_customer_h: hk(6), ldts: '2024-01-02 06:00:00', order_count: 1, total_price: 420 },
      { hk_customer_h: hk(7), ldts: '2024-01-03 06:00:00', order_count: 1, total_price: 310 },
    ].sort((a, b) => a.hk_customer_h.localeCompare(b.hk_customer_h) || a.ldts.localeCompare(b.ldts))
    const actual = totals
      .map(({ hk_customer_h, ldts, order_count, total_price }) => ({ hk_customer_h, ldts, order_count, total_price }))
      .sort((a, b) => String(a.hk_customer_h).localeCompare(String(b.hk_customer_h)) || String(a.ldts).localeCompare(String(b.ldts)))
    expect(actual).toEqual(expected)
    expect(totals.every((row) => typeof row.hd_customer_order_total_s === 'string')).toBe(true)
    expect(totals.find((row) => row.hk_customer_h === hk(1) && row.order_count === 1)?.hd_customer_order_total_s)
      .toBe(dvHash([1, 250], { kind: 'hashdiff' }).hash)
  })
})

describe('replay', () => {
  const emptyCounts = Object.fromEntries(
    REPLAY_TABLES.map((table) => [
      table,
      { rowsTruth: 0, rowsRebuilt: 0, missingRows: 0, wrongCells: 0, missingCells: 0 },
    ]),
  )
  const summary = (options: Parameters<typeof replay>[0]) => {
    const result = replay(options)
    return Object.fromEntries(
      REPLAY_TABLES.map((table) => {
        const { rowsTruth, rowsRebuilt, missingRows, wrongCells, missingCells } = result.diff[table]
        return [table, { rowsTruth, rowsRebuilt, missingRows, wrongCells, missingCells }]
      }),
    )
  }
  const expectedTables = {
    customer_h: { rowsTruth: 7, rowsRebuilt: 7, missingRows: 0, wrongCells: 6, missingCells: 0 },
    nation_h: { rowsTruth: 6, rowsRebuilt: 6, missingRows: 0, wrongCells: 6, missingCells: 0 },
    order_h: { rowsTruth: 6, rowsRebuilt: 1, missingRows: 5, wrongCells: 0, missingCells: 0 },
    customer_nation_l: { rowsTruth: 8, rowsRebuilt: 7, missingRows: 1, wrongCells: 6, missingCells: 0 },
    order_customer_nh_l: { rowsTruth: 6, rowsRebuilt: 1, missingRows: 5, wrongCells: 0, missingCells: 0 },
    nation_n_s: { rowsTruth: 7, rowsRebuilt: 6, missingRows: 6, wrongCells: 0, missingCells: 0 },
  }

  it('keeps persistent staging identical to truth for every model change and refresh choice', () => {
    for (const change of ['none', 'new-column', 'cast-fix'] as const) {
      for (const fullRefresh of [false, true]) {
        expect(summary({ landing: 'persistent', change, fullRefresh })).toEqual({
          ...emptyCounts,
          customer_h: { rowsTruth: 7, rowsRebuilt: 7, missingRows: 0, wrongCells: 0, missingCells: 0 },
          nation_h: { rowsTruth: 6, rowsRebuilt: 6, missingRows: 0, wrongCells: 0, missingCells: 0 },
          order_h: { rowsTruth: 6, rowsRebuilt: 6, missingRows: 0, wrongCells: 0, missingCells: 0 },
          customer_nation_l: { rowsTruth: 8, rowsRebuilt: 8, missingRows: 0, wrongCells: 0, missingCells: 0 },
          order_customer_nh_l: { rowsTruth: 6, rowsRebuilt: 6, missingRows: 0, wrongCells: 0, missingCells: 0 },
          customer_n_s: {
            rowsTruth: change === 'new-column' ? 10 : 9,
            rowsRebuilt: change === 'new-column' ? 10 : 9,
            missingRows: 0,
            wrongCells: 0,
            missingCells: 0,
          },
          nation_n_s: { rowsTruth: 7, rowsRebuilt: 7, missingRows: 0, wrongCells: 0, missingCells: 0 },
        })
      }
    }
  })

  it('matches the current model when truncated landing has no full refresh', () => {
    expect(summary({ landing: 'truncate', change: 'none', fullRefresh: false })).toEqual({
      ...emptyCounts,
      customer_h: { rowsTruth: 7, rowsRebuilt: 7, missingRows: 0, wrongCells: 0, missingCells: 0 },
      nation_h: { rowsTruth: 6, rowsRebuilt: 6, missingRows: 0, wrongCells: 0, missingCells: 0 },
      order_h: { rowsTruth: 6, rowsRebuilt: 6, missingRows: 0, wrongCells: 0, missingCells: 0 },
      customer_nation_l: { rowsTruth: 8, rowsRebuilt: 8, missingRows: 0, wrongCells: 0, missingCells: 0 },
      order_customer_nh_l: { rowsTruth: 6, rowsRebuilt: 6, missingRows: 0, wrongCells: 0, missingCells: 0 },
      customer_n_s: { rowsTruth: 9, rowsRebuilt: 9, missingRows: 0, wrongCells: 0, missingCells: 0 },
      nation_n_s: { rowsTruth: 7, rowsRebuilt: 7, missingRows: 0, wrongCells: 0, missingCells: 0 },
    })
  })

  it('counts the unmapped email and cast-fix losses in the insert-only vault', () => {
    expect(summary({ landing: 'truncate', change: 'new-column', fullRefresh: false }).customer_n_s).toEqual({
      rowsTruth: 10,
      rowsRebuilt: 9,
      missingRows: 1,
      wrongCells: 9,
      missingCells: 9,
    })
    expect(summary({ landing: 'truncate', change: 'cast-fix', fullRefresh: false }).customer_n_s).toEqual({
      rowsTruth: 9,
      rowsRebuilt: 9,
      missingRows: 0,
      wrongCells: 6,
      missingCells: 0,
    })
  })

  it('counts the rows and changed cells after a truncated full refresh', () => {
    for (const change of ['none', 'new-column', 'cast-fix'] as const) {
      const result = replay({ landing: 'truncate', change, fullRefresh: true })
      const emailRows = change === 'new-column' ? 10 : 9
      expect(
        Object.fromEntries(
          REPLAY_TABLES.filter((table) => table !== 'customer_n_s').map((table) => {
            const { rowsTruth, rowsRebuilt, missingRows, wrongCells, missingCells } = result.diff[table]
            return [table, { rowsTruth, rowsRebuilt, missingRows, wrongCells, missingCells }]
          }),
        ),
      ).toEqual(expectedTables)
      expect(result.diff.customer_n_s).toMatchObject({
        rowsTruth: emailRows,
        rowsRebuilt: 7,
        missingRows: 7,
        wrongCells: 0,
        missingCells: 0,
      })
      expect(result.diff.customer_n_s.rows.filter((row) => row.status === 'missing')).toHaveLength(7)
    }
  })
})
