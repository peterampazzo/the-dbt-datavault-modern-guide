import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { CodeBlock } from '@/components/CodeBlock'
import { Switch } from '@/components/ui/switch'
import { MODEL } from '@/lib/dv/models'
import { setSqlDialect, useSqlDialect } from '@/lib/dialect'
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

const HUB_TSQL: Line[] = [
  ['p', 'CREATE OR ALTER PROCEDURE raw_vault.load_customer_h AS'],
  ['p', 'BEGIN'],
  ['p', '    SET NOCOUNT ON;'],
  ['p', '    BEGIN TRY'],
  ['p', '        BEGIN TRANSACTION;'],
  ['p', '        MERGE raw_vault.customer_h AS target'],
  ['p', '        USING ('],
  ['k', '            SELECT CONVERT(CHAR(32), HASHBYTES(\'MD5\', UPPER(TRIM(CAST(c_custkey AS NVARCHAR(100))))), 2) AS hk_customer_h,'],
  ['p', '                   c_custkey, ldts, rsrc'],
  ['p', '            FROM ('],
  ['k', '                SELECT deliveries.*, ROW_NUMBER() OVER (PARTITION BY c_custkey ORDER BY ldts) AS rn'],
  ['p', '                FROM ('],
  ['s', "                    SELECT c_custkey, ldts, 'crm/customer' AS rsrc"],
  ['s', '                    FROM stage.stg_customer'],
  ['p', '                    UNION ALL'],
  ['s', "                    SELECT o_custkey AS c_custkey, ldts, 'shop/orders' AS rsrc"],
  ['s', '                    FROM stage.stg_orders'],
  ['p', '                ) AS deliveries'],
  ['p', `                ${HWM('customer_h').trim()}`],
  ['p', '            ) AS ranked'],
  ['k', '            WHERE rn = 1'],
  ['p', '        ) AS source'],
  ['k', '        ON target.hk_customer_h = source.hk_customer_h'],
  ['p', '        WHEN NOT MATCHED BY TARGET THEN'],
  ['k', '            INSERT (hk_customer_h, c_custkey, ldts, rsrc)'],
  ['k', '            VALUES (source.hk_customer_h, source.c_custkey, source.ldts, source.rsrc);'],
  ['p', '        COMMIT;'],
  ['p', '    END TRY'],
  ['p', '    BEGIN CATCH'],
  ['p', '        IF @@TRANCOUNT > 0 ROLLBACK;'],
  ['p', '        THROW;'],
  ['p', '    END CATCH'],
  ['p', 'END;'],
]

