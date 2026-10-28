import { useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router'
import { Chapter } from '@/components/Chapter'
import { ChapterHeader, Code, P, Section } from '@/components/Prose'
import { CodeBlock } from '@/components/CodeBlock'
import { Term } from '@/components/Term'
import { SchedulerDrawing } from '@/components/drawing/SchedulerDrawing'
import { BATCHES, CUSTOMERS } from '@/lib/dv/dataset'
import { isGhost, pit, simulate, SNAPSHOTS } from '@/lib/dv/engine'
import { cn } from '@/lib/utils'

const runs = simulate()
const latestTables = runs.at(-1)!.tables
const alice = CUSTOMERS.flat().find((customer) => customer.c_name.startsWith('Alice'))!
const aliceSnapshots = BATCHES.slice(1).map((batch) =>
  SNAPSHOTS.find((snapshot) => snapshot.startsWith(batch.slice(0, 10)))!,
)
const aliceDimension = aliceSnapshots.map((snapshot, index) => {
  const pointer = pit(latestTables, [snapshot]).find((row) => row.c_custkey === alice.c_custkey)!
  const satellite = latestTables.customer_n_s.find(
    (row) => !isGhost(row) && row.hk_customer_h === pointer.hk_customer_h && row.ldts === pointer.customer_n_s_ldts,
  )!
  const batch = BATCHES.slice(1)[index]
  return { batch: BATCHES.indexOf(batch) + 1, snapshot, segment: String(satellite.c_mktsegment) }
})
const publishedSegment = aliceDimension[0].segment
const nextSegment = aliceDimension[1].segment

function PlainCode({ title, code }: { title: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card/60 text-[13px] leading-5 shadow-sm">
      <div className="flex items-center gap-2 border-b px-4 py-2 font-mono text-xs text-muted-foreground">{title}</div>
      <pre tabIndex={0} className="overflow-x-auto py-3 font-mono outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
        <code className="whitespace-pre px-4">{code}</code>
      </pre>
    </div>
  )
}

function GreenIsNotPublished() {
  const [mode, setMode] = useState<'place' | 'gated'>('gated')
  const [step, setStep] = useState(1)
  const visibleSegment = mode === 'place' || step === 3 ? nextSegment : publishedSegment
  const status = mode === 'place' && step < 3 ? 'not yet checked' : step === 3 ? 'checks passed' : 'last published'

  return (
    <>
      <div className="mx-auto max-w-[48rem] space-y-4 rounded-xl border bg-card/50 p-4">
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Publish mode</legend>
          <div className="flex flex-wrap gap-2">
            <button type="button" aria-pressed={mode === 'place'} onClick={() => setMode('place')} className="rounded-md border px-3 py-2 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground">Build in place</button>
            <button type="button" aria-pressed={mode === 'gated'} onClick={() => setMode('gated')} className="rounded-md border px-3 py-2 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground">Write → audit → publish</button>
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Run steps</legend>
          <div className="flex flex-wrap gap-2">
            {(['1 Write', '2 Audit', '3 Publish'] as const).map((label, index) => (
              <button key={label} type="button" aria-pressed={step === index + 1} onClick={() => setStep(index + 1)} className="rounded-md border px-3 py-2 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground">{label}</button>
            ))}
          </div>
        </fieldset>
        <figure aria-label="Visible customer dimension value" className="rounded-lg border bg-background p-4">
          <div className="text-sm text-muted-foreground">Alice · dim_customer · snapshot {aliceDimension[0].snapshot.slice(0, 10)} → {aliceDimension[1].snapshot.slice(0, 10)}</div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="font-mono text-lg font-semibold">{visibleSegment}</span>
            <span className={cn('rounded-full border px-2.5 py-1 text-xs font-semibold', status === 'not yet checked' ? 'border-amber-500/50 text-amber-800 dark:text-amber-200' : 'border-emerald-500/50 text-emerald-800 dark:text-emerald-200')}>{status}</span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Published from batch {aliceDimension[0].batch}: {publishedSegment} · next from batch {aliceDimension[1].batch}: {nextSegment}
          </div>
        </figure>
      </div>
      <P className="mx-auto mt-6">
        <Term id="write-audit-publish">Write → audit → publish</Term> keeps the prior value visible until checks pass. In-place steps 1 and 2 expose the new value before it is checked.
      </P>
      <CodeBlock
        title="Illustrative publish gate"
        lang="bash"
        code={`dbt build --target audit        # build and test where readers can't see it
# only if the build passed:
dbt run-operation publish --args '{from_schema: audit}'   # e.g. repoint reader views`}
      />
      <P className="mx-auto mt-6">
        A zero exit code means selected models built and their tests passed; it does not prove business totals or hide new data from readers. Raw Vault remains insert-only; the gate controls what readers see.
      </P>
    </>
  )
}

function DeliveryOrder() {
  const [mode, setMode] = useState<'one' | 'overlap'>('one')
  const deliveries = BATCHES.map((ldts, index) => ({ batch: index + 1, ldts }))
  const finishOrder = mode === 'one' ? deliveries : [deliveries[0], deliveries.at(-1)!, deliveries[1]]

  return (
    <>
      <div className="mx-auto max-w-[48rem] rounded-xl border bg-card/50 p-4">
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Delivery runs</legend>
          <div className="flex flex-wrap gap-2">
            <button type="button" aria-pressed={mode === 'one'} onClick={() => setMode('one')} className="rounded-md border px-3 py-2 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground">One at a time</button>
            <button type="button" aria-pressed={mode === 'overlap'} onClick={() => setMode('overlap')} className="rounded-md border px-3 py-2 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground">Overlapping runs</button>
          </div>
        </fieldset>
        <ol aria-label={mode === 'one' ? 'Oldest-first run order' : 'Illustrative overlapping finish order'} className="mt-4 grid gap-2 sm:grid-cols-3">
          {finishOrder.map(({ batch, ldts }, index) => (
            <li key={ldts} className="rounded-lg border bg-background p-3">
              <div className="text-xs text-muted-foreground">{mode === 'one' ? `Run ${index + 1}` : `Finish ${index + 1}`}</div>
              <div className="mt-1 font-medium">Batch {batch}</div>
              <div className="mt-1 font-mono text-xs">{ldts}</div>
            </li>
          ))}
        </ol>
      </div>
      {mode === 'overlap' && <P className="mx-auto mt-6">load order and ldts order no longer match.</P>}
      <ul className="mx-auto mt-6 max-w-[40rem] list-disc space-y-2 pl-6 font-serif text-lg leading-7 text-foreground/90">
        <li>Run one delivery at a time, oldest first, and never overlap runs. Airflow uses <Code>max_active_runs=1</Code>; Databricks uses <Code>max_concurrent_runs: 1</Code>.</li>
        <li><Code>dbt retry</Code> resumes from the failure point. If nothing ran, rerun the job; this is safe because vault loads are insert-only.</li>
        <li><Code>dbt build</Code> tests each model before downstream models build, so marts do not refresh after a failed test.</li>
      </ul>
      <P className="mx-auto mt-6">For <Link className="text-sky-700 underline dark:text-sky-400" to="/replay/until-youre-replay-safe">ordered replay</Link>, reload retained deliveries in sequence before rebuilding the vault.</P>
    </>
  )
}

function WriterTable() {
  const [mode, setMode] = useState<'shared' | 'single'>('single')
  const rows = mode === 'shared'
    ? [{ table: 'customer_order_total_s', writer: 'dbt + calculation job', conflict: true }]
    : [
        { table: 'customer_order_total_s', writer: 'dbt', conflict: false },
        { table: 'calc_customer_score', writer: 'calculation job', conflict: false },
      ]

  return (
    <>
      <div className="mx-auto max-w-[48rem] rounded-xl border bg-card/50 p-4">
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Writer pattern</legend>
          <div className="flex flex-wrap gap-2">
            <button type="button" aria-pressed={mode === 'shared'} onClick={() => setMode('shared')} className="rounded-md border px-3 py-2 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground">Shared table</button>
            <button type="button" aria-pressed={mode === 'single'} onClick={() => setMode('single')} className="rounded-md border px-3 py-2 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground">One writer per table</button>
          </div>
        </fieldset>
        <div tabIndex={0} className="mt-4 overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
          <table className="w-full border-collapse text-left text-sm">
            <caption className="mb-2 text-left text-xs text-muted-foreground">Illustrative table names only · no data</caption>
            <thead><tr className="border-b"><th scope="col" className="px-3 py-2 font-semibold">Table</th><th scope="col" className="px-3 py-2 font-semibold">Writer</th><th scope="col" className="px-3 py-2 font-semibold">Status</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.table} className="border-b last:border-0">
                  <th scope="row" className="px-3 py-2 font-mono font-normal">{row.table}</th>
                  <td className="px-3 py-2">{row.writer}</td>
                  <td className="px-3 py-2">{row.conflict ? <span className="font-semibold text-rose-700 dark:text-rose-300">Conflict · two writers</span> : 'One writer'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {mode === 'single' && <p className="mt-3 text-sm text-muted-foreground">dbt reads <Code>calc_customer_score</Code> through <Code>source()</Code>.</p>}
      </div>
      <P className="mx-auto mt-6">The <Term id="orchestrator">orchestrator</Term> orders the two runs; each table has exactly one writer.</P>
    </>
  )
}

const SCHEDULER_SNIPPETS = [
  {
    id: 'airflow',
    label: 'Airflow + Cosmos',
    source: 'https://github.com/astronomer/astronomer-cosmos/blob/main/dev/dags/basic_cosmos_dag.py',
    code: `from datetime import datetime
from cosmos import DbtDag, ProfileConfig, ProjectConfig

guide_vault = DbtDag(
    dag_id="guide_vault",
    project_config=ProjectConfig("/usr/local/airflow/dags/dbt/guide"),
    profile_config=ProfileConfig(
        profile_name="guide",
        target_name="prod",
        profiles_yml_filepath="/usr/local/airflow/dags/dbt/guide/profiles.yml",
    ),
    schedule=None,        # triggered when a delivery lands
    start_date=datetime(2024, 1, 1),
    catchup=False,
    max_active_runs=1,    # one delivery at a time
)`,
  },
  {
    id: 'dagster',
    label: 'Dagster',
    source: 'https://docs.dagster.io/api/libraries/dagster-dbt',
    code: `from pathlib import Path
from dagster import AssetExecutionContext
from dagster_dbt import DbtCliResource, dbt_assets

@dbt_assets(manifest=Path("dbt/guide/target/manifest.json"))
def guide_vault(context: AssetExecutionContext, dbt: DbtCliResource):
    yield from dbt.cli(["build"], context=context).stream()`,
  },
  {
    id: 'fabric',
    label: 'Fabric',
    source: 'https://learn.microsoft.com/en-us/fabric/data-factory/dbt-job-overview',
    code: `Fabric pipeline
  1. Land the delivery in persistent staging
  2. dbt job (preview) · adapter dbt-fabricspark · command: dbt build
  3. On failure: notify; readers keep the last published version`,
  },
  {
    id: 'databricks',
    label: 'Databricks',
    source: 'https://docs.databricks.com/aws/en/jobs/dbt',
    code: `resources:
  jobs:
    guide_vault:
      max_concurrent_runs: 1
      tasks:
        - task_key: dbt_build
          dbt_task:
            project_directory: dbt/guide
            commands:
              - dbt deps
              - dbt build`,
  },
  {
    id: 'dbt-platform',
    label: 'dbt platform',
    source: 'https://docs.getdbt.com/docs/deploy/deploy-jobs',
    code: `Deploy job · environment: prod
  Commands: dbt build
  Trigger:  API call from the ingestion step, or a schedule`,
  },
] as const

function SchedulerTabs() {
  const [selected, setSelected] = useState<(typeof SCHEDULER_SNIPPETS)[number]['id']>('airflow')
  const activeIndex = SCHEDULER_SNIPPETS.findIndex((item) => item.id === selected)
  const active = SCHEDULER_SNIPPETS[activeIndex]
  const moveTab = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const nextIndex = (index + (event.key === 'ArrowRight' ? 1 : -1) + SCHEDULER_SNIPPETS.length) % SCHEDULER_SNIPPETS.length
    const next = SCHEDULER_SNIPPETS[nextIndex]
    setSelected(next.id)
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex]?.focus()
  }

  return (
    <div className="mx-auto max-w-[48rem]">
      <div role="tablist" aria-label="Choose an orchestrator" className="flex flex-wrap gap-1">
        {SCHEDULER_SNIPPETS.map((item, index) => (
          <button key={item.id} id={`scheduler-${item.id}-tab`} type="button" role="tab" aria-selected={selected === item.id} aria-controls={`scheduler-${item.id}-panel`} tabIndex={selected === item.id ? 0 : -1} onClick={() => setSelected(item.id)} onKeyDown={(event) => moveTab(event, index)} className="rounded-md border px-3 py-2 text-sm aria-selected:bg-primary aria-selected:text-primary-foreground">
            {item.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`scheduler-${active.id}-panel`} aria-labelledby={`scheduler-${active.id}-tab`} tabIndex={0} className="mt-4 space-y-3">
        <PlainCode title={active.label} code={active.code} />
        <a className="inline-flex min-h-11 items-center text-sm text-sky-700 underline dark:text-sky-400" href={active.source} target="_blank" rel="noreferrer">Read the {active.label} source</a>
      </div>
    </div>
  )
}

const REPO_TREE = `repo/
  dags/            # orchestration
    guide_vault.py
    dbt/guide/     # the dbt project
      dbt_project.yml
      models/`

export default function Scheduling() {
  return (
    <Chapter>
      <ChapterHeader
        title="Running dbt on a schedule"
        lead={<>an <Term id="orchestrator">orchestrator</Term> starts dbt when a delivery lands; dbt still owns the models, the order and the tests.</>}
      />
      <Section
        title="The run"
        lead="Follow a delivery from persistent staging through dbt and the publish steps."
        keyPoint="Deliveries trigger runs; dbt preserves dependency order inside a run."
      >
        <SchedulerDrawing />
        <P className="mx-auto mt-6">
          The <Term id="orchestrator">orchestrator</Term> decides when and in what order jobs start; it does not perform calculations (dbt or the calculation job does), and it is not the security boundary. Access is granted on data, not by the scheduler.
        </P>
      </Section>
      <Section
        title="Green is not published"
        lead="A successful build is not the same as a checked result being visible to readers."
        keyPoint="Build privately, audit the result, and publish only after checks pass."
      >
        <GreenIsNotPublished />
      </Section>
      <Section
        title="Vault rules when you schedule"
        lead="The load sequence matters when effectivity and insert-only history depend on delivery order."
        keyPoint="Keep deliveries oldest first and do not let two runs load the vault at once."
      >
        <DeliveryOrder />
      </Section>
      <Section
        title="Who writes what"
        lead="Keep dbt and a calculation job from competing for the same output table."
        keyPoint="Each table has one writer; the orchestrator coordinates the jobs."
      >
        <WriterTable />
      </Section>
      <Section
        title="Same job, different schedulers"
        lead="Each orchestrator starts the same dbt build while the dbt project keeps its model graph."
        keyPoint="Keep the scheduler definition and dbt project together so one reviewed change deploys both."
      >
        <SchedulerTabs />
        <P className="mx-auto mt-6">
          Keep DAGs and the dbt project in one repo so one reviewed change deploys both. Installing and running orchestrators is out of scope; see each tool’s documentation above.
        </P>
        <div className="mx-auto mt-6 max-w-[48rem]"><CodeBlock title="One repository" lang="bash" code={REPO_TREE} /></div>
      </Section>
    </Chapter>
  )
}
