import { lazy } from 'react'
import type { ChapterQuiz } from '@/lib/book'

export type Audience = 'core' | 'deeper'

type ChapterDefinition = {
  slug: string
  title: string
  short: string
  minutes: number
  part: 1
  audience: Audience
  summary: [string, string, string]
  recap: [string, string, string]
  quiz: [ChapterQuiz, ChapterQuiz, ...ChapterQuiz[]]
  Component: ReturnType<typeof lazy>
}

export const PARTS = [{ n: 1, title: 'The terminal' }] as const

export const CHAPTERS = [
  {
    slug: 'where-am-i',
    title: 'Where am I?',
    short: 'Terminal',
    minutes: 10,
    part: 1,
    audience: 'core',
    summary: [
      'The terminal is a window where you type a command and press Enter; the computer runs it and prints the answer.',
      'Every command runs inside one folder, the working directory, shown in the prompt.',
      'AI coding tools work the same way: they run commands inside a folder on a computer.',
    ],
    recap: [
      'The prompt and pwd tell you where you are in the tree.',
      'A command is a name, then options, then arguments.',
      'No such file or directory usually means a wrong folder or a wrong case: check with pwd and ls.',
    ],
    quiz: [
      {
        q: 'You are in /home/student/orders-report/data. What does cd .. do?',
        options: ['It goes up to /home/student/orders-report', 'It goes to your home folder', 'It deletes the data folder'],
        answer: 0,
        why: '.. is the folder one level up from where you are.',
      },
      {
        q: 'In ls -l data, what is -l?',
        options: ['The command', 'An option', 'The folder to list'],
        answer: 1,
        why: 'Options start with a dash and change how the command behaves; data is the argument.',
      },
      {
        q: 'An AI tool says python3 report.py failed because the file does not exist, but you can see it in the project. What do you check first?',
        options: ['Which folder the command ran in', 'Whether Python needs reinstalling', 'Whether the file needs renaming'],
        answer: 0,
        why: 'The file usually exists, just in another folder. pwd shows where the command looked from.',
      },
    ],
    Component: lazy(() => import('./WhereAmI')),
  },
] as const satisfies readonly ChapterDefinition[]