const LINK_TSQL: Line[] = [
  ['p', 'CREATE OR ALTER PROCEDURE raw_vault.load_customer_nation_l AS'],
  ['p', 'BEGIN'],
  ['p', '    SET NOCOUNT ON;'],
  ['p', '    BEGIN TRY'],
  ['p', '        BEGIN TRANSACTION;'],
  ['p', '        MERGE raw_vault.customer_nation_l AS target'],
  ['p', '        USING ('],
  ['p', '            SELECT hk_customer_nation_l, hk_customer_h, hk_nation_h, ldts, rsrc'],
  ['p', '            FROM ('],
  ['k', '                SELECT hashed.*, ROW_NUMBER() OVER (PARTITION BY hk_customer_nation_l ORDER BY ldts) AS rn'],
  ['p', '                FROM ('],
  ['s', '                    SELECT c_custkey, c_nationkey, ldts, rsrc,'],
  ['k', "                           CONVERT(CHAR(32), HASHBYTES('MD5', CONCAT_WS('||', UPPER(TRIM(CAST(c_custkey AS NVARCHAR(100)))), UPPER(TRIM(CAST(c_nationkey AS NVARCHAR(100)))))), 2) AS hk_customer_nation_l,"],
  ['k', "                           CONVERT(CHAR(32), HASHBYTES('MD5', UPPER(TRIM(CAST(c_custkey AS NVARCHAR(100))))), 2) AS hk_customer_h,"],
  ['k', "                           CONVERT(CHAR(32), HASHBYTES('MD5', UPPER(TRIM(CAST(c_nationkey AS NVARCHAR(100))))), 2) AS hk_nation_h"],
  ['s', '                    FROM stage.stg_customer'],
  ['p', `                    ${HWM('customer_nation_l').trim()}`],
  ['p', '                ) AS hashed'],
  ['p', '            ) AS ranked'],
  ['k', '            WHERE rn = 1'],
  ['p', '        ) AS source'],
  ['k', '        ON target.hk_customer_nation_l = source.hk_customer_nation_l'],
  ['p', '        WHEN NOT MATCHED BY TARGET THEN'],
  ['k', '            INSERT (hk_customer_nation_l, hk_customer_h, hk_nation_h, ldts, rsrc)'],
  ['k', '            VALUES (source.hk_customer_nation_l, source.hk_customer_h, source.hk_nation_h, source.ldts, source.rsrc);'],
  ['p', '        COMMIT;'],
  ['p', '    END TRY'],
  ['p', '    BEGIN CATCH'],
  ['p', '        IF @@TRANCOUNT > 0 ROLLBACK;'],
  ['p', '        THROW;'],
  ['p', '    END CATCH'],
  ['p', 'END;'],
]

