import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChapterHeader, Section, P, Callout, Code } from '@/components/Prose'
import { CodeBlock } from '@/components/CodeBlock'
import { Switch } from '@/components/ui/switch'
import { MODEL, LAYER_META, type DbtModel } from '@/lib/dv/models'
import { cn } from '@/lib/utils'

const GROUPS: { label: string; models: string[] }[] = [
  { label: 'Stage', models: ['stg_customer', 'stg_nation', 'stg_orders'] },
  { label: 'Hubs', models: ['customer_h', 'nation_h', 'order_h'] },
  { label: 'Links', models: ['customer_nation_l', 'order_customer_nh_l'] },
  { label: 'Satellites', models: ['customer_n_s', 'nation_n_s'] },
]

const KEYS: Record<string, string> = {
  "materialized='view'": 'Stages are views: always recomputed from the landed data, never stored.',
  "materialized='incremental'": 'Vault tables are incremental. dbt creates them on the first run and only inserts new rows afterwards.',
  source_model: 'The relation(s) to read from. In a stage this is the landed source; in vault entities it is a stage.',
  'ldts:': 'Column holding the load timestamp: when the warehouse received the row.',
  'rsrc:': 'Column holding the record source: which system and feed the row came from.',
  hashed_columns: 'Every hashkey and hashdiff the stage computes. The macro generates the trim, upper-case, concatenation and MD5 logic for you.',
  is_hashdiff: 'Marks a hashdiff: case-sensitive, columns sorted alphabetically, used to detect changes in a satellite.',
  'hashkey:': 'The hub hashkey column produced by the stage.',
  business_keys: 'The business key column(s) stored in the hub next to the hashkey.',
  source_models: 'One or more stages that feed this entity. Several sources can load the same hub.',
  rsrc_static: 'A fixed record-source value per source, used to filter and to label rows.',
  bk_columns: 'The business key has a different name in this source (o_custkey instead of c_custkey).',
  link_hashkey: 'The link hashkey: the hash of all participating business keys together.',
  foreign_hashkeys: 'The hub hashkeys this link connects.',
  'payload:': 'Non-historized links carry their immutable event attributes directly.',
  parent_hashkey: 'The hub (or link) this satellite describes.',
  src_hashdiff: 'The hashdiff column compared against the latest satellite row to decide whether to insert.',
  src_payload: 'The descriptive attributes stored in the satellite.',
  'datavault4dbt.': 'The macro call. It reads the YAML and generates the full SQL for the platform you run on.',
}

function annotations(m: DbtModel) {
  const lines = m.code.split('\n')
  return Object.entries(KEYS)
    .map(([k, text]) => ({ k, text, lines: lines.flatMap((l, i) => (l.includes(k) ? [i + 1] : [])) }))
    .filter((a) => a.lines.length)
}

