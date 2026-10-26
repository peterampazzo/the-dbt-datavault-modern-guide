import { useCallback, useState, useSyncExternalStore } from 'react'

/** Reader progress kept in localStorage: last place read, finished chapters and interactive state. */
export type Progress = {
  last?: { slug: string; section?: string; sectionTitle?: string }
  done: string[]
  state: Record<string, unknown>
}

const KEY = 'dv-guide-progress'
const EMPTY: Progress = { done: [], state: {} }
const listeners = new Set<() => void>()

function read(): Progress {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    return v && Array.isArray(v.done) ? { ...EMPTY, ...v } : EMPTY
  } catch {
    return EMPTY
  }
}

let cache: Progress = read()

function write(next: Progress) {
  cache = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // storage blocked or full: progress just isn't kept
  }
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

export function useProgress() {
  return useSyncExternalStore(subscribe, () => cache)
}

export function setLast(slug: string, section?: string, sectionTitle?: string) {
  const l = cache.last
  if (l?.slug === slug && l.section === section) return
  write({ ...cache, last: { slug, section, sectionTitle } })
}

export function markDone(slug: string) {
  if (!cache.done.includes(slug)) write({ ...cache, done: [...cache.done, slug] })
}

export function resetProgress() {
  write(EMPTY)
}

/** Like useState, but the value survives reloads. */
export function usePersistentState<T>(key: string, initial: T) {
  const [init] = useState(initial)
  const value = useSyncExternalStore(subscribe, () => (key in cache.state ? (cache.state[key] as T) : init))
  const set = useCallback(
    (v: T | ((prev: T) => T)) => {
      const prev = (key in cache.state ? cache.state[key] : init) as T
      const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v
      write({ ...cache, state: { ...cache.state, [key]: next } })
    },
    [key, init],
  )
  return [value, set] as const
}
