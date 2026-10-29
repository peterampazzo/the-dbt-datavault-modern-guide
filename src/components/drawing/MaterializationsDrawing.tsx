import { Drawing, Card, Line, Mono, Note, Small } from './kit'
import { MODEL } from '@/lib/dv/models'

const VIEW = MODEL.dim_customer
const TABLE = MODEL.customer_integrated_s
const INCREMENTAL = MODEL.customer_order_total_s
const SELECT = VIEW.code.match(/\bSELECT\b/)?.[0] ?? 'SELECT'

const CHOICES = [
  { model: VIEW, effect: 'runs at query time' },
  { model: TABLE, effect: 'stored on a full build' },
  { model: INCREMENTAL, effect: 'appends new rows' },
]

const TITLE = 'One SELECT can produce a view, table, or incremental result'
const DESC =
  `The ${SELECT} from ${VIEW.name} feeds three materialization choices: ${VIEW.materialized}, ${TABLE.materialized}, and ${INCREMENTAL.materialized}. ` +
  'A view runs at query time, a table is stored and rebuilt, and an incremental model appends new rows.'

const wide = (
  <>
    <Note x={30} y={42}>same model query</Note>
    <Card x={30} y={58} w={190} h={98} tone="stage" />
    <Mono x={48} y={90} tone="stage" bold>{SELECT} …</Mono>
    <Small x={48} y={120}>{VIEW.name}</Small>
    <Line d="M220 107 H244 V63 H270" arrow />
    <Line d="M244 107 H270" arrow />
    <Line d="M244 107 V151 H270" arrow />
    {CHOICES.map((choice, index) => {
      const y = 34 + index * 78
      return (
        <g key={choice.model.name}>
          <Card x={280} y={y} w={490} h={64} tone={index === 0 ? 'hub' : index === 1 ? 'link' : 'sat'} />
          <Mono x={300} y={y + 24} tone={index === 0 ? 'hub' : index === 1 ? 'link' : 'sat'} bold>
            {`${choice.model.materialized} · ${choice.model.name}`}
          </Mono>
          <Small x={300} y={y + 47}>{choice.effect}</Small>
        </g>
      )
    })}
  </>
)

const narrow = (
  <>
    <Note x={20} y={30}>same model query</Note>
    <Card x={20} y={44} w={320} h={68} tone="stage" />
    <Mono x={38} y={72} tone="stage" bold>{SELECT} …</Mono>
    <Small x={38} y={97}>{VIEW.name}</Small>
    <Line d="M180 112 V130 H10 V394" />
    {CHOICES.map((choice, index) => {
      const y = 148 + index * 104
      const tone = index === 0 ? 'hub' : index === 1 ? 'link' : 'sat'
      return (
        <g key={choice.model.name}>
          <Card x={20} y={y} w={320} h={76} tone={tone} />
          <Line d={`M10 ${y + 38} H20`} arrow />
          <Mono x={38} y={y + 29} tone={tone} bold>{`${choice.model.materialized} · ${choice.model.name}`}</Mono>
          <Small x={38} y={y + 54}>{choice.effect}</Small>
        </g>
      )
    })}
  </>
)

export function MaterializationsDrawing() {
  return (
    <Drawing
      id="materializations"
      title={TITLE}
      desc={DESC}
      wide={{ viewBox: '0 0 800 278', content: wide }}
      narrow={{ viewBox: '0 0 360 482', content: narrow }}
    />
  )
}
