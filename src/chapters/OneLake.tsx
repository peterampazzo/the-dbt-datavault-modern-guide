import { useState } from 'react'
import { Chapter } from '@/components/Chapter'
import { ChapterHeader, Code, P, Section } from '@/components/Prose'
import { Term } from '@/components/Term'

type Engine = 'fabric' | 'databricks'

function EngineDiagram() {
  const [engine, setEngine] = useState<Engine>('fabric')
  const fabric = engine === 'fabric'
  const compute = fabric ? 'Fabric Spark' : 'Databricks'
  const target = fabric ? 'dbt-fabricspark' : 'dbt-databricks'
  const connection = fabric ? 'OneLake shortcut' : 'Unity Catalog external location'

  return (
    <div className="space-y-4">
      <fieldset className="flex flex-wrap items-center gap-2 border-0 p-0">
        <legend className="sr-only">Switch engine</legend>
        <span className="mr-1 text-sm font-medium">Switch engine</span>
        <button
          type="button"
          aria-pressed={fabric}
          onClick={() => setEngine('fabric')}
          className="rounded-md border px-3 py-2 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground"
        >
          Microsoft Fabric
        </button>
        <button
          type="button"
          aria-pressed={!fabric}
          onClick={() => setEngine('databricks')}
          className="rounded-md border px-3 py-2 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground"
        >
          Databricks
        </button>
      </fieldset>
      <section aria-label={`${compute} reads persistent staging through ${connection}`} className="grid items-stretch gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Storage · unchanged</p>
          <p className="mt-2 font-medium">ADLS Gen2</p>
          <p className="text-sm text-foreground">Open Delta files · persistent staging</p>
        </div>
        <div className="flex items-center justify-center text-sm font-medium text-foreground md:px-1" aria-hidden="true">→</div>
        <div className="rounded-xl border border-sky-500/40 bg-sky-500/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Connection</p>
          <p className="mt-2 font-medium">{connection}</p>
          <p className="text-sm text-foreground">Reads the same stored files</p>
        </div>
        <div className="flex items-center justify-center text-sm font-medium text-foreground md:px-1" aria-hidden="true">→</div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Compute · target swaps</p>
          <p className="mt-2 font-medium">{compute}</p>
          <p className="text-sm text-foreground">dbt target: {target}</p>
        </div>
      </section>
      <output aria-live="polite" className="block text-sm font-semibold text-emerald-800 dark:text-emerald-300">
        Storage unchanged. {compute} uses {connection}.
      </output>
      <p className="max-w-3xl text-xs leading-5 text-foreground">
        Connection references: <a className="text-foreground underline" href="https://learn.microsoft.com/en-us/fabric/onelake/onelake-shortcuts" target="_blank" rel="noreferrer">OneLake shortcuts</a> · <a className="text-foreground underline" href="https://docs.databricks.com/aws/en/connect/unity-catalog/cloud-storage/external-locations" target="_blank" rel="noreferrer">Unity Catalog external locations</a>.
      </p>
    </div>
  )
}

export default function OneLake() {
  return (
    <Chapter>
      <ChapterHeader title="One lake, any engine" lead={<>Source files stay in an open <Term id="lakehouse">lakehouse</Term> as compute engines and dbt targets change.</>} />
      <Section
        title="Switch engines"
        lead="Persistent staging stays in place when the compute engine changes. Switch engines to see the connection label update."
        keyPoint="An engine change does not require copying the source history."
      >
        <EngineDiagram />
      </Section>
      <Section
        title="Storage vs compute"
        lead="Raw deliveries stay once in open storage, where each selected engine can read the same files."
        keyPoint="Storage holds the source history; compute reads and transforms it."
      >
        <P>Store the raw deliveries once as open Delta files in ADLS Gen2. Fabric Spark or Databricks reads them in place; each engine has its own connection and dbt target.</P>
      </Section>
      <Section
        title="The layers"
        lead={<>The <Term id="medallion">medallion architecture</Term> maps customer, nation and orders from source systems through storage and modelling to reporting.</>}
        keyPoint="Landing and persistent staging preserve source data; stage, vault and mart models are derived and rebuildable."
      >
        <p data-figure-caption className="mb-4 max-w-full whitespace-normal font-mono text-xs text-foreground">
          sources → landing + persistent staging (Bronze) → dv_stage (Silver) → raw_vault (Silver) → business_vault (Silver) → marts (Gold)
        </p>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['Sources', 'Customer, nation and orders from their source systems.'],
            ['Landing + persistent staging (Bronze)', 'Every delivery retained as received.'],
            ['Stage · dv_stage (Silver)', 'Views add hashes, ldts and rsrc; no business rules.'],
            ['Raw vault (Silver)', 'Hubs, links and satellites integrated by business key.'],
            ['Business vault (Silver)', 'PITs, bridges and derived business rules.'],
            ['Marts (Gold)', 'Dimensions, facts and reporting views.'],
          ].map(([name, detail], index) => (
            <li key={name} className="rounded-xl border bg-card p-3">
              <span className="mb-2 block text-xs font-semibold text-foreground">Layer {index + 1}</span>
              <strong className="block font-mono text-sm">{name}</strong>
              <span className="mt-1 block text-sm text-foreground">{detail}</span>
            </li>
          ))}
        </ol>
      </Section>
      <Section
        title="What moves, what’s rebuilt"
        lead="Source files and transformation code stay in place; platform connections and services must change."
        keyPoint="Move the compute, then rebuild derived tables and reconnect the services around them."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4">
            <h3 className="mb-2 font-semibold">Stays</h3>
            <ul className="ml-5 list-disc space-y-1 text-sm leading-6">
              <li>ADLS Gen2 storage and the persistent staging files.</li>
              <li>Portable dbt model code and the source history.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
            <h3 className="mb-2 font-semibold">Rebuilt or reconfigured</h3>
            <ul className="ml-5 list-disc space-y-1 text-sm leading-6">
              <li>Vault tables, using a planned full refresh.</li>
              <li>Permissions, orchestration and BI connections.</li>
            </ul>
          </div>
        </div>
      </Section>
      <Section
        title="Keep it portable"
        lead="Engine-specific details stay small, and hash rules remain testable across targets."
        keyPoint="Portable SQL plus a cross-engine hash test protects the raw-vault keys during a move."
      >
        <ul className="ml-5 list-disc space-y-2 text-sm leading-6">
          <li>Use plain Spark SQL where possible; put engine-specific syntax in named macros and vars.</li>
          <li>Set one global hash rule and run a cross-engine unit test proving identical hashkeys from identical business keys.</li>
          <li>Access rules belong to a reading path: a row filter defined in one engine doesn't protect reads of the same files through another engine, or copies such as derived tables and exported reports. Check what each path enforces; on Fabric, see <a className="text-sky-700 underline dark:text-sky-400" href="https://learn.microsoft.com/en-us/fabric/onelake/security/read-secured-data" target="_blank" rel="noreferrer">OneLake security</a>.</li>
        </ul>
        <P>Fabric Spark support is being added upstream to datavault4dbt; check the <a className="text-sky-700 underline dark:text-sky-400" href="https://github.com/ScalefreeCOM/datavault4dbt/releases" target="_blank" rel="noreferrer">package release notes</a> for the available version and adapter combination. Install the package through <Code>packages.yml</Code> like any dbt package, and keep the same global hashing vars on both engines.</P>
      </Section>
    </Chapter>
  )
}
