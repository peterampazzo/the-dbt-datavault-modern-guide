import { lazy } from 'react'
import type { ChapterQuiz } from '@/lib/book'

export type Audience = 'core' | 'deeper'

type ChapterDefinition = {
  slug: string
  title: string
  short: string
  minutes: number
  part: 1 | 2 | 3
  audience: Audience
  summary: [string, string, string]
  recap: [string, string, string]
  quiz: [ChapterQuiz, ChapterQuiz, ...ChapterQuiz[]]
  Component: ReturnType<typeof lazy>
}

export const PARTS = [
  { n: 1, title: 'Start here' },
  { n: 2, title: 'The terminal' },
  { n: 3, title: 'Git' },
] as const

export const CHAPTERS = [
  {
    slug: 'share-your-project',
    title: 'Share your project',
    short: 'Share',
    minutes: 12,
    part: 1,
    audience: 'core',
    summary: [
      'Code goes in a git repository, private if you like, not in Drive, Dropbox or an email.',
      'Before sharing, sort the folder: code in git, data in a data store, output rebuilt, secrets never shared.',
      'A README, a first snapshot and git push give your team the whole project and its history.',
    ],
    recap: [
      'A private GitHub repository is visible only to the people you invite.',
      '.gitignore keeps .env, raw data and output out; check git status before the first commit.',
      'git remote add connects the folder to GitHub; git push sends the snapshots.',
    ],
    quiz: [
      {
        q: 'Your team shares code through a Dropbox folder. What is the main problem?',
        options: ['Nobody can see who changed what, or why', 'Dropbox cannot store .py files', 'Dropbox makes the code public'],
        answer: 0,
        why: 'Sync tools copy files. Git records every change with an author and a note, and shows the exact lines.',
      },
      {
        q: 'Does putting code on GitHub make it public?',
        options: ['No: each repository is public or private, and private ones are visible only to people you invite', 'Yes, always', 'Only for students'],
        answer: 0,
        why: 'Visibility is a setting per repository.',
      },
      {
        q: 'git status lists .env right before your first commit. What do you do?',
        options: ['Add .env to .gitignore before committing', 'Commit it, the repository is private', 'Rename it to env.txt'],
        answer: 0,
        why: 'Private repositories get shared, forked and cloned. Keys stay on your machine.',
      },
    ],
    Component: lazy(() => import('./ShareYourProject')),
  },
  {
    slug: 'where-am-i',
    title: 'Where am I?',
    short: 'Terminal',
    minutes: 10,
    part: 2,
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
  {
    slug: 'running-a-program',
    title: 'Running a program',
    short: 'Programs',
    minutes: 10,
    part: 2,
    audience: 'core',
    summary: [
      'Pressing Enter splits the line, finds the program on PATH, runs it in your folder and gets back an exit code.',
      'An exit code of 0 means it worked; anything else means it failed, and && stops at the first failure.',
      'When an AI tool asks “Run this command?”, it is asking to start a program on your machine with your permissions.',
    ],
    recap: [
      'which shows which program a name starts; command not found means no match on PATH.',
      'echo $? prints the last exit code: 0 is success, anything else is a failure.',
      'Approve commands that read or test; look closer at ones that delete, or download and run something.',
    ],
    quiz: [
      {
        q: 'A command prints a lot of text, then echo $? shows 1. Did it work?',
        options: ['No: any exit code other than 0 is a failure', 'Yes: it printed output', 'You cannot tell from the exit code'],
        answer: 0,
        why: 'The exit code is the verdict. 0 means success, whatever the output looks like.',
      },
      {
        q: 'What does python3 nope.py && echo done print if nope.py does not exist?',
        options: ['Only the Python error', 'The error, then done', 'Only done'],
        answer: 0,
        why: 'python3 exits with 2, so && skips echo done.',
      },
      {
        q: 'An AI tool asks to run rm -rf build. What do you do first?',
        options: ['Check what is in build and whether you can get it back', 'Approve it, it is only cleaning up', 'Choose always allow for rm'],
        answer: 0,
        why: 'rm -rf deletes with no undo. Make sure the folder is what you think and that a copy exists.',
      },
    ],
    Component: lazy(() => import('./RunningAProgram')),
  },
  {
    slug: 'snapshots',
    title: 'Snapshots',
    short: 'Snapshots',
    minutes: 12,
    part: 3,
    audience: 'core',
    summary: [
      'Git keeps every snapshot of a folder’s text files: Python and R code, settings, even editor settings, so you can see what changed and go back.',
      'git add chooses what goes in the next snapshot, git commit saves it, and git diff shows the exact lines an AI tool changed.',
      'Editor settings in the repository give every colleague and every machine the same setup; secrets stay out, in .env.',
    ],
    recap: [
      'git status says what changed and what to type next. Run it whenever you are unsure.',
      'Commit before you let a tool loose, then read its git diff: if you can’t explain a line, don’t commit it.',
      '.vscode/ and .env.example go in the repository; .env with the real key goes in .gitignore.',
    ],
    quiz: [
      {
        q: 'Which of these can git version and show line by line?',
        options: ['report.R, a settings file and .vscode/settings.json', 'Only Python code', 'Only files stored on GitHub'],
        answer: 0,
        why: 'Git works with any text file. Binary files such as spreadsheets can be saved too, but without line-by-line changes.',
      },
      {
        q: 'Your AI tool says it changed 2 files. Which command shows the exact lines?',
        options: ['git diff', 'git log', 'git commit'],
        answer: 0,
        why: 'git status lists the files; git diff shows the removed (-) and added (+) lines.',
      },
      {
        q: 'Where does the real API key for the report go?',
        options: ['In .env, which is listed in .gitignore', 'In .vscode/settings.json, so everyone has it', 'In the commit message'],
        answer: 0,
        why: 'Secrets stay on each machine. The repository gets .env.example, with the names and no values.',
      },
    ],
    Component: lazy(() => import('./Snapshots')),
  },
] as const satisfies readonly ChapterDefinition[]
