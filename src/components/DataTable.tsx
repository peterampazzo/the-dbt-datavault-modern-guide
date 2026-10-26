import { AnimatePresence, motion } from 'motion/react'
import type { Cell, Decision, Row } from '@/lib/dv/engine'
import { isGhost, REASON_LABEL, short } from '@/lib/dv/engine'
import { cn } from '@/lib/utils'

export type Tone = 'hub' | 'link' | 'sat' | 'stage' | 'bv' | 'seed'

const toneHeader: Record<Tone, string> = {
  hub: 'text-sky-700 dark:text-sky-400',
  link: 'text-emerald-700 dark:text-emerald-400',
  sat: 'text-amber-700 dark:text-amber-400',
  stage: 'text-slate-300',
  bv: 'text-violet-700 dark:text-violet-400',
  seed: 'text-zinc-600 dark:text-zinc-400',
}

function fmt(v: Cell) {
  if (v === null || v === undefined) return <span className="text-muted-foreground/60">NULL</span>
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  return String(short(v))
}

interface Props {
  title: string
  tone: Tone
  rows: Row[]
  columns?: string[]
  /** rows inserted by the current step, matched by identity key */
  fresh?: Set<string>
  rowKey?: (r: Row) => string
  skipped?: Decision[]
  hideGhosts?: boolean
  highlightRow?: (r: Row) => boolean
  className?: string
  maxHeight?: string
}

export const defaultRowKey = (r: Row) => JSON.stringify(Object.entries(r).filter(([k]) => k !== '__ghost'))

export function DataTable({
  title,
  tone,
  rows,
  columns,
  fresh,
  rowKey = defaultRowKey,
  skipped,
  hideGhosts,
  highlightRow,
  className,
  maxHeight = 'max-h-80',
}: Props) {
  const visible = hideGhosts ? rows.filter((r) => !isGhost(r)) : rows
  const cols = columns ?? Object.keys(visible[0] ?? {}).filter((c) => c !== '__ghost')
  return (
    <div className={cn('flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card/60', className)}>
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className={cn('font-mono text-xs font-semibold', toneHeader[tone])}>{title}</span>
        <span className="text-xs tabular-nums text-muted-foreground">{visible.length} rows</span>
      </div>
      <div tabIndex={0} role="region" aria-label={title} className={cn('overflow-auto outline-none focus-visible:ring-2 focus-visible:ring-ring/50', maxHeight)}>
        <table className="w-full border-collapse font-mono text-[11.5px]">
          <thead className="sticky top-0 z-10 bg-card">
            <tr>
              {cols.map((c) => (
                <th key={c} className="whitespace-nowrap px-2.5 py-1.5 text-left font-medium text-muted-foreground">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {visible.map((r) => {
                const k = rowKey(r)
                const isFresh = fresh?.has(k)
                const ghost = isGhost(r)
                return (
                  <motion.tr
                    key={k}
                    initial={{ opacity: 0, x: -24, backgroundColor: 'rgba(16,185,129,0.35)' }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      backgroundColor: isFresh ? 'rgba(16,185,129,0.14)' : highlightRow?.(r) ? 'rgba(56,189,248,0.14)' : 'rgba(0,0,0,0)',
                    }}
                    exit={{ opacity: 0, transition: { duration: 0 } }}
                    transition={{ duration: 0.35 }}
                    className={cn('border-t border-border/60', ghost && 'italic text-muted-foreground')}
                  >
                    {cols.map((c) => (
                      <td key={c} className="whitespace-nowrap px-2.5 py-1">
                        {fmt(r[c])}
                      </td>
                    ))}
                  </motion.tr>
                )
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      {skipped && skipped.length > 0 && (
        <div className="border-t bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
          <div className="mb-1 font-medium">Skipped this run</div>
          <div className="flex flex-wrap gap-1.5">
            {skipped.map((d, i) => (
              <span key={i} className={cn('rounded-md border px-1.5 py-0.5 font-mono', d.ghost && 'opacity-60')}>
                {String(d.row.c_custkey ?? d.row.n_nationkey ?? d.row.o_orderkey ?? short(Object.values(d.row)[0]))}
                {d.row.phone_type ? `/${d.row.phone_type}` : ''} · {d.reason ? REASON_LABEL[d.reason] : ''}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
