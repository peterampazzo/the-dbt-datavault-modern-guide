import { CUSTOMERS } from '@/lib/dv/dataset'
import { dvHash } from '@/lib/dv/hash'
import { Drawing, Card, Line, Mono, Small } from './kit'

const CUSTOMER = CUSTOMERS[0][0]
const HASH = dvHash([CUSTOMER.c_custkey, CUSTOMER.c_nationkey])
const PARTS = HASH.steps
const TITLE = 'The hash pipeline turns source keys into a deterministic digest'
const DESC = `The customer and nation key values ${CUSTOMER.c_custkey} and ${CUSTOMER.c_nationkey} are standardized, joined with ||, and hashed with MD5.`

function Step({ x, y, w, label, value }: { x: number; y: number; w: number; label: string; value: string }) {
  return (
    <g>
      <Card x={x} y={y} w={w} h={74} tone="hub" />
      <Small x={x + 12} y={y + 22}>{label}</Small>
      <Mono x={x + 12} y={y + 49} size={11}>{value}</Mono>
    </g>
  )
}

const wide = (
  <>
    <Step x={10} y={24} w={170} label="Source keys" value={`${CUSTOMER.c_custkey} · ${CUSTOMER.c_nationkey}`} />
    <Step x={210} y={24} w={170} label="Trim + uppercase" value={PARTS[3].value} />
    <Step x={410} y={24} w={170} label="Join with ||" value={PARTS[2].value} />
    <Step x={610} y={24} w={180} label="MD5 digest" value={HASH.hash.slice(0, 14) + '…'} />
    <Line d="M180 61 H202" arrow /><Line d="M380 61 H402" arrow /><Line d="M580 61 H602" arrow />
    <Small x={12} y={122}>Values come from the first customer row; the digest is computed by hash.ts.</Small>
  </>
)
const narrow = (
  <>
    {[['Source keys', `${CUSTOMER.c_custkey} · ${CUSTOMER.c_nationkey}`], ['Trim + uppercase', PARTS[3].value], ['Join with ||', PARTS[2].value], ['MD5 digest', HASH.hash.slice(0, 14) + '…']].map(([label, value], i) => (
      <g key={label}>
        <Step x={20} y={i * 88 + 12} w={320} label={label} value={value} />
        {i < 3 && <Line d={`M180 ${i * 88 + 86} V${i * 88 + 96}`} arrow />}
      </g>
    ))}
  </>
)
export function HashPipelineDrawing() {
  return <Drawing id="hash-pipeline" title={TITLE} desc={DESC} wide={{ viewBox: '0 0 800 145', content: wide }} narrow={{ viewBox: '0 0 360 372', content: narrow }} />
}
