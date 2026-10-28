import { Chapter } from '@/components/Chapter'
import { useMemo, useState } from 'react'
import { Background, Controls, Handle, Position, ReactFlow, type Edge, type Node, type NodeProps } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ChapterHeader, Section, P } from '@/components/Prose'
import { CodeBlock } from '@/components/CodeBlock'
import { Badge } from '@/components/ui/badge'
import { LAYER_META, MODEL, MODELS, type DbtModel } from '@/lib/dv/models'
import { cn } from '@/lib/utils'

type ModelNode = Node<{ m: DbtModel; state: 'on' | 'dim' | 'normal' }, 'model'>

function ModelCard({ data }: NodeProps<ModelNode>) {
  const meta = LAYER_META[data.m.layer]
  return (
    <div
      className={cn(
        'w-48 rounded-lg border bg-card px-3 py-2 shadow transition-opacity',
        data.state === 'dim' && 'opacity-25',
        data.state === 'on' && cn('ring-2', meta.ring),
      )}
    >
      <Handle type="target" position={Position.Left} className="!size-1.5 !border-0 !bg-muted-foreground" />
      <div className="flex items-center gap-2">
        <span className={cn('size-2 rounded-full', meta.color)} />
        <span className="truncate font-mono text-[11px] font-medium">{data.m.name}</span>
      </div>
      <div className="mt-0.5 font-mono text-[9px] text-muted-foreground">{data.m.macro ? `datavault4dbt.${data.m.macro}` : data.m.materialized}</div>
      <Handle type="source" position={Position.Right} className="!size-1.5 !border-0 !bg-muted-foreground" />
    </div>
  )
}

const nodeTypes = { model: ModelCard }

function depth(name: string): number {
  const d = MODEL[name].deps
  return d.length ? 1 + Math.max(...d.map(depth)) : 0
}

const children = (name: string) => MODELS.filter((m) => m.deps.includes(name)).map((m) => m.name)
function walk(start: string, next: (n: string) => string[]) {
  const seen = new Set<string>()
  const stack = [start]
  while (stack.length) {
    const n = stack.pop()!
    for (const x of next(n)) {
      if (!seen.has(x)) {
        seen.add(x)
        stack.push(x)
      }
    }
  }
  return seen
}

const LAYER_ORDER = ['seed', 'stage', 'hub', 'link', 'sat', 'bv', 'mart']

export default function Lineage() {
  const [sel, setSel] = useState('customer_h')
  const related = useMemo(() => new Set([sel, ...walk(sel, (n) => MODEL[n].deps), ...walk(sel, children)]), [sel])

  const nodes: ModelNode[] = useMemo(() => {
    const cols = new Map<number, DbtModel[]>()
    MODELS.forEach((m) => cols.set(depth(m.name), [...(cols.get(depth(m.name)) ?? []), m]))
    return [...cols.entries()].flatMap(([d, ms]) =>
      ms
        .sort((a, b) => LAYER_ORDER.indexOf(a.layer) - LAYER_ORDER.indexOf(b.layer))
        .map((m, i) => ({
          id: m.name,
          type: 'model' as const,
          position: { x: d * 260, y: i * 64 - (ms.length * 64) / 2 },
          data: { m, state: m.name === sel ? ('on' as const) : related.has(m.name) ? ('normal' as const) : ('dim' as const) },
        })),
    )
  }, [sel, related])

  const edges: Edge[] = useMemo(
    () =>
      MODELS.flatMap((m) =>
        m.deps.map((d) => {
          const on = related.has(m.name) && related.has(d)
          return {
            id: `${d}-${m.name}`,
            source: d,
            target: m.name,
            animated: false,
            style: { opacity: on ? 0.9 : 0.15, strokeWidth: on ? 1.6 : 1 },
          }
        }),
      ),
    [related],
  )

  const m = MODEL[sel]
  return (
    <Chapter>
      <ChapterHeader
        title="The whole dbt project"
        lead="Everything from the previous chapters as one dbt DAG: seeds, stages, raw vault, business vault and a mart. Click a node to trace its upstream and downstream models."
      />
      <Section
        title="Explore the project graph"
        lead="Select a node in the lineage graph to inspect its model and its dependencies."
        keyPoint="dbt’s ref() dependencies connect landed data to stages, vault models, business-vault helpers and the mart."
      >
        <div
          className="h-[34rem] overflow-hidden border-t pt-6"
          onKeyDown={(e) => {
            const node = (e.target as HTMLElement).closest<HTMLElement>('.react-flow__node')
            if (node?.dataset.id && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault()
              setSel(node.dataset.id)
            }
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodeClick={(_, n) => setSel(n.id)}
            fitView
            colorMode={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
            nodesDraggable={false}
            edgesFocusable={false}
            proOptions={{ hideAttribution: true }}
            minZoom={0.3}
          >
            <Background gap={20} size={1} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[18rem_1fr]">
          <div>
            <div className="font-mono text-lg font-semibold">{m.name}</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge variant="outline">{LAYER_META[m.layer].label}</Badge>
              <Badge variant="outline">{m.materialized}</Badge>
            </div>
            <P>
              <span className="mt-3 block text-sm">{m.description}</span>
            </P>
            <div className="text-xs text-muted-foreground">
              depends on: {m.deps.length ? m.deps.join(', ') : '—'}
              <br />
              used by: {children(m.name).join(', ') || '—'}
            </div>
          </div>
          <CodeBlock title={`${m.name}.sql`} code={m.code} lang={m.layer === 'seed' ? 'bash' : 'sql'} />
        </div>
      </Section>
    </Chapter>
  )
}
