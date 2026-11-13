import type { Book } from '@/lib/book'
import { CHAPTERS, PARTS } from './chapters'

export const FOUNDATIONS: Book = {
  slug: 'foundations',
  title: 'Foundations',
  repoUrl: 'https://github.com/peterampazzo/the-dbt-datavault-modern-guide',
  chapters: CHAPTERS,
  parts: PARTS,
  audience: { core: 'Core: for everyone', deeper: 'Go deeper: for technical readers' },
  glossary: [],
  progressKey: 'foundations-progress',
  hasAbout: false,
}
