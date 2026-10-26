import { useEffect, useId, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { Split, Merge } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type Kind = 'bk' | 'fk' | 'attr' | 'meta'
const COLS: { name: string; kind: Kind }[] = [
  { name: 'c_custkey', kind: 'bk' },
  { name: 'c_nationkey', kind: 'fk' },
  { name: 'c_name', kind: 'attr' },
  { name: 'c_address', kind: 'attr' },
  { name: 'c_mktsegment', kind: 'attr' },
  { name: 'c_acctbal', kind: 'attr' },
  { name: 'c_comment', kind: 'attr' },
]

const chip: Record<Kind, string> = {
  bk: 'border-sky-500/50 bg-sky-500/15 text-sky-300',
  fk: 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300',
  attr: 'border-amber-500/50 bg-amber-500/15 text-amber-200',
  meta: 'border-border bg-muted/60 text-muted-foreground',
}

function Col({ name, kind, id }: { name: string; kind: Kind; id: string }) {
  return (
    <motion.div
      layoutId={`${id}-${name}`}
      transition={{ type: 'spring', stiffness: 220, damping: 26 }}
      className={cn('rounded-md border px-2 py-1 font-mono text-[11px] break-all light:text-foreground', chip[kind])}
    >
      {name}
    </motion.div>
  )
}

function Meta({ cols }: { cols: string[] }) {
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex flex-col gap-1">
      {cols.map((c) => (
        <div key={c} className={cn('rounded-md border px-2 py-1 font-mono text-[11px] break-all', chip.meta)}>
          {c}
        </div>
      ))}
    </motion.div>
  )
}

function Box({ title, tone, children, className }: { title: string; tone: string; children: React.ReactNode; className?: string }) {
  return (
    <motion.div layout className={cn('flex flex-col gap-1 rounded-xl border-2 bg-card/80 p-2.5 shadow-lg backdrop-blur', tone, className)}>
      <motion.div layout="position" className="mb-1 break-all font-mono text-xs font-semibold">
        {title}
      </motion.div>
      {children}
    </motion.div>
  )
}

/** One customer table (3NF / dimension) decomposed into hub, link and satellite. */
export function Decomposition({ auto = false, className }: { auto?: boolean; className?: string }) {
  const id = useId()
  const [split, setSplit] = useState(false)

  useEffect(() => {
    if (!auto) return
    const t = setTimeout(() => setSplit(true), 1200)
    return () => clearTimeout(t)
  }, [auto])

  const col = (n: string) => {
    const c = COLS.find((x) => x.name === n)!
    return <Col key={n} id={id} name={c.name} kind={c.kind} />
  }

  return (
    <div className={cn('relative rounded-2xl border bg-card/30 p-5', className)}>
      <div className="mb-4 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {split ? 'Data Vault: identity, relationship and context are separated' : 'Classic model: one customer table holds everything'}
        </div>
        <Button size="sm" variant="outline" onClick={() => setSplit(!split)}>
          {split ? <Merge /> : <Split />} {split ? 'Recombine' : 'Decompose'}
        </Button>
      </div>
      <LayoutGroup id={id}>
        <div className="flex min-h-[19rem] items-center justify-center">
          {!split ? (
            <Box title="customer" tone="border-zinc-500/50 text-foreground" className="w-48">
              {COLS.map((c) => col(c.name))}
            </Box>
          ) : (
            <div className="grid w-full grid-cols-2 gap-3 sm:gap-5">
              <Box title="customer_h" tone="border-sky-500/60 text-sky-400">
                <AnimatePresence>
                  <Meta cols={['hk_customer_h']} />
                </AnimatePresence>
                {col('c_custkey')}
                <Meta cols={['ldts', 'rsrc']} />
              </Box>
              <Box title="customer_nation_l" tone="border-emerald-500/60 text-emerald-400">
                <Meta cols={['hk_customer_nation_l', 'hk_customer_h']} />
                {col('c_nationkey')}
                <Meta cols={['ldts', 'rsrc']} />
              </Box>
              <Box title="customer_n_s" tone="border-amber-500/60 text-amber-400" className="col-span-2">
                <Meta cols={['hk_customer_h', 'ldts', 'hd_customer_n_s']} />
                <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">{COLS.filter((c) => c.kind === 'attr').map((c) => col(c.name))}</div>
              </Box>
            </div>
          )}
        </div>
      </LayoutGroup>
    </div>
  )
}
