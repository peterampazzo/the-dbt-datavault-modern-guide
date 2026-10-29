import { BATCHES, CUSTOMERS, STORY } from '@/lib/dv/dataset'
import { simulate } from '@/lib/dv/engine'
import { Drawing, Card, Line, Mono, Note, Small } from './kit'

const RUNS = simulate()
const FARAH = CUSTOMERS[1].find((row) => row.c_name.startsWith('Farah'))!
const ALICE = CUSTOMERS[2].find((row) => row.c_name.startsWith('Alice'))!
const DANIEL = CUSTOMERS[2].find((row) => row.c_name.startsWith('Daniel'))!
const ALICE_KEY = RUNS[2].tables.customer_h.find((row) => row.c_custkey === ALICE.c_custkey)!.hk_customer_h
const DANIEL_KEY = RUNS[2].tables.customer_h.find((row) => row.c_custkey === DANIEL.c_custkey)!.hk_customer_h
const FARAH_STORY = STORY[1].changes.find((change) => change.includes('Farah'))!.split(' → ')[0]
const ALICE_STORY = STORY[2].changes.find((change) => change.includes('Alice'))!.split(' → ')[0]
const DANIEL_STORY = STORY[2].changes.find((change) => change.includes('Daniel'))!.split(' → ')[0]
const FARAH_DECISION = RUNS[1].decisions.customer_h.find((decision) => decision.row.c_custkey === FARAH.c_custkey)!
const ALICE_DECISION = RUNS[2].decisions.customer_n_s.find((decision) => decision.row.hk_customer_h === ALICE_KEY)!
const DANIEL_DECISION = RUNS[2].decisions.customer_n_s.find((decision) => decision.row.hk_customer_h === DANIEL_KEY)!
const SEGMENTS = CUSTOMERS.filter((batch) => batch.some((row) => row.c_custkey === ALICE.c_custkey))
  .map((batch) => batch.find((row) => row.c_custkey === ALICE.c_custkey)!.c_mktsegment)
const TITLE = 'New keys and changed hashdiffs determine which vault rows load'
const DESC =
  `The decision path inserts a hub for ${FARAH.c_name}, inserts a satellite version when ${ALICE.c_name}'s segment changes, ` +
  `and skips ${DANIEL.c_name} when the hashdiff is unchanged. The examples and load dates come from STORY and simulate().`

const wide = (
  <>
    <Card x={24} y={42} w={205} h={62} tone="stage" />
    <Mono x={42} y={68} tone="stage" bold>new key?</Mono>
    <Small x={42} y={91}>check the business key</Small>
    <Line d="M229 73 H286" arrow />
    <Small x={258} y={60} anchor="middle">yes</Small>
    <Card x={296} y={42} w={212} h={62} tone="hub" />
    <Mono x={314} y={68} tone="hub" bold>hub insert</Mono>
    <Small x={314} y={91}>{`${FARAH.c_name} · ${BATCHES[1].slice(0, 10)}`}</Small>
    <Line d="M508 73 H560" arrow />
    <Small x={534} y={60} anchor="middle">{FARAH_DECISION.status}</Small>
    <Small x={576} y={91} size={9}>{FARAH_STORY}</Small>

    <Line d="M126 104 V148 H230" arrow />
    <Small x={148} y={137}>no</Small>
    <Card x={24} y={150} w={205} h={62} tone="stage" />
    <Mono x={42} y={176} tone="stage" bold>hashdiff changed?</Mono>
    <Small x={42} y={199}>compare the payload</Small>
    <Line d="M229 181 H286" arrow />
    <Small x={258} y={168} anchor="middle">yes</Small>
    <Card x={296} y={150} w={212} h={62} tone="sat" />
    <Mono x={314} y={176} tone="sat" bold>satellite insert</Mono>
    <Small x={314} y={199}>{`${SEGMENTS[0]} → ${SEGMENTS.at(-1)}`}</Small>
    <Line d="M508 181 H560" arrow />
    <Small x={534} y={168} anchor="middle">{ALICE_DECISION.status}</Small>
    <Small x={576} y={199} size={9}>{ALICE_STORY}</Small>

    <Line d="M126 212 V256 H286" arrow />
    <Small x={148} y={245}>no</Small>
    <Card x={296} y={258} w={212} h={62} tone="ink" />
    <Mono x={314} y={284} bold>skip satellite</Mono>
    <Small x={314} y={307}>{DANIEL_DECISION.reason}</Small>
    <Line d="M508 289 H560" arrow />
    <Small x={534} y={276} anchor="middle">{DANIEL_DECISION.status}</Small>
    <Small x={576} y={307} size={9}>{DANIEL_STORY}</Small>
  </>
)

const narrow = (
  <>
    <Card x={20} y={32} w={320} h={56} tone="stage" />
    <Mono x={36} y={56} tone="stage" bold>new key?</Mono>
    <Small x={36} y={78}>yes → hub insert · no → continue</Small>
    <Line d="M180 88 V112" arrow />
    <Card x={20} y={118} w={320} h={68} tone="hub" />
    <Mono x={36} y={142} tone="hub" bold>{`hub insert · ${FARAH.c_name}`}</Mono>
    <Small x={36} y={166}>{`${BATCHES[1].slice(0, 10)} · ${FARAH_DECISION.status}`}</Small>
    <Small x={36} y={182} size={9}>{FARAH_STORY}</Small>
    <Line d="M180 186 V210" arrow />
    <Card x={20} y={216} w={320} h={56} tone="stage" />
    <Mono x={36} y={240} tone="stage" bold>hashdiff changed?</Mono>
    <Small x={36} y={262}>yes → insert · no → skip</Small>
    <Line d="M180 272 V296" arrow />
    <Card x={20} y={302} w={320} h={74} tone="sat" />
    <Mono x={36} y={326} tone="sat" bold>{`satellite insert · ${ALICE.c_name}`}</Mono>
    <Small x={36} y={350}>{`${SEGMENTS[0]} → ${SEGMENTS.at(-1)} · ${ALICE_DECISION.status}`}</Small>
    <Small x={36} y={370} size={9}>{ALICE_STORY}</Small>
    <Line d="M180 376 V400" arrow />
    <Card x={20} y={406} w={320} h={68} tone="ink" />
    <Mono x={36} y={430} bold>{`skip · ${DANIEL.c_name}`}</Mono>
    <Small x={36} y={454}>{DANIEL_DECISION.reason}</Small>
    <Small x={36} y={470} size={9}>{DANIEL_STORY}</Small>
    <Note x={20} y={512}>{`${BATCHES[2].slice(0, 10)} · ${DANIEL.c_name} returns`}</Note>
  </>
)

export function LoadRulesDrawing() {
  return (
    <Drawing
      id="load-rules"
      title={TITLE}
      desc={DESC}
      wide={{ viewBox: '0 0 800 336', content: wide }}
      narrow={{ viewBox: '0 0 360 530', content: narrow }}
    />
  )
}
