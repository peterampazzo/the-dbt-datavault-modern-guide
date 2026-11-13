import { caseMatch, createFs, display, findByName, lookup, resolve, sortNames, split, type FsNode } from './fs'

export type ShellEvent =
  | { kind: 'cd'; from: string; to: string }
  | { kind: 'list'; path: string }
  | { kind: 'read'; path: string }
  | { kind: 'missing'; looked: string; actual?: string }
  | { kind: 'ran'; path: string }
  | { kind: 'none' }

export type Entry = { cwd: string; input: string; output: string; ok: boolean; command: string; event: ShellEvent }
export type ShellState = { cwd: string; entries: Entry[]; visited: string[] }

export const FS = createFs()

export function createShell(cwd: string): ShellState {
  return { cwd, entries: [], visited: [cwd] }
}

export function prompt(cwd: string) {
  return `student@laptop:${display(cwd)}$`
}

const LATER: Record<string, string> = {
  grep: 'module 2',
  sort: 'module 2',
  uniq: 'module 2',
  less: 'module 2',
  tail: 'module 2',
  echo: 'module 3',
  which: 'module 3',
  env: 'module 3',
  export: 'module 3',
  chmod: 'module 4',
  git: 'module 5',
  make: 'module 9',
  docker: 'module 10',
  mkdir: 'a later module',
  rm: 'a later module',
  mv: 'a later module',
  cp: 'a later module',
  touch: 'a later module',
  nano: 'a later module',
  vim: 'a later module',
}

const HELP = `Commands on this page:
  pwd               print the folder you are in
  ls [-l] [path]    list a folder
  cd [path]         change folder (.. is one up, ~ is home)
  cat file          print a file
  head -n N file    print the first N lines
  wc -l file        count lines
  python3 file      run a Python script
  Rscript file      run an R script
  clear             clear the screen
Tab completes names. Up and Down bring back earlier commands.`

type Result = { output: string; ok: boolean; event: ShellEvent; cwd?: string }

const ok = (output: string, event: ShellEvent = { kind: 'none' }, cwd?: string): Result => ({ output, ok: true, event, cwd })
const fail = (output: string, event: ShellEvent = { kind: 'none' }): Result => ({ output, ok: false, event })

function missing(path: string) {
  const name = split(path).at(-1) ?? ''
  const actual = caseMatch(FS, path) ?? findByName(FS, name)
  return { kind: 'missing', looked: path, actual: actual && actual !== path ? actual : undefined } as const
}

export function tokenize(line: string): string[] {
  return [...line.matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g)].map((m) => m[1] ?? m[2] ?? m[3])
}

function ls(cwd: string, args: string[]): Result {
  const long = args.some((a) => a.startsWith('-') && a.includes('l'))
  const all = args.some((a) => a.startsWith('-') && a.includes('a'))
  const bad = args.find((a) => a.startsWith('-') && /[^-la]/.test(a))
  if (bad) return fail(`ls: invalid option -- '${bad.replace(/[-la]/g, '')[0]}'\nTry 'ls --help' for more information.`)
  const target = args.find((a) => !a.startsWith('-')) ?? '.'
  const path = resolve(cwd, target)
  const node = lookup(FS, path)
  if (!node) return fail(`ls: cannot access '${target}': No such file or directory`, missing(path))
  if (node.kind === 'file') return ok(long ? row(target, node) : target, { kind: 'list', path })
  const names = sortNames(Object.keys(node.children))
  const shown = all ? ['.', '..', ...names] : names
  if (!long) return ok(shown.join('  '), { kind: 'list', path })
  const rows = shown.map((name) => row(name, name === '.' || name === '..' ? node : node.children[name]))
  return ok([`total ${names.length * 4}`, ...rows].join('\n'), { kind: 'list', path })
}

function row(name: string, node: FsNode) {
  const size = node.kind === 'dir' ? 4096 : new TextEncoder().encode(node.content).length
  const mode = node.kind === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--'
  return `${mode} 1 student student ${String(size).padStart(4)} Nov 13 09:00 ${name}`
}

function readFile(cwd: string, cmd: string, target: string | undefined, notFound: (t: string) => string): Result | { content: string; path: string } {
  if (!target) return fail(`${cmd}: missing file operand`)
  const path = resolve(cwd, target)
  const node = lookup(FS, path)
  if (!node) return fail(notFound(target), missing(path))
  if (node.kind === 'dir') return fail(`${cmd}: ${target}: Is a directory`)
  return { content: node.content, path }
}

