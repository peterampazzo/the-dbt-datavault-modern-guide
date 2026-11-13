import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { RotateCcw } from 'lucide-react'
import { complete, prompt, type ShellState } from '@/books/foundations/lib/shell/shell'
import { cn } from '@/lib/utils'

export function Terminal({
  state,
  exec,
  reset,
  chips = [],
  draft,
  onDraftUsed,
  label,
}: {
  state: ShellState
  exec: (line: string) => void
  reset: () => void
  chips?: string[]
  draft?: string
  onDraftUsed?: () => void
  label: string
}) {
  const [line, setLine] = useState('')
  const [back, setBack] = useState(-1)
  const input = useRef<HTMLInputElement>(null)
  const screen = useRef<HTMLDivElement>(null)
  const history = state.entries.map((e) => e.input).filter(Boolean)

  useEffect(() => {
    screen.current?.scrollTo({ top: screen.current.scrollHeight })
  }, [state.entries.length])

  useEffect(() => {
    if (draft === undefined) return
    setLine(draft)
    input.current?.focus()
    onDraftUsed?.()
  }, [draft, onDraftUsed])

  const submit = () => {
    exec(line)
    setLine('')
    setBack(-1)
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
    } else if (e.key === 'Tab' && line.trim() && !e.shiftKey) {
      e.preventDefault()
      setLine(complete(state.cwd, line))
    } else if (e.key === 'ArrowUp' && history.length) {
      e.preventDefault()
      const i = back < 0 ? history.length - 1 : Math.max(0, back - 1)
      setBack(i)
      setLine(history[i])
    } else if (e.key === 'ArrowDown' && back >= 0) {
      e.preventDefault()
      const i = back + 1
      setBack(i >= history.length ? -1 : i)
      setLine(i >= history.length ? '' : history[i])
    }
  }

  const lastOutput = state.entries.at(-1)?.output ?? ''

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-1.5">
        <span className="font-sans text-xs text-zinc-400">{label}</span>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-sans text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-sky-400"
        >
          <RotateCcw size={12} aria-hidden /> Start over
        </button>
      </div>
      <div
        ref={screen}
        role="log"
        aria-label="Terminal output"
        className="max-h-80 min-h-28 overflow-y-auto px-3 py-2 font-mono text-[13px] leading-5"
        onClick={() => input.current?.focus()}
      >
        {state.entries.length === 0 && <div className="text-zinc-400">Type a command and press Enter. Type help to see what works here.</div>}
        {state.entries.map((e, i) => (
          <div key={i} className="mb-1">
            <div className="break-all">
              <span className="text-emerald-400">{prompt(e.cwd)}</span> {e.input}
            </div>
            {e.output && <pre className={cn('whitespace-pre-wrap break-words font-mono', e.ok ? 'text-zinc-200' : 'text-rose-300')}>{e.output}</pre>}
          </div>
        ))}
      </div>
      <div className="sr-only" aria-live="polite">
        {lastOutput}
      </div>
      <form
        className="flex items-center gap-2 border-t border-zinc-800 px-3 py-2 font-mono text-[13px]"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <label htmlFor={`${label}-input`} className="shrink-0 text-emerald-400">
          <span className="hidden sm:inline">{prompt(state.cwd)}</span>
          <span className="sm:hidden">$</span>
          <span className="sr-only"> Command</span>
        </label>
        <input
          id={`${label}-input`}
          ref={input}
          value={line}
          onChange={(e) => setLine(e.target.value)}
          onKeyDown={onKey}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent text-zinc-100 caret-emerald-400 outline-none placeholder:text-zinc-600"
          placeholder="type here"
        />
        <button type="submit" className="rounded bg-emerald-500/20 px-2 py-0.5 font-sans text-xs text-emerald-200 hover:bg-emerald-500/30 focus-visible:outline-2 focus-visible:outline-sky-400">
          Run
        </button>
      </form>
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-zinc-800 px-3 py-2">
          <span className="font-sans text-xs leading-6 text-zinc-400">Tap to type:</span>
          {chips.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setLine(c)
                input.current?.focus()
              }}
              className="rounded-md border border-zinc-700 px-2 py-0.5 font-mono text-xs text-zinc-200 hover:border-zinc-500 focus-visible:outline-2 focus-visible:outline-sky-400"
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
