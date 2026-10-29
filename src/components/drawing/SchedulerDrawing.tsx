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
    <Line d="M78 34 H20 V584" dashed />
    <Line d="M20 294 H58" dashed arrow />
    <Line d="M20 438 H78" dashed arrow />
    <Line d="M20 512 H78" dashed arrow />
    <Line d="M20 584 H78" dashed arrow />

    <Line d="M195 130 V146" arrow />
    <Line d="M195 198 V214" arrow />
    <Line d="M195 390 V410" arrow />
    <Line d="M195 466 V486" arrow />
    <Line d="M195 538 V558" arrow />
    <Line d="M195 610 V630" arrow />

    <Card x={78} y={10} w={234} h={48} tone="ink" />
    <Small x={195} y={29} anchor="middle">orchestrator</Small>
    <Small x={195} y={46} anchor="middle" size={10}>when and in what order</Small>
    <Card x={78} y={78} w={234} h={52} tone="stage" />
    <Small x={195} y={108} anchor="middle">delivery lands · {BATCHES[0].slice(0, 10)}</Small>
    <Card x={78} y={146} w={234} h={52} tone="stage" />
    <Small x={195} y={177} anchor="middle">persistent staging</Small>

    <Card x={58} y={214} w={274} h={176} tone="ink" />
    <Small x={195} y={235} anchor="middle">dbt build · test each model</Small>
    <Card x={78} y={248} w={234} h={28} tone="stage" r={7} />
    <Small x={195} y={267} anchor="middle">stage + test</Small>
    <Line d="M195 276 V284" arrow />
    <Card x={78} y={284} w={234} h={28} tone="hub" r={7} />
    <Small x={195} y={303} anchor="middle">raw vault + test</Small>
    <Line d="M195 312 V320" arrow />
    <Card x={78} y={320} w={234} h={28} tone="sat" r={7} />
    <Small x={195} y={339} anchor="middle">business vault + test</Small>
    <Small x={195} y={372} anchor="middle" size={10}>tests run before downstream models</Small>

    <Card x={78} y={410} w={234} h={56} tone="sat" />
    <Small x={195} y={433} anchor="middle">optional calculation job</Small>
    <Small x={195} y={451} anchor="middle" size={10}>writes its own table</Small>
    <Card x={78} y={486} w={234} h={52} tone="stage" />
    <Small x={195} y={517} anchor="middle">checks</Small>
    <Card x={78} y={558} w={234} h={52} tone="link" />
    <Small x={195} y={589} anchor="middle">publish</Small>
    <Card x={78} y={630} w={234} h={52} tone="ink" />
    <Small x={195} y={661} anchor="middle">marts / readers</Small>

    <Line d="M20 722 H54" />
    <Small x={62} y={726}>solid = data</Small>
    <Line d="M198 722 H232" dashed />
    <Small x={240} y={726}>dashed = control</Small>
  </>
)

export function SchedulerDrawing() {
  return (
    <Drawing
      id="scheduler"
      title={title}
      desc={desc}
      wide={{ viewBox: '0 0 1030 245', content: wide }}
      narrow={{ viewBox: '0 0 390 750', content: narrow }}
    />
  )
}
