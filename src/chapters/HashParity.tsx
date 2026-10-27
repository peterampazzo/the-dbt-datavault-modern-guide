import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Chapter } from '@/components/Chapter'
import { CodeBlock } from '@/components/CodeBlock'
import { DataTable } from '@/components/DataTable'
import { ChapterHeader, Callout, P, Section } from '@/components/Prose'
import { BATCHES, CUSTOMERS, ORDERS } from '@/lib/dv/dataset'
import { dvHash, type Value } from '@/lib/dv/hash'
import { legacyHash } from '@/lib/legacy/parity'
import { LEGACY_CUSTOMER_HUB, LEGACY_CUSTOMER_SAT, seedFromLegacy } from '@/lib/legacy/history'

type LabSettings = {
  encoding: 'utf8' | 'utf16le'
  delimiter: string
  nullAs: string
  quote: string
}

type LabRow = { label: string; values: Value[]; kind: 'customer' | 'order' | 'edge' }

const CUSTOMER_ROWS: LabRow[] = [...new Set(CUSTOMERS.flat().map((row) => row.c_custkey))].map((key) => ({
  label: `customer_h · ${key}`,
  values: [key],
  kind: 'customer',
}))
const ORDER_ROWS: LabRow[] = ORDERS.flat().map((row) => ({
  label: `order_customer_nh_l · ${row.o_orderkey}/${row.o_custkey}`,
  values: [row.o_orderkey, row.o_custkey],
  kind: 'order',
}))
const EDGE_ROWS: LabRow[] = [
  { label: 'edge · Straße', values: ['Straße'], kind: 'edge' },
  { label: 'edge ·  42 ', values: [' 42 '], kind: 'edge' },
  { label: "edge · ('a;b','c')", values: ['a;b', 'c'], kind: 'edge' },
  { label: "edge · ('a','b;c')", values: ['a', 'b;c'], kind: 'edge' },
  { label: "edge · (NULL,'5')", values: [null, '5'], kind: 'edge' },
]
const LAB_ROWS = [...CUSTOMER_ROWS, ...ORDER_ROWS, ...EDGE_ROWS]

function shortHash(value: string) {
  return `${value.slice(0, 8)}…${value.slice(-6)}`
}

