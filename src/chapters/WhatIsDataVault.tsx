import { Chapter } from '@/components/Chapter'
import { useState } from 'react'
import { motion } from 'motion/react'
import { Boxes, GitBranch, Layers, Scale, Workflow } from 'lucide-react'
import { ChapterHeader, Section, P, Callout, Code, RecapExtras } from '@/components/Prose'
import { Decomposition } from '@/components/Decomposition'
import { cn } from '@/lib/utils'

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
    id: 'src',
    name: 'Sources',
    medal: '',
    color: 'bg-zinc-500',
    text: 'CRM, ERP, web shop, partner files. Each one has its own keys, grain and quirks.',
    guide: 'raw_customer, raw_nation, raw_orders',
  },
  {
    id: 'stage',
    name: 'Staging',
    medal: 'Bronze',
    color: 'bg-slate-500',
    text: 'Data lands as close to the source as possible. dbt stage views add hashkeys, hashdiffs, ldts and rsrc. No business rules yet.',
    guide: 'stg_customer, stg_nation, stg_orders',
  },
  {
    id: 'raw',
    name: 'Raw vault',
    medal: 'Silver',
    color: 'bg-sky-500',
    text: 'Hubs, links and satellites loaded insert-only. This layer is auditable: every row traces back to a source and a load.',
    guide: 'customer_h, customer_nation_l, customer_n_s, …',
  },
  {
    id: 'bv',
    name: 'Business vault',
    medal: 'Silver',
    color: 'bg-violet-500',
    text: 'Business rules, key alignment and query helpers such as PIT and bridge tables. Rows are marked as system-generated.',
    guide: 'control_snap_v1, customer_pit',
  },
  {
    id: 'mart',
    name: 'Information marts',
    medal: 'Gold',
    color: 'bg-rose-500',
    text: 'Star schemas, wide tables and views shaped for the people asking questions. Rebuilt from the vault at any time.',
    guide: 'dim_customer',
  },
]

function Architecture() {
  const [active, setActive] = useState('raw')
  const layer = LAYERS.find((l) => l.id === active)!
  return (
    <div className="rounded-2xl border bg-card/30 p-5">
      <div className="relative grid grid-cols-5 gap-2">
        <div className="absolute inset-x-[10%] top-1/2 h-px bg-border" />
        {[0, 1, 2].map((i) => (
          <motion.span
            key={`${active}-${i}`}
            className="absolute top-1/2 size-2 -translate-y-1/2 rounded-full bg-sky-400 shadow-[0_0_12px_2px] shadow-sky-400/60"
            initial={{ left: '8%', opacity: 0 }}
            animate={{ left: ['8%', '92%'], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2.4, delay: i * 0.5, ease: 'linear' }}
          />
        ))}
        {LAYERS.map((l) => (
          <button
            key={l.id}
            onClick={() => setActive(l.id)}
            className={cn(
              'relative z-10 flex flex-col items-center gap-2 rounded-xl border bg-card px-2 py-4 text-center transition-all',
              active === l.id ? 'scale-105 border-foreground/40 shadow-lg' : 'hover:border-foreground/30',
            )}
          >
            <span className={cn('size-3 rounded-full', l.color)} />
            <span className="text-xs font-semibold sm:text-sm">{l.name}</span>
            {l.medal && <span className="font-mono text-[10px] text-muted-foreground">{l.medal}</span>}
          </button>
        ))}
      </div>
      <motion.div key={active} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto]">
        <p className="text-sm leading-6">{layer.text}</p>
        <div className="font-mono text-xs text-muted-foreground sm:text-right">
          in this guide
          <br />
          <span className="text-foreground">{layer.guide}</span>
        </div>
      </motion.div>
    </div>
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

export default function WhatIsDataVault() {
  return (
    <Chapter>
      <ChapterHeader
        title="What is Data Vault"
        lead="A modelling pattern for enterprise warehouses that splits every concept into its keys (hubs), its relationships (links) and its context and history (satellites), so the warehouse can keep absorbing change."
      />

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
        <div className="grid gap-4 md:grid-cols-3">
          {BLOCKS.map((b) => (
            <motion.div key={b.name} whileHover={{ y: -4 }} className={cn('rounded-2xl border bg-gradient-to-b to-transparent p-5', b.tone)}>
              <div className={cn('text-xl font-semibold', b.text)}>{b.name}</div>
              <p className="mt-2 text-sm">{b.what}</p>
              <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                {b.rules.map((r) => (
                  <li key={r} className="flex gap-2">
                    <span className={b.text}>›</span> {r}
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
        lead="The layer diagram places the Data Vault between landed data and reporting models."
        keyPoint="The raw vault integrates source history; the business vault adds rules and query helpers."
      >
        <P>
          Data Vault is the integration layer between landing and reporting. In a lakehouse medallion architecture it is the <strong>Silver</strong> layer. Click a layer:
        </P>
        <Architecture />
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
