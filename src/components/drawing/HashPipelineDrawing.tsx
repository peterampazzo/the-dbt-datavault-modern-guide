import { CUSTOMERS } from '@/lib/dv/dataset'
import { dvHash } from '@/lib/dv/hash'
import { Drawing, Card, Line, Mono, Small } from './kit'

const CUSTOMER = CUSTOMERS[0][0]
const HASH = dvHash([CUSTOMER.c_custkey, CUSTOMER.c_nationkey])
const PARTS = HASH.steps
const TITLE = 'The hash pipeline turns source keys into a deterministic digest'
const DESC = `The customer and nation key values ${CUSTOMER.c_custkey} and ${CUSTOMER.c_nationkey} are standardized, joined with ||, upper-cased for the hashkey, and hashed with MD5.`

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
    <Step x={10} y={24} w={136} label="Source keys" value={`${CUSTOMER.c_custkey} · ${CUSTOMER.c_nationkey}`} />
    <Step x={168} y={24} w={136} label="Trim + quote" value={PARTS[1].value} />
    <Step x={326} y={24} w={136} label="Join with ||" value={PARTS[2].value} />
    <Step x={484} y={24} w={136} label="UPPER hashkey" value={PARTS[3].value} />
    <Step x={642} y={24} w={148} label="MD5 digest" value={HASH.hash.slice(0, 14) + '…'} />
    <Line d="M146 61 H160" arrow /><Line d="M304 61 H318" arrow /><Line d="M462 61 H476" arrow /><Line d="M620 61 H634" arrow />
    <Small x={12} y={122}>Values come from the first customer row; the digest is computed by hash.ts.</Small>
  </>
)
const narrow = (
  <>
    {[['Source keys', `${CUSTOMER.c_custkey} · ${CUSTOMER.c_nationkey}`], ['Trim + quote', PARTS[1].value], ['Join with ||', PARTS[2].value], ['UPPER hashkey', PARTS[3].value], ['MD5 digest', HASH.hash.slice(0, 14) + '…']].map(([label, value], i) => (
      <g key={label}>
        <Step x={20} y={i * 88 + 12} w={320} label={label} value={value} />
        {i < 4 && <Line d={`M180 ${i * 88 + 86} V${i * 88 + 96}`} arrow />}
      </g>
    ))}
  </>
)
export function HashPipelineDrawing() {
  return <Drawing id="hash-pipeline" title={TITLE} desc={DESC} wide={{ viewBox: '0 0 800 145', content: wide }} narrow={{ viewBox: '0 0 360 460', content: narrow }} />
}
