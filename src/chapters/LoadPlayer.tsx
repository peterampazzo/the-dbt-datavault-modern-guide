import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Pause, Play, SkipForward, RotateCcw } from 'lucide-react'
import { ChapterHeader, Section, P, Callout, Code } from '@/components/Prose'
import { DataTable, defaultRowKey, type Tone } from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { simulate, type TableName } from '@/lib/dv/engine'
import { STORY } from '@/lib/dv/dataset'
import { cn } from '@/lib/utils'

const PHASES = ['Source lands', 'Stage hashes', 'Hubs load', 'Links load', 'Satellites load']

const TARGETS: { t: TableName; phase: number; tone: Tone; cols: string[] }[] = [
  { t: 'customer_h', phase: 2, tone: 'hub', cols: ['hk_customer_h', 'c_custkey', 'ldts', 'rsrc'] },
  { t: 'customer_nation_l', phase: 3, tone: 'link', cols: ['hk_customer_nation_l', 'hk_customer_h', 'hk_nation_h', 'ldts'] },
  { t: 'customer_n_s', phase: 4, tone: 'sat', cols: ['hk_customer_h', 'ldts', 'hd_customer_n_s', 'c_name', 'c_address', 'c_mktsegment'] },
  { t: 'nation_n_s', phase: 4, tone: 'sat', cols: ['hk_nation_h', 'ldts', 'hd_nation_n_s', 'n_name'] },
]

