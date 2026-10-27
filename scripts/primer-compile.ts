import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { BATCHES, CUSTOMERS, NATIONS, ORDERS, PHONES } from '../src/lib/dv/dataset'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const project = path.join(root, 'primer-dbt')
const target = path.join(project, 'target')
const database = path.join(project, 'primer.duckdb')
const output = path.join(root, 'src/lib/primer/compiled.json')

type Step = {
  id: string
  label: string
  setupSql: string[]
  dbtSql: string[]
  checkSql: string
}

const quote = (value: unknown) =>
  value === null || value === undefined
    ? 'NULL'
    : typeof value === 'number'
      ? String(value)
      : `'${String(value).replaceAll("'", "''")}'`

const customerColumns = 'c_custkey, c_name, c_address, c_nationkey, c_mktsegment, c_acctbal, c_comment, ldts'
const nationColumns = 'n_nationkey, n_name, n_region, ldts'
const phoneColumns = 'c_custkey, phone_type, phone_number, ldts'
const orderColumns = 'o_orderkey, o_custkey, o_orderdate, o_totalprice, ldts'

function insertRows(table: string, columns: string, rows: Record<string, unknown>[], ldts: string) {
  if (!rows.length) return ''
  return `INSERT INTO landing.${table} (${columns}) VALUES\n${rows.map((row) => {
    const values = Object.values(row)
    return `  (${[...values, ldts].map(quote).join(', ')})`
  }).join(',\n')};`
}

function landingSql(batchIndexes: number[], truncate = false) {
  const creates = `
CREATE SCHEMA IF NOT EXISTS landing;
CREATE TABLE IF NOT EXISTS landing.customer (
  c_custkey INTEGER, c_name VARCHAR, c_address VARCHAR, c_nationkey INTEGER,
  c_mktsegment VARCHAR, c_acctbal DECIMAL(12,2), c_comment VARCHAR, ldts TIMESTAMP
);
CREATE TABLE IF NOT EXISTS landing.nation (
  n_nationkey INTEGER, n_name VARCHAR, n_region VARCHAR, ldts TIMESTAMP
);
CREATE TABLE IF NOT EXISTS landing.phone (
  c_custkey INTEGER, phone_type VARCHAR, phone_number VARCHAR, ldts TIMESTAMP
);
CREATE TABLE IF NOT EXISTS landing.orders (
  o_orderkey INTEGER, o_custkey INTEGER, o_orderdate DATE, o_totalprice DECIMAL(12,2), ldts TIMESTAMP
);`
  const truncateSql = truncate
    ? 'DELETE FROM landing.customer; DELETE FROM landing.nation; DELETE FROM landing.phone; DELETE FROM landing.orders;'
    : ''
  return [creates, truncateSql, ...batchInserts(batchIndexes)].filter(Boolean).join('\n')
}

function batchInserts(batchIndexes: number[]) {
  return batchIndexes.flatMap((index) => [
    insertRows('customer', customerColumns, CUSTOMERS[index] as unknown as Record<string, unknown>[], BATCHES[index]),
    insertRows('nation', nationColumns, NATIONS[index] as unknown as Record<string, unknown>[], BATCHES[index]),
    insertRows('phone', phoneColumns, PHONES[index] as unknown as Record<string, unknown>[], BATCHES[index]),
    insertRows('orders', orderColumns, ORDERS[index] as unknown as Record<string, unknown>[], BATCHES[index]),
  ]).filter(Boolean)
}

function browserScenarioSetup(batchIndexes: number[]) {
  const createStatements = landingSql([]).split(';').filter((statement) => statement.trim())
  return [
    'DROP SCHEMA IF EXISTS primer.landing CASCADE;',
    ...resetTargets(),
    ...createStatements,
    ...batchInserts(batchIndexes),
  ]
}

function pythonSql(sql: string) {
  const result = spawnSync('python3', ['-c', 'import duckdb,sys; db=duckdb.connect(sys.argv[1]); db.execute(sys.stdin.read()); db.close()', database], {
    cwd: project,
    input: sql,
    encoding: 'utf8',
  })
  if (result.status !== 0) throw new Error(result.stderr || 'Could not prepare DuckDB landing tables')
}

