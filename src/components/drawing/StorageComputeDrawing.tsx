import { Drawing, Card, Line, Mono, Note, Small } from './kit'
import { MODEL } from '@/lib/dv/models'

const FILES = [MODEL.raw_customer.name, MODEL.raw_nation.name, MODEL.raw_orders.name]
const ENGINES = [
  { name: 'Fabric Spark', target: 'dbt-fabricspark' },
  { name: 'Databricks', target: 'dbt-databricks' },
]
const TITLE = 'Several compute engines read one persistent set of Delta files'
const DESC =
  `Persistent staging keeps ${FILES.join(', ')} in open Delta files in ADLS Gen2. ` +
  `${ENGINES.map((engine) => engine.name).join(' and ')} read the same files in place with separate dbt targets.`

const wide = (
  <>
    <Card x={24} y={70} w={260} h={160} tone="stage" />
    <Note x={44} y={98}>storage · unchanged</Note>
    <Mono x={44} y={126} tone="stage" bold>ADLS Gen2</Mono>
    <Small x={44} y={151}>open Delta files</Small>
    {FILES.map((file, index) => <Small key={file} x={44} y={176 + index * 18}>{file}</Small>)}
    <Small x={44} y={225}>persistent staging · one copy</Small>
    <Line d="M284 150 H322 V93 H360" arrow />
    <Line d="M322 150 V211 H360" arrow />
    {ENGINES.map((engine, index) => {
      const y = 55 + index * 124
      return (
        <g key={engine.name}>
          <Card x={370} y={y} w={402} h={82} tone={index === 0 ? 'hub' : 'link'} />
          <Mono x={390} y={y + 29} tone={index === 0 ? 'hub' : 'link'} bold>{engine.name}</Mono>
          <Small x={390} y={y + 55}>reads the same files in place</Small>
          <Small x={750} y={y + 55} anchor="end">{`dbt target · ${engine.target}`}</Small>
        </g>
      )
    })}
  </>
)

const narrow = (
  <>
    <Card x={20} y={30} w={320} h={118} tone="stage" />
    <Note x={36} y={56}>storage · unchanged</Note>
    <Mono x={36} y={81} tone="stage" bold>ADLS Gen2 · Delta files</Mono>
    <Small x={36} y={104}>{FILES.join(' · ')}</Small>
    <Small x={36} y={129}>persistent staging · one copy</Small>
    <Line d="M180 148 V168 H95 V190" arrow />
    <Line d="M180 168 H265 V190" arrow />
    <Card x={20} y={196} w={150} h={94} tone="hub" />
    <Mono x={34} y={224} tone="hub" bold>{ENGINES[0].name}</Mono>
    <Small x={34} y={247}>reads in place</Small>
    <Small x={34} y={273}>{ENGINES[0].target}</Small>
    <Card x={190} y={196} w={150} h={94} tone="link" />
    <Mono x={204} y={224} tone="link" bold>{ENGINES[1].name}</Mono>
    <Small x={204} y={247}>reads in place</Small>
    <Small x={204} y={273}>{ENGINES[1].target}</Small>
    <Small x={20} y={322}>The engine and target change; the files stay put.</Small>
  </>
)

export function StorageComputeDrawing() {
  return (
    <Drawing
      id="storage-compute"
      title={TITLE}
      desc={DESC}
      wide={{ viewBox: '0 0 800 280', content: wide }}
      narrow={{ viewBox: '0 0 360 344', content: narrow }}
    />
  )
}
