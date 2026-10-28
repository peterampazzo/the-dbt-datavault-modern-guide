import { Fingerprint } from 'lucide-react'
import { simulate } from '@/lib/dv/engine'
import { Badge, Card, Drawing, Line, Mono, Note, Small, type Tone } from './kit'

const runs = simulate()
const hd = (batch: number) => {
  const row = runs[batch].stage.stg_customer.find((r) => r.c_custkey === 1)
  return `${String(row?.hd_customer_n_s).slice(0, 8)}…`
}
const [HD1, HD2, HD3] = [hd(0), hd(1), hd(2)]

const TITLE = 'A hashdiff is a fingerprint of the payload'
const DESC =
  `customer_n_s holds Alice's latest version from batch 1, segment BUILDING, with hashdiff ${HD1}. ` +
  `Batch 2 sends the same payload, so its fingerprint ${HD2} matches and no row is added. ` +
  `Batch 3 sends segment MACHINERY, so its fingerprint ${HD3} differs and version 2 is inserted.`

function Print({ x, y, w, h, tone, title, line, hash }: { x: number; y: number; w: number; h: number; tone: Tone; title: string; line: string; hash: string }) {
  return (
    <g>
      <Card x={x} y={y} w={w} h={h} tone={tone} r={12} />
      <Mono x={x + 16} y={y + 26} bold tone={tone}>{title}</Mono>
      <Small x={x + 16} y={y + 46}>{line}</Small>
      <Badge cx={x + 30} cy={y + h - 28} tone={tone}><Fingerprint size={18} /></Badge>
      <Mono x={x + 56} y={y + h - 24} tone={tone}>{`hashdiff ${hash}`}</Mono>
    </g>
  )
}

const wide = (
  <>
    <Print x={40} y={110} w={250} h={120} tone="sat" title="customer_n_s, latest" line="Alice · BUILDING · batch 1" hash={HD1} />
    <Print x={510} y={30} w={250} h={120} tone="stage" title="batch 2 delivery" line="Alice · BUILDING · unchanged" hash={HD2} />
    <Print x={510} y={190} w={250} h={120} tone="stage" title="batch 3 delivery" line="Alice · MACHINERY" hash={HD3} />
    <Line d="M500 90 C420 90 380 150 300 160" arrow />
    <Line d="M500 250 C420 250 380 190 300 180" arrow />
    <Note x={390} y={62} anchor="middle" size={17}>same print: skip</Note>
    <Note x={390} y={300} anchor="middle" size={17}>new print: insert version 2</Note>
  </>
)

const narrow = (
  <>
    <Print x={20} y={10} w={320} h={110} tone="sat" title="customer_n_s, latest" line="Alice · BUILDING · batch 1" hash={HD1} />
    <Line d="M120 160 L120 130" arrow />
    <Note x={136} y={152} size={16}>same print: skip</Note>
    <Print x={20} y={170} w={320} h={110} tone="stage" title="batch 2 delivery" line="Alice · BUILDING · unchanged" hash={HD2} />
    <Line d="M120 330 L120 290" arrow />
    <Note x={136} y={316} size={16}>new print: insert version 2</Note>
    <Print x={20} y={340} w={320} h={110} tone="stage" title="batch 3 delivery" line="Alice · MACHINERY" hash={HD3} />
  </>
)

export function HashdiffDrawing() {
  return <Drawing id="hashdiff" title={TITLE} desc={DESC} wide={{ viewBox: '0 0 800 320', content: wide }} narrow={{ viewBox: '0 0 360 460', content: narrow }} />
}
