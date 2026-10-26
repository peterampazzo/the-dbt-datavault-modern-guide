import { Chapter } from '@/components/Chapter'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { Link } from 'react-router'
import { ChapterHeader, Section, P, Callout, Code } from '@/components/Prose'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { CUSTOMERS, NATIONS, ORDERS } from '@/lib/dv/dataset'
import { cn } from '@/lib/utils'
import { usePersistentState } from '@/lib/progress'

type Kind = 'bk' | 'fk' | 'attr'
type Source = 'customer' | 'nation' | 'orders'
interface SrcCol {
  name: string
  kind: Kind
  targets: (split: boolean) => string[]
}

const SOURCES: { id: Source; concept: string; rows: Record<string, unknown>[]; cols: SrcCol[] }[] = [
  {
    id: 'customer',
    concept: 'Customer',
    rows: CUSTOMERS[0].slice(0, 3) as never,
    cols: [
      { name: 'c_custkey', kind: 'bk', targets: () => ['customer_h'] },
      { name: 'c_name', kind: 'attr', targets: () => ['customer_n_s'] },
      { name: 'c_address', kind: 'attr', targets: () => ['customer_n_s'] },
      { name: 'c_nationkey', kind: 'fk', targets: () => ['customer_nation_l', 'nation_h'] },
      { name: 'c_mktsegment', kind: 'attr', targets: () => ['customer_n_s'] },
      { name: 'c_acctbal', kind: 'attr', targets: (s) => [s ? 'customer_balance_s' : 'customer_n_s'] },
      { name: 'c_comment', kind: 'attr', targets: () => ['customer_n_s'] },
    ],
  },
  {
    id: 'nation',
    concept: 'Nation',
    rows: NATIONS[0].slice(0, 3) as never,
    cols: [
      { name: 'n_nationkey', kind: 'bk', targets: () => ['nation_h'] },
      { name: 'n_name', kind: 'attr', targets: () => ['nation_n_s'] },
      { name: 'n_region', kind: 'attr', targets: () => ['nation_n_s'] },
    ],
  },
  {
    id: 'orders',
    concept: 'Order',
    rows: ORDERS[0] as never,
    cols: [
      { name: 'o_orderkey', kind: 'bk', targets: () => ['order_h', 'order_customer_nh_l'] },
      { name: 'o_custkey', kind: 'fk', targets: () => ['order_customer_nh_l', 'customer_h'] },
      { name: 'o_orderdate', kind: 'attr', targets: () => ['order_customer_nh_l'] },
      { name: 'o_totalprice', kind: 'attr', targets: () => ['order_customer_nh_l'] },
    ],
  },
]

type NodeType = 'hub' | 'link' | 'sat'
interface VNode {
  id: string
  type: NodeType
  x: number
  y: number
  cols: string[]
  parents?: string[]
}

const nodesFor = (split: boolean): VNode[] => [
  { id: 'nation_h', type: 'hub', x: 14, y: 46, cols: ['hk_nation_h', 'n_nationkey'] },
  { id: 'customer_h', type: 'hub', x: 50, y: 46, cols: ['hk_customer_h', 'c_custkey'] },
  { id: 'order_h', type: 'hub', x: 86, y: 46, cols: ['hk_order_h', 'o_orderkey'] },
  { id: 'customer_nation_l', type: 'link', x: 30, y: 30, cols: ['hk_customer_nation_l', 'hk_customer_h', 'hk_nation_h'], parents: ['customer_h', 'nation_h'] },
  {
    id: 'order_customer_nh_l',
    type: 'link',
    x: 70,
    y: 30,
    cols: ['hk_order_customer_nh_l', 'hk_order_h', 'hk_customer_h', 'o_orderdate', 'o_totalprice'],
    parents: ['order_h', 'customer_h'],
  },
  { id: 'nation_n_s', type: 'sat', x: 14, y: 64, cols: ['hk_nation_h', 'hd_nation_n_s', 'n_name', 'n_region'], parents: ['nation_h'] },
  {
    id: 'customer_n_s',
    type: 'sat',
    x: split ? 40 : 50,
    y: 64,
    cols: ['hk_customer_h', 'hd_customer_n_s', 'c_name', 'c_address', 'c_mktsegment', ...(split ? [] : ['c_acctbal']), 'c_comment'],
    parents: ['customer_h'],
  },
  ...(split ? [{ id: 'customer_balance_s', type: 'sat' as const, x: 63, y: 64, cols: ['hk_customer_h', 'hd_customer_balance_s', 'c_acctbal'], parents: ['customer_h'] }] : []),
]

