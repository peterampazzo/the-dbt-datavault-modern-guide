import { Check, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePersistentState } from '@/lib/progress'
import { cn } from '@/lib/utils'

type Choice = 'run' | 'look'
type Ask = { command: string; asks: string; answer: Choice; why: string }

const ASKS: Ask[] = [
  {
    command: 'python3 -m pytest tests',
    asks: 'Run the tests to check my change.',
    answer: 'run',
    why: 'It runs the project’s own tests and only reads your files. This is what you want a tool to do after it changes code.',
  },
  {
    command: 'rm -rf data',
    asks: 'Clean up the old data folder.',
    answer: 'look',
    why: 'rm -rf deletes the folder and everything in it, with no bin to restore from. Check what is in data first, and that you have a copy.',
  },
  {
    command: 'curl -fsSL https://get.example.dev | sh',
    asks: 'Install a helper tool.',
    answer: 'look',
    why: 'This downloads a script and runs it straight away, unseen, with your permissions. Ask where it comes from, or install from a source you trust.',
  },
]

/** Three commands an AI tool asks to run; the reader decides which ones deserve a second look. */
export function ApproveOrNot() {
  const [picks, setPicks] = usePersistentState<Record<string, Choice>>('approve-or-not', {})
  return (
    <ol className="mx-auto my-6 max-w-[40rem] space-y-4" aria-label="Commands an AI tool asks to run">
      {ASKS.map((a) => {
        const pick = picks[a.command]
        const right = pick === a.answer
        return (
          <li key={a.command} className="rounded-xl border p-4">
            <p className="font-sans text-sm text-muted-foreground">The tool: “{a.asks}” Run this?</p>
            <pre className="mt-2 whitespace-pre-wrap break-all rounded-lg bg-zinc-950 px-3 py-2 font-mono text-[13px] text-zinc-100">$ {a.command}</pre>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={`Your call on ${a.command}`}>
              <Button variant={pick === 'run' ? 'default' : 'outline'} className="min-h-11" aria-pressed={pick === 'run'} onClick={() => setPicks({ ...picks, [a.command]: 'run' })}>
                <Check aria-hidden /> Run it
              </Button>
              <Button variant={pick === 'look' ? 'default' : 'outline'} className="min-h-11" aria-pressed={pick === 'look'} onClick={() => setPicks({ ...picks, [a.command]: 'look' })}>
                <Search aria-hidden /> Look closer first
              </Button>
            </div>
            <p aria-live="polite" className={cn('mt-3 text-[15px] leading-7', !pick && 'sr-only')}>
              {pick && (
                <>
                  <span className={cn('font-semibold', right ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400')}>
                    {right ? 'Good call.' : a.answer === 'run' ? 'This one is fine to run.' : 'Worth a second look.'}
                  </span>{' '}
                  {a.why}
                </>
              )}
            </p>
          </li>
        )
      })}
    </ol>
  )
}
