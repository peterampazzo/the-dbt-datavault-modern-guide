import { HashRouter, Route, Routes } from 'react-router'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Layout } from '@/components/Layout'
import { Home } from '@/components/Home'
import { AboutPage } from '@/components/AboutPage'
import { GlossaryPage } from '@/components/GlossaryPage'
import { CHAPTERS } from '@/chapters'

export default function App() {
  return (
    <TooltipProvider>
      <HashRouter>
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
