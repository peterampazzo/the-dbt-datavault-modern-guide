import { useSyncExternalStore } from 'react'
import type { Book } from '@/lib/book'

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

type PathBook = Pick<Book, 'chapters' | 'pathOrder'>

const chapterOrder = (book: PathBook) => book.chapters.map((chapter) => chapter.slug)

export function getPathOrder(book: PathBook, selected: ReadingPath): string[] {
  return book.pathOrder ? [...book.pathOrder(selected)] : chapterOrder(book)
}

/** Chapters the selected path skips: listed as refreshers in the contents. */
export function getOptionalRefresherSlugs(book: PathBook, selected: ReadingPath): string[] {
  const recommended = new Set(getPathOrder(book, selected))
  return chapterOrder(book).filter((slug) => !recommended.has(slug))
}

export function getFirstPathChapter(book: PathBook, selected: ReadingPath) {
  return getPathOrder(book, selected)[0]
}

function getNavigationOrder(book: PathBook, slug: string, selected: ReadingPath) {
  const order = getPathOrder(book, selected)
  return order.includes(slug) ? order : chapterOrder(book)
}

export function getNextPathChapter(book: PathBook, slug: string, selected: ReadingPath) {
  const order = getNavigationOrder(book, slug, selected)
  const index = order.indexOf(slug)
  return index >= 0 ? order[index + 1] : undefined
}

export function getPreviousPathChapter(book: PathBook, slug: string, selected: ReadingPath) {
  const order = getNavigationOrder(book, slug, selected)
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
