import { Card, Drawing, Mono, Small, type Tone } from '@/components/drawing/kit'

const TITLE = 'Anatomy of a command'
const DESC = 'ls -l data has three parts: ls is the command, which program runs; -l is an option, how to do it; data is the argument, what to work on.'

const PARTS: { text: string; tone: Tone; name: string; hint: string }[] = [
  { text: 'ls', tone: 'hub', name: 'command', hint: 'which program' },
  { text: '-l', tone: 'sat', name: 'option', hint: 'how to do it' },
  { text: 'data', tone: 'stage', name: 'argument', hint: 'what to work on' },
]

const wide = (
  <>
    {PARTS.map((p, i) => {
      const x = 30 + i * 200
      return (
        <g key={p.name}>
          <Card x={x} y={20} w={170} h={60} tone={p.tone} r={10} />
          <Mono x={x + 85} y={58} anchor="middle" size={24} tone={p.tone} bold>{p.text}</Mono>
          <Mono x={x + 85} y={108} anchor="middle" size={14} bold>{p.name}</Mono>
          <Small x={x + 85} y={128} anchor="middle">{p.hint}</Small>
        </g>
      )
    })}
  </>
)

const narrow = (
  <>
    {PARTS.map((p, i) => {
      const y = 16 + i * 72
      return (
        <g key={p.name}>
          <Card x={16} y={y} w={110} h={56} tone={p.tone} r={10} />
          <Mono x={71} y={y + 36} anchor="middle" size={20} tone={p.tone} bold>{p.text}</Mono>
          <Mono x={144} y={y + 24} size={14} bold>{p.name}</Mono>
          <Small x={144} y={y + 44}>{p.hint}</Small>
        </g>
      )
    })}
  </>
)

export function CommandAnatomyDrawing() {
  return <Drawing id="command-anatomy" title={TITLE} desc={DESC} wide={{ viewBox: '0 0 620 145', content: wide }} narrow={{ viewBox: '0 0 360 230', content: narrow }} />
}
