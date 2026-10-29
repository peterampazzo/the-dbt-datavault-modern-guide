import { CUSTOMERS, SHOP_CUSTOMERS } from '@/lib/dv/dataset'
import { integratedCustomer, isGhost, shopCustomerSatellite, simulate } from '@/lib/dv/engine'
import { Drawing, Card, Line, Mono, Small } from './kit'

const key = CUSTOMERS[0][0].c_custkey
const RUN = simulate()[2]
const customerHash = RUN.tables.customer_h.find((row) => row.c_custkey === key && !isGhost(row))!.hk_customer_h
const shopRows = shopCustomerSatellite()
const crm = RUN.tables.customer_n_s.find((row) => row.hk_customer_h === customerHash && !isGhost(row))!
const shop = shopRows.find((row) => row.hk_customer_h === customerHash && !isGhost(row))!
const integrated = integratedCustomer(RUN.tables.customer_n_s, shopRows, ['crm/customer', 'shop/customer']).find((row) => row.hk_customer_h === customerHash)!
const shopName = SHOP_CUSTOMERS[0].find((row) => row.c_custkey === key)!.c_name
const TITLE = 'Precedence selects one value when source satellites disagree'
const DESC = `CRM and shop rows for ${crm.c_name} are merged into an integrated satellite using the CRM-first precedence rule.`
const wide = (
  <>
    <Card x={20} y={18} w={220} h={80} tone="sat" /><Mono x={34} y={46} bold>CRM satellite</Mono><Small x={34} y={72}>{String(crm.c_name)} · {String(crm.c_address)}</Small>
    <Card x={20} y={112} w={220} h={80} tone="stage" /><Mono x={34} y={140} bold>Shop satellite</Mono><Small x={34} y={166}>{shopName} · {String(shop.c_address)}</Small>
    <Line d="M244 58 C290 58 295 90 338 90" arrow /><Line d="M244 152 C290 152 295 100 338 100" arrow />
    <Card x={348} y={50} w={430} h={100} tone="link" /><Mono x={366} y={82} bold>customer_integrated_s</Mono>
    <Small x={366} y={108}>{`CRM first → ${String(integrated.c_address)} · ${String(integrated.source_of_c_address)}`}</Small>
  </>
)
const narrow = (
  <>
    <Card x={20} y={10} w={320} h={64} tone="sat" /><Mono x={34} y={35} bold>CRM · {String(crm.c_name)}</Mono><Small x={34} y={57}>{String(crm.c_address)}</Small>
    <Card x={20} y={92} w={320} h={64} tone="stage" /><Mono x={34} y={117} bold>Shop · {shopName}</Mono><Small x={34} y={139}>{String(shop.c_address)}</Small>
    <Line d="M180 158 V176" arrow />
    <Card x={20} y={184} w={320} h={76} tone="link" /><Mono x={34} y={213} bold>customer_integrated_s</Mono><Small x={34} y={239}>{`CRM first → ${String(integrated.c_address)}`}</Small>
  </>
)
export function PrecedenceMergeDrawing() {
  return <Drawing id="precedence-merge" title={TITLE} desc={DESC} wide={{ viewBox: '0 0 800 210', content: wide }} narrow={{ viewBox: '0 0 360 276', content: narrow }} />
}
