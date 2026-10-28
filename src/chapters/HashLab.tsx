import { Chapter } from '@/components/Chapter'
import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Plus, X } from 'lucide-react'
import { ChapterHeader, Section, P, Callout, Code } from '@/components/Prose'
import { HashdiffDrawing } from '@/components/drawing/HashdiffDrawing'
import { Button } from '@/components/ui/button'
import { dvHash, type HashAlg, type HashKind } from '@/lib/dv/hash'
import { cn } from '@/lib/utils'
import { usePersistentState } from '@/lib/progress'

function Toggle<T extends string>({ value, options, onChange }: { value: T; options: T[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-lg border p-0.5">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} className={cn('relative rounded-md px-3 py-1 font-mono text-xs', value === o ? 'text-background' : 'text-muted-foreground')}>
          {value === o && <motion.span layoutId={`tog-${options.join()}`} className="absolute inset-0 rounded-md bg-foreground" />}
          <span className="relative">{o}</span>
        </button>
      ))}
    </div>
  )
}

interface Input {
  id: number
  col: string
  value: string
  isNull: boolean
}

function Lab() {
  const [alg, setAlg] = usePersistentState<HashAlg>('hash.alg', 'MD5')
  const [kind, setKind] = usePersistentState<HashKind>('hash.kind', 'hashkey')
  const [inputs, setInputs] = usePersistentState<Input[]>('hash.inputs', [
    { id: 1, col: 'c_custkey', value: ' 42 ', isNull: false },
    { id: 2, col: 'c_nationkey', value: 'de', isNull: false },
  ])
  const res = useMemo(() => dvHash(inputs.map((i) => (i.isNull ? null : i.value)), { alg, kind }), [inputs, alg, kind])
  const set = (id: number, patch: Partial<Input>) => setInputs((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)))

  return (
    <div className="grid gap-6 border-t pt-6 lg:grid-cols-[20rem_1fr]">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Toggle value={kind} options={['hashkey', 'hashdiff']} onChange={setKind} />
          <Toggle value={alg} options={['MD5', 'SHA256']} onChange={setAlg} />
        </div>
        <div className="space-y-2">
          {inputs.map((i) => (
            <motion.div key={i.id} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
              <span className="w-24 shrink-0 truncate font-mono text-xs text-muted-foreground">{i.col}</span>
              <input
                aria-label={`${i.col} value`}
                value={i.isNull ? '' : i.value}
                disabled={i.isNull}
                placeholder={i.isNull ? 'NULL' : ''}
                onChange={(e) => set(i.id, { value: e.target.value })}
                className="min-w-0 flex-1 rounded-md border bg-background px-2 py-1 font-mono text-sm outline-none focus:ring-2 focus:ring-sky-500/50 disabled:opacity-50"
              />
              <button
                aria-pressed={i.isNull}
                onClick={() => set(i.id, { isNull: !i.isNull })}
                className={cn('rounded border px-1.5 py-0.5 font-mono text-[10px]', i.isNull ? 'border-amber-500/60 text-amber-700 dark:text-amber-400' : 'text-muted-foreground')}
              >
                NULL
              </button>
              {inputs.length > 1 && (
                <button aria-label="Remove" onClick={() => setInputs((xs) => xs.filter((x) => x.id !== i.id))} className="text-muted-foreground hover:text-foreground">
                  <X className="size-3.5" />
                </button>
              )}
            </motion.div>
          ))}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setInputs((xs) => [...xs, { id: Date.now(), col: `col_${xs.length + 1}`, value: '', isNull: false }])}
          >
            <Plus /> Add column
          </Button>
        </div>
        <div className="space-y-1 text-xs text-muted-foreground">
          <div>Try:</div>
          {[
            ['Spaces don\u2019t matter', [' 42 ', 'de']],
            ['Case: same hashkey, new hashdiff', ['42', 'DE']],
            ['All NULL → zero key', null],
          ].map(([label, vals]) => (
            <button
              key={label as string}
              className="block text-sky-700 dark:text-sky-400 underline underline-offset-4"
              onClick={() =>
                setInputs((xs) => xs.map((x, j) => (vals ? { ...x, value: (vals as string[])[j] ?? x.value, isNull: false } : { ...x, isNull: true })))
              }
            >
              {label as string}
            </button>
          ))}
        </div>
      </div>
      <ol className="relative space-y-2">
        <AnimatePresence initial={false}>
          {res.steps.map((s, i) => (
            <motion.li
              key={s.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn('rounded-xl border bg-card/70 px-4 py-2.5', s.id === 'hash' && 'border-sky-500/60 bg-sky-500/10')}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium">
                  <span className="mr-2 font-mono text-xs text-muted-foreground">{i + 1}</span>
                  {s.label}
                </span>
                <span className="text-[11px] text-foreground/70">{s.detail}</span>
              </div>
              <motion.div key={s.value} initial={{ opacity: 0.3 }} animate={{ opacity: 1 }} className={cn('mt-1 break-all font-mono text-[13px]', s.id === 'hash' ? 'text-sky-700 dark:text-sky-400' : 'text-foreground/90')}>
                {s.value === '' ? <span className="text-muted-foreground">(empty)</span> : s.value.replace(/ /g, '·')}
              </motion.div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
    </div>
  )
}

const BASE = { c_name: 'Alice Martin', c_address: '12 Rue Lafayette', c_mktsegment: 'BUILDING', c_acctbal: '1200.5', c_comment: 'prefers email' }
type Payload = typeof BASE

function DiffFlip() {
  const [p, setP] = useState<Payload>({ ...BASE, c_address: '12 Rue Lafayette  ' })
  const before = dvHash(Object.values(BASE), { kind: 'hashdiff' }).hash
  const after = dvHash(Object.values(p), { kind: 'hashdiff' }).hash
  const changed = before !== after
  return (
    <div className="grid gap-6 border-t pt-6 lg:grid-cols-2">
      <div className="space-y-2">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Today's delivery for customer 1</div>
        {(Object.keys(BASE) as (keyof Payload)[]).map((k) => (
          <label key={k} className="flex items-center gap-2">
            <span className="w-28 shrink-0 font-mono text-xs text-muted-foreground">{k}</span>
            <input
              value={p[k]}
              onChange={(e) => setP({ ...p, [k]: e.target.value })}
              className={cn(
                'min-w-0 flex-1 rounded-md border bg-background px-2 py-1 font-mono text-sm outline-none focus:ring-2 focus:ring-sky-500/50',
                p[k] !== BASE[k] && 'border-amber-500/60',
              )}
            />
          </label>
        ))}
        <button className="text-xs text-sky-700 dark:text-sky-400 underline underline-offset-4" onClick={() => setP(BASE)}>
          reset
        </button>
      </div>
      <div className="flex flex-col justify-center gap-3 font-mono text-sm">
        <div className="rounded-xl border px-4 py-3">
          <div className="text-xs text-muted-foreground">latest hd_customer_n_s in the satellite</div>
          <div className="break-all text-amber-700 dark:text-amber-400">{before}</div>
        </div>
        <div className={cn('rounded-xl border px-4 py-3 transition-colors', changed && 'border-emerald-500/60')}>
          <div className="text-xs text-muted-foreground">hashdiff of today's stage row</div>
          <motion.div key={after} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className={cn('break-all', changed ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400')}>
            {after}
          </motion.div>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={String(changed)}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={cn('rounded-xl px-4 py-3 font-sans text-sm', changed ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300' : 'bg-muted text-foreground/80')}
          >
            {changed ? 'Hashdiff differs → sat_v0 inserts a new version' : 'Hashdiff identical → nothing to insert'}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default function HashLab() {
  return (
    <Chapter>
      <ChapterHeader
        title="Hash lab"
        lead="Hashkeys give every business key a fixed-width surrogate that any loader can compute independently. Hashdiffs fingerprint a whole payload so change detection is one comparison."
      />
      <Section
        title="Build a hash, step by step"
        lead="Change the input values to see the guide’s hash standard applied one step at a time."
        keyPoint="Hashkeys use trimmed, quoted, upper-cased inputs joined by ||, with ^^ for NULL, before MD5."
      >
        <P>
          This is the same standardisation datavault4dbt applies with its default settings: cast to string, trim, replace NULL with <Code>^^</Code>, quote, join with{' '}
          <Code>||</Code>, upper-case for hashkeys only, then MD5. Edit the inputs and watch each step update.
        </P>
        <Lab />
      </Section>
      <Section
        title="Hashdiff: did anything change?"
        lead="Compare payload fingerprints to see when a satellite needs a new version."
        keyPoint="A satellite inserts when the new hashdiff differs from the latest version for that parent key."
      >
        <P>
          The satellite stores the hashdiff of the payload it last saw for each key. A new delivery is hashed the same way. Different hash, new row; same hash, skip. The
          trailing spaces below don't count because values are trimmed first. Change one letter's case and see what happens.
        </P>
        <HashdiffDrawing />
        <DiffFlip />
      </Section>
      <Section
        title="Ghost keys and why we hash"
        lead="See how deterministic hashes and reserved ghost records keep unknown and error joins intact."
        keyPoint="Ghost rows preserve unknown and error references so downstream joins do not lose records."
      >
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Callout kind="info" title="Why hash at all?">
            Every loader computes keys from the business key alone, with no lookups against a sequence table. Hubs, links and satellites can therefore load in parallel, and
            composite keys of any width become one fixed-width column.
          </Callout>
          <Callout kind="warn" title="Ghost keys">
            All-NULL input maps to <Code>0000…</Code> (the unknown record) and the error record is <Code>ffff…</Code>. Both are inserted as ghost records so joins never
            lose rows.
          </Callout>
        </div>
      </Section>
    </Chapter>
  )
}
