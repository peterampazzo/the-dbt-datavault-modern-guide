import { Link } from 'react-router'
import { motion } from 'motion/react'
import { ArrowRight, Check } from 'lucide-react'
import { CHAPTERS, PARTS } from '@/chapters'
import { Decomposition } from '@/components/Decomposition'
import { Button } from '@/components/ui/button'
import { resetProgress, useProgress } from '@/lib/progress'
import { getFirstPathChapter, setReadingPath, usePages, useReadingPath, type ReadingPath } from '@/lib/reading'

const blurbs: Record<string, string> = {
  'what-is-data-vault': 'Learn the vault building blocks and follow data from source deliveries to reporting.',
  modelling: 'Customers, nations and orders, modelled step by step with the nine-step Data Vault method.',
  'dv-names': 'A quick map from familiar Data Vault terms to their model and macro names.',
  'dbt-primer': 'Plain dbt models are SQL SELECTs; source() and ref() name inputs and dependencies.',
  dbt: 'The same model as datavault4dbt code: stage YAML, then one macro call per hub, link and satellite.',
  'hash-lab': 'Type a business key and watch it get trimmed, upper-cased, concatenated and hashed.',
  'load-player': 'Play three daily loads and watch rows flow, or get skipped, as the vault grows insert-only.',
  'satellite-flavours': 'End-dating, multi-active, effectivity and record-tracking satellites on a timeline.',
  pit: 'Drag a snapshot slider and see PIT pointers pick the valid version from each satellite.',
  'dbt-project': 'The full lineage graph from seed to mart. Click any node to read its model.',
  replay: 'Persistent staging preserves the source deliveries; the raw vault is a derived view of them.',
  'one-lake': 'Open Delta files can hold source history while different Spark engines read them in place.',
  'modern-way': 'A model change moves through a branch, pull request, CI, review, merge and deployment.',
  scheduling: 'Deliveries trigger runs; dbt preserves dependency order, tests and output gates.',
  'from-sql-server': 'Compare seven hand-written loading patterns with dbt models and metadata.',
  'hash-parity': 'Compare legacy and datavault4dbt hash settings with fixed business-key vectors.',
  'business-vault': 'Keep reusable precedence and calculations in a business vault above the raw history.',
  'migration-checklist': 'Track a migration through eight observable gates before cut-over.',
}

const paths: { id: ReadingPath; title: string; description: string }[] = [
  { id: 'full', title: 'New to Data Vault and dbt', description: 'Build the foundations, then follow the complete guide.' },
  { id: 'dv-practitioner', title: 'I know Data Vault, new to dbt', description: 'Start with Data Vault model names, then build and load with dbt.' },
  { id: 'browse', title: 'Just browsing', description: 'Pick any chapter and read in any order.' },
]

