import primerRequirements from '../../primer-dbt/requirements.txt?raw'

const sources = [
  { label: 'Data Vault Modeling Guide', use: 'The modelling method, keys, relationships and satellite design.', href: 'http://dvstandards.com/wp-content/uploads/2021/02/data_vault_modeling_guide_2019_v3.pdf' },
  { label: 'datavault4dbt wiki and source', use: 'Macro names, metadata, hashes and loading behavior.', href: 'https://github.com/ScalefreeCOM/datavault4dbt/wiki' },
  { label: 'dbt documentation', use: 'Models, refs, sources, tests, materializations and incremental builds.', href: 'https://docs.getdbt.com/' },
  { label: 'Data Vault with dbt', use: 'How dbt supports repeatable Data Vault modelling.', href: 'https://docs.getdbt.com/blog/data-vault-with-dbt' },
  { label: 'Cognitive accessibility guidelines', use: 'Short steps, clear language and support for interrupted reading.', href: 'https://deliver-good-services.education.gov.uk/guides/cognitive-accessibility-guidelines' },
  { label: 'W3C cognitive accessibility guidance', use: 'Design patterns for focus and predictable steps.', href: 'https://www.w3.org/TR/coga-usable/' },
]

function pinnedVersion(packageName: string) {
  const line = primerRequirements.split(/\r?\n/).find((item) => item.startsWith(`${packageName}==`))
  return line?.split('==')[1] ?? 'not pinned'
}

export function AboutPage() {
  return (
    <article className="mx-auto max-w-4xl">
      <header className="mb-8 max-w-[75ch]">
        <h1 className="text-4xl font-semibold tracking-tight">About this guide</h1>
        <p className="mt-3 text-muted-foreground">A practical, interactive route from source data to a tested Data Vault and reporting models.</p>
      </header>

      <section className="mb-8 max-w-[75ch]" aria-labelledby="about-readers">
        <h2 id="about-readers" className="mb-3 text-2xl font-semibold">Who it is for</h2>
        <ul className="list-disc space-y-2 pl-6 leading-7">
          <li><strong>New to Data Vault and dbt:</strong> build the foundations, then follow the full guide.</li>
          <li><strong>Know Data Vault, new to dbt:</strong> start with the guide’s names and focus on building and loading.</li>
          <li><strong>Just browsing:</strong> choose any chapter and read in any order.</li>
        </ul>
      </section>

      <section className="mb-8 max-w-[75ch]" aria-labelledby="about-scope">
        <h2 id="about-scope" className="mb-3 text-2xl font-semibold">What it is—and is not</h2>
        <p className="leading-7">
          The examples use fictional customer, nation and order data. They teach Data Vault modelling and dbt with datavault4dbt only; they are not production instructions and require no vendor setup.
        </p>
        <p className="mt-3 leading-7">
          Most interactive results come from a TypeScript simulation. Only the plain-dbt primer loads DuckDB in the browser, where it replays SQL captured from a build-time dbt run.
        </p>
      </section>

      <section className="mb-8 max-w-[75ch]" aria-labelledby="about-sources">
        <h2 id="about-sources" className="mb-3 text-2xl font-semibold">Sources</h2>
        <ul className="space-y-3">
          {sources.map((source) => (
            <li key={source.href}>
              <a href={source.href} className="font-medium text-sky-700 underline underline-offset-4 dark:text-sky-400">{source.label}</a>
              <p className="text-sm leading-6 text-muted-foreground">{source.use}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="max-w-[75ch]" aria-labelledby="about-versions">
        <h2 id="about-versions" className="mb-3 text-2xl font-semibold">Versions</h2>
        <ul className="list-disc space-y-2 pl-6 leading-7">
          <li>datavault4dbt: the guide follows the macro contract and defaults documented in its reference; the guide does not pin a runtime package release.</li>
          <li>dbt-core: {pinnedVersion('dbt-core')}.</li>
          <li>dbt-duckdb: {pinnedVersion('dbt-duckdb')}.</li>
        </ul>
      </section>
    </article>
  )
}
