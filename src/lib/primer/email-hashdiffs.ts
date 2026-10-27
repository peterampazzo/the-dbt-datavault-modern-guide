import { BATCHES, CUSTOMER_EMAIL, CUSTOMERS } from '../dv/dataset'
import { hd } from '../dv/hash'

const EMAIL_HASHDIFF_COLUMNS = ['c_name', 'c_address', 'c_mktsegment', 'c_acctbal', 'c_comment', 'c_email'] as const

function emailVersionRow(batchIndex: number) {
  const customer = CUSTOMERS[batchIndex].find((row) => row.c_custkey === 2)
  if (!customer) throw new Error(`Customer 2 is missing from delivery ${batchIndex + 1}`)

  return {
    ...customer,
    c_email: CUSTOMER_EMAIL[batchIndex][2],
    ldts: BATCHES[batchIndex],
    rsrc: 'crm/customer',
  }
}

const emailVersionRows = [1, 2].map(emailVersionRow)
type EmailHashdiffColumn = (typeof EMAIL_HASHDIFF_COLUMNS)[number]

const emailHashdiff = (row: (typeof emailVersionRows)[number], columns: readonly EmailHashdiffColumn[]) =>
  hd(...columns.map((column) => row[column]))

export const EMAIL_HASHDIFFS = emailVersionRows.map((row) => ({
  c_custkey: row.c_custkey,
  ldts: row.ldts,
  expected: emailHashdiff(row, EMAIL_HASHDIFF_COLUMNS),
  actualWithoutEmail: emailHashdiff(row, EMAIL_HASHDIFF_COLUMNS.slice(0, -1)),
}))

const yamlString = (value: string) => JSON.stringify(value)

export const emailUnitTestGivenRows = emailVersionRows.map((row) => `          - c_custkey: ${row.c_custkey}
            c_name: ${yamlString(row.c_name)}
            c_address: ${yamlString(row.c_address)}
            c_nationkey: ${row.c_nationkey}
            c_mktsegment: ${yamlString(row.c_mktsegment)}
            c_acctbal: ${row.c_acctbal}
            c_comment: ${yamlString(row.c_comment)}
            c_email: ${yamlString(row.c_email)}
            ldts: ${yamlString(row.ldts)}
            rsrc: ${yamlString(row.rsrc)}`).join('\n')

export const emailUnitTestExpectedRows = EMAIL_HASHDIFFS.map((row) => `        - c_custkey: ${row.c_custkey}
          ldts: ${yamlString(row.ldts)}
          hd_customer_n_s: '${row.expected}'`).join('\n')
