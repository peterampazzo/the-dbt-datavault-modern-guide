import { Card, Drawing, Mono, Small } from '@/components/drawing/kit'

const TITLE = 'A private repository keeps a history for the team'
const DESC =
  'A shared folder contains three similarly named report files and does not say who changed what or why. A private repository keeps three named commits with their authors and the exact changes, and is visible only to invited people.'

const wide = (
  <>
    <Small x={20} y={24}>Shared folder</Small>
    <Card x={20} y={34} w={235} h={148} tone="ink" r={12} />
    {['report.py', 'report (1).py', 'report - conflicted copy.py'].map((name, i) => (
      <g key={name}>
        <Card x={32} y={46 + i * 34} w={211} h={28} tone={i === 0 ? 'hub' : 'sat'} r={6} />
        <Mono x={42} y={65 + i * 34} size={11.5}>{name}</Mono>
      </g>
    ))}
    <Small x={32} y={174}>Who changed what? Why?</Small>
    <Small x={286} y={24}>Private repository</Small>
    <Card x={278} y={34} w={462} h={148} tone="stage" r={12} />
    <Card x={675} y={42} w={54} h={22} tone="link" r={11} />
    <Mono x={702} y={57} size={10.5} anchor="middle" bold>Private</Mono>
    {[
      ['Add revenue per nation', 'you'],
      ['Round prices to whole euros', 'teammate'],
      ['Add a title', 'you'],
    ].map(([message, author], i) => (
      <g key={message}>
        <Card x={292} y={48 + i * 38} w={432} h={30} tone="ink" r={6} />
        <Mono x={304} y={67 + i * 38} size={11.5}>{message}</Mono>
        <Small x={706} y={67 + i * 38} size={10} anchor="end">{author}</Small>
      </g>
    ))}
    <Small x={20} y={214}>Three named snapshots. Every change has an author and a reason.</Small>
  </>
)

const narrow = (
  <>
    <Small x={16} y={20}>Shared folder</Small>
    <Card x={16} y={28} w={328} h={144} tone="ink" r={12} />
    {['report.py', 'report (1).py', 'report - conflicted copy.py'].map((name, i) => (
      <g key={name}>
        <Card x={28} y={38 + i * 30} w={304} h={25} tone={i === 0 ? 'hub' : 'sat'} r={6} />
        <Mono x={38} y={55 + i * 30} size={11}>{name}</Mono>
      </g>
    ))}
    <Small x={28} y={159} size={11}>Who changed what? Why?</Small>
    <Small x={16} y={199}>Private repository</Small>
    <Card x={16} y={207} w={328} h={163} tone="stage" r={12} />
    <Card x={276} y={215} w={58} h={21} tone="link" r={10} />
    <Mono x={305} y={229} size={10} anchor="middle" bold>Private</Mono>
    {[
      ['Add revenue per nation', 'you'],
      ['Round prices to whole euros', 'teammate'],
      ['Add a title', 'you'],
    ].map(([message, author], i) => (
      <g key={message}>
        <Card x={28} y={243 + i * 36} w={304} h={29} tone="ink" r={6} />
        <Mono x={38} y={261 + i * 36} size={10.5}>{message}</Mono>
        <Small x={320} y={261 + i * 36} size={9} anchor="end">{author}</Small>
      </g>
    ))}
    <Small x={16} y={392} size={11}>Three named snapshots, each with an author and reason.</Small>
  </>
)

export function ShareDrawing() {
  return <Drawing id="share-project" title={TITLE} desc={DESC} wide={{ viewBox: '0 0 760 230', content: wide }} narrow={{ viewBox: '0 0 360 410', content: narrow }} />
}