const SAT_TSQL: Line[] = [
  ['x', '-- once, before the next load:'],
  ['x', 'ALTER TABLE raw_vault.customer_n_s ADD c_email NVARCHAR(200);'],
  ['p', 'CREATE OR ALTER PROCEDURE raw_vault.load_customer_n_s AS'],
  ['p', 'BEGIN'],
  ['p', '    SET NOCOUNT ON;'],
  ['p', '    BEGIN TRY'],
  ['p', '        BEGIN TRANSACTION;'],
  ['p', '        WITH src AS ('],
  ['k', '            SELECT'],
  ['k', "                CONVERT(CHAR(32), HASHBYTES('MD5', UPPER(TRIM(CAST(c_custkey AS NVARCHAR(100))))), 2) AS hk_customer_h,"],
  ['d', '                c_name, c_address, c_mktsegment, c_acctbal, c_comment,'],
  ['x', '                c_email,'],
  ['p', '                ldts, rsrc,'],
  ['k', "                CONVERT(CHAR(32), HASHBYTES('MD5', CONCAT_WS(';', TRIM(CAST(c_name AS NVARCHAR(200))), TRIM(CAST(c_address AS NVARCHAR(500))), TRIM(CAST(c_mktsegment AS NVARCHAR(100))), TRIM(CAST(c_acctbal AS NVARCHAR(100))), TRIM(CAST(c_comment AS NVARCHAR(MAX)))"],
  ['x', "                    , TRIM(CAST(c_email AS NVARCHAR(200)))"],
  ['k', "                )), 2) AS hd_customer_n_s"],
  ['s', '            FROM stage.stg_customer'],
  ['p', HWM('customer_n_s')],
  ['p', '        ), latest AS ('],
  ['p', '            SELECT hk_customer_h, hd_customer_n_s,'],
  ['p', '                   ROW_NUMBER() OVER (PARTITION BY hk_customer_h ORDER BY ldts DESC) AS rn'],
  ['p', '            FROM raw_vault.customer_n_s'],
  ['p', '        ), changed AS ('],
  ['p', '            SELECT src.*, LAG(hd_customer_n_s) OVER (PARTITION BY hk_customer_h ORDER BY ldts) AS prev_hd'],
  ['p', '            FROM src'],
  ['p', '        )'],
  ['p', '        SELECT c.* INTO #changed'],
  ['p', '        FROM changed AS c'],
  ['p', '        LEFT JOIN latest AS l ON l.hk_customer_h = c.hk_customer_h AND l.rn = 1'],
  ['k', '        WHERE (c.prev_hd IS NULL AND (l.hk_customer_h IS NULL OR l.hd_customer_n_s <> c.hd_customer_n_s))'],
  ['k', '           OR c.prev_hd <> c.hd_customer_n_s;'],
  ['p', '        INSERT INTO raw_vault.customer_n_s ('],
  ['k', '            hk_customer_h, hd_customer_n_s,'],
  ['d', '            c_name, c_address, c_mktsegment, c_acctbal, c_comment,'],
  ['x', '            c_email,'],
  ['p', '            ldts, rsrc)'],
  ['p', '        SELECT hk_customer_h, hd_customer_n_s,'],
  ['d', '               c_name, c_address, c_mktsegment, c_acctbal, c_comment,'],
  ['x', '               c_email,'],
  ['p', '               ldts, rsrc'],
  ['p', '        FROM #changed;'],
  ['p', '        DROP TABLE #changed;'],
  ['p', '        COMMIT;'],
  ['p', '    END TRY'],
  ['p', '    BEGIN CATCH'],
  ['p', '        IF @@TRANCOUNT > 0 ROLLBACK;'],
  ['p', '        THROW;'],
  ['p', '    END CATCH'],
  ['p', 'END;'],
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

export const PATTERNS = {
  hub: { label: 'Hub', model: 'customer_h', hand: HUB, tsql: HUB_TSQL, keys: 'Hashkey and business key' },
  link: { label: 'Link', model: 'customer_nation_l', hand: LINK, tsql: LINK_TSQL, keys: 'Link and hub hashkeys' },
  sat: { label: 'Satellite', model: 'customer_n_s', hand: SAT, tsql: SAT_TSQL, keys: 'Parent hashkey and hashdiff' },
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
  const dialect = useSqlDialect()
  const p = PATTERNS[id]
  const isSat = id === 'sat'
  const showExtra = isSat && extra

  const hand = useMemo(() => (dialect === 'tsql' ? p.tsql : p.hand).filter(([t]) => t !== 'x' || showExtra), [dialect, p, showExtra])
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
        <Group
          label="Dialect"
          value={dialect}
          options={[
            { id: 'generic' as const, label: 'Generic SQL' },
            { id: 'tsql' as const, label: 'T-SQL procedure' },
          ]}
          onChange={setSqlDialect}
        />
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
        <CodeBlock title={`${dialect === 'tsql' ? 'T-SQL procedure' : 'By hand'} · ${count(hand)} lines`} code={hand.map(([, l]) => l).join('\n')} highlight={lineNos(hand, active)} className="[&>pre]:text-xs [&>pre]:leading-5" />
        <CodeBlock title={`With datavault4dbt · ${count(yaml)} lines`} code={yaml.map(([, l]) => l).join('\n')} highlight={lineNos(yaml, active)} className="[&>pre]:text-xs [&>pre]:leading-5" />
      </div>
      <p aria-live="polite" className="max-w-3xl text-sm leading-6 text-foreground/85">
        {showExtra
          ? <>Suppose the CRM starts sending c_email. By hand you change the table and both column lists; in dbt it is one line in src_payload. Either way, the stage adds c_email to the hashdiff columns.{dialect === 'tsql' && <> This procedure hashes inline, so every procedure carries its own hash rule. That is the parity problem covered in <Link to="/hash-parity" className="text-sky-700 underline underline-offset-2 dark:text-sky-400">Hash parity and restoring history</Link>.</>}</>
          : dialect === 'tsql'
            ? <>This procedure hashes inline, so every procedure carries its own hash rule. That is the parity problem covered in <Link to="/hash-parity" className="text-sky-700 underline underline-offset-2 dark:text-sky-400">Hash parity and restoring history</Link>.</>
            : 'Both sides assume the stage has already computed the hashkeys and hashdiffs. The highlighted lines on the left are what the highlighted lines on the right replace.'}
      </p>
    </div>
  )
}
