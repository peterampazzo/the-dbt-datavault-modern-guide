import { motion } from 'motion/react'
import { File, Folder, MapPin } from 'lucide-react'
import { FS, type ShellEvent } from '@/books/foundations/lib/shell/shell'
import { HOME, display, sortNames, split, type FsNode } from '@/books/foundations/lib/shell/fs'
import { cn } from '@/lib/utils'

const ROW = 28

type Row = { path: string; name: string; depth: number; dir: boolean }

function rows(node: FsNode, path = '', depth = 0, out: Row[] = []): Row[] {
  if (node.kind !== 'dir') return out
  for (const name of sortNames(Object.keys(node.children))) {
    const child = node.children[name]
    const p = `${path}/${name}`
    out.push({ path: p, name, depth, dir: child.kind === 'dir' })
    if (p !== '/usr') rows(child, p, depth + 1, out)
  }
  return out
}

const ROWS: Row[] = [{ path: '/', name: '/', depth: 0, dir: true }, ...rows(FS, '', 1)]

export function relativePath(from: string, to: string) {
  const a = split(from)
  const b = split(to)
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  const up = a.slice(i).map(() => '..')
  return [...up, ...b.slice(i)].join('/') || '.'
}

const parent = (path: string) => '/' + split(path).slice(0, -1).join('/')

export function FolderTree({
  cwd,
  event,
  selected,
  onSelect,
}: {
  cwd: string
  event?: ShellEvent
  selected?: string
  onSelect?: (path: string) => void
}) {
  const here = Math.max(0, ROWS.findIndex((r) => r.path === cwd))
  const glow = event?.kind === 'list' || event?.kind === 'read' || event?.kind === 'ran' ? event.path : undefined
  const looked = event?.kind === 'missing' ? event.looked : undefined
  const lookedRow = looked && (ROWS.some((r) => r.path === looked) ? looked : parent(looked))
  const actual = event?.kind === 'missing' ? event.actual : undefined

  return (
    <figure className="overflow-x-auto rounded-xl border bg-card/60 p-3" aria-label="Folder tree of the practice machine">
      <div className="relative min-w-max" style={{ height: ROWS.length * ROW }}>
        <motion.div
          aria-hidden
          className="pointer-events-none absolute right-0 left-0 rounded-md bg-sky-500/10 ring-1 ring-sky-500/40"
          style={{ height: ROW }}
          initial={false}
          animate={{ y: here * ROW }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        />
        <ul className="relative">
          {ROWS.map((r) => {
            const isHere = r.path === cwd
            const status = r.path === lookedRow ? 'looked' : r.path === actual ? 'actual' : r.path === glow ? 'glow' : undefined
            const Icon = r.dir ? Folder : File
            const label = (
              <>
                <Icon size={14} aria-hidden className={r.dir ? 'text-sky-600 dark:text-sky-400' : 'text-muted-foreground'} />
                <span className="font-mono text-[13px]">
                  {r.name}
                  {r.dir && r.path !== '/' ? '/' : ''}
                </span>
                {r.path === HOME && <span className="font-mono text-xs text-muted-foreground">(~)</span>}
              </>
            )
            return (
              <li key={r.path} className="flex items-center" style={{ height: ROW, paddingLeft: r.depth * 16 + 4 }}>
                {r.dir && onSelect ? (
                  <button
                    type="button"
                    onClick={() => onSelect(r.path)}
                    aria-pressed={selected === r.path}
                    className={cn(
                      'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded px-1 hover:bg-muted focus-visible:outline-2 focus-visible:outline-sky-500',
                      selected === r.path && 'bg-muted underline underline-offset-4',
                    )}
                  >
                    {label}
                  </button>
                ) : (
                  <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap px-1">{label}</span>
                )}
                {isHere && (
                  <span className="ml-2 inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap font-sans text-xs font-medium text-sky-700 dark:text-sky-300">
                    <MapPin size={12} aria-hidden /> <span className={status ? 'sr-only' : undefined}>you are here</span>
                  </span>
                )}
                {status && (
                  <motion.span
                    key={`${status}-${r.path}`}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      'ml-2 shrink-0 whitespace-nowrap rounded px-1.5 font-sans text-xs',
                      status === 'looked' && 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
                      status === 'actual' && 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
                      status === 'glow' && 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
                    )}
                  >
                    {status === 'looked' && `looked here for ${split(looked ?? '').at(-1)}`}
                    {status === 'actual' && 'it is here'}
                    {status === 'glow' && (event?.kind === 'list' ? 'listed' : event?.kind === 'ran' ? 'ran' : 'read')}
                  </motion.span>
                )}
              </li>
            )
          })}
        </ul>
      </div>
      <figcaption className="sr-only">You are in {display(cwd)}</figcaption>
    </figure>
  )
}
