import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { ChapterHeader, Section, P, Code } from '@/components/Prose'
import { DataTable } from '@/components/DataTable'
import { CodeBlock } from '@/components/CodeBlock'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BEGIN, END, isGhost, satV1, simulate, type Row } from '@/lib/dv/engine'
import { BATCHES } from '@/lib/dv/dataset'
import { MODEL } from '@/lib/dv/models'
import { cn } from '@/lib/utils'

const NAMES: Record<number, string> = { 1: 'Alice', 2: 'Bruno', 3: 'Chiara', 4: 'Daniel', 5: 'Emi', 6: 'Farah', 7: 'Gabriel' }

function Timeline({ rows }: { rows: Row[] }) {
  const [hover, setHover] = useState<Row | null>(null)
  const col = (ts: string) => (ts === END ? 3 : Math.max(0, BATCHES.indexOf(ts as (typeof BATCHES)[number])))
  const byKey = new Map<string, Row[]>()
  rows.filter((r) => !isGhost(r)).forEach((r) => byKey.set(String(r.c_name).split(' ')[0], [...(byKey.get(String(r.c_name).split(' ')[0]) ?? []), r]))
  return (
    <div className="rounded-xl border bg-card/40 p-4">
      <div className="grid grid-cols-[6rem_1fr] text-[11px] text-muted-foreground">
        <span />
        <div className="grid grid-cols-3">
          {BATCHES.map((b) => (
            <span key={b} className="border-l pl-1 font-mono">
              {b.slice(5, 10)}
            </span>
          ))}
        </div>
      </div>
      {[...byKey.entries()].map(([name, versions]) => (
        <div key={name} className="grid grid-cols-[6rem_1fr] items-center py-1">
          <span className="text-sm">{name}</span>
          <div className="relative h-6">
            {versions.map((v, i) => {
              const start = col(String(v.ldts))
              const end = String(v.ledts) === END ? 3 : start + 1
              return (
                <motion.button
                  type="button"
                  key={i}
                  initial={{ scaleX: 0.4, opacity: 0.6 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  onMouseEnter={() => setHover(v)}
                  onFocus={() => setHover(v)}
                  onClick={() => setHover(v)}
                  aria-pressed={hover === v}
                  aria-label={`${name} version ${i + 1}: valid from ${String(v.ldts)} to ${String(v.ledts)}`}
                  style={{ left: `${(start / 3) * 100}%`, width: `calc(${((end - start) / 3) * 100}% - 4px)`, transformOrigin: 'left' }}
                  className={cn(
                    'absolute inset-y-0 truncate rounded-md border px-2 text-left text-[10px] leading-6 outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60',
                    v.is_current ? 'border-amber-400/70 bg-amber-500/25' : 'border-zinc-500/50 bg-zinc-500/15',
                    hover === v && 'ring-2 ring-sky-500/60',
                  )}
                >
                  {v.is_current ? 'current →' : 'v' + (i + 1)}
                </motion.button>
              )
            })}
          </div>
        </div>
      ))}
      <div className="mt-3 h-10 font-mono text-[11px] text-muted-foreground">
        {hover ? (
          <>
            ldts <span className="text-foreground">{String(hover.ldts)}</span> → ledts <span className="text-foreground">{String(hover.ledts)}</span> · {String(hover.c_address)} ·{' '}
            {String(hover.c_mktsegment)}
          </>
        ) : (
          'Tap or hover a bar to see its validity interval.'
        )}
      </div>
    </div>
  )
}

export default function SatelliteFlavours() {
  const last = useMemo(() => simulate()[2].tables, [])
  const v1 = useMemo(() => satV1(last.customer_n_s, 'hk_customer_h'), [last])
  return (
    <article>
      <ChapterHeader
        n={6}
        title="Satellite flavours"
        lead="The standard satellite stores versions. Real data needs a few variations: end dates, several active rows, relationship validity, and simple observation tracking."
      />
      <Section>
        <Tabs defaultValue="v1">
          <TabsList className="mb-6 h-auto max-w-full flex-wrap justify-start">
            <TabsTrigger value="v1">v0 vs v1</TabsTrigger>
            <TabsTrigger value="ma">Multi-active</TabsTrigger>
            <TabsTrigger value="es">Effectivity</TabsTrigger>
            <TabsTrigger value="rts">Record tracking</TabsTrigger>
          </TabsList>
          <TabsContent value="v1" className="space-y-4">
            <P>
              <Code>sat_v0</Code> is the physical, insert-only table: just <Code>ldts</Code>. <Code>sat_v1</Code> is a view that uses <Code>LEAD()</Code> to derive{' '}
              <Code>ledts</Code> (the next version's ldts minus one microsecond, or {END} when open) and an <Code>is_current</Code> flag. History becomes a set of intervals.
            </P>
            <Timeline rows={v1} />
            <DataTable title="customer_n_s_v1" tone="sat" rows={v1} hideGhosts columns={['hk_customer_h', 'c_name', 'c_address', 'ldts', 'ledts', 'is_current']} />
            <CodeBlock title="customer_n_s_v1.sql" code={MODEL.customer_n_s_v1.code} />
          </TabsContent>
          <TabsContent value="ma" className="space-y-4">
            <P>
              One customer can have a home, mobile and work phone <em>at the same time</em>. A multi-active satellite keys rows by parent + ldts + <Code>phone_type</Code>,
              and hashes the whole set together: when Alice adds a work phone, all three of her rows get a new version.
            </P>
            <DataTable title="customer_phone_ma_s" tone="sat" rows={last.customer_phone_ma_s} hideGhosts />
            <CodeBlock title="customer_phone_ma_s.sql" code={MODEL.customer_phone_ma_s.code} />
          </TabsContent>
          <TabsContent value="es" className="space-y-4">
            <P>
              Links are insert-only, so they can't tell you that a relationship <em>ended</em>. An effectivity satellite tracks <Code>is_active</Code> per link: when Chiara
              moves, her Italy link flips to inactive and the new Germany link starts active. Daniel's links go inactive while he's missing and come back on day three.
            </P>
            <DataTable title="customer_nation_es" tone="sat" rows={last.customer_nation_es} hideGhosts />
            <CodeBlock title="customer_nation_es.sql" code={MODEL.customer_nation_es.code} />
          </TabsContent>
          <TabsContent value="rts" className="space-y-4">
            <P>
              A record-tracking satellite has no payload. It just logs every load and source in which a key appeared. That's how you see that Daniel was absent on day two,
              or that Farah first showed up through an order.
            </P>
            <DataTable title="customer_rts" tone="sat" rows={last.customer_rts} hideGhosts maxHeight="max-h-96" />
            <CodeBlock title="customer_rts.sql" code={MODEL.customer_rts.code} />
          </TabsContent>
        </Tabs>
        <p className="mt-6 text-xs text-muted-foreground">
          Ghost rows use ldts {BEGIN} (unknown) and {END}. Names shown for readability: {Object.values(NAMES).join(', ')}.
        </p>
      </Section>
    </article>
  )
}
