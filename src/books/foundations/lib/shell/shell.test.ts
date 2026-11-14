import { describe, expect, it } from 'vitest'
import { HOME, PROJECT, createMessyFs, display, lookup, resolve } from './fs'
import { aiChange, aiChanged, complete, createShell, prompt, run, type ShellState } from './shell'
import { files } from './git'

const go = (state: ShellState, ...lines: string[]) => lines.reduce(run, state)
const last = (state: ShellState) => state.entries[state.entries.length - 1]

describe('practice shell', () => {
  it('resolves relative, absolute and home paths', () => {
    expect(resolve(PROJECT, 'data')).toBe(`${PROJECT}/data`)
    expect(resolve(`${PROJECT}/data`, '..')).toBe(PROJECT)
    expect(resolve('/usr', '~/orders-report/./data')).toBe(`${PROJECT}/data`)
    expect(resolve(PROJECT, '/home/student')).toBe(HOME)
    expect(display(`${PROJECT}/data`)).toBe('~/orders-report/data')
    expect(prompt(PROJECT)).toBe('student@laptop:~/orders-report$')
  })

  it('prints the working directory and lists folders like ls in a UTF-8 locale', () => {
    const s = go(createShell(PROJECT), 'pwd', 'ls', 'ls data')
    expect(s.entries.map((e) => e.output)).toEqual([PROJECT, 'data  README.md  report.py  report.R  tests', 'customer.csv  nation.csv  orders.csv'])
  })

  it('moves with cd and records the move for the drawing', () => {
    const s = go(createShell(PROJECT), 'cd data', 'pwd', 'cd ..')
    expect(s.entries[1].output).toBe(`${PROJECT}/data`)
    expect(last(s).event).toEqual({ kind: 'cd', from: `${PROJECT}/data`, to: PROJECT })
    expect(s.cwd).toBe(PROJECT)
    expect(s.visited).toContain(`${PROJECT}/data`)
  })

  it('reads the dataset files', () => {
    const s = go(createShell(PROJECT), 'head -n 3 data/orders.csv', 'wc -l data/orders.csv', 'wc -l data/nation.csv')
    expect(s.entries[0].output).toBe('o_orderkey,o_custkey,o_orderdate,o_totalprice\n101,1,2023-12-30,250\n102,3,2023-12-31,1800')
    expect(s.entries[1].output).toBe('7 data/orders.csv')
    expect(s.entries[2].output).toBe('7 data/nation.csv')
  })

  it('gives bash-style errors and points at the real file', () => {
    const s = go(createShell(PROJECT), 'cd Data')
    expect(last(s).output).toBe('bash: cd: Data: No such file or directory')
    expect(last(s).event).toEqual({ kind: 'missing', looked: `${PROJECT}/Data`, actual: `${PROJECT}/data` })

    const inData = go(createShell(`${PROJECT}/data`), 'cat data/orders.csv')
    expect(last(inData).output).toBe('cat: data/orders.csv: No such file or directory')
    expect(last(inData).event).toMatchObject({ kind: 'missing', actual: `${PROJECT}/data/orders.csv` })

    const home = go(createShell(HOME), 'python3 report.py', 'Rscript report.R')
    expect(home.entries[0].output).toBe("python3: can't open file '/home/student/report.py': [Errno 2] No such file or directory")
    expect(home.entries[1].output).toBe("Fatal error: cannot open file 'report.R': No such file or directory")
  })

  it('runs the report from the project folder in Python and R', () => {
    const s = go(createShell(PROJECT), 'python3 report.py', 'Rscript report.R')
    expect(s.entries[0].ok).toBe(true)
    expect(s.entries[0].output.split('\n')).toEqual([
      'nation     orders   revenue',
      'Brazil          1    310.00',
      'Canada          1    420.00',
      'France          2    310.00',
      'Germany         1   1800.00',
      'Japan           1     95.90',
    ])
    expect(s.entries[1].output.split('\n')[0]).toBe('  nation orders revenue')
  })

  it('fails the report when started from the wrong folder level', () => {
    const s = go(createShell(`${PROJECT}/data`), 'python3 ../report.py')
    expect(last(s).ok).toBe(false)
    expect(last(s).output).toContain("No such file or directory: 'data/nation.csv'")
  })

  it('explains commands that come later and case mistakes', () => {
    const s = go(createShell(PROJECT), 'grep x', 'LS', 'foo')
    expect(s.entries[0].output).toContain('module 3')
    expect(s.entries[1].output).toContain('try ls')
    expect(s.entries[2].output).toBe('bash: foo: command not found')
  })

  it('completes names with Tab', () => {
    expect(complete(PROJECT, 'cd da')).toBe('cd data/')
    expect(complete(PROJECT, 'cat data/n')).toBe('cat data/nation.csv ')
    expect(complete(PROJECT, 'cat rep')).toBe('cat report.')
    expect(complete(PROJECT, 'cd D')).toBe('cd D')
    expect(complete(PROJECT, 'pw')).toBe('pwd ')
  })

  it('keeps the exit code of the last command for echo $?', () => {
    const s = go(createShell(PROJECT), 'python3 report.py', 'echo $?', 'python3 nope.py', 'echo $?', 'pyhton3 report.py', 'echo $?')
    expect(s.entries.map((e) => e.status)).toEqual([0, 0, 2, 0, 127, 0])
    expect(s.entries.filter((e) => e.command === 'echo').map((e) => e.output)).toEqual(['0', '2', '127'])
  })

  it('finds programs on PATH with which', () => {
    const s = go(createShell(PROJECT), 'which python3', 'which python', 'echo $PATH')
    expect(s.entries.map((e) => [e.output, e.status])).toEqual([
      ['/usr/bin/python3', 0],
      ['', 1],
      ['/usr/local/bin:/usr/bin:/bin', 0],
    ])
  })

  it('runs the part after && only if the first part worked', () => {
    const s = go(createShell(PROJECT), 'cd data && wc -l orders.csv', 'cd .. && python3 nope.py && echo done')
    expect(s.entries[0].output).toBe('7 orders.csv')
    expect(s.entries[0].status).toBe(0)
    expect(s.entries[1].output).not.toContain('done')
    expect(s.entries[1].status).toBe(2)
    expect(s.cwd).toBe(PROJECT)
  })

  it('suggests the right case for a known program', () => {
    expect(last(go(createShell(PROJECT), 'Python3 report.py')).output).toBe('bash: Python3: command not found\nCommands are case sensitive: try python3')
  })

  it('applies a custom AI script, including deletions', () => {
    const start = { ...createShell(PROJECT), fs: createMessyFs() }
    const script = {
      request: 'Tidy this folder.',
      writes: { 'README.md': '# orders-report\n', 'nested/setup.txt': 'ready\n' },
      removes: ['report_old.py'],
    }
    const changed = aiChange(start, script)
    expect(lookup(changed.fs!, `${PROJECT}/README.md`)).toEqual({ kind: 'file', content: '# orders-report\n' })
    expect(lookup(changed.fs!, `${PROJECT}/nested/setup.txt`)).toEqual({ kind: 'file', content: 'ready\n' })
    expect(lookup(changed.fs!, `${PROJECT}/report_old.py`)).toBeUndefined()
    expect(last(changed).output).toBe('You asked your AI tool: “Tidy this folder.”\nIt changed 3 files: README.md, nested/setup.txt, deleted report_old.py')
    expect(aiChanged(changed, script)).toBe(true)
    expect(aiChanged(changed)).toBe(false)
    expect(aiChanged(start)).toBe(false)
  })

  it('builds the unsorted project with only the intended files', () => {
    const fs = createMessyFs()
    expect(Object.keys(files(fs)).sort()).toEqual([
      '__pycache__/report.cpython-312.pyc',
      'config.py',
      'data/customer.csv',
      'data/nation.csv',
      'data/orders.csv',
      'data/raw/orders_full_export.csv',
      'output/report.csv',
      'output/revenue_by_nation.png',
      'report.R',
      'report.py',
      'report_old.py',
    ])
    expect(lookup(fs, `${PROJECT}/config.py`)).toEqual({
      kind: 'file',
      content: '# Used to download fresh orders from the sales system\nSALES_API_KEY = "sk-live-7Hq2v9XbP4mN8rT1"\n',
    })
    expect(lookup(fs, `${PROJECT}/report_old.py`)?.kind).toBe('file')
  })
})
