import { Drawing, Line, Mono, Small } from './kit'
import { isGhost, simulate } from '@/lib/dv/engine'
import { BATCHES } from '@/lib/dv/dataset'

const DAY = 24 * 60 * 60 * 1000

type Order = { key: string; businessDate: string; ldts: string }
type OrderGroup = { date: string; orders: Order[] }

function addDays(value: string, count: number) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + count)
  return date.toISOString().slice(0, 10)
}

function dayBefore(value: string) {
  return addDays(value, -1)
}

function millis(value: string) {
  const normalized = value.includes(' ') ? value.replace(' ', 'T') : value
  const timestamp = normalized.includes('T')
    ? /(?:Z|[+-]\d{2}:\d{2})$/i.test(normalized) ? normalized : `${normalized}Z`
    : `${normalized}T00:00:00Z`
  return Date.parse(timestamp)
}

const RUNS = simulate()
const TABLES = RUNS.at(-1)!.tables
const ORDER_KEYS = new Map(TABLES.order_h.filter((row) => !isGhost(row)).map((row) => [String(row.hk_order_h), String(row.o_orderkey)] as const))
const ORDERS: Order[] = TABLES.order_customer_nh_l
  .filter((row) => !isGhost(row))
  .map((row) => ({
    key: String(ORDER_KEYS.get(String(row.hk_order_h))),
    businessDate: String(row.o_orderdate),
    ldts: String(row.ldts),
  }))
  .sort((a, b) => Number(a.key) - Number(b.key))
const DELIVERY_TIMES = [...new Set(BATCHES.map((ldts) => ldts.slice(11, 16)))]
const CUTOFF = dayBefore(RUNS[0].ldts)
const ORDER_DATES = ORDERS.flatMap((order) => [order.businessDate, order.ldts.slice(0, 10)]).sort()
const FIRST_DAY = ORDER_DATES[0]
const LAST_DAY = ORDER_DATES.at(-1)!
const RANGE_START = millis(FIRST_DAY)
const RANGE_END = millis(addDays(LAST_DAY, 1))
const DAY_TICKS = Array.from(
  { length: Math.round((RANGE_END - RANGE_START) / DAY) },
  (_, index) => addDays(FIRST_DAY, index),
)

function groupOrders(dateOf: (order: Order) => string): OrderGroup[] {
  const groups = new Map<string, Order[]>()
  for (const order of ORDERS) {
    const date = dateOf(order)
    groups.set(date, [...(groups.get(date) ?? []), order])
  }
  return [...groups].map(([date, orders]) => ({ date, orders }))
}

const BUSINESS_GROUPS = groupOrders((order) => order.businessDate)
const LOAD_GROUPS = groupOrders((order) => order.ldts.slice(0, 10))

function position(value: string, left: number, right: number) {
  return left + ((millis(value) - RANGE_START) / (RANGE_END - RANGE_START)) * (right - left)
}

function dayPosition(date: string, left: number, right: number) {
  return position(`${date}T12:00:00`, left, right)
}

function dayLabel(date: string) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
    .format(new Date(`${date}T00:00:00Z`))
}

function dayTicks(y: number, labelY: number, left: number, right: number, size: number) {
  return DAY_TICKS.map((date) => {
    const x = dayPosition(date, left, right)
    return (
      <g key={`${y}-${date}`}>
        <Line d={`M${x} ${y - 6} V${y + 6}`} />
        <Small x={x} y={labelY} anchor="middle" size={size}>{dayLabel(date)}</Small>
      </g>
    )
  })
}

function axisMarkers(groups: OrderGroup[], y: number, left: number, right: number, size: number, stagger = false) {
  return groups.map((group, index) => {
    const x = dayPosition(group.date, left, right)
    const anchor = stagger ? 'start' : 'middle'
    const labelX = x + (stagger ? 8 : 0)
    const labelY = y - 20 - (stagger ? index * 18 : 0)
    return (
      <g key={`${y}-${group.date}`}>
        {stagger && <Line d={`M${x} ${y - 5} V${labelY + 4}`} tone="hub" />}
        <circle cx={x} cy={y} r={5} className="fill-sky-700 dark:fill-sky-300" />
        <Mono x={labelX} y={labelY} anchor={anchor} size={size} bold>{group.orders.map((order) => order.key).join(' · ')}</Mono>
      </g>
    )
  })
}

