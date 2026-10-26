import { BATCHES, CUSTOMER_EMAIL, CUSTOMERS } from '../dv/dataset'
import { hd } from '../dv/hash'

export type PrimerLang = 'sql' | 'yaml' | 'bash'

export interface PrimerFile {
  name: string
  path: string
  code: string
  lang: PrimerLang
}

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

const EMAIL_VERSION_ROWS = [1, 2].map(emailVersionRow)
type EmailHashdiffColumn = (typeof EMAIL_HASHDIFF_COLUMNS)[number]

const emailHashdiff = (row: (typeof EMAIL_VERSION_ROWS)[number], columns: readonly EmailHashdiffColumn[]) =>
  hd(...columns.map((column) => row[column]))

export const EMAIL_HASHDIFFS = EMAIL_VERSION_ROWS.map((row) => ({
  c_custkey: row.c_custkey,
  ldts: row.ldts,
  expected: emailHashdiff(row, EMAIL_HASHDIFF_COLUMNS),
  actualWithoutEmail: emailHashdiff(row, EMAIL_HASHDIFF_COLUMNS.slice(0, -1)),
}))

const yamlString = (value: string) => JSON.stringify(value)

const emailUnitTestGivenRows = EMAIL_VERSION_ROWS.map((row) => `          - c_custkey: ${row.c_custkey}
            c_name: ${yamlString(row.c_name)}
            c_address: ${yamlString(row.c_address)}
            c_nationkey: ${row.c_nationkey}
            c_mktsegment: ${yamlString(row.c_mktsegment)}
            c_acctbal: ${row.c_acctbal}
            c_comment: ${yamlString(row.c_comment)}
            c_email: ${yamlString(row.c_email)}
            ldts: ${yamlString(row.ldts)}
            rsrc: ${yamlString(row.rsrc)}`).join('\n')

const emailUnitTestExpectedRows = EMAIL_HASHDIFFS.map((row) => `        - c_custkey: ${row.c_custkey}
          ldts: ${yamlString(row.ldts)}
          hd_customer_n_s: '${row.expected}'`).join('\n')

