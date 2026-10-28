import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { Chapter } from '@/components/Chapter'
import { ChapterHeader, Code, P, Section } from '@/components/Prose'
import { PersistentStagingDrawing } from '@/components/drawing/PersistentStagingDrawing'
import { VacuumDrawing } from '@/components/drawing/VacuumDrawing'
import { Term } from '@/components/Term'
import { CodeBlock } from '@/components/CodeBlock'
import { SNIPPETS } from '@/lib/dv/models'
import { REPLAY_TABLES, replay, short, type ReplayChange, type ReplayRowDiff, type ReplayCellStatus } from '@/lib/dv/engine'

const changes: Record<ReplayChange, string> = {
  none: 'No change',
  'new-column': 'Map a new column c_email',
  'cast-fix': 'Fix the c_acctbal cast',
}

function changeFromSearch(search: string): ReplayChange | undefined {
  const value = new URLSearchParams(search).get('change')
  return value === 'new-column' || value === 'cast-fix' || value === 'none' ? value : undefined
}

function CellValue({
  row,
  column,
  status,
  side,
}: {
  row: ReplayRowDiff
  column: string
  status: ReplayCellStatus
  side: 'truth' | 'rebuilt'
}) {
  const value = row[side]?.[column]
  const tone = {
    match: 'bg-emerald-50 dark:bg-emerald-950/40',
    wrong: 'bg-amber-100 dark:bg-amber-950/60',
    missing: 'bg-rose-100 dark:bg-rose-950/60',
    extra: 'bg-sky-50 dark:bg-sky-950/40',
  }[status]
  const label = {
    match: '',
    wrong: 'Wrong',
    missing: side === 'truth' ? 'Expected' : 'Missing',
    extra: 'Extra',
  }[status]
  const displayed =
    value === undefined
      ? '—'
      : column === 'hd_customer_n_s' && typeof value === 'string'
        ? String(short(value))
        : String(value)
  return (
    <td className={`min-w-28 border px-2 py-2 align-top ${tone}`}>
      <span className="block font-mono text-xs">{displayed}</span>
      {label && <span className="mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase">{label}</span>}
    </td>
  )
}

