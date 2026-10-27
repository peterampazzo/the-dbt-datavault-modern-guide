import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Chapter } from '@/components/Chapter'
import { CodeBlock } from '@/components/CodeBlock'
import { DataTable } from '@/components/DataTable'
import { Callout, ChapterHeader, P, Section } from '@/components/Prose'
import { integratedCustomer, isGhost, orderTotals, shopCustomerSatellite, simulate, type CustomerPrecedence, type Row } from '@/lib/dv/engine'
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

export default function BusinessVault() {
  const [precedence, setPrecedence] = useState<CustomerPrecedence>(PRECEDENCES[0].value)
  const totals = useMemo(() => orderTotals(run.tables), [])
  return (
    <Chapter>
      <ChapterHeader
        title="The modern business vault"
        lead="Keep reusable integration and calculation rules above the raw vault, then shape the result for each audience in a mart."
      />

      <Section title="Business vault vs marts" lead="The business vault keeps reusable, auditable rules. A mart is shaped for one audience." keyPoint="Keep reusable rules keyed by vault keys; let marts serve a specific question.">
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

      <Section title="Precedence toggle" lead="Pick which source wins when both have a non-null profile value. Each cell shows its winning source." keyPoint="Precedence belongs in a business-vault model, not in a raw satellite.">
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

      <Section title="Computed satellite" lead="A derived satellite can record reusable calculations without copying raw rows." keyPoint="Computed satellites are insert-only history too: a changed total gets a new version.">
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

      <Section title="Views first; one snapshot control for every PIT" lead="Use views for derived end dates and current flags. A control snapshot table gives every PIT the same reporting clock." keyPoint="A business date says when something happened; a load date says when the warehouse received it. Keep both.">
        <P>
          A PIT is a set of pointers at a snapshot date. Keep one <code>control_snap_v1</code> policy for those snapshots rather than letting each PIT invent a calendar.
        </P>
        <P>
          The business date comes from the source event, such as an order date. The load date comes from the delivery. A late delivery can change what the warehouse knew without changing the event’s business date.
        </P>
        <Link className="font-medium text-sky-700 underline dark:text-sky-400" to="/pit">Review snapshots and PIT pointers →</Link>
      </Section>

      <Section title="No copies maintained by MERGE" lead="Raw-vault rows remain insert-only. Rebuild the business vault from those rows instead of maintaining a second mutable copy." keyPoint="A rule in dbt code can be changed, tested and rebuilt without editing raw history.">
        <P>When precedence, totals or a reporting definition changes, run the model again from the raw vault. Keep the previous result long enough to compare it, then publish the rebuilt mart.</P>
        <Callout kind="tip" title="Rebuildable is the safety feature">
          The business vault is derived work. Retained deliveries and raw-vault history let you change the rule without pretending the source said something else.
        </Callout>
      </Section>
    </Chapter>
  )
}
