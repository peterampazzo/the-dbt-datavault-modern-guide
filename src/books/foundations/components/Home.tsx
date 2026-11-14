import { Link } from 'react-router'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useProgress } from '@/lib/progress'
import { CHAPTERS, PARTS } from '../chapters'

export function Home() {
  const { last, done } = useProgress()
  const resume = last && CHAPTERS.find((chapter) => chapter.slug === last.slug)
  return (
    <div className="mx-auto max-w-[40rem]">
      <a href="#/" className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline">
        <ArrowLeft aria-hidden className="size-4" /> All books
      </a>
      <p className="font-sans text-sm font-medium text-violet-700 dark:text-violet-400">Build it right · Foundations</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-balance">Shipping code in the age of AI tools</h1>
      <p className="mt-4 text-lg leading-8 text-muted-foreground">
        Tools like Claude Code, Codex and Lovable write code for you. They run it in a terminal, save it with git and check it in CI. This book shows what
        happens under the hood, so you can tell where the code runs, what changed, how to undo it and why a check went red.
      </p>
      <p className="mt-3 leading-7 text-muted-foreground">
        No programming needed and nothing to install: each page has a practice terminal that runs in your browser. Python and R are run, not taught.
      </p>
      <div className="mt-6">
        <Link
          to={`/${resume ? resume.slug : CHAPTERS[0].slug}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background hover:opacity-90"
        >
          {resume ? `Continue: ${resume.title}` : `Start: ${CHAPTERS[0].title}`} <ArrowRight aria-hidden className="size-4" />
        </Link>
      </div>
      {PARTS.map((part) => (
        <section key={part.n} aria-labelledby={`fpart-${part.n}`} className="mt-10">
          <h2 id={`fpart-${part.n}`} className="text-sm font-semibold text-foreground/70">
            Part {part.n}: {part.title}
          </h2>
          <ol className="mt-2 divide-y rounded-xl border">
            {CHAPTERS.filter((chapter) => chapter.part === part.n).map((chapter, i) => (
              <li key={chapter.slug}>
                <Link to={`/${chapter.slug}`} className="flex min-h-11 items-center gap-3 px-4 py-3 hover:bg-muted">
                  <span className="font-sans text-xs tabular-nums text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
                  <span className="flex-1">
                    <span className="font-medium">{chapter.title}</span>
                    <span className="block text-sm text-muted-foreground">{chapter.summary[0]}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{chapter.minutes} min</span>
                  {done.includes(chapter.slug) && (
                    <>
                      <Check aria-hidden className="size-4 text-emerald-700 dark:text-emerald-400" />
                      <span className="sr-only"> (done)</span>
                    </>
                  )}
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ))}
      <p className="mt-6 text-sm text-muted-foreground">Next up: drafts and approvals, undo, reproducible setup, CI and troubleshooting. Those modules are on the way.</p>
    </div>
  )
}
