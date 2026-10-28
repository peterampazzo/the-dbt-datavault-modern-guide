import { createContext, useContext, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Drawing kit: small SVG primitives for explainer drawings.
 * Labels are real <text>, colours come from theme classes, so drawings work in dark mode.
 */
export type Tone = 'hub' | 'link' | 'sat' | 'stage' | 'ink'

const TONE: Record<Tone, { stroke: string; fill: string; text: string }> = {
  hub: { stroke: 'stroke-sky-600 dark:stroke-sky-400', fill: 'fill-sky-500/10', text: 'text-sky-700 dark:text-sky-300' },
  link: { stroke: 'stroke-emerald-600 dark:stroke-emerald-400', fill: 'fill-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-300' },
  sat: { stroke: 'stroke-amber-600 dark:stroke-amber-400', fill: 'fill-amber-500/10', text: 'text-amber-700 dark:text-amber-300' },
  stage: { stroke: 'stroke-violet-600 dark:stroke-violet-400', fill: 'fill-violet-500/10', text: 'text-violet-700 dark:text-violet-300' },
  ink: { stroke: 'stroke-foreground/50', fill: 'fill-transparent', text: 'text-foreground' },
}

const ArrowId = createContext('drawing-arrow')

type Box = { x: number; y: number; w: number; h: number }

export function Card({ x, y, w, h, tone, r = 14, faded }: Box & { tone: Tone; r?: number; faded?: boolean }) {
  return <rect x={x} y={y} width={w} height={h} rx={r} strokeWidth={1.5} className={cn(TONE[tone].stroke, TONE[tone].fill, faded && 'opacity-50')} />
}

export function Line({ d, tone = 'ink', dashed, arrow }: { d: string; tone?: Tone; dashed?: boolean; arrow?: boolean }) {
  const arrowId = useContext(ArrowId)
  return (
    <path
      d={d}
      fill="none"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={dashed ? '5 5' : undefined}
      markerEnd={arrow ? `url(#${arrowId})` : undefined}
      className={TONE[tone].stroke}
    />
  )
}

/** A round badge with a lucide icon (pass the icon at size 18). */
export function Badge({ cx, cy, tone, children }: { cx: number; cy: number; tone: Tone; children: ReactNode }) {
  return (
    <g className={TONE[tone].text}>
      <circle cx={cx} cy={cy} r={17} className="fill-current opacity-15" />
      <g transform={`translate(${cx - 9} ${cy - 9})`}>{children}</g>
    </g>
  )
}

type TextProps = { x: number; y: number; children: ReactNode; anchor?: 'start' | 'middle' | 'end'; size?: number; tone?: Tone }

/** Table, column and key names. */
export function Mono({ x, y, children, anchor, size = 12.5, tone, bold }: TextProps & { bold?: boolean }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight={bold ? 600 : undefined} className={cn('fill-current font-mono', tone && TONE[tone].text)}>
      {children}
    </text>
  )
}

/** Small explanatory label. */
export function Small({ x, y, children, anchor, size = 12 }: TextProps) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} className="fill-muted-foreground font-sans">
      {children}
    </text>
  )
}

/** Handwritten-style margin note, in the reading serif. */
export function Note({ x, y, children, anchor, size = 18, muted }: TextProps & { muted?: boolean }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} className={cn('font-serif italic', muted ? 'fill-muted-foreground' : 'fill-foreground/75')}>
      {children}
    </text>
  )
}

function Svg({ viewBox, title, desc, id, className, children }: { viewBox: string; title: string; desc: string; id: string; className: string; children: ReactNode }) {
  return (
    // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- an inline SVG needs role="img" to be announced with its title
    <svg viewBox={viewBox} role="img" aria-labelledby={`${id}-t ${id}-d`} className={cn('h-auto w-full text-foreground', className)}>
      <title id={`${id}-t`}>{title}</title>
      <desc id={`${id}-d`}>{desc}</desc>
      <defs>
        <marker id={`${id}-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M1 1 L9 5 L1 9" fill="none" strokeWidth={1.5} className="stroke-foreground/50" />
        </marker>
      </defs>
      <ArrowId.Provider value={`${id}-arrow`}>{children}</ArrowId.Provider>
    </svg>
  )
}

/**
 * A drawing with a wide layout (md and up) and a stacked layout for phones.
 * Each layout is its own SVG so labels stay readable at every width.
 */
export function Drawing({
  id,
  title,
  desc,
  wide,
  narrow,
  caption,
}: {
  id: string
  title: string
  desc: string
  wide: { viewBox: string; content: ReactNode }
  narrow: { viewBox: string; content: ReactNode }
  caption?: ReactNode
}) {
  return (
    <figure data-drawing={id} className="mx-auto my-6 max-w-[48rem]">
      <Svg id={`${id}-wide`} viewBox={wide.viewBox} title={title} desc={desc} className="hidden md:block">
        {wide.content}
      </Svg>
      <Svg id={`${id}-narrow`} viewBox={narrow.viewBox} title={title} desc={desc} className="mx-auto max-w-sm md:hidden">
        {narrow.content}
      </Svg>
      {caption && <figcaption className="mx-auto mt-3 max-w-[40rem] text-sm text-muted-foreground">{caption}</figcaption>}
    </figure>
  )
}
