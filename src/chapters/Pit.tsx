import { Chapter } from '@/components/Chapter'
import { Term } from '@/components/Term'
import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { ChapterHeader, Section, P, Callout, Code } from '@/components/Prose'
import { PitDrawing } from '@/components/drawing/PitDrawing'
import { DataTable } from '@/components/DataTable'
import { CodeBlock } from '@/components/CodeBlock'
import { Slider } from '@/components/ui/slider'
import { isGhost, pit, simulate, SNAPSHOTS, UNKNOWN_KEY } from '@/lib/dv/engine'
import { MODEL } from '@/lib/dv/models'
import { usePersistentState } from '@/lib/progress'
import { TimeAxesDrawing } from '@/components/drawing/TimeAxesDrawing'

function dayBefore(value: string) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() - 1)
  return date.toISOString().slice(0, 10)
}

function orderTimeData(runs: ReturnType<typeof simulate>) {
  const tables = runs.at(-1)!.tables
  const orderKeys = new Map(tables.order_h.filter((row) => !isGhost(row)).map((row) => [String(row.hk_order_h), String(row.o_orderkey)] as const))
  const customerKeys = new Map(tables.customer_h.filter((row) => !isGhost(row)).map((row) => [String(row.hk_customer_h), String(row.c_custkey)] as const))
  const rows = tables.order_customer_nh_l
    .filter((row) => !isGhost(row))
    .map((row) => ({
      orderKey: String(orderKeys.get(String(row.hk_order_h))),
      customerKey: String(customerKeys.get(String(row.hk_customer_h))),
      businessDate: String(row.o_orderdate),
      ldts: String(row.ldts),
    }))
    .sort((a, b) => Number(a.orderKey) - Number(b.orderKey))
  return { rows, cutoff: dayBefore(runs[0].ldts), firstLoad: runs[0].ldts }
}

