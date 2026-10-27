import { Link } from 'react-router'
import type { ReactNode } from 'react'
import { Chapter } from '@/components/Chapter'
import { CodeBlock } from '@/components/CodeBlock'
import { ChapterHeader, P, Section } from '@/components/Prose'
import { Term } from '@/components/Term'
import { MODEL, SNIPPETS } from '@/lib/dv/models'
import { LEGACY_PATTERNS } from '@/lib/legacy/patterns'

function Pair({ before, after, why }: { before: keyof typeof LEGACY_PATTERNS; after: { title: string; code: string; lang?: 'sql' | 'yaml' }; why: ReactNode }) {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <CodeBlock title={`T-SQL · ${LEGACY_PATTERNS[before].title}`} code={LEGACY_PATTERNS[before].code} lang="sql" />
        <CodeBlock title={`dbt · ${after.title}`} code={after.code} lang={after.lang ?? 'sql'} />
      </div>
      <p className="mt-4 max-w-3xl text-sm leading-6">{why}</p>
    </>
  )
}

export default function FromSqlServer() {
  return (
    <Chapter>
      <ChapterHeader
        title="From a hand-written SQL Server vault"
        lead={<>Keep the useful Data Vault ideas, keep the <Term id="raw-vault">raw vault</Term> insert-only, and move repeated loading rules into models, metadata and tests.</>}
      />

      <Section title="The same destination, safer route" lead="A hand-written vault can work. The risk grows when every procedure copies its own assumptions about history, keys and sources.">
        <P>dbt does not change the Data Vault objects. It makes the transformation from delivery to vault reviewable, repeatable and rebuildable.</P>
        <P>The seven comparisons below use the customer, nation and orders story. The left side shows a common legacy pattern; the right side shows where the rule can live in a dbt project.</P>
      </Section>

      <Section title="History is not an update">
        <Pair
          before="update_end_date"
          after={{ title: 'sat_v0 + sat_v1', code: `${MODEL.customer_n_s.code}\n\n-- derived view\n${MODEL.customer_n_s_v1.code}` }}
          why="The raw satellite is insert-only, so the original observation remains available. sat_v1 derives end dates and current flags as a view, which means a new rule can be rebuilt without rewriting raw history."
        />
      </Section>

      <Section title="Keep every delivery">
        <Pair
          before="transient_staging"
          after={{ title: 'persistent staging', code: SNIPPETS.persistent_staging.code }}
          why={<>A transient table leaves no evidence to replay when a model changes. <Term id="persistent-staging">Persistent staging</Term> appends each delivery and keeps the source load time; see <Link to="/replay" className="text-sky-700 underline underline-offset-2 dark:text-sky-400">Replay: one history, two shapes</Link> for the rebuild trade-off.</>}
        />
      </Section>

      <Section title="Describe targets once">
        <Pair
          before="cloned_procedures"
          after={{ title: 'MODEL.customer_h metadata', code: MODEL.customer_h.code, lang: 'yaml' }}
          why="A model name and its metadata describe the target independently of the source delivery. dbt can compile the same convention for every hub, while source-specific record-source values remain visible in the stage inputs."
        />
      </Section>

      <Section title="One hash rule">
        <Pair
          before="inline_hashes"
          after={{ title: 'MODEL.stg_customer hashed_columns', code: MODEL.stg_customer.code, lang: 'yaml' }}
          why={<>The stage owns the hash rule in one place, so a hub and every downstream link use the same <Term id="hashkey">hashkey</Term> standardisation and satellite <Term id="hashdiff">hashdiff</Term> inputs. When an older procedure used a different cast or encoding, test <Term id="hash-parity">hash parity</Term> in the <Link to="/hash-parity" className="text-sky-700 underline underline-offset-2 dark:text-sky-400">restoring-history lab</Link>.</>}
        />
      </Section>

      <Section title="Integrate sources in one business vault">
        <Pair
          before="cloned_business_vault"
          after={{ title: 'integrated_customer_precedence', code: SNIPPETS.integrated_customer_precedence.code }}
          why={<>The <Term id="business-vault">business vault</Term> is the explicit place to resolve a source conflict. A precedence order is visible in code and can be changed with a review, instead of cloning another procedure and hoping the copies stay aligned.</>}
        />
      </Section>

      <Section title="Keep business rules above the raw vault">
        <Pair
          before="rules_in_raw"
          after={{ title: 'business_rules_in_business_vault', code: SNIPPETS.business_rules_in_business_vault.code }}
          why="Raw staging should preserve what arrived and add technical metadata, not decide what a customer means to the business. Keeping the rule in the business vault protects the raw evidence and lets marts use a reviewed definition."
        />
      </Section>

      <Section title="Make snapshots explicit">
        <Pair
          before="no_snapshot_control"
          after={{ title: 'control_snap_v1 + customer_pit', code: `${MODEL.control_snap_v1.code}\n\n${MODEL.customer_pit.code}` }}
          why={<>A <Term id="snapshot-control">snapshot control</Term> defines which observation times matter, and a <Term id="pit">PIT</Term> stores pointers to the satellite versions valid at those times. dbt metadata makes the tracked entity and satellite set visible instead of hiding them in join text.</>}
        />
      </Section>
    </Chapter>
  )
}
