import { Children, cloneElement, isValidElement, useCallback, useEffect, useMemo, useRef, type ReactElement, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import { CHAPTERS, type Audience } from '@/chapters'
import { ChapterHeader, RecapExtras, Section, slugify } from '@/components/Prose'
import { QuickCheck } from '@/components/QuickCheck'
import { markDone, setLast } from '@/lib/progress'
import { publishPages, useReadingMode, useReadingPath, getNextPathChapter, getPreviousPathChapter } from '@/lib/reading'
import { cn } from '@/lib/utils'

type Page = { id: string; title: string; nodes: ReactNode[] }

/** Arrow keys belong to these controls, not to page turning. */
const OWN_ARROWS = 'input, textarea, select, [contenteditable="true"], [role="slider"], [role="tab"], [role="radio"], [role="menuitem"], [role="listbox"], .react-flow'

/** Each <Section> starts a page; anything else stays on the page before it. */
function split(children: ReactNode, fallback: string) {
  let header: ReactNode = null
  const pages: Page[] = []
  const extras: ReactNode[] = []
  for (const c of Children.toArray(children)) {
    if (isValidElement(c) && c.type === ChapterHeader) {
      header = c
    } else if (isValidElement<{ children?: ReactNode }>(c) && c.type === RecapExtras) {
      extras.push(c.props.children)
    } else if (isValidElement<{ title?: string }>(c) && c.type === Section) {
      const title = c.props.title
      pages.push({ id: title ? slugify(title) : `section-${pages.length + 1}`, title: title ?? fallback, nodes: [c] })
    } else if (pages.length) {
      pages[pages.length - 1].nodes.push(c)
    } else {
      pages.push({ id: '', title: fallback, nodes: [c] })
    }
  }
  return { header, pages, extras }
}

const audienceText: Record<Audience, string> = {
  essential: 'Essential',
  'skim-if-dv': 'Skim if you know Data Vault',
  practitioner: 'For Data Vault practitioners',
}

export function Chapter({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const mode = useReadingMode()
  const path = useReadingPath()
  const [slug, seg] = pathname.split('/').filter(Boolean)
  const chapterIndex = Math.max(0, CHAPTERS.findIndex((c) => c.slug === slug))
  const chapter = CHAPTERS[chapterIndex]
  const n = chapterIndex + 1
  const previousSlug = getPreviousPathChapter(chapter.slug, path)
  const nextSlug = getNextPathChapter(chapter.slug, path)
  const previousChapter = CHAPTERS.find((c) => c.slug === previousSlug)
  const nextChapter = CHAPTERS.find((c) => c.slug === nextSlug)

  const { header, pages, extras } = useMemo(() => split(children, chapter.title), [children, chapter.title])
  const coverIndex = 0
  const recapIndex = pages.length + 1
  const pageRefs = useMemo(
    () => [
      { id: '', title: 'Overview' },
      ...pages.map(({ id, title }) => ({ id, title })),
      { id: 'recap', title: 'Recap' },
    ],
    [pages],
  )
  const contentIndex = pages.findIndex((p) => p.id === seg) + 1
  const cur = !seg ? coverIndex : seg === 'recap' ? recapIndex : Math.max(1, contentIndex)
  const activeContent = pages[cur - 1]
  const activePage = pageRefs[cur]
  const href = useCallback(
    (i: number) => (i === coverIndex ? `/${chapter.slug}` : i === recapIndex ? `/${chapter.slug}/recap` : `/${chapter.slug}/${pages[i - 1].id}`),
    [chapter.slug, pages, recapIndex],
  )
  const renderPage = (page: Page, pageNumber: number) =>
    page.nodes.map((node, index) =>
      isValidElement(node) && node.type === Section
        ? cloneElement(node as ReactElement<{ pageNumber?: string; sectionId?: string; title?: string }>, {
            pageNumber: `${n}.${pageNumber}`,
            sectionId: page.id,
            key: node.key ?? index,
          })
        : node,
    )

  const refsJson = JSON.stringify(pageRefs)
  const activeContentId = activeContent?.id
  const activeContentTitle = activeContent?.title
  useEffect(() => {
    publishPages(chapter.slug, JSON.parse(refsJson))
  }, [chapter.slug, refsJson])

  useEffect(() => {
    if (mode !== 'paged') return
    if (seg === 'recap') {
      setLast(chapter.slug, 'recap', 'Recap')
      markDone(chapter.slug)
    } else if (activeContentTitle) {
      setLast(chapter.slug, activeContentId || undefined, activeContentTitle)
    } else if (cur === coverIndex) {
      setLast(chapter.slug, undefined, chapter.title)
    }
  }, [mode, chapter.slug, chapter.title, seg, activeContentId, activeContentTitle, cur])

  const first = useRef(true)
  useEffect(() => {
    const initial = first.current
    first.current = false
    if (mode === 'scroll' && seg) {
      const target = seg === 'recap' ? 'chapter-recap' : seg
      const timeout = setTimeout(() => document.getElementById(target)?.scrollIntoView({ block: 'start' }), 60)
      return () => clearTimeout(timeout)
    }
    window.scrollTo({ top: 0 })
    if (mode === 'paged' && !initial) {
      const target = activePage.id === 'recap' ? 'recap-heading' : activePage.id ? slugify(activePage.title) : 'chapter-title'
      document.getElementById(target)?.focus({ preventScroll: true })
    }
    // Address changes and mode changes control the page focus/scroll position.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, mode])

  useEffect(() => {
    if (mode !== 'paged') return
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
      if ((event.target as Element | null)?.closest?.(OWN_ARROWS)) return
      if (event.key === 'ArrowRight' && cur < recapIndex) navigate(href(cur + 1))
      else if (event.key === 'ArrowLeft' && cur > coverIndex) navigate(href(cur - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, cur, recapIndex, navigate, href])

  const end = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const element = end.current
    if (!element || mode !== 'scroll') return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && window.scrollY > 200) markDone(chapter.slug)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [mode, chapter.slug])

  const cover = (
    <>
      {header}
      <p className="mb-3 inline-flex rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">{audienceText[chapter.audience]}</p>
      <section aria-labelledby="chapter-pages-heading" className="max-w-3xl">
        <h2 id="chapter-pages-heading" className="mb-3 text-lg font-semibold">Pages in this chapter</h2>
        <ol className="space-y-2">
          {pages.map((page, index) => (
            <li key={page.id || 'page-one'}>
              <Link to={href(index + 1)} className="inline-flex items-baseline gap-2 rounded underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <span className="font-mono text-sm text-muted-foreground">{index + 1}.</span>
                {page.title}
              </Link>
            </li>
          ))}
        </ol>
        <Link to={href(1)} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Start <ArrowRight aria-hidden className="size-4" />
        </Link>
      </section>
    </>
  )

  const recap = (
    <section id="chapter-recap" aria-labelledby="recap-heading" className="scroll-mt-20">
      <h1 id="recap-heading" tabIndex={-1} className="mb-5 text-3xl font-semibold tracking-tight outline-none">Recap</h1>
      <ol className="mb-8 max-w-3xl list-decimal space-y-3 pl-6 leading-7">
        {chapter.recap.map((point) => <li key={point}>{point}</li>)}
      </ol>
      <QuickCheck questions={chapter.quiz} />
      {extras.length > 0 && <div className="mt-8">{extras}</div>}
      <div className="mt-10 border-t pt-5">
        {nextChapter ? (
          <Link to={`/${nextChapter.slug}`} className="inline-flex items-center gap-2 font-medium text-foreground hover:underline">
            Next: {nextChapter.title} <ArrowRight aria-hidden className="size-4" />
          </Link>
        ) : (
          <Link to="/" className="inline-flex items-center gap-2 font-medium text-foreground hover:underline">
            Back: Home <ArrowRight aria-hidden className="size-4" />
          </Link>
        )}
      </div>
    </section>
  )

  const renderedPages = pages.flatMap((page, index) => renderPage(page, index + 1))

  return (
    <article>
      {mode === 'scroll' ? (
        <>
          {cover}
          <div className="mt-10 border-t pt-8">{renderedPages}</div>
          <div className="mt-10 border-t pt-8">{recap}</div>
        </>
      ) : (
        <motion.div key={activePage.id || 'cover'} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {cur === coverIndex ? cover : cur === recapIndex ? recap : activeContent ? renderPage(activeContent, cur) : null}
        </motion.div>
      )}

      {mode === 'paged' ? (
        <nav
          aria-label="Pages"
          className="mt-10 border-t bg-background/90 py-3 backdrop-blur max-lg:sticky max-lg:bottom-0 max-lg:z-30 max-lg:-mx-4 max-lg:px-4 md:max-lg:-mx-10 md:max-lg:px-10"
        >
          <div className="flex items-center justify-between gap-3">
            {cur > coverIndex ? (
              <PageLink to={href(cur - 1)} dir="prev" label={pageRefs[cur - 1].title} />
            ) : previousChapter ? (
              <PageLink to={`/${previousChapter.slug}`} dir="prev" label={previousChapter.title} />
            ) : <span />}
            <span className="shrink-0 text-xs text-muted-foreground">Page {cur + 1} of {pageRefs.length}</span>
            {cur < recapIndex ? (
              <PageLink to={href(cur + 1)} dir="next" label={pageRefs[cur + 1].title} primary />
            ) : nextChapter ? (
              <PageLink to={`/${nextChapter.slug}`} dir="next" label={nextChapter.title} primary />
            ) : <span />}
          </div>
          <ol aria-label="All pages in this chapter" className="mt-1 flex flex-wrap justify-center">
            {pageRefs.map((page, index) => (
              <li key={page.id || 'cover'}>
                <Link
                  to={href(index)}
                  aria-label={`Page ${index + 1}: ${page.title}`}
                  aria-current={index === cur ? 'page' : undefined}
                  className="group inline-flex size-6 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className={cn('size-2 rounded-full transition-colors', index === cur ? 'bg-sky-500' : 'bg-muted-foreground/40 group-hover:bg-muted-foreground')} />
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      ) : (
        <nav aria-label="Chapters" className="mt-10 flex justify-between gap-4 border-t pt-6">
          {previousChapter ? <PageLink to={`/${previousChapter.slug}`} dir="prev" label={previousChapter.title} /> : <span />}
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
        'group flex min-h-6 min-w-0 items-center gap-2 rounded-md py-2 text-sm',
        primary ? 'max-sm:min-h-11 font-medium hover:text-sky-700 dark:hover:text-sky-400' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {dir === 'prev' && <ArrowLeft aria-hidden className="size-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />}
      <span className={cn('truncate', dir === 'prev' && 'max-sm:sr-only')}>{dir === 'prev' ? 'Back' : 'Next'}: {label}</span>
      {dir === 'next' && <ArrowRight aria-hidden className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />}
    </Link>
  )
}
