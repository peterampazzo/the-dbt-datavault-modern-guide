import { MODEL, MODELS } from '@/lib/dv/models'
import { Drawing, Card, Line, Mono, Note, Small } from './kit'

const ROOT = MODEL.customer_n_s.name

function downstreamOf(root: string) {
  const selected = new Set([root])
  let changed = true
  while (changed) {
    changed = false
    for (const model of MODELS) {
      if (!selected.has(model.name) && model.deps.some((dependency) => selected.has(dependency))) {
        selected.add(model.name)
        changed = true
      }
    }
  }
  return MODELS.filter((model) => selected.has(model.name))
}

const SELECTED = downstreamOf(ROOT)
const SELECTED_NAMES = new Set(SELECTED.map((model) => model.name))
const DEFERRED_NAMES = [...new Set(SELECTED.flatMap((model) => model.deps).filter((dependency) => !SELECTED_NAMES.has(dependency)))]
const DEFERRED = DEFERRED_NAMES.map((name) => MODELS.find((model) => model.name === name)).filter((model) => model !== undefined)

function depth(name: string): number {
  const model = SELECTED.find((item) => item.name === name)!
  const parents = model.deps.filter((dependency) => SELECTED_NAMES.has(dependency))
  return parents.length ? Math.max(...parents.map(depth)) + 1 : 0
}

const COLUMNS = [...new Set(SELECTED.map((model) => depth(model.name)))].sort((a, b) => a - b)
const LAYOUT = new Map<string, { x: number; y: number }>()
for (const column of COLUMNS) {
  const models = SELECTED.filter((model) => depth(model.name) === column)
  models.forEach((model, index) => {
    const y = models.length === 1 ? 176 : 74 + index * 128
    LAYOUT.set(model.name, { x: 20 + column * 182, y })
  })
}

const TITLE = 'Slim CI builds a changed satellite and its downstream models'
const DESC =
  `The ${ROOT} change selects itself and downstream models via state:modified+. ` +
  `Other direct dependencies ${DEFERRED.map((model) => model.name).join(', ')} are available from production through defer.`

const edges = SELECTED.flatMap((model) =>
  model.deps
    .filter((dependency) => SELECTED_NAMES.has(dependency))
    .map((dependency) => {
      const source = LAYOUT.get(dependency)!
      const target = LAYOUT.get(model.name)!
      return <Line key={`${dependency}-${model.name}`} d={`M${source.x + 158} ${source.y + 27} H${target.x - 14} V${target.y + 27} H${target.x}`} arrow />
    }),
)

const wide = (
  <>
    <Note x={20} y={30}>CI · state:modified+</Note>
    <Note x={590} y={30}>defer to prod</Note>
    {edges}
    {SELECTED.map((model) => {
      const position = LAYOUT.get(model.name)!
      const tone = model.name === ROOT ? 'sat' : 'hub'
      return (
        <g key={model.name}>
          <Card x={position.x} y={position.y} w={158} h={54} tone={tone} />
          <Mono x={position.x + 10} y={position.y + 24} tone={tone} size={9} bold>{model.name}</Mono>
          <Small x={position.x + 10} y={position.y + 43} size={8}>
            {model.deps.some((dependency) => SELECTED_NAMES.has(dependency)) ? 'downstream node' : 'changed model'}
          </Small>
        </g>
      )
    })}
    <Card x={590} y={48} w={190} h={332} tone="stage" />
    <Mono x={606} y={76} tone="stage" bold>unselected refs</Mono>
    <Small x={606} y={98}>dbt reads prod relations</Small>
    {DEFERRED.map((model, index) => (
      <Small key={model.name} x={606} y={130 + index * 28} size={9}>{model.name}</Small>
    ))}
    <Note x={606} y={355} size={10}>CI does not rebuild these models.</Note>
  </>
)

const narrowTop = 128
const narrowModelGap = 50
const narrowDeferredTop = narrowTop + SELECTED.length * narrowModelGap + 30
const narrowHeight = narrowDeferredTop + 42 + DEFERRED.length * 22 + 28
const narrow = (
  <>
    <Note x={20} y={28}>CI · state:modified+</Note>
    <Card x={20} y={42} w={320} h={54} tone="stage" />
    <Mono x={36} y={68} tone="stage" bold>{`changed · ${ROOT}`}</Mono>
    <Note x={20} y={narrowTop - 18} size={16}>Build changed model + downstream</Note>
    {SELECTED.map((model, index) => {
      const y = narrowTop + 14 + index * narrowModelGap
      const tone = model.name === ROOT ? 'sat' : 'hub'
      return (
        <g key={model.name}>
          <Card x={20} y={y} w={320} h={42} tone={tone} />
          <Mono x={34} y={y + 18} tone={tone} size={10} bold>{model.name}</Mono>
          <Small x={34} y={y + 35} size={8}>
            {model.deps.filter((dependency) => SELECTED_NAMES.has(dependency)).join(', ') || 'modified'}
          </Small>
        </g>
      )
    })}
    <Card x={20} y={narrowDeferredTop} w={320} h={42 + DEFERRED.length * 22} tone="stage" />
    <Mono x={34} y={narrowDeferredTop + 24} tone="stage" bold>defer unselected refs to prod</Mono>
    {DEFERRED.map((model, index) => (
      <Small key={model.name} x={34} y={narrowDeferredTop + 48 + index * 22} size={9}>{model.name}</Small>
    ))}
  </>
)

export function SlimCiDrawing() {
  return (
    <Drawing
      id="slim-ci"
      title={TITLE}
      desc={DESC}
      wide={{ viewBox: '0 0 800 410', content: wide }}
      narrow={{ viewBox: `0 0 360 ${narrowHeight}`, content: narrow }}
    />
  )
}
