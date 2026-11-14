import { useCallback, useEffect, useState } from 'react'
import { createShell, run, type ShellState } from '@/books/foundations/lib/shell/shell'

const key = (id: string) => `practice:${id}`

function load(id: string, start: () => ShellState): ShellState {
  try {
    const saved = localStorage.getItem(key(id))
    if (saved) return JSON.parse(saved) as ShellState
  } catch {
    // storage blocked or corrupt: start fresh
  }
  return start()
}

/** A practice terminal's state, kept per page so leaving and coming back restores it. */
export function usePractice(id: string, cwd: string, start?: () => ShellState) {
  const fresh = useCallback(() => (start ? start() : createShell(cwd)), [cwd, start])
  const [state, setState] = useState(() => load(id, fresh))
  useEffect(() => {
    try {
      localStorage.setItem(key(id), JSON.stringify(state))
    } catch {
      // storage blocked: state lasts until reload
    }
  }, [id, state])
  const exec = useCallback((line: string) => setState((s) => run(s, line)), [])
  const reset = useCallback(() => setState(fresh()), [fresh])
  const update = useCallback((change: (s: ShellState) => ShellState) => setState(change), [])
  return { state, exec, reset, update }
}