const TONE: Record<NodeType, { border: string; text: string; stroke: string }> = {
  hub: { border: 'border-sky-500/70', text: 'text-sky-700 dark:text-sky-400', stroke: 'stroke-sky-400/70' },
  link: { border: 'border-emerald-500/70', text: 'text-emerald-700 dark:text-emerald-400', stroke: 'stroke-emerald-400/70' },
  sat: { border: 'border-amber-500/70', text: 'text-amber-700 dark:text-amber-400', stroke: 'stroke-amber-400/70' },
}
const KIND_CHIP: Record<Kind, string> = {
  bk: 'border-sky-500/60 bg-sky-500/15 text-sky-600 dark:text-sky-300',
  fk: 'border-emerald-500/60 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  attr: 'border-amber-500/60 bg-amber-500/15 text-amber-700 dark:text-amber-200',
}

interface Step {
  code: string
  group: 'Start' | 'Hubs' | 'Links' | 'Satellites' | 'Done'
  title: string
  body: ReactNode
}

const STEPS: Step[] = [
  {
    code: '0',
    group: 'Start',
    title: 'Three source datasets',
    body: (
      <>
        A CRM delivers <Code>customer</Code>, a reference system delivers <Code>nation</Code> and a web shop delivers <Code>orders</Code>. Customers point at a nation,
        orders point at a customer. Let's vault them using the three-phase method: hubs, then links, then satellites.
      </>
    ),
  },
  {
    code: '1.1',
    group: 'Hubs',
    title: 'Identify the core business concepts',
    body: (
      <>
        Ask the business which <em>things</em> they talk about: <strong>Customer</strong>, <strong>Nation</strong> and <strong>Order</strong>. Don't sort them into facts and
        dimensions. An order is an event, but it is still a core concept with its own key, so it gets a hub too.
      </>
    ),
  },
  {
    code: '1.2',
    group: 'Hubs',
    title: 'Find the business keys',
    body: (
      <>
        Each concept needs a key that the business recognises and that would survive replacing the source system: <Code>c_custkey</Code>, <Code>n_nationkey</Code>,{' '}
        <Code>o_orderkey</Code>. Look for keys used across the enterprise, not just the primary keys of one application.
      </>
    ),
  },
  {
    code: '1.3',
    group: 'Hubs',
    title: 'Model the hubs',
    body: (
      <>
        One hub per concept, holding only the business key, a <Code>hk_…</Code> hashkey computed from it, <Code>ldts</Code> and <Code>rsrc</Code>. No attributes and no
        foreign keys, which is why the hubs barely ever change.
      </>
    ),
  },
  {
    code: '2.1',
    group: 'Links',
    title: 'Identify the natural business relationships',
    body: (
      <>
        Foreign keys in the sources are good hints: <Code>c_nationkey</Code> (a customer lives in a nation) and <Code>o_custkey</Code> (an order is placed by a customer).
        Note that <Code>o_custkey</Code> is the <em>same</em> concept as <Code>c_custkey</Code>, so orders also feed <Code>customer_h</Code>.
      </>
    ),
  },
  {
    code: '2.2',
    group: 'Links',
    title: 'Analyse the unit of work',
    body: (
      <>
        Which keys belong together in one relationship? Customer–nation is a pair that can change over time, so it gets a standard link. Order–customer is fixed at the
        moment of the order and never changes. That makes it a <strong>non-historized link</strong>, which can carry the order's own values directly.
      </>
    ),
  },
  {
    code: '2.3',
    group: 'Links',
    title: 'Model the links',
    body: (
      <>
        Each link holds the hashkeys of the hubs it connects plus its own <Code>hk_…_l</Code> (the hash of all business keys combined). A customer who moves to another
        nation creates a <em>new</em> link row; the old one stays, because history lives in satellites.
      </>
    ),
  },
  {
    code: '3.1',
    group: 'Satellites',
    title: 'Gather the context attributes',
    body: <>Everything that is neither a business key nor a relationship is context: names, addresses, segments, balances, comments, regions.</>,
  },
  {
    code: '3.2',
    group: 'Satellites',
    title: 'Decide how to split the satellites',
    body: (
      <>
        Satellites are split by <strong>source system</strong>, <strong>rate of change</strong>, <strong>subject area</strong> or <strong>sensitivity</strong>. Our
        customer attributes come from one CRM, so one satellite works. But <Code>c_acctbal</Code> changes daily while the address changes rarely. Try the toggle to give
        it its own satellite: fewer duplicated rows, at the cost of one more table.
      </>
    ),
  },
  {
    code: '3.3',
    group: 'Satellites',
    title: 'Model the satellites',
    body: (
      <>
        Each satellite hangs off exactly one hub or link, keyed by the parent hashkey plus <Code>ldts</Code>. A <Code>hd_…</Code> hashdiff over the payload lets the
        loader detect changes with a single comparison.
      </>
    ),
  },
  {
    code: '✓',
    group: 'Done',
    title: 'The finished raw vault',
    body: (
      <>
        Three source tables became three hubs, two links and {''}
        two or three satellites. Hover over any source column to see where it ended up, or over a vault table to see what feeds it. Next, we build this with dbt.
      </>
    ),
  },
]

