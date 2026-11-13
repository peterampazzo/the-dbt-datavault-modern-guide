import { prompt } from '@/books/foundations/lib/shell/shell'
import { PROJECT } from '@/books/foundations/lib/shell/fs'
import { Drawing, Line, Mono, Small, type Tone } from '@/components/drawing/kit'

const TEXT = `${prompt(PROJECT)} pwd`
const TITLE = 'The parts of a terminal prompt'
const DESC = `The line ${TEXT} split into parts: student is the user, laptop is the machine, ~/orders-report is the folder you are in, $ means the terminal is waiting, and pwd is the command you typed.`

const at = (s: string) => TEXT.indexOf(s)
const PARTS: { start: number; len: number; tone: Tone; label: string; row: number; anchor?: 'start' | 'middle' | 'end' }[] = [
  { start: at('student'), len: 7, tone: 'hub', label: 'user', row: 1 },
  { start: at('laptop'), len: 6, tone: 'link', label: 'machine', row: 2 },
  { start: at('~/'), len: '~/orders-report'.length, tone: 'stage', label: 'the folder you are in', row: 1 },
  { start: at('$'), len: 1, tone: 'sat', label: 'waiting for you', row: 3, anchor: 'end' },
  { start: at(' pwd') + 1, len: 3, tone: 'ink', label: 'your command', row: 2, anchor: 'start' },
]

const CW = 13.2
const X0 = 30

const wide = (
  <>
    <Mono x={X0} y={44} size={22}>{TEXT}</Mono>
    {PARTS.map((p) => {
      const x1 = X0 + p.start * CW
      const x2 = X0 + (p.start + p.len) * CW
      const mid = (x1 + x2) / 2
      const y = 62 + p.row * 34
      return (
        <g key={p.label}>
          <Line d={`M${x1 + 1} 58 L${x1 + 1} 64 L${x2 - 1} 64 L${x2 - 1} 58`} tone={p.tone} />
          <Line d={`M${mid} 64 L${mid} ${y - 14}`} tone={p.tone} />
          <Mono x={p.anchor === 'start' ? mid - 4 : p.anchor === 'end' ? mid + 4 : mid} y={y} anchor={p.anchor ?? 'middle'} size={13} tone={p.tone} bold>{p.label}</Mono>
        </g>
      )
    })}
    <Small x={X0} y={204}>Everything up to the $ is printed by the terminal. You type after it.</Small>
  </>
)

const narrow = (
  <>
    <Mono x={16} y={30} size={14}>{TEXT}</Mono>
    {PARTS.map((p, i) => (
      <g key={p.label}>
        <Mono x={16} y={70 + i * 30} size={14} tone={p.tone} bold>{TEXT.slice(p.start, p.start + p.len)}</Mono>
        <Small x={170} y={70 + i * 30}>{p.label}</Small>
      </g>
    ))}
  </>
)

export function PromptDrawing() {
  return <Drawing id="prompt" title={TITLE} desc={DESC} wide={{ viewBox: '0 0 600 220', content: wide }} narrow={{ viewBox: '0 0 360 220', content: narrow }} />
}