function loadTimeLabels(groups: OrderGroup[], left: number, right: number, y: number, size: number) {
  if (DELIVERY_TIMES.length === 1) {
    return (
      <Small x={right} y={y} anchor="end" size={size}>
        each delivery loads at {DELIVERY_TIMES[0]}
      </Small>
    )
  }

  return groups.map((group, index) => {
    const x = dayPosition(group.date, left, right)
    const anchor = index === 0 ? 'start' : index === groups.length - 1 ? 'end' : 'middle'
    const labelX = x + (anchor === 'start' ? 8 : anchor === 'end' ? -8 : 0)
    const times = [...new Set(group.orders.map((order) => order.ldts.slice(11, 16)))].join(' · ')
    return <Small key={group.date} x={labelX} y={y} anchor={anchor} size={size}>{times}</Small>
  })
}

const drawingTitle = `${ORDERS.length} orders on shared business-time and load-time axes`
const drawingDesc =
  `All ${ORDERS.length} orders are grouped by date on the same day scale from ${dayLabel(FIRST_DAY)} to ${dayLabel(LAST_DAY)}. ` +
  `The dashed cutoff marks the end of ${CUTOFF} on both axes. ` +
  (DELIVERY_TIMES.length === 1
    ? `Each delivery loads at ${DELIVERY_TIMES[0]}.`
    : 'Load-time markers show each delivery time.')

export function TimeAxesDrawing() {
  const wideLeft = 150
  const wideRight = 805
  const wideCutoff = position(`${addDays(CUTOFF, 1)}T00:00:00`, wideLeft, wideRight)
  const narrowLeft = 45
  const narrowRight = 378
  const narrowCutoff = position(`${addDays(CUTOFF, 1)}T00:00:00`, narrowLeft, narrowRight)

  return (
    <Drawing
      id="time-axes"
      title={drawingTitle}
      desc={drawingDesc}
      className="my-2"
      caption="The same cutoff can include a business date but exclude the later load date."
      wide={{
        viewBox: '0 22 820 300',
        content: (
          <>
            <Small x={20} y={74}>business time</Small>
            <Small x={20} y={207}>load time</Small>
            <Line d={`M${wideCutoff} 48 V310`} tone="stage" dashed />
            <Small x={wideCutoff} y={34} anchor="middle" size={10}>cutoff · end of {CUTOFF}</Small>
            <Line d={`M${wideLeft} 120 H${wideRight}`} />
            {dayTicks(120, 148, wideLeft, wideRight, 10)}
            {axisMarkers(BUSINESS_GROUPS, 120, wideLeft, wideRight, 10)}
            <Line d={`M${wideLeft} 276 H${wideRight}`} />
            {dayTicks(276, 300, wideLeft, wideRight, 10)}
            {axisMarkers(LOAD_GROUPS, 276, wideLeft, wideRight, 10, true)}
            {loadTimeLabels(LOAD_GROUPS, wideLeft, wideRight, 190, 9.5)}
          </>
        ),
      }}
      narrow={{
        viewBox: '0 18 390 370',
        content: (
          <>
            <Small x={16} y={72}>business time</Small>
            <Small x={16} y={205}>load time</Small>
            <Line d={`M${narrowCutoff} 44 V376`} tone="stage" dashed />
            <Small x={narrowCutoff} y={30} anchor="middle" size={9}>cutoff · end of {CUTOFF}</Small>
            <Line d={`M${narrowLeft} 120 H${narrowRight}`} />
            {dayTicks(120, 148, narrowLeft, narrowRight, 9)}
            {axisMarkers(BUSINESS_GROUPS, 120, narrowLeft, narrowRight, 9)}
            <Line d={`M${narrowLeft} 300 H${narrowRight}`} />
            {dayTicks(300, 350, narrowLeft, narrowRight, 9)}
            {axisMarkers(LOAD_GROUPS, 300, narrowLeft, narrowRight, 9, true)}
            {loadTimeLabels(LOAD_GROUPS, narrowLeft, narrowRight, 330, 8.5)}
          </>
        ),
      }}
    />
  )
}
