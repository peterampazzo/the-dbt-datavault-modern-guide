import { useState } from 'react'
import type { ChapterQuiz } from '@/chapters'
import { Button } from '@/components/ui/button'

export function QuickCheck({ questions }: { questions: readonly ChapterQuiz[] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [checked, setChecked] = useState<Record<number, boolean>>({})

  return (
    <section aria-labelledby="quick-check-heading" className="mt-8 max-w-3xl space-y-6">
      <h2 id="quick-check-heading" className="text-xl font-semibold">
        Quick check (optional)
      </h2>
      {questions.map((question, i) => {
        const isChecked = checked[i]
        const isCorrect = answers[i] === question.answer
        return (
          <fieldset key={question.q} className="rounded-xl border bg-card/40 p-4">
            <legend className="px-1 font-medium">{question.q}</legend>
            <div className="mt-2 space-y-2">
              {question.options.map((option, j) => (
                <label key={option} className="flex cursor-pointer items-start gap-2 text-sm leading-6">
                  <input
                    type="radio"
                    name={`quick-check-${i}`}
                    value={j}
                    checked={answers[i] === j}
                    onChange={() => {
                      setAnswers((previous) => ({ ...previous, [i]: j }))
                      setChecked((previous) => ({ ...previous, [i]: false }))
                    }}
                    className="mt-1 accent-sky-600"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            <Button
              className="mt-3"
              size="sm"
              variant="outline"
              onClick={() => setChecked((previous) => ({ ...previous, [i]: true }))}
              disabled={answers[i] === undefined}
            >
              Check
            </Button>
            {isChecked && (
              <output aria-live="polite" className={`mt-3 block text-sm leading-6 ${isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-800 dark:text-amber-300'}`}>
                {isCorrect ? 'Correct.' : 'Not quite.'} {question.why}
              </output>
            )}
          </fieldset>
        )
      })}
    </section>
  )
}
