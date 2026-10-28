import { useMemo, type ReactNode } from 'react'
import rough from 'roughjs'
import type { Options } from 'roughjs/bin/core'
import { Link2, ShoppingBag, User } from 'lucide-react'
import { cn } from '@/lib/utils'

type Variant = 'clean' | 'sketchy'
type Tone = 'hub' | 'link' | 'sat' | 'ink'

const TONE: Record<Tone, { stroke: string; fill: string; text: string }> = {
  hub: { stroke: 'stroke-sky-600 dark:stroke-sky-400', fill: 'fill-sky-500/10', text: 'text-sky-700 dark:text-sky-300' },
  link: { stroke: 'stroke-emerald-600 dark:stroke-emerald-400', fill: 'fill-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-300' },
  sat: { stroke: 'stroke-amber-600 dark:stroke-amber-400', fill: 'fill-amber-500/10', text: 'text-amber-700 dark:text-amber-300' },
  ink: { stroke: 'stroke-foreground/60', fill: 'fill-transparent', text: 'text-foreground' },
}

const gen = rough.generator()
const STROKE = '#000001'
const FILL = '#000002'

/** Renders a rough.js shape as React paths, so colours come from theme classes. */
function Rough({ shape, tone }: { shape: (o: Options) => ReturnType<typeof gen.rectangle>; tone: Tone }) {
  const paths = useMemo(() => gen.toPaths(shape({ stroke: STROKE, fill: FILL, fillStyle: 'hachure', hachureGap: 9, roughness: 1.3, bowing: 1.2 })), [shape])
  return (
    <g>
      {paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          strokeWidth={p.stroke === FILL ? 0.8 : 1.75}
          fill="none"
          strokeLinecap="round"
          className={cn(TONE[tone].stroke, p.stroke === FILL && 'opacity-20')}
        />
      ))}
    </g>
  )
}

function Card({ v, x, y, w, h, tone, seed, r = 14 }: { v: Variant; x: number; y: number; w: number; h: number; tone: Tone; seed: number; r?: number }) {
  if (v === 'sketchy') return <Rough tone={tone} shape={(o) => gen.rectangle(x, y, w, h, { ...o, seed })} />
  return <rect x={x} y={y} width={w} height={h} rx={r} strokeWidth={1.5} className={cn(TONE[tone].stroke, TONE[tone].fill)} />
}

function Line({ v, d, tone = 'ink', seed, dashed }: { v: Variant; d: string; tone?: Tone; seed: number; dashed?: boolean }) {
  if (v === 'sketchy') return <Rough tone={tone} shape={(o) => gen.path(d, { ...o, fill: undefined, seed, roughness: 1 })} />
  return <path d={d} fill="none" strokeWidth={1.5} strokeLinecap="round" strokeDasharray={dashed ? '5 5' : undefined} className={TONE[tone].stroke} />
}

function Icon({ v, cx, cy, tone, children }: { v: Variant; cx: number; cy: number; tone: Tone; children: ReactNode }) {
  return (
    <g className={TONE[tone].text}>
      {v === 'clean' && <circle cx={cx} cy={cy} r={17} className={cn(TONE[tone].fill, 'fill-current opacity-15')} />}
      <g transform={`translate(${cx - 9} ${cy - 9})`}>{children}</g>
    </g>
  )
}

const mono = 'fill-current font-mono'
const note = 'fill-current font-serif italic'

