import { Chapter } from '@/components/Chapter'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { ChapterHeader, Section, P, Callout, Code } from '@/components/Prose'
import { DataTable, defaultRowKey, type Tone } from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { isGhost, simulate, type BatchRun, type Decision, type SkipReason, type TableName } from '@/lib/dv/engine'
import { STORY } from '@/lib/dv/dataset'
import { cn } from '@/lib/utils'
import { usePersistentState } from '@/lib/progress'

const PHASES = ['Source lands', 'Stage hashes', 'Hubs load', 'Links load', 'Satellites load']

const TARGETS: { t: TableName; phase: number; tone: Tone; cols: string[] }[] = [
  { t: 'customer_h', phase: 2, tone: 'hub', cols: ['hk_customer_h', 'c_custkey', 'ldts', 'rsrc'] },
  { t: 'customer_nation_l', phase: 3, tone: 'link', cols: ['hk_customer_nation_l', 'hk_customer_h', 'hk_nation_h', 'ldts'] },
  { t: 'customer_n_s', phase: 4, tone: 'sat', cols: ['hk_customer_h', 'ldts', 'hd_customer_n_s', 'c_name', 'c_address', 'c_mktsegment'] },
  { t: 'nation_n_s', phase: 4, tone: 'sat', cols: ['hk_nation_h', 'ldts', 'hd_nation_n_s', 'n_name'] },
]

const SKIP_LABEL: Record<SkipReason, string> = {
  hwm: 'older than the high-water mark',
  exists: 'already exists',
  unchanged: 'hashdiff unchanged',
  duplicate: 'duplicate in this batch',
  still_active: 'already active',
  still_inactive: 'already inactive',
}

function sourceLabel(decision: Decision, run: BatchRun) {
  const row = decision.row
  const customer =
    run.source.customer.find((source) => source.c_custkey === row.c_custkey) ??
    run.stage.stg_customer.find((source) => source.hk_customer_h === row.hk_customer_h && !isGhost(source))
  if (customer && typeof customer.c_custkey === 'number') {
    const name = typeof customer.c_name === 'string' ? customer.c_name : `Customer`
    return `${name} (#${customer.c_custkey})`
  }
  const nation =
    run.source.nation.find((source) => source.n_nationkey === row.n_nationkey) ??
    run.stage.stg_nation.find((source) => source.hk_nation_h === row.hk_nation_h && !isGhost(source))
  if (nation && typeof nation.n_nationkey === 'number') {
    const name = typeof nation.n_name === 'string' ? nation.n_name : 'Nation'
    return `${name} (#${nation.n_nationkey})`
  }
  const key = row.c_custkey ?? row.n_nationkey ?? row.o_orderkey
  return key === undefined ? '' : `#${key}`
}

function tableChange(run: BatchRun, table: TableName) {
  const decisions = run.decisions[table].filter((decision) => !decision.ghost)
  const inserted = decisions.filter((decision) => decision.status === 'inserted')
  const skipped = new Map<SkipReason, number>()
  for (const decision of decisions) {
    if (decision.status !== 'skipped' || !decision.reason) continue
    skipped.set(decision.reason, (skipped.get(decision.reason) ?? 0) + 1)
  }
  const insertedText = `+${inserted.length} ${inserted.length === 1 ? 'row' : 'rows'} in ${table}${inserted.length ? `: ${inserted.map((decision) => sourceLabel(decision, run)).filter(Boolean).join(', ')}` : ''}`
  const skippedText = [...skipped].map(([reason, count]) => `${count} skipped: ${SKIP_LABEL[reason]}`)
  return [insertedText, ...skippedText].join(' · ')
}

function landingSummary(run: BatchRun) {
  const counts = [
    [run.source.customer.length, 'customer'],
    [run.source.nation.length, 'nation'],
    [run.source.phone.length, 'phone'],
    [run.source.orders.length, 'order'],
  ] as const
  return `Landing received ${counts.map(([count, name]) => `${count} ${name} row${count === 1 ? '' : 's'}`).join(', ')}.`
}

