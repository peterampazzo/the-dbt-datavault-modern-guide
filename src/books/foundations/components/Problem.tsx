import type { ReactNode } from 'react'
import { CircleHelp } from 'lucide-react'

export function Problem({ children }: { children: ReactNode }) {
  return (
    <aside aria-label="The problem" className="mb-5 max-w-3xl rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
      <div className="mb-1 flex items-center gap-2 font-sans text-sm font-semibold text-amber-900 dark:text-amber-200">
        <CircleHelp aria-hidden className="size-4" />
        The problem
      </div>
      <div className="text-[15px] leading-7">{children}</div>
    </aside>
  )
}
