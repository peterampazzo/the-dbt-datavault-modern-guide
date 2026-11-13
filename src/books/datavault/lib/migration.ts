import { useSyncExternalStore } from 'react'

export const MIGRATION_ITEMS = [
  { text: 'Persistent staging is live.', done: 'You can replay several retained deliveries.', href: '/replay' },
  { text: '`full_refresh: false` is set until then.', done: 'A rebuild cannot silently rewrite protected history.', href: '/modern-way' },
  { text: 'A hash parity test passes.', done: 'Fixed vectors pass on the target engine.', href: '/hash-parity' },
  { text: 'Unit tests cover the business rules.', done: 'The precedence and computed-satellite cases are green.', href: '/business-vault' },
  { text: 'Replaying several deliveries works.', done: 'The same deliveries produce the same vault rows.', href: '/replay' },
  { text: 'Rebuild-and-compare is green.', done: 'Counts, keys and payload hashes reconcile.', href: '/hash-parity/old-new-key-map-and-reconciliation' },
  { text: 'The parallel run reconciles.', done: 'Old and new outputs agree for the agreed comparison window.', href: '/business-vault' },
  { text: 'Cut-over is complete.', done: 'Readers use the new models and the rollback plan is recorded.', href: '/modern-way' },
] as const

const KEY = 'migration-checklist'
const EMPTY = Array.from({ length: MIGRATION_ITEMS.length }, () => false)
const listeners = new Set<() => void>()

function read() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    return Array.isArray(value) && value.length === MIGRATION_ITEMS.length
      ? value.map((item) => item === true)
      : EMPTY
  } catch {
    return EMPTY
  }
}

let state = read()

function write(next: boolean[]) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Storage can be blocked; the checklist still works for this visit.
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useMigrationChecklist() {
  return useSyncExternalStore(subscribe, () => state, () => EMPTY)
}

export function setMigrationItem(index: number, checked: boolean) {
  write(state.map((item, itemIndex) => (itemIndex === index ? checked : item)))
}

export function resetMigrationChecklist() {
  write([...EMPTY])
}
