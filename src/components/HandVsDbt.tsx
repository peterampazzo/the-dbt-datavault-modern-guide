import { useMemo, useState } from 'react'
import { CodeBlock } from '@/components/CodeBlock'
import { Switch } from '@/components/ui/switch'
import { MODEL } from '@/lib/dv/models'
import { cn } from '@/lib/utils'

/** p = loading pattern, k = keys, d = payload, s = source, x = the extra column */
type Tag = 'p' | 'k' | 'd' | 's' | 'x' | ''
type Line = [Tag, string]

const HWM = (t: string) => `    WHERE ldts > (SELECT COALESCE(MAX(ldts), '1900-01-01') FROM raw_vault.${t})`

const HUB: Line[] = [
  ['p', 'INSERT INTO raw_vault.customer_h (hk_customer_h, c_custkey, ldts, rsrc)'],
  ['p', 'SELECT hk_customer_h, c_custkey, ldts, rsrc'],
  ['p', 'FROM ('],
  ['p', '    SELECT hk_customer_h, c_custkey, ldts, rsrc,'],
  ['k', '        ROW_NUMBER() OVER (PARTITION BY hk_customer_h ORDER BY ldts) AS rn'],
  ['p', '    FROM ('],
  ['s', "        SELECT hk_customer_h, c_custkey, ldts, 'crm/customer' AS rsrc"],
  ['s', '        FROM stage.stg_customer'],
  ['p', '        UNION ALL'],
  ['s', "        SELECT hk_customer_h, o_custkey AS c_custkey, ldts, 'shop/orders' AS rsrc"],
  ['s', '        FROM stage.stg_orders'],
  ['p', '    ) AS all_sources'],
  ['p', HWM('customer_h')],
  ['p', ') AS ranked'],
  ['p', 'WHERE rn = 1'],
  ['p', '  AND NOT EXISTS (SELECT 1 FROM raw_vault.customer_h AS h'],
  ['k', '                  WHERE h.hk_customer_h = ranked.hk_customer_h);'],
]

const LINK: Line[] = [
  ['p', 'INSERT INTO raw_vault.customer_nation_l'],
  ['k', '    (hk_customer_nation_l, hk_customer_h, hk_nation_h, ldts, rsrc)'],
  ['k', 'SELECT hk_customer_nation_l, hk_customer_h, hk_nation_h, ldts, rsrc'],
  ['p', 'FROM ('],
  ['k', '    SELECT s.*, ROW_NUMBER() OVER (PARTITION BY hk_customer_nation_l ORDER BY ldts) AS rn'],
  ['s', '    FROM stage.stg_customer AS s'],
  ['p', HWM('customer_nation_l')],
  ['p', ') AS ranked'],
  ['p', 'WHERE rn = 1'],
  ['p', '  AND NOT EXISTS (SELECT 1 FROM raw_vault.customer_nation_l AS l'],
  ['k', '                  WHERE l.hk_customer_nation_l = ranked.hk_customer_nation_l);'],
]

const SAT: Line[] = [
  ['x', '-- once, before the next load:'],
  ['x', 'ALTER TABLE raw_vault.customer_n_s ADD c_email VARCHAR(200);'],
  ['x', ''],
  ['p', 'WITH src AS ('],
  ['k', '    SELECT hk_customer_h, hd_customer_n_s,'],
  ['d', '        c_name, c_address, c_mktsegment, c_acctbal, c_comment,'],
  ['x', '        c_email,'],
  ['p', '        ldts, rsrc'],
  ['s', '    FROM stage.stg_customer'],
  ['p', HWM('customer_n_s')],
  ['p', '),'],
  ['p', '-- the latest version already in the satellite'],
  ['p', 'latest AS ('],
  ['k', '    SELECT hk_customer_h, hd_customer_n_s,'],
  ['p', '        ROW_NUMBER() OVER (PARTITION BY hk_customer_h ORDER BY ldts DESC) AS rn'],
  ['p', '    FROM raw_vault.customer_n_s'],
  ['p', '),'],
  ['p', '-- several versions of one key can arrive in one batch'],
  ['p', 'changed AS ('],
  ['p', '    SELECT src.*,'],
  ['k', '        LAG(hd_customer_n_s) OVER (PARTITION BY hk_customer_h ORDER BY ldts) AS prev_hd'],
  ['p', '    FROM src'],
  ['p', ')'],
  ['p', 'INSERT INTO raw_vault.customer_n_s ('],
  ['k', '    hk_customer_h, hd_customer_n_s,'],
  ['d', '    c_name, c_address, c_mktsegment, c_acctbal, c_comment,'],
  ['x', '    c_email,'],
  ['p', '    ldts, rsrc)'],
  ['p', 'SELECT c.hk_customer_h, c.hd_customer_n_s,'],
  ['d', '    c.c_name, c.c_address, c.c_mktsegment, c.c_acctbal, c.c_comment,'],
  ['x', '    c.c_email,'],
  ['p', '    c.ldts, c.rsrc'],
  ['p', 'FROM changed AS c'],
  ['p', 'LEFT JOIN latest AS l ON l.hk_customer_h = c.hk_customer_h AND l.rn = 1'],
  ['k', 'WHERE (c.prev_hd IS NULL AND (l.hk_customer_h IS NULL OR l.hd_customer_n_s <> c.hd_customer_n_s))'],
  ['k', '   OR c.prev_hd <> c.hd_customer_n_s;'],
]