const reveal = (step: number) => ({
  concept: step >= 1,
  bk: step >= 2,
  hubs: step >= 3,
  fk: step >= 4,
  rel: step >= 4 && step < 6,
  links: step >= 6,
  attr: step >= 7,
  sats: step >= 9,
})

function SourceCard({
  src,
  step,
  split,
  hover,
  setHover,
}: {
  src: (typeof SOURCES)[number]
  step: number
  split: boolean
  hover: Hover
  setHover: (h: Hover) => void
}) {
  const r = reveal(step)
  const shown = (k: Kind) => (k === 'bk' ? r.bk : k === 'fk' ? r.fk : r.attr)
  return (
    <div className="rounded-xl border bg-card/60">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="font-mono text-xs font-semibold">{src.id}</span>
        <AnimatePresence>
          {r.concept && (
            <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="rounded-full bg-foreground px-2 py-0.5 text-[10px] font-semibold text-background">
              concept: {src.concept}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <div className="flex flex-wrap gap-1 p-2.5">
        {src.cols.map((c) => {
          const targets = c.targets(split)
          const lit = hover?.kind === 'node' ? targets.includes(hover.id) : hover?.kind === 'col' && hover.id === `${src.id}.${c.name}`
          return (
            <motion.span
              key={c.name}
              layout
              onMouseEnter={() => setHover({ kind: 'col', id: `${src.id}.${c.name}`, targets })}
              onMouseLeave={() => setHover(null)}
              animate={{ scale: lit ? 1.08 : 1 }}
              className={cn(
                'cursor-default rounded-md border px-1.5 py-0.5 font-mono text-[11px] transition-colors duration-500',
                shown(c.kind) ? KIND_CHIP[c.kind] : 'border-border text-muted-foreground',
                lit && 'ring-2 ring-foreground/60',
              )}
            >
              {c.name}
            </motion.span>
          )
        })}
      </div>
      <div tabIndex={0} className="overflow-x-auto border-t outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
        <table className="w-full font-mono text-[10.5px] text-muted-foreground">
          <tbody>
            {src.rows.map((row, i) => (
              <tr key={i} className="border-t border-border/40 first:border-0">
                {src.cols.map((c) => (
                  <td key={c.name} className="whitespace-nowrap px-2 py-0.5">
                    {String(row[c.name] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

type Hover = { kind: 'col'; id: string; targets: string[] } | { kind: 'node'; id: string } | null

function VaultCanvas({ step, split, hover, setHover }: { step: number; split: boolean; hover: Hover; setHover: (h: Hover) => void }) {
  const r = reveal(step)
  const nodes = nodesFor(split)
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]))
  const visible = (n: VNode) => (n.type === 'hub' ? r.hubs : n.type === 'link' ? r.links : r.sats)
  const lit = (id: string) => (hover?.kind === 'col' ? hover.targets.includes(id) : hover?.kind === 'node' && hover.id === id)

  return (
    <div className="relative h-[34rem] min-w-[44rem] rounded-2xl border bg-[radial-gradient(circle_at_1px_1px,var(--border)_1px,transparent_0)] bg-[size:20px_20px]">
      <svg className="pointer-events-none absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <AnimatePresence>
          {r.rel &&
            [
              ['customer_h', 'nation_h'],
              ['order_h', 'customer_h'],
            ].map(([a, b]) => (
              <motion.line
                key={`rel-${a}`}
                x1={byId[a].x}
                y1={byId[a].y}
                x2={byId[b].x}
                y2={byId[b].y}
                className="stroke-emerald-400"
                strokeWidth={2}
                strokeDasharray="6 6"
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
              />
            ))}
          {nodes
            .filter((n) => visible(n) && n.parents)
            .flatMap((n) =>
              n.parents!.map((p) => (
                <motion.line
                  key={`${n.id}-${p}`}
                  x1={n.x}
                  y1={n.y}
                  x2={byId[p].x}
                  y2={byId[p].y}
                  className={cn(TONE[n.type].stroke, (lit(n.id) || lit(p)) && 'stroke-foreground')}
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1, x1: n.x, x2: byId[p].x }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                />
              )),
            )}
        </AnimatePresence>
      </svg>
      <AnimatePresence>
        {nodes.filter(visible).map((n, i) => (
          <motion.div
            key={n.id}
            layout
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: 1, scale: lit(n.id) ? 1.06 : 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22, delay: hover ? 0 : i * 0.06 }}
            onMouseEnter={() => setHover({ kind: 'node', id: n.id })}
            onMouseLeave={() => setHover(null)}
            style={{ left: `${n.x}%`, top: `${n.y}%` }}
            className={cn(
              'absolute w-44 -translate-x-1/2 rounded-xl border-2 bg-card p-2 shadow-xl',
              n.type === 'hub' ? '-translate-y-1/2' : n.type === 'link' ? '-translate-y-full' : '',
              TONE[n.type].border,
              lit(n.id) && 'ring-4 ring-foreground/20',
            )}
          >
            <div className={cn('mb-1 font-mono text-[11px] font-semibold', TONE[n.type].text)}>{n.id}</div>
            <div className="space-y-0.5 font-mono text-[10px]">
              {n.cols.map((c) => (
                <div key={c} className={cn(c.startsWith('hk_') || c.startsWith('hd_') ? 'text-muted-foreground' : 'text-foreground')}>
                  {c}
                </div>
              ))}
              <div className="text-muted-foreground/60">+ ldts, rsrc</div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      {!r.hubs && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">The vault is empty. Step through the method →</div>
      )}
    </div>
  )
}

function Stepper() {
  const [step, setStep] = usePersistentState('modelling.step', 0)
  const [split, setSplit] = useState(false)
  const [hover, setHover] = useState<Hover>(null)
  const go = useCallback((d: number) => setStep((s) => Math.min(STEPS.length - 1, Math.max(0, s + d))), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go])

  const s = STEPS[step]
  const groups = ['Hubs', 'Links', 'Satellites'] as const

  return (
    <div className="rounded-2xl border bg-card/30 p-4 md:p-6">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {groups.map((g, gi) => (
          <div key={g} className="flex items-center gap-1">
            <span className={cn('mr-1 text-xs font-medium', ['text-sky-700 dark:text-sky-400', 'text-emerald-700 dark:text-emerald-400', 'text-amber-700 dark:text-amber-400'][gi])}>
              {gi + 1}. {g}
            </span>
            {STEPS.map((st, i) =>
              st.group === g ? (
                <button
                  key={st.code}
                  onClick={() => setStep(i)}
                  className={cn(
                    'rounded-md px-1.5 py-0.5 font-mono text-[11px] transition-colors',
                    i === step ? 'bg-foreground text-background' : i < step ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted',
                  )}
                >
                  {st.code}
                </button>
              ) : null,
            )}
            {gi < 2 && <span className="mx-1 text-muted-foreground">·</span>}
          </div>
        ))}
        <div className="ml-auto flex items-center gap-1">
          <Button size="icon-sm" variant="ghost" aria-label="Restart" onClick={() => setStep(0)}>
            <RotateCcw />
          </Button>
          <Button size="sm" variant="outline" onClick={() => go(-1)} disabled={step === 0}>
            <ChevronLeft /> Back
          </Button>
          <Button size="sm" onClick={() => go(1)} disabled={step === STEPS.length - 1}>
            Next <ChevronRight />
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="mb-5 min-h-[6.5rem]">
          <div className="font-mono text-xs text-muted-foreground">
            Step {s.code} · {s.group}
          </div>
          <div className="mt-1 text-xl font-semibold">{s.title}</div>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-foreground/80">{s.body}</p>
          {step >= 8 && (
            <label htmlFor="m-split" className="mt-3 inline-flex items-center gap-2 text-sm">
              <Switch id="m-split" checked={split} onCheckedChange={setSplit} /> Split <Code>c_acctbal</Code> into <Code>customer_balance_s</Code> (rate of change)
            </label>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="grid gap-4 xl:grid-cols-[22rem_1fr]">
        <div className="space-y-3">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Sources</div>
          {SOURCES.map((src) => (
            <SourceCard key={src.id} src={src} step={step} split={split} hover={hover} setHover={setHover} />
          ))}
          <div className="flex flex-wrap gap-3 pt-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-sm bg-sky-500" /> business key
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-sm bg-emerald-500" /> relationship
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-sm bg-amber-500" /> context
            </span>
          </div>
        </div>
        <div className="min-w-0">
          <div className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Raw vault</div>
          <div tabIndex={0} className="overflow-x-auto outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
            <VaultCanvas step={step} split={split} hover={hover} setHover={setHover} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Modelling() {
  return (
    <Chapter>
      <ChapterHeader
        n={2}
        title="Modelling three datasets"
        lead="Modelling a Data Vault is closer to business analysis than to source analysis. Follow the nine steps of the method and watch customer, nation and orders turn into hubs, links and satellites."
      />
      <Section>
        <Stepper />
        <p className="mt-2 text-xs text-muted-foreground">Tip: use ← and → to step. Hover over columns and tables to trace them.</p>
      </Section>

      <Section title="What to take away">
        <div className="grid gap-4 md:grid-cols-3">
          <Callout kind="info" title="Keys are a business decision">
            The hardest step is 1.2. A good hub key means the same thing across the enterprise and survives a system replacement. When sources disagree (e.g. a{' '}
            <em>person</em> in one system and a <em>customer</em> in another), the raw vault keeps both and the business vault aligns them with rules.
          </Callout>
          <Callout kind="tip" title="One concept, many sources">
            <Code>customer_h</Code> is loaded from <em>both</em> <Code>customer</Code> and <Code>orders</Code>. If an order references a customer the CRM hasn't sent yet,
            the hub still gets the key. That's integration by business key.
          </Callout>
          <Callout kind="warn" title="Change is additive">
            New source with customer data? Add a satellite. New relationship? Add a link. Nothing that already exists needs to be rebuilt.
          </Callout>
        </div>
        <P>
          Ready to build it? <Link to="/dbt" className="text-sky-700 dark:text-sky-400 underline underline-offset-4">Chapter 3</Link> turns every box on this canvas into a
          datavault4dbt model.
        </P>
      </Section>
    </Chapter>
  )
}
