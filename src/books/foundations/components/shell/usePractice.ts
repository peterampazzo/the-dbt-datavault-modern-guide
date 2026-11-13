import { useCallback, useEffect, useState } from 'react'
import { createShell, run, type ShellState } from '@/books/foundations/lib/shell/shell'

const key = (id: string) => `practice:${id}`

function load(id: string, cwd: string): ShellState {
  try {
    const saved = localStorage.getItem(key(id))
    if (saved) return JSON.parse(saved) as ShellState
  } catch {
    // storage blocked or corrupt: start fresh
  }
  return createShell(cwd)
}

/** A practice terminal's state, kept per page so leaving and coming back restores it. */
export function usePractice(id: string, cwd: string) {
  const [state, setState] = useState(() => load(id, cwd))
  useEffect(() => {
    try {
      localStorage.setItem(key(id), JSON.stringify(state))
    } catch {
      // storage blocked: state lasts until reload
    }
  }, [id, state])
  const exec = useCallback((line: string) => setState((s) => run(s, line)), [])
  const reset = useCallback(() => setState(createShell(cwd)), [cwd])
  return { state, exec, reset }
}