function dbt(args: string[], allowFailure = false) {
  const result = spawnSync('dbt', ['--no-use-colors', ...args], {
    cwd: project,
    encoding: 'utf8',
    env: { ...process.env, DBT_SEND_ANONYMOUS_USAGE_STATS: 'false' },
  })
  if (result.status !== 0 && !allowFailure) throw new Error(`${result.stdout}\n${result.stderr}`)
  return `${result.stdout}\n${result.stderr}`
}

function findFile(directory: string, name: string): string {
  if (!existsSync(directory)) throw new Error(`Missing dbt output directory: ${directory}`)
  for (const item of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, item.name)
    if (item.isDirectory()) {
      const match = findFileOptional(fullPath, name)
      if (match) return match
    } else if (item.name === name) return fullPath
  }
  throw new Error(`dbt did not generate ${name}`)
}

function findFileOptional(directory: string, name: string): string | undefined {
  for (const item of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, item.name)
    if (item.isDirectory()) {
      const match = findFileOptional(fullPath, name)
      if (match) return match
    } else if (item.name === name) return fullPath
  }
  return undefined
}

function runSql(modelPath: string) {
  const sql = readFileSync(findFile(path.join(target, 'run'), path.basename(modelPath)), 'utf8').trim().replace(/;\s*$/, '')
  return sql.match(/\bas\s*\(([\s\S]*)\)\s*$/i)?.[1].trim() ?? sql
}

function compiledSql(modelPath: string) {
  return readFileSync(findFile(path.join(target, 'compiled'), path.basename(modelPath)), 'utf8').trim().replace(/;\s*$/, '')
}

function wrap(relation: string, materialization: 'VIEW' | 'TABLE', sql: string) {
  return `CREATE OR REPLACE ${materialization} primer.main.${relation} AS\n${sql};`
}

function insertIncremental(sql: string) {
  return `INSERT INTO primer.main.stg_customer_incremental\n${sql};`
}

function resetTargets() {
  return [
    'DROP VIEW IF EXISTS primer.main.stg_customer;',
    'DROP TABLE IF EXISTS primer.main.customer_by_segment;',
    'DROP TABLE IF EXISTS primer.main.customer_balance;',
    'DROP TABLE IF EXISTS primer.main.stg_customer_incremental;',
  ]
}

