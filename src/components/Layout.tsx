import { Suspense, useEffect, useState, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { ArrowLeft, ArrowRight, Moon, Sun, Check } from 'lucide-react'
import { motion } from 'motion/react'
import { CHAPTERS } from '@/chapters'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { markDone, setLast, useProgress } from '@/lib/progress'

function useTheme() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') !== 'light')
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])
  return [dark, setDark] as const
}

export function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
      <line x1="9" y1="10" x2="23" y2="10" className="stroke-emerald-400" strokeWidth="2" />
      <line x1="9" y1="10" x2="16" y2="24" className="stroke-emerald-400" strokeWidth="2" />
      <line x1="23" y1="10" x2="16" y2="24" className="stroke-amber-400" strokeWidth="2" />
      <circle cx="9" cy="10" r="4.5" className="fill-sky-500" />
      <circle cx="23" cy="10" r="4.5" className="fill-sky-500" />
      <rect x="12" y="20" width="8" height="8" rx="2" className="fill-amber-400" />
    </svg>
  )
}

/** The chapter's h2 sections and the one currently near the top of the viewport. */
function useSections(pathname: string) {
  const [sections, setSections] = useState<{ id: string; title: string }[]>([])
  const [active, setActive] = useState<{ path: string; id: string }>()
  useEffect(() => {
    const main = document.querySelector('main')
    if (!main) return
    let io: IntersectionObserver | undefined
    let seen = ''
    const scan = () => {
      const hs = [...main.querySelectorAll<HTMLElement>('h2[id]')]
      const ids = hs.map((h) => h.id).join(' ')
      if (ids === seen) return
      seen = ids
      setSections(hs.map((h) => ({ id: h.id, title: h.textContent ?? '' })))
      io?.disconnect()
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) if (e.isIntersecting) setActive({ path: pathname, id: e.target.id })
        },
        { rootMargin: '0px 0px -70% 0px' },
      )
      hs.forEach((h) => io!.observe(h))
    }
    scan()
    const mo = new MutationObserver(scan)
    mo.observe(main, { childList: true, subtree: true })
    return () => {
      mo.disconnect()
      io?.disconnect()
    }
  }, [pathname])
  return { sections, active: active?.path === pathname ? active.id : undefined }
}

