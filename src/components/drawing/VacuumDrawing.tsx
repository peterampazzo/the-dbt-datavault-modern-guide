import { Check, X } from 'lucide-react'
import { Badge, Card, Drawing, Line, Mono, Note, Small, type Tone } from './kit'

const TITLE = 'What survives an accidental full refresh followed by VACUUM'
const DESC =
  'After a full refresh replaces a table and VACUUM runs past the 7-day retention, old table versions are gone. ' +
  'A truncated landing table only ever held the latest delivery, so batches 1 and 2 are lost. ' +
  'A raw vault on its own kept its old rows only in old table versions, so they are lost too. ' +
  'Append-only persistent staging still holds batch 1, 2 and 3 in its current version, so dbt build rebuilds the raw vault from it.'

type Case = { name: string; tone: Tone; faded?: boolean; held: string; safe: boolean; result: [string, string] }

const CASES: Case[] = [
  { name: 'truncated landing', tone: 'stage', faded: true, held: 'only batch 3; 1 and 2 were overwritten', safe: false, result: ['history lost', 'it was never kept'] },
  { name: 'raw vault on its own', tone: 'sat', held: 'old rows only in old table versions', safe: false, result: ['history lost', 'once retention has passed'] },
  { name: 'persistent staging', tone: 'stage', held: 'batch 1 · 2 · 3, all in the current version', safe: true, result: ['safe', 'dbt build rebuilds the vault'] },
]

function Outcome({ x, y, c }: { x: number; y: number; c: Case }) {
  return (
    <g>
      <Badge cx={x + 18} cy={y} tone={c.safe ? 'link' : 'ink'}>{c.safe ? <Check size={18} /> : <X size={18} />}</Badge>
      <Note x={x + 46} y={y - 2} size={16} muted={!c.safe}>{c.result[0]}</Note>
      <Small x={x + 46} y={y + 16}>{c.result[1]}</Small>
    </g>
  )
}

function Source({ x, y, w, c }: { x: number; y: number; w: number; c: Case }) {
  return (
    <g className={c.faded ? 'opacity-60' : undefined}>
      <Card x={x} y={y} w={w} h={56} tone={c.tone} r={8} />
      <Mono x={x + 14} y={y + 23} bold tone={c.tone}>{c.name}</Mono>
      <Small x={x + 14} y={y + 42}>{c.held}</Small>
    </g>
  )
}

const wide = (
  <>
    <Note x={40} y={32} size={17}>An accidental --full-refresh, then VACUUM past the 7-day retention:</Note>
    {CASES.map((c, i) => {
      const y = 60 + i * 80
      return (
        <g key={c.name}>
          <Source x={40} y={y} w={320} c={c} />
          <Line d={`M372 ${y + 28} L520 ${y + 28}`} arrow />
          <Mono x={446} y={y + 20} anchor="middle" size={12}>{c.safe ? 'still there' : 'VACUUM'}</Mono>
          <Outcome x={530} y={y + 26} c={c} />
        </g>
      )
    })}
  </>
)

const narrow = (
  <>
    <Note x={20} y={28} size={16}>An accidental --full-refresh,</Note>
    <Note x={20} y={50} size={16}>then VACUUM past the 7-day retention:</Note>
    {CASES.map((c, i) => {
      const y = 72 + i * 124
      return (
        <g key={c.name}>
          <Source x={20} y={y} w={320} c={c} />
          <Outcome x={20} y={y + 88} c={c} />
        </g>
      )
    })}
  </>
)

export function VacuumDrawing() {
  return <Drawing id="vacuum" title={TITLE} desc={DESC} wide={{ viewBox: '0 0 800 300', content: wide }} narrow={{ viewBox: '0 0 360 440', content: narrow }} />
}
