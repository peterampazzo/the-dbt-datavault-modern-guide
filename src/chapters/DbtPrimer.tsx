import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Chapter } from '@/components/Chapter'
import { CodeBlock } from '@/components/CodeBlock'
import { LivePrimerResult } from '@/components/LivePrimerResult'
import type { PrimerResultColumn, PrimerResultRow } from '@/components/PrimerResult'
import { SqlServerNote } from '@/components/SqlServerNote'
import { Callout, ChapterHeader, Code, P, Section } from '@/components/Prose'
import { Term } from '@/components/Term'
import { MODEL } from '@/lib/dv/models'
import { BATCHES, CUSTOMERS } from '@/lib/dv/dataset'
import { DBT_FLOW, PRIMER, PROCEDURE_FLOW, SSIS_FLOW, WORKFLOW_CONCEPTS, type WorkflowConcept, type WorkflowView } from '@/lib/primer/project'
import { cn } from '@/lib/utils'

function PrimerFooter({ keyPoint, note }: { keyPoint: ReactNode; note: string }) {
  return (
    <>
      <p className="mt-6 max-w-3xl text-sm leading-6">
        <strong>Key point:</strong> {keyPoint}
      </p>
      <SqlServerNote>{note}</SqlServerNote>
    </>
  )
}

const VIEW_LABELS: Record<WorkflowView, string> = {
  ssis: 'SSIS package',
  procedure: 'Stored procedure',
  dbt: 'dbt',
}

const MAP_ROWS = [
  ['SSIS package / procedure', 'Model'],
  ['Precedence constraints / call order', '`ref()` DAG'],
  ['Derived Column / Lookup', 'SQL in the model'],
  ['Data Flow destination', 'Materialization'],
  ['`MERGE`', 'Incremental model'],
  ['SQL Agent job', 'Scheduled `dbt build`'],
  ['Package configurations / environments', 'Targets and vars'],
  ['`.dtsx` XML in shared folders', 'Plain text in git'],
  ['Deploy by hand', 'CI/CD'],
  ['Checks done by hand', 'Tests'],
  ['Documentation done by hand', '`dbt docs` lineage'],
]

function ConceptButton({
  concept,
  label,
  selected,
  onSelect,
}: {
  concept: WorkflowConcept
  label: string
  selected: WorkflowConcept
  onSelect: (value: WorkflowConcept) => void
}) {
  const active = concept === selected
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onSelect(concept)}
      className={cn(
        'rounded-lg border px-2 py-1.5 text-left text-sm transition-colors',
        active ? 'border-sky-600 bg-sky-500/10 text-foreground' : 'bg-card/50 hover:bg-muted',
      )}
    >
      {label}
      {active && <span className="ml-2 text-xs font-medium text-sky-800 dark:text-sky-300">Selected</span>}
    </button>
  )
}

