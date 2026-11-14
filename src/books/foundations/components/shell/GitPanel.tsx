import { AnimatePresence, motion } from 'motion/react'
import { ArrowDown, ArrowRight } from 'lucide-react'
import { FS, type ShellState } from '@/books/foundations/lib/shell/shell'
import { EMPTY_GIT, view } from '@/books/foundations/lib/shell/git'

const SHOWN = 5

/** Folders with several new files show as one line, `data/ (3 files)`, like git status does. */
function group(paths: string[]) {
  const out = new Map<string, number>()
  for (const p of paths) {
    const [top, ...rest] = p.split('/')
    const key = rest.length ? `${top}/` : p
    out.set(key, (out.get(key) ?? 0) + 1)
  }
  return [...out].map(([name, n]) => (name.endsWith('/') && n > 1 ? `${name} (${n} files)` : name))
}

function Box({ title, hint, items, empty }: { title: string; hint: string; items: { key: string; label: string; tag?: string }[]; empty: string }) {
  return (
    <section aria-label={title} className="min-w-0 rounded-xl border bg-card/60 p-3">
      <h3 className="font-sans text-sm font-semibold">{title}</h3>
      <p className="mb-2 font-sans text-xs text-muted-foreground">{hint}</p>
      {items.length === 0 ? (
        <p className="font-sans text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-1">
          <AnimatePresence initial={false}>
            {items.slice(0, SHOWN).map((item) => (
              <motion.li
                key={item.key}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex min-w-0 items-start gap-1.5 font-mono text-[13px]"
              >
                <span className="min-w-0 [overflow-wrap:anywhere]">{item.label}</span>
                {item.tag && <span className="shrink-0 rounded bg-muted px-1 font-sans text-[11px] text-muted-foreground">{item.tag}</span>}
              </motion.li>
            ))}
          </AnimatePresence>
          {items.length > SHOWN && <li className="font-sans text-xs text-muted-foreground">and {items.length - SHOWN} more</li>}
        </ul>
      )}
    </section>
  )
}

function Step({ command }: { command: string }) {
  return (
    <div className="flex items-center justify-center gap-1 font-mono text-xs text-muted-foreground" aria-hidden>
      <ArrowDown className="size-3.5 sm:hidden" />
      <span>{command}</span>
      <ArrowRight className="hidden size-3.5 sm:block" />
    </div>
  )
}

/** The three places a change can be: in your folder, staged for the next snapshot, or in the history. Updates as you type. */
export function GitPanel({ state }: { state: ShellState }) {
  const v = view(state.fs ?? FS, state.git ?? EMPTY_GIT)
  const changed = [
    ...v.unstaged.map((f) => ({ key: `m:${f}`, label: f, tag: 'changed' })),
    ...group(v.untracked).map((f) => ({ key: `u:${f}`, label: f, tag: 'new' })),
  ]
  const staged = v.staged.map((f) => ({ key: f, label: f }))
  const history = [...v.commits].reverse().map((c, i) => ({
    key: c.id,
    label: `${c.id.slice(0, 7)} ${c.message}`,
    tag: i === 0 ? 'latest' : undefined,
  }))
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-stretch" data-git-panel>
      <Box title="Your folder" hint="Changed since the last snapshot" items={changed} empty="Nothing changed." />
      <Step command="git add" />
      <Box title="Staged" hint="Goes into the next snapshot" items={staged} empty="Nothing staged." />
      <Step command="git commit" />
      <Box title="History" hint="Snapshots, newest first" items={history} empty="No snapshots yet." />
    </div>
  )
}
