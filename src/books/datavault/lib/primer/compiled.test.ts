import { DuckDBInstance } from '@duckdb/node-api'
import { describe, expect, it } from 'vitest'
import { compiledPrimer } from './compiled'

describe('compiled plain-dbt primer SQL', () => {
  it('replays every captured step in a primer-qualified DuckDB database', async () => {
    const instance = await DuckDBInstance.create(':memory:')
    const connection = await instance.connect()

    try {
      await connection.run("ATTACH ':memory:' AS primer")
      await connection.run('USE primer')

      const results = new Map<string, Record<string, unknown>[]>()
      for (const step of compiledPrimer.steps) {
        for (const sql of step.setupSql) await connection.run(sql)
        for (const sql of step.dbtSql) await connection.run(sql)
        const reader = await connection.runAndReadAll(step.checkSql)
        results.set(step.id, reader.getRowObjectsJS())
      }

      expect(compiledPrimer.dbtVersion).toMatch(/^1\./)
      expect(compiledPrimer.adapterVersion).toMatch(/^1\./)
      expect(results.get('models-ref-source')).toHaveLength(3)
      expect(results.get('models-ref-stg')?.[0]).toMatchObject({
        c_custkey: 1,
        c_name: 'Alice Martin',
      })
      expect(results.get('models-ref-mart')).toHaveLength(5)

      const counts = [
        'incremental-batch-1',
        'incremental-batch-2',
        'incremental-batch-3',
        'incremental-full-refresh',
      ].map((id) => {
        const row = results.get(id)?.[0]
        return [Number(row?.landing_rows), Number(row?.target_rows)]
      })
      expect(counts).toEqual([[5, 5], [10, 10], [7, 17], [7, 7]])

      expect(results.get('unique-fails')).toHaveLength(1)
      expect(results.get('unique-passes')).toHaveLength(0)
    } finally {
      connection.closeSync()
      instance.closeSync()
    }
  })
})
