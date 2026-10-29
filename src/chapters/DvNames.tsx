import { Link } from 'react-router'
import { Chapter } from '@/components/Chapter'
import { ChapterHeader, P, Section } from '@/components/Prose'
import { Term } from '@/components/Term'
import type { GlossaryId } from '@/lib/glossary'

const TERM_IDS: Record<string, GlossaryId> = {
  'Hub / _h': 'hub',
  'Link / _l': 'link',
  'Non-historised link / _nh_l': 'non-historized-link',
  PIT: 'pit',
  'Snapshot control': 'snapshot-control',
  Hashkey: 'hashkey',
  Hashdiff: 'hashdiff',
  'Load date / timestamp': 'ldts',
  'Record source': 'rsrc',
  'Ghost records': 'ghost-record',
}

const rows = [
  ['Hub / _h', 'customer_h, nation_h, order_h', '/what-is-data-vault/the-three-building-blocks', 'What is Data Vault › The three building blocks'],
  ['Link / _l', 'customer_nation_l', '/what-is-data-vault/the-three-building-blocks', 'What is Data Vault › The three building blocks'],
  ['Non-historised link / _nh_l', 'order_customer_nh_l; the payload stays on the link', '/dbt/from-canvas-to-code', 'Building it with dbt › From canvas to code'],
  ['Standard satellite / _s', 'customer_n_s and nation_n_s use sat_v0; customer_n_s_v1 uses sat_v1', '/satellite-flavours/compare-satellite-flavours', 'Satellite flavours › Compare satellite flavours'],
  ['Effectivity satellite', 'customer_nation_es uses eff_sat_v0 to track link activity', '/satellite-flavours/effectivity-satellites', 'Satellite flavours › Effectivity satellites'],
  ['Multi-active satellite', 'customer_phone_ma_s uses ma_sat_v0 and phone_type as its multi-active key', '/satellite-flavours/multi-active-satellites', 'Satellite flavours › Multi-active satellites'],
  ['Record-tracking satellite', 'customer_rts uses rec_track_sat; it records load/source observations', '/satellite-flavours/record-tracking-satellites', 'Satellite flavours › Record-tracking satellites'],
  ['PIT', 'customer_pit', '/pit/the-models', 'Business vault: snapshots and PITs › The models'],
  ['Snapshot control', 'control_snap_v0 and control_snap_v1', '/pit/the-models', 'Business vault: snapshots and PITs › The models'],
  ['Hashkey', 'hk_customer_h, hk_nation_h, hk_customer_nation_l', '/hash-lab/build-a-hash-step-by-step', 'Hash lab › Build a hash, step by step'],
  ['Hashdiff', 'hd_customer_n_s and hd_customer_phone_ma_s', '/hash-lab/hashdiff-did-anything-change', 'Hash lab › Hashdiff: did anything change?'],
  ['Load date / timestamp', 'ldts', '/dbt/from-canvas-to-code', 'Building it with dbt › From canvas to code'],
  ['Record source', 'rsrc', '/dbt/from-canvas-to-code', 'Building it with dbt › From canvas to code'],
  ['Ghost records', 'Unknown and error rows use the zero and ff keys', '/hash-lab/ghost-keys-and-why-we-hash', 'Hash lab › Ghost keys and why we hash'],
  ['Insert-only loading', 'Existing hub and link keys are skipped; old raw-vault rows are not updated', '/load-player/the-rules-you-just-watched', 'Loading, batch by batch › The rules you just watched'],
] as const

export default function DvNames() {
  return (
    <Chapter>
      <ChapterHeader
        title="Data Vault terms in dbt"
        lead="Familiar Data Vault terms map to specific model names and dbt concepts."
      />
      <Section
        title="The names we use"
        lead="Model and macro names show how familiar Data Vault objects appear in dbt. Use the table to map the terms."
        keyPoint="Model suffixes identify the object; datavault4dbt macro names identify how each model is generated."
      >
        <P>
          <Term id="satellite">Satellite</Term> names end in <code>_s</code>; the part before the suffix names the parent hub or link and, for variants,
          the kind (<code>_ma_s</code> <Term id="multi-active-satellite">multi-active</Term>, <code>_es</code> <Term id="effectivity-satellite">effectivity</Term>, <code>_rts</code> <Term id="record-tracking">record tracking</Term>).
          The datavault4dbt macro behind each is listed in the table.
        </P>
        <P>
          New to dbt? Start with the <Link to="/dbt-primer" className="text-sky-700 underline underline-offset-2 dark:text-sky-400">dbt primer</Link>.
        </P>
        <div className="max-w-full overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
            <thead className="bg-muted/60">
              <tr>
                <th scope="col" className="px-3 py-1.5 font-semibold">You may call it</th>
                <th scope="col" className="px-3 py-1.5 font-semibold">Term used here</th>
                <th scope="col" className="px-3 py-1.5 font-semibold">Where it's taught</th>
              </tr>
            </thead>
            <tbody>
          {rows.map(([term, name, path, pageTitle]) => (
                <tr key={term} className="border-t align-top">
                  <th scope="row" className="px-3 py-1.5 font-medium">{TERM_IDS[term] ? <Term id={TERM_IDS[term]}>{term}</Term> : term}</th>
                  <td className="px-3 py-1.5 font-mono text-xs leading-5">{name}</td>
                  <td className="px-3 py-1.5">
                    <Link to={path} className="text-sky-700 underline underline-offset-2 dark:text-sky-400">
                      {pageTitle}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </Chapter>
  )
}