function WorkflowComparison() {
  const [view, setView] = useState<WorkflowView>('ssis')
  const [selected, setSelected] = useState<WorkflowConcept>('source')
  const concept = WORKFLOW_CONCEPTS.find((item) => item.id === selected)!

  return (
    <div className="space-y-3">
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Choose a SQL Server or dbt representation</legend>
        {(Object.keys(VIEW_LABELS) as WorkflowView[]).map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={view === key}
            onClick={() => setView(key)}
            className={cn(
              'rounded-lg border px-2 py-1.5 text-sm font-medium',
              view === key ? 'border-sky-600 bg-sky-500/10' : 'bg-card/50 hover:bg-muted',
            )}
          >
            {VIEW_LABELS[key]}
          </button>
        ))}
      </fieldset>

      {view === 'ssis' && (
        <div className="space-y-3 border-t pt-6">
          <div>
            <h3 className="mb-2 text-sm font-semibold">Control flow</h3>
            <div className="flex flex-wrap items-center gap-2">
              {SSIS_FLOW.controlFlow.map((node, index) => (
                <div key={node.id} className="flex items-center gap-2">
                  {index > 0 && (
                    <span className="text-xs text-muted-foreground" aria-label="On Success precedence constraint">
                      — On success →
                    </span>
                  )}
                  <ConceptButton concept={node.concept} label={node.label} selected={selected} onSelect={setSelected} />
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold">Data flow</h3>
            <div className="flex flex-wrap items-center gap-2">
              {SSIS_FLOW.dataFlow.map((node, index) => (
                <div key={node.id} className="flex items-center gap-2">
                  {index > 0 && <span aria-hidden className="text-muted-foreground">→</span>}
                  <ConceptButton concept={node.concept} label={node.label} selected={selected} onSelect={setSelected} />
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ConceptButton concept={SSIS_FLOW.errorOutput.concept} label={SSIS_FLOW.errorOutput.label} selected={selected} onSelect={setSelected} />
            <ConceptButton concept={SSIS_FLOW.schedule.concept} label={SSIS_FLOW.schedule.label} selected={selected} onSelect={setSelected} />
          </div>
        </div>
      )}

      {view === 'procedure' && (
        <div className="space-y-3">
          <div className="max-h-80 overflow-auto rounded-xl">
            <CodeBlock title={PRIMER.sqlserver_customer_h.path} code={PRIMER.sqlserver_customer_h.code} lang={PRIMER.sqlserver_customer_h.lang} />
          </div>
          <div className="flex flex-wrap gap-2">
            {PROCEDURE_FLOW.map((node) => (
              <ConceptButton key={node.id} concept={node.concept} label={node.label} selected={selected} onSelect={setSelected} />
            ))}
          </div>
        </div>
      )}

      {view === 'dbt' && (
        <div className="space-y-3">
          <div className="max-h-80 overflow-auto rounded-xl">
            <CodeBlock title="models/raw_vault/customer_h.sql · datavault4dbt" code={MODEL['customer_h'].code} lang="yaml" />
          </div>
          <div className="flex flex-wrap gap-2">
            {DBT_FLOW.map((node) => (
              <ConceptButton key={node.id} concept={node.concept} label={node.label} selected={selected} onSelect={setSelected} />
            ))}
          </div>
        </div>
      )}

      <div aria-live="polite" className="grid gap-2 md:grid-cols-3">
        {([
          ['SSIS', concept.equivalents.ssis],
          ['Stored procedure', concept.equivalents.procedure],
          ['dbt', concept.equivalents.dbt],
        ] as const).map(([system, equivalent]) => (
          <div key={system} className="rounded-lg border border-sky-600/50 bg-sky-500/5 p-2 text-sm">
            <strong>{system}</strong>
            <p className="mt-1 leading-5">
              <span className="font-medium">Selected: {concept.label} ↔ </span>
              {equivalent}
            </p>
          </div>
        ))}
      </div>

      <div tabIndex={0} aria-label="SQL Server to dbt mapping" className="max-w-full overflow-x-auto rounded-xl border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <table className="w-full min-w-[32rem] border-collapse text-left text-xs leading-4">
          <thead className="bg-muted/60">
            <tr>
              <th scope="col" className="px-2 py-1 font-semibold">SQL Server</th>
              <th scope="col" className="px-2 py-1 font-semibold">dbt</th>
            </tr>
          </thead>
          <tbody>
            {MAP_ROWS.map(([legacy, modern]) => (
              <tr key={legacy} className="border-t align-top">
                <td className="px-2 py-1">{legacy}</td>
                <td className="px-2 py-1">{modern}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Callout kind="tip" title="What stays the same">
        It is still SQL, and the same Data Vault patterns still apply: business keys, hashkeys, hashdiffs and insert-only history.
      </Callout>
    </div>
  )
}

type PrimerModel = (typeof PRIMER)[keyof typeof PRIMER]

const PRIMER_MODELS = Object.values(PRIMER).filter(
  (file): file is PrimerModel => file.path.startsWith('models/') && file.path.endsWith('.sql'),
)

const MODEL_PARENTS = new Map(
  PRIMER_MODELS.map((model) => [
    model.name,
    [...model.code.matchAll(/ref\(['"]([^'"]+)['"]\)/g)].map((match) => match[1]),
  ]),
)

const PRIMER_TESTS = PRIMER.schema_tests.code
  .split(/(?=^\s{2}- name: )/m)
  .flatMap((block) => {
    const modelName = block.match(/^\s{2}- name:\s*([\w]+)/m)?.[1]
    if (!modelName) return []
    const columns = block.split(/(?=^\s{6}- name: )/m).slice(1)
    return columns.flatMap((column) => {
      const columnName = column.match(/^\s{6}- name:\s*([\w]+)/m)?.[1]
      if (!columnName) return []
      return [...column.matchAll(/^\s{10}-\s*([\w]+)/gm)].map((match) => ({
        id: `${modelName}.${columnName}.${match[1]}`,
        model: modelName,
      }))
    })
  })

type PrimerCommand = 'build' | 'run' | 'test' | 'compile'
type PrimerSelection = 'none' | 'exact' | 'downstream' | 'upstream'

const COMMANDS: PrimerCommand[] = ['build', 'run', 'test', 'compile']
const SELECTIONS: { id: PrimerSelection; label: string }[] = [
  { id: 'none', label: '(none)' },
  { id: 'exact', label: '<m>' },
  { id: 'downstream', label: '<m>+' },
  { id: 'upstream', label: '+<m>' },
]
const TARGETS = [...PRIMER.profiles.code.matchAll(/^\s{4}([\w-]+):\s*$/gm)].map((match) => match[1])

function selectedModels(selection: PrimerSelection, model: string) {
  if (selection === 'none') return new Set(PRIMER_MODELS.map((entry) => entry.name))
  const included = new Set([model])
  let changed = true
  while (changed) {
    changed = false
    for (const entry of PRIMER_MODELS) {
      const parents = MODEL_PARENTS.get(entry.name) ?? []
      if (selection === 'downstream' && parents.some((parent) => included.has(parent)) && !included.has(entry.name)) {
        included.add(entry.name)
        changed = true
      }
      if (selection === 'upstream' && parents.some((parent) => included.has(parent))) {
        for (const parent of parents) {
          if (!included.has(parent)) {
            included.add(parent)
            changed = true
          }
        }
      }
    }
  }
  return included
}

function CommandBuilder() {
  const [command, setCommand] = useState<PrimerCommand>('build')
  const [selection, setSelection] = useState<PrimerSelection>('none')
  const [model, setModel] = useState<string>(PRIMER_MODELS[0]?.name ?? '')
  const [target, setTarget] = useState(TARGETS[0] ?? '')
  const included = selectedModels(selection, model)
  const models = PRIMER_MODELS.filter((entry) => included.has(entry.name))
  const tests = PRIMER_TESTS.filter((entry) => included.has(entry.model))
  const nodes =
    command === 'test'
      ? tests.map((entry) => ({ id: entry.id, kind: 'test' }))
      : command === 'build'
        ? models.flatMap((entry) => [
            { id: entry.name, kind: 'model' },
            ...tests.filter((test) => test.model === entry.name).map((test) => ({ id: test.id, kind: 'test' })),
          ])
        : models.map((entry) => ({ id: entry.name, kind: 'model' }))
  const selectionText = selection === 'none' ? '' : ` --select ${selection === 'exact' ? model : selection === 'downstream' ? `${model}+` : `+${model}`}`
  const commandText = `dbt ${command}${selectionText} --target ${target}`

  return (
    <div className="mx-auto max-w-[48rem] space-y-5 rounded-xl border bg-card/50 p-4">
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Command</legend>
        <div className="flex flex-wrap gap-2">
          {COMMANDS.map((item) => (
            <button key={item} type="button" aria-pressed={command === item} onClick={() => setCommand(item)} className="rounded-md border px-3 py-2 font-mono text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground">
              {item}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Selection</legend>
        <div className="flex flex-wrap gap-2">
          {SELECTIONS.map((item) => (
            <button key={item.id} type="button" aria-pressed={selection === item.id} onClick={() => setSelection(item.id)} className="rounded-md border px-3 py-2 font-mono text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground">
              {item.label}
            </button>
          ))}
        </div>
      </fieldset>
      {selection !== 'none' && (
        <label className="block text-sm font-medium">
          Model <select value={model} onChange={(event) => setModel(event.target.value)} className="ml-2 rounded-md border bg-background px-2 py-1 font-mono text-xs">
            {PRIMER_MODELS.map((entry) => <option key={entry.name} value={entry.name}>{entry.name}</option>)}
          </select>
        </label>
      )}
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Target</legend>
        <div className="flex flex-wrap gap-2">
          {TARGETS.map((item) => (
            <button key={item} type="button" aria-pressed={target === item} onClick={() => setTarget(item)} className="rounded-md border px-3 py-2 font-mono text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground">
              {item}
            </button>
          ))}
        </div>
      </fieldset>
      <code aria-label="Generated dbt command" className="block overflow-x-auto rounded-lg bg-zinc-950 p-3 font-mono text-sm text-zinc-100">
        {commandText}
      </code>
      <div>
        <h3 className="mb-2 text-sm font-semibold">Nodes selected, in graph order</h3>
        {nodes.length ? (
          <ol className="space-y-1 font-mono text-xs">
            {nodes.map((node, index) => <li key={`${node.kind}-${node.id}`}><span className="mr-2 tabular-nums text-muted-foreground">{index + 1}.</span><span className="text-muted-foreground">{node.kind}</span> · {node.id}</li>)}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">No tests are attached to the selected models in this Primer project.</p>
        )}
      </div>
    </div>
  )
}

const FABRIC_PROFILE = `guide:
  target: dev
  outputs:
    dev:
      type: fabricspark
      method: livy
      authentication: CLI
      workspaceid: "{{ env_var('FABRIC_WORKSPACE_ID') }}"
      lakehouseid: "{{ env_var('FABRIC_LAKEHOUSE_ID') }}"
      lakehouse: "{{ env_var('FABRIC_LAKEHOUSE') }}"
      schema: "{{ env_var('DBT_DEV_SCHEMA') }}"
      threads: 1`

type PrimerNode = 'source' | 'stg_customer' | 'customer_by_segment'

const MODEL_NODES: { id: PrimerNode; label: string; file: keyof typeof PRIMER }[] = [
  { id: 'source', label: 'landing.customer', file: 'sources' },
  { id: 'stg_customer', label: 'stg_customer', file: 'stg_customer' },
  { id: 'customer_by_segment', label: 'customer_by_segment', file: 'customer_by_segment' },
]

function primerResultFor(node: PrimerNode): { columns: PrimerResultColumn[]; rows: PrimerResultRow[]; summary: string } {
  const firstBatch = CUSTOMERS[0]
  if (node === 'source') {
    return {
      columns: [
        { key: 'c_custkey', label: 'c_custkey' },
        { key: 'c_name', label: 'c_name' },
        { key: 'c_mktsegment', label: 'c_mktsegment' },
      ],
      rows: firstBatch.slice(0, 3).map(({ c_custkey, c_name, c_mktsegment }) => ({ c_custkey, c_name, c_mktsegment })),
      summary: `Sample rows from the first delivery (${BATCHES[0]}).`,
    }
  }
  if (node === 'stg_customer') {
    return {
      columns: [
        { key: 'c_custkey', label: 'c_custkey' },
        { key: 'c_name', label: 'c_name' },
        { key: 'c_address', label: 'c_address' },
        { key: 'c_acctbal', label: 'c_acctbal' },
      ],
      rows: firstBatch.slice(0, 3).map((row) => ({
        c_custkey: row.c_custkey,
        c_name: row.c_name.trim(),
        c_address: row.c_address.trim(),
        c_acctbal: row.c_acctbal,
      })),
      summary: 'The stage SELECT casts and trims source columns; values come from the first delivery.',
    }
  }

  const groups = new Map<string, { customer_count: number; total_account_balance: number }>()
  for (const row of firstBatch) {
    const group = groups.get(row.c_mktsegment) ?? { customer_count: 0, total_account_balance: 0 }
    group.customer_count += 1
    group.total_account_balance += row.c_acctbal
    groups.set(row.c_mktsegment, group)
  }
  return {
    columns: [
      { key: 'c_mktsegment', label: 'c_mktsegment' },
      { key: 'customer_count', label: 'customer_count' },
      { key: 'total_account_balance', label: 'total_account_balance' },
    ],
    rows: [...groups].map(([c_mktsegment, group]) => ({ c_mktsegment, ...group })),
    summary: 'Grouped from the same first-delivery customer rows in dataset.ts.',
  }
}

function ModelsAndRef() {
  const [selected, setSelected] = useState<PrimerNode>('source')
  const node = MODEL_NODES.find((item) => item.id === selected)!
  const file = PRIMER[node.file]
  const result = primerResultFor(selected)

  return (
    <div className="space-y-5">
      <ol aria-label="Model dependency graph" className="flex flex-col gap-2 md:flex-row md:items-center">
        {MODEL_NODES.map((item, index) => (
          <li key={item.id} className="flex items-center gap-2">
            {index > 0 && <span aria-hidden className="text-muted-foreground">→</span>}
            <button
              type="button"
              aria-pressed={selected === item.id}
              onClick={() => setSelected(item.id)}
              className={cn(
                'rounded-lg border px-3 py-2 text-left font-mono text-sm',
                selected === item.id ? 'border-sky-600 bg-sky-500/10' : 'bg-card/50 hover:bg-muted',
              )}
            >
              {item.label}
              {selected === item.id && <span className="ml-2 font-sans text-xs text-sky-800 dark:text-sky-300">Selected</span>}
            </button>
          </li>
        ))}
      </ol>
      <div className="grid gap-4 lg:grid-cols-2">
        <CodeBlock title={file.path} code={file.code} lang={file.lang} />
        <LivePrimerResult
          title={`Static result · ${node.label}`}
          columns={result.columns}
          rows={result.rows}
          summary={result.summary}
          stepIds={['models-ref-source', 'models-ref-stg', 'models-ref-mart']}
          activeStepId={`models-ref-${selected === 'source' ? 'source' : selected === 'stg_customer' ? 'stg' : 'mart'}`}
        />
      </div>
    </div>
  )
}

function JinjaCompile() {
  const [compiled, setCompiled] = useState(false)
  const file = compiled ? PRIMER.compiled_round_amount : PRIMER.round_amount_macro

  return (
    <>
      <div className="space-y-4">
      <fieldset className="flex gap-2">
        <legend className="sr-only">Show Jinja or compiled SQL</legend>
        <button type="button" aria-pressed={!compiled} onClick={() => setCompiled(false)} className={cn('rounded-lg border px-3 py-2 text-sm', !compiled ? 'border-sky-600 bg-sky-500/10' : 'bg-card/50')}>
          Jinja
        </button>
        <button type="button" aria-pressed={compiled} onClick={() => setCompiled(true)} className={cn('rounded-lg border px-3 py-2 text-sm', compiled ? 'border-sky-600 bg-sky-500/10' : 'bg-card/50')}>
          Compiled SQL
        </button>
      </fieldset>
      {!compiled && <CodeBlock title={PRIMER.round_amount_usage.path} code={PRIMER.round_amount_usage.code} lang={PRIMER.round_amount_usage.lang} />}
      <CodeBlock title={file.path} code={file.code} lang={file.lang} />
      </div>
      {!compiled && <P>The macro definition lives in its own file; this model calls it with <Code>{`{{ round_amount('c_acctbal') }}`}</Code>.</P>}
    </>
  )
}

type Materialization = 'view' | 'table' | 'incremental'

const MATERIALIZATIONS: Record<Materialization, { file: keyof typeof PRIMER; label: string; sqlServer: string; explanation: string }> = {
  view: {
    file: 'materialized_view',
    label: 'View',
    sqlServer: '`CREATE VIEW`',
    explanation: 'The query is stored as a view and evaluated when it is read.',
  },
  table: {
    file: 'materialized_table',
    label: 'Table',
    sqlServer: '`SELECT … INTO` or `CREATE TABLE AS`',
    explanation: 'The query is materialized as a table on a full build.',
  },
  incremental: {
    file: 'materialized_incremental',
    label: 'Incremental',
    sqlServer: '`INSERT` or `MERGE`',
    explanation: 'The model selects new rows and the adapter applies its incremental strategy.',
  },
}

function Materializations() {
  const [selected, setSelected] = useState<Materialization>('view')
  const item = MATERIALIZATIONS[selected]
  const file = PRIMER[item.file]

  return (
    <div className="space-y-4">
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Choose a dbt materialization</legend>
        {(Object.keys(MATERIALIZATIONS) as Materialization[]).map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={selected === key}
            onClick={() => setSelected(key)}
            className={cn('rounded-lg border px-3 py-2 text-sm', selected === key ? 'border-sky-600 bg-sky-500/10' : 'bg-card/50 hover:bg-muted')}
          >
            {MATERIALIZATIONS[key].label}
          </button>
        ))}
      </fieldset>
      <CodeBlock title={file.path} code={file.code} lang={file.lang} />
      <p className="max-w-3xl text-sm leading-6">{item.explanation} A SQL Server analogue is {item.sqlServer}.</p>
      {selected === 'incremental' && (
        <Callout kind="info" title="Adapter-specific SQL">
          This shows the shape of an append run. The adapter may create temporary relations and use a configured `INSERT` or `MERGE` strategy.
        </Callout>
      )}
    </div>
  )
}

const BATCH_ONE = CUSTOMERS[0]
const BATCH_TWO = CUSTOMERS[1]
const BATCH_THREE = CUSTOMERS[2]
const BATCHES_ONE_AND_TWO = [...BATCH_ONE, ...BATCH_TWO]
const BATCHES_ONE_AND_TWO_AND_THREE = [...BATCHES_ONE_AND_TWO, ...BATCH_THREE]

const INCREMENTAL_STEPS = [
  {
    title: 'Batch 1 · first run',
    landing: BATCH_ONE,
    target: BATCH_ONE,
    explanation: 'The target does not exist, so is_incremental() is false and dbt reads the first delivery.',
    highlight: false,
  },
  {
    title: 'Batch 2 · incremental',
    landing: BATCHES_ONE_AND_TWO,
    target: BATCHES_ONE_AND_TWO,
    explanation: 'The existing target makes is_incremental() true; the high-water mark keeps the second delivery.',
    highlight: true,
  },
  {
    title: 'Landing truncated, batch 3 arrives',
    landing: BATCH_THREE,
    target: BATCHES_ONE_AND_TWO_AND_THREE,
    explanation: 'The earlier deliveries are gone from landing. The incremental target keeps its loaded rows and adds the new batch 3 rows.',
    highlight: false,
  },
  {
    title: 'Run --full-refresh',
    landing: BATCH_THREE,
    target: BATCH_THREE,
    explanation: 'A full refresh replaces the target from the rows still in landing. The earlier rows are gone, so only batch 3 remains.',
    highlight: false,
  },
]

function IncrementalPlayer() {
  const [step, setStep] = useState(0)
  const active = INCREMENTAL_STEPS[step]
  const rows: PrimerResultRow[] = [
    { relation: 'landing.customer', count: active.landing.length },
    { relation: 'stg_customer_incremental', count: active.target.length },
  ]
  const highlight = active.highlight ? [5, 6] : []

  return (
    <>
      <div className="space-y-4">
      <ol aria-label="Incremental build steps" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {INCREMENTAL_STEPS.map((item, index) => (
          <li key={item.title} aria-current={step === index ? 'step' : undefined} className={cn('rounded-lg border px-3 py-2 text-sm', step === index ? 'border-sky-600 bg-sky-500/10' : 'bg-card/50')}>
            <span className="font-mono text-xs text-foreground">{index + 1}.</span> {item.title}
          </li>
        ))}
      </ol>
      <p className="max-w-3xl text-sm leading-6">{active.explanation}</p>
      <CodeBlock title={PRIMER.customer_incremental.path} code={PRIMER.customer_incremental.code} lang={PRIMER.customer_incremental.lang} highlight={highlight} />
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
        <LivePrimerResult
          title={`count(*) · ${active.title}`}
          columns={[
            { key: 'relation', label: 'Relation' },
            { key: 'count', label: 'count(*)' },
          ]}
          rows={rows}
          summary={`Landing rows and target rows are counted from CUSTOMERS and BATCHES in dataset.ts.`}
          stepIds={['incremental-batch-1', 'incremental-batch-2', 'incremental-batch-3', 'incremental-full-refresh']}
          activeStepId={['incremental-batch-1', 'incremental-batch-2', 'incremental-batch-3', 'incremental-full-refresh'][step]}
        />
        <div className="flex gap-2">
          <button type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50">
            Previous
          </button>
          <button type="button" onClick={() => setStep((current) => Math.min(INCREMENTAL_STEPS.length - 1, current + 1))} disabled={step === INCREMENTAL_STEPS.length - 1} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50">
            Next
          </button>
          <button type="button" onClick={() => setStep(0)} className="rounded-lg border px-3 py-2 text-sm">
            Reset
          </button>
        </div>
      </div>
      </div>
      <P>
        Continue with <Link to="/replay" className="text-foreground underline underline-offset-2">Replay</Link> to compare a changed model against the history still available.
      </P>
    </>
  )
}

function TestsAndDocs() {
  const [duplicate, setDuplicate] = useState(false)
  const firstBatch = CUSTOMERS[0]
  const inputRows = duplicate ? [...firstBatch, { ...firstBatch[0] }] : firstBatch
  const counts = new Map<number, number>()
  for (const row of inputRows) counts.set(row.c_custkey, (counts.get(row.c_custkey) ?? 0) + 1)
  const failingRows = inputRows.filter((row) => (counts.get(row.c_custkey) ?? 0) > 1)
  const passes = failingRows.length === 0

  return (
    <>
      <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          aria-pressed={duplicate}
          onClick={() => setDuplicate((current) => !current)}
          className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          {duplicate ? 'Remove duplicate customer' : 'Add duplicate customer'}
        </button>
        <output aria-live="polite" className={cn('text-sm font-medium', passes ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-800 dark:text-red-300')}>
          unique(c_custkey): {passes ? 'PASS' : 'FAIL'}
        </output>
      </div>
      <CodeBlock title={PRIMER.schema_tests.path} code={PRIMER.schema_tests.code} lang={PRIMER.schema_tests.lang} />
      <CodeBlock
        title="Failing rows · generic unique-test query"
        code={`select c_custkey, count(*) as row_count
from {{ ref('stg_customer') }}
group by c_custkey
having count(*) > 1`}
        lang="sql"
      />
      <LivePrimerResult
        title={passes ? 'Failing rows · none' : 'Failing rows · duplicate business key'}
        columns={[
          { key: 'c_custkey', label: 'c_custkey' },
          { key: 'c_name', label: 'c_name' },
          { key: 'row_count', label: 'row_count' },
        ]}
        rows={failingRows.map((row) => ({
          c_custkey: row.c_custkey,
          c_name: row.c_name,
          row_count: counts.get(row.c_custkey) ?? 0,
        }))}
        summary="The duplicate input row is added to a copy of the first customer delivery; the result is computed in TypeScript."
        stepIds={['unique-fails', 'unique-passes']}
        activeStepId={duplicate ? 'unique-fails' : 'unique-passes'}
      />
      </div>
      <P>
        <Code>dbt docs generate</Code> builds project documentation and lineage. Explore the guide’s{' '}
        <Link to="/dbt-project" className="text-foreground underline underline-offset-2">Lineage chapter</Link>.
      </P>
    </>
  )
}

export default function DbtPrimer() {
  return (
    <Chapter>
      <ChapterHeader
        title="dbt primer"
        lead={<>See how a version-controlled dbt project replaces scattered procedure files. A <Term id="model">model</Term> is a SQL query; <Term id="ref-function">ref()</Term> links models, and <Term id="source-function">source()</Term> declares an input.</>}
      />

      <Section
        title="Why dbt"
        lead="Compare a scheduled folder of procedures with a project tree that puts SQL, dependencies and tests together."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border bg-card/50 p-4">
            <h3 className="mb-3 font-semibold">Procedures and a job schedule</h3>
            <ul className="space-y-2 font-mono text-sm leading-5">
              <li>procedures/</li>
              <li className="pl-4">load_customer.sql</li>
              <li className="pl-4">load_nation.sql</li>
              <li>jobs/</li>
              <li className="pl-4">nightly_load</li>
              <li>run order lives in the job definition</li>
            </ul>
          </div>
          <div className="rounded-xl border bg-card/50 p-4">
            <h3 className="mb-3 font-semibold">A dbt project</h3>
            <ul className="space-y-2 font-mono text-sm leading-5">
              <li>models/</li>
              <li className="pl-4">staging/stg_customer.sql</li>
              <li className="pl-4">marts/customer_by_segment.sql</li>
              <li className="pl-4">staging/schema.yml</li>
              <li>macros/round_amount.sql</li>
              <li>sources.yml · dbt_project.yml</li>
            </ul>
          </div>
        </div>
        <P>
          Each model is a SQL <Code>SELECT</Code>. Git records changes, <Code>ref()</Code> records dependencies, and YAML can attach <Term id="test">tests</Term> and documentation to the models.
        </P>
        <PrimerFooter
          keyPoint="dbt keeps SQL, dependency order and checks in one version-controlled project."
          note="You might keep procedures in source control too; dbt makes model dependencies explicit with ref() and adds a standard build and test workflow."
        />
      </Section>

      <Section
        title="From SSIS and stored procedures"
        lead="Switch between three ways to load the same stg_customer → customer_h step, then select a part to see its counterparts."
      >
        <WorkflowComparison />
        <PrimerFooter
          keyPoint="The implementation changes, but the source-to-hub step and its Data Vault rules remain the same."
          note="SSIS precedence constraints, procedure call order and dbt model dependencies all express when one step can run after another."
        />
      </Section>

      <Section
        title="Models and ref()"
        lead="Select a node in the source → stage → mart graph to inspect its SQL and a result computed from the first delivery."
      >
        <ModelsAndRef />
        <PrimerFooter
          keyPoint={<><Code>source()</Code> names an input table, while <Code>ref()</Code> names another model and creates a dependency.</>}
          note="A staging view or procedure can read the landing table; a later procedure call or job step supplies the order that ref() records in the graph."
        />
      </Section>

      <Section
        title="Jinja and compile"
        lead="Switch between a reusable Jinja macro and the SQL expression left after dbt compiles it."
      >
        <JinjaCompile />
        <PrimerFooter
          keyPoint="Jinja builds SQL before execution; dbt compile lets you inspect the resulting SQL."
          note="A SQL Server scalar function can reuse an expression at query time; a dbt macro writes reusable SQL into the model before it runs."
        />
      </Section>

      <Section
        title="Materializations"
        lead={<>Switch one model between view, table and <Term id="incremental">incremental</Term> output to see the SQL shape and its closest SQL Server analogue.</>}
      >
        <Materializations />
        <PrimerFooter
          keyPoint="A materialization controls how dbt stores or updates the result; adapter-generated SQL can vary."
          note="The nearest patterns are CREATE VIEW, SELECT INTO or CREATE TABLE AS, and INSERT or MERGE."
        />
      </Section>

      <Section
        title="Incremental and --full-refresh"
        lead={<>Step through two deliveries, a landing truncate and a <Term id="full-refresh">full refresh</Term>; each count is derived from dataset.ts. The <Term id="high-water-mark">high-water mark</Term> skips already-seen rows.</>}
      >
        <IncrementalPlayer />
        <PrimerFooter
          keyPoint="An incremental target can retain rows after landing is truncated, but a full refresh can rebuild only from source rows that remain."
          note="A procedure can preserve a target across loads, but truncating its only landing history leaves a rebuild with no earlier input."
        />
      </Section>

      <Section
        title="Tests and docs"
        lead={<>Add a duplicate customer to make the unique test fail, remove it to pass, then open the lineage chapter. A <Term id="unit-test">unit test</Term> checks a model against fixed inputs and expected rows.</>}
      >
        <TestsAndDocs />
        <PrimerFooter
          keyPoint="Tests turn assumptions about keys into repeatable checks, and generated docs expose model lineage."
          note="You can write duplicate-key queries and hand-maintained diagrams in SQL Server; dbt tests and docs keep these checks and dependencies alongside the models."
        />
      </Section>
      <Section
        title="Running dbt from the command line"
        lead="dbt is a command-line tool: one command, a selection and a target decide what runs and where."
        keyPoint="The same command runs on a laptop, CI and a scheduler; only the target changes."
      >
        <CommandBuilder />
        <P className="mx-auto mt-6">
          <Code>build</Code> runs models and tests in graph order; a failing test skips downstream work. <Code>compile</Code> writes SQL without running it. Every run writes <Code>target/</Code> artifacts: compiled SQL, <Term id="manifest">manifest.json</Term> (the project graph) and <Code>run_results.json</Code> (what ran and its result), which CI and orchestrators read.
        </P>
      </Section>
      <Section
        title="profiles.yml: how dbt connects"
        lead="A profile names the connection settings and outputs dbt can use for a run."
      >
        <P className="mx-auto">
          dbt defaults to <Code>~/.dbt/profiles.yml</Code>, or uses <Code>DBT_PROFILES_DIR</Code>. The <Code>profile:</Code> field in <Code>dbt_project.yml</Code> selects a <Term id="profile">profile</Term>; targets are outputs inside it, and <Code>--target</Code> chooses one.
        </P>
        <figure className="mx-auto grid max-w-[48rem] gap-4 lg:grid-cols-2">
          <CodeBlock title={PRIMER.profiles.path} code={PRIMER.profiles.code} lang="yaml" />
          <CodeBlock title="Fabric Lakehouse · illustrative; check the adapter README for the fields your version needs" code={FABRIC_PROFILE} lang="yaml" />
        </figure>
        <P className="mx-auto mt-6">
          Secrets come from <Code>env_var()</Code> and never belong in Git; <Code>.env</Code> stays in <Code>.gitignore</Code>.
        </P>
        <section className="mx-auto max-w-[40rem]">
          <h3 className="mb-2 font-serif text-xl font-semibold">Your own sandbox</h3>
          <ul className="list-disc space-y-2 pl-6 font-serif text-lg leading-7 text-foreground/90">
            <li>The dev target writes only to your own schema; sources still read shared retained data through <Code>source()</Code>.</li>
            <li>Profile settings do not grant permissions; the identity behind them decides read and write access.</li>
            <li>Live source data changes, so record the batch (max <Code>ldts</Code>) used for comparisons.</li>
          </ul>
        </section>
      </Section>
    </Chapter>
  )
}
