import { BATCHES, CUSTOMERS, NATIONS } from '@/lib/dv/dataset'
import { END, isGhost, satV1, simulate } from '@/lib/dv/engine'
import { MODEL } from '@/lib/dv/models'
import { Drawing, Card, Line, Mono, Note, Small } from './kit'

const RUNS = simulate()
const TABLES = RUNS[2].tables
const ALICE = CUSTOMERS[0].find((row) => row.c_name.startsWith('Alice'))!
const ALICE_KEY = TABLES.customer_h.find((row) => row.c_custkey === ALICE.c_custkey && !isGhost(row))!.hk_customer_h
const V0 = TABLES.customer_n_s.filter((row) => row.hk_customer_h === ALICE_KEY && !isGhost(row)).sort((a, b) => String(a.ldts).localeCompare(String(b.ldts)))
const V1 = satV1(TABLES.customer_n_s, 'hk_customer_h').filter((row) => row.hk_customer_h === ALICE_KEY && !isGhost(row))
const PHONE_ROWS = TABLES.customer_phone_ma_s.filter((row) => row.hk_customer_h === ALICE_KEY && !isGhost(row))

const CHIARA = CUSTOMERS[0].find((row) => row.c_name.startsWith('Chiara'))!
const CHIARA_LATER = CUSTOMERS[1].find((row) => row.c_custkey === CHIARA.c_custkey)!
const CHIARA_LINK = (nationKey: number) =>
  RUNS.flatMap((run) => run.stage.stg_customer)
    .find((row) => row.c_custkey === CHIARA.c_custkey && row.c_nationkey === nationKey)?.hk_customer_nation_l
const ITALY = NATIONS[0].find((row) => row.n_nationkey === CHIARA.c_nationkey)!
const GERMANY = NATIONS[1].find((row) => row.n_nationkey === CHIARA_LATER.c_nationkey)!
const ITALY_EVENTS = TABLES.customer_nation_es
  .filter((row) => row.hk_customer_nation_l === CHIARA_LINK(ITALY.n_nationkey))
  .sort((a, b) => String(a.ldts).localeCompare(String(b.ldts)))
const GERMANY_EVENTS = TABLES.customer_nation_es
  .filter((row) => row.hk_customer_nation_l === CHIARA_LINK(GERMANY.n_nationkey))
  .sort((a, b) => String(a.ldts).localeCompare(String(b.ldts)))
const DANIEL = CUSTOMERS[0].find((row) => row.c_name.startsWith('Daniel'))!
const DANIEL_KEY = TABLES.customer_h.find((row) => row.c_custkey === DANIEL.c_custkey && !isGhost(row))!.hk_customer_h
const DANIEL_EVENTS = TABLES.customer_rts.filter((row) => row.hk_customer_h === DANIEL_KEY)

const TITLE = 'Five satellite flavours show versions, active sets, and observations'
const DESC =
  `The timelines use simulated rows for ${ALICE.c_name}, ${CHIARA.c_name}, and ${DANIEL.c_name}. ` +
  `They compare ${MODEL.customer_n_s.name} versions and intervals, ${MODEL.customer_phone_ma_s.name} phone sets, ` +
  `${MODEL.customer_nation_es.name} relationship activity, and ${MODEL.customer_rts.name} observations across the real load dates.`

function dates(xs: number[], y: number) {
  return BATCHES.map((batch, index) => (
    <Mono key={batch} x={xs[index]} y={y} anchor="middle" size={9}>{batch.slice(5, 10)}</Mono>
  ))
}

function latestPhoneCount(batchIndex: number) {
  const cutoff = BATCHES[batchIndex]
  const loaded = PHONE_ROWS.filter((row) => String(row.ldts) <= cutoff)
  const lastLdts = loaded.map((row) => String(row.ldts)).sort().at(-1)
  return loaded.filter((row) => String(row.ldts) === lastLdts).length
}

function eventIndex(ldts: unknown) {
  return Math.max(0, BATCHES.findIndex((batch) => batch === String(ldts)))
}

function intervalEndIndex(ldts: unknown) {
  if (String(ldts) === END) return BATCHES.length - 1
  const index = BATCHES.findIndex((batch) => String(ldts) <= batch)
  return index < 0 ? BATCHES.length - 1 : index
}