async function main() {
  mkdirSync(path.dirname(output), { recursive: true })
  rmSync(target, { recursive: true, force: true })
  rmSync(database, { force: true })

  const versions = dbt(['--version'])
  const dbtVersion = versions.match(/installed:\s*([^\s]+)/)?.[1]
  const adapterVersion = versions.match(/duckdb:\s*([^\s]+)/)?.[1]
  if (!dbtVersion || !adapterVersion) throw new Error(`Could not read dbt versions:\n${versions}`)

  const steps: Step[] = []
  try {
    pythonSql(landingSql([0]))
    dbt(['build'])
    const customerBySegment = runSql('customer_by_segment.sql')
    const customerBalance = runSql('customer_balance.sql')
    const stgCustomer = runSql('stg_customer.sql')
    const modelSetup = browserScenarioSetup([0])
    const modelBuild = [
        wrap('stg_customer', 'VIEW', stgCustomer),
        wrap('customer_by_segment', 'TABLE', customerBySegment),
        wrap('customer_balance', 'TABLE', customerBalance),
      ]
    steps.push(
      {
        id: 'models-ref-source',
        label: '4.3 · Source rows',
        setupSql: modelSetup,
        dbtSql: modelBuild,
        checkSql: 'SELECT c_custkey, c_name, c_mktsegment FROM primer.landing.customer ORDER BY c_custkey LIMIT 3',
      },
      {
        id: 'models-ref-stg',
        label: '4.3 · Staging model',
        setupSql: [],
        dbtSql: [],
        checkSql: 'SELECT c_custkey, c_name, c_address, c_acctbal FROM primer.main.stg_customer ORDER BY c_custkey LIMIT 3',
      },
      {
        id: 'models-ref-mart',
        label: '4.3 · ref() mart',
        setupSql: [],
        dbtSql: [],
        checkSql: 'SELECT c_mktsegment, customer_count, total_account_balance FROM primer.main.customer_by_segment ORDER BY c_mktsegment',
      },
    )

    steps.push({
      id: 'incremental-batch-1',
      label: 'Batch 1 · dbt build',
      setupSql: browserScenarioSetup([0]),
      dbtSql: [wrap('stg_customer_incremental', 'TABLE', runSql('stg_customer_incremental.sql'))],
      checkSql: 'SELECT (SELECT count(*) FROM primer.landing.customer) AS landing_rows, (SELECT count(*) FROM primer.main.stg_customer_incremental) AS target_rows',
    })

    pythonSql(landingSql([1]))
    dbt(['run', '--select', 'stg_customer_incremental'])
    steps.push({
      id: 'incremental-batch-2',
      label: 'Batch 2 · incremental run',
      setupSql: batchInserts([1]),
      dbtSql: [insertIncremental(compiledSql('stg_customer_incremental.sql'))],
      checkSql: 'SELECT (SELECT count(*) FROM primer.landing.customer) AS landing_rows, (SELECT count(*) FROM primer.main.stg_customer_incremental) AS target_rows',
    })

    pythonSql(`DELETE FROM landing.customer;${landingSql([2], true)}`)
    dbt(['run', '--select', 'stg_customer_incremental'])
    steps.push({
      id: 'incremental-batch-3',
      label: 'Landing truncated · batch 3 arrives',
      setupSql: [
        'DELETE FROM primer.landing.customer;',
        'DELETE FROM primer.landing.nation;',
        'DELETE FROM primer.landing.phone;',
        'DELETE FROM primer.landing.orders;',
        ...batchInserts([2]),
      ],
      dbtSql: [insertIncremental(compiledSql('stg_customer_incremental.sql'))],
      checkSql: 'SELECT (SELECT count(*) FROM primer.landing.customer) AS landing_rows, (SELECT count(*) FROM primer.main.stg_customer_incremental) AS target_rows',
    })

    dbt(['run', '--select', 'stg_customer_incremental', '--full-refresh'])
    steps.push({
      id: 'incremental-full-refresh',
      label: '--full-refresh',
      setupSql: [],
      dbtSql: [wrap('stg_customer_incremental', 'TABLE', compiledSql('stg_customer_incremental.sql'))],
      checkSql: 'SELECT (SELECT count(*) FROM primer.landing.customer) AS landing_rows, (SELECT count(*) FROM primer.main.stg_customer_incremental) AS target_rows',
    })

    rmSync(database, { force: true })
    pythonSql(landingSql([0]))
    const duplicate = CUSTOMERS[0][0]
    pythonSql(insertRows('customer', customerColumns, [duplicate] as unknown as Record<string, unknown>[], BATCHES[0]))
    dbt(['run', '--select', 'stg_customer'])
    const testOutput = dbt(['test', '--select', 'unique_stg_customer_c_custkey'], true)
    const uniqueFile = findFile(target, 'unique_stg_customer_c_custkey.sql')
    const uniqueSql = readFileSync(uniqueFile, 'utf8').trim().replace(/;\s*$/, '')
    if (!/FAIL|fail/i.test(testOutput)) throw new Error('The duplicate-key dbt test did not fail')
    steps.push({
      id: 'unique-fails',
      label: '4.7 · Duplicate fails unique',
      setupSql: [
        ...browserScenarioSetup([]),
        ...batchInserts([0]),
        insertRows('customer', customerColumns, [duplicate] as unknown as Record<string, unknown>[], BATCHES[0]),
      ],
      dbtSql: [wrap('stg_customer', 'VIEW', runSql('stg_customer.sql'))],
      checkSql: uniqueSql,
    })

    pythonSql('DELETE FROM landing.customer WHERE c_custkey = 1 AND rowid = (SELECT max(rowid) FROM landing.customer WHERE c_custkey = 1);')
    const passOutput = dbt(['test', '--select', 'unique_stg_customer_c_custkey'])
    if (!/PASS|pass/i.test(passOutput)) throw new Error('The unique-key dbt test did not pass after removing the duplicate')
    steps.push({
      id: 'unique-passes',
      label: '4.7 · Remove duplicate · passes',
      setupSql: ['DELETE FROM primer.landing.customer WHERE c_custkey = 1 AND rowid = (SELECT max(rowid) FROM primer.landing.customer WHERE c_custkey = 1);'],
      dbtSql: [],
      checkSql: uniqueSql,
    })

    writeFileSync(output, `${JSON.stringify({ dbtVersion, adapterVersion, steps }, null, 2)}\n`)
  } finally {
    rmSync(database, { force: true })
    rmSync(target, { recursive: true, force: true })
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
