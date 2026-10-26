import { useSyncExternalStore } from 'react'

export type ReadingMode = 'paged' | 'scroll'
export type PageRef = { id: string; title: string }

const KEY = 'reading-mode'
const listeners = new Set<() => void>()
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}
const notify = () => listeners.forEach((l) => l())

let mode: ReadingMode = (() => {
  try {
    return localStorage.getItem(KEY) === 'scroll' ? 'scroll' : 'paged'
  } catch {
    return 'paged'
  }
})()

export const useReadingMode = () => useSyncExternalStore(subscribe, () => mode)

export function setReadingMode(next: ReadingMode) {
  mode = next
  try {
    localStorage.setItem(KEY, next)
  } catch {
    // storage blocked: the choice lasts until reload
  }
  notify()
}

/** The pages of the chapter on screen, published by <Chapter> for the sidebar. */
let pages: { slug: string; pages: PageRef[] } = { slug: '', pages: [] }

export const usePages = () => useSyncExternalStore(subscribe, () => pages)

export function publishPages(slug: string, list: PageRef[]) {
  if (pages.slug === slug && JSON.stringify(pages.pages) === JSON.stringify(list)) return
  pages = { slug, pages: list }
  notify()
}
