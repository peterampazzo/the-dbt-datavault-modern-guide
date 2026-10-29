import { MODEL } from '@/lib/dv/models'
import { Drawing, Card, Line, Mono, Small } from './kit'

const TITLE = 'Reusable business-vault rules shape audience-specific marts'
const DESC = `${MODEL.customer_integrated_s.name} integrates source profiles; ${MODEL.dim_customer.name} shapes a customer mart for reporting.`
function Flow({ x, y, w, label, value, tone }: { x: number; y: number; w: number; label: string; value: string; tone: 'hub' | 'link' | 'sat' }) {
  return <g><Card x={x} y={y} w={w} h={88} tone={tone} /><Small x={x + 14} y={y + 23}>{label}</Small><Mono x={x + 14} y={y + 52} bold>{value}</Mono></g>
}
const wide = (
  <>
    <Flow x={18} y={32} w={220} label="Integrated history" value={MODEL.customer_n_s.name} tone="sat" />
    <Line d="M242 76 H290" arrow />
    <Flow x={300} y={32} w={220} label="Reusable rule" value={MODEL.customer_integrated_s.name} tone="link" />
    <Line d="M524 76 H572" arrow />
    <Flow x={582} y={32} w={205} label="Audience mart" value={MODEL.dim_customer.name} tone="hub" />
    <Small x={24} y={148}>Raw history → integrated rules → reporting shape</Small>
  </>
)
const narrow = (
  <>
    {[[MODEL.customer_n_s.name, 'Integrated history', 'sat'], [MODEL.customer_integrated_s.name, 'Reusable rule', 'link'], [MODEL.dim_customer.name, 'Audience mart', 'hub']].map(([value, label, tone], i) => (
      <g key={value}>
        <Flow x={20} y={i * 108 + 8} w={320} label={label} value={value} tone={tone as 'sat' | 'link' | 'hub'} />
        {i < 2 && <Line d={`M180 ${i * 108 + 96} V${i * 108 + 112}`} arrow />}
      </g>
    ))}
  </>
)
export function BusinessVaultMartsDrawing() {
  return <Drawing id="business-vault-marts" title={TITLE} desc={DESC} wide={{ viewBox: '0 0 800 170', content: wide }} narrow={{ viewBox: '0 0 360 340', content: narrow }} />
}
