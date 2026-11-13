import { ArrowRight, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/lib/theme'

type ShelfBook = { title: string; summary: string; href?: string }

const SHELF: ShelfBook[] = [
  {
    title: 'Data Vault, modelled and built with dbt',
    summary: 'Model three small datasets (customers, nations and orders) as a Data Vault, then build and load it with dbt and datavault4dbt.',
    href: '#/datavault',
  },
  {
    title: 'Foundations: shipping code in the age of AI tools',
    summary: 'What tools like Claude Code, Codex and Lovable do under the hood, and how to handle the code they write: the terminal, git, reproducible setup, CI and troubleshooting.',
  },
]

export function Shelf() {
  const [dark, setDark] = useTheme()
  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-[90rem] items-center gap-3 px-4">
          <span className="font-semibold">Build it right</span>
          <Button variant="ghost" size="icon" className="ml-auto" aria-label="Toggle theme" onClick={() => setDark(!dark)}>
            {dark ? <Sun /> : <Moon />}
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-[40rem] px-4 py-10">
        <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight md:text-6xl">Build it right</h1>
        <p className="mt-6 font-serif text-lg leading-7 text-foreground/90">
          Short, hands-on books about building data and software properly. Each book stands on its own and runs in the browser, with nothing to install.
        </p>
        <h2 className="mt-12 mb-4 font-serif text-2xl font-semibold tracking-tight">Books</h2>
        <ul className="space-y-6">
          {SHELF.map((book) => (
            <li key={book.title} className="rounded-lg border p-5">
              <h3 className="font-semibold">{book.title}</h3>
              <p className="mt-2 font-serif text-lg leading-7 text-foreground/90">{book.summary}</p>
              {book.href ? (
                <a
                  href={book.href}
                  aria-label={`Open the book: ${book.title}`}
                  className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-sky-700 hover:underline dark:text-sky-400"
                >
                  Open the book <ArrowRight aria-hidden className="size-4" />
                </a>
              ) : (
                <p className="mt-3 text-sm font-medium text-muted-foreground">Coming soon</p>
              )}
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
