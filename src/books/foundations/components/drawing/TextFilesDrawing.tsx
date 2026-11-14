import { Card, Drawing, Line, Mono, Small, type Tone } from '@/components/drawing/kit'

const TITLE = 'Git keeps versions of any text file'
const DESC =
  'Four text files from orders-report: report.py (Python), report.R (R), .env.example (settings without secrets) and .vscode/settings.json (editor settings). git commit takes a snapshot of all of them. The history keeps every snapshot, newest at the top, and git diff shows the exact lines that changed between two snapshots: here revenue + float(price) became revenue + round(float(price)). A spreadsheet or an image can be versioned too, but git can only say that it changed, not which cells or pixels.'

const FILES: { name: string; kind: string; tone: Tone }[] = [
  { name: 'report.py', kind: 'Python code', tone: 'hub' },
  { name: 'report.R', kind: 'R code', tone: 'hub' },
  { name: '.env.example', kind: 'settings, no secrets', tone: 'sat' },
  { name: '.vscode/settings.json', kind: 'editor settings', tone: 'link' },
]

const SNAPSHOTS = ['Snapshot 2 · Add a title', 'Snapshot 1 · Add the orders report']

const wide = (
  <>
    <Small x={20} y={22}>
      Your folder: text files
    </Small>
    {FILES.map((f, i) => (
      <g key={f.name}>
        <Card x={20} y={34 + i * 50} w={230} h={40} tone={f.tone} r={8} />
        <Mono x={32} y={53 + i * 50} size={12.5} bold>
          {f.name}
        </Mono>
        <Small x={32} y={68 + i * 50} size={11}>
          {f.kind}
        </Small>
      </g>
    ))}
    <Line d="M260 130 L338 130" arrow />
    <Mono x={270} y={120} size={12}>
      git commit
    </Mono>
    <Small x={400} y={22}>
      History: every snapshot is kept
    </Small>
    {SNAPSHOTS.map((c, i) => (
      <g key={c}>
        <Card x={348} y={34 + i * 50} w={392} h={40} tone="stage" r={8} />
        <Mono x={362} y={59 + i * 50} size={12.5}>
          {c}
        </Mono>
      </g>
    ))}
    <Card x={348} y={140} w={392} h={74} tone="ink" r={8} />
    <Mono x={362} y={160} size={12} bold>
      git diff: exactly what changed
    </Mono>
    <Mono x={362} y={182} size={11.5} tone="sat">
      - revenue + float(price)
    </Mono>
    <Mono x={362} y={202} size={11.5} tone="link">
      + revenue + round(float(price))
    </Mono>
    <Small x={20} y={248}>
      orders.xlsx or a logo.png can go in too, but git only sees that they changed, not which cells or pixels.
    </Small>
  </>
)

const narrow = (
  <>
    <Small x={16} y={20}>
      Your folder: text files
    </Small>
    {FILES.map((f, i) => (
      <g key={f.name}>
        <Card x={16} y={30 + i * 46} w={328} h={38} tone={f.tone} r={8} />
        <Mono x={28} y={48 + i * 46} size={12.5} bold>
          {f.name}
        </Mono>
        <Small x={28} y={62 + i * 46} size={11}>
          {f.kind}
        </Small>
      </g>
    ))}
    <Line d="M180 216 L180 244" arrow />
    <Mono x={190} y={234} size={12}>
      git commit
    </Mono>
    {SNAPSHOTS.map((c, i) => (
      <g key={c}>
        <Card x={16} y={252 + i * 46} w={328} h={38} tone="stage" r={8} />
        <Mono x={28} y={276 + i * 46} size={12.5}>
          {c}
        </Mono>
      </g>
    ))}
    <Card x={16} y={350} w={328} h={70} tone="ink" r={8} />
    <Mono x={28} y={370} size={12} bold>
      git diff
    </Mono>
    <Mono x={28} y={390} size={11.5} tone="sat">
      - revenue + float(price)
    </Mono>
    <Mono x={28} y={410} size={11.5} tone="link">
      + revenue + round(float(price))
    </Mono>
    <Small x={16} y={442}>
      Spreadsheets and images go in too,
    </Small>
    <Small x={16} y={458}>
      but git can't show what changed inside.
    </Small>
  </>
)

export function TextFilesDrawing() {
  return (
    <Drawing id="text-files" title={TITLE} desc={DESC} wide={{ viewBox: '0 0 760 262', content: wide }} narrow={{ viewBox: '0 0 360 470', content: narrow }} />
  )
}