function timelineRow({
  y,
  label,
  subtitle,
  xs,
  labels,
  markers,
  note,
}: {
  y: number
  label: string
  subtitle: string
  xs: number[]
  labels: string[]
  markers: number[]
  note?: string
}) {
  return (
    <g>
      <Card x={12} y={y} w={776} h={note ? 94 : 62} tone="ink" />
      <Mono x={26} y={y + 24} size={11} bold>{label}</Mono>
      <Small x={26} y={y + 44} size={9}>{subtitle}</Small>
      <Line d={`M${xs[0]} ${y + 28} H${xs[xs.length - 1]}`} />
      {markers.map((index, item) => (
        <g key={`${label}-${item}`}>
          <circle cx={xs[index]} cy={y + 28} r={5} className="fill-amber-700 dark:fill-amber-300" />
          <Small x={xs[index]} y={y + 51} anchor="middle" size={9}>{labels[item]}</Small>
        </g>
      ))}
      {note && <Small x={xs[1]} y={y + 81} anchor="middle" size={9}>{note}</Small>}
    </g>
  )
}

const wideXs = [310, 500, 690]
const wide = (
  <>
    <Note x={26} y={34}>load date</Note>
    {dates(wideXs, 50)}
    {timelineRow({
      y: 62,
      label: MODEL.customer_n_s.name,
      subtitle: `${ALICE.c_name} · v0 payload versions`,
      xs: wideXs,
      markers: V0.map((row) => eventIndex(row.ldts)),
      labels: V0.map((row) => String(row.c_mktsegment)),
    })}
    <g>
      <Card x={12} y={130} w={776} h={62} tone="ink" />
      <Mono x={26} y={153} size={11} bold>{MODEL.customer_n_s.name} · v1</Mono>
      <Small x={26} y={174} size={9}>{`${ALICE.c_name} · load-date intervals`}</Small>
      <Line d={`M${wideXs[0]} 158 H${wideXs[2]}`} />
      {V1.map((row) => {
        const start = eventIndex(row.ldts)
        const end = wideXs[intervalEndIndex(row.ledts)]
        return (
          <g key={String(row.ldts)}>
            <Line d={`M${wideXs[start]} 158 H${Math.max(wideXs[start] + 12, end - 8)}`} tone="sat" />
            <Small x={wideXs[start]} y={184} anchor="middle" size={9}>{String(row.c_mktsegment)}</Small>
          </g>
        )
      })}
    </g>
    {timelineRow({
      y: 198,
      label: MODEL.customer_phone_ma_s.name,
      subtitle: `${ALICE.c_name} · active phone rows by load`,
      xs: wideXs,
      markers: BATCHES.map((_, index) => index).filter((index) => latestPhoneCount(index) > 0),
      labels: BATCHES.map((_, index) => `${latestPhoneCount(index)} rows`).filter((_, index) => latestPhoneCount(index) > 0),
    })}
    <g>
      <Card x={12} y={266} w={776} h={62} tone="ink" />
      <Mono x={26} y={289} size={11} bold>{MODEL.customer_nation_es.name}</Mono>
      <Small x={26} y={310} size={9}>{`${CHIARA.c_name} (#${CHIARA.c_custkey}) · ${ITALY.n_name} and ${GERMANY.n_name}`}</Small>
      <Line d={`M${wideXs[0]} 294 H${wideXs[2]}`} />
      {ITALY_EVENTS.map((row) => (
        <g key={`italy-${String(row.ldts)}`}>
          <circle cx={wideXs[eventIndex(row.ldts)]} cy={294} r={5} className="fill-amber-700 dark:fill-amber-300" />
          <Small x={wideXs[eventIndex(row.ldts)]} y={318} anchor="middle" size={9}>{`${ITALY.n_name} ${row.is_active ? 'active' : 'inactive'}`}</Small>
        </g>
      ))}
      {GERMANY_EVENTS.map((row) => (
        <g key={`germany-${String(row.ldts)}`}>
          <circle cx={wideXs[eventIndex(row.ldts)]} cy={283} r={4} className="fill-emerald-700 dark:fill-emerald-300" />
          <Small x={wideXs[eventIndex(row.ldts)]} y={278} anchor="middle" size={9}>{`${GERMANY.n_name} active`}</Small>
        </g>
      ))}
    </g>
    {timelineRow({
      y: 334,
      label: MODEL.customer_rts.name,
      subtitle: `${DANIEL.c_name} (#${DANIEL.c_custkey}) · source observations`,
      xs: wideXs,
      markers: DANIEL_EVENTS.map((row) => eventIndex(row.ldts)),
      labels: DANIEL_EVENTS.map((row) => String(row.ldts).slice(5, 10)),
      note: 'no Daniel observation',
    })}
  </>
)

function narrowRow({
  y,
  title,
  detail,
  xs,
  markers,
  labels,
  note,
}: {
  y: number
  title: string
  detail: string
  xs: number[]
  markers: number[]
  labels: string[]
  note?: string
}) {
  return (
    <g>
      <Card x={10} y={y} w={340} h={note ? 104 : 82} tone="ink" />
      <Mono x={20} y={y + 20} size={10} bold>{title}</Mono>
      <Small x={20} y={y + 37} size={9}>{detail}</Small>
      <Line d={`M${xs[0]} ${y + 51} H${xs[xs.length - 1]}`} />
      {markers.map((index, item) => (
        <g key={`${title}-${item}`}>
          <circle cx={xs[index]} cy={y + 51} r={4} className="fill-amber-700 dark:fill-amber-300" />
          <Small x={xs[index]} y={y + 72} anchor="middle" size={8}>{labels[item]}</Small>
        </g>
      ))}
      {note && <Small x={xs[1]} y={y + 97} anchor="middle" size={8}>{note}</Small>}
    </g>
  )
}