function ReplayLab({ initialChange }: { initialChange: ReplayChange }) {
  const [landing, setLanding] = useState<'truncate' | 'persistent'>('truncate')
  const [change, setChange] = useState<ReplayChange>(initialChange)
  const [fullRefresh, setFullRefresh] = useState(false)

  const result = useMemo(() => replay({ landing, change, fullRefresh }), [landing, change, fullRefresh])
  const customerRows = result.diff.customer_n_s.rows
  const totalMissing = REPLAY_TABLES.reduce((sum, table) => sum + result.diff[table].missingRows, 0)
  const totalWrong = REPLAY_TABLES.reduce((sum, table) => sum + result.diff[table].wrongCells, 0)
  const totalMissingCells = REPLAY_TABLES.reduce((sum, table) => sum + result.diff[table].missingCells, 0)
  const verdict =
    totalMissing + totalWrong + totalMissingCells === 0
      ? landing === 'persistent'
        ? 'Persistent staging: the rebuild matches. Nothing lost.'
        : 'Truncated landing: the current model rebuild matches the stored history.'
      : [
          landing === 'persistent' ? 'Persistent staging' : 'Truncated landing',
          result.diff.customer_n_s.missingRows
            ? `${result.diff.customer_n_s.missingRows} customer satellite version${result.diff.customer_n_s.missingRows === 1 ? '' : 's'} missing`
            : '',
          totalWrong ? `${totalWrong} wrong cell${totalWrong === 1 ? '' : 's'}` : '',
          totalMissingCells ? `${totalMissingCells} missing cell${totalMissingCells === 1 ? '' : 's'}` : '',
          totalMissing > result.diff.customer_n_s.missingRows
            ? `${totalMissing - result.diff.customer_n_s.missingRows} other row${totalMissing - result.diff.customer_n_s.missingRows === 1 ? '' : 's'} missing`
            : '',
        ]
          .filter(Boolean)
          .join(': ')
  const verdictText = totalMissing + totalWrong + totalMissingCells === 0 ? verdict : `${verdict}.`

  function reset() {
    setLanding('truncate')
    setChange('none')
    setFullRefresh(false)
  }

  return (
    <div className="space-y-5">
      <fieldset className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2">
        <legend className="sr-only">Replay lab controls</legend>
        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor="landing-toggle">Landing data</label>
          <button
            id="landing-toggle"
            type="button"
            role="switch"
            aria-label="Landing data"
            aria-checked={landing === 'persistent'}
            onClick={() => setLanding((current) => (current === 'persistent' ? 'truncate' : 'persistent'))}
            className="rounded-md border px-3 py-2 text-sm aria-checked:bg-primary aria-checked:text-primary-foreground"
          >
            {landing === 'persistent' ? 'Persistent staging' : 'Truncate after load'}
          </button>
          <p className="mt-1 text-xs text-foreground/80">Toggle between truncated landing and persistent staging.</p>
        </div>
        <label className="block text-sm font-medium" htmlFor="replay-change">
          Model change
          <select
            id="replay-change"
            value={change}
            onChange={(event) => setChange(event.target.value as ReplayChange)}
            className="mt-2 block w-full rounded-md border bg-background px-3 py-2"
          >
            {Object.entries(changes).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => setFullRefresh(true)}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground sm:col-span-1"
        >
          Run <code className="font-mono">dbt build --full-refresh</code>
        </button>
        <button type="button" onClick={reset} className="rounded-md border px-3 py-2 text-sm font-medium">
          Reset
        </button>
      </fieldset>

      <output aria-live="polite" className="block rounded-xl border border-sky-600 bg-sky-50 px-4 py-3 font-medium dark:bg-sky-950/40">
        {verdictText}
      </output>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Rows by table: truth vs rebuilt</h3>
        <section aria-label="Replay row counts" tabIndex={0} className="max-w-full overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[40rem] text-left text-xs">
            <thead className="bg-muted/60">
              <tr>
                <th scope="col" className="px-2 py-2">Table</th>
                <th scope="col" className="px-2 py-2">Truth rows</th>
                <th scope="col" className="px-2 py-2">Rebuilt rows</th>
                <th scope="col" className="px-2 py-2">Missing rows</th>
                <th scope="col" className="px-2 py-2">Wrong cells</th>
                <th scope="col" className="px-2 py-2">Missing cells</th>
              </tr>
            </thead>
            <tbody>
              {REPLAY_TABLES.map((table) => {
                const d = result.diff[table]
                return (
                  <tr key={table} className="border-t">
                    <th scope="row" className="px-2 py-1.5 font-mono font-medium">{table}</th>
                    <td className="px-2 py-1.5">{d.rowsTruth}</td>
                    <td className="px-2 py-1.5">{d.rowsRebuilt}</td>
                    <td className="px-2 py-1.5">{d.missingRows}</td>
                    <td className="px-2 py-1.5">{d.wrongCells}</td>
                    <td className="px-2 py-1.5">{d.missingCells}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">customer_n_s: truth beside rebuilt</h3>
        <section aria-label="customer_n_s truth and rebuilt cells" tabIndex={0} className="max-h-[24rem] max-w-full overflow-auto rounded-lg border">
          <table className="w-full min-w-[48rem] text-left text-xs">
            <thead className="sticky top-0 z-10 bg-muted">
              <tr>
                <th scope="col" className="px-2 py-2">Key · load date</th>
                <th scope="col" className="px-2 py-2">Truth balance</th>
                <th scope="col" className="px-2 py-2">Rebuilt balance</th>
                <th scope="col" className="px-2 py-2">Truth hashdiff</th>
                <th scope="col" className="px-2 py-2">Rebuilt hashdiff</th>
                <th scope="col" className="px-2 py-2">Truth email</th>
                <th scope="col" className="px-2 py-2">Rebuilt email</th>
                <th scope="col" className="px-2 py-2">Row status</th>
              </tr>
            </thead>
            <tbody>
              {customerRows.map((row) => {
                const identity = row.truth ?? row.rebuilt
                const key = identity?.c_custkey === undefined ? row.key : String(identity.c_custkey)
                const ldts = identity?.ldts === undefined ? '' : String(identity.ldts)
                const acctStatus = row.cells.c_acctbal ?? 'match'
                const emailStatus = row.cells.c_email ?? 'match'
                const hashStatus = row.cells.hd_customer_n_s ?? 'match'
                return (
                  <tr key={row.key} className="border-t">
                    <th scope="row" className="px-2 py-2 font-mono font-normal">{key} · {ldts}</th>
                    <td className={`border px-2 py-2 ${acctStatus === 'wrong' ? 'bg-amber-100 dark:bg-amber-950/60' : ''}`}>
                      {row.truth?.c_acctbal === undefined ? '—' : String(row.truth.c_acctbal)}
                      {acctStatus === 'wrong' && <span className="ml-1 font-semibold">Wrong</span>}
                    </td>
                    <CellValue row={row} column="c_acctbal" status={acctStatus} side="rebuilt" />
                    <CellValue row={row} column="hd_customer_n_s" status={hashStatus} side="truth" />
                    <CellValue row={row} column="hd_customer_n_s" status={hashStatus} side="rebuilt" />
                    <td className={`border px-2 py-2 ${emailStatus === 'missing' ? 'bg-rose-100 dark:bg-rose-950/60' : ''}`}>
                      {row.truth?.c_email === undefined ? '—' : String(row.truth.c_email)}
                      {emailStatus === 'missing' && <span className="ml-1 font-semibold">Missing in rebuilt</span>}
                    </td>
                    <CellValue row={row} column="c_email" status={emailStatus} side="rebuilt" />
                    <td
                      className={`px-2 py-2 font-semibold ${
                        row.status === 'missing'
                          ? 'bg-rose-100 dark:bg-rose-950/60'
                          : row.status === 'extra'
                            ? 'bg-sky-50 dark:bg-sky-950/40'
                            : ''
                      }`}
                    >
                      {row.status === 'missing' ? 'Missing row' : row.status === 'extra' ? 'Extra row' : 'Present'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
        <p className="mt-2 text-xs text-foreground/80">
          Cell labels say Wrong, Missing or Extra; colour is a second cue. A dash means that side has no value.
        </p>
      </div>
    </div>
  )
}

const losses = [
  ['Columns never mapped', 'Bruno’s changed email is absent from old rows when c_email was never mapped.', 'new-column'],
  ['Original source bytes', 'Alice’s 1200.5 becomes 1200 in an integer cast; trimming or NULL rules can also discard bytes.', 'cast-fix'],
  ['Rows filtered in staging', 'A customer excluded by a segment filter cannot be restored after the landing file is removed.', undefined],
  ['Repeated deliveries', 'sat_v0 keeps payload changes, not unchanged observations; rec_track_sat records each key/load/source sighting.', undefined],
  ['Undetected deletes', 'If Daniel disappears from a full extract and no delete rule runs, the vault cannot say when he left.', undefined],
  ['End dates written in place', 'Overwriting a prior version’s end date removes what the earlier row looked like before the update.', undefined],
  ['Hash or key bugs', 'A wrong customer-key mapping can combine two people; changing the hash does not recover the original rows.', undefined],
  ['A changed model split', 'Moving address and name into separate satellites needs their old source values to rebuild both histories.', undefined],
] as const

function Replay() {
  const location = useLocation()
  const initialChange = changeFromSearch(location.search) ?? 'none'

  return (
    <Chapter>
      <ChapterHeader title="Replay: one history, two shapes" lead={<>Keep source deliveries in <Term id="persistent-staging">persistent staging</Term> so a changed model can rebuild the raw vault.</>} />
      <Section
        title="The replay lab"
        lead="Choose what was kept, change the customer model, then run a full refresh to compare the rebuilt tables with truth."
        keyPoint="A full refresh can only rebuild what the landing layer still contains."
      >
        <ReplayLab key={`${location.pathname}${location.search}`} initialChange={initialChange} />
      </Section>
      <Section
        title="What truncated landing loses"
        lead="Each row names information that is gone when the source deliveries are no longer available."
        keyPoint="A model can only reproduce evidence that was kept or faithfully recorded."
      >
        <section aria-label="Truncation loss examples" tabIndex={0} className="max-w-full overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[42rem] text-left text-sm">
            <thead className="bg-muted/60">
              <tr>
                <th scope="col" className="px-3 py-2.5">Loss</th>
                <th scope="col" className="px-3 py-2.5">Customer / nation example</th>
              </tr>
            </thead>
            <tbody>
              {losses.map(([loss, example, preset]) => (
                <tr key={loss} className="border-t align-top">
                  <th scope="row" className="px-3 py-2.5 font-medium">{loss}</th>
                  <td className="px-3 py-2.5">
                    {example}
                    {preset && (
                      <span className="ml-2">
                        <Link className="text-sky-700 underline dark:text-sky-400" to={`/replay/the-replay-lab?change=${preset}`}>
                          Try {preset === 'new-column' ? 'new-column' : 'cast-fix'} preset
                        </Link>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </Section>
      <Section
        title="Two histories, one record"
        lead="Separate the preserved evidence from the organised tables built from it."
        keyPoint="Two copies are useful; two competing sources of truth are not."
      >
        <P><strong>Two copies are fine, two sources of truth are not.</strong> Persistent staging is append-only evidence: what each source sent and when. Never change it to match a later model. The raw vault is a derived, organised view by business key that can be rebuilt from that evidence.</P>
        <PersistentStagingDrawing />
        <section aria-label="Bank statements and ledger comparison" tabIndex={0} className="max-w-full overflow-x-auto rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/60">
              <tr><th scope="col" className="px-3 py-2.5">Bank statements</th><th scope="col" className="px-3 py-2.5">Ledger</th></tr>
            </thead>
            <tbody>
              <tr className="border-t align-top">
                <td className="px-3 py-2.5">Keep every statement as received, with its date and source.</td>
                <td className="px-3 py-2.5">Organise the entries by account and business key for consistent queries.</td>
              </tr>
              <tr className="border-t align-top">
                <td className="px-3 py-2.5">Like persistent staging: evidence of what arrived.</td>
                <td className="px-3 py-2.5">Like the raw vault: a derived view that can be rebuilt from evidence.</td>
              </tr>
            </tbody>
          </table>
        </section>
        <P>If landing is truncated after loading, there is only one history left to rebuild from, and that history is lossy.</P>
      </Section>
      <Section
        title="Prove it"
        lead="Schedule a rebuild in a development target, then compare its row counts and table fingerprints with production."
        keyPoint="Matching counts and hashes is evidence that the two shapes contain the same rows."
      >
        <P>Keep production untouched. Build from persistent staging with <Code>dbt build --full-refresh --target dev</Code>, then compare each raw-vault table’s row count and hash-of-hashes with the corresponding production table. A match means one history in two shapes; a mismatch points to missing data, different rules or an unreproducible build.</P>
        <CodeBlock title="Ad-hoc Spark SQL analysis · repeat per table" code={SNIPPETS.vault_fingerprint.code} />
      </Section>
      <Section
        title="Until you’re replay-safe"
        lead="Prevent a broad refresh from dropping raw-vault tables until replay and recovery are tested."
        keyPoint="A refresh guard is one control, not a replacement for durable source evidence and backups."
      >
        <P>Set a per-folder dbt guard; it overrides the command-line flag for these models. Check that your adapter honours it.</P>
        <CodeBlock title="dbt_project.yml" lang="yaml" code={SNIPPETS.dbt_project_raw_vault.code} />
        <ul className="ml-5 list-disc space-y-2 text-sm leading-6">
          <li>Back up production tables, and restrict who can run dbt against production.</li>
          <li>Delta time travel can undo an accident only until <Code>VACUUM</Code>; it is not persistent staging.</li>
          <li>Plan how persistent staging can delete personal data, for example by partitioning it by subject or delivery.</li>
        </ul>
        <VacuumDrawing />
        <p className="mt-4 text-sm leading-6">
          Read the official <a className="text-sky-700 underline dark:text-sky-400" href="https://docs.getdbt.com/reference/resource-configs/full_refresh" target="_blank" rel="noreferrer">dbt full-refresh config</a>, <a className="text-sky-700 underline dark:text-sky-400" href="https://docs.delta.io/delta-batch.html#query-an-older-snapshot-of-a-table-time-travel" target="_blank" rel="noreferrer">Delta time travel</a> and <a className="text-sky-700 underline dark:text-sky-400" href="https://docs.delta.io/delta-utility/#vacuum" target="_blank" rel="noreferrer">VACUUM</a> documentation.
        </p>
      </Section>
    </Chapter>
  )
}

export default Replay
