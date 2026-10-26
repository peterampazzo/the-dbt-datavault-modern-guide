import { Children, isValidElement, useEffect, useRef, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import { CHAPTERS } from '@/chapters'
import { ChapterHeader, Section, slugify } from '@/components/Prose'
import { markDone, setLast } from '@/lib/progress'
import { publishPages, useReadingMode } from '@/lib/reading'
import { cn } from '@/lib/utils'

type Page = { id: string; title: string; nodes: ReactNode[] }

/** Arrow keys belong to these controls, not to page turning. */
const OWN_ARROWS = 'input, textarea, select, [contenteditable="true"], [role="slider"], [role="tab"], [role="radio"], [role="menuitem"], [role="listbox"], .react-flow'

/** Each <Section> starts a page; anything else stays on the page before it. */
function split(children: ReactNode, fallback: string) {
  let header: ReactNode = null
  const pages: Page[] = []
  for (const c of Children.toArray(children)) {
    if (isValidElement(c) && c.type === ChapterHeader) {
      header = c
    } else if (isValidElement<{ title?: string }>(c) && c.type === Section) {
      const t = c.props.title
      pages.push({ id: t ? slugify(t) : pages.length ? `part-${pages.length + 1}` : '', title: t ?? fallback, nodes: [c] })
    } else if (pages.length) {
      pages[pages.length - 1].nodes.push(c)
    } else {
      pages.push({ id: '', title: fallback, nodes: [c] })
    }
  }
  return { header, pages }
}

export function Chapter({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const mode = useReadingMode()
  const [slug, seg] = pathname.split('/').filter(Boolean)
  const n = Math.max(0, CHAPTERS.findIndex((c) => c.slug === slug))
  const chapter = CHAPTERS[n]
  const prevChapter = n > 0 ? CHAPTERS[n - 1] : null
  const nextChapter = n < CHAPTERS.length - 1 ? CHAPTERS[n + 1] : null

  const { header, pages } = split(children, chapter.title)
  const cur = seg ? Math.max(0, pages.findIndex((p) => p.id === seg)) : 0
  const page = pages[cur]
  const isLast = cur === pages.length - 1
  const href = (i: number) => (i === 0 ? `/${chapter.slug}` : `/${chapter.slug}/${pages[i].id}`)

  const list = JSON.stringify(pages.map(({ id, title }) => ({ id, title })))
  useEffect(() => {
    publishPages(chapter.slug, JSON.parse(list))
  }, [chapter.slug, list])

  useEffect(() => {
    if (mode === 'paged') setLast(chapter.slug, page.id || undefined, page.id ? page.title : undefined)
  }, [mode, chapter.slug, page.id, page.title])

  const first = useRef(true)
  useEffect(() => {
    const initial = first.current
    first.current = false
    if (mode === 'scroll' && seg) {
      const t = setTimeout(() => document.getElementById(seg)?.scrollIntoView({ block: 'start' }), 60)
      return () => clearTimeout(t)
    }
    window.scrollTo({ top: 0 })
    if (mode === 'paged' && !initial) document.getElementById(page.id || 'chapter-title')?.focus({ preventScroll: true })
    // re-run only when the address or the mode changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, mode])

  useEffect(() => {
    if (mode !== 'paged') return
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
      if ((e.target as Element | null)?.closest?.(OWN_ARROWS)) return
      if (e.key === 'ArrowRight' && cur < pages.length - 1) navigate(href(cur + 1))
      else if (e.key === 'ArrowLeft' && cur > 0) navigate(href(cur - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const end = useRef<HTMLDivElement>(null)
  const atEnd = mode === 'scroll' || isLast
  useEffect(() => {
    const el = end.current
    if (!el || !atEnd) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && (mode === 'paged' || window.scrollY > 200)) markDone(chapter.slug)
    })
    io.observe(el)
    return () => io.disconnect()
  }, [atEnd, mode, chapter.slug])

  return (
    <article>
      {(mode === 'scroll' || cur === 0) && header}
      {mode === 'scroll' ? (
        pages.flatMap((p) => p.nodes)
      ) : (
        <motion.div key={page.id || 'start'} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {page.nodes}
        </motion.div>
      )}

      {mode === 'paged' ? (
        <nav
          aria-label="Pages"
          className="mt-16 border-t bg-background/90 py-3 backdrop-blur max-lg:sticky max-lg:bottom-0 max-lg:z-30 max-lg:-mx-4 max-lg:px-4 md:max-lg:-mx-10 md:max-lg:px-10"
        >
          <div className="flex items-center justify-between gap-3">
            {cur > 0 ? (
              <PageLink to={href(cur - 1)} dir="prev" label={pages[cur - 1].title} />
            ) : prevChapter ? (
              <PageLink to={`/${prevChapter.slug}`} dir="prev" label={prevChapter.title} />
            ) : (
              <span />
            )}
            <span className="shrink-0 text-xs text-muted-foreground">
              Page {cur + 1} of {pages.length}
            </span>
            {!isLast ? (
              <PageLink to={href(cur + 1)} dir="next" label={`Next: ${pages[cur + 1].title}`} primary />
            ) : nextChapter ? (
              <PageLink to={`/${nextChapter.slug}`} dir="next" label={`Next chapter: ${nextChapter.title}`} primary />
            ) : (
              <span />
            )}
          </div>
          <ol aria-label="All pages in this chapter" className="mt-1 flex flex-wrap justify-center">
            {pages.map((p, i) => (
              <li key={p.id || 'start'}>
                <Link
                  to={href(i)}
                  aria-label={`Page ${i + 1}: ${p.title}`}
                  aria-current={i === cur ? 'page' : undefined}
                  className="group inline-flex size-6 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className={cn('size-2 rounded-full transition-colors', i === cur ? 'bg-sky-500' : 'bg-muted-foreground/40 group-hover:bg-muted-foreground')} />
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      ) : (
        <nav aria-label="Chapters" className="mt-16 flex justify-between gap-4 border-t pt-6">
          {prevChapter ? <PageLink to={`/${prevChapter.slug}`} dir="prev" label={prevChapter.title} /> : <span />}
          {nextChapter && <PageLink to={`/${nextChapter.slug}`} dir="next" label={nextChapter.title} primary />}
        </nav>
      )}
      <div ref={end} aria-hidden className="h-px" />
    </article>
  )
}

function PageLink({ to, dir, label, primary }: { to: string; dir: 'prev' | 'next'; label: string; primary?: boolean }) {
  return (
    <Link
      to={to}
      className={cn(
        'group flex min-w-0 items-center gap-2 rounded-md py-2 text-sm',
        primary ? 'font-medium hover:text-sky-700 dark:hover:text-sky-400' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {dir === 'prev' && <ArrowLeft aria-hidden className="size-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />}
      <span className={cn('truncate', dir === 'prev' && 'max-sm:sr-only')}>{label}</span>
      {dir === 'next' && <ArrowRight aria-hidden className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />}
    </Link>
  )
}
