import { useState } from 'react'
import { usePersistentState } from '@/lib/progress'
import { cn } from '@/lib/utils'

type Tool = 'rstudio' | 'vscode' | 'desktop' | 'ai'
type Line = { kind: 'command' | 'output'; text: string }

const MESSAGE = 'Add a title to the report'
const INITIAL_STATE: { tool: Tool; message: string; committed: boolean; pushed: boolean; lines: Line[] } = {
  tool: 'rstudio',
  message: MESSAGE,
  committed: false,
  pushed: false,
  lines: [],
}
const TOOLS: { id: Tool; label: string }[] = [
  { id: 'rstudio', label: 'RStudio' },
  { id: 'vscode', label: 'VS Code' },
  { id: 'desktop', label: 'GitHub Desktop' },
  { id: 'ai', label: 'AI tool' },
]

const buttonClass =
  'inline-flex min-h-11 items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition-colors motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-sky-500'
const primaryButtonClass = `${buttonClass} border-sky-700 bg-sky-700 text-white hover:bg-sky-800`
const secondaryButtonClass = `${buttonClass} border-border bg-background text-foreground hover:bg-muted`

function CommitDot({ message, id, fresh = false }: { message: string; id: string; fresh?: boolean }) {
  return (
    <li className="flex min-w-0 items-start gap-2 text-sm">
      <span aria-hidden className={cn('mt-1 size-3 shrink-0 rounded-full bg-foreground', fresh && 'bg-violet-600 dark:bg-violet-400')} />
      <span className="min-w-0 break-words">
        {message} <code className="ml-1 text-xs text-muted-foreground">{id}</code>
      </span>
    </li>
  )
}