const narrowXs = [155, 232, 309]
const narrow = (
  <>
    <Note x={20} y={25}>load date</Note>
    {dates(narrowXs, 42)}
    {narrowRow({
      y: 52,
      title: MODEL.customer_n_s.name,
      detail: `${ALICE.c_name} · v0 versions`,
      xs: narrowXs,
      markers: V0.map((row) => eventIndex(row.ldts)),
      labels: V0.map((row) => String(row.c_mktsegment)),
    })}
    <g>
      <Card x={10} y={142} w={340} h={82} tone="ink" />
      <Mono x={20} y={162} size={10} bold>{`${MODEL.customer_n_s.name} · v1`}</Mono>
      <Small x={20} y={179} size={9}>{`${ALICE.c_name} · load-date intervals`}</Small>
      <Line d={`M${narrowXs[0]} 193 H${narrowXs[2]}`} />
      {V1.map((row) => {
        const start = eventIndex(row.ldts)
        const end = narrowXs[intervalEndIndex(row.ledts)]
        return (
          <g key={`narrow-v1-${String(row.ldts)}`}>
            <Line d={`M${narrowXs[start]} 193 H${Math.max(narrowXs[start] + 8, end - 5)}`} tone="sat" />
            <circle cx={narrowXs[start]} cy={193} r={4} className="fill-amber-700 dark:fill-amber-300" />
            <Small x={narrowXs[start]} y={216} anchor="middle" size={8}>{String(row.c_mktsegment)}</Small>
          </g>
        )
      })}
    </g>
    {narrowRow({
      y: 232,
      title: MODEL.customer_phone_ma_s.name,
      detail: `${ALICE.c_name} · active rows by load`,
      xs: narrowXs,
      markers: BATCHES.map((_, index) => index).filter((index) => latestPhoneCount(index) > 0),
      labels: BATCHES.map((_, index) => `${latestPhoneCount(index)} rows`).filter((_, index) => latestPhoneCount(index) > 0),
    })}
    <g>
      <Card x={10} y={322} w={340} h={90} tone="ink" />
      <Mono x={20} y={342} size={10} bold>{MODEL.customer_nation_es.name}</Mono>
      <Small x={20} y={359} size={9}>{`${CHIARA.c_name} (#${CHIARA.c_custkey}) · ${ITALY.n_name} and ${GERMANY.n_name}`}</Small>
      <Line d={`M${narrowXs[0]} 374 H${narrowXs[2]}`} />
      {ITALY_EVENTS.map((row) => (
        <g key={`narrow-italy-${String(row.ldts)}`}>
          <circle cx={narrowXs[eventIndex(row.ldts)]} cy={374} r={4} className="fill-amber-700 dark:fill-amber-300" />
          <Small x={narrowXs[eventIndex(row.ldts)]} y={390} anchor="middle" size={8}>{row.is_active ? 'active' : 'inactive'}</Small>
        </g>
      ))}
      <Line d={`M${narrowXs[0]} 397 H${narrowXs[2]}`} />
      {GERMANY_EVENTS.map((row) => (
        <g key={`narrow-germany-${String(row.ldts)}`}>
          <circle cx={narrowXs[eventIndex(row.ldts)]} cy={397} r={4} className="fill-emerald-700 dark:fill-emerald-300" />
          <Small x={narrowXs[eventIndex(row.ldts)]} y={410} anchor="middle" size={8}>{row.is_active ? 'active' : 'inactive'}</Small>
        </g>
      ))}
    </g>
    {narrowRow({
      y: 418,
      title: MODEL.customer_rts.name,
      detail: `${DANIEL.c_name} (#${DANIEL.c_custkey}) · source observations`,
      xs: narrowXs,
      markers: DANIEL_EVENTS.map((row) => eventIndex(row.ldts)),
      labels: DANIEL_EVENTS.map((row) => String(row.ldts).slice(5, 10)),
      note: 'no Daniel observation',
    })}
  </>
)

export function SatelliteFlavoursDrawing() {
  return (
    <Drawing
      id="satellite-flavours"
      title={TITLE}
      desc={DESC}
      wide={{ viewBox: '0 0 800 432', content: wide }}
      narrow={{ viewBox: '0 0 360 538', content: narrow }}
    />
  )
}
