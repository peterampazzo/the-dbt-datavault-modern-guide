import { PROJECT, README, REPORT_PY, lookup, resolve, split, type FsNode } from './fs'

/** Files by path inside the project, e.g. `report.py` or `data/orders.csv`. */
export type Files = Record<string, string>
export type Commit = { id: string; message: string; files: Files }
export type GitState = { index: Files; commits: Commit[] }

export type GitResult = { output: string; status: number; git?: GitState }

export const EMPTY_GIT: GitState = { index: {}, commits: [] }

export function files(root: FsNode): Files {
  const out: Files = {}
  const walk = (node: FsNode, at: string) => {
    if (node.kind === 'file') out[at] = node.content
    else for (const [name, child] of Object.entries(node.children)) walk(child, at ? `${at}/${name}` : name)
  }
  const project = lookup(root, PROJECT)
  if (project) walk(project, '')
  return out
}

function ignoreRules(work: Files) {
  return (work['.gitignore'] ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => l.replace(/\/$/, ''))
}

export function ignored(work: Files, path: string) {
  const rules = ignoreRules(work)
  return split(path).some((part) => rules.includes(part))
}

const head = (git: GitState): Files => git.commits.at(-1)?.files ?? {}

const changes = (from: Files, to: Files) => [...new Set([...Object.keys(from), ...Object.keys(to)])].sort().filter((f) => from[f] !== to[f])

export type GitView = {
  staged: string[]
  unstaged: string[]
  untracked: string[]
  commits: Commit[]
}

/** What `git status` shows, as lists: staged for the next commit, changed but not staged, and not tracked yet. */
export function view(root: FsNode, git: GitState): GitView {
  const work = files(root)
  return {
    staged: changes(head(git), git.index),
    unstaged: Object.keys(git.index)
      .filter((f) => f in work && work[f] !== git.index[f])
      .sort(),
    untracked: Object.keys(work)
      .filter((f) => !(f in git.index) && !ignored(work, f))
      .sort(),
    commits: git.commits,
  }
}

/** Untracked folders show as one line, `data/`, the way git does. */
function collapse(paths: string[], work: Files, git: GitState) {
  const out: string[] = []
  for (const p of paths) {
    const [top, ...rest] = p.split('/')
    const whole = rest.length > 0 && !Object.keys(git.index).some((f) => f.startsWith(`${top}/`))
    const name = whole ? `${top}/` : p
    if (!out.includes(name)) out.push(name)
  }
  return out.filter((n) => !n.endsWith('/') || Object.keys(work).some((f) => f.startsWith(n)))
}

function rel(cwd: string, path: string) {
  const from = split(cwd).slice(split(PROJECT).length)
  const to = path.split('/')
  let i = 0
  while (i < from.length && from[i] === to[i]) i++
  return [...from.slice(i).map(() => '..'), ...to.slice(i)].join('/')
}

function status(root: FsNode, git: GitState, cwd: string) {
  const work = files(root)
  const v = view(root, git)
  const lines = ['On branch main']
  if (!git.commits.length) lines.push('', 'No commits yet')
  const tab = (f: string, kind?: string) => `\t${kind ? `${kind}:`.padEnd(12) : ''}${rel(cwd, f)}`
  if (v.staged.length) {
    lines.push(
      '',
      'Changes to be committed:',
      git.commits.length ? '  (use "git restore --staged <file>..." to unstage)' : '  (use "git rm --cached <file>..." to unstage)',
    )
    for (const f of v.staged) lines.push(tab(f, f in head(git) ? 'modified' : 'new file'))
  }
  if (v.unstaged.length) {
    lines.push(
      '',
      'Changes not staged for commit:',
      '  (use "git add <file>..." to update what will be committed)',
      '  (use "git restore <file>..." to discard changes in working directory)',
    )
    for (const f of v.unstaged) lines.push(tab(f, 'modified'))
  }
  if (v.untracked.length) {
    lines.push('', 'Untracked files:', '  (use "git add <file>..." to include in what will be committed)')
    for (const f of collapse(v.untracked, work, git)) lines.push(tab(f))
  }
  if (v.staged.length) return lines.join('\n')
  if (lines.length > 1) lines.push('')
  if (v.unstaged.length) lines.push('no changes added to commit (use "git add" and/or "git commit -a")')
  else if (v.untracked.length) lines.push('nothing added to commit but untracked files present (use "git add" to track)')
  else if (!git.commits.length) lines.push('nothing to commit (create/copy files and use "git add" to track)')
  else lines.push('nothing to commit, working tree clean')
  return lines.join('\n')
}

