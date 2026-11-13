import { useCallback, useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { Check, Circle } from 'lucide-react'
import { type ShellState } from '@/books/foundations/lib/shell/shell'
import { display } from '@/books/foundations/lib/shell/fs'
import { FolderTree, relativePath } from './FolderTree'
import { Terminal } from './Terminal'
import { usePractice } from './usePractice'

export type Task = { label: ReactNode; done: (state: ShellState) => boolean }

/** A task list, a practice terminal and, optionally, the folder tree that reacts to what you type. */
export function Practice({
  id,
  cwd,
  tasks,
  chips,
  tree,
  walker,
}: {
  id: string
  cwd: string
  tasks: Task[]
  chips?: string[]
  tree?: boolean
  walker?: boolean
}) {
  const { state, exec, reset } = usePractice(id, cwd)
  const [selected, setSelected] = useState<string>()
  const [draft, setDraft] = useState<string>()
  const clearDraft = useCallback(() => setDraft(undefined), [])
  const last = state.entries.at(-1)
  const done = tasks.map((t) => t.done(state))
  const all = done.every(Boolean)

  return (
    <div className="my-6 max-w-5xl" data-practice={id}>
      <ul className="mb-3 space-y-1" aria-label="Tasks">
        {tasks.map((t, i) => (
          <li key={i} className="flex items-start gap-2 font-sans text-sm">
            {done[i] ? (
              <motion.span initial={{ scale: 0.6 }} animate={{ scale: 1 }} className="mt-0.5 text-emerald-600 dark:text-emerald-400">
                <Check size={16} aria-hidden />
              </motion.span>
            ) : (
              <Circle size={16} aria-hidden className="mt-0.5 text-muted-foreground" />
            )}
            <span>
              <span className="sr-only">{done[i] ? 'Done: ' : 'To do: '}</span>
              {t.label}
            </span>
          </li>
        ))}
      </ul>
      <div className={tree ? 'grid gap-4 lg:grid-cols-[minmax(0,1fr)_23rem]' : undefined}>
        <div className="min-w-0">
          <Terminal state={state} exec={exec} reset={reset} chips={chips} draft={draft} onDraftUsed={clearDraft} label={`practice-${id}`} />
          {all && (
            <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} role="status" className="mt-2 font-sans text-sm text-emerald-700 dark:text-emerald-400">
              Done. Keep exploring, or go to the next page.
            </motion.p>
          )}
        </div>
        {tree && (
          <div className="min-w-0">
            <FolderTree cwd={state.cwd} event={last?.event} selected={walker ? selected : undefined} onSelect={walker ? setSelected : undefined} />
            {walker && (
              <div className="mt-2 rounded-xl border bg-card/60 p-3 font-sans text-sm" aria-live="polite">
                {selected ? (
                  <>
                    <div className="mb-1 text-muted-foreground">From {display(state.cwd)} to {display(selected)}:</div>
                    {[
                      ['relative', `cd ${relativePath(state.cwd, selected)}`],
                      ['absolute', `cd ${selected}`],
                    ].map(([kind, cmd]) => (
                      <div key={kind} className="flex items-center justify-between gap-2">
                        <span>
                          <span className="text-muted-foreground">{kind}: </span>
                          <code className="font-mono text-[13px]">{cmd}</code>
                        </span>
                        <button type="button" onClick={() => setDraft(cmd)} className="rounded border px-1.5 text-xs hover:bg-muted focus-visible:outline-2 focus-visible:outline-sky-500">
                          Type it
                        </button>
                      </div>
                    ))}
                  </>
                ) : (
                  <span className="text-muted-foreground">Pick a folder in the tree to see the cd command that gets you there.</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