export const PRIMER = {
  stg_customer: {
    name: 'stg_customer',
    path: 'models/staging/stg_customer.sql',
    lang: 'sql',
    code: `select
    cast(c_custkey as integer) as c_custkey,
    trim(c_name) as c_name,
    trim(c_address) as c_address,
    cast(c_acctbal as decimal(12, 2)) as c_acctbal,
    c_mktsegment,
    c_comment
from {{ source('landing', 'customer') }}`,
  },
  customer_by_segment: {
    name: 'customer_by_segment',
    path: 'models/marts/customer_by_segment.sql',
    lang: 'sql',
    code: `select
    c_mktsegment,
    count(*) as customer_count,
    sum(c_acctbal) as total_account_balance
from {{ ref('stg_customer') }}
group by c_mktsegment`,
  },
  customer_incremental: {
    name: 'customer_incremental',
    path: 'models/staging/stg_customer_incremental.sql',
    lang: 'sql',
    code: `{{ config(materialized='incremental') }}

select c_custkey, c_name, c_acctbal, ldts
from {{ source('landing', 'customer') }}
{% if is_incremental() %}
where ldts > (select max(ldts) from {{ this }})
{% endif %}`,
  },
  compiled_incremental_first: {
    name: 'compiled_incremental_first',
    path: 'target/compiled/guide/models/staging/stg_customer_incremental.sql · first run',
    lang: 'sql',
    code: `select c_custkey, c_name, c_acctbal, ldts
from "landing"."customer"`,
  },
  compiled_incremental_next: {
    name: 'compiled_incremental_next',
    path: 'target/compiled/guide/models/staging/stg_customer_incremental.sql · incremental run',
    lang: 'sql',
    code: `select c_custkey, c_name, c_acctbal, ldts
from "landing"."customer"
where ldts > (select max(ldts) from "main"."stg_customer_incremental")`,
  },
  round_amount_macro: {
    name: 'round_amount',
    path: 'macros/round_amount.sql',
    lang: 'sql',
    code: `{% macro round_amount(value) %}
cast({{ value }} as decimal(12, 2))
{% endmacro %}`,
  },
  round_amount_usage: {
    name: 'round_amount_usage',
    path: 'models/marts/customer_balance.sql',
    lang: 'sql',
    code: `select
    c_custkey,
    {{ round_amount('c_acctbal') }} as account_balance
from {{ ref('stg_customer') }}`,
  },
  compiled_round_amount: {
    name: 'compiled_round_amount',
    path: 'target/compiled/guide/models/marts/customer_balance.sql · macro expanded',
    lang: 'sql',
    code: `select
    c_custkey,
    cast(c_acctbal as decimal(12, 2)) as account_balance
from "main"."stg_customer"`,
  },
  schema_tests: {
    name: 'schema_tests',
    path: 'models/staging/schema.yml',
    lang: 'yaml',
    code: `version: 2

models:
  - name: stg_customer
    columns:
      - name: c_custkey
        data_tests:
          - unique
          - not_null
      - name: c_name
        data_tests:
          - not_null`,
  },
  sources: {
    name: 'sources',
    path: 'models/staging/sources.yml',
    lang: 'yaml',
    code: `version: 2

sources:
  - name: landing
    schema: landing
    tables:
      - name: customer`,
  },
  materialized_view: {
    name: 'materialized_view',
    path: 'Illustrative view DDL',
    lang: 'sql',
    code: `create or replace view main.customer_by_segment as
select c_mktsegment, count(*) as customer_count
from main.stg_customer
group by c_mktsegment`,
  },
  materialized_table: {
    name: 'materialized_table',
    path: 'Illustrative table DDL',
    lang: 'sql',
    code: `create or replace table main.customer_by_segment as
select c_mktsegment, count(*) as customer_count
from main.stg_customer
group by c_mktsegment`,
  },
  materialized_incremental: {
    name: 'materialized_incremental',
    path: 'Illustrative incremental DDL · later append run',
    lang: 'sql',
    code: `insert into main.stg_customer_incremental
select c_custkey, c_name, c_acctbal, ldts
from landing.customer
where ldts > (select max(ldts) from main.stg_customer_incremental)`,
  },
  sqlserver_customer_h: {
    name: 'sqlserver_customer_h',
    path: 'sql/load_customer_h.sql',
    lang: 'sql',
    code: `create or alter procedure dbo.load_customer_h
as
begin
    set xact_abort on;
    begin try
        begin transaction;

        select
            convert(binary(16), hashbytes('MD5',
                concat(upper(ltrim(rtrim(convert(varchar(100), c_custkey)))), '||')
            )) as hk_customer_h,
            c_custkey,
            ldts,
            rsrc
        into #customer_source
        from dbo.stg_customer;

        merge dbo.customer_h as target
        using #customer_source as source
          on target.hk_customer_h = source.hk_customer_h
        when not matched then
          insert (hk_customer_h, c_custkey, ldts, rsrc)
          values (source.hk_customer_h, source.c_custkey, source.ldts, source.rsrc);

        commit transaction;
    end try
    begin catch
        if xact_state() <> 0 rollback transaction;
        throw;
    end catch
end;`,
  },
  sql_agent_job_step: {
    name: 'sql_agent_job_step',
    path: 'SQL Agent job · step setup',
    lang: 'sql',
    code: `exec msdb.dbo.sp_add_jobstep
    @job_name = N'Load customer vault',
    @step_name = N'Load customer_h',
    @subsystem = N'TSQL',
    @command = N'EXEC dbo.load_customer_h;',
    @on_success_action = 1,
    @on_fail_action = 2;`,
  },
  email_payload_before: {
    name: 'email_payload_before',
    path: "src/lib/dv/models.ts · MODEL['customer_n_s'].code · before",
    lang: 'yaml',
    code: `src_payload:
  - c_name
  - c_address
  - c_mktsegment
  - c_acctbal
  - c_comment`,
  },
  email_payload_after: {
    name: 'email_payload_after',
    path: "src/lib/dv/models.ts · MODEL['customer_n_s'].code · PR diff",
    lang: 'yaml',
    code: `src_payload:
  - c_name
  - c_address
  - c_mktsegment
  - c_acctbal
  - c_comment
  - c_email`,
  },
  email_hashdiff_fix: {
    name: 'email_hashdiff_fix',
    path: "src/lib/dv/models.ts · MODEL['stg_customer'].code fix",
    lang: 'yaml',
    code: `hd_customer_n_s:
  is_hashdiff: true
  columns:
    - c_name
    - c_address
    - c_mktsegment
    - c_acctbal
    - c_comment
    - c_email`,
  },
  email_version_unit_tests: {
    name: 'email_version_unit_tests',
    path: 'models/staging/schema.yml · dbt 1.8+ unit tests',
    lang: 'yaml',
    code: `unit_tests:
  - name: email_change_creates_distinct_stage_hashdiff
    model: stg_customer
    given:
      - input: source('landing', 'customer')
        rows:
${emailUnitTestGivenRows}
    expect:
      rows:
${emailUnitTestExpectedRows}`,
  },
  profiles: {
    name: 'profiles',
    path: '~/.dbt/profiles.yml',
    lang: 'yaml',
    code: `guide:
  target: dev
  outputs:
    dev:
      type: duckdb
      path: target/dev.duckdb
      schema: dev
      threads: 1
    ci:
      type: duckdb
      path: target/ci.duckdb
      schema: "ci_{{ env_var('CI_RUN_ID', 'local') }}"
      threads: 1
    prod:
      type: duckdb
      path: "{{ env_var('DBT_PROD_PATH') }}"
      schema: "{{ env_var('DBT_PROD_SCHEMA') }}"
      threads: 1`,
  },
} as const satisfies Record<string, PrimerFile>