export function Home() {
  const { last, done } = useProgress()
  const readingPath = useReadingPath()
  const published = usePages()
  const lastChapter = last && CHAPTERS.find((chapter) => chapter.slug === last.slug)
  const publishedPage = last && published.slug === last.slug
    ? published.pages.findIndex((page) => page.id === last.section)
    : -1
  const resume = lastChapter ? {
    chapter: lastChapter,
    chapterNumber: CHAPTERS.findIndex((chapter) => chapter.slug === lastChapter.slug) + 1,
    section: last?.section,
    sectionTitle: last?.sectionTitle,
    sectionNumber: last?.sectionNumber ?? (publishedPage > 0 ? publishedPage : undefined),
  } : null
  const resumeSectionTitle = resume?.sectionTitle?.replace(/^\d+(?:\.\d+)?\s*/, '')
  const continueLabel = resume
    ? `Continue: chapter ${resume.chapterNumber}${resume.section === 'recap'
      ? ', recap'
      : resume.section
        ? `, ${[resume.sectionNumber ? `${resume.chapterNumber}.${resume.sectionNumber}` : undefined, resumeSectionTitle ?? resume.section].filter(Boolean).join(' ')}`
        : ''}`
    : ''

  return (
    <div className="mx-auto max-w-[40rem]">
      <section aria-labelledby="home-title" className="py-6">
        <motion.h1
          id="home-title"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="font-serif text-4xl font-semibold leading-tight tracking-tight md:text-6xl"
        >
          Data Vault, modelled and built with dbt
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mt-6 max-w-3xl font-serif text-lg leading-7 text-foreground/90"
        >
          We take three ordinary datasets (customers, nations and orders), model them as a Data Vault, then build that vault with dbt.
          Every diagram is clickable and every code sample is real datavault4dbt.
        </motion.p>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mt-8 flex flex-wrap items-center gap-3">
          {resume ? (
            <Link
              to={`/${resume.chapter.slug}${resume.section ? `/${resume.section}` : ''}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:opacity-90"
            >
              {continueLabel} <ArrowRight aria-hidden className="size-4" />
            </Link>
          ) : (
            <Link to={`/${CHAPTERS[0].slug}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:opacity-90">
              Start reading <ArrowRight aria-hidden className="size-4" />
            </Link>
          )}
          {resume && (
            <button type="button" onClick={resetProgress} className="min-h-11 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
              Start over
            </button>
          )}
        </motion.div>
        <div className="mt-8 max-w-[40rem]">
          <Decomposition auto />
        </div>
      </section>

      <section aria-labelledby="readers-heading" className="mt-12">
        <h2 id="readers-heading" className="mb-4 font-serif text-2xl font-semibold tracking-tight">Who is this for</h2>
        <ul className="space-y-6">
          {paths.map((path) => (
            <li key={path.id} className="border-b pb-5 last:border-0">
              <Button
                variant="ghost"
                className="h-auto min-h-11 px-2 text-left font-semibold aria-pressed:bg-muted"
                aria-pressed={readingPath === path.id}
                onClick={() => setReadingPath(path.id)}
              >
                {path.title}
              </Button>
              <p className="mt-2 font-serif text-lg leading-7 text-foreground/90">{path.description}</p>
              <Link
                to={`/${getFirstPathChapter(path.id)}`}
                aria-label={`Start this path: ${path.title}`}
                onClick={() => setReadingPath(path.id)}
                className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-sky-700 hover:underline dark:text-sky-400"
              >
                Start this path <ArrowRight aria-hidden className="size-4" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="contents-heading" className="mt-16">
        <h2 id="contents-heading" className="mb-6 font-serif text-2xl font-semibold tracking-tight">Contents</h2>
        {PARTS.map((part) => {
          const chapters = CHAPTERS.map((chapter, index) => ({ chapter, index })).filter(({ chapter }) => chapter.part === part.n)
          return (
            <section key={part.n} aria-labelledby={`home-part-${part.n}`} className="mb-10 last:mb-0">
              <h3 id={`home-part-${part.n}`} className="mb-3 font-serif text-xl font-semibold">Part {part.n}: {part.title}</h3>
              <ol className="space-y-4">
                {chapters.map(({ chapter, index }) => (
                  <li key={chapter.slug} className="border-b pb-3 last:border-0">
                    <div className="flex min-w-0 items-baseline gap-2">
                      <span className="w-7 shrink-0 font-sans text-sm tabular-nums text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
                      <Link to={`/${chapter.slug}`} className="min-w-0 flex-1 font-sans font-semibold leading-6 hover:text-sky-700 dark:hover:text-sky-400">
                        {chapter.title}
                      </Link>
                      <span className="shrink-0 text-xs text-muted-foreground">about {chapter.minutes} min</span>
                      {done.includes(chapter.slug) && (
                        <>
                          <Check aria-hidden className="size-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
                          <span className="sr-only"> (done)</span>
                        </>
                      )}
                    </div>
                    <p className="mt-1 font-serif text-lg leading-7 text-muted-foreground">{blurbs[chapter.slug]}</p>
                  </li>
                ))}
              </ol>
            </section>
          )
        })}
      </section>
    </div>
  )
}
