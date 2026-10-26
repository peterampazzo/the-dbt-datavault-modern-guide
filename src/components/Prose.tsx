import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

export function ChapterHeader({ n, title, lead }: { n: number; title: string; lead: ReactNode }) {
  return (
    <header className="mb-10">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-2 font-mono text-sm text-sky-400">
        Chapter {n}
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="text-4xl font-semibold tracking-tight md:text-5xl"
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
    </header>
  )
}

export function Section({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5 }}
      className={cn('mb-14', className)}
    >
      {title && <h2 className="mb-4 text-2xl font-semibold tracking-tight">{title}</h2>}
      {children}
    </motion.section>
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
