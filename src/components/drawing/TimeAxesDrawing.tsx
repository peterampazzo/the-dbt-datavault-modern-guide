import { Drawing, Line, Mono, Small } from './kit'
import { isGhost, simulate } from '@/lib/dv/engine'

const DAY = 24 * 60 * 60 * 1000

function dayBefore(value: string) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() - 1)
  return date.toISOString().slice(0, 10)
}

function millis(value: string) {
  const normalized = value.includes(' ') ? value.replace(' ', 'T') : value
  const timestamp = normalized.includes('T')
    ? /(?:Z|[+-]\d{2}:\d{2})$/i.test(normalized) ? normalized : `${normalized}Z`
    : `${normalized}T00:00:00Z`
  return Date.parse(timestamp)
}

const RUNS = simulate()
const TABLES = RUNS[0].tables
const ORDER_KEYS = new Map(TABLES.order_h.filter((row) => !isGhost(row)).map((row) => [String(row.hk_order_h), String(row.o_orderkey)] as const))
const ORDERS = TABLES.order_customer_nh_l
  .filter((row) => !isGhost(row))
  .map((row) => ({
    key: String(ORDER_KEYS.get(String(row.hk_order_h))),
    businessDate: String(row.o_orderdate),
    ldts: String(row.ldts),
  }))
  .sort((a, b) => Number(a.key) - Number(b.key))
  .slice(0, 2)
const CUTOFF = dayBefore(RUNS[0].ldts)
const RANGE_START = Math.min(...ORDERS.flatMap((row) => [millis(row.businessDate), millis(row.ldts)])) - DAY
const RANGE_END = Math.max(...ORDERS.flatMap((row) => [millis(row.businessDate), millis(row.ldts)])) + DAY * 2

function position(value: string, left: number, right: number) {
  return left + ((millis(value) - RANGE_START) / (RANGE_END - RANGE_START)) * (right - left)
}

function axisMarkers(axis: 'businessDate' | 'ldts', y: number, left: number, right: number) {
  return ORDERS.map((order, index) => {
    const x = position(order[axis], left, right)
    const offset = axis === 'ldts' ? (index === 0 ? -11 : 11) : 0
    const pointY = y + offset
    const keyY = axis === 'ldts' && offset > 0 ? pointY + 17 : pointY - 14
    const dateY = axis === 'ldts' && offset > 0 ? pointY + 30 : pointY - 27
    return (
      <g key={`${axis}-${order.key}`}>
        {offset !== 0 && <Line d={`M${x} ${y} L${x} ${pointY}`} tone="hub" />}
        <circle cx={x} cy={pointY} r={5} className="fill-sky-700 dark:fill-sky-300" />
        <Mono x={x} y={keyY} anchor="middle" size={11} bold>{order.key}</Mono>
        <Small x={x} y={dateY} anchor="middle" size={axis === 'ldts' ? 9 : 10}>
          {axis === 'businessDate' ? order.businessDate : order.ldts}
        </Small>
      </g>
    )
  })
}

const drawingTitle = 'Business dates and load dates can fall on different sides of a cutoff'
const drawingDesc = `Orders ${ORDERS.map((row) => row.key).join(' and ')} have business dates before the cutoff and load timestamps after it. The cutoff is the end of ${CUTOFF}.`

export function TimeAxesDrawing() {
  const wideLeft = 185
  const wideRight = 800
  const wideCutoff = position(`${CUTOFF}T23:59:59`, wideLeft, wideRight)
  const narrowLeft = 45
  const narrowRight = 375
  const narrowCutoff = position(`${CUTOFF}T23:59:59`, narrowLeft, narrowRight)

  return (
    <Drawing
      id="time-axes"
      title={drawingTitle}
      desc={drawingDesc}
      caption="One order can be old in business time and new to the vault."
      wide={{
        viewBox: '0 0 820 330',
        content: (
          <>
            <Small x={20} y={143}>business time</Small>
            <Small x={20} y={268}>load time</Small>
            <Line d="M185 150 H800" />
            <Line d="M185 275 H800" />
            <Line d={`M${wideCutoff} 55 V320`} tone="stage" dashed />
            <Small x={wideCutoff} y={38} anchor="middle">cutoff · {CUTOFF}</Small>
            {axisMarkers('businessDate', 150, wideLeft, wideRight)}
            {axisMarkers('ldts', 275, wideLeft, wideRight)}
          </>
        ),
      }}
      narrow={{
        viewBox: '0 0 390 420',
        content: (
          <>
            <Small x={18} y={72}>business time</Small>
            <Small x={18} y={250}>load time</Small>
            <Line d="M45 130 H375" />
            <Line d="M45 310 H375" />
            <Line d={`M${narrowCutoff} 88 V370`} tone="stage" dashed />
            <Small x={narrowCutoff} y={34} anchor="middle" size={10}>cutoff · {CUTOFF}</Small>
            {axisMarkers('businessDate', 130, narrowLeft, narrowRight)}
            {axisMarkers('ldts', 310, narrowLeft, narrowRight)}
          </>
        ),
      }}
    />
  )
}
