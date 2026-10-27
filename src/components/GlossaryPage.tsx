import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { CHAPTERS } from '@/chapters'
import { GLOSSARY } from '@/lib/glossary'

export function GlossaryPage() {
  const [filter, setFilter] = useState('')
  const { hash } = useLocation()
  const entries = useMemo(() => {
    const query = filter.trim().toLocaleLowerCase()
    return [...GLOSSARY]
      .sort((a, b) => a.term.localeCompare(b.term, undefined, { sensitivity: 'base' }))
      .filter((entry) => !query || [entry.term, entry.definition, entry.aka].some((value) => value?.toLocaleLowerCase().includes(query)))
  }, [filter])

  useEffect(() => {
    const id = decodeURIComponent(hash.slice(1))
    if (!id) return
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }))
  }, [hash])

  return (
    <article className="mx-auto max-w-4xl">
      <header className="mb-8 max-w-[75ch]">
        <h1 className="text-4xl font-semibold tracking-tight">Glossary</h1>
        <p className="mt-3 text-muted-foreground">Plain definitions for the terms used in this guide.</p>
      </header>
      <div className="mb-6 max-w-xl">
        <label htmlFor="glossary-filter" className="mb-2 block text-sm font-medium">Filter terms</label>
        <input
          id="glossary-filter"
          type="search"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Search terms or definitions"
          className="min-h-11 w-full rounded-lg border bg-background px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <p aria-live="polite" className="mt-2 text-sm text-muted-foreground">
          {entries.length} {entries.length === 1 ? 'term' : 'terms'}
        </p>
      </div>
      <nav aria-label="Glossary terms" className="mb-8 rounded-xl border bg-card/50 p-4">
        <ul className="flex flex-wrap gap-x-4 gap-y-2">
          {entries.map((entry) => (
            <li key={entry.id}>
              <Link to={`/glossary#${entry.id}`} className="inline-flex min-h-6 items-center text-sm underline decoration-dotted underline-offset-4">
                {entry.term}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {entries.length ? (
        <dl className="space-y-5">
          {entries.map((entry) => (
            <div id={entry.id} key={entry.id} className="scroll-mt-20 border-b pb-4">
              <dt className="text-lg font-semibold">{entry.term}</dt>
              <dd className="mt-1 max-w-[75ch] leading-7 text-foreground/85">{entry.definition}</dd>
              {entry.aka && <dd className="mt-1 text-sm text-muted-foreground">Also called: {entry.aka}</dd>}
              <dd className="mt-2">
                <Link to={`/${entry.chapter}`} className="inline-flex min-h-6 items-center text-sm text-sky-700 underline underline-offset-4 dark:text-sky-400">
                  Read more in {CHAPTERS.find((chapter) => chapter.slug === entry.chapter)?.title}
                </Link>
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p>No terms match that filter.</p>
      )}
    </article>
  )
}