function add(root: FsNode, git: GitState, cwd: string, args: string[]): GitResult {
  const force = args.includes('-f') || args.includes('--force')
  const all = args.includes('-A') || args.includes('--all')
  const paths = args.filter((a) => !a.startsWith('-'))
  if (!paths.length && !all)
    return {
      output: "Nothing specified, nothing added.\nhint: Maybe you wanted to say 'git add .'?",
      status: 0,
    }
  const work = files(root)
  const index = { ...git.index }
  const refused: string[] = []
  for (const target of paths.length ? paths : [PROJECT]) {
    const path = resolve(cwd, target)
    if (path !== PROJECT && !path.startsWith(`${PROJECT}/`))
      return {
        output: `fatal: ${path}: '${target}' is outside repository at '${PROJECT}'`,
        status: 128,
      }
    const inside = path.slice(PROJECT.length + 1)
    const matched = Object.keys(work).filter((f) => !inside || f === inside || f.startsWith(`${inside}/`))
    if (!matched.length)
      return {
        output: `fatal: pathspec '${target}' did not match any files`,
        status: 128,
      }
    for (const f of matched) {
      if (!force && !(f in index) && ignored(work, f)) {
        if (f === inside) refused.push(target)
        continue
      }
      index[f] = work[f]
    }
  }
  if (refused.length)
    return {
      output: `The following paths are ignored by one of your .gitignore files:\n${refused.join('\n')}\nhint: Use -f if you really want to add them.\nhint: Disable this message with "git config advice.addIgnoredFile false"`,
      status: 1,
      git: { ...git, index },
    }
  return { output: '', status: 0, git: { ...git, index } }
}

function hash(text: string) {
  let out = ''
  let h = 0x811c9dc5
  for (let round = 0; round < 5; round++) {
    for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193) >>> 0
    h = Math.imul(h ^ round, 0x01000193) >>> 0
    out += h.toString(16).padStart(8, '0')
  }
  return out
}

type Op = { kind: ' ' | '-' | '+'; line: string }

/** A line diff (longest common subsequence), enough for the small files in the practice project. */
export function diffLines(a: string, b: string): Op[] {
  const x = a ? a.replace(/\n$/, '').split('\n') : []
  const y = b ? b.replace(/\n$/, '').split('\n') : []
  const lcs = Array.from({ length: x.length + 1 }, () => new Array<number>(y.length + 1).fill(0))
  for (let i = x.length - 1; i >= 0; i--)
    for (let j = y.length - 1; j >= 0; j--) lcs[i][j] = x[i] === y[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1])
  const ops: Op[] = []
  let i = 0
  let j = 0
  while (i < x.length || j < y.length) {
    if (i < x.length && j < y.length && x[i] === y[j]) {
      ops.push({ kind: ' ', line: x[i++] })
      j++
    } else if (i < x.length && (j >= y.length || lcs[i + 1][j] >= lcs[i][j + 1])) ops.push({ kind: '-', line: x[i++] })
    else ops.push({ kind: '+', line: y[j++] })
  }
  return ops
}

const CONTEXT = 3

