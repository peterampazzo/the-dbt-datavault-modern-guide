import { Button } from '@/components/ui/button'
import { usePersistentState } from '@/lib/progress'
import { cn } from '@/lib/utils'

type Choice = 'Git' | 'Data store' | 'Rebuild or delete' | 'Never share'
type Item = { file: string; answer: Choice; why: string }

const CHOICES: Choice[] = ['Git', 'Data store', 'Rebuild or delete', 'Never share']
const ITEMS: Item[] = [
  { file: 'report.py', answer: 'Git', why: 'Code belongs in the repository so everyone can review and version it.' },
  { file: 'report.R', answer: 'Git', why: 'Code belongs in the repository so everyone can review and version it.' },
  { file: 'config.py (with the key)', answer: 'Never share', why: 'The key moves to .env, which stays on your laptop; the code reads it from there.' },
  { file: 'data/raw/orders_full_export.csv', answer: 'Data store', why: 'It is big and it changes; share it in a shared drive or bucket and write down where it is.' },
  { file: 'output/', answer: 'Rebuild or delete', why: 'Anyone can make it again by running the report.' },
  { file: '__pycache__/', answer: 'Rebuild or delete', why: 'Python makes it by itself.' },
  { file: 'report_old.py', answer: 'Rebuild or delete', why: 'Git keeps old versions for you.' },
]

/** Sort generated, source and secret files into the right place before sharing. */
export function SortFolder() {
  const [picks, setPicks] = usePersistentState<Record<string, Choice>>('sort-folder', {})
  return (
    <ol className="mx-auto my-6 max-w-[48rem] space-y-3" aria-label="Sort the project files">
      {ITEMS.map((item) => {
        const pick = picks[item.file]
        const right = pick === item.answer
        return (
          <li key={item.file} className="rounded-xl border bg-card/50 p-4">
            <h3 className="mb-3 font-mono text-sm font-semibold">{item.file}</h3>
            <div className="flex flex-wrap gap-2" role="group" aria-label={`Where should ${item.file} go?`}>
              {CHOICES.map((choice) => (
                <Button
                  key={choice}
                  variant={pick === choice ? 'default' : 'outline'}
                  className="min-h-11"
                  aria-pressed={pick === choice}
                  onClick={() => setPicks({ ...picks, [item.file]: choice })}
                >
                  {choice}
                </Button>
              ))}
            </div>
            <p aria-live="polite" className={cn('mt-2 text-sm leading-6', !pick && 'sr-only')}>
              {pick && (
                <>
                  <span className={cn('font-semibold', right ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400')}>
                    {right ? 'Good call.' : 'Not quite.'}
                  </span>{' '}
                  {item.why}
                </>
              )}
            </p>
          </li>
        )
      })}
    </ol>
  )
}
