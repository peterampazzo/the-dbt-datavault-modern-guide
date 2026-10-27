import { useSyncExternalStore } from 'react'

export type SqlDialect = 'generic' | 'tsql'

const DIALECT_KEY = 'sql-dialect'
const listeners = new Set<() => void>()
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
const notify = () => listeners.forEach((listener) => listener())

let dialect: SqlDialect = (() => {
  try {
    return localStorage.getItem(DIALECT_KEY) === 'tsql' ? 'tsql' : 'generic'
  } catch {
    return 'generic'
  }
})()

export const useSqlDialect = () => useSyncExternalStore(subscribe, () => dialect)

export function setSqlDialect(next: SqlDialect) {
  dialect = next
  try {
    localStorage.setItem(DIALECT_KEY, next)
  } catch {
    // storage blocked: the choice lasts until reload
  }
  notify()
}