function Player() {
  const [late, setLate] = useState(false)
  const runs = useMemo(() => simulate({ lateArrival: late }), [late])
  const [batch, setBatch] = useState(0)
  const [phase, setPhase] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [showGhosts, setShowGhosts] = useState(false)

  const advance = () => {
    if (phase < PHASES.length - 1) setPhase(phase + 1)
    else if (batch < runs.length - 1) {
      setBatch(batch + 1)
      setPhase(0)
    } else setPlaying(false)
  }
  useEffect(() => {
    if (!playing) return
    const t = setTimeout(advance, 1500)
    return () => clearTimeout(t)
  })

  const run = runs[batch]
  const prev = batch > 0 ? runs[batch - 1] : null
  const tableAt = (t: TableName, need: number) => (phase >= need ? run.tables[t] : (prev?.tables[t] ?? []))
  const freshFor = (t: TableName, need: number) => {
    if (phase < need) return new Set<string>()
    const before = new Set((prev?.tables[t] ?? []).map(defaultRowKey))
    return new Set(run.tables[t].map(defaultRowKey).filter((k) => !before.has(k)))
  }

  return (
    <div className="min-w-0 rounded-2xl border bg-card/30 p-3 md:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {runs.map((r, i) => (
            <button
              key={r.ldts}
              onClick={() => {
                setBatch(i)
                setPhase(0)
              }}
              className={cn('rounded-lg border px-3 py-1.5 text-left text-xs', i === batch ? 'border-sky-500/60 bg-sky-500/10' : 'text-muted-foreground hover:bg-muted')}
            >
              <div className="font-medium">Batch {i + 1}</div>
              <div className="font-mono text-[10px]">{r.ldts.slice(0, 10)}</div>
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <Button size="sm" onClick={() => setPlaying(!playing)}>
            {playing ? <Pause /> : <Play />} {playing ? 'Pause' : 'Play'}
          </Button>
          <Button size="sm" variant="outline" onClick={advance}>
            <SkipForward /> Step
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Restart"
            onClick={() => {
              setBatch(0)
              setPhase(0)
              setPlaying(false)
            }}
          >
            <RotateCcw />
          </Button>
        </div>
        <div className="ml-auto flex flex-wrap gap-4 text-sm">
          <label className="inline-flex items-center gap-2">
            <Switch checked={late} onCheckedChange={setLate} /> Late-arriving row
          </label>
          <label className="inline-flex items-center gap-2">
            <Switch checked={showGhosts} onCheckedChange={setShowGhosts} /> Ghost records
          </label>
        </div>
      </div>

      <div className="mt-5 flex gap-1">
        {PHASES.map((p, i) => (
          <button key={p} onClick={() => setPhase(i)} className="flex-1 text-left">
            <div className="h-1 overflow-hidden rounded-full bg-muted">
              <motion.div className="h-full bg-sky-400" animate={{ width: i <= phase ? '100%' : '0%' }} transition={{ duration: 0.4 }} />
            </div>
            <div className={cn('mt-1 text-[11px]', i === phase ? 'text-foreground' : 'text-muted-foreground')}>{p}</div>
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4">
        <div className="min-w-0 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div key={batch} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl border bg-card/60 p-4">
              <div className="font-medium">{STORY[batch].title}</div>
              <ul className="mt-2 space-y-1 text-sm text-foreground/80">
                {STORY[batch].changes.map((c) => (
                  <li key={c}>• {c}</li>
                ))}
                {late && batch === 2 && <li className="text-amber-400">• Hana (#8) shows up with ldts {runs[1].ldts}: older than the high-water mark.</li>}
              </ul>
            </motion.div>
          </AnimatePresence>
          <DataTable
            title="source: raw_customer"
            tone="seed"
            rows={run.source.customer}
            columns={['c_custkey', 'c_name', 'c_address', 'c_nationkey', 'c_mktsegment', 'ldts']}
            maxHeight="max-h-64"
          />
          <AnimatePresence>
            {phase >= 1 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <DataTable
                  title="stg_customer"
                  tone="stage"
                  rows={run.stage.stg_customer}
                  hideGhosts={!showGhosts}
                  columns={['c_custkey', 'hk_customer_h', 'hk_customer_nation_l', 'hd_customer_n_s', 'ldts']}
                  maxHeight="max-h-64"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="grid min-w-0 content-start gap-4 lg:grid-cols-2">
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground lg:col-span-2">
            high-water mark before this run:
            <span className="rounded bg-muted px-2 py-0.5 text-foreground">{prev ? (prev.tables.customer_h.filter((r) => !r.__ghost).map((r) => String(r.ldts)).sort().at(-1) ?? '—') : '— (first run)'}</span>
          </div>
          {TARGETS.map(({ t, phase: need, tone, cols }) => (
            <DataTable
              key={t}
              title={t}
              tone={tone}
              rows={tableAt(t, need)}
              columns={cols}
              fresh={freshFor(t, need)}
              hideGhosts={!showGhosts}
              skipped={phase >= need ? run.decisions[t].filter((d) => d.status === 'skipped' && !d.ghost) : undefined}
              maxHeight="max-h-72"
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function LoadPlayer() {
  return (
    <article>
      <ChapterHeader
        n={5}
        title="Loading, batch by batch"
        lead="Three daily full loads of the same sources. Play them and watch what dbt inserts, and what it deliberately skips."
      />
      <Section>
        <P>
          Green rows are new in this run. Underneath each table you can see what the macro skipped and why. Turn on <Code>Late-arriving row</Code> to see a record that
          arrives with an old <Code>ldts</Code> get rejected by the high-water mark.
        </P>
        <Player />
      </Section>
      <Section title="The rules you just watched">
        <div className="grid gap-4 md:grid-cols-2">
          <Callout kind="info" title="Hubs and links: insert if unknown">
            A key that already exists is skipped, however many times it is delivered. Chiara's move to Germany doesn't update the old link; it adds a second one.
          </Callout>
          <Callout kind="tip" title="Satellites: insert if changed">
            The stage hashdiff is compared to the <em>latest</em> row for that key. Daniel coming back unchanged and Emi's trailing spaces both produce the same hashdiff,
            so nothing is written.
          </Callout>
          <Callout kind="warn" title="High-water mark">
            Each incremental run only reads stage rows with <Code>ldts</Code> greater than the latest one already loaded. Late data needs a reload strategy (or a fresh
            <Code>ldts</Code>).
          </Callout>
          <Callout kind="info" title="Ghost records">
            Every stage adds an <em>unknown</em> (<Code>SYSTEM</Code>) and an <em>error</em> (<Code>ERROR</Code>) row with zero/ffff keys, so inner joins in marts never drop
            facts with missing references.
          </Callout>
        </div>
      </Section>
    </article>
  )
}