function hunks(ops: Op[]) {
  const changed = ops.flatMap((op, i) => (op.kind === ' ' ? [] : [i]))
  const ranges: [number, number][] = []
  for (const i of changed) {
    const start = Math.max(0, i - CONTEXT)
    const end = Math.min(ops.length - 1, i + CONTEXT)
    const prev = ranges.at(-1)
    if (prev && start <= prev[1] + 1) prev[1] = end
    else ranges.push([start, end])
  }
  const out: string[] = []
  for (const [start, end] of ranges) {
    const before = ops.slice(0, start)
    const body = ops.slice(start, end + 1)
    const oldStart = before.filter((o) => o.kind !== '+').length
    const newStart = before.filter((o) => o.kind !== '-').length
    const oldLen = body.filter((o) => o.kind !== '+').length
    const newLen = body.filter((o) => o.kind !== '-').length
    const at = (s: number, n: number) => `${n ? s + 1 : s}${n === 1 ? '' : `,${n}`}`
    out.push(`@@ -${at(oldStart, oldLen)} +${at(newStart, newLen)} @@`, ...body.map((o) => o.kind + o.line))
  }
  return out
}

function diff(from: Files, to: Files, only: string[], newFiles: boolean) {
  const out: string[] = []
  for (const f of changes(from, to)) {
    if (!(f in to)) continue
    if (!newFiles && !(f in from)) continue
    if (only.length && !only.some((o) => !o || f === o || f.startsWith(`${o}/`))) continue
    const isNew = !(f in from)
    out.push(`diff --git a/${f} b/${f}`)
    if (isNew) out.push('new file mode 100644', `index 0000000..${hash(to[f]).slice(0, 7)}`, '--- /dev/null')
    else out.push(`index ${hash(from[f]).slice(0, 7)}..${hash(to[f]).slice(0, 7)} 100644`, `--- a/${f}`)
    out.push(`+++ b/${f}`, ...hunks(diffLines(from[f] ?? '', to[f])))
  }
  return out.join('\n')
}

function commit(root: FsNode, git: GitState, cwd: string, args: string[]): GitResult {
  let message: string | undefined
  let all = false
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '-m' || a === '-am' || a === '--message') {
      message = args[++i]
      if (a === '-am') all = true
    } else if (a === '-a' || a === '--all') all = true
  }
  if (all) {
    const work = files(root)
    git = {
      ...git,
      index: Object.fromEntries(Object.entries(git.index).map(([f, c]) => [f, work[f] ?? c])),
    }
  }
  const staged = changes(head(git), git.index)
  if (!staged.length) return { output: status(root, git, cwd), status: 1 }
  if (message === undefined)
    return {
      output: 'This practice terminal has no text editor for the commit message.\nGive the message on the same line: git commit -m "Say what changed"',
      status: 1,
    }
  if (!message.trim())
    return {
      output: 'Aborting commit due to empty commit message.',
      status: 1,
    }
  const parent = git.commits.at(-1)
  const id = hash(`${parent?.id ?? ''}\n${message}\n${JSON.stringify(git.index)}`)
  let insertions = 0
  let deletions = 0
  for (const f of staged) {
    const ops = diffLines(head(git)[f] ?? '', git.index[f] ?? '')
    insertions += ops.filter((o) => o.kind === '+').length
    deletions += ops.filter((o) => o.kind === '-').length
  }
  const counts = [
    `${staged.length} file${staged.length === 1 ? '' : 's'} changed`,
    insertions || !deletions ? `${insertions} insertion${insertions === 1 ? '' : 's'}(+)` : '',
    deletions ? `${deletions} deletion${deletions === 1 ? '' : 's'}(-)` : '',
  ].filter(Boolean)
  const created = staged.filter((f) => !(f in head(git))).map((f) => ` create mode 100644 ${f}`)
  return {
    output: [`[main${parent ? '' : ' (root-commit)'} ${id.slice(0, 7)}] ${message}`, ` ${counts.join(', ')}`, ...created].join('\n'),
    status: 0,
    git: {
      index: { ...git.index },
      commits: [...git.commits, { id, message, files: { ...git.index } }],
    },
  }
}

