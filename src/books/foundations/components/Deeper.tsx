import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'

/** "Go deeper": optional detail for technical readers, collapsed so the core page stays short. */
export function Deeper({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group mx-auto my-6 max-w-[40rem] rounded-xl border bg-muted/30 px-4 py-2">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 font-sans text-sm font-medium">
        <ChevronRight aria-hidden className="size-4 transition-transform group-open:rotate-90 motion-reduce:transition-none" />
        Go deeper: {title}
      </summary>
      <div className="pb-2 text-[15px] leading-7 [&_p]:mt-2">{children}</div>
    </details>
  )
}
