import { Link2, ShoppingBag, User } from 'lucide-react'
import { Badge, Card, Drawing, Line, Mono, Note, Small } from './kit'

const TITLE = 'Hubs are nouns, links are verbs, satellites are adjectives'
const DESC =
  'The customer hub holds Alice by her key, c_custkey 1. The order hub holds order 101. The link order_customer_nh_l records that customer 1 placed order 101. ' +
  'The satellite customer_n_s keeps what Alice is like: segment BUILDING from batch 1, then MACHINERY from batch 3.'

function Hub({ x, y, w, table, keyText, note, icon }: { x: number; y: number; w: number; table: string; keyText: string; note: string; icon: React.ReactNode }) {
  return (
    <g>
      <Card x={x} y={y} w={w} h={100} tone="hub" />
      <Badge cx={x + 32} cy={y + 36} tone="hub">{icon}</Badge>
      <Mono x={x + 60} y={y + 32} size={14} bold tone="hub">{table}</Mono>
      <Mono x={x + 60} y={y + 51} size={12} tone="hub">{keyText}</Mono>
      <Small x={x + 18} y={y + 82} size={13}>{note}</Small>
    </g>
  )
}

function LinkPill({ x, y, w }: { x: number; y: number; w: number }) {
  return (
    <g>
      <Card x={x} y={y} w={w} h={58} tone="link" r={29} />
      <Mono x={x + w / 2} y={y + 25} anchor="middle" bold tone="link">order_customer_nh_l</Mono>
      <Small x={x + w / 2} y={y + 44} anchor="middle">customer 1 placed order 101</Small>
    </g>
  )
}

function Versions({ x, y, w }: { x: number; y: number; w: number }) {
  return (
    <g>
      <Mono x={x} y={y} size={14} bold tone="sat">customer_n_s</Mono>
      <Card x={x} y={y + 12} w={w} h={56} tone="sat" r={10} />
      <Mono x={x + 18} y={y + 36} tone="sat">c_mktsegment = BUILDING</Mono>
      <Small x={x + 18} y={y + 56}>version 1 · batch 1</Small>
      <Card x={x} y={y + 78} w={w} h={56} tone="sat" r={10} />
      <Mono x={x + 18} y={y + 102} tone="sat">c_mktsegment = MACHINERY</Mono>
      <Small x={x + 18} y={y + 122}>version 2 · batch 3</Small>
    </g>
  )
}

const wide = (
  <>
    <Note x={150} y={44} anchor="middle" size={22}>noun</Note>
    <Note x={400} y={44} anchor="middle" size={22}>verb</Note>
    <Note x={650} y={44} anchor="middle" size={22}>noun</Note>
    <Line d="M240 120 L300 120" />
    <Line d="M500 120 L560 120" />
    <Line d="M200 170 L200 242" tone="sat" dashed />
    <Hub x={60} y={70} w={180} table="customer_h" keyText="c_custkey = 1" note="Alice, customer #1" icon={<User size={18} />} />
    <LinkPill x={300} y={91} w={200} />
    <Badge cx={400} cy={72} tone="link"><Link2 size={18} /></Badge>
    <Hub x={560} y={70} w={180} table="order_h" keyText="o_orderkey = 101" note="placed 30 Dec 2023" icon={<ShoppingBag size={18} />} />
    <Versions x={60} y={230} w={300} />
    <Line d="M410 318 C390 318 382 320 368 326" />
    <Note x={418} y={312}>adjectives: what Alice is like,</Note>
    <Note x={418} y={336}>one version per change</Note>
    <Note x={560} y={214} size={15} muted>Keys never change.</Note>
    <Note x={560} y={236} size={15} muted>Descriptions get new versions.</Note>
  </>
)

const narrow = (
  <>
    <Note x={16} y={92} size={18}>adjectives</Note>
    <Versions x={110} y={26} w={234} />
    <Line d="M227 160 L227 190" tone="sat" dashed />
    <Note x={16} y={246} size={18}>noun</Note>
    <Hub x={110} y={190} w={234} table="customer_h" keyText="c_custkey = 1" note="Alice, customer #1" icon={<User size={18} />} />
    <Line d="M227 290 L227 320" />
    <Note x={16} y={355} size={18}>verb</Note>
    <LinkPill x={110} y={320} w={234} />
    <Line d="M227 378 L227 408" />
    <Note x={16} y={464} size={18}>noun</Note>
    <Hub x={110} y={408} w={234} table="order_h" keyText="o_orderkey = 101" note="placed 30 Dec 2023" icon={<ShoppingBag size={18} />} />
    <Note x={16} y={546} size={15} muted>Keys never change.</Note>
    <Note x={16} y={568} size={15} muted>Descriptions get new versions.</Note>
  </>
)

export function HubLinkSatDrawing() {
  return <Drawing id="hub-link-sat" title={TITLE} desc={DESC} wide={{ viewBox: '0 0 800 380', content: wide }} narrow={{ viewBox: '0 0 360 580', content: narrow }} />
}
