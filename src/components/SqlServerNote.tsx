import type { ReactNode } from 'react'

export function SqlServerNote({ children }: { children: ReactNode }) {
  return (
    <aside aria-label="In SQL Server you'd" className="my-5 max-w-3xl rounded-xl border border-sky-600 bg-sky-500/5 px-4 py-3">
      <p className="font-serif text-lg leading-7 text-foreground/90">
        <strong>In SQL Server you’d…</strong> {children}
      </p>
    </aside>
  )
}
