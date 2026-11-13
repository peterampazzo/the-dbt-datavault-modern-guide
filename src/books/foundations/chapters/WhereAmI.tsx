import { Chapter } from '@/components/Chapter'
import { ChapterHeader, Code, P, Section } from '@/components/Prose'
import { CommandAnatomyDrawing } from '@/books/foundations/components/drawing/CommandAnatomyDrawing'
import { PromptDrawing } from '@/books/foundations/components/drawing/PromptDrawing'
import { Practice, type Task } from '@/books/foundations/components/shell/Practice'
import { WhyAI } from '@/books/foundations/components/WhyAI'
import { HOME, PROJECT } from '@/books/foundations/lib/shell/fs'
import type { Entry, ShellState } from '@/books/foundations/lib/shell/shell'

const DATA = `${PROJECT}/data`
const ran = (s: ShellState, test: (e: Entry) => boolean) => s.entries.some((e) => e.ok && test(e))
const read = (s: ShellState, command: string, file: string) => ran(s, (e) => e.command === command && e.event.kind === 'read' && e.event.path === `${DATA}/${file}`)

const tasks: Record<string, Task[]> = {
  prompt: [{ label: <>Find out which folder you are in: run <Code>pwd</Code>.</>, done: (s) => ran(s, (e) => e.command === 'pwd') }],
  tree: [
    { label: <>List the folder you are in with <Code>ls</Code>.</>, done: (s) => ran(s, (e) => e.event.kind === 'list' && e.event.path === PROJECT) },
    { label: <>List what is inside <Code>data</Code>.</>, done: (s) => ran(s, (e) => e.event.kind === 'list' && e.event.path === DATA) },
  ],
  anatomy: [{ label: <>Get the long listing of <Code>data</Code>, with sizes.</>, done: (s) => ran(s, (e) => e.command === 'ls' && / -\w*l/.test(` ${e.input}`) && e.event.kind === 'list' && e.event.path === DATA) }],
  move: [
    { label: <>Go into <Code>data</Code>.</>, done: (s) => s.visited.includes(DATA) },
    { label: <>Come back up to <Code>orders-report</Code>.</>, done: (s) => s.visited.includes(DATA) && s.cwd === PROJECT },
    { label: <>Bonus: get to your home folder and back with absolute paths.</>, done: (s) => ran(s, (e) => e.command === 'cd' && e.input.includes(' /')) && s.visited.includes(HOME) && s.cwd === PROJECT },
  ],
  read: [
    { label: <>Print the nations.</>, done: (s) => read(s, 'cat', 'nation.csv') },
    { label: <>Print only the first three lines of the orders.</>, done: (s) => read(s, 'head', 'orders.csv') },
    { label: <>Count the lines in the orders file.</>, done: (s) => read(s, 'wc', 'orders.csv') },
  ],
  breaks: [
    { label: <>Run the report, in Python or R. It will fail first: read the message, then fix it.</>, done: (s) => ran(s, (e) => e.event.kind === 'ran') },
    { label: <>Try <Code>cd Data</Code>, read the error, then get into the folder that does exist.</>, done: (s) => s.entries.some((e) => e.input === 'cd Data') && s.visited.includes(DATA) },
    { label: <>From inside <Code>data</Code>, print the orders.</>, done: (s) => ran(s, (e) => e.command === 'cat' && e.cwd === DATA && e.event.kind === 'read' && e.event.path === `${DATA}/orders.csv`) },
  ],
}