function cd(cwd: string, args: string[]): Result {
  const target = args[0] ?? '~'
  if (args.length > 1) return fail('bash: cd: too many arguments')
  const path = resolve(cwd, target)
  const node = lookup(FS, path)
  if (!node) return fail(`bash: cd: ${target}: No such file or directory`, missing(path))
  if (node.kind === 'file') return fail(`bash: cd: ${target}: Not a directory`)
  return ok('', { kind: 'cd', from: cwd, to: path }, path)
}

function report(cwd: string, program: 'python3' | 'Rscript', target: string | undefined): Result {
  if (!target) return fail(program === 'python3' ? 'Interactive Python is not on this page. Give it a file: python3 report.py' : 'Usage: Rscript file')
  const path = resolve(cwd, target)
  const node = lookup(FS, path)
  if (!node || node.kind === 'dir') {
    return fail(
      program === 'python3'
        ? `python3: can't open file '${path}': [Errno 2] No such file or directory`
        : `Fatal error: cannot open file '${target}': No such file or directory`,
      missing(path),
    )
  }
  const csvAt = (name: string) => lookup(FS, resolve(cwd, `data/${name}`))
  const data = ['nation.csv', 'customer.csv', 'orders.csv'].map(csvAt)
  if (data.some((d) => d?.kind !== 'file')) {
    const looked = resolve(cwd, 'data/nation.csv')
    return fail(
      program === 'python3'
        ? `Traceback (most recent call last):\n  File "${path}", line 3, in <module>\nFileNotFoundError: [Errno 2] No such file or directory: 'data/nation.csv'`
        : `Error in file(file, "rt") : cannot open the connection\nIn addition: Warning message:\nIn file(file, "rt") :\n  cannot open file 'data/nation.csv': No such file or directory`,
      missing(looked),
    )
  }
  const totals = summarise(...(data.map((d) => (d as { content: string }).content) as [string, string, string]))
  if (program === 'python3') {
    const lines = [`${'nation'.padEnd(10)}${'orders'.padStart(7)}${'revenue'.padStart(10)}`]
    for (const t of totals) lines.push(`${t.nation.padEnd(10)}${String(t.orders).padStart(7)}${t.revenue.toFixed(2).padStart(10)}`)
    return ok(lines.join('\n'), { kind: 'ran', path })
  }
  const cols = [
    ['nation', ...totals.map((t) => t.nation)],
    ['orders', ...totals.map((t) => String(t.orders))],
    ['revenue', ...totals.map((t) => t.revenue.toFixed(1))],
  ]
  const widths = cols.map((c) => Math.max(...c.map((v) => v.length)))
  const lines = cols[0].map((_, i) => ' ' + cols.map((c, j) => c[i].padStart(widths[j])).join(' '))
  return ok(lines.join('\n'), { kind: 'ran', path })
}

function parse(content: string) {
  const [header, ...rows] = content.trim().split('\n')
  const keys = header.split(',')
  return rows.map((r) => Object.fromEntries(r.split(',').map((v, i) => [keys[i], v])))
}

export function summarise(nationCsv: string, customerCsv: string, ordersCsv: string) {
  const nations = new Map(parse(nationCsv).map((r) => [r.n_nationkey, r.n_name]))
  const customers = new Map(parse(customerCsv).map((r) => [r.c_custkey, nations.get(r.c_nationkey) ?? '?']))
  const totals = new Map<string, { orders: number; revenue: number }>()
  for (const o of parse(ordersCsv)) {
    const nation = customers.get(o.o_custkey) ?? '?'
    const t = totals.get(nation) ?? { orders: 0, revenue: 0 }
    totals.set(nation, { orders: t.orders + 1, revenue: t.revenue + Number(o.o_totalprice) })
  }
  return [...totals].sort(([a], [b]) => a.localeCompare(b)).map(([nation, t]) => ({ nation, ...t }))
}

