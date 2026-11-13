import { PATH } from '@/books/foundations/lib/shell/shell'
import { Card, Drawing, Line, Mono, Small, type Tone } from '@/components/drawing/kit'

const TITLE = 'What happens when you press Enter'
const DESC = `Four steps for python3 report.py: the shell splits the line into the program python3 and the argument report.py, looks for python3 in the folders on PATH (${PATH}) and finds /usr/bin/python3, runs it in the folder you are in, ~/orders-report, and gets back an exit code: 0 means it worked. An AI tool that runs a command after you approve it goes through the same four steps.`

const STEPS: { n: string; title: string; detail: string; tone: Tone }[] = [
  { n: '1', title: 'Split the line', detail: 'python3 | report.py', tone: 'hub' },
  { n: '2', title: 'Find the program', detail: '/usr/bin/python3', tone: 'link' },
  { n: '3', title: 'Run it here', detail: '~/orders-report', tone: 'stage' },
  { n: '4', title: 'Exit code', detail: '0 = it worked', tone: 'sat' },
]

const wide = (
  <>
    <Mono x={20} y={30} size={15} bold>$ python3 report.py ⏎</Mono>
    {STEPS.map((s, i) => {
      const x = 20 + i * 182
      return (
        <g key={s.n}>
          <Card x={x} y={50} w={168} h={78} tone={s.tone} />
          <Mono x={x + 12} y={74} size={13} tone={s.tone} bold>{`${s.n}. ${s.title}`}</Mono>
          <Mono x={x + 12} y={104} size={11.5}>{s.detail}</Mono>
          {i < STEPS.length - 1 && <Line d={`M${x + 170} 89 L${x + 180} 89`} arrow />}
        </g>
      )
    })}
    <Small x={20} y={156}>{`Step 2 looks in each folder on PATH in turn: ${PATH}`}</Small>
    <Small x={20} y={180}>When an AI tool asks “Run this command?” and you say yes, it presses Enter for you: same four steps.</Small>
  </>
)

const narrow = (
  <>
    <Mono x={16} y={26} size={14} bold>$ python3 report.py ⏎</Mono>
    {STEPS.map((s, i) => {
      const y = 44 + i * 70
      return (
        <g key={s.n}>
          <Card x={16} y={y} w={328} h={56} tone={s.tone} />
          <Mono x={30} y={y + 22} size={13} tone={s.tone} bold>{`${s.n}. ${s.title}`}</Mono>
          <Mono x={30} y={y + 42} size={12}>{s.detail}</Mono>
          {i < STEPS.length - 1 && <Line d={`M180 ${y + 57} L180 ${y + 69}`} arrow />}
        </g>
      )
    })}
    <Small x={16} y={344}>An AI tool runs the same four steps.</Small>
  </>
)

export function EnterDrawing() {
  return <Drawing id="enter" title={TITLE} desc={DESC} wide={{ viewBox: '0 0 760 196', content: wide }} narrow={{ viewBox: '0 0 360 356', content: narrow }} />
}
