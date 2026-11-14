import { Card, Drawing, Line, Mono, Small } from '@/components/drawing/kit'

const TITLE = 'One repository, the same setup on every machine'
const DESC =
  'The repository holds the code and the project settings: .vscode/settings.json and .vscode/extensions.json. Your laptop, a colleague’s laptop and your next new laptop all get the same files from it, so the editor formats the same way and suggests the same extensions everywhere. .env, with the real key, is listed in .gitignore and stays on each machine; .env.example in the repository shows which settings it needs.'

const MACHINES = ['Your laptop', 'A colleague', 'Your new laptop']

const wide = (
  <>
    <Card x={250} y={14} w={260} h={92} tone="stage" />
    <Mono x={380} y={38} anchor="middle" size={13} bold>
      orders-report (git)
    </Mono>
    <Mono x={380} y={60} anchor="middle" size={11.5}>
      report.py · report.R
    </Mono>
    <Mono x={380} y={78} anchor="middle" size={11.5}>
      .vscode/settings.json
    </Mono>
    <Mono x={380} y={96} anchor="middle" size={11.5}>
      .vscode/extensions.json
    </Mono>
    {MACHINES.map((m, i) => {
      const x = 20 + i * 250
      return (
        <g key={m}>
          <Line d={`M380 108 L${x + 110} 146`} arrow />
          <Card x={x} y={150} w={220} h={66} tone="link" />
          <Mono x={x + 110} y={174} anchor="middle" size={13} bold>
            {m}
          </Mono>
          <Small x={x + 110} y={194} anchor="middle" size={11}>
            same settings, same extensions
          </Small>
          <Small x={x + 110} y={208} anchor="middle" size={11}>
            own .env, never shared
          </Small>
        </g>
      )
    })}
    <Small x={20} y={242}>
      .env holds the real key. It is in .gitignore, so it never leaves the machine; .env.example says what to put in it.
    </Small>
  </>
)

const narrow = (
  <>
    <Card x={30} y={10} w={300} h={88} tone="stage" />
    <Mono x={180} y={32} anchor="middle" size={13} bold>
      orders-report (git)
    </Mono>
    <Mono x={180} y={52} anchor="middle" size={11.5}>
      report.py · report.R
    </Mono>
    <Mono x={180} y={70} anchor="middle" size={11.5}>
      .vscode/settings.json
    </Mono>
    <Mono x={180} y={88} anchor="middle" size={11.5}>
      .vscode/extensions.json
    </Mono>
    {MACHINES.map((m, i) => {
      const y = 126 + i * 70
      return (
        <g key={m}>
          <Line d={`M180 ${y - 26} L180 ${y - 4}`} arrow />
          <Card x={30} y={y} w={300} h={44} tone="link" />
          <Mono x={180} y={y + 19} anchor="middle" size={13} bold>
            {m}
          </Mono>
          <Small x={180} y={y + 36} anchor="middle" size={11}>
            same settings · own .env
          </Small>
        </g>
      )
    })}
    <Small x={16} y={344}>
      .env holds the real key and stays on each machine.
    </Small>
  </>
)

export function SameSetupDrawing() {
  return (
    <Drawing id="same-setup" title={TITLE} desc={DESC} wide={{ viewBox: '0 0 760 256', content: wide }} narrow={{ viewBox: '0 0 360 356', content: narrow }} />
  )
}
