import type { ReactNode } from 'react'
import { Popover } from '@base-ui/react/popover'
import { Link } from 'react-router'
import { CHAPTERS } from '@/chapters'
import { GLOSSARY, type GlossaryId } from '@/lib/glossary'

export function Term({ id, children }: { id: GlossaryId; children?: ReactNode }) {
  const entry = GLOSSARY.find((item) => item.id === id)!
  const chapter = CHAPTERS.find((item) => item.slug === entry.chapter)!

  return (
    <Popover.Root>
      <Popover.Trigger
        type="button"
        className="inline-flex min-h-6 items-center cursor-help rounded-sm bg-transparent p-0 text-inherit underline decoration-dotted underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {children ?? entry.term}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} className="z-50 outline-none">
          <Popover.Popup className="w-[min(22rem,calc(100vw-2rem))] rounded-xl border bg-popover p-4 text-popover-foreground shadow-lg">
            <Popover.Title className="font-semibold">{entry.term}</Popover.Title>
            <Popover.Description className="mt-2 text-sm leading-6 text-muted-foreground">
              {entry.definition}
            </Popover.Description>
            {entry.aka && <p className="mt-2 text-sm">Also called: {entry.aka}</p>}
            {entry.sqlServerName && <p className="mt-2 text-sm">SQL Server name: {entry.sqlServerName}</p>}
            <Link to={`/${chapter.slug}`} className="mt-3 inline-flex min-h-6 items-center font-medium text-sky-700 underline underline-offset-4 dark:text-sky-400">
              Read more in {chapter.title}
            </Link>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
