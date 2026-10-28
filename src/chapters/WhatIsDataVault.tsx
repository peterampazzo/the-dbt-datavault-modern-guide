import { Chapter } from '@/components/Chapter'
import { useState } from 'react'
import { motion } from 'motion/react'
import { Boxes, GitBranch, Layers, Scale, Workflow } from 'lucide-react'
import { ChapterHeader, Section, P, Callout, Code, RecapExtras } from '@/components/Prose'
import { Term } from '@/components/Term'
import { Decomposition } from '@/components/Decomposition'
import { HubLinkSatDrawing } from '@/components/drawing/HubLinkSatDrawing'
import { cn } from '@/lib/utils'
import { Link } from 'react-router'
import { BATCHES } from '@/lib/dv/dataset'
import { CodeBlock } from '@/components/CodeBlock'
import { SNIPPETS } from '@/lib/dv/models'
import { simulate } from '@/lib/dv/engine'

const CHANGES = [
  { icon: Boxes, title: 'New sources', text: 'New internal systems, external feeds, acquisitions and mergers.' },
  { icon: GitBranch, title: 'Changing sources', text: 'New tables, new attributes, new domain values, new formats.' },
  { icon: Scale, title: 'New business rules', text: 'Changes to grain, cardinality and how concepts relate.' },
  { icon: Workflow, title: 'New deliveries', text: 'New subject areas, regulatory reports, lower latency.' },
]

const BLOCKS = [
  {
    name: 'Hub',
    tone: 'border-sky-500/50 from-sky-500/10',
    text: 'text-sky-700 dark:text-sky-400',
    what: 'The list of unique business keys for one core business concept: customer, product, order.',
    rules: ['Business key + hashkey + ldts + rsrc', 'No descriptive attributes', 'No foreign keys', 'Inserted once, the first time a key is seen'],
  },
  {
    name: 'Link',
    tone: 'border-emerald-500/50 from-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-400',
    what: 'A unique relationship between two or more hubs, such as customer–nation or order–customer.',
    rules: ['Hashkeys of the hubs it connects', 'No descriptive attributes', 'Many-to-many by design', 'Inserted once per new combination'],
  },
  {
    name: 'Satellite',
    tone: 'border-amber-500/50 from-amber-500/10',
    text: 'text-amber-700 dark:text-amber-400',
    what: 'All the context and history of exactly one hub or link: names, addresses, statuses.',
    rules: ['Keyed by parent hashkey + ldts', 'New row only when the hashdiff changes', 'Split by source, rate of change or sensitivity', 'Never attached to another satellite'],
  },
]

const LAYERS = [
  {
    id: 'sources',
    name: 'Sources',
    medal: 'Source systems',
    contents: 'Customer, nation and orders data from their source systems.',
    writer: 'The CRM, reference system and web shop.',
    changes: 'Each source changes on its own schedule.',
    rebuild: 'The source systems, when they can replay their history.',
  },
  {
    id: 'landing',
    name: 'Landing + persistent staging',
    medal: 'Bronze',
    contents: 'Source rows as received, with each delivery and its load time.',
    writer: 'An ingestion job or connector.',
    changes: 'Append-only; retain every delivery.',
    rebuild: 'Retained source deliveries, or the source systems when replay is available.',
  },
  {
    id: 'stage',
    name: 'Stage · dv_stage',
    medal: 'Silver',
    contents: 'Views with hashkeys, hashdiffs, ldts and rsrc; no business rules.',
    writer: 'dbt stage models using datavault4dbt.',
    changes: 'Views; rebuilt from landed rows when the model changes.',
    rebuild: 'Landing and persistent staging.',
  },
  {
    id: 'raw',
    name: 'Raw vault',
    medal: 'Silver',
    contents: 'Hubs, links and satellites integrated by business key.',
    writer: 'dbt models using datavault4dbt.',
    changes: 'Insert-only in normal loads; rebuilt by a full refresh.',
    rebuild: 'Persistent staging and the model code.',
  },
  {
    id: 'business',
    name: 'Business vault',
    medal: 'Silver',
    contents: 'Business rules, PITs, bridges and other derived helpers.',
    writer: 'dbt models.',
    changes: 'Derived views or tables; rebuilt when rules change.',
    rebuild: 'The raw vault and business-vault model code.',
  },
  {
    id: 'marts',
    name: 'Marts',
    medal: 'Gold',
    contents: 'Dimensions, facts and reporting views.',
    writer: 'dbt models.',
    changes: 'Views or rebuilt tables shaped for reporting.',
    rebuild: 'Vault history and the mart model code.',
  },
]

