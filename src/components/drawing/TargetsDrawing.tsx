import { PRIMER } from '@/lib/primer/project'
import { Drawing, Card, Line, Mono, Small } from './kit'

const TARGETS = [...PRIMER.profiles.code.matchAll(/^\s{4}([\w-]+):\s*$/gm)].map((match) => match[1])
const TITLE = 'The same dbt project can target separate dev, ci, and prod schemas'
const DESC = `The target names ${TARGETS.join(', ')} come from the primer profiles and point model output to separate locations.`
const wide = (
  <>
    <Card x={22} y={28} w={210} h={82} tone="ink" /><Mono x={38} y={60} bold>Same models</Mono><Small x={38} y={84}>unchanged SQL</Small>
    {TARGETS.map((target, index) => {
      const y = 8 + index * 48
      return <g key={target}><Line d={`M234 69 H280 V${y + 32} H318`} arrow /><Card x={328} y={y} w={200} h={46} tone={index === 2 ? 'hub' : 'stage'} /><Mono x={344} y={y + 28} bold>{target} target</Mono><Line d={`M530 ${y + 23} H584`} arrow /><Small x={596} y={y + 28}>{target} output schema</Small></g>
    })}
  </>
)
const narrow = (
  <>
    <Card x={20} y={8} w={320} h={58} tone="ink" /><Mono x={36} y={43} bold>Same models · unchanged SQL</Mono>
    {TARGETS.map((target, index) => {
      const y = 88 + index * 84
      return <g key={target}><Line d={`M180 ${index === 0 ? 66 : y - 22} V${y - 4}`} arrow /><Card x={20} y={y} w={320} h={58} tone={index === 2 ? 'hub' : 'stage'} /><Mono x={36} y={y + 26} bold>{target} target</Mono><Small x={36} y={y + 46}>{target} output schema</Small></g>
    })}
  </>
)
export function TargetsDrawing() {
  return <Drawing id="targets" title={TITLE} desc={DESC} wide={{ viewBox: '0 0 800 170', content: wide }} narrow={{ viewBox: '0 0 360 360', content: narrow }} />
}
