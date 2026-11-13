import { HashRouter, Route, Routes } from 'react-router'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Layout } from '@/components/Layout'
import { Home } from '@/books/datavault/components/Home'
import { AboutPage } from '@/books/datavault/components/AboutPage'
import { GlossaryPage } from '@/books/datavault/components/GlossaryPage'
import { CHAPTERS } from '@/books/datavault/chapters'

export default function App() {
  return (
    <TooltipProvider>
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
    </TooltipProvider>
  )
}