function OrdersByTime({ data }: { data: ReturnType<typeof orderTimeData> }) {
  const [meaning, setMeaning] = useState<'ldts' | 'business'>('ldts')
  const included = (row: (typeof data.rows)[number]) => meaning === 'ldts'
    ? row.ldts.slice(0, 10) <= data.cutoff
    : row.businessDate <= data.cutoff
  const includedCount = data.rows.filter(included).length

  return (
    <div className="border-t pt-4">
      <TimeAxesDrawing />
      <div role="group" aria-label="Choose the date meaning" className="mb-4 flex flex-wrap gap-2">
        <button type="button" aria-pressed={meaning === 'ldts'} onClick={() => setMeaning('ldts')} className="rounded-md border px-3 py-2 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground">
          By load date (ldts)
        </button>
        <button type="button" aria-pressed={meaning === 'business'} onClick={() => setMeaning('business')} className="rounded-md border px-3 py-2 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground">
          By business date (o_orderdate)
        </button>
      </div>
      <p className="mb-2 text-sm font-medium">Cutoff: end of {data.cutoff}</p>
      <div className="rounded-xl border">
        <table data-testid="orders-by-time" className="w-full table-fixed text-left text-xs">
          <caption className="sr-only">Orders with business dates and load timestamps</caption>
          <thead className="bg-muted/60">
            <tr>
              <th scope="col" className="w-[4.25rem] break-words px-1.5 py-1.5">Order key</th>
              <th scope="col" className="w-[4.5rem] break-words px-1.5 py-1.5">Customer</th>
              <th scope="col" className="w-[6.25rem] break-words px-1.5 py-1.5">o_orderdate</th>
              <th scope="col" className="break-words px-1.5 py-1.5">ldts</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => {
              const qualifies = included(row)
              return (
                <tr key={row.orderKey} className={qualifies ? 'border-t-2 border-l-2 border-emerald-700 bg-emerald-500/10 dark:border-emerald-400' : 'border-t'}>
                  <th scope="row" className="break-words px-1.5 py-1.5 font-medium">
                    {qualifies && <span aria-hidden="true">✓ </span>}
                    <span className="sr-only">{qualifies ? 'Included by selected cutoff. ' : ''}</span>{row.orderKey}
                  </th>
                  <td className="break-words px-1.5 py-1.5">{row.customerKey}</td>
                  <td className="break-all px-1.5 py-1.5 font-mono text-[10px]">{row.businessDate}</td>
                  <td className="break-all px-1.5 py-1.5 font-mono text-[10px]">{row.ldts}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {includedCount} of {data.rows.length} orders meet this time meaning. Included rows have a check and a highlight.
      </p>
    </div>
  )
}

export default function Pit() {
  const runs = useMemo(() => simulate(), [])
  const tables = runs[2].tables
  const all = useMemo(() => pit(tables), [tables])
  const timeData = useMemo(() => orderTimeData(runs), [runs])
  const [i, setI] = usePersistentState('pit.snapshot', 1)
  const sdts = SNAPSHOTS[i]
  const rows = all.filter((r) => r.sdts === sdts)
  const pointers = new Set(rows.map((r) => `${r.customer_n_s_hk}|${r.customer_n_s_ldts}`))
  const phonePointers = new Set(rows.map((r) => `${r.customer_phone_ma_s_hk}|${r.customer_phone_ma_s_ldts}`))

  return (
    <Chapter>
      <ChapterHeader
        title={<>Business vault: snapshots and <Term id="pit">PITs</Term></>}
        lead="Asking 'what did customer 3 look like on 2 January?' means finding the right version in every satellite. A point-in-time table precomputes those pointers per snapshot."
      />
      <Section
        title="A photo of one date"
        lead="A PIT shows the satellite versions valid at one snapshot date. It works like a photo of that moment."
        keyPoint="A PIT row points at the satellite versions valid at its snapshot; it does not copy their values."
      >
        <PitDrawing />
      </Section>
      <Section
        title="Drag the snapshot"
        lead="PIT pointers select the satellite row valid at each snapshot date. Move the date to inspect the pointers."
        keyPoint="A PIT row identifies the satellite versions valid for one tracked key at one snapshot."
      >
        <div className="border-t pt-6">
          <div className="mb-6 flex flex-wrap items-center gap-6">
            <div className="w-full max-w-md">
              <Slider aria-label="Snapshot date" value={[i]} min={0} max={SNAPSHOTS.length - 1} step={1} onValueChange={(v) => setI(Array.isArray(v) ? v[0] : (v as number))} />
              <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground">
                {SNAPSHOTS.map((s) => (
                  <span key={s}>{s.slice(5, 10)}</span>
                ))}
              </div>
            </div>
            <motion.div key={sdts} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="font-mono text-sm">
              sdts = <span className="text-violet-700 dark:text-violet-400">{sdts}</span>
            </motion.div>
          </div>
          <DataTable
            title="customer_pit"
            tone="bv"
            rows={rows.map((r) => ({ c_custkey: r.c_custkey, sdts: r.sdts, hk_customer_d: r.hk_customer_d, ldts_customer_n_s: r.customer_n_s_ldts, ldts_customer_phone_ma_s: r.customer_phone_ma_s_hk === UNKNOWN_KEY ? '(unknown)' : r.customer_phone_ma_s_ldts }))}
          />
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <DataTable
              title="customer_n_s (rows the PIT points at are highlighted)"
              tone="sat"
              rows={tables.customer_n_s}
              hideGhosts
              columns={['hk_customer_h', 'ldts', 'c_name', 'c_address', 'c_mktsegment']}
              highlightRow={(r) => pointers.has(`${r.hk_customer_h}|${r.ldts}`)}
            />
            <DataTable
              title="customer_phone_ma_s"
              tone="sat"
              rows={tables.customer_phone_ma_s}
              hideGhosts
              columns={['hk_customer_h', 'ldts', 'phone_type', 'phone_number']}
              highlightRow={(r) => phonePointers.has(`${r.hk_customer_h}|${r.ldts}`)}
            />
          </div>
        </div>
        <Callout kind="info" title="Customers without phones">
          When a satellite has no row yet, the PIT points at the <Code>0000…</Code> ghost record instead of NULL. Marts can then use plain inner equi-joins.
        </Callout>
      </Section>
      <Section
        title="What we knew vs what was true"
        lead={<><Term id="ldts">ldts</Term> is when the vault learned something; a <Term id="business-date">business date</Term> (<Code>o_orderdate</Code>) is when the order happened in the business.</>}
        keyPoint="A PIT answers what the vault knew at a load-time snapshot; a business-date filter answers which events happened by a chosen date."
      >
        <P><Code>o_orderdate</Code> is stored on the order-customer link in the vault.</P>
        <P><Term id="cutoff">A cutoff</Term> includes rows whose selected date is on or before the boundary. First vault load: <Code>{timeData.firstLoad}</Code>.</P>
        <OrdersByTime data={timeData} />
        <Callout kind="info" title="Choose the time meaning before you join">
          PIT and <Code>sat_v1</Code> windows follow load dates. Business dates are payload you filter in a mart; they do not change the satellite versions a PIT points to.
        </Callout>
      </Section>
      <Section
        title="The models"
        lead={<>The <Term id="snapshot-control">snapshot control</Term> defines dates, and PIT models use them to produce pointers. Review the models.</>}
        keyPoint="Snapshot control supplies active dates; the PIT stores equality-join pointers for those dates."
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <CodeBlock title="control_snap_v0.sql" code={MODEL.control_snap_v0.code} />
          <CodeBlock title="customer_pit.sql" code={MODEL.customer_pit.code} />
        </div>
        <P>
          <span className="mt-6 block">
            And the payoff: a dimension for BI tools becomes a set of equi-joins on PIT pointers, with no <Code>BETWEEN</Code> on timestamps.
          </span>
        </P>
        <CodeBlock title="dim_customer.sql" code={MODEL.dim_customer.code} />
      </Section>
    </Chapter>
  )
}
