import { CUSTOMERS } from '@/lib/dv/dataset'
import { isGhost, simulate } from '@/lib/dv/engine'
import { MODEL } from '@/lib/dv/models'
import { Drawing, Card, Line, Mono, Note, Small } from './kit'

const RUN = simulate()[2]
const ALICE = CUSTOMERS[0].find((row) => row.c_name.startsWith('Alice'))!
const HUB = RUN.tables.customer_h.find((row) => row.c_custkey === ALICE.c_custkey && !isGhost(row))!
const VERSIONS = RUN.tables.customer_n_s
  .filter((row) => row.hk_customer_h === HUB.hk_customer_h && !isGhost(row))
  .sort((a, b) => String(a.ldts).localeCompare(String(b.ldts)))
const BEFORE = VERSIONS[0]
const AFTER = VERSIONS.at(-1)!
const TITLE = 'An update overwrites a value; the satellite stores both versions'
const DESC =
  `${ALICE.c_name}'s ${BEFORE.c_mktsegment} value changes to ${AFTER.c_mktsegment}. ` +
  `A relational UPDATE leaves one current value; ${MODEL.customer_n_s.name} keeps both payload versions with their simulated load dates.`

const wide = (
  <>
    <Note x={24} y={42}>reporting table · UPDATE</Note>
    <Card x={24} y={58} w={332} h={90} tone="ink" />
    <Mono x={42} y={88} bold>{`${ALICE.c_name} · ${BEFORE.c_mktsegment}`}</Mono>
    <Small x={42} y={120}>one row before the change</Small>
    <Line d="M356 103 H420" arrow />
    <Small x={388} y={90} anchor="middle">UPDATE</Small>
    <Card x={430} y={58} w={332} h={90} tone="ink" />
    <Mono x={448} y={88} bold>{`${ALICE.c_name} · ${AFTER.c_mktsegment}`}</Mono>
    <Small x={448} y={120}>the old value is overwritten</Small>

    <Note x={24} y={184}>{MODEL.customer_n_s.name} · insert-only history</Note>
    {VERSIONS.map((row, index) => {
      const y = 200 + index * 64
      return (
        <g key={String(row.ldts)}>
          <Card x={24} y={y} w={738} h={54} tone="sat" />
          <Mono x={42} y={y + 23} tone="sat" bold>{`v${index + 1} · ${row.c_mktsegment}`}</Mono>
          <Small x={740} y={y + 23} anchor="end">{`ldts · ${String(row.ldts)}`}</Small>
        </g>
      )
    })}
  </>
)

const narrow = (
  <>
    <Note x={20} y={28}>reporting table · UPDATE</Note>
    <Card x={20} y={42} w={320} h={68} tone="ink" />
    <Mono x={36} y={69} bold>{`${ALICE.c_name} · ${BEFORE.c_mktsegment}`}</Mono>
    <Small x={36} y={94}>one row before the change</Small>
    <Line d="M180 110 V134" arrow />
    <Card x={20} y={140} w={320} h={68} tone="ink" />
    <Mono x={36} y={167} bold>{`${ALICE.c_name} · ${AFTER.c_mktsegment}`}</Mono>
    <Small x={36} y={192}>UPDATE overwrites the old value</Small>
    <Note x={20} y={244}>{MODEL.customer_n_s.name} · insert-only history</Note>
    {VERSIONS.map((row, index) => {
      const y = 260 + index * 90
      return (
        <g key={String(row.ldts)}>
          <Card x={20} y={y} w={320} h={76} tone="sat" />
          <Mono x={36} y={y + 27} tone="sat" bold>{`v${index + 1} · ${row.c_mktsegment}`}</Mono>
          <Small x={36} y={y + 53}>{`ldts · ${String(row.ldts)}`}</Small>
        </g>
      )
    })}
  </>
)

export function HistoryUpdateDrawing() {
  return (
    <Drawing
      id="history-update"
      title={TITLE}
      desc={DESC}
      wide={{ viewBox: '0 0 800 338', content: wide }}
      narrow={{ viewBox: '0 0 360 470', content: narrow }}
    />
  )
}
