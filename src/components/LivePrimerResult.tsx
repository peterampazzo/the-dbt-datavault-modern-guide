import { useEffect, useRef, useState } from 'react'
import { PrimerResult, type PrimerResultColumn, type PrimerResultRow } from '@/components/PrimerResult'
import type { AsyncDuckDB, AsyncDuckDBConnection } from '@duckdb/duckdb-wasm'

type LiveResult = {
  columns: PrimerResultColumn[]
  rows: PrimerResultRow[]
}

type BrowserSession = {
  database: AsyncDuckDB
  connection: AsyncDuckDBConnection
  worker: Worker
  workerUrl: string
}

function displayValue(value: unknown): string | number {
  if (typeof value === 'number' || typeof value === 'string') return value
  if (typeof value === 'bigint') return value.toString()
  if (value === null || value === undefined) return ''
  return String(value)
}

export function LivePrimerResult({
  title,
  columns,
  rows,
  summary,
  stepIds,
  activeStepId,
}: {
  title: string
  columns: PrimerResultColumn[]
  rows: PrimerResultRow[]
  summary?: string
  stepIds: string[]
  activeStepId: string
}) {
  const session = useRef<BrowserSession | null>(null)
  const previousStep = useRef(activeStepId)
  const replayRef = useRef<(stepId: string) => Promise<void>>(async () => {})
  const [enabled, setEnabled] = useState(false)
  const [query, setQuery] = useState('')
  const [defaultQuery, setDefaultQuery] = useState('')
  const [result, setResult] = useState<LiveResult | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => () => {
    const current = session.current
    session.current = null
    if (current) {
      void current.connection.close()
      void current.database.terminate()
      URL.revokeObjectURL(current.workerUrl)
    }
  }, [])

  async function startSession() {
    if (session.current) return session.current
    const duckdb = await import('@duckdb/duckdb-wasm')
    const bundle = await duckdb.selectBundle(duckdb.getJsDelivrBundles())
    if (!bundle.mainWorker || !bundle.mainModule) throw new Error('DuckDB browser bundle is unavailable')
    const workerUrl = URL.createObjectURL(new Blob(
      [`importScripts("${bundle.mainWorker}");`],
      { type: 'text/javascript' },
    ))
    const worker = new Worker(workerUrl)
    const database = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(), worker)
    try {
      let timeout = 0
      try {
        await Promise.race([
          database.instantiate(bundle.mainModule, bundle.pthreadWorker),
          new Promise<never>((_, reject) => {
            timeout = window.setTimeout(() => reject(new Error('DuckDB initialization timed out')), 20_000)
          }),
        ])
      } finally {
        window.clearTimeout(timeout)
      }
      const connection = await database.connect()
      await connection.query("ATTACH ':memory:' AS primer")
      await connection.query('USE primer')
      const opened = { database, connection, worker, workerUrl }
      session.current = opened
      return opened
    } catch (error) {
      worker.terminate()
      URL.revokeObjectURL(workerUrl)
      void database.terminate()
      throw error
    }
  }

  async function runSql(connection: AsyncDuckDBConnection, sql: string) {
    const table = await connection.query(sql)
    const columns = table.schema.fields.map((field) => ({ key: field.name, label: field.name }))
    const rows = table.toArray().map((row) => Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, displayValue(value)]),
    ))
    return { columns, rows }
  }

  async function replay(stepId: string) {
    previousStep.current = stepId
    setBusy(true)
    setMessage('')
    setResult(null)
    try {
      const { compiledPrimer } = await import('@/lib/primer/compiled')
      const liveSteps = stepIds.map((id) => compiledPrimer.steps.find((step) => step.id === id))
      const activeIndex = stepIds.indexOf(stepId)
      if (liveSteps.some((step) => !step) || activeIndex < 0) throw new Error('The compiled primer steps are missing')
      const selectedSteps = liveSteps.slice(0, activeIndex + 1)
      const opened = await startSession()
      await opened.connection.query('USE memory')
      await opened.connection.query('DETACH primer')
      await opened.connection.query("ATTACH ':memory:' AS primer")
      await opened.connection.query('USE primer')
      let activeQuery = ''
      for (const step of selectedSteps) {
        if (!step) continue
        for (const sql of step.setupSql) await opened.connection.query(sql)
        for (const sql of step.dbtSql) await opened.connection.query(sql)
        activeQuery = step.checkSql
      }
      setQuery(activeQuery)
      setDefaultQuery(activeQuery)
      setResult(await runSql(opened.connection, activeQuery))
      setEnabled(true)
    } catch {
      setMessage('DuckDB could not run this panel. The static result remains available.')
      setEnabled(true)
    } finally {
      setBusy(false)
    }
  }

  replayRef.current = replay

  async function runQuery(sql = query) {
    const opened = session.current
    if (!opened || !sql.trim()) return
    setBusy(true)
    setMessage('')
    try {
      setResult(await runSql(opened.connection, sql))
    } catch {
      setMessage('That query could not be run. The static result remains available.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (enabled && previousStep.current !== activeStepId) {
      previousStep.current = activeStepId
      void replayRef.current(activeStepId)
    }
  }, [activeStepId, enabled])

  return (
    <div className="space-y-3">
      <PrimerResult title={title} columns={columns} rows={rows} summary={summary} />
      {!enabled && (
        <button
          type="button"
          onClick={() => void replay(activeStepId)}
          disabled={busy}
          className="rounded-lg border border-sky-700 bg-sky-700 px-3 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:opacity-60"
        >
          Run it live in DuckDB <span className="ml-1 text-xs font-normal">· downloads ~6.8 MB from jsDelivr</span>
        </button>
      )}
      {enabled && (
        <section aria-label="Live DuckDB result" className="space-y-3 border-t pt-6">
          <h3 className="font-semibold">Live DuckDB result</h3>
          {busy && <p role="status" className="text-sm">Running captured SQL…</p>}
          {message && <p role="status" className="text-sm text-amber-800 dark:text-amber-300">{message}</p>}
          <div className="space-y-2">
            <label htmlFor={`primer-query-${activeStepId}`} className="block text-sm font-medium">SQL query</label>
            <textarea
              id={`primer-query-${activeStepId}`}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              rows={5}
              spellCheck={false}
              className="w-full rounded-lg border bg-background p-3 font-mono text-xs"
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => void runQuery()} disabled={busy} className="rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50">Run</button>
              <button
                type="button"
                onClick={() => {
                  setQuery(defaultQuery)
                  void runQuery(defaultQuery)
                }}
                disabled={busy}
                className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
              >
                Reset
              </button>
            </div>
          </div>
          {result && (
            <PrimerResult
              title="Query results"
              columns={result.columns}
              rows={result.rows}
              summary={`${result.rows.length} rows returned`}
            />
          )}
        </section>
      )}
    </div>
  )
}
