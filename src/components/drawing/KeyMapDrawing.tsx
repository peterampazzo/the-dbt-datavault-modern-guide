import { BATCHES } from '@/lib/dv/dataset'
import { seedFromLegacy } from '@/lib/legacy/history'
import { Drawing, Card, Line, Mono, Small } from './kit'

const SEEDED = seedFromLegacy()
const ROW = SEEDED.keyMap[0]
const TITLE = 'A key map connects legacy hashes to rebuilt vault keys'
const DESC = `The key map is computed from the legacy sample and current hashing rules; reconciliation reports ${SEEDED.reconciliation.payloadMismatches} payload mismatches.`
const wide = (
  <>
    <Card x={20} y={30} w={215} h={76} tone="stage" /><Mono x={36} y={60} bold>Legacy hash</Mono><Small x={36} y={84}>{ROW.legacyHashKey.slice(0, 12)}…</Small>
    <Line d="M238 68 H300" arrow />
    <Card x={310} y={30} w={190} h={76} tone="ink" /><Mono x={326} y={60} bold>Business key</Mono><Small x={326} y={84}>{ROW.customerNumber}</Small>
    <Line d="M503 68 H565" arrow />
    <Card x={575} y={30} w={205} h={76} tone="hub" /><Mono x={591} y={60} bold>New hashkey</Mono><Small x={591} y={84}>{ROW.newHashKey.slice(0, 12)}…</Small>
    <Small x={22} y={136}>{`Replay window begins ${BATCHES[0]} · payload mismatches ${SEEDED.reconciliation.payloadMismatches}`}</Small>
  </>
)
const narrow = (
  <>
    {[['Legacy hash', ROW.legacyHashKey.slice(0, 12) + '…', 'stage'], ['Business key', String(ROW.customerNumber), 'ink'], ['New hashkey', ROW.newHashKey.slice(0, 12) + '…', 'hub']].map(([label, value, tone], i) => {
      const y = 8 + i * 88
      return <g key={label}><Card x={20} y={y} w={320} h={64} tone={tone as 'stage' | 'ink' | 'hub'} /><Mono x={36} y={y + 26} bold>{label}</Mono><Small x={36} y={y + 48}>{value}</Small>{i < 2 && <Line d={`M180 ${y + 66} V${y + 84}`} arrow />}</g>
    })}
    <Small x={20} y={282}>{`Reconcile payloads at ${BATCHES[0]}`}</Small>
  </>
)
export function KeyMapDrawing() {
  return <Drawing id="key-map" title={TITLE} desc={DESC} wide={{ viewBox: '0 0 800 155', content: wide }} narrow={{ viewBox: '0 0 360 300', content: narrow }} />
}
