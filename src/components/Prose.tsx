import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { CHAPTERS } from '@/chapters'

export function ChapterHeader({ n, title, lead }: { n: number; title: string; lead: ReactNode }) {
  return (
    <header className="mb-10">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-2 font-mono text-sm text-sky-700 dark:text-sky-400">
        Chapter {n} of {CHAPTERS.length} · about {CHAPTERS[n - 1].minutes} min
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        id="chapter-title"
        tabIndex={-1}
        className="text-4xl font-semibold tracking-tight outline-none md:text-5xl"
      >
        {title}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mt-4 max-w-3xl text-lg text-muted-foreground"
      >
        {lead}
      </motion.p>
      <section aria-label="In 30 seconds" className="mt-6 max-w-3xl rounded-xl border bg-card/60 px-4 py-3">
        <h2 className="mb-1.5 text-sm font-semibold">In 30 seconds</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-foreground/85">
          {CHAPTERS[n - 1].summary.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>
    </header>
  )
}

export const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export function Section({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn('mb-14', className)}>
      {title && (
        <h2 id={slugify(title)} tabIndex={-1} className="mb-4 scroll-mt-20 outline-none text-2xl font-semibold tracking-tight">
          {title}
        </h2>
      )}
      {children}
    </section>
  )
}

export function P({ children }: { children: ReactNode }) {
  return <p className="mb-4 max-w-3xl leading-7 text-foreground/85">{children}</p>
}

export function Callout({ kind = 'info', title, children }: { kind?: 'info' | 'warn' | 'tip'; title: string; children: ReactNode }) {
  const tone = {
    info: 'border-sky-500/40 bg-sky-500/5',
    warn: 'border-amber-500/40 bg-amber-500/5',
    tip: 'border-emerald-500/40 bg-emerald-500/5',
  }[kind]
  return (
    <div className={cn('my-6 max-w-3xl rounded-xl border-l-4 px-5 py-4', tone)}>
      <div className="mb-1 font-semibold">{title}</div>
      <div className="text-sm leading-6 text-foreground/80">{children}</div>
    </div>
  )
}

export function Code({ children }: { children: ReactNode }) {
  return <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">{children}</code>
}
