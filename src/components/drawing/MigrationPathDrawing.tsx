import { MIGRATION_ITEMS } from '@/lib/migration'
import { Drawing, Card, Line, Mono, Small } from './kit'

const TITLE = 'Eight evidence gates lead from legacy loading to cut-over'
const DESC = `The path follows the eight gates in the migration checklist, from retained staging through reconciliation and cut-over.`
const wide = (
  <>
    {MIGRATION_ITEMS.map((item, index) => {
      const x = 10 + index * 98
      return <g key={item.text}><Card x={x} y={34} w={88} h={84} tone={index < 4 ? 'stage' : index < 7 ? 'link' : 'hub'} /><Mono x={x + 10} y={60} bold>Gate {index + 1}</Mono><Small x={x + 10} y={84} size={9}>{item.text.replace(/[.`]/g, '').slice(0, 14)}</Small>{index < MIGRATION_ITEMS.length - 1 && <Line d={`M${x + 89} 76 H${x + 97}`} arrow />}</g>
    })}
  </>
)
const narrow = (
  <>
    {MIGRATION_ITEMS.map((item, index) => {
      const y = 8 + index * 54
      return <g key={item.text}><Card x={20} y={y} w={320} h={42} tone={index < 4 ? 'stage' : index < 7 ? 'link' : 'hub'} /><Mono x={32} y={y + 18} bold size={11}>{`Gate ${index + 1} · ${item.text.replace(/[.`]/g, '')}`}</Mono>{index < MIGRATION_ITEMS.length - 1 && <Line d={`M180 ${y + 43} V${y + 51}`} arrow />}</g>
    })}
  </>
)
export function MigrationPathDrawing() {
  return <Drawing id="migration-path" title={TITLE} desc={DESC} wide={{ viewBox: '0 0 800 140', content: wide }} narrow={{ viewBox: '0 0 360 450', content: narrow }} />
}