const YAML_PART: Record<string, Tag> = {
  hashkey: 'k',
  business_keys: 'k',
  link_hashkey: 'k',
  foreign_hashkeys: 'k',
  parent_hashkey: 'k',
  src_hashdiff: 'k',
  src_payload: 'd',
  source_model: 's',
  source_models: 's',
}

/** Tags each line of a model's datavault4dbt code with the part it declares. */
function tagYaml(code: string, extra: boolean): Line[] {
  let part: Tag = ''
  const out: Line[] = []
  for (const l of code.split('\n')) {
    const top = /^([a-z_]+):/.exec(l)
    if (top) part = YAML_PART[top[1]] ?? ''
    else if (!l.startsWith(' ')) part = ''
    const tag: Tag = /materialized='incremental'|datavault4dbt\./.test(l) ? 'p' : part
    if (extra && part !== 'd' && out.at(-1)?.[0] === 'd') out.push(['x', '    - c_email'])
    out.push([tag, l])
  }
  return out
}

const PATTERNS = {
  hub: { label: 'Hub', model: 'customer_h', hand: HUB, keys: 'Hashkey and business key' },
  link: { label: 'Link', model: 'customer_nation_l', hand: LINK, keys: 'Link and hub hashkeys' },
  sat: { label: 'Satellite', model: 'customer_n_s', hand: SAT, keys: 'Parent hashkey and hashdiff' },
} as const
type PatternId = keyof typeof PATTERNS

const lineNos = (lines: Line[], tag: Tag) => lines.flatMap(([t], i) => (t === tag ? [i + 1] : []))
const count = (lines: Line[]) => lines.filter(([, l]) => l.trim() && !l.trim().startsWith('--')).length

function Group<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            'rounded-md border px-2.5 py-1 text-sm',
            value === o.id ? 'border-foreground bg-foreground text-background' : 'hover:bg-muted',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function HandVsDbt() {
  const [id, setId] = useState<PatternId>('sat')
  const [part, setPart] = useState<Tag>('p')
  const [extra, setExtra] = useState(false)
  const p = PATTERNS[id]
  const isSat = id === 'sat'
  const showExtra = isSat && extra

  const hand = useMemo(() => p.hand.filter(([t]) => t !== 'x' || showExtra), [p, showExtra])
  const yaml = useMemo(() => tagYaml(MODEL[p.model].code, showExtra), [p, showExtra])

  const parts: { id: Tag; label: string }[] = [
    { id: 'p', label: 'Loading pattern' },
    { id: 'k', label: p.keys },
    ...(isSat ? [{ id: 'd' as Tag, label: 'Payload columns' }] : []),
    { id: 's', label: id === 'hub' ? 'Source stages' : 'Source stage' },
  ]
  const active: Tag = part === 'd' && !isSat ? 'p' : part

  return (
    <div data-testid="hand-vs-dbt" className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Group label="Entity" value={id} options={(Object.keys(PATTERNS) as PatternId[]).map((k) => ({ id: k, label: PATTERNS[k].label }))} onChange={setId} />
        <Group label="Highlight" value={active} options={parts} onChange={setPart} />
        {isSat && (
          <label className="inline-flex items-center gap-2 text-sm">
            <Switch
              checked={extra}
              onCheckedChange={(v) => {
                setExtra(v)
                setPart(v ? 'x' : 'p')
              }}
            />{' '}
            Add a column
          </label>
        )}
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <CodeBlock title={`By hand · ${count(hand)} lines`} code={hand.map(([, l]) => l).join('\n')} highlight={lineNos(hand, active)} />
        <CodeBlock title={`With datavault4dbt · ${count(yaml)} lines`} code={yaml.map(([, l]) => l).join('\n')} highlight={lineNos(yaml, active)} />
      </div>
      <p aria-live="polite" className="max-w-3xl text-sm leading-6 text-foreground/85">
        {showExtra
          ? 'Suppose the CRM starts sending c_email. By hand you change the table and both column lists; in dbt it is one line in src_payload. Either way, the stage adds c_email to the hashdiff columns.'
          : 'Both sides assume the stage has already computed the hashkeys and hashdiffs. The highlighted lines on the left are what the highlighted lines on the right replace.'}
      </p>
    </div>
  )
}