export type WorkflowConcept = 'source' | 'transform' | 'lookup' | 'write' | 'order' | 'schedule' | 'error'
export type WorkflowView = 'ssis' | 'procedure' | 'dbt'

export const WORKFLOW_CONCEPTS: {
  id: WorkflowConcept
  label: string
  equivalents: Record<WorkflowView, string>
}[] = [
  {
    id: 'source',
    label: 'Source',
    equivalents: {
      ssis: 'OLE DB Source reads dbo.stg_customer',
      procedure: 'SELECT reads dbo.stg_customer into #customer_source',
      dbt: "stg_customer declares source('landing', 'customer')",
    },
  },
  {
    id: 'transform',
    label: 'Transform',
    equivalents: {
      ssis: 'Derived Column casts and standardises fields',
      procedure: 'SELECT expressions prepare the business key and columns',
      dbt: 'Stage model and metadata prepare the source attributes',
    },
  },
  {
    id: 'lookup',
    label: 'Lookup',
    equivalents: {
      ssis: 'Lookup checks whether the customer key already exists',
      procedure: 'MERGE matches on hk_customer_h',
      dbt: 'The hub macro deduplicates and checks existing keys',
    },
  },
  {
    id: 'write',
    label: 'Write',
    equivalents: {
      ssis: 'OLE DB Destination writes the new hub row',
      procedure: 'MERGE inserts a key that is not matched',
      dbt: 'The hub macro inserts new business keys',
    },
  },
  {
    id: 'order',
    label: 'Order',
    equivalents: {
      ssis: 'Precedence constraint runs the data flow after Execute SQL succeeds',
      procedure: 'Statements run in procedure order',
      dbt: 'Model dependencies determine build order',
    },
  },
  {
    id: 'schedule',
    label: 'Schedule',
    equivalents: {
      ssis: 'SQL Agent starts the package or job step',
      procedure: 'SQL Agent invokes dbo.load_customer_h',
      dbt: 'A scheduler invokes dbt build',
    },
  },
  {
    id: 'error',
    label: 'Error',
    equivalents: {
      ssis: 'Error output or package failure path',
      procedure: 'TRY…CATCH rolls back and THROW returns the error',
      dbt: 'A failed test or model makes the build report failure',
    },
  },
]

export const SSIS_FLOW = {
  controlFlow: [
    { id: 'execute-sql-task', label: 'Execute SQL Task', concept: 'order' as const },
    { id: 'data-flow-task', label: 'Data Flow Task', concept: 'order' as const },
  ],
  precedenceConstraints: [{ from: 'execute-sql-task', to: 'data-flow-task', condition: 'On Success' }],
  dataFlow: [
    { id: 'ole-db-source', label: 'OLE DB Source', concept: 'source' as const },
    { id: 'derived-column', label: 'Derived Column', concept: 'transform' as const },
    { id: 'lookup', label: 'Lookup', concept: 'lookup' as const },
    { id: 'ole-db-destination', label: 'OLE DB Destination', concept: 'write' as const },
  ],
  dataFlowConnections: [
    { from: 'ole-db-source', to: 'derived-column' },
    { from: 'derived-column', to: 'lookup' },
    { from: 'lookup', to: 'ole-db-destination' },
  ],
  errorOutput: { label: 'Error output', concept: 'error' as const },
  schedule: { label: 'SQL Agent job step', concept: 'schedule' as const },
}

export const PROCEDURE_FLOW = [
  { id: 'source', label: 'Read staging rows', concept: 'source' as const },
  { id: 'transform', label: 'Hash business key', concept: 'transform' as const },
  { id: 'lookup', label: 'MERGE match', concept: 'lookup' as const },
  { id: 'write', label: 'Insert unseen key', concept: 'write' as const },
  { id: 'order', label: 'Procedure statement order', concept: 'order' as const },
  { id: 'schedule', label: 'SQL Agent job step', concept: 'schedule' as const },
  { id: 'error', label: 'TRY…CATCH / THROW', concept: 'error' as const },
]

export const DBT_FLOW = [
  { id: 'source', label: "source('landing', 'customer')", concept: 'source' as const },
  { id: 'transform', label: 'Stage model and hash metadata', concept: 'transform' as const },
  { id: 'lookup', label: 'Hub macro matches known keys', concept: 'lookup' as const },
  { id: 'write', label: 'Hub macro inserts unseen keys', concept: 'write' as const },
  { id: 'order', label: 'Model dependency graph', concept: 'order' as const },
  { id: 'schedule', label: 'Scheduled dbt build', concept: 'schedule' as const },
  { id: 'error', label: 'Failed test or model', concept: 'error' as const },
]
