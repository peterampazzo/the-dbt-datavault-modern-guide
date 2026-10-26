import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { ChapterHeader, Section, P, Callout, Code } from '@/components/Prose'
import { DataTable } from '@/components/DataTable'
import { CodeBlock } from '@/components/CodeBlock'
import { Slider } from '@/components/ui/slider'
import { pit, simulate, SNAPSHOTS, UNKNOWN_KEY } from '@/lib/dv/engine'
import { MODEL } from '@/lib/dv/models'

export default function Pit() {
  const tables = useMemo(() => simulate()[2].tables, [])
  const all = useMemo(() => pit(tables), [tables])
  const [i, setI] = useState(1)
  const sdts = SNAPSHOTS[i]
  const rows = all.filter((r) => r.sdts === sdts)
  const pointers = new Set(rows.map((r) => `${r.customer_n_s_hk}|${r.customer_n_s_ldts}`))
  const phonePointers = new Set(rows.map((r) => `${r.customer_phone_ma_s_hk}|${r.customer_phone_ma_s_ldts}`))

  return (
    <article>
      <ChapterHeader
        n={7}
        title="Business vault: snapshots and PITs"
        lead="Asking 'what did customer 3 look like on 2 January?' means finding the right version in every satellite. A point-in-time table precomputes those pointers per snapshot."
      />
      <Section title="Drag the snapshot">
        <div className="rounded-2xl border bg-card/30 p-5">
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
      <Section title="The models">
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
    </article>
  )
}