export function Layers() {
  const [state, setState] = usePersistentState<{ tool: Tool; message: string; committed: boolean; pushed: boolean; lines: Line[] }>('layers', INITIAL_STATE)
  const [highlight, setHighlight] = useState<'commit' | 'push' | null>(null)
  const { tool, message, committed, pushed, lines } = state
  const file = tool === 'rstudio' ? 'report.R' : 'report.py'
  const cardClass = 'min-w-0 rounded-xl border bg-card p-4 text-card-foreground transition duration-300 motion-reduce:transition-none'
  const changedCardClass = cn(cardClass, highlight && 'border-violet-500 ring-2 ring-violet-500/30')

  const commit = () => {
    if (committed) return
    const note = message.trim() || MESSAGE
    setState((current) => ({
      ...current,
      message: note,
      committed: true,
      lines: [
        ...current.lines,
        { kind: 'command', text: `git add ${file}` },
        { kind: 'command', text: `git commit -m "${note}"` },
        { kind: 'output', text: `[main 3e1b7f0] ${note}` },
        { kind: 'output', text: ' 1 file changed, 1 insertion(+)' },
      ],
    }))
    setHighlight('commit')
  }

  const push = () => {
    if (!committed || pushed) return
    setState((current) => ({
      ...current,
      pushed: true,
      lines: [
        ...current.lines,
        { kind: 'command', text: 'git push' },
        { kind: 'output', text: 'To github.com/your-team/orders-report.git' },
        { kind: 'output', text: '   a05a2c9..3e1b7f0  main -> main' },
      ],
    }))
    setHighlight('push')
  }

  const startOver = () => {
    setState(INITIAL_STATE)
    setHighlight(null)
  }

  return (
    <div data-layers className="mx-auto my-6 max-w-3xl space-y-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a tool">
        {TOOLS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={tool === id}
            onClick={() => {
              setState((current) => ({ ...current, tool: id }))
              setHighlight(null)
            }}
            className={cn(
              'inline-flex min-h-11 items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-sky-500',
              tool === id ? 'border-violet-600 bg-violet-500/10 text-foreground' : 'border-border bg-card text-foreground hover:bg-muted',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <section className={cn(cardClass, 'space-y-3')} aria-labelledby="layers-top-heading">
        <h3 id="layers-top-heading" className="text-sm font-semibold">
          Top · easiest: <span className="font-normal text-muted-foreground">the button you click</span>
        </h3>
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="flex items-center gap-2 border-b bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            <span aria-hidden className="flex gap-1">
              <span className="size-2 rounded-full bg-border" />
              <span className="size-2 rounded-full bg-border" />
              <span className="size-2 rounded-full bg-border" />
            </span>
            {tool === 'rstudio' ? 'RStudio · Git pane' : tool === 'vscode' ? 'VS Code · Source Control — orders-report' : tool === 'desktop' ? 'GitHub Desktop · Current branch: main' : 'Your AI tool'}
          </div>

          {tool === 'ai' ? (
            <div className="space-y-3 p-4">
              <p className="ml-auto max-w-[90%] rounded-xl bg-violet-500/10 px-3 py-2 text-sm">Save this and share it with the team.</p>
              <p className="max-w-[90%] rounded-xl bg-muted px-3 py-2 text-sm">
                {pushed ? (
                  'Done. It’s on GitHub.'
                ) : committed ? (
                  <>Saved. Can I send it to GitHub? I want to run <code>git push</code>.</>
                ) : (
                  <>I want to run <code>git add {file}</code> and <code>git commit -m "{MESSAGE}"</code>. OK?</>
                )}
              </p>
              {!pushed && (
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={primaryButtonClass} onClick={committed ? push : commit}>
                    Approve
                  </button>
                  <button type="button" className={secondaryButtonClass} disabled>
                    Deny
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 p-4">
              {committed ? (
                <p className="rounded-md bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                  {tool === 'rstudio' ? 'No changes' : 'No local changes'}
                </p>
              ) : (
                <div className="flex items-center justify-between gap-3 rounded-md bg-muted/60 px-3 py-2 font-mono text-sm">
                  <span>{tool === 'rstudio' ? '☑' : '□'} {file}</span>
                  <span className="font-sans font-semibold text-amber-700 dark:text-amber-300">M</span>
                </div>
              )}
              <div className="flex flex-wrap items-end gap-2">
                <label className="min-w-[12rem] flex-1">
                  <span className="sr-only">{tool === 'desktop' ? 'Summary' : 'Commit message'}</span>
                  <input
                    value={message}
                    onChange={(event) => setState((current) => ({ ...current, message: event.target.value }))}
                    disabled={committed}
                    placeholder={tool === 'desktop' ? 'Summary' : 'Commit message'}
                    className="min-h-11 w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-sky-500 disabled:opacity-60"
                  />
                </label>
                <button type="button" className={primaryButtonClass} disabled={committed} onClick={commit}>
                  {tool === 'rstudio' ? 'Commit' : tool === 'vscode' ? '✓ Commit' : 'Commit to main'}
                </button>
                <button type="button" className={secondaryButtonClass} disabled={!committed || pushed} onClick={push}>
                  {tool === 'rstudio' ? '⬆ Push' : tool === 'vscode' ? '⇅ Sync Changes' : 'Push origin'}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className={changedCardClass} aria-labelledby="layers-middle-heading">
        <h3 id="layers-middle-heading" className="mb-3 text-sm font-semibold">
          Middle: <span className="font-normal text-muted-foreground">the command it runs for you</span>
        </h3>
        <div role="log" aria-label="Commands run by the selected tool" aria-live="polite" className="min-h-20 space-y-1 overflow-x-auto rounded-lg bg-zinc-950 px-3 py-2 font-mono text-[13px] leading-6 text-zinc-100">
          {lines.length === 0 ? (
            <p className="text-zinc-400">Nothing yet. Choose a tool and commit.</p>
          ) : (
            lines.map((line, index) =>
              line.kind === 'command' ? (
                <p key={`${line.text}-${index}`} className="whitespace-pre-wrap break-words">
                  <span className="text-emerald-400">student@laptop:~/orders-report$</span> {line.text}
                </p>
              ) : (
                <p key={`${line.text}-${index}`} className="whitespace-pre-wrap break-words text-zinc-400">{line.text}</p>
              ),
            )
          )}
        </div>
      </section>

      <section className={changedCardClass} aria-labelledby="layers-bottom-heading">
        <h3 id="layers-bottom-heading" className="mb-3 text-sm font-semibold">
          Bottom: <span className="font-normal text-muted-foreground">what git does</span>
        </h3>
        <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_3rem_minmax(0,1fr)]">
          <div role="region" aria-label="Your laptop" className="min-w-0 rounded-lg border border-dashed border-border p-3">
            <h4 className="text-sm font-semibold">Your laptop</h4>
            <p className="mb-3 text-xs text-muted-foreground">The snapshots in your folder</p>
            <ol aria-label="Commits on your laptop" className="space-y-2">
              <CommitDot message="First working version" id="a05a2c9" />
              {committed && <CommitDot message={message.trim() || MESSAGE} id="3e1b7f0" fresh={highlight === 'commit'} />}
            </ol>
          </div>
          <div aria-hidden className="hidden flex-col items-center justify-center text-xs text-muted-foreground md:flex">
            <span className="text-lg">→</span>
            <span>push</span>
          </div>
          <div aria-hidden className="flex flex-col items-center py-1 text-xs text-muted-foreground md:hidden">
            <span className="text-lg">↓</span>
            <span>push</span>
          </div>
          <div role="region" aria-label="GitHub · Private" className="min-w-0 rounded-lg border border-dashed border-border p-3">
            <h4 className="text-sm font-semibold">GitHub <span className="ml-1 rounded-full border border-emerald-600 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-300">Private</span></h4>
            <p className="mb-3 text-xs text-muted-foreground">What your team sees</p>
            <ol aria-label="Commits on GitHub" className="space-y-2">
              <CommitDot message="First working version" id="a05a2c9" />
              {pushed && <CommitDot message={message.trim() || MESSAGE} id="3e1b7f0" fresh={highlight === 'push'} />}
            </ol>
          </div>
        </div>
      </section>

      <p className="rounded-xl border border-emerald-600/30 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-900 dark:text-emerald-200">
        Whichever tool you pick, it ends up running the same git commands. If you know the middle layer, you can check what any button, or any AI tool, just did.
      </p>

      <div className="flex justify-end">
        <button type="button" className={secondaryButtonClass} onClick={startOver}>
          Start over
        </button>
      </div>
    </div>
  )
}