function ModelExplorer() {
  const [name, setName] = useState('stg_customer')
  const [key, setKey] = useState<string | null>(null)
  const m = MODEL[name]
  const notes = useMemo(() => annotations(m), [m])
  const active = notes.find((n) => n.k === key)
  useEffect(() => setKey(null), [name])

  return (
    <div className="grid gap-4 lg:grid-cols-[13rem_1fr_18rem]">
      <div className="space-y-4">
        {GROUPS.map((g) => (
          <div key={g.label}>
            <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">{g.label}</div>
            <div className="flex flex-wrap gap-1 lg:flex-col">
              {g.models.map((n) => {
                const meta = LAYER_META[MODEL[n].layer]
                return (
                  <button
                    key={n}
                    onClick={() => setName(n)}
                    className={cn(
                      'relative flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left font-mono text-xs transition-colors',
                      n === name ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {n === name && <motion.span layoutId="model-pick" className="absolute inset-0 rounded-lg bg-muted" />}
                    <span className={cn('relative size-2 rounded-full', meta.color)} />
                    <span className="relative">{n}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="min-w-0">
        <AnimatePresence mode="wait">
          <motion.div key={name} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <p className="mb-3 text-sm text-muted-foreground">{m.description}</p>
            <CodeBlock title={`models/${m.layer === 'stage' ? 'stage' : 'raw_vault'}/${m.name}.sql`} code={m.code} highlight={active?.lines} />
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="space-y-1.5">
        <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Click a key</div>
        {notes.map((n) => (
          <button
            key={n.k}
            onClick={() => setKey(key === n.k ? null : n.k)}
            className={cn(
              'block w-full rounded-lg border px-3 py-2 text-left text-xs transition-colors',
              key === n.k ? 'border-sky-500/60 bg-sky-500/10' : 'hover:bg-muted/50',
            )}
          >
            <div className="font-mono font-medium text-sky-400">{n.k.replace(/[:.]$/, '')}</div>
            <AnimatePresence initial={false}>
              {key === n.k && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <p className="pt-1 leading-5 text-foreground/80">{n.text}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        ))}
      </div>
    </div>
  )
}

const MAX_LDTS = "(SELECT MAX(ldts) FROM {{ this }} WHERE ldts != '8888-12-31 23:59:59')"

function hubSql(incremental: boolean) {
  const hwm = (src: string) => (incremental ? `\n    FROM {{ ref('${src}') }}\n    WHERE ldts > ${MAX_LDTS}` : `\n    FROM {{ ref('${src}') }}`)
  return `WITH src_new_1 AS (
    SELECT hk_customer_h, c_custkey, ldts, rsrc${hwm('stg_customer')}
),
src_new_2 AS (
    SELECT hk_customer_h, o_custkey AS c_custkey, ldts, rsrc${hwm('stg_orders')}
),
source_new_union AS (
    SELECT * FROM src_new_1
    UNION ALL
    SELECT * FROM src_new_2
),
earliest_hk_over_all_sources AS (
    SELECT * FROM source_new_union
    QUALIFY ROW_NUMBER() OVER (PARTITION BY hk_customer_h ORDER BY ldts) = 1
),
records_to_insert AS (
    SELECT * FROM earliest_hk_over_all_sources${
      incremental
        ? `
    WHERE NOT EXISTS (
        SELECT 1 FROM {{ this }} t
        WHERE t.hk_customer_h = earliest_hk_over_all_sources.hk_customer_h
    )`
        : ''
    }
)
SELECT * FROM records_to_insert`
}

function CompiledHub() {
  const [inc, setInc] = useState(true)
  const sql = hubSql(inc)
  const hl = inc ? sql.split('\n').flatMap((l, i) => (/WHERE ldts >|NOT EXISTS|SELECT 1 FROM|t\.hk_customer_h/.test(l) ? [i + 1] : [])) : []
  return (
    <div>
      <label className="mb-3 inline-flex items-center gap-2 text-sm">
        <Switch checked={inc} onCheckedChange={setInc} /> {inc ? 'Incremental run (table already exists)' : 'First run (full refresh)'}
      </label>
      <CodeBlock title="target/compiled/…/customer_h.sql (simplified)" code={sql} highlight={hl} />
    </div>
  )
}

const TERMINAL = [
  ['$ dbt deps', ''],
  ['Installing datavault4dbt', 'text-muted-foreground'],
  ['$ dbt seed', ''],
  ['OK loaded seed file raw_customer ......... [OK]', 'text-emerald-400'],
  ['OK loaded seed file raw_nation ........... [OK]', 'text-emerald-400'],
  ['OK loaded seed file raw_orders ........... [OK]', 'text-emerald-400'],
  ['$ dbt build --select +customer_n_s +nation_n_s +order_customer_nh_l', ''],
  ['OK created view model stg_customer ....... [OK]', 'text-slate-300'],
  ['OK created view model stg_nation ......... [OK]', 'text-slate-300'],
  ['OK created view model stg_orders ......... [OK]', 'text-slate-300'],
  ['OK created incremental model customer_h .. [OK]', 'text-sky-400'],
  ['OK created incremental model nation_h .... [OK]', 'text-sky-400'],
  ['OK created incremental model order_h ..... [OK]', 'text-sky-400'],
  ['OK created incremental model customer_nation_l  [OK]', 'text-emerald-400'],
  ['OK created incremental model order_customer_nh_l [OK]', 'text-emerald-400'],
  ['OK created incremental model customer_n_s  [OK]', 'text-amber-400'],
  ['OK created incremental model nation_n_s .. [OK]', 'text-amber-400'],
  ['Completed successfully. PASS=13 WARN=0 ERROR=0', 'text-foreground font-semibold'],
]

function Terminal() {
  const [n, setN] = useState(0)
  const [run, setRun] = useState(0)
  useEffect(() => {
    if (run === 0) return
    const t = setInterval(() => setN((x) => (x >= TERMINAL.length ? x : x + 1)), 260)
    return () => clearInterval(t)
  }, [run])
  const start = () => {
    setN(0)
    setRun((r) => r + 1)
  }
  return (
    <div className="overflow-hidden rounded-xl border bg-zinc-950 font-mono text-[12px] leading-6 text-zinc-200">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2 text-xs text-zinc-500">
        terminal
        <button onClick={start} className="rounded px-2 py-0.5 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50">
          {run === 0 ? '▶ Run dbt build' : '↻ Run again'}
        </button>
      </div>
      <div className="h-[29rem] overflow-hidden px-4 py-3">
        {TERMINAL.slice(0, n).map(([l, c], i) => (
          <motion.div key={`${run}-${i}`} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className={cn('whitespace-pre', c, l.startsWith('$') && 'mt-2 text-zinc-50')}>
            {l}
          </motion.div>
        ))}
        {run === 0 && <div className="text-zinc-500">Press Run dbt build to watch dbt load the vault in dependency order.</div>}
        {run > 0 && n < TERMINAL.length && <span className="inline-block h-4 w-2 bg-zinc-300 motion-safe:animate-pulse" />}
      </div>
    </div>
  )
}

export default function BuildWithDbt() {
  return (
    <article>
      <ChapterHeader
        n={3}
        title="Building it with dbt"
        lead="Every box from the modelling canvas becomes one dbt model. With datavault4dbt, each model is a few lines of YAML handed to a macro, and the macro writes the loading SQL."
      />

      <Section title="dbt in one minute">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['Models are SELECTs', 'Each .sql file in models/ is one table or view. dbt wraps your SELECT in the right DDL.'],
            ['ref() builds the graph', "{{ ref('stg_customer') }} tells dbt what depends on what, so it runs stages before hubs before satellites."],
            ['Incremental = insert-only', 'An incremental model only processes new rows after its first run. That matches how vault tables load.'],
          ].map(([t, d]) => (
            <div key={t} className="rounded-xl border bg-card/50 p-4">
              <div className="font-medium">{t}</div>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div>
            <P>
              <a href="https://github.com/ScalefreeCOM/datavault4dbt" className="text-sky-400 hover:underline" target="_blank" rel="noreferrer">
                datavault4dbt
              </a>{' '}
              is a dbt package by Scalefree with one macro per Data Vault entity type: <Code>stage</Code>, <Code>hub</Code>, <Code>link</Code>, <Code>nh_link</Code>,{' '}
              <Code>sat_v0</Code>, <Code>sat_v1</Code>, <Code>pit</Code> and more. It follows the Data Vault 2.0 standards and supports Snowflake, BigQuery, Databricks, Fabric,
              Postgres and others.
            </P>
            <P>Add it to <Code>packages.yml</Code>, run <Code>dbt deps</Code>, and the macros are available in every model.</P>
          </div>
          <CodeBlock
            lang="yaml"
            title="packages.yml"
            code={`packages:
  - package: ScalefreeCOM/datavault4dbt
    version: [">=1.9.0", "<2.0.0"]`}
          />
        </div>
      </Section>

      <Section title="From canvas to code">
        <P>
          Pick a model on the left to see its file. Click a YAML key on the right to see what it means and where it appears. The stages compute the hashes once;
          everything downstream just references the hash columns by name.
        </P>
        <ModelExplorer />
      </Section>

      <Section title="What the hub macro generates">
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <P>
              <Code>{'datavault4dbt.hub()'}</Code> expands into a chain of CTEs. It reads every source stage, unions them, keeps the earliest row per hashkey and
              inserts only keys the hub doesn't have yet.
            </P>
            <P>
              Flip the switch to compare the first run with an incremental one. On an incremental run two guards appear: a <strong>high-water mark</strong>{' '}
              (only rows newer than the latest <Code>ldts</Code> already loaded) and a <strong>NOT EXISTS</strong> check against the target.
            </P>
            <Callout kind="warn" title="Why insert-only matters">
              Hubs and links never update or delete. Re-running a load is safe (idempotent), and every row can be traced back to the load that created it.
            </Callout>
          </div>
          <CompiledHub />
        </div>
      </Section>

      <Section title="Run it">
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <div>
            <P>
              dbt resolves the <Code>ref()</Code> graph and runs everything in order: views for the stages first, then hubs, links and satellites. In practice you'd
              trigger this from an orchestrator after every source delivery.
            </P>
            <P>
              The next chapters open up what happens inside these runs: how the hashes are built, what each load inserts and skips, and how history is queried.
            </P>
          </div>
          <Terminal />
        </div>
      </Section>
    </article>
  )
}
