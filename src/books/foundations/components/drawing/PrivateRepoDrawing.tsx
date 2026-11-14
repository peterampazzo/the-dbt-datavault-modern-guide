import { Card, Drawing, Mono, Small } from '@/components/drawing/kit'

const TITLE = 'Choose Private before creating the GitHub repository'
const DESC =
  'A new GitHub repository form names the project orders-report, shows public and private visibility options, selects private, and reminds the owner to invite teammates in Settings under Collaborators.'

const wide = (
  <>
    <Card x={60} y={20} w={640} h={260} tone="ink" r={16} />
    <Card x={60} y={20} w={640} h={42} tone="stage" r={16} />
    <Mono x={84} y={47} size={15} bold>Create a new repository</Mono>
    <Small x={84} y={84}>Repository name</Small>
    <Card x={84} y={92} w={390} h={34} tone="ink" r={6} />
    <Mono x={98} y={114} size={13}>orders-report</Mono>
    <Small x={84} y={151}>Choose visibility</Small>
    <Card x={84} y={160} w={592} h={42} tone="ink" r={7} />
    <circle cx={104} cy={181} r={7} className="fill-none stroke-current" strokeWidth={1.5} />
    <Mono x={122} y={178} size={12.5} bold>Public</Mono>
    <Small x={185} y={178} size={11.5}>anyone on the internet can see it</Small>
    <Card x={84} y={210} w={592} h={42} tone="link" r={7} />
    <circle cx={104} cy={231} r={7} className="fill-none stroke-current" strokeWidth={1.5} />
    <circle cx={104} cy={231} r={3.5} className="fill-current" />
    <Mono x={122} y={228} size={12.5} bold>Private</Mono>
    <Small x={185} y={228} size={11.5}>only people you invite can see it</Small>
    <Small x={84} y={267}>Then invite your team: Settings → Collaborators</Small>
  </>
)

const narrow = (
  <>
    <Card x={16} y={18} w={328} h={276} tone="ink" r={14} />
    <Card x={16} y={18} w={328} h={42} tone="stage" r={14} />
    <Mono x={32} y={45} size={14} bold>Create a new repository</Mono>
    <Small x={32} y={82}>Repository name</Small>
    <Card x={32} y={90} w={296} h={34} tone="ink" r={6} />
    <Mono x={44} y={112} size={13}>orders-report</Mono>
    <Small x={32} y={150}>Choose visibility</Small>
    <Card x={32} y={158} w={296} h={48} tone="ink" r={7} />
    <circle cx={50} cy={177} r={7} className="fill-none stroke-current" strokeWidth={1.5} />
    <Mono x={68} y={179} size={12} bold>Public</Mono>
    <Small x={68} y={196} size={10.5}>anyone on the internet can see it</Small>
    <Card x={32} y={214} w={296} h={48} tone="link" r={7} />
    <circle cx={50} cy={233} r={7} className="fill-none stroke-current" strokeWidth={1.5} />
    <circle cx={50} cy={233} r={3.5} className="fill-current" />
    <Mono x={68} y={235} size={12} bold>Private</Mono>
    <Small x={68} y={252} size={10.5}>only people you invite can see it</Small>
    <Small x={32} y={282} size={10.5}>Then invite your team: Settings → Collaborators</Small>
  </>
)

export function PrivateRepoDrawing() {
  return <Drawing id="private-repository" title={TITLE} desc={DESC} wide={{ viewBox: '0 0 760 310', content: wide }} narrow={{ viewBox: '0 0 360 315', content: narrow }} />
}