export default function WhereAmI() {
  return (
    <Chapter>
      <ChapterHeader
        title="Where am I?"
        lead="AI coding tools do their work in a terminal. Learn to read one: where you are, what is around you, and what a command will touch. Nothing to install: the terminal on each page runs in your browser."
      />
      <Section
        title="The prompt"
        lead="The terminal is a window where you type a command and press Enter. Start by asking it where you are."
        keyPoint="The prompt tells you where you are before you type anything."
      >
        <Practice id="m1-prompt" cwd={PROJECT} tasks={tasks.prompt} chips={['pwd']} />
        <PromptDrawing />
        <P>
          Everything before <Code>$</Code> is the prompt. The terminal prints it to show it is ready. <Code>pwd</Code> means print working directory: the
          folder your commands run in. <Code>~</Code> is short for your home folder, here <Code>/home/student</Code>.
        </P>
        <WhyAI>
          When Claude Code or Codex asks to run a command, it runs it in a folder like this one. The prompt tells you which folder, and so which project the
          tool can see and change.
        </WhyAI>
      </Section>
      <Section
        title="Folders are a tree"
        lead="Every file has an address that starts at /, the top of the tree. Your working directory is where the pin is."
        keyPoint="ls shows what is inside a folder; with no argument, it shows where you are."
      >
        <Practice id="m1-tree" cwd={PROJECT} tasks={tasks.tree} chips={['ls', 'ls data']} tree />
        <P>
          Each <Code>ls</Code> lights up the folder it listed. The project is just one branch of the tree: <Code>orders-report</Code> and everything below it.
        </P>
        <WhyAI>An AI tool works on the folder it was started in and the folders below it. Start it in the wrong folder and it changes the wrong project.</WhyAI>
      </Section>
      <Section title="Anatomy of a command" lead="Most commands have the same three parts. Ask ls for more detail to see them." keyPoint="Command, then options, then arguments.">
        <Practice id="m1-anatomy" cwd={PROJECT} tasks={tasks.anatomy} chips={['ls -l data']} />
        <CommandAnatomyDrawing />
        <P>
          <Code>-l</Code> asks for a long listing, with size and date. Options start with a dash and change how the command behaves. Stuck on what a command
          does? On your own machine, <Code>ls --help</Code> prints a summary. Here, <Code>help</Code> lists what works.
        </P>
        <WhyAI>
          Tools show you a command before they run it. Read it in the same three parts: which program, which options, which files. If it names a file or folder
          you don't expect, say no and ask why.
        </WhyAI>
      </Section>
      <Section
        title="Move around"
        lead="cd changes the folder you are in. Watch the pin move, or pick a folder in the tree to see the command that gets you there."
        keyPoint="Absolute paths work from anywhere, relative paths start from where you are."
      >
        <Practice id="m1-move" cwd={PROJECT} tasks={tasks.move} chips={['cd data', 'pwd', 'cd ..']} tree walker />
        <P>
          <Code>..</Code> means one folder up. A path that starts with <Code>/</Code> is absolute: it starts at the top of the tree and works from anywhere.
          A path without <Code>/</Code> at the start is relative: it starts from the pin.
        </P>
        <P>
          Press Tab while typing a name and the terminal completes it. If nothing happens, the name does not exist where you are. That is already a clue.
        </P>
        <WhyAI>Error messages from tools are full of absolute paths. Reading one tells you exactly where the tool was looking.</WhyAI>
      </Section>
      <Section title="Read a file without an editor" lead="Check what is in a file before your code reads it." keyPoint="cat, head and wc tell you what a file holds without opening it.">
        <Practice id="m1-read" cwd={PROJECT} tasks={tasks.read} chips={['cat data/nation.csv', 'head -n 3 data/orders.csv', 'wc -l data/orders.csv']} tree />
        <P>
          <Code>cat</Code> prints a whole file. <Code>head -n 3</Code> prints the first three lines, which is safer on a big file. <Code>wc -l</Code> counts
          lines: seven in the orders file, a header and six orders.
        </P>
        <WhyAI>
          Before you trust a number in a report an AI tool built, look at the data it read. <Code>head</Code> and <Code>wc -l</Code> take ten seconds and tell
          you whether the file holds what you think.
        </WhyAI>
      </Section>
      <Section
        title="When it breaks"
        lead="This terminal starts in your home folder, not in the project. Each task fails on the first try. The tree shows where the terminal looked and where the file really is."
        keyPoint={<>When a file does not exist, run <Code>pwd</Code> and <Code>ls</Code> before changing anything else.</>}
      >
        <Practice id="m1-breaks" cwd={HOME} tasks={tasks.breaks} chips={['python3 report.py', 'Rscript report.R', 'cd orders-report', 'cd Data']} tree />
        <P>
          From your home folder there is no <Code>report.py</Code>. Python shows the full path it tried; R only shows the name, so check with <Code>pwd</Code>.
        </P>
        <P>
          Linux cares about upper and lower case, so <Code>Data</Code> and <Code>data</Code> are different names. Run <Code>ls</Code> to see the real name, or
          type the first letter and press Tab.
        </P>
        <P>
          Inside <Code>data</Code>, <Code>cat data/orders.csv</Code> looks for <Code>data/data/orders.csv</Code>. Use <Code>cat orders.csv</Code>, or go up first.
        </P>
        <WhyAI>
          <Code>No such file or directory</Code> is the error AI tools hit most often too. When you ask the tool or a colleague for help, paste the output of{' '}
          <Code>pwd</Code> along with the error. That alone often solves it.
        </WhyAI>
      </Section>
    </Chapter>
  )
}
