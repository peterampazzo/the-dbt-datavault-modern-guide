import { BATCHES } from '@/lib/dv/dataset'
import { Card, Drawing, Line, Mono, Small } from './kit'

const title = 'An orchestrator controls a dbt delivery run'
const desc = `Delivery ${BATCHES[0].slice(0, 10)} lands in persistent staging, then dbt builds stage, raw-vault and business-vault models with tests per model. Optional calculation, checks and publish jobs follow. Solid arrows show data; dashed arrows show control.`

const wide = (
  <>
    <Line d="M126 153 H140" arrow />
    <Line d="M253 153 H270" arrow />
    <Line d="M600 153 H620" arrow />
    <Line d="M726 153 H740" arrow />
    <Line d="M814 153 H828" arrow />
    <Line d="M902 153 H916" arrow />
    <Line d="M505 58 V82 H435 V105" dashed arrow />
    <Line d="M505 58 V83 H673 V111" dashed arrow />
    <Line d="M505 58 V84 H777 V111" dashed arrow />
    <Line d="M505 58 V85 H865 V111" dashed arrow />

    <Card x={405} y={12} w={200} h={46} tone="ink" />
    <Small x={505} y={31} anchor="middle">orchestrator</Small>
    <Small x={505} y={47} anchor="middle" size={10}>when and in what order</Small>

    <Card x={18} y={120} w={108} h={66} tone="stage" />
    <Small x={72} y={143} anchor="middle">delivery lands</Small>
    <Mono x={72} y={164} anchor="middle" size={10}>{BATCHES[0].slice(0, 10)}</Mono>
    <Card x={140} y={120} w={113} h={66} tone="stage" />
    <Small x={196} y={143} anchor="middle">persistent</Small>
    <Small x={196} y={161} anchor="middle">staging</Small>

    <Card x={270} y={101} w={330} h={105} tone="ink" />
    <Small x={435} y={119} anchor="middle">dbt build</Small>
    <Card x={282} y={129} w={94} h={48} tone="stage" r={8} />
    <Small x={329} y={147} anchor="middle">stage</Small>
    <Small x={329} y={164} anchor="middle" size={10}>test</Small>
    <Line d="M376 153 H388" arrow />
    <Card x={388} y={129} w={94} h={48} tone="hub" r={8} />
    <Small x={435} y={147} anchor="middle">raw vault</Small>
    <Small x={435} y={164} anchor="middle" size={10}>test</Small>
    <Line d="M482 153 H494" arrow />
    <Card x={494} y={129} w={94} h={48} tone="sat" r={8} />
    <Small x={541} y={147} anchor="middle">business vault</Small>
    <Small x={541} y={164} anchor="middle" size={10}>test</Small>
    <Small x={435} y={195} anchor="middle" size={10}>tests run before downstream models</Small>

    <Card x={620} y={120} w={106} h={66} tone="sat" />
    <Small x={673} y={143} anchor="middle">optional</Small>
    <Small x={673} y={160} anchor="middle">calculation job</Small>
    <Small x={673} y={178} anchor="middle" size={9}>writes its own table</Small>
    <Card x={740} y={120} w={74} h={66} tone="stage" />
    <Small x={777} y={156} anchor="middle">checks</Small>
    <Card x={828} y={120} w={74} h={66} tone="link" />
    <Small x={865} y={156} anchor="middle">publish</Small>
    <Card x={916} y={120} w={100} h={66} tone="ink" />
    <Small x={966} y={143} anchor="middle">marts /</Small>
    <Small x={966} y={161} anchor="middle">readers</Small>

    <Line d="M20 223 H56" />
    <Small x={64} y={227}>solid = data</Small>
    <Line d="M160 223 H196" dashed />
    <Small x={204} y={227}>dashed = control</Small>
  </>
)

const narrow = (
  <>
    <Line d="M195 54 V69 H28 V293 H46" dashed arrow />
    <Line d="M195 54 V352 H72" dashed arrow />
    <Line d="M195 54 V411 H72" dashed arrow />
    <Line d="M195 54 V470 H72" dashed arrow />

    <Line d="M195 115 V130" arrow />
    <Line d="M195 184 V201" arrow />
    <Line d="M195 339 V350" arrow />
    <Line d="M195 395 V409" arrow />
    <Line d="M195 454 V468" arrow />
    <Line d="M195 513 V528" arrow />

    <Card x={82} y={8} w={226} h={46} tone="ink" />
    <Small x={195} y={27} anchor="middle">orchestrator</Small>
    <Small x={195} y={44} anchor="middle" size={10}>when and in what order</Small>
    <Card x={82} y={69} w={226} h={46} tone="stage" />
    <Small x={195} y={88} anchor="middle">delivery · {BATCHES[0].slice(0, 10)}</Small>
    <Small x={195} y={104} anchor="middle">lands</Small>
    <Card x={82} y={130} w={226} h={54} tone="stage" />
    <Small x={195} y={152} anchor="middle">persistent staging</Small>

    <Card x={46} y={201} w={298} h={138} tone="ink" />
    <Small x={195} y={219} anchor="middle">dbt build · test each model</Small>
    <Card x={82} y={231} w={226} h={28} tone="stage" r={7} />
    <Small x={195} y={250} anchor="middle">stage + test</Small>
    <Line d="M195 259 V267" arrow />
    <Card x={82} y={267} w={226} h={28} tone="hub" r={7} />
    <Small x={195} y={286} anchor="middle">raw vault + test</Small>
    <Line d="M195 295 V303" arrow />
    <Card x={82} y={303} w={226} h={28} tone="sat" r={7} />
    <Small x={195} y={322} anchor="middle">business vault + test</Small>

    <Card x={72} y={350} w={246} h={45} tone="sat" />
    <Small x={195} y={369} anchor="middle">optional calculation job</Small>
    <Small x={195} y={386} anchor="middle" size={10}>writes its own table</Small>
    <Card x={72} y={409} w={246} h={45} tone="stage" />
    <Small x={195} y={437} anchor="middle">checks</Small>
    <Card x={72} y={468} w={246} h={45} tone="link" />
    <Small x={195} y={496} anchor="middle">publish</Small>
    <Card x={72} y={528} w={246} h={45} tone="ink" />
    <Small x={195} y={556} anchor="middle">marts / readers</Small>

    <Line d="M18 598 H52" />
    <Small x={60} y={602}>solid = data</Small>
    <Line d="M156 598 H190" dashed />
    <Small x={198} y={602}>dashed = control</Small>
  </>
)

export function SchedulerDrawing() {
  return (
    <Drawing
      id="scheduler"
      title={title}
      desc={desc}
      wide={{ viewBox: '0 0 1030 245', content: wide }}
      narrow={{ viewBox: '0 0 390 615', content: narrow }}
    />
  )
}
