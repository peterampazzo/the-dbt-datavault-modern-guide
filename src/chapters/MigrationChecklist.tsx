import { Link } from 'react-router'
import { Chapter } from '@/components/Chapter'
import { ChapterHeader, P, Section } from '@/components/Prose'
import { Term } from '@/components/Term'
import { MIGRATION_ITEMS, resetMigrationChecklist, setMigrationItem, useMigrationChecklist } from '@/lib/migration'
import { MigrationPathDrawing } from '@/components/drawing/MigrationPathDrawing'

function ChecklistItems({ start, end, checked }: { start: number; end: number; checked: boolean[] }) {
  return (
    <ul className="space-y-3" data-testid="migration-items">
      {MIGRATION_ITEMS.slice(start, end).map((item, offset) => {
        const index = start + offset
        return (
          <li key={item.text} className="rounded-xl border bg-card/50 p-3">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                aria-label={item.text}
                checked={checked[index]}
                onChange={(event) => setMigrationItem(index, event.target.checked)}
                className="mt-1 size-4 accent-sky-600"
              />
              <span className="min-w-0 text-sm leading-6">
                <span className="block font-medium">{item.text}</span>
                <span className="block text-muted-foreground">Done when: {item.done} <Link className="text-sky-700 underline dark:text-sky-400" to={item.href}>Learn it →</Link></span>
              </span>
            </label>
          </li>
        )
      })}
    </ul>
  )
}

export default function MigrationChecklist() {
  const checked = useMigrationChecklist()
  const done = checked.filter(Boolean).length
  return (
    <Chapter>
      <ChapterHeader
        title="Migration checklist"
        lead={<>Eight gates move a legacy load toward a rebuildable project. They retain source evidence in <Term id="persistent-staging">persistent staging</Term>, preserve <Term id="raw-vault">raw-vault</Term> history, and validate <Term id="hash-parity">hash parity</Term> before the <Term id="business-vault">business vault</Term> is reconciled for cutover.</>}
      />
      <Section title="Keep the evidence and prove the rules" lead="The first four gates establish evidence for the new models." keyPoint={<>Retained deliveries, explicit hashes and <Term id="unit-test">unit tests</Term> make migration decisions testable.</>}>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <strong data-testid="migration-count">{done} of {MIGRATION_ITEMS.length} done</strong>
          <button type="button" onClick={resetMigrationChecklist} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted/50" data-testid="migration-reset">Reset</button>
        </div>
        <P>Tick a gate when its evidence is available. The state is saved in this browser, so an interrupted review can continue later.</P>
        <ChecklistItems start={0} end={4} checked={checked} />
      </Section>
      <Section title="Replay, reconcile, then cut over" lead="The last four gates cover a comparison window and a rollback plan." keyPoint="Cut over only after the parallel result reconciles and the rebuild path is known.">
        <MigrationPathDrawing />
        <ChecklistItems start={4} end={MIGRATION_ITEMS.length} checked={checked} />
      </Section>
    </Chapter>
  )
}
