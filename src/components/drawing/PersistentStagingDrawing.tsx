import { Archive } from 'lucide-react'
import { BATCHES } from '@/lib/dv/dataset'
import { Badge, Card, Drawing, Line, Mono, Note, Small, type Tone } from './kit'

const TITLE = 'Persistent staging is a shelf of dated deliveries'
const DESC =
  'Persistent staging keeps every delivery as received: batch 1, 2 and 3 of customer, nation and orders. ' +
  'dbt build --full-refresh can rebuild customer_h, customer_nation_l and customer_n_s from that shelf at any time. ' +
  'With truncated landing only the latest delivery is left, so history cannot be rebuilt.'

function Delivery({ x, y, w, batch, faded }: { x: number; y: number; w: number; batch: number; faded?: boolean }) {
  return (
    <g className={faded ? 'opacity-45' : undefined}>
      <Card x={x} y={y} w={w} h={48} tone="stage" r={8} />
      <Mono x={x + 14} y={y + 21} bold tone="stage">{`batch ${batch + 1} · ${BATCHES[batch].slice(0, 10)}`}</Mono>
      <Small x={x + 14} y={y + 38}>customer, nation, orders</Small>
    </g>
  )
}

function Table({ x, y, w, tone, name }: { x: number; y: number; w: number; tone: Tone; name: string }) {
  return (
    <g>
      <Card x={x} y={y} w={w} h={40} tone={tone} r={8} />
      <Mono x={x + 14} y={y + 25} tone={tone}>{name}</Mono>
    </g>
  )
}

const wide = (
  <>
    <Badge cx={58} cy={30} tone="stage"><Archive size={18} /></Badge>
    <Note x={84} y={36}>persistent staging</Note>
    {[0, 1, 2].map((b) => <Delivery key={b} x={40} y={60 + b * 58} w={240} batch={b} />)}
    <Line d="M30 236 L290 236" />
    <Small x={40} y={258}>evidence, kept as received</Small>
    <Line d="M300 140 L490 140" arrow />
    <Mono x={395} y={128} anchor="middle" size={12}>dbt build --full-refresh</Mono>
    <Small x={395} y={160} anchor="middle">rebuild any time</Small>
    <Note x={520} y={36}>raw vault</Note>
    <Table x={510} y={70} w={250} tone="hub" name="customer_h" />
    <Table x={510} y={120} w={250} tone="link" name="customer_nation_l" />
    <Table x={510} y={170} w={250} tone="sat" name="customer_n_s" />
    <Small x={510} y={234}>derived, rebuilt from the shelf</Small>
    <Line d="M30 286 L770 286" dashed />
    <Note x={40} y={318} size={16} muted>truncated landing:</Note>
    <Delivery x={200} y={298} w={240} batch={2} faded />
    <Note x={460} y={318} size={16} muted>only the latest delivery is left</Note>
    <Note x={460} y={340} size={16} muted>to rebuild from</Note>
  </>
)

const narrow = (
  <>
    <Badge cx={38} cy={28} tone="stage"><Archive size={18} /></Badge>
    <Note x={64} y={34}>persistent staging</Note>
    {[0, 1, 2].map((b) => <Delivery key={b} x={20} y={56 + b * 58} w={320} batch={b} />)}
    <Small x={20} y={242}>evidence, kept as received</Small>
    <Line d="M180 254 L180 314" arrow />
    <Mono x={192} y={282} size={12}>dbt build</Mono>
    <Mono x={192} y={298} size={12}>--full-refresh</Mono>
    <Table x={20} y={324} w={320} tone="hub" name="customer_h" />
    <Table x={20} y={372} w={320} tone="link" name="customer_nation_l" />
    <Table x={20} y={420} w={320} tone="sat" name="customer_n_s" />
    <Small x={20} y={482}>raw vault, rebuilt from the shelf</Small>
    <Line d="M20 504 L340 504" dashed />
    <Note x={20} y={532} size={16} muted>truncated landing keeps only the latest:</Note>
    <Delivery x={20} y={546} w={320} batch={2} faded />
  </>
)

export function PersistentStagingDrawing() {
  return <Drawing id="persistent-staging" title={TITLE} desc={DESC} wide={{ viewBox: '0 0 800 360', content: wide }} narrow={{ viewBox: '0 0 360 604', content: narrow }} />
}
