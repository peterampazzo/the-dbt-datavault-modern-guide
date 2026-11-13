import { useSyncExternalStore, type ReactNode } from 'react'
import { HashRouter, Route, Routes } from 'react-router'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Layout } from '@/components/Layout'
import { Shelf } from '@/components/Shelf'
import { Home as DatavaultHome } from '@/books/datavault/components/Home'
import { AboutPage } from '@/books/datavault/components/AboutPage'
import { GlossaryPage } from '@/books/datavault/components/GlossaryPage'
import { DATAVAULT } from '@/books/datavault/book'
import { Home as FoundationsHome } from '@/books/foundations/components/Home'
import { FOUNDATIONS } from '@/books/foundations/book'
import { BookProvider, type Book } from '@/lib/book'
import { bookOf, type BookSlug } from '@/lib/books'
import { selectProgress } from '@/lib/progress'

const READERS: Record<BookSlug, { book: Book; home: ReactNode; extra?: ReactNode }> = {
  datavault: {
    book: DATAVAULT,
    home: <DatavaultHome />,
    extra: (
      <>
        <Route path="about" element={<AboutPage />} />
        <Route path="glossary" element={<GlossaryPage />} />
      </>
    ),
  },
  foundations: { book: FOUNDATIONS, home: <FoundationsHome /> },
}

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  window.addEventListener('popstate', onChange)
  return () => {
    window.removeEventListener('hashchange', onChange)
    window.removeEventListener('popstate', onChange)
  }
}

function useBookSlug() {
  return useSyncExternalStore(subscribe, () => bookOf(window.location.hash.replace(/^#/, '')))
}

export default function App() {
  const slug = useBookSlug()
  if (!slug) {
    return (
      <TooltipProvider>
        <Shelf />
      </TooltipProvider>
    )
  }
  const { book, home, extra } = READERS[slug]
  selectProgress(book.progressKey)
  return (
    <TooltipProvider>
      <BookProvider book={book}>
        <HashRouter key={slug} basename={`/${slug}`}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={home} />
              {extra}
              {book.chapters.map(({ slug: chapter, Component }) => (
                <Route key={chapter} path={`${chapter}/:page?`} element={<Component />} />
              ))}
            </Route>
          </Routes>
        </HashRouter>
      </BookProvider>
    </TooltipProvider>
  )
}