function execute(cwd: string, line: string): Result {
  const [cmd, ...args] = tokenize(line)
  switch (cmd) {
    case 'pwd':
      return ok(cwd)
    case 'ls':
      return ls(cwd, args)
    case 'cd':
      return cd(cwd, args)
    case 'help':
      return ok(HELP)
    case 'cat': {
      const files = args.length ? args : [undefined]
      const out: string[] = []
      let last: Result | undefined
      for (const target of files) {
        const r = readFile(cwd, 'cat', target, (t) => `cat: ${t}: No such file or directory`)
        if ('content' in r) {
          out.push(r.content.replace(/\n$/, ''))
          last = ok('', { kind: 'read', path: r.path })
        } else return { ...r, output: [...out, r.output].join('\n') }
      }
      return { ...(last as Result), output: out.join('\n') }
    }
    case 'head': {
      let n = 10
      const rest: string[] = []
      for (let i = 0; i < args.length; i++) {
        if (args[i] === '-n') n = Number(args[++i])
        else if (/^-\d+$/.test(args[i])) n = Number(args[i].slice(1))
        else if (/^-n\d+$/.test(args[i])) n = Number(args[i].slice(2))
        else rest.push(args[i])
      }
      if (!Number.isInteger(n) || n < 0) return fail(`head: invalid number of lines`)
      const r = readFile(cwd, 'head', rest[0], (t) => `head: cannot open '${t}' for reading: No such file or directory`)
      if (!('content' in r)) return r
      return ok(r.content.split('\n').slice(0, n).join('\n'), { kind: 'read', path: r.path })
    }
    case 'wc': {
      const target = args.find((a) => !a.startsWith('-'))
      const r = readFile(cwd, 'wc', target, (t) => `wc: ${t}: No such file or directory`)
      if (!('content' in r)) return r
      const lines = r.content.split('\n').length - 1
      if (args.includes('-l')) return ok(`${lines} ${target}`, { kind: 'read', path: r.path })
      const words = r.content.split(/\s+/).filter(Boolean).length
      return ok(`  ${lines}  ${words} ${new TextEncoder().encode(r.content).length} ${target}`, { kind: 'read', path: r.path })
    }
    case 'python':
      return fail(`Command 'python' not found, did you mean:\n  command 'python3' from deb python3`)
    case 'python3':
      return report(cwd, 'python3', args[0])
    case 'Rscript':
      return report(cwd, 'Rscript', args[0])
    default:
      if (cmd && LATER[cmd]) return fail(`${cmd} is a real command; it comes in ${LATER[cmd]}. Type help to see what works here.`)
      if (cmd && LATER[cmd.toLowerCase()]) return fail(`bash: ${cmd}: command not found\nCommands are case sensitive: try ${cmd.toLowerCase()}`)
      if (cmd && ['pwd', 'ls', 'cd', 'cat', 'head', 'wc', 'clear', 'help'].includes(cmd.toLowerCase()))
        return fail(`bash: ${cmd}: command not found\nCommands are case sensitive: try ${cmd.toLowerCase()}`)
      return fail(`bash: ${cmd}: command not found`)
  }
}

export function run(state: ShellState, line: string): ShellState {
  const input = line.trim()
  if (!input) return { ...state, entries: [...state.entries, { cwd: state.cwd, input: '', output: '', ok: true, command: '', event: { kind: 'none' } }] }
  if (input === 'clear') return { ...state, entries: [] }
  const r = execute(state.cwd, input)
  const cwd = r.cwd ?? state.cwd
  const entry: Entry = { cwd: state.cwd, input, output: r.output, ok: r.ok, command: tokenize(input)[0], event: r.event }
  return { cwd, entries: [...state.entries, entry], visited: state.visited.includes(cwd) ? state.visited : [...state.visited, cwd] }
}

/** Complete the last word of the line against names in the folder it points to. */
export function complete(cwd: string, line: string): string {
  const match = /(\S*)$/.exec(line)
  const word = match?.[1] ?? ''
  const head = line.slice(0, line.length - word.length)
  if (!head.trim()) {
    const commands = ['pwd', 'ls', 'cd', 'cat', 'head', 'wc', 'python3', 'Rscript', 'clear', 'help'].filter((c) => c.startsWith(word))
    return commands.length === 1 ? `${commands[0]} ` : line
  }
  const slash = word.lastIndexOf('/')
  const folderPart = slash >= 0 ? word.slice(0, slash + 1) : ''
  const prefix = word.slice(slash + 1)
  const folder = lookup(FS, resolve(cwd, folderPart || '.'))
  if (folder?.kind !== 'dir') return line
  const names = sortNames(Object.keys(folder.children)).filter((n) => n.startsWith(prefix))
  if (!names.length) return line
  if (names.length === 1) {
    const node = folder.children[names[0]]
    return `${head}${folderPart}${names[0]}${node.kind === 'dir' ? '/' : ' '}`
  }
  let common = names[0]
  for (const n of names) while (!n.startsWith(common)) common = common.slice(0, -1)
  return `${head}${folderPart}${common}`
}
