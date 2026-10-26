import { Link } from 'react-router'
import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { CHAPTERS } from '@/chapters'
import { Decomposition } from '@/components/Decomposition'
import { resetProgress, useProgress } from '@/lib/progress'

const blurbs: Record<string, string> = {
  'what-is-data-vault': 'Hubs, links and satellites, unified decomposition, and where the vault sits between sources and marts.',
  modelling: 'Customers, nations and orders, modelled step by step with the nine-step Data Vault method.',
  dbt: 'The same model as datavault4dbt code: stage YAML, then one macro call per hub, link and satellite.',
  'hash-lab': 'Type a business key and watch it get trimmed, upper-cased, concatenated and hashed.',
  'load-player': 'Play three daily loads and watch rows flow, or get skipped, as the vault grows insert-only.',
  'satellite-flavours': 'End-dating, multi-active, effectivity and record-tracking satellites on a timeline.',
  pit: 'Drag a snapshot slider and see PIT pointers pick the valid version from each satellite.',
  'dbt-project': 'The full lineage graph from seed to mart. Click any node to read its model.',
}

export function Home() {
  const { last } = useProgress()
  const lastChapter = last && CHAPTERS.find((c) => c.slug === last.slug)
  const resume = lastChapter ? { chapter: lastChapter, section: last.section, sectionTitle: last.sectionTitle } : null
  return (
    <div>
      <section className="grid items-center gap-10 py-6 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-4 inline-flex rounded-full border px-3 py-1 font-mono text-xs text-muted-foreground">
            interactive guide · datavault4dbt
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-4xl font-semibold leading-tight tracking-tight md:text-6xl"
          >
            Data Vault, <span className="bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-400 bg-clip-text text-transparent">modelled</span> and{' '}
            <span className="bg-gradient-to-r from-amber-400 to-violet-400 bg-clip-text text-transparent">built with dbt</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mt-6 max-w-xl text-lg text-muted-foreground">
            We take three ordinary datasets (customers, nations and orders), model them as a Data Vault, then build that vault with dbt.
            Every diagram is clickable and every code sample is real datavault4dbt.
          </motion.p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mt-8 flex flex-wrap items-center gap-3">
            {resume ? (
              <Link
                to={`/${resume.chapter.slug}${resume.section ? `/${resume.section}` : ''}`}
                className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:opacity-90"
              >
                Continue: {resume.chapter.title}
                {resume.sectionTitle ? `, ${resume.sectionTitle}` : ''} <ArrowRight className="size-4" />
              </Link>
            ) : (
              <Link to={`/${CHAPTERS[0].slug}`} className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:opacity-90">
                Start reading <ArrowRight className="size-4" />
              </Link>
            )}
            <Link to="/modelling" className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted">
              Jump to the modelling
            </Link>
            {resume && (
              <button type="button" onClick={resetProgress} className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
                Start over
              </button>
            )}
          </motion.div>
        </div>
        <Decomposition auto />
      </section>

      <section className="mt-16 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CHAPTERS.map((c, i) => (
          <div key={c.slug}>
            <Link to={`/${c.slug}`} className="group block h-full rounded-xl border bg-card/50 p-5 transition-colors hover:border-sky-500/50 hover:bg-card">
              <div className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, '0')}</div>
              <div className="mt-2 font-semibold group-hover:text-sky-400">{c.title}</div>
              <p className="mt-2 text-sm text-muted-foreground">{blurbs[c.slug]}</p>
            </Link>
          </div>
        ))}
      </section>
    </div>
  )
}
