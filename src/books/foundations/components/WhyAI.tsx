import type { ReactNode } from 'react'
import { Sparkles } from 'lucide-react'

/** The link from a page's idea to what AI coding tools do with it. */
export function WhyAI({ children }: { children: ReactNode }) {
  return (
    <aside aria-label="Why it matters with AI tools" className="mx-auto my-6 max-w-[40rem] rounded-xl border border-violet-500/30 bg-violet-500/5 p-4">
      <div className="mb-1 flex items-center gap-2 font-sans text-sm font-semibold text-violet-800 dark:text-violet-300">
        <Sparkles aria-hidden className="size-4" /> Why it matters with AI tools
      </div>
      <div className="text-[15px] leading-7">{children}</div>
    </aside>
  )
}