function ParityLab() {
  const [settings, setSettings] = useState<LabSettings>({ encoding: 'utf8', delimiter: '||', nullAs: '^^', quote: '"' })
  const rows = useMemo(
    () => LAB_ROWS.map((row) => {
      const legacy = legacyHash(row.values)
      const current = dvHash(row.values, { ...settings, kind: 'hashkey' }).hash
      return { ...row, legacy, current, matches: legacy.toLowerCase() === current.toLowerCase() }
    }),
    [settings],
  )
  const matches = rows.filter((row) => row.matches).length
  const update = <K extends keyof LabSettings>(key: K, value: LabSettings[K]) => setSettings((previous) => ({ ...previous, [key]: value }))
  const vars = `vars:
  datavault4dbt:
    concat_string: ${JSON.stringify(settings.delimiter)}
    null_placeholder_string: ${JSON.stringify(settings.nullAs)}
    quote_character: ${JSON.stringify(settings.quote)}`

  return (
    <div className="space-y-5" data-testid="parity-lab">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm">Input cast
          <select aria-label="Input cast" className="mt-1 block w-full rounded-md border bg-background px-2 py-1.5" value={settings.encoding} onChange={(event) => update('encoding', event.target.value as LabSettings['encoding'])}>
            <option value="utf8">VARCHAR / UTF-8</option>
            <option value="utf16le">NVARCHAR / UTF-16LE</option>
          </select>
        </label>
        <label className="text-sm">Delimiter
          <select aria-label="Delimiter" className="mt-1 block w-full rounded-md border bg-background px-2 py-1.5" value={settings.delimiter} onChange={(event) => update('delimiter', event.target.value)}>
            <option value="||">||</option>
            <option value=";">;</option>
          </select>
        </label>
        <label className="text-sm">NULL as
          <select aria-label="NULL as" className="mt-1 block w-full rounded-md border bg-background px-2 py-1.5" value={settings.nullAs} onChange={(event) => update('nullAs', event.target.value)}>
            <option value="^^">^^</option>
            <option value="">empty</option>
          </select>
        </label>
        <label className="text-sm">Quote character
          <select aria-label="Quote character" className="mt-1 block w-full rounded-md border bg-background px-2 py-1.5" value={settings.quote} onChange={(event) => update('quote', event.target.value)}>
            <option value={'"'}>&quot;</option>
            <option value="">none</option>
          </select>
        </label>
      </div>
      <p role="status" className="text-sm font-medium">{matches} of {rows.length} rows match</p>
      <div role="region" aria-label="Hash comparison results" tabIndex={0} className="max-h-[28rem] overflow-auto rounded-xl border focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
        <table className="w-full min-w-[48rem] border-collapse text-sm">
          <thead><tr className="bg-muted/60"><th className="px-3 py-2 text-left">Row</th><th className="px-3 py-2 text-left">Legacy procedure</th><th className="px-3 py-2 text-left">datavault4dbt with your settings</th><th className="px-3 py-2">Result</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t">
                <th scope="row" className="px-3 py-2 text-left font-medium">{row.label}</th>
                <td className="px-3 py-2 font-mono text-xs">{shortHash(row.legacy)}</td>
                <td className="px-3 py-2 font-mono text-xs">{shortHash(row.current)}</td>
                <td className="px-3 py-2 text-center" aria-label={row.matches ? 'match' : 'mismatch'}>{row.matches ? '✓' : '✗'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CodeBlock title="Matching datavault4dbt vars" code={vars} lang="yaml" />
      <P>Encoding follows SQL Server’s <code>hash_input_dtype</code>. Spark strings are UTF-8, so UTF-16LE parity needs an engine-specific hash macro rather than a dbt var.</P>
      <P>With all four settings matching, the two semicolon-in-key rows still show a mismatch: the legacy procedure escaped nothing, so both different keys produced the same ambiguous legacy hash. Use the old-to-new key map below instead of guessing.</P>
      <P>SQL Server <code>CONVERT(..., 2)</code> returns hexadecimal text. Compare hashes case-insensitively or store <code>BINARY(16)</code>. Engines also differ in how they uppercase characters such as <code>ß</code>; keep such values in vectors without assuming one engine’s result.</P>
    </div>
  )
}

const VECTOR_KEYS: Value[] = ['Straße', ' 42 ', 'a;b', 'b;c', null]
const VECTOR_INPUTS = VECTOR_KEYS.map((key) => ({
  ...CUSTOMERS[0][0],
  c_custkey: key,
  ldts: BATCHES[0],
  rsrc: 'crm/customer',
}))
const VECTOR_YAML = `unit_tests:
  - name: stg_customer_hash_vectors
    model: stg_customer
    given:
      - input: ref('raw_customer')
        rows:
${VECTOR_INPUTS.map((row) => `          - ${JSON.stringify(row)}`).join('\n')}
    expect:
      rows:
${VECTOR_KEYS.map((key) => `          - ${JSON.stringify({ c_custkey: key, ldts: BATCHES[0], hk_customer_h: dvHash([key]).hash })}`).join('\n')}`

const RECONCILIATION_LABEL: Record<string, string> = {
  legacyHubRows: 'Legacy hub rows',
  newHubRows: 'New hub rows',
  legacySatVersions: 'Legacy satellite versions',
  newSatVersions: 'New satellite versions',
  payloadMismatches: 'Payload mismatches',
  hashdiffMismatches: 'Hashdiff mismatches',
}

export default function HashParity() {
  const seeded = seedFromLegacy()
  return (
    <Chapter>
      <ChapterHeader
        title="Hash parity and restoring history"
        lead="Compare an older key rule with datavault4dbt, then bring history across without losing the business meaning."
      />

      <Section title="Two ways to bring keys across">
        <P>One option is to configure the new hash macro so it reproduces the legacy hashkeys. The other is to recompute every key from the business key while seeding the historical rows.</P>
        <P>Hubs retain the business key, and links can join legacy hubs to derive their new keys. Recompute unless another system already consumes the legacy hashkeys; always recompute hashdiffs from the payload.</P>
      </Section>

      <Section title="Parity lab" lead="The left side never changes. Tune the right side until its settings match the procedure.">
        <ParityLab />
      </Section>

      <Section title="Test vectors as dbt unit tests">
        <P>These expected hashes are generated by <code>hash.ts</code> at module load, not hand-typed. The same edge vectors run on every engine, so a changed macro or cast fails close to the rule that caused it.</P>
        <CodeBlock title="stg_customer unit vectors" code={VECTOR_YAML} lang="yaml" />
      </Section>

      <Section title="Where history comes from">
        <div role="region" aria-label="History source comparison" tabIndex={0} className="overflow-x-auto rounded-xl border focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
          <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
            <thead><tr className="bg-muted/60"><th className="px-3 py-2">Source</th><th className="px-3 py-2">Preserves</th><th className="px-3 py-2">Loses</th></tr></thead>
            <tbody>
              <tr className="border-t"><th className="px-3 py-2">Archived deliveries</th><td className="px-3 py-2">Raw values, delivery dates and replayable source context</td><td className="px-3 py-2">Only what was not archived</td></tr>
              <tr className="border-t"><th className="px-3 py-2">1:1 legacy-vault copy</th><td className="px-3 py-2">Vault versions, original ldts and legacy record source as <code>legacy/…</code></td><td className="px-3 py-2">Source columns already collapsed by the old vault</td></tr>
              <tr className="border-t"><th className="px-3 py-2">Legacy marts</th><td className="px-3 py-2">Some report-facing values</td><td className="px-3 py-2">Lineage, discarded payload, duplicate deliveries and reliable history</td></tr>
            </tbody>
          </table>
        </div>
        <P>Archived deliveries replay through <Link to="/replay" className="text-sky-700 underline underline-offset-2 dark:text-sky-400">persistent staging</Link> first. A legacy-vault copy is an extra source with <code>rsrc = 'legacy/…'</code> and the original load dates retained.</P>
      </Section>

      <Section title="Old → new key map and reconciliation">
        <P>The sample legacy vault is derived from batches 1–2 of the guide’s own engine. The seed joins each satellite to its hub, recomputes the default hk/hashdiff, and drops <code>LoadEndDate</code>; <code>sat_v1</code> rebuilds the end dates when needed.</P>
        <DataTable title="Legacy hash → business key → new hash" tone="hub" rows={seeded.keyMap.map((row) => ({ legacy_hash: row.legacyHashKey, c_custkey: row.customerNumber, new_hash: row.newHashKey }))} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(seeded.reconciliation).map(([label, value]) => <div key={label} className="rounded-lg border bg-card/50 p-3"><div className="text-xs text-muted-foreground">{RECONCILIATION_LABEL[label] ?? label}</div><div className="mt-1 font-mono text-lg">{value}</div></div>)}
        </div>
        <Callout kind="tip" title="What the counts say">
          The hub and satellite counts are equal, and both payload and hashdiff mismatch counts are zero. The key map is one-to-one on this sample, so no legacy hashkey is silently assigned to two business keys.
        </Callout>
        <p className="mt-4 text-sm">Legacy rows shown: {LEGACY_CUSTOMER_HUB.length} hub and {LEGACY_CUSTOMER_SAT.length} satellite versions.</p>
      </Section>
    </Chapter>
  )
}
