import { CUSTOMERS, NATIONS, ORDERS } from '@/books/foundations/lib/sales'

export type FsNode = { kind: 'dir'; children: Record<string, FsNode> } | { kind: 'file'; content: string }

const csv = (rows: readonly object[]) =>
  [Object.keys(rows[0]).join(','), ...rows.map((row) => Object.values(row).join(','))].join('\n') + '\n'

const dir = (children: Record<string, FsNode>): FsNode => ({ kind: 'dir', children })
const file = (content: string): FsNode => ({ kind: 'file', content })

export const HOME = '/home/student'
export const PROJECT = `${HOME}/orders-report`

export const REPORT_PY = `import csv

nations = {r["n_nationkey"]: r["n_name"] for r in csv.DictReader(open("data/nation.csv"))}
customers = {r["c_custkey"]: nations[r["c_nationkey"]] for r in csv.DictReader(open("data/customer.csv"))}

totals = {}
for order in csv.DictReader(open("data/orders.csv")):
    nation = customers[order["o_custkey"]]
    count, revenue = totals.get(nation, (0, 0.0))
    totals[nation] = (count + 1, revenue + float(order["o_totalprice"]))

print(f"{'nation':<10}{'orders':>7}{'revenue':>10}")
for nation, (count, revenue) in sorted(totals.items()):
    print(f"{nation:<10}{count:>7}{revenue:>10.2f}")
`

const REPORT_R = `nations <- read.csv("data/nation.csv")
customers <- read.csv("data/customer.csv")
orders <- read.csv("data/orders.csv")

orders <- merge(orders, customers, by.x = "o_custkey", by.y = "c_custkey")
orders <- merge(orders, nations, by.x = "c_nationkey", by.y = "n_nationkey")

report <- data.frame(
  nation = sort(unique(orders$n_name)),
  orders = as.vector(table(orders$n_name)),
  revenue = as.vector(tapply(orders$o_totalprice, orders$n_name, sum))
)
print(report, row.names = FALSE)
`

export const README = `# orders-report

Reads the orders, customers and nations in data/ and prints orders and revenue per nation.

Run it from this folder:

    python3 report.py
    Rscript report.R
`

const TEST_PY = `def test_placeholder():
    assert True
`

const GITIGNORE = `# Secrets and local files: never commit these
.env
__pycache__/
.Rhistory
.Rproj.user/
`

const ENV = `SALES_API_KEY=practice-key-not-real
`

const ENV_EXAMPLE = `# Copy to .env and fill in. .env stays on your machine.
SALES_API_KEY=
`

const VSCODE_SETTINGS = `{
  "editor.formatOnSave": true,
  "files.insertFinalNewline": true,
  "files.trimTrailingWhitespace": true,
  "[python]": { "editor.defaultFormatter": "charliermarsh.ruff" },
  "[r]": { "editor.tabSize": 2 }
}
`

const VSCODE_EXTENSIONS = `{
  "recommendations": ["ms-python.python", "charliermarsh.ruff", "REditorSupport.r"]
}
`

/** The practice machine: a home folder with the orders-report project, plus the system folders where programs live. */
export function createFs(): FsNode {
  return dir({
    home: dir({
      student: dir({
        'orders-report': dir({
          '.env': file(ENV),
          '.env.example': file(ENV_EXAMPLE),
          '.gitignore': file(GITIGNORE),
          '.vscode': dir({ 'extensions.json': file(VSCODE_EXTENSIONS), 'settings.json': file(VSCODE_SETTINGS) }),
          'README.md': file(README),
          data: dir({
            'customer.csv': file(csv(CUSTOMERS)),
            'nation.csv': file(csv(NATIONS)),
            'orders.csv': file(csv(ORDERS)),
          }),
          'report.R': file(REPORT_R),
          'report.py': file(REPORT_PY),
          tests: dir({ 'test_report.py': file(TEST_PY) }),
        }),
      }),
    }),
    usr: dir({ bin: dir({ python3: file(''), Rscript: file('') }) }),
  })
}

export function split(path: string) {
  return path.split('/').filter(Boolean)
}

export function resolve(cwd: string, input: string): string {
  const start = input.startsWith('/') ? [] : input === '~' || input.startsWith('~/') ? split(HOME) : split(cwd)
  const rest = input === '~' ? [] : input.startsWith('~/') ? split(input.slice(2)) : split(input)
  const parts = [...start]
  for (const part of rest) {
    if (part === '.') continue
    if (part === '..') parts.pop()
    else parts.push(part)
  }
  return '/' + parts.join('/')
}

export function lookup(root: FsNode, path: string): FsNode | undefined {
  let node: FsNode | undefined = root
  for (const part of split(path)) {
    if (node?.kind !== 'dir') return undefined
    node = node.children[part]
  }
  return node
}

export function display(path: string) {
  if (path === HOME) return '~'
  return path.startsWith(HOME + '/') ? '~' + path.slice(HOME.length) : path
}

export const sortNames = (names: string[]) => [...names].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }))

/** Find a path that differs from the given one only in letter case, for "did you mean" hints. */
export function caseMatch(root: FsNode, path: string): string | undefined {
  let node: FsNode | undefined = root
  const out: string[] = []
  for (const part of split(path)) {
    if (node?.kind !== 'dir') return undefined
    const name: string | undefined = Object.keys(node.children).find((n) => n.toLowerCase() === part.toLowerCase())
    if (!name) return undefined
    out.push(name)
    node = node.children[name]
  }
  const found = '/' + out.join('/')
  return found === path ? undefined : found
}

/** Find where a missing file of this name really is, for "it's over here" hints. */
export function findByName(root: FsNode, name: string, at = ''): string | undefined {
  if (root.kind !== 'dir') return undefined
  for (const [child, node] of Object.entries(root.children)) {
    const path = `${at}/${child}`
    if (child === name && node.kind === 'file') return path
    const deeper = findByName(node, name, path)
    if (deeper) return deeper
  }
  return undefined
}