function Architecture() {
  const [active, setActive] = useState('landing')
  const layer = LAYERS.find((l) => l.id === active)!
  return (
    <div className="space-y-4">
      <ol aria-label="Warehouse layers" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {LAYERS.map((l, index) => (
          <li key={l.id}>
            <button
              type="button"
              aria-pressed={active === l.id}
              onClick={() => setActive(l.id)}
              className={cn(
                'flex h-full w-full flex-col items-start gap-1 rounded-xl border bg-card px-3 py-3 text-left',
                active === l.id ? 'border-foreground/50 ring-2 ring-foreground/15' : 'hover:border-foreground/30',
              )}
            >
              <span className="text-xs text-muted-foreground">Layer {index + 1} · {l.medal}</span>
              <span className="font-semibold">{l.name}</span>
            </button>
          </li>
        ))}
      </ol>
      <section aria-live="polite" aria-label={`${layer.name} layer details`} className="rounded-xl border bg-card/60 p-4">
        <h3 className="mb-3 font-semibold">{layer.name}</h3>
        <dl className="grid gap-x-5 gap-y-3 text-sm sm:grid-cols-2">
          {[
            ['What’s in it', layer.contents],
            ['Who writes it', layer.writer],
            ['How it changes', layer.changes],
            ['What it can be rebuilt from', layer.rebuild],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="font-medium">{label}</dt>
              <dd className="mt-0.5 leading-5 text-muted-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}

const SOURCE_STOPS = [
  { title: 'Source systems' },
  { title: 'Getting the data out' },
  { title: 'Landing and persistent staging' },
  { title: 'Data Vault' },
  { title: 'Marts and reports' },
]

function SourceToReports() {
  const [selected, setSelected] = useState(0)
  const stop = SOURCE_STOPS[selected]
  return (
    <>
      <div className="space-y-4">
      <ol aria-label="From source systems to reports" className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {SOURCE_STOPS.map(({ title }, index) => (
          <li key={title}>
            <button
              type="button"
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
              className={cn(
                'flex h-full w-full flex-col items-start gap-1 rounded-xl border px-3 py-3 text-left',
                selected === index ? 'border-foreground/50 bg-muted ring-2 ring-foreground/15' : 'bg-card hover:border-foreground/30',
              )}
            >
              <span className="text-xs text-foreground">Stop {index + 1}</span>
              <span className="font-semibold leading-5">{title}</span>
            </button>
          </li>
        ))}
      </ol>
      <section aria-live="polite" aria-label={stop.title} className="min-h-28 rounded-xl border bg-card/60 p-4">
        <h3 className="mb-2 font-semibold">{stop.title}</h3>
        {selected === 0 && (
          <p className="text-sm leading-6">
            A CRM sends <Code>customer</Code>, a reference system sends <Code>nation</Code>, and a web shop sends <Code>orders</Code>. Each has its own IDs. The same
            customer can appear in more than one: <Code>o_custkey</Code> in orders refers to <Code>c_custkey</Code>.
          </p>
        )}
        {selected === 1 && (
          <>
            <p className="text-sm leading-6">
              A full extract reads everything; a delta reads new or changed rows; CDC captures changes as they happen. Data can arrive through database copies, files or
              APIs on a schedule. Each run is a delivery with a load time.
            </p>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {BATCHES.map((date, index) => <li key={date}>Delivery {index + 1}: {date}</li>)}
            </ul>
          </>
        )}
        {selected === 2 && (
          <p className="text-sm leading-6">
            Land rows as received and keep every delivery in append-only persistent staging. <Link to="/replay" className="font-medium text-sky-700 underline underline-offset-4 dark:text-sky-400">See why replayable history matters in the Replay lab.</Link>
          </p>
        )}
        {selected === 3 && (
          <p className="text-sm leading-6">
            Integrate sources on shared <Term id="business-key">business keys</Term>. The <Term id="raw-vault">raw vault</Term> records <Term id="rsrc"><Code>rsrc</Code></Term> (where a row came from) and <Term id="ldts"><Code>ldts</Code></Term> (when it arrived); the <Term id="business-vault">business vault</Term>
            adds derived rules and query helpers.
          </p>
        )}
        {selected === 4 && (
          <p className="text-sm leading-6">
            Shape vault history into <Term id="mart">marts</Term> for reporting: dimensions, facts and views that answer business questions.
          </p>
        )}
      </section>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setSelected((index) => Math.max(0, index - 1))}
          disabled={selected === 0}
          className="rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          Back
        </button>
        <span aria-live="polite" className="text-xs text-muted-foreground">Stop {selected + 1} of {SOURCE_STOPS.length}</span>
        <button
          type="button"
          onClick={() => setSelected((index) => Math.min(SOURCE_STOPS.length - 1, index + 1))}
          disabled={selected === SOURCE_STOPS.length - 1}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <div className="rounded-xl border bg-muted/30 p-4">
        <h3 className="font-semibold">Three questions a warehouse has to answer</h3>
        <ul className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
          <li>How do we represent one customer appearing in several systems?</li>
          <li>What changes when sources send updates on different days?</li>
          <li>What did we know on date X?</li>
        </ul>
      </div>
      </div>
      <P>Data Vault is the design for the integration step.</P>
    </>
  )
}

function FabricArchitecture() {
  const [view, setView] = useState<'generic' | 'fabric'>('generic')
  return (
    <>
      <div className="space-y-4">
      <fieldset className="flex flex-wrap items-center gap-2 border-0 p-0">
        <legend className="sr-only">Choose architecture view</legend>
        <button type="button" aria-pressed={view === 'generic'} onClick={() => setView('generic')} className="rounded-md border px-3 py-2 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground">
          Generic
        </button>
        <button type="button" aria-pressed={view === 'fabric'} onClick={() => setView('fabric')} className="rounded-md border px-3 py-2 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground">
          Medallion on Fabric
        </button>
      </fieldset>
      {view === 'generic' ? (
        <div className="rounded-xl border bg-card/60 p-4">
          <p className="font-medium">Landing + persistent staging → dv_stage → raw_vault → business_vault → marts</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">The source copy is Bronze; stage and both vaults are Silver; reporting marts are Gold.</p>
        </div>
      ) : (
        <>
          <ol aria-label="Fabric medallion layers" className="grid gap-3 md:grid-cols-3">
            <li className="rounded-xl border bg-card/60 p-4">
              <span className="text-xs text-muted-foreground">Bronze · lakehouse</span>
              <h3 className="mt-1 font-semibold">Files + Delta tables</h3>
              <p className="mt-2 text-sm leading-5">Landing and persistent staging keep each source delivery.</p>
            </li>
            <li className="rounded-xl border bg-card/60 p-4">
              <span className="text-xs text-muted-foreground">Silver · lakehouse</span>
              <h3 className="mt-1 font-semibold">Three schemas</h3>
              <p className="mt-2 font-mono text-sm leading-6">dv_stage<br />raw_vault<br />business_vault</p>
            </li>
            <li className="rounded-xl border bg-card/60 p-4">
              <span className="text-xs text-muted-foreground">Gold</span>
              <h3 className="mt-1 font-semibold">marts</h3>
              <p className="mt-2 text-sm leading-5">Use a lakehouse or a warehouse for reporting models.</p>
            </li>
          </ol>
          <div className="grid gap-3 lg:grid-cols-2">
            <CodeBlock title="dbt_project.yml · model schemas" code={SNIPPETS.dbt_project_layer_schemas.code} lang="yaml" />
            <CodeBlock title="macros/generate_schema_name.sql" code={SNIPPETS.generate_schema_name.code} lang="sql" />
          </div>
        </>
      )}
      </div>
      {view === 'fabric' && (
        <P>
          Use one lakehouse with several schemas where lakehouse schemas are enabled in your workspace, or one lakehouse per layer when you want separate permissions.
          Either way, dbt writes each model layer to its own schema with <Code>+schema</Code>. A custom <Code>generate_schema_name</Code> macro avoids prefixing those
          names with the target schema.
        </P>
      )}
    </>
  )
}

const COMPARE = [
  ['Design approach', 'Hub, link and satellite modules', 'Star/snowflake or 3NF'],
  ['Upfront requirements', 'Low; future rules can come later', 'High; rules defined early'],
  ['Handling change', 'Additive: new tables, not rework', 'Often a redesign'],
  ['History', 'Always kept, never overwritten', 'Depends on the design'],
  ['Transformation', 'Late, in business vault or marts', 'Early, inside the ETL'],
  ['Auditability', 'Built in (ldts, rsrc on every row)', 'Custom engineering'],
  ['Reporting', 'Needs marts on top', 'Directly from the warehouse'],
]

function CustomerHistory() {
  const runs = simulate()
  const [view, setView] = useState<'report' | 'source' | 'vault'>('report')
  const alice = runs[0].source.customer.find((row) => String(row.c_name).startsWith('Alice'))
  const aliceName = String(alice?.c_name)
  const reportRow = runs[1].source.customer.find((row) => row.c_name === alice?.c_name)
  const currentRow = runs.at(-1)!.source.customer.find((row) => row.c_name === alice?.c_name)
  const versions = runs.at(-1)!.tables.customer_n_s
    .filter((row) => row.c_name === alice?.c_name)
    .sort((a, b) => String(a.ldts).localeCompare(String(b.ldts)))
  const options = [
    { id: 'report', label: 'Report on 2 Jan' },
    { id: 'source', label: 'Source today' },
    { id: 'vault', label: 'With a vault' },
  ] as const

  return (
    <div className="mx-auto max-w-[48rem] border-t pt-6">
      <div role="group" aria-label="Choose which customer history to see" className="mb-4 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={view === option.id}
            onClick={() => setView(option.id)}
            className="rounded-md border px-3 py-2 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground"
          >
            {option.label}
          </button>
        ))}
      </div>
      {view === 'report' && reportRow && (
        <p className="text-sm leading-6">
          {aliceName}’s segment on {runs[1].ldts}: <strong>{String(reportRow.c_mktsegment)}</strong>.
        </p>
      )}
      {view === 'source' && currentRow && (
        <p className="text-sm leading-6">
          The current source row for {aliceName} says <strong>{String(currentRow.c_mktsegment)}</strong> at {runs.at(-1)!.ldts}; it has no previous segment value.
        </p>
      )}
      {view === 'vault' && (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{aliceName}’s customer_n_s versions</caption>
            <thead className="bg-muted/60">
              <tr><th scope="col" className="px-3 py-2">ldts</th><th scope="col" className="px-3 py-2">c_mktsegment</th></tr>
            </thead>
            <tbody>
              {versions.map((row) => (
                <tr key={String(row.ldts)} className="border-t">
                  <td className="break-all px-3 py-2 font-mono text-xs">{String(row.ldts)}</td>
                  <td className="px-3 py-2">{String(row.c_mktsegment)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function WhatIsDataVault() {
  return (
    <Chapter>
      <ChapterHeader
        title="What is Data Vault"
        lead={<>A modelling pattern for enterprise warehouses that splits every concept into its keys (<Term id="hub">hubs</Term>), its relationships (<Term id="link">links</Term>) and its context and history (<Term id="satellite">satellites</Term>), so the warehouse can keep absorbing change.</>}
      />

      <Section
        title="From source systems to reports"
        lead={<>Follow customer, nation and orders from external systems through <Term id="landing">landing</Term> and <Term id="persistent-staging">persistent staging</Term> to reporting.</>}
      >
        <SourceToReports />
      </Section>

      <Section
        title="Built for a warehouse that never stops changing"
        lead="See how new sources, attributes, rules and deliveries add to a vault without rewriting its existing rows."
        keyPoint="New sources, attributes, rules and deliveries should add to the vault without rewriting its existing rows."
      >
        <P>
          An enterprise warehouse is not a project with an end date. It is an ongoing programme that keeps absorbing four kinds of change. Data Vault was designed
          (by Dan Linstedt, and refined by the community since) so that each of these changes is <em>additive</em>: you add tables, you don't rework old ones.
        </P>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CHANGES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl border bg-card/50 p-4">
              <Icon className="mb-3 size-5 text-sky-700 dark:text-sky-400" />
              <div className="font-medium">{title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
        <P className="mt-6">The source shows the row it knows now; the vault keeps the versions it knew then.</P>
        <CustomerHistory />
      </Section>

      <Section
        title="Unified decomposition"
        lead="Watch one customer row separate into identity, relationship and changing context."
        keyPoint="Hubs, links and satellites keep separate grains, then come together around shared keys."
      >
        <div className="grid items-start gap-8 lg:grid-cols-2">
          <div>
            <P>
              In 3NF and in dimensional models, everything about a customer lives in one table: the key, the foreign key to its nation, and every attribute.
              Data Vault does the opposite. It separates <strong>the things that change</strong> from <strong>the things that don't</strong>:
            </P>
            <ul className="mb-4 max-w-xl space-y-2 text-sm">
              <li>
                <span className="font-mono text-sky-700 dark:text-sky-400">c_custkey</span>: the identity never changes, so it goes into a <strong>hub</strong>.
              </li>
              <li>
                <span className="font-mono text-emerald-700 dark:text-emerald-400">c_nationkey</span>: the relationship can change, so it goes into a <strong>link</strong>.
              </li>
              <li>
                <span className="font-mono text-amber-700 dark:text-amber-400">c_name, c_address, …</span>: the context changes all the time, so it goes into a <strong>satellite</strong> with full history.
              </li>
            </ul>
            <P>
              The parts are then unified again around the hub. Together they are called an <em>ensemble</em>: the same information as the original table, plus history and
              lineage. Press <Code>Decompose</Code> to see it.
            </P>
          </div>
          <Decomposition />
        </div>
        <Callout kind="tip" title="Thinking differently">
          Draw a circle around the 3NF customer table and another around the hub, link and satellite. Both circles hold the same key, the same attributes and the same
          relationship. The only change in grain is the load timestamp that keeps history. Putting a foreign key back into a hub, or one satellite under another, means you
          have stopped vaulting.
        </Callout>
      </Section>

      <Section
        title="The three building blocks"
        lead="Compare what hubs, links and satellites store and the rules each follows."
        keyPoint="A hub stores identity, a link stores a relationship, and a satellite stores descriptive history."
      >
        <HubLinkSatDrawing />
        <div className="grid gap-4 md:grid-cols-3">
          {BLOCKS.map((b) => (
            <motion.div key={b.name} whileHover={{ y: -4 }} className={cn('rounded-2xl border bg-gradient-to-b to-transparent p-5', b.tone)}>
              <div className={cn('text-xl font-semibold', b.text)}>{b.name}</div>
              <p className="mt-2 text-sm">{b.what}</p>
              <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                {b.rules.map((r) => (
                  <li key={r} className="flex gap-2">
                    <span className={b.text}>›</span>{' '}
                    {r === 'Business key + hashkey + ldts + rsrc'
                      ? <>Business key + <Term id="hashkey">hashkey</Term> + ldts + rsrc</>
                      : r === 'Keyed by parent hashkey + ldts'
                        ? r
                        : r === 'New row only when the hashdiff changes'
                          ? <>New row only when the <Term id="hashdiff">hashdiff</Term> changes</>
                          : r}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
        <P>
          <span className="mt-4 block">
            Every vault row also carries <Code>ldts</Code> (load timestamp: when the warehouse received it) and <Code>rsrc</Code> (record source: where it came from).
            That metadata makes the raw vault auditable.
          </span>
        </P>
      </Section>

      <Section
        title="Where it sits"
        lead="Select a layer to see what it holds, who writes it and how it can be rebuilt."
        keyPoint="Bronze keeps source deliveries; stage and vault models are Silver; reporting marts are Gold."
      >
        <P>
          Data Vault fits between retained source deliveries and reporting. The source copy belongs in Bronze; <Code>dv_stage</Code>, the raw vault and the business vault
          belong in Silver; marts belong in Gold.
        </P>
        <Architecture />
      </Section>

      <Section
        title="On Fabric"
        lead="Map the same layers onto Bronze, Silver and Gold storage, then route dbt models to their own schemas."
        keyPoint="Fabric changes where a model runs and where it writes; it does not change the vault layers."
      >
        <FabricArchitecture />
      </Section>

      <Section
        title="What each layer does"
        lead="Trace customer, nation and orders from staging through the raw vault to marts."
        keyPoint="Stage prepares source rows, the raw vault preserves them, and marts shape them for questions."
      >
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            ['Hubs', 'make key management easy', 'text-sky-700 dark:text-sky-400'],
            ['Satellites', 'make loading dimensions easy', 'text-amber-700 dark:text-amber-400'],
            ['Links', 'make loading facts easy', 'text-emerald-700 dark:text-emerald-400'],
          ].map(([a, b, c]) => (
            <div key={a} className="flex items-center gap-2 rounded-lg border bg-card/40 px-4 py-3 text-sm">
              <Layers className={cn('size-4', c)} />
              <span className={cn('font-semibold', c)}>{a}</span> {b}
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Data Vault vs a traditional warehouse"
        lead="Compare how Data Vault handles history, change and reporting with a more traditional warehouse design."
        keyPoint="Data Vault feeds reporting marts; its history is retained so those marts can be rebuilt as needs change."
      >
        <div tabIndex={0} className="overflow-x-auto rounded-xl border outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-2.5 font-medium">
                  <span className="sr-only">Aspect</span>
                </th>
                <th className="px-4 py-2.5 font-medium text-sky-700 dark:text-sky-400">Data Vault</th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground">Traditional warehouse</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map(([k, dv, dw]) => (
                <tr key={k} className="border-t">
                  <td className="px-4 py-2.5 font-medium">{k}</td>
                  <td className="px-4 py-2.5">{dv}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{dw}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Callout kind="info" title="Collect first, interpret later">
          Data Vault does not replace star schemas. It feeds them. The vault keeps everything, with history, and the marts on top can be rebuilt whenever reporting needs
          change. The trade-off is more tables and more joins, which is why the pattern relies on automation such as dbt and datavault4dbt.
        </Callout>
      </Section>

      <RecapExtras>
        <section aria-labelledby="further-reading-heading" className="max-w-3xl">
          <h2 id="further-reading-heading" className="mb-3 text-lg font-semibold">Further reading</h2>
          <ul className="space-y-1.5 text-sm">
          {[
            ['Hans Hultgren — Introductory Guide to Data Vault Modeling (Genesee Academy, 2019)', 'http://dvstandards.com/wp-content/uploads/2021/02/data_vault_modeling_guide_2019_v3.pdf'],
            ['Databricks — What is a Data Vault?', 'https://www.databricks.com/blog/what-is-data-vault'],
            ['OvalEdge — Data Vault architecture', 'https://www.ovaledge.com/blog/data-vault-architecture'],
            ['datavault4dbt wiki', 'https://github.com/ScalefreeCOM/datavault4dbt/wiki'],
          ].map(([t, u]) => (
            <li key={u}>
              <a href={u} target="_blank" rel="noreferrer" className="text-sky-700 dark:text-sky-400 underline underline-offset-4">
                {t}
              </a>
            </li>
          ))}
          </ul>
        </section>
      </RecapExtras>
    </Chapter>
  )
}
