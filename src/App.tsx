import { useSyncExternalStore } from 'react'
import { HashRouter, Route, Routes } from 'react-router'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Layout } from '@/components/Layout'
import { Shelf } from '@/components/Shelf'
import { Home } from '@/books/datavault/components/Home'
import { AboutPage } from '@/books/datavault/components/AboutPage'
import { GlossaryPage } from '@/books/datavault/components/GlossaryPage'
import { CHAPTERS } from '@/books/datavault/chapters'
import { bookOf } from '@/lib/books'

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  window.addEventListener('popstate', onChange)
  return () => {
    window.removeEventListener('hashchange', onChange)
    window.removeEventListener('popstate', onChange)
  }
}

function useBook() {
  return useSyncExternalStore(subscribe, () => bookOf(window.location.hash.replace(/^#/, '')))
}

export default function App() {
  const book = useBook()
  return (
    <TooltipProvider>
      {book === 'datavault' ? (
        <HashRouter basename="/datavault">
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="glossary" element={<GlossaryPage />} />
              {CHAPTERS.map(({ slug, Component }) => (
                <Route key={slug} path={`${slug}/:page?`} element={<Component />} />
              ))}
            </Route>
          </Routes>
        </HashRouter>
      ) : (
        <Shelf />
      )}
    </TooltipProvider>
  )
}