function log(git: GitState, args: string[]): GitResult {
  if (!git.commits.length)
    return {
      output: "fatal: your current branch 'main' does not have any commits yet",
      status: 128,
    }
  const newest = [...git.commits].reverse()
  if (args.includes('--oneline'))
    return {
      output: newest.map((c, i) => `${c.id.slice(0, 7)} ${i === 0 ? '(HEAD -> main) ' : ''}${c.message}`).join('\n'),
      status: 0,
    }
  const date = (i: number) => `Sat Nov 14 ${String(9 + i).padStart(2, '0')}:00:00 2026 +0100`
  const out = newest.map((c, i) =>
    [
      `commit ${c.id}${i === 0 ? ' (HEAD -> main)' : ''}`,
      'Author: Student <student@example.com>',
      `Date:   ${date(git.commits.length - 1 - i)}`,
      '',
      `    ${c.message}`,
    ].join('\n'),
  )
  return { output: out.join('\n\n'), status: 0 }
}

const LATER: Record<string, string> = {
  switch: 'module 5',
  branch: 'module 5',
  checkout: 'module 5',
  merge: 'module 5',
  rebase: 'module 5',
  restore: 'module 6',
  revert: 'module 6',
  reset: 'module 6',
  stash: 'module 6',
  push: 'a later module',
  pull: 'a later module',
  clone: 'a later module',
  fetch: 'a later module',
}

const USAGE = `git commands on this page:
  git status              what changed since the last snapshot
  git add <file or .>     put changes in the next snapshot
  git commit -m "..."     take the snapshot, with a message
  git log [--oneline]     list the snapshots, newest first
  git diff [--staged]     show the changed lines`

export function git(root: FsNode, state: GitState, cwd: string, args: string[]): GitResult {
  if (cwd !== PROJECT && !cwd.startsWith(`${PROJECT}/`))
    return {
      output: 'fatal: not a git repository (or any of the parent directories): .git',
      status: 128,
    }
  const [sub, ...rest] = args
  switch (sub) {
    case undefined:
    case 'help':
    case '--help':
      return { output: USAGE, status: sub ? 0 : 1 }
    case 'init':
      return {
        output: `Reinitialized existing Git repository in ${PROJECT}/.git/`,
        status: 0,
      }
    case 'status':
      return { output: status(root, state, cwd), status: 0 }
    case 'add':
      return add(root, state, cwd, rest)
    case 'commit':
      return commit(root, state, cwd, rest)
    case 'log':
      return log(state, rest)
    case 'diff': {
      const staged = rest.includes('--staged') || rest.includes('--cached')
      const only = rest.filter((a) => !a.startsWith('-')).map((a) => resolve(cwd, a).slice(PROJECT.length + 1))
      const work = {
        ...state.index,
        ...Object.fromEntries(Object.entries(files(root)).filter(([f]) => f in state.index)),
      }
      return {
        output: staged ? diff(head(state), state.index, only, true) : diff(state.index, work, only, false),
        status: 0,
      }
    }
    default:
      if (LATER[sub])
        return {
          output: `git ${sub} is real; it comes in ${LATER[sub]}. Type git help to see what works here.`,
          status: 1,
        }
      return {
        output: `git: '${sub}' is not a git command. See 'git help'.`,
        status: 1,
      }
  }
}

export const AI_REQUEST = 'Add a title to the report.'
export const AI_FILES = ['README.md', 'report.py'] as const

const TITLE_LINE = 'print("Orders and revenue per nation")'

/** The scripted AI edit: it adds the title you asked for, and quietly rounds every order price. */
export function aiEdits(): Files {
  return {
    'report.py': REPORT_PY.replace(
      'totals[nation] = (count + 1, revenue + float(order["o_totalprice"]))',
      'totals[nation] = (count + 1, revenue + round(float(order["o_totalprice"])))',
    ).replace('\nprint(f"', `\n${TITLE_LINE}\nprint(f"`),
    'README.md': README.replace('prints orders and revenue per nation.', 'prints orders and revenue per nation, under a title.'),
  }
}

export const reportFlags = (code: string) => ({
  title: code.includes(TITLE_LINE),
  rounded: code.includes('round(float('),
})
