import { describe, expect, it } from 'vitest'
import { PROJECT } from './fs'
import { aiChange, committedShell, createShell, run, FS, type ShellState } from './shell'
import { diffLines, ignored, view } from './git'

const go = (state: ShellState, ...lines: string[]) => lines.reduce(run, state)
const out = (state: ShellState) => state.entries[state.entries.length - 1].output
const status = (state: ShellState) => state.entries[state.entries.length - 1].status

describe('practice git', () => {
  it('requires git init before commands in an uninitialized project', () => {
    const start = { ...createShell(PROJECT), git: { index: {}, commits: [], uninitialized: true } }
    const s = go(start, 'git status', 'git init', 'git status')
    expect(s.entries[0].output).toBe('fatal: not a git repository (or any of the parent directories): .git')
    expect(s.entries[0].status).toBe(128)
    expect(s.entries[1].output).toBe(`Initialized empty Git repository in ${PROJECT}/.git/`)
    expect(s.entries[2].output).toContain('No commits yet')
    expect(s.git?.uninitialized).toBe(false)
  })

  it('connects to a remote and pushes the first commit once', () => {
    const remote = 'https://github.com/your-team/orders-report.git'
    const s = go(
      createShell(PROJECT),
      'git init',
      'git push',
      `git remote add origin ${remote}`,
      `git remote add origin ${remote}`,
      'git remote -v',
      'git push',
      'git add .',
      'git commit -m "First working version"',
      'git push -u origin main',
      'git push',
    )
    expect(s.entries[1].output).toMatch(/^fatal: No configured push destination\.\nEither specify the URL/)
    expect(s.entries[1].status).toBe(128)
    expect(s.entries[2].output).toBe('')
    expect(s.entries[3].output).toBe('error: remote origin already exists.')
    expect(s.entries[3].status).toBe(3)
    expect(s.entries[4].output).toBe(`${remote}\t(origin) (fetch)\n${remote}\t(origin) (push)`)
    expect(s.entries[5].output).toBe(`error: src refspec main does not match any\nerror: failed to push some refs to '${remote}'`)
    expect(s.entries[5].status).toBe(1)
    expect(s.entries[8].output).toContain(`To ${remote}\n * [new branch]      main -> main\nbranch 'main' set up to track 'origin/main'.`)
    expect(s.entries[9].output).toBe('Everything up-to-date')
    expect(s.git?.pushed).toBe(s.git?.commits.at(-1)?.id)
  })

  it('matches multi-segment ignore rules against file paths', () => {
    const work = { '.gitignore': '.env\ndata/raw/\noutput/\n' }
    expect(ignored(work, '.env')).toBe(true)
    expect(ignored(work, 'data/raw/orders_full_export.csv')).toBe(true)
    expect(ignored(work, 'output/report.csv')).toBe(true)
    expect(ignored(work, 'data/orders.csv')).toBe(false)
  })

  it('starts with untracked files, hides ignored ones, and collapses new folders', () => {
    const s = go(createShell(PROJECT), 'git status')
    expect(out(s)).toContain('No commits yet')
    expect(out(s)).toContain('\tdata/')
    expect(out(s)).toContain('\t.vscode/')
    expect(out(s)).not.toContain('.env\n')
    expect(out(s)).toMatch(/nothing added to commit but untracked files present/)
  })

  it('stages, commits and logs a snapshot', () => {
    const s = go(createShell(PROJECT), 'git add .', 'git status', 'git commit -m "Add the orders report"', 'git status', 'git log --oneline')
    expect(s.entries[1].output).toContain('new file:   report.py')
    expect(s.entries[2].output).toMatch(/^\[main \(root-commit\) [0-9a-f]{7}\] Add the orders report\n 11 files changed/)
    expect(s.entries[3].output).toBe('On branch main\nnothing to commit, working tree clean')
    expect(out(s)).toMatch(/^[0-9a-f]{7} \(HEAD -> main\) Add the orders report$/)
    expect(Object.keys(s.git!.index)).not.toContain('.env')
  })

  it('refuses ignored files unless forced, and unknown paths', () => {
    const s = go(createShell(PROJECT), 'git add .env')
    expect(out(s)).toMatch(/ignored by one of your .gitignore files:\n.env\nhint: Use -f/)
    expect(status(s)).toBe(1)
    expect(status(go(s, 'git add nope.txt'))).toBe(128)
    expect(Object.keys(go(s, 'git add -f .env').git!.index)).toEqual(['.env'])
  })

  it('needs a message and something staged to commit', () => {
    expect(out(go(createShell(PROJECT), 'git add README.md', 'git commit'))).toContain('git commit -m')
    const clean = go(committedShell(PROJECT), 'git commit -m "again"')
    expect(out(clean)).toContain('nothing to commit, working tree clean')
    expect(status(clean)).toBe(1)
  })

  it('shows what the AI tool changed, including the line nobody asked for', () => {
    const before = go(committedShell(PROJECT), 'python3 report.py')
    const s = go(aiChange(before), 'git status', 'git diff report.py', 'python3 report.py')
    expect(s.entries[2].output).toContain('modified:   README.md')
    expect(s.entries[2].output).toContain('modified:   report.py')
    expect(s.entries[2].output).toContain('no changes added to commit')
    const diff = s.entries[3].output
    expect(diff).toContain('-    totals[nation] = (count + 1, revenue + float(order["o_totalprice"]))')
    expect(diff).toContain('+    totals[nation] = (count + 1, revenue + round(float(order["o_totalprice"])))')
    expect(diff).toContain('+print("Orders and revenue per nation")')
    expect(diff).not.toContain('README')
    expect(out(s).split('\n')[0]).toBe('Orders and revenue per nation')
    expect(out(s)).not.toBe(before.entries[0].output)
  })

  it('commits the AI change with -am and counts the lines', () => {
    const s = go(aiChange(committedShell(PROJECT)), 'git commit -am "Add a title"', 'git log')
    expect(s.entries[1].output).toMatch(/ 2 files changed, 3 insertions\(\+\), 2 deletions\(-\)$/)
    expect(out(s)).toMatch(/^commit [0-9a-f]{40} \(HEAD -> main\)\nAuthor: Student/)
    expect(view(s.fs!, s.git!).unstaged).toEqual([])
  })

  it('only works inside the project, and says where later commands are taught', () => {
    expect(out(go(createShell('/home/student'), 'git status'))).toMatch(/^fatal: not a git repository/)
    expect(out(go(createShell(PROJECT), 'git switch -c draft'))).toContain('module 5')
    expect(out(go(createShell(PROJECT), 'git restore report.py'))).toContain('module 6')
  })

  it('hides dot files from ls unless -a', () => {
    expect(out(go(createShell(PROJECT), 'ls'))).toBe('data  README.md  report.py  report.R  tests')
    expect(out(go(createShell(PROJECT), 'ls -a'))).toBe('.  ..  .env  .env.example  .gitignore  .vscode  data  README.md  report.py  report.R  tests')
    expect(view(FS, committedShell(PROJECT).git!).untracked).toEqual([])
  })

  it('diffs lines by longest common subsequence', () => {
    expect(diffLines('a\nb\nc\n', 'a\nx\nc\n').map((o) => o.kind + o.line)).toEqual([' a', '-b', '+x', ' c'])
  })
  it('treats . at the top of the project as every file in git diff', () => {
    const s = go(aiChange(committedShell(PROJECT)), 'git diff .', 'git add .', 'git diff --staged .')
    expect(s.entries[1].output).toContain('diff --git a/report.py b/report.py')
    expect(s.entries[1].output).toContain('diff --git a/README.md b/README.md')
    expect(s.entries[3].output).toContain('diff --git a/report.py b/report.py')
  })
  it('stages the whole repository with git add -A from a subfolder, and only the named path when one is given', () => {
    const s = go(aiChange(createShell(`${PROJECT}/data`)), 'git add -A', 'git status')
    expect(s.entries[2].output).toContain('new file:   ../report.py')
    expect(s.entries[2].output).toContain('new file:   ../.vscode/settings.json')
    const named = go(aiChange(committedShell(PROJECT)), 'git add -A README.md', 'git status')
    expect(named.entries[2].output).toMatch(/Changes to be committed:[\s\S]*modified:   README.md[\s\S]*Changes not staged[\s\S]*modified:   report.py/)
  })
})
