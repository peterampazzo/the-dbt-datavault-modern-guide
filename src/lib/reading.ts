import { useSyncExternalStore } from 'react'
import { CHAPTERS } from '@/chapters'

export type ReadingMode = 'paged' | 'scroll'
export type ReadingPath = 'full' | 'dv-practitioner' | 'browse'
export type PageRef = { id: string; title: string }

const MODE_KEY = 'reading-mode'
const PATH_KEY = 'reading-path'
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
    return localStorage.getItem(MODE_KEY) === 'scroll' ? 'scroll' : 'paged'
  } catch {
    return 'paged'
  }
})()

let path: ReadingPath = (() => {
  try {
    const saved = localStorage.getItem(PATH_KEY)
    return saved === 'dv-practitioner' || saved === 'browse' ? saved : 'full'
  } catch {
    return 'full'
  }
})()

export const useReadingMode = () => useSyncExternalStore(subscribe, () => mode)
export const useReadingPath = () => useSyncExternalStore(subscribe, () => path)

export function setReadingMode(next: ReadingMode) {
  mode = next
  try {
    localStorage.setItem(MODE_KEY, next)
  } catch {
    // storage blocked: the choice lasts until reload
  }
  notify()
}

export function setReadingPath(next: ReadingPath) {
  path = next
  try {
    localStorage.setItem(PATH_KEY, next)
  } catch {
    // storage blocked: the choice lasts until reload
  }
  notify()
}

export function getPathOrder(selected: ReadingPath): string[] {
  if (selected === 'dv-practitioner') return ['dv-names', 'dbt-primer', 'dbt', 'load-player', 'replay', 'one-lake', 'modern-way', 'from-sql-server', 'hash-parity']
  return CHAPTERS.map((chapter) => chapter.slug)
}

export function getOptionalRefresherSlugs(selected: ReadingPath): string[] {
  if (selected !== 'dv-practitioner') return []
  const recommended = new Set(getPathOrder(selected))
  return CHAPTERS.map((chapter) => chapter.slug).filter((slug) => !recommended.has(slug))
}

export function getFirstPathChapter(selected: ReadingPath) {
  return getPathOrder(selected)[0]
}

function getNavigationOrder(slug: string, selected: ReadingPath) {
  const order = getPathOrder(selected)
  return order.includes(slug) ? order : CHAPTERS.map((chapter) => chapter.slug)
}

export function getNextPathChapter(slug: string, selected: ReadingPath) {
  const order = getNavigationOrder(slug, selected)
  const index = order.indexOf(slug)
  return index >= 0 ? order[index + 1] : undefined
}

export function getPreviousPathChapter(slug: string, selected: ReadingPath) {
  const order = getNavigationOrder(slug, selected)
  const index = order.indexOf(slug)
  return index > 0 ? order[index - 1] : undefined
}

/** The pages of the chapter on screen, published by <Chapter> for the sidebar. */
let pages: { slug: string; pages: PageRef[] } = { slug: '', pages: [] }

export const usePages = () => useSyncExternalStore(subscribe, () => pages)

export function publishPages(slug: string, list: PageRef[]) {
  if (pages.slug === slug && JSON.stringify(pages.pages) === JSON.stringify(list)) return
  pages = { slug, pages: list }
  notify()
}
