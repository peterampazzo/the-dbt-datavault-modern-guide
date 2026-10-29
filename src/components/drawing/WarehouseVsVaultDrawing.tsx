import { CUSTOMERS } from '@/lib/dv/dataset'
import { simulate } from '@/lib/dv/engine'
import { MODEL } from '@/lib/dv/models'
import { Drawing, Card, Line, Mono, Note, Small } from './kit'

const CUSTOMER = CUSTOMERS[0].find((row) => row.c_name.startsWith('Alice'))!
const RUN = simulate()[0]
const HUB = RUN.tables.customer_h.find((row) => row.c_custkey === CUSTOMER.c_custkey)!
const NATION_HUB = RUN.tables.nation_h.find((row) => row.n_nationkey === CUSTOMER.c_nationkey)!
const LINK = RUN.tables.customer_nation_l.find((row) => row.hk_customer_h === HUB.hk_customer_h && row.hk_nation_h === NATION_HUB.hk_nation_h)!
const SATELLITE = RUN.tables.customer_n_s.find((row) => row.hk_customer_h === HUB.hk_customer_h)!
const TITLE = 'A wide customer row becomes a hub, link, and satellite'
const DESC =
  `A source customer row for ${CUSTOMER.c_name} contains business key, descriptive attributes, and a nation key. ` +
  `${MODEL.customer_h.name}, ${MODEL.customer_nation_l.name}, and ${MODEL.customer_n_s.name} separate identity, relationship, and history.`

const wide = (
  <>
    <Note x={24} y={40}>one wide customer row</Note>
    <Card x={24} y={58} w={286} h={204} tone="stage" />
    <Mono x={42} y={86} tone="stage" bold>{`c_custkey · ${CUSTOMER.c_custkey}`}</Mono>
    <Small x={42} y={117}>{`c_name · ${CUSTOMER.c_name}`}</Small>
    <Small x={42} y={145}>{`c_address · ${CUSTOMER.c_address}`}</Small>
    <Small x={42} y={173}>{`c_nationkey · ${CUSTOMER.c_nationkey}`}</Small>
    <Small x={42} y={201}>{`c_mktsegment · ${CUSTOMER.c_mktsegment}`}</Small>
    <Small x={42} y={235}>{`one source row · ${String(CUSTOMER.c_acctbal)}`}</Small>
    <Line d="M310 160 H340 V88 H370" arrow />
    <Line d="M340 160 V160 H370" arrow />
    <Line d="M340 160 V232 H370" arrow />

    <Card x={380} y={52} w={392} h={66} tone="hub" />
    <Mono x={398} y={79} tone="hub" bold>{MODEL.customer_h.name}</Mono>
    <Small x={398} y={102}>{`business key · ${HUB.c_custkey} · ${String(HUB.hk_customer_h).slice(0, 8)}…`}</Small>

    <Card x={380} y={128} w={392} h={66} tone="link" />
    <Mono x={398} y={155} tone="link" bold>{MODEL.customer_nation_l.name}</Mono>
    <Small x={398} y={178}>{`${String(LINK.hk_customer_h).slice(0, 8)}… → ${String(LINK.hk_nation_h).slice(0, 8)}…`}</Small>

    <Card x={380} y={204} w={392} h={66} tone="sat" />
    <Mono x={398} y={231} tone="sat" bold>{MODEL.customer_n_s.name}</Mono>
    <Small x={398} y={254}>{`${SATELLITE.c_name} · ${SATELLITE.c_mktsegment} · ${String(SATELLITE.ldts)}`}</Small>
  </>
)

const narrow = (
  <>
    <Note x={20} y={28}>one wide customer row</Note>
    <Card x={20} y={42} w={320} h={144} tone="stage" />
    <Mono x={36} y={68} tone="stage" bold>{`c_custkey · ${CUSTOMER.c_custkey}`}</Mono>
    <Small x={36} y={91}>{`c_name · ${CUSTOMER.c_name}`}</Small>
    <Small x={36} y={113}>{`c_address · ${CUSTOMER.c_address}`}</Small>
    <Small x={36} y={135}>{`c_nationkey · ${CUSTOMER.c_nationkey}`}</Small>
    <Small x={36} y={157}>{`c_mktsegment · ${CUSTOMER.c_mktsegment}`}</Small>
    <Line d="M180 186 V208" arrow />
    <Card x={20} y={214} w={320} h={66} tone="hub" />
    <Mono x={36} y={241} tone="hub" bold>{MODEL.customer_h.name}</Mono>
    <Small x={36} y={264}>{`business key · ${HUB.c_custkey} · ${String(HUB.hk_customer_h).slice(0, 8)}…`}</Small>
    <Line d="M180 280 V302" arrow />
    <Card x={20} y={308} w={320} h={66} tone="link" />
    <Mono x={36} y={335} tone="link" bold>{MODEL.customer_nation_l.name}</Mono>
    <Small x={36} y={358}>{`${String(LINK.hk_customer_h).slice(0, 8)}… → ${String(LINK.hk_nation_h).slice(0, 8)}…`}</Small>
    <Line d="M180 374 V396" arrow />
    <Card x={20} y={402} w={320} h={70} tone="sat" />
    <Mono x={36} y={429} tone="sat" bold>{MODEL.customer_n_s.name}</Mono>
    <Small x={36} y={454}>{`${SATELLITE.c_name} · ${SATELLITE.c_mktsegment} · ${String(SATELLITE.ldts)}`}</Small>
    <Small x={20} y={505}>Identity, links, and history have separate grains.</Small>
  </>
)

export function WarehouseVsVaultDrawing() {
  return (
    <Drawing
      id="warehouse-vs-vault"
      title={TITLE}
      desc={DESC}
      wide={{ viewBox: '0 0 800 288', content: wide }}
      narrow={{ viewBox: '0 0 360 530', content: narrow }}
    />
  )
}