function stageSummary(run: BatchRun) {
  const counts = [
    [run.stage.stg_customer, 'customer'],
    [run.stage.stg_nation, 'nation'],
    [run.stage.stg_customer_phone, 'phone'],
    [run.stage.stg_orders, 'order'],
  ] as const
  const rows = counts.map(([stageRows, name]) => {
    const count = stageRows.filter((row) => !isGhost(row)).length
    return `${count} ${name} row${count === 1 ? '' : 's'}`
  })
  return `Stage added hashkeys, hashdiffs, ldts and rsrc to ${rows.join(', ')}.`
}

function Player() {
  const [late, setLate] = useState(false)
  const runs = useMemo(() => simulate({ lateArrival: late }), [late])
  const [batch, setBatch] = usePersistentState('load.batch', 0)
  const [phase, setPhase] = usePersistentState('load.phase', 0)
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
  const currentTables: TableName[] =
    phase === 2 ? ['customer_h'] : phase === 3 ? ['customer_nation_l'] : phase === 4 ? ['customer_n_s', 'nation_n_s'] : []
  const changeText =
    phase === 0
      ? landingSummary(run)
      : phase === 1
        ? stageSummary(run)
        : phase === 2
          ? tableChange(run, 'customer_h')
          : phase === 3
            ? tableChange(run, 'customer_nation_l')
            : `${tableChange(run, 'customer_n_s')} · ${tableChange(run, 'nation_n_s')}`
  const targetTable = ({ t, phase: need, tone, cols }: (typeof TARGETS)[number]) => (
    <DataTable
      key={t}
      title={t}
      tone={tone}
      rows={tableAt(t, need)}
      columns={cols}
      fresh={freshFor(t, need)}
      hideGhosts={!showGhosts}
      skipped={phase >= need ? run.decisions[t].filter((decision) => decision.status === 'skipped' && !decision.ghost) : undefined}
      maxHeight="max-h-72"
    />
  )
  const sourceTable = () => (
    <DataTable
      title="source: raw_customer"
      tone="seed"
      rows={run.source.customer}
      columns={['c_custkey', 'c_name', 'c_address', 'c_nationkey', 'c_mktsegment', 'ldts']}
      maxHeight="max-h-64"
    />
  )
  const stageTable = () => (
    <DataTable
      title="stg_customer"
      tone="stage"
      rows={run.stage.stg_customer}
      hideGhosts={!showGhosts}
      columns={['c_custkey', 'hk_customer_h', 'hk_customer_nation_l', 'hd_customer_n_s', 'ldts']}
      maxHeight="max-h-64"
    />
  )
  const highWaterMark =
    prev ? (prev.tables.customer_h.filter((row) => !isGhost(row)).map((row) => String(row.ldts)).sort().at(-1) ?? '—') : '— (first run)'

  return (
    <div className="min-w-0 rounded-2xl border bg-card/30 p-3 md:p-6">
      <div data-testid="load-player-controls" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="tablist" aria-label="Delivery batch" className="flex flex-wrap gap-1">
            {runs.map((currentRun, index) => (
              <button
                key={currentRun.ldts}
                type="button"
                role="tab"
                aria-selected={index === batch}
                onClick={() => {
                  setBatch(index)
                  setPhase(0)
                }}
                className={cn('rounded-lg border px-3 py-1.5 text-left text-xs', index === batch ? 'border-sky-500/60 bg-sky-500/10 text-foreground' : 'text-muted-foreground hover:bg-muted')}
              >
                <span className="block font-medium">Batch {index + 1}</span>
                <span className="block font-mono text-[10px]">{currentRun.ldts.slice(0, 10)}</span>
              </button>
            ))}
          </div>
          <Button size="sm" onClick={advance}>Next step</Button>
        </div>
        <fieldset className="grid grid-cols-2 gap-2 border-0 p-0 sm:grid-cols-5">
          <legend className="sr-only">Loading phases</legend>
          {PHASES.map((name, index) => (
            <button
              key={name}
              type="button"
              aria-pressed={index === phase}
              onClick={() => setPhase(index)}
              className="min-w-0 rounded-md px-1 text-left"
            >
              <span className="block h-1 overflow-hidden rounded-full bg-muted">
                <motion.span className="block h-full bg-sky-500" animate={{ width: index <= phase ? '100%' : '0%' }} transition={{ duration: 0.25 }} />
              </span>
              <span className={cn('mt-1 block text-xs leading-4', index === phase ? 'font-semibold text-foreground' : 'text-muted-foreground')}>{name}</span>
            </button>
          ))}
        </fieldset>
        <details className="rounded-lg border px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium">More options</summary>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button size="sm" variant="outline" onClick={() => setPlaying((current) => !current)}>
              {playing ? <Pause /> : <Play />} {playing ? 'Pause' : 'Play'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setBatch(0)
                setPhase(0)
                setPlaying(false)
              }}
            >
              <RotateCcw /> Restart
            </Button>
            <label htmlFor="lp-late" className="inline-flex items-center gap-2 text-sm">
              <Switch id="lp-late" checked={late} onCheckedChange={setLate} /> Late-arriving row
            </label>
            <label htmlFor="lp-ghosts" className="inline-flex items-center gap-2 text-sm">
              <Switch id="lp-ghosts" checked={showGhosts} onCheckedChange={setShowGhosts} /> Ghost records
            </label>
          </div>
        </details>
        <details className="rounded-lg border px-3 py-2">
          <summary className="cursor-pointer text-sm font-medium">Batch story · {STORY[batch].title}</summary>
          <ul className="mt-2 space-y-1 text-sm text-foreground/80">
            {STORY[batch].changes.map((change) => <li key={change}>{change}</li>)}
            {late && batch === 2 && <li>Hana (#8) arrives with ldts {runs[1].ldts}, older than the high-water mark.</li>}
          </ul>
        </details>
      </div>

      <div className="mt-4 grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto]">
        <section data-testid="what-changed" aria-live="polite" className="rounded-xl border bg-card/70 p-3">
          <h3 className="text-sm font-semibold">What changed · {PHASES[phase]}</h3>
          <p className="mt-1 text-sm leading-5">{changeText}</p>
        </section>
        <p data-testid="high-water-mark" className="rounded-xl border bg-muted/30 px-3 py-2 text-xs leading-5 text-muted-foreground">
          High-water mark before this run: <span className="font-mono text-foreground">{highWaterMark}</span>
        </p>
      </div>
      <div data-testid={`phase-tables-${phase}`} className="mt-3 grid min-w-0 gap-4 lg:grid-cols-2">
        {phase === 0 && sourceTable()}
        {phase === 1 && stageTable()}
        {phase === 2 && targetTable(TARGETS[0])}
        {phase === 3 && targetTable(TARGETS[1])}
        {phase === 4 && targetTable(TARGETS[2])}
        {phase === 4 && targetTable(TARGETS[3])}
      </div>
      <details className="mt-4 rounded-lg border px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium">Show all tables</summary>
        <div className="mt-3 grid min-w-0 gap-4 lg:grid-cols-2">
          {phase !== 0 && sourceTable()}
          {phase !== 1 && stageTable()}
          {TARGETS.filter(({ t }) => !currentTables.includes(t)).map(targetTable)}
        </div>
      </details>
    </div>
  )
}

export default function LoadPlayer() {
  return (
    <Chapter>
      <ChapterHeader
        title="Loading, batch by batch"
        lead="Three daily full loads of the same sources. Play them and watch what dbt inserts, and what it deliberately skips."
      />
      <Section
        title="Play the batches"
        lead="Choose a batch and phase, then use Next step. The result and table for that phase are directly below the controls; replay the longer batch story from More options."
        keyPoint="Staging calculates the hashes first; hubs and links insert keys, while satellites compare hashdiffs."
      >
        <P>
          Green rows are new in this run. Underneath each table you can see what the macro skipped and why. Turn on <Code>Late-arriving row</Code> to see a record that
          arrives with an old <Code>ldts</Code> get rejected by the high-water mark.
        </P>
        <Player />
      </Section>
      <Section
        title="The rules you just watched"
        lead="Track which rows each batch inserts, skips or keeps as ghosts."
        keyPoint="Raw-vault hubs and links stay insert-only; satellite versions are added when the payload changes."
      >
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
    </Chapter>
  )
}
