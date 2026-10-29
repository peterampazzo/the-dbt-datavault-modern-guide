import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Chapter } from '@/components/Chapter'
import { CodeBlock } from '@/components/CodeBlock'
import { DataTable } from '@/components/DataTable'
import { Callout, ChapterHeader, Code, P, Section } from '@/components/Prose'
import { Term } from '@/components/Term'
import { BusinessVaultMartsDrawing } from '@/components/drawing/BusinessVaultMartsDrawing'
import { PrecedenceMergeDrawing } from '@/components/drawing/PrecedenceMergeDrawing'
import { integratedCustomer, isGhost, orderTotals, pit, shopCustomerSatellite, simulate, type CustomerPrecedence, type Row } from '@/lib/dv/engine'
import { MODEL, SNIPPETS } from '@/lib/dv/models'

const run = simulate()[2]
const crmRows = run.tables.customer_n_s.filter((row) => !isGhost(row))
const shopRows = shopCustomerSatellite().filter((row) => !isGhost(row))
const shopKeys = new Set(shopRows.map((row) => String(row.hk_customer_h)))
const PRECEDENCES: { label: string; value: CustomerPrecedence }[] = [
  { label: 'CRM first', value: ['crm/customer', 'shop/customer'] },
  { label: 'Shop first', value: ['shop/customer', 'crm/customer'] },
]
const ATTRIBUTES = [
  { key: 'c_name', label: 'Name' },
  { key: 'c_address', label: 'Address' },
] as const

function latestByCustomer(rows: Row[]) {
  const latest = new Map<string, Row>()
  for (const row of rows) {
    const key = String(row.hk_customer_h)
    if (!latest.has(key) || String(latest.get(key)!.ldts) < String(row.ldts)) latest.set(key, row)
  }
  return [...latest.values()].sort((a, b) => Number(a.c_custkey) - Number(b.c_custkey))
}

