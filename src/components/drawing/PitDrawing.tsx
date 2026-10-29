import { Camera } from 'lucide-react'
import { BATCHES } from '@/lib/dv/dataset'
import { SNAPSHOTS } from '@/lib/dv/engine'
import { Badge, Card, Drawing, Line, Mono, Note, Small, type Tone } from './kit'

const SNAP = SNAPSHOTS[1]
const TITLE = 'A PIT is a photo of every satellite on one date'
const DESC =
  `On the snapshot ${SNAP}, customer 1's PIT row points at the customer_n_s version loaded ${BATCHES[0]} (segment BUILDING) ` +
  `and at the customer_phone_ma_s set loaded ${BATCHES[1]} (home, mobile and work).`

/** x position of a timestamp on a timeline that starts at 2024-01-01 00:00. */
const at = (ts: string, x0: number, day: number) => {
  const [d, t] = [Number(ts.slice(8, 10)) - 1, Number(ts.slice(11, 13))]
  return x0 + (d + t / 24) * day
}

function Bar({ from, to, y, tone, label, x0, day, end }: { from: string; to?: string; y: number; tone: Tone; label: string; x0: number; day: number; end: number }) {
  const x = at(from, x0, day)
  const w = (to ? at(to, x0, day) : end) - x - 4
  return (
    <g>
      <Card x={x} y={y} w={w} h={30} tone={tone} r={6} />
      <Small x={x + 18} y={y + 20}>{label}</Small>
    </g>
  )
}

function Timeline({ x0, day, end, labelX, rowY, size, inline }: { x0: number; day: number; end: number; labelX: number; rowY: [number, number]; size: number; inline?: boolean }) {
  const sx = at(SNAP, x0, day)
  const ly = (y: number) => (inline ? y + 20 : y - 8)
  return (
    <>
      <Mono x={labelX} y={ly(rowY[0])} size={size} tone="sat">customer_n_s</Mono>
      <Bar from={BATCHES[0]} to={BATCHES[2]} y={rowY[0]} tone="sat" label="BUILDING" x0={x0} day={day} end={end} />
      <Bar from={BATCHES[2]} y={rowY[0]} tone="sat" label="MACHINERY" x0={x0} day={day} end={end} />
      <Mono x={labelX} y={ly(rowY[1])} size={size} tone="sat">customer_phone_ma_s</Mono>
      <Bar from={BATCHES[0]} to={BATCHES[1]} y={rowY[1]} tone="sat" label="home, mobile" x0={x0} day={day} end={end} />
      <Bar from={BATCHES[1]} y={rowY[1]} tone="sat" label="+ work" x0={x0} day={day} end={end} />
      {[0, 1, 2, 3].map((d) => (
        <Small key={d} x={x0 + d * day} y={rowY[1] + 56} anchor="middle" size={11}>{`01-0${d + 1}`}</Small>
      ))}
      <Line d={`M${x0} ${rowY[1] + 40} L${end} ${rowY[1] + 40}`} />
      <Line d={`M${sx} ${rowY[0] - 34} L${sx} ${rowY[1] + 40}`} tone="stage" dashed />
      <Badge cx={sx} cy={rowY[0] - 52} tone="stage"><Camera size={18} /></Badge>
      <circle cx={sx} cy={rowY[0] + 15} r={4} className="fill-violet-600 dark:fill-violet-400" />
      <circle cx={sx} cy={rowY[1] + 15} r={4} className="fill-violet-600 dark:fill-violet-400" />
    </>
  )
}

function PitRow({ x, y, w, title, lines }: { x: number; y: number; w: number; title: string; lines: string[] }) {
  return (
    <g>
      <Card x={x} y={y} w={w} h={34 + lines.length * 18} tone="stage" r={10} />
      <Mono x={x + 16} y={y + 24} bold tone="stage">{title}</Mono>
      {lines.map((l, i) => <Mono key={l} x={x + 16} y={y + 46 + i * 18} size={11.5}>{l}</Mono>)}
    </g>
  )
}

const wide = (
  <>
    <Timeline x0={190} day={170} end={770} labelX={20} rowY={[80, 150]} size={12} inline />
    <Note x={at(SNAP, 190, 170) + 24} y={30} size={16}>snapshot: the photo</Note>
    <PitRow x={190} y={240} w={580} title={`customer_pit · customer 1 · ${SNAP.slice(0, 16)}`} lines={[`customer_n_s → ldts ${BATCHES[0]}`, `customer_phone_ma_s → ldts ${BATCHES[1]}`]} />
    <Note x={20} y={264} size={16} muted>pointers,</Note>
    <Note x={20} y={286} size={16} muted>not copies</Note>
  </>
)

const narrow = (
  <>
    <Timeline x0={25} day={95} end={352} labelX={20} rowY={[100, 170]} size={12} />
    <Note x={at(SNAP, 25, 95) + 24} y={52} size={15}>snapshot: the photo</Note>
    <PitRow x={10} y={260} w={340} title="customer_pit · customer 1" lines={[`sdts ${SNAP.slice(0, 16)}`, 'customer_n_s →', `  ldts ${BATCHES[0]}`, 'customer_phone_ma_s →', `  ldts ${BATCHES[1]}`]} />
  </>
)

export function PitDrawing() {
  return <Drawing id="pit" title={TITLE} desc={DESC} wide={{ viewBox: '0 0 800 320', content: wide }} narrow={{ viewBox: '0 0 360 390', content: narrow }} />
}
