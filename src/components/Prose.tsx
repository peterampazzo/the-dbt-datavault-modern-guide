import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { CHAPTERS, PARTS } from '@/chapters'
import { useLocation } from 'react-router'

export function ChapterHeader({ title, lead }: { title: ReactNode; lead: ReactNode }) {
  const { pathname } = useLocation()
  const slug = pathname.split('/').filter(Boolean)[0]
  const n = CHAPTERS.findIndex((chapter) => chapter.slug === slug) + 1
  const chapter = CHAPTERS[n - 1]
  const part = PARTS.find((entry) => entry.n === chapter.part)
  return (
    <header className="mx-auto mb-12 max-w-[40rem]">
      <motion.div initial={{ y: 8 }} animate={{ y: 0 }} className="mb-2 font-sans text-sm tabular-nums text-sky-700 dark:text-sky-400">
        Chapter {n} of {CHAPTERS.length} · Part {chapter.part}: {part?.title} · about {chapter.minutes} min
      </motion.div>
      <motion.h1
        initial={{ y: 12 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.05 }}
        id="chapter-title"
        tabIndex={-1}
        className="font-serif text-4xl font-semibold tracking-tight outline-none md:text-6xl"
      >
        {title}
      </motion.h1>
      <motion.p
        initial={{ y: 8 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.15 }}
        className="mt-5 max-w-3xl font-serif text-lg leading-7 text-foreground/90"
      >
        {lead}
      </motion.p>
      <section aria-label="In 30 seconds" className="mt-8 max-w-3xl rounded-xl border bg-card/60 px-4 py-3 text-left">
        <h2 className="mb-1.5 text-sm font-semibold">In 30 seconds</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-foreground/85">
          {chapter.summary.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>
    </header>
  )
}

export const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export function Section({
  title,
  children,
  className,
  lead,
  keyPoint,
  pageNumber,
  sectionId,
}: {
  title?: string
  children: ReactNode
  className?: string
  lead?: ReactNode
  keyPoint?: ReactNode
  pageNumber?: string
  sectionId?: string
}) {
  return (
    <section id={!title ? sectionId : undefined} tabIndex={!title ? -1 : undefined} data-reading-section className={cn('mb-12', className)}>
      {title && (
        <h2 id={slugify(title)} tabIndex={-1} className="mx-auto mb-4 max-w-[40rem] scroll-mt-20 font-serif text-3xl font-semibold tracking-tight outline-none">
          {pageNumber && <span aria-hidden className="mr-2 font-sans text-sm font-normal tabular-nums text-muted-foreground">{pageNumber}</span>}
          {title}
        </h2>
      )}
      {lead && <p className="mb-5 max-w-3xl font-serif text-lg leading-7 text-foreground/90">{lead}</p>}
      {children}
      {keyPoint && (
        <p className="mt-6 max-w-3xl font-serif text-lg leading-7 text-foreground/90">
          <strong>Key point:</strong> {keyPoint}
        </p>
      )}
    </section>
  )
}

export function RecapExtras({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export function P({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('mb-4 max-w-3xl font-serif text-lg leading-7 text-foreground/90', className)}>{children}</p>
}

export function Callout({ kind = 'info', title, children }: { kind?: 'info' | 'warn' | 'tip'; title: string; children: ReactNode }) {
  const tone = {
    info: 'border-sky-500/40 bg-sky-500/5',
    warn: 'border-amber-500/40 bg-amber-500/5',
    tip: 'border-emerald-500/40 bg-emerald-500/5',
  }[kind]
  return (
    <div className={cn('my-6 max-w-3xl rounded-xl border px-5 py-4', tone)}>
      <div className="mb-1 font-sans font-semibold">{title}</div>
      <div className="font-serif text-lg leading-7 text-foreground/90">{children}</div>
    </div>
  )
}

export function Code({ children }: { children: ReactNode }) {
  return <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground text-[0.85em]">{children}</code>
}
