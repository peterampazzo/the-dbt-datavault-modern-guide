import type { Book } from '@/lib/book'
import { cn } from '@/lib/utils'
import { CHAPTERS, PARTS } from './chapters'
import { GLOSSARY } from './lib/glossary'

const PRACTITIONER_PATH = ['dv-names', 'dbt-primer', 'dbt', 'load-player', 'replay', 'one-lake', 'modern-way', 'scheduling', 'from-sql-server', 'hash-parity', 'business-vault', 'migration-checklist']

export const DATAVAULT: Book = {
  slug: 'datavault',
  title: 'The dbt + Data Vault guide',
  repoUrl: 'https://github.com/peterampazzo/the-dbt-datavault-modern-guide',
  chapters: CHAPTERS,
  parts: PARTS,
  audience: {
    essential: 'Essential',
    'skim-if-dv': 'Skim if you know Data Vault',
    practitioner: 'For Data Vault practitioners',
  },
  glossary: GLOSSARY,
  progressKey: 'dv-guide-progress',
  pathOrder: (path) => (path === 'dv-practitioner' ? PRACTITIONER_PATH : CHAPTERS.map((chapter) => chapter.slug)),
  hasAbout: true,
  legend: (
    <div className="mt-8 space-y-1.5 px-2 text-xs text-muted-foreground">
      <div className="font-medium">Legend</div>
      {[
        ['bg-sky-500', 'Hub', '_h'],
        ['bg-emerald-500', 'Link', '_l'],
        ['bg-amber-500', 'Satellite', '_s'],
        ['bg-violet-500', 'Business vault', '_pit, _sn'],
      ].map(([c, l, suffix]) => (
        <div key={l} className="flex items-center gap-2">
          <span className={cn('size-2.5 rounded-sm', c)} /> {l}
          <span className="font-mono text-[10px] text-muted-foreground/80">{suffix}</span>
        </div>
      ))}
    </div>
  ),
}