function IntegratedCustomers({ precedence }: { precedence: CustomerPrecedence }) {
  const rows = useMemo(
    () => latestByCustomer(integratedCustomer(crmRows, shopRows, precedence).filter((row) => shopKeys.has(String(row.hk_customer_h)))),
    [precedence],
  )
  const other = precedence[0] === 'crm/customer' ? PRECEDENCES[1].value : PRECEDENCES[0].value
  const comparison = useMemo(
    () => latestByCustomer(integratedCustomer(crmRows, shopRows, other).filter((row) => shopKeys.has(String(row.hk_customer_h)))),
    [other],
  )
  const byKey = new Map(comparison.map((row) => [String(row.hk_customer_h), row]))
  return (
    <div className="overflow-auto rounded-xl border" tabIndex={0} aria-label="Integrated customer profiles" data-testid="integrated-customer">
      <table className="w-full min-w-[42rem] border-collapse text-sm">
        <thead>
          <tr className="bg-muted/60">
            <th className="px-3 py-2 text-left">Customer</th>
            {ATTRIBUTES.map((attribute) => <th key={attribute.key} className="px-3 py-2 text-left">{attribute.label}</th>)}
            <th className="px-3 py-2 text-left">Load date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const otherRow = byKey.get(String(row.hk_customer_h))
            return (
              <tr key={`${row.hk_customer_h}-${row.ldts}`} className="border-t">
                <th scope="row" className="px-3 py-2 text-left font-medium">{String(row.c_custkey)}</th>
                {ATTRIBUTES.map((attribute) => {
                  const changed = row[attribute.key] !== otherRow?.[attribute.key]
                  return (
                    <td key={attribute.key} className="px-3 py-2">
                      <div>{String(row[attribute.key] ?? 'NULL')}</div>
                      <div className="text-xs text-muted-foreground">{String(row[`source_of_${attribute.key}`] ?? '—')}</div>
                      {changed && <span className="mt-1 inline-block rounded bg-amber-500/15 px-1.5 py-0.5 text-xs text-amber-800 dark:text-amber-200">changed</span>}
                    </td>
                  )
                })}
                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{String(row.ldts)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function CustomerGrainExample() {
  const [scope, setScope] = useState<'all' | 'latest'>('all')
  const data = useMemo(() => {
    const alice = run.source.customer.find((row) => String(row.c_name).startsWith('Alice'))
    const hub = run.tables.customer_h.find((row) => row.c_custkey === alice?.c_custkey && !isGhost(row))
    const customerHash = String(hub?.hk_customer_h)
    const satellites = new Map(run.tables.customer_n_s.map((row) => [`${row.hk_customer_h}|${row.ldts}`, row] as const))
    const snapshots = pit(run.tables)
      .filter((row) => String(row.c_custkey) === String(alice?.c_custkey))
      .sort((a, b) => String(a.sdts).localeCompare(String(b.sdts)))
      .map((row) => ({
        sdts: String(row.sdts),
        segment: String(satellites.get(`${row.customer_n_s_hk}|${row.customer_n_s_ldts}`)?.c_mktsegment),
      }))
    const orderKeys = new Map(run.tables.order_h.filter((row) => !isGhost(row)).map((row) => [String(row.hk_order_h), String(row.o_orderkey)] as const))
    const orders = run.tables.order_customer_nh_l
      .filter((row) => !isGhost(row) && String(row.hk_customer_h) === customerHash)
      .map((row) => ({ key: String(orderKeys.get(String(row.hk_order_h))), total: Number(row.o_totalprice) }))
      .sort((a, b) => Number(a.key) - Number(b.key))
    return { name: String(alice?.c_name), snapshots, orders }
  }, [])
  const selectedSnapshots = scope === 'all' ? data.snapshots : data.snapshots.slice(-1)
  const joinedRows = selectedSnapshots.flatMap((snapshot) => data.orders.map((order) => ({ snapshot, order })))
  const total = joinedRows.reduce((sum, row) => sum + row.order.total, 0)

  return (
    <div className="mx-auto max-w-[48rem] border-t pt-6">
      <div role="group" aria-label="Choose the report snapshot scope" className="mb-4 flex flex-wrap gap-2">
        <button type="button" aria-pressed={scope === 'all'} onClick={() => setScope('all')} className="rounded-md border px-3 py-2 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground">
          All snapshots
        </button>
        <button type="button" aria-pressed={scope === 'latest'} onClick={() => setScope('latest')} className="rounded-md border px-3 py-2 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground">
          One snapshot (latest)
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border p-4">
          <h3 className="mb-2 text-sm font-semibold">{data.name}’s PIT / dimension rows</h3>
          <ul className="space-y-1 text-xs">
            {selectedSnapshots.map((row) => <li key={row.sdts}><code>{row.sdts}</code> · {row.segment}</li>)}
          </ul>
        </div>
        <div className="rounded-xl border p-4">
          <h3 className="mb-2 text-sm font-semibold">{data.name}’s orders</h3>
          <ul className="space-y-1 text-xs">
            {data.orders.map((row) => <li key={row.key}>Order <code>{row.key}</code> · {row.total}</li>)}
          </ul>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6">
        {selectedSnapshots.length} PIT rows × {data.orders.length} orders = {joinedRows.length} joined rows. Summed order total: {total}.
      </p>
    </div>
  )
}

function CustomerOrderTotalTest() {
  const [aggregate, setAggregate] = useState<'sum' | 'max'>('sum')
  const test = SNIPPETS.customer_order_total_unit_test
  const expectedRows = test.expectedRows
  const actualRows = useMemo(
    () => orderTotals({ order_customer_nh_l: test.givenRows }, { aggregate }),
    [aggregate, test.givenRows],
  )
  const actualByKey = new Map(actualRows.map((row) => [`${row.hk_customer_h}|${row.ldts}`, row]))
  const customerIds = new Map(
    run.tables.customer_h
      .filter((row) => !isGhost(row))
      .map((row) => [String(row.hk_customer_h), String(row.c_custkey)] as const),
  )
  const matches = expectedRows.length === actualRows.length && expectedRows.every((expected) => {
    const actual = actualByKey.get(`${expected.hk_customer_h}|${expected.ldts}`)
    return actual
      && actual.order_count === expected.order_count
      && actual.total_price === expected.total_price
      && actual.hd_customer_order_total_s === expected.hd_customer_order_total_s
  })

  return (
    <div className="mx-auto max-w-[48rem] border-t pt-6">
      <fieldset className="mb-4">
        <legend className="sr-only">Choose the order total logic</legend>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={aggregate === 'sum'}
            onClick={() => setAggregate('sum')}
            className="rounded-md border px-3 py-2 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground"
          >
            Model as written (sum)
          </button>
          <button
            type="button"
            aria-pressed={aggregate === 'max'}
            onClick={() => setAggregate('max')}
            className="rounded-md border px-3 py-2 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground"
          >
            Logic broken (max)
          </button>
        </div>
      </fieldset>
      <div className="mb-4 max-h-48 overflow-auto">
        <CodeBlock title="Existing unit test" code={test.code} lang="yaml" />
      </div>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-sm font-medium">Expected vs actual</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${matches ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200' : 'bg-rose-500/15 text-rose-800 dark:text-rose-200'}`}>
          {matches ? 'PASS' : 'FAIL'}
        </span>
      </div>
      <div className="overflow-auto rounded-xl border" tabIndex={0} aria-label="Expected and actual order totals">
        <table className="w-full min-w-[42rem] border-collapse text-xs">
          <thead>
            <tr className="bg-muted/60">
              <th className="px-2 py-1 text-left">Customer</th>
              <th className="px-2 py-1 text-left">Load date</th>
              <th className="px-2 py-1 text-right">Expected count</th>
              <th className="px-2 py-1 text-right">Actual count</th>
              <th className="px-2 py-1 text-right">Expected total</th>
              <th className="px-2 py-1 text-right">Actual total</th>
            </tr>
          </thead>
          <tbody>
            {expectedRows.map((expected) => {
              const actual = actualByKey.get(`${expected.hk_customer_h}|${expected.ldts}`)
              const rowMatches = actual
                && actual.order_count === expected.order_count
                && actual.total_price === expected.total_price
                && actual.hd_customer_order_total_s === expected.hd_customer_order_total_s
              return (
                <tr key={`${expected.hk_customer_h}|${expected.ldts}`} className={`border-t ${rowMatches ? '' : 'bg-rose-500/10'}`}>
                  <th scope="row" className="whitespace-nowrap px-2 py-1 text-left font-medium">
                    Customer {customerIds.get(String(expected.hk_customer_h)) ?? '—'}
                  </th>
                  <td className="whitespace-nowrap px-2 py-1 font-mono">{String(expected.ldts)}</td>
                  <td className="px-2 py-1 text-right">{String(expected.order_count)}</td>
                  <td className="px-2 py-1 text-right">{String(actual?.order_count ?? '—')}</td>
                  <td className="px-2 py-1 text-right">{String(expected.total_price)}</td>
                  <td className="px-2 py-1 text-right">{String(actual?.total_price ?? '—')}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function BusinessVault() {
  const [precedence, setPrecedence] = useState<CustomerPrecedence>(PRECEDENCES[0].value)
  const totals = useMemo(() => orderTotals(run.tables), [])
  return (
    <Chapter>
      <ChapterHeader
        title="The modern business vault"
        lead={<>The <Term id="business-vault">business vault</Term> holds reusable integration and calculation rules. A <Term id="mart">mart</Term> shapes the result for its audience.</>}
      />

      <Section title="Business vault vs marts" lead="The business vault keeps reusable, auditable rules. Each mart serves a particular audience and question." keyPoint="Reusable rules stay keyed by vault keys; marts serve a specific question.">
        <BusinessVaultMartsDrawing />
        <PrecedenceMergeDrawing />
        <div className="overflow-auto rounded-xl border" tabIndex={0} aria-label="Business vault and mart comparison">
          <table className="w-full min-w-[36rem] border-collapse text-sm">
            <thead><tr className="bg-muted/60"><th className="px-3 py-2 text-left">Business vault</th><th className="px-3 py-2 text-left">Mart</th></tr></thead>
            <tbody>
              <tr className="border-t"><td className="px-3 py-2">Reusable precedence, snapshots and calculations</td><td className="px-3 py-2">One audience’s dimensions, facts or extracts</td></tr>
              <tr className="border-t"><td className="px-3 py-2">Uses hub/link keys and keeps the rule auditable</td><td className="px-3 py-2">Uses names and shapes that make reporting easy</td></tr>
              <tr className="border-t"><td className="px-3 py-2">Can be rebuilt from the raw vault</td><td className="px-3 py-2">Can be rebuilt from the business vault</td></tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        title="One grain, one time rule per report"
        lead={<><Term id="grain">Grain</Term> describes what one row represents. <Code>dim_customer</Code> has one row per customer per <Code>sdts</Code>.</>}
        keyPoint="Without choosing a snapshot, each order joins once to every snapshot row for its customer."
      >
        <P>Joining all of a customer’s dimension snapshots to orders counts each order once per snapshot. Choose the report’s time rule before adding the rows.</P>
        <CustomerGrainExample />
        <CodeBlock title="Singular test for the dimension grain" lang="sql" code={SNIPPETS.dim_customer_grain_test.code} />
      </Section>

      <Section title="Precedence toggle" lead={<><Term id="precedence">Precedence</Term> chooses which source wins when both have a non-null profile value. Each cell shows its winning source.</>} keyPoint="Precedence belongs in a business-vault model, not in a raw satellite.">
        <div className="mb-4 flex flex-wrap gap-2" data-testid="precedence-toggle">
          {PRECEDENCES.map((option) => (
            <button
              key={option.label}
              type="button"
              aria-pressed={precedence[0] === option.value[0]}
              onClick={() => setPrecedence(option.value)}
              className={`rounded-lg border px-3 py-2 text-sm ${precedence[0] === option.value[0] ? 'border-sky-500 bg-sky-500/10' : 'hover:bg-muted/50'}`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <IntegratedCustomers precedence={precedence} />
        <div className="mt-4 max-h-72 overflow-auto"><CodeBlock title="models/business_vault/customer_integrated_s.sql" code={MODEL.customer_integrated_s.code} /></div>
        <Callout title="Raw source history stays separate">
          The CRM and shop satellites keep what each source said. The integrated satellite records the selected result with <code>rsrc = 'SYSTEM'</code>, so a different precedence can be rebuilt and reviewed.
        </Callout>
      </Section>

      <Section title="Computed satellite" lead={<>A <Term id="computed-satellite">computed satellite</Term> records reusable calculations without copying raw rows.</>} keyPoint="Computed satellites are insert-only history too: a changed total gets a new version.">
        <DataTable
          title="customer_order_total_s"
          tone="bv"
          rows={totals}
          columns={['hk_customer_h', 'ldts', 'order_count', 'total_price', 'hd_customer_order_total_s']}
          hideGhosts
          maxHeight="max-h-64"
        />
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="max-h-72 overflow-auto"><CodeBlock title="models/business_vault/customer_order_total_s.sql" code={MODEL.customer_order_total_s.code} /></div>
          <div className="max-h-72 overflow-auto"><CodeBlock title="unit_tests/customer_order_total_s.yml" code={SNIPPETS.customer_order_total_unit_test.code} lang="yaml" /></div>
        </div>
      </Section>

      <Section title="A passing run should prove an expected result" lead="Unit tests compare model output with fixed expected rows.">
        <P>
          <Code>not_null</Code> and <Code>unique</Code> tests can pass even when logic is wrong. A unit test fixes inputs and expected rows to catch that.
        </P>
        <CustomerOrderTotalTest />
        <P className="mt-6">
          A <Term id="model-contract">model contract</Term> makes dbt check column names and types when it builds the model. dbt-fabricspark 1.13 enforces this for Delta tables and views, but marks not_null, unique, primary-key, foreign-key and check constraints as “not enforced”, so keep data tests for those.
        </P>
        <div className="mx-auto max-w-[48rem]">
          <CodeBlock title="Contract for dim_customer" lang="yaml" code={SNIPPETS.dim_customer_contract.code} />
        </div>
      </Section>

      <Section title="Views first; one snapshot control for every PIT" lead="Views derive end dates and current flags. One snapshot control table gives every PIT the same reporting clock." keyPoint={<><Term id="business-date">Business date</Term> says when something happened; a load date says when the warehouse received it. Keep both.</>}>
        <P>
          A PIT is a set of pointers at a snapshot date. One <code>control_snap_v1</code> policy gives those snapshots a shared calendar.
        </P>
        <P>
          The <Term id="business-date">business date</Term> comes from the source event, such as an order date. The load date comes from the delivery. A late delivery can change what the warehouse knew without changing the event’s business date.
        </P>
        <Link className="font-medium text-sky-700 underline dark:text-sky-400" to="/pit">Review snapshots and PIT pointers →</Link>
      </Section>

      <Section title="No copies maintained by MERGE" lead={<>Raw-vault rows remain insert-only. Rebuild the business vault from <Term id="raw-vault">raw-vault</Term> rows, avoiding a second mutable copy.</>} keyPoint="A rule in dbt code can be changed, tested and rebuilt without editing raw history.">
        <P>When precedence, totals or a reporting definition changes, run the model again from the raw vault. Keep the previous result long enough to compare it, then publish the rebuilt mart.</P>
        <Callout kind="tip" title="Rebuild from retained history">
          The business vault is derived work. Retained deliveries and raw-vault history let you change the rule without pretending the source said something else.
        </Callout>
      </Section>
    </Chapter>
  )
}