export function Layout() {
  const [dark, setDark] = useTheme()
  const { pathname, search } = useLocation()
  const idx = CHAPTERS.findIndex((c) => pathname.endsWith(c.slug))
  const prev = idx > 0 ? CHAPTERS[idx - 1] : null
  const next = idx >= 0 && idx < CHAPTERS.length - 1 ? CHAPTERS[idx + 1] : idx === -1 ? CHAPTERS[0] : null

  const chapter = idx >= 0 ? CHAPTERS[idx] : null
  const progress = useProgress()
  const doneCount = CHAPTERS.filter((c) => progress.done.includes(c.slug)).length
  const { sections, active } = useSections(pathname)
  const footer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const target = new URLSearchParams(search).get('s')
    if (!target) {
      window.scrollTo({ top: 0 })
      return
    }
    let tries = 0
    const t = setInterval(() => {
      const el = document.getElementById(target)
      if (el || ++tries > 30) {
        clearInterval(t)
        el?.scrollIntoView({ block: 'start' })
      }
    }, 100)
    return () => clearInterval(t)
  }, [pathname, search])

  useEffect(() => {
    if (chapter) setLast(chapter.slug, active, sections.find((s) => s.id === active)?.title)
  }, [chapter, active, sections])

  useEffect(() => {
    const el = footer.current
    if (!el || !chapter) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && window.scrollY > 200 && document.querySelector('main h1')) markDone(chapter.slug)
    })
    io.observe(el)
    return () => io.disconnect()
  }, [chapter])

  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(60rem_30rem_at_80%_-10%,rgba(56,189,248,0.08),transparent),radial-gradient(40rem_30rem_at_-10%_110%,rgba(245,158,11,0.06),transparent)]" />
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[90rem] items-center gap-3 px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Logo />
            <span className="sr-only sm:not-sr-only">The dbt + Data Vault guide</span>
          </Link>
          <nav className="ml-4 flex flex-1 gap-1 overflow-x-auto lg:hidden">
            {CHAPTERS.map((c, i) => (
              <NavLink
                key={c.slug}
                to={`/${c.slug}`}
                className={({ isActive }) =>
                  cn('whitespace-nowrap rounded-md px-2 py-1 text-xs', isActive ? 'bg-muted font-medium' : 'text-muted-foreground')
                }
              >
                {i + 1}. {c.short}
                {progress.done.includes(c.slug) && (
                  <>
                    <Check aria-hidden className="ml-1 inline size-3 text-emerald-700 dark:text-emerald-400" />
                    <span className="sr-only"> (done)</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => setDark(!dark)}>
              {dark ? <Sun /> : <Moon />}
            </Button>
            <a
              href="https://github.com/peterampazzo/the-dbt-datavault-modern-guide"
              aria-label="GitHub"
              className="inline-flex size-9 items-center justify-center rounded-md hover:bg-muted"
            >
              <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden><path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.2-3.1-.1-.4-.5-1.6.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.7 1.6.2 2.8.1 3.2.8.8 1.2 1.9 1.2 3.1 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z"/></svg>
            </a>
          </div>
        </div>
        <div
          role="progressbar"
          aria-label="Chapters done"
          aria-valuemin={0}
          aria-valuemax={CHAPTERS.length}
          aria-valuenow={doneCount}
          aria-valuetext={`${doneCount} of ${CHAPTERS.length} chapters done`}
          className="h-0.5 bg-muted"
        >
          <div className="h-full bg-sky-500 transition-[width] duration-500" style={{ width: `${(doneCount / CHAPTERS.length) * 100}%` }} />
        </div>
      </header>
      <div className="relative mx-auto flex max-w-[90rem]">
        <aside className="sticky top-14 hidden h-[calc(100svh-3.5rem)] w-64 shrink-0 overflow-y-auto border-r px-3 py-6 lg:block">
          <div className="mb-3 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Chapters</div>
          <ol className="space-y-0.5">
            {CHAPTERS.map((c, i) => (
              <li key={c.slug}>
                <NavLink
                  to={`/${c.slug}`}
                  className={({ isActive }) =>
                    cn(
                      'relative flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors',
                      isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span layoutId="nav-active" className="absolute inset-0 rounded-lg bg-muted" transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }} />
                      )}
                      <span className={cn('relative font-mono text-xs', isActive ? 'text-foreground' : 'text-muted-foreground')}>{String(i + 1).padStart(2, '0')}</span>
                      <span className="relative">{c.title}</span>
                      {progress.done.includes(c.slug) && (
                        <>
                          <Check aria-hidden className="relative ml-auto size-3.5 shrink-0 text-emerald-700 dark:text-emerald-400" />
                          <span className="sr-only"> (done)</span>
                        </>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ol>
          <div className="mt-8 space-y-1.5 px-2 text-xs text-muted-foreground">
            <div className="font-medium uppercase tracking-wider">Legend</div>
            {[
              ['bg-sky-500', 'Hub', '_h'],
              ['bg-emerald-500', 'Link', '_l'],
              ['bg-amber-500', 'Satellite', '_s'],
              ['bg-violet-500', 'Business vault', '_pit, _sn'],
            ].map(([c, l, suffix]) => (
              <div key={l} className="flex items-center gap-2">
                <span className={cn('size-2.5 rounded-sm', c)} /> {l}
                <span className="font-mono text-[10px] text-muted-foreground/80">{suffix}</span>
              </div>
            ))}
          </div>
        </aside>
        <main className="relative min-w-0 flex-1 px-4 py-10 md:px-10">
          <Suspense fallback={<div className="h-96 rounded-xl motion-safe:animate-pulse bg-muted/40" />}>
            <Outlet />
          </Suspense>
          <div ref={footer} className="mt-16 flex justify-between gap-4 border-t pt-6">
            {prev ? (
              <Link to={`/${prev.slug}`} className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" /> {prev.title}
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link to={`/${next.slug}`} className="group flex items-center gap-2 text-sm font-medium hover:text-sky-400">
                {next.title} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>
        </main>
        {chapter && sections.length > 1 && (
          <nav aria-label="On this page" className="sticky top-14 hidden h-[calc(100svh-3.5rem)] w-52 shrink-0 overflow-y-auto py-10 pr-4 xl:block">
            <div className="mb-2 text-xs font-medium text-muted-foreground">On this page</div>
            <ul className="space-y-1 border-l text-sm">
              {sections.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    aria-current={active === s.id ? 'location' : undefined}
                    onClick={() => document.getElementById(s.id)?.scrollIntoView({ block: 'start' })}
                    className={cn(
                      '-ml-px border-l-2 py-0.5 pl-3 text-left',
                      active === s.id ? 'border-sky-500 text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {s.title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </div>
  )
}
