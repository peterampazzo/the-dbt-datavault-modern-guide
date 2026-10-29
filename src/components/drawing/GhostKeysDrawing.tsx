import { Drawing, Card, Line, Mono, Note, Small } from './kit'
import { CUSTOMERS } from '@/lib/dv/dataset'
import { simulate } from '@/lib/dv/engine'
import { ERROR_KEY, ZERO_KEY } from '@/lib/dv/hash'

const RUN = simulate()[0]
const ALICE = CUSTOMERS[0].find((row) => row.c_name.startsWith('Alice'))!
const ALICE_ORDER = RUN.source.orders.find((row) => row.o_custkey === ALICE.c_custkey)!
const ALICE_HUB = RUN.tables.customer_h.find((row) => row.c_custkey === ALICE.c_custkey)!

const TITLE = 'Customer joins keep orders when a reference is unknown'
const DESC =
  `Order ${ALICE_ORDER.o_orderkey} for ${ALICE.c_name} joins to the real customer hub row. ` +
  `An unmatched customer reference joins to the ${ZERO_KEY.MD5.slice(0, 4)} unknown ghost instead of NULL. ` +
  `The ${ERROR_KEY.MD5.slice(0, 4)} error ghost is also reserved.`

const wide = (
  <>
    <Note x={30} y={36}>known customer</Note>
    <Card x={30} y={54} w={210} h={76} tone="stage" />
    <Mono x={48} y={82} tone="stage" bold>{`order ${ALICE_ORDER.o_orderkey}`}</Mono>
    <Small x={48} y={108}>{`o_custkey · ${ALICE_ORDER.o_custkey}`}</Small>
    <Line d="M240 92 H330" arrow />
    <Small x={285} y={78} anchor="middle">inner join</Small>
    <Card x={340} y={54} w={420} h={76} tone="hub" />
    <Mono x={358} y={82} tone="hub" bold>{`customer_h · ${ALICE.c_name}`}</Mono>
    <Small x={358} y={108}>{`c_custkey · ${ALICE_HUB.c_custkey} · ${String(ALICE_HUB.hk_customer_h).slice(0, 8)}…`}</Small>

    <Note x={30} y={171}>no customer match</Note>
    <Card x={30} y={188} w={210} h={66} tone="stage" />
    <Mono x={48} y={216} tone="stage" bold>order row</Mono>
    <Small x={48} y={238}>customer key has no hub row</Small>
    <Line d="M240 221 H330" arrow />
    <Small x={285} y={207} anchor="middle">inner join</Small>
    <Card x={340} y={188} w={420} h={66} tone="hub" />
    <Mono x={358} y={216} tone="hub" bold>unknown ghost · {ZERO_KEY.MD5.slice(0, 4)}…</Mono>
    <Small x={358} y={239}>the order still has a join target</Small>

    <Card x={340} y={270} w={420} h={50} tone="ink" />
    <Mono x={358} y={301} bold>error ghost · {ERROR_KEY.MD5.slice(0, 4)}…</Mono>
    <Small x={30} y={340}>Reserved rows prevent missing references from becoming NULL.</Small>
  </>
)

const narrow = (
  <>
    <Note x={20} y={28}>known customer</Note>
    <Card x={20} y={42} w={320} h={62} tone="stage" />
    <Mono x={36} y={67} tone="stage" bold>{`order ${ALICE_ORDER.o_orderkey}`}</Mono>
    <Small x={36} y={91}>{`o_custkey · ${ALICE_ORDER.o_custkey}`}</Small>
    <Line d="M180 104 V130" arrow />
    <Card x={20} y={136} w={320} h={62} tone="hub" />
    <Mono x={36} y={161} tone="hub" bold>{`customer_h · ${ALICE.c_name}`}</Mono>
    <Small x={36} y={185}>{`c_custkey · ${ALICE_HUB.c_custkey} · ${String(ALICE_HUB.hk_customer_h).slice(0, 8)}…`}</Small>

    <Note x={20} y={236}>no customer match</Note>
    <Card x={20} y={250} w={320} h={60} tone="stage" />
    <Mono x={36} y={274} tone="stage" bold>order row</Mono>
    <Small x={36} y={296}>customer key has no hub row</Small>
    <Line d="M180 310 V336" arrow />
    <Card x={20} y={342} w={320} h={62} tone="hub" />
    <Mono x={36} y={367} tone="hub" bold>unknown ghost · {ZERO_KEY.MD5.slice(0, 4)}…</Mono>
    <Small x={36} y={391}>the order still has a join target</Small>
    <Line d="M180 404 V430" arrow />
    <Card x={20} y={436} w={320} h={56} tone="ink" />
    <Mono x={36} y={469} bold>error ghost · {ERROR_KEY.MD5.slice(0, 4)}…</Mono>
    <Small x={20} y={525}>Reserved rows keep missing references out of NULL joins.</Small>
  </>
)

export function GhostKeysDrawing() {
  return (
    <Drawing
      id="ghost-keys"
      title={TITLE}
      desc={DESC}
      wide={{ viewBox: '0 0 800 356', content: wide }}
      narrow={{ viewBox: '0 0 360 548', content: narrow }}
    />
  )
}