export function HubLinkSatDrawing({ variant, className }: { variant: Variant; className?: string }) {
  const v = variant
  const id = `hls-${v}`
  return (
    <svg viewBox="0 0 800 420" role="img" aria-labelledby={`${id}-t ${id}-d`} className={cn('h-auto w-full text-foreground', className)}>
      <title id={`${id}-t`}>Hubs are nouns, links are verbs, satellites are adjectives</title>
      <desc id={`${id}-d`}>
        The customer hub holds Alice by her key, c_custkey 1. The order hub holds order 101. The link order_customer_nh_l records that customer 1 placed order 101.
        The satellite customer_n_s keeps what Alice is like: segment BUILDING from batch 1, then MACHINERY from batch 3.
      </desc>

      <g className="text-foreground/70">
        <text x={150} y={48} textAnchor="middle" fontSize={22} className={note}>noun</text>
        <text x={400} y={48} textAnchor="middle" fontSize={22} className={note}>verb</text>
        <text x={650} y={48} textAnchor="middle" fontSize={22} className={note}>noun</text>
      </g>

      <Line v={v} d="M240 125 L300 125" seed={11} />
      <Line v={v} d="M500 125 L560 125" seed={12} />
      <Line v={v} d="M200 180 L200 252" seed={13} tone="sat" dashed />

      <Card v={v} x={60} y={70} w={180} h={110} tone="hub" seed={1} />
      <Icon v={v} cx={92} cy={108} tone="hub"><User size={18} /></Icon>
      <g className={TONE.hub.text}>
        <text x={120} y={104} fontSize={14} fontWeight={600} className={mono}>customer_h</text>
        <text x={120} y={123} fontSize={12} className={mono}>c_custkey = 1</text>
      </g>
      <text x={78} y={160} fontSize={13} className="fill-muted-foreground">Alice, customer #1</text>

      <Card v={v} x={300} y={95} w={200} h={60} tone="link" seed={2} r={30} />
      <g className={TONE.link.text}>
        <Icon v={v} cx={400} cy={78} tone="link"><Link2 size={18} /></Icon>
        <text x={400} y={121} textAnchor="middle" fontSize={12.5} fontWeight={600} className={mono}>order_customer_nh_l</text>
      </g>
      <text x={400} y={140} textAnchor="middle" fontSize={12} className="fill-muted-foreground">customer 1 placed order 101</text>

      <Card v={v} x={560} y={70} w={180} h={110} tone="hub" seed={3} />
      <Icon v={v} cx={592} cy={108} tone="hub"><ShoppingBag size={18} /></Icon>
      <g className={TONE.hub.text}>
        <text x={620} y={104} fontSize={14} fontWeight={600} className={mono}>order_h</text>
        <text x={620} y={123} fontSize={12} className={mono}>o_orderkey = 101</text>
      </g>
      <text x={578} y={160} fontSize={13} className="fill-muted-foreground">placed 30 Dec 2023</text>

      <text x={60} y={240} fontSize={14} fontWeight={600} className={cn(mono, TONE.sat.text)}>customer_n_s</text>
      <Card v={v} x={60} y={252} w={300} h={58} tone="sat" seed={4} r={10} />
      <g className={TONE.sat.text}>
        <text x={80} y={277} fontSize={12.5} className={mono}>c_mktsegment = BUILDING</text>
      </g>
      <text x={80} y={297} fontSize={12} className="fill-muted-foreground">version 1 · batch 1</text>
      <Card v={v} x={60} y={322} w={300} h={58} tone="sat" seed={5} r={10} />
      <g className={TONE.sat.text}>
        <text x={80} y={347} fontSize={12.5} className={mono}>c_mktsegment = MACHINERY</text>
      </g>
      <text x={80} y={367} fontSize={12} className="fill-muted-foreground">version 2 · batch 3</text>

      <Line v={v} d="M410 318 C390 318 382 320 368 326" seed={14} />
      <g className="text-foreground/80">
        <text x={418} y={312} fontSize={19} className={note}>adjectives: what Alice is like,</text>
        <text x={418} y={336} fontSize={19} className={note}>one version per change</text>
      </g>
      <g className="text-muted-foreground">
        <text x={560} y={226} fontSize={15} className={note}>Keys never change.</text>
        <text x={560} y={248} fontSize={15} className={note}>Descriptions get new versions.</text>
      </g>
    </svg>
  )
}
