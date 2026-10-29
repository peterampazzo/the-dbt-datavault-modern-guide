import { BATCHES } from '@/lib/dv/dataset'
import { simulate } from '@/lib/dv/engine'
import { MODEL } from '@/lib/dv/models'
import { Drawing, Card, Line, Mono, Note, Small } from './kit'

const RUNS = simulate()
const MODEL_NAME = MODEL.customer_n_s.name
const HWM = RUNS[1].hwm.customer_n_s!
const PROCESSED = RUNS[1].decisions.customer_n_s.filter(
  (decision) => decision.status === 'inserted' && decision.row.ldts === RUNS[1].ldts,
).length

const TITLE = 'Incremental runs process load dates above the high-water mark'
const DESC =
  `${MODEL_NAME} has max(ldts) at ${HWM}. The next batches have later load dates and are processed. ` +
  'A full refresh starts with an empty target and rebuilds from retained deliveries.'

function BatchLabels({ xs, y }: { xs: number[]; y: number }) {
  return BATCHES.map((batch, index) => (
    <g key={batch}>
      <Mono x={xs[index]} y={y} anchor="middle" size={10} bold>{batch.slice(5, 10)}</Mono>
      <Small x={xs[index]} y={y + 17} anchor="middle" size={9}>{`batch ${index + 1}`}</Small>
    </g>
  ))
}

const wideXs = [150, 405, 660]
const narrowXs = [72, 180, 288]
const wide = (
  <>
    <Note x={30} y={38}>{MODEL_NAME} · incremental target</Note>
    <BatchLabels xs={wideXs} y={66} />
    <Line d={`M${wideXs[0]} 104 H${wideXs[2]}`} />
    {wideXs.map((x) => <circle key={x} cx={x} cy={104} r={7} className="fill-violet-700 dark:fill-violet-300" />)}
    <Line d={`M${wideXs[0]} 100 V114`} tone="stage" dashed />
    <Note x={wideXs[0]} y={138} anchor="middle" size={14}>max(ldts)</Note>
    <Small x={wideXs[0]} y={153} anchor="middle" size={9}>{HWM}</Small>
    <Small x={wideXs[1]} y={137} anchor="middle">ldts &gt; max(ldts) · process later rows</Small>
    <Card x={30} y={162} w={740} h={80} tone="stage" />
    <Mono x={50} y={190} tone="stage" bold>Full refresh</Mono>
    <Small x={50} y={218}>target starts empty; retained deliveries are read again</Small>
    <Small x={750} y={190} anchor="end">{`${PROCESSED} changed rows inserted in batch 2`}</Small>
  </>
)

const narrow = (
  <>
    <Note x={20} y={30}>{MODEL_NAME} · incremental target</Note>
    <BatchLabels xs={narrowXs} y={60} />
    <Line d={`M${narrowXs[0]} 100 H${narrowXs[2]}`} />
    {narrowXs.map((x) => <circle key={x} cx={x} cy={100} r={6} className="fill-violet-700 dark:fill-violet-300" />)}
    <Line d={`M${narrowXs[0]} 96 V110`} tone="stage" dashed />
    <Note x={narrowXs[0] + 8} y={132} size={13}>max(ldts)</Note>
    <Small x={narrowXs[0] + 8} y={148} size={8}>{HWM}</Small>
    <Small x={20} y={173}>Only rows with a later ldts are processed.</Small>
    <Card x={20} y={184} w={320} h={82} tone="stage" />
    <Mono x={38} y={213} tone="stage" bold>Full refresh</Mono>
    <Small x={38} y={241}>target starts empty</Small>
    <Small x={20} y={288}>Retained deliveries are read again.</Small>
    <Small x={20} y={320}>{`${PROCESSED} changed rows inserted in batch 2`}</Small>
  </>
)

export function HighWaterMarkDrawing() {
  return (
    <Drawing
      id="high-water-mark"
      title={TITLE}
      desc={DESC}
      wide={{ viewBox: '0 0 800 264', content: wide }}
      narrow={{ viewBox: '0 0 360 350', content: narrow }}
    />
  )
}
