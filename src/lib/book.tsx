import { createContext, useContext, type ComponentType, type ReactNode } from 'react'
import type { BookSlug } from '@/lib/books'
import type { ReadingPath } from '@/lib/reading'

export type ChapterQuiz = { q: string; options: string[]; answer: number; why: string }

export type BookChapter = {
  slug: string
  title: string
  short: string
  minutes: number
  part: number
  audience: string
  summary: readonly string[]
  recap: readonly string[]
  quiz: readonly ChapterQuiz[]
  Component: ComponentType
}

export type BookGlossaryEntry = { id: string; term: string; definition: string; chapter: string; aka?: string; sqlServerName?: string }

/** Everything the shared reader (layout, chapter pages, terms) needs to know about one book. */
export type Book = {
  slug: BookSlug
  title: string
  repoUrl: string
  chapters: readonly BookChapter[]
  parts: readonly { n: number; title: string }[]
  audience: Record<string, string>
  glossary: readonly BookGlossaryEntry[]
  progressKey: string
  /** Chapter order for a reading path; books without paths read in chapter order. */
  pathOrder?: (path: ReadingPath) => readonly string[]
  legend?: ReactNode
  hasAbout: boolean
}

const BookContext = createContext<Book | null>(null)

export function BookProvider({ book, children }: { book: Book; children: ReactNode }) {
  return <BookContext.Provider value={book}>{children}</BookContext.Provider>
}

export function useBook(): Book {
  const book = useContext(BookContext)
  if (!book) throw new Error('useBook needs a <BookProvider>')
  return book
}
