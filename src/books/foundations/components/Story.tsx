import type { ReactNode } from 'react'
import { BookOpen } from 'lucide-react'

const COURSES = {
  '02806': { name: 'Social Data Analysis and Visualization', repo: 'https://github.com/peterampazzo/dtu-02806' },
  '02476': { name: 'Machine Learning Operations', repo: 'https://github.com/peterampazzo/dtu-02476' },
} as const

/** A real moment from Pietro's DTU group projects that opens a page, before any terminal or term. */
export function Story({ course, children }: { course: keyof typeof COURSES; children: ReactNode }) {
  const { name, repo } = COURSES[course]
  return (
    <aside aria-label={`From DTU ${course}`} className="mb-5 max-w-3xl rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
      <div className="mb-1 flex flex-wrap items-center gap-x-2 font-sans text-sm font-semibold text-amber-900 dark:text-amber-200">
        <BookOpen aria-hidden className="size-4" />
        <a href={repo} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">
          DTU {course}
        </a>
        <span className="font-normal text-amber-900/80 dark:text-amber-200/80">{name}</span>
      </div>
      <div className="text-[15px] leading-7">{children}</div>
    </aside>
  )
}
