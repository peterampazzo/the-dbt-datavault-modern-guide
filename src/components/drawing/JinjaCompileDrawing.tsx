import { PRIMER } from '@/lib/primer/project'
import { Drawing, Card, Line, Mono, Small } from './kit'

const TITLE = 'A Jinja template becomes compiled SQL before execution'
const DESC = `The ${PRIMER.round_amount_macro.path} macro is called by a model and compiled into SQL for inspection.`
const COMPILED_FILE = PRIMER.compiled_round_amount.path.split('/').at(-1)!
const wide = (
  <>
    <Card x={20} y={24} w={235} h={100} tone="stage" />
    <Mono x={36} y={50} bold>{PRIMER.round_amount_macro.path}</Mono>
    <Small x={36} y={75}>Jinja macro + model call</Small>
    <Line d="M260 74 H330" arrow />
    <Card x={340} y={24} w={235} h={100} tone="link" />
    <Mono x={356} y={50} bold>dbt compile</Mono>
    <Small x={356} y={75}>renders the selected model</Small>
    <Line d="M580 74 H650" arrow />
    <Card x={660} y={24} w={125} h={100} tone="hub" />
    <Mono x={674} y={50} size={11} bold>compiled SQL</Mono>
    <Small x={674} y={75}>inspectable file</Small>
  </>
)
const narrow = (
  <>
    {[['Template', PRIMER.round_amount_macro.path, 'stage'], ['Compile', 'dbt compile', 'link'], ['Output', COMPILED_FILE, 'hub']].map(([label, value, tone], i) => (
      <g key={label}>
        <Card x={20} y={i * 106 + 10} w={320} h={76} tone={tone as 'stage' | 'link' | 'hub'} />
        <Mono x={36} y={i * 106 + 39} bold>{label}</Mono>
        <Small x={36} y={i * 106 + 62}>{value}</Small>
        {i < 2 && <Line d={`M180 ${i * 106 + 87} V${i * 106 + 110}`} arrow />}
      </g>
    ))}
  </>
)
export function JinjaCompileDrawing() {
  return <Drawing id="jinja-compile" title={TITLE} desc={DESC} wide={{ viewBox: '0 0 800 145', content: wide }} narrow={{ viewBox: '0 0 360 312', content: narrow }} />
}
