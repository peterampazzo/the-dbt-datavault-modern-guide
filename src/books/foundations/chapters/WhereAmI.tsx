import { Chapter } from '@/components/Chapter'
import { ChapterHeader, Code, P, Section } from '@/components/Prose'
import { CommandAnatomyDrawing } from '@/books/foundations/components/drawing/CommandAnatomyDrawing'
import { PromptDrawing } from '@/books/foundations/components/drawing/PromptDrawing'
import { Story } from '@/books/foundations/components/Story'
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
        lead="You join a group project and get a folder full of other folders. Before you can run anything, or check what an AI tool did, you need to know where you are. The terminal on each page runs in your browser: nothing to install."
      />
      <Section title="The prompt" keyPoint="The prompt tells you which folder you are in before you type anything.">
        <Story course="02476">
          January 2022. Pietro joins a four-person project. The first instruction in it says: run{' '}
          <Code>python3 src/data/make_dataset.py data/raw data/processed</Code>. Those paths only work from the project&apos;s top folder. So before anything
          else: where am I?
        </Story>
        <P>
          The terminal is a chat with your computer: you type a command, press Enter, and it answers. Ask it where you are with <Code>pwd</Code>.
        </P>
        <Practice id="m1-prompt" cwd={PROJECT} tasks={tasks.prompt} chips={['pwd']} />
        <PromptDrawing />
        <P>
          The text before <Code>$</Code> is the <strong>prompt</strong>. Like the address bar in Finder or File Explorer, it shows the folder you are in.{' '}
          <Code>~</Code> is short for your home folder.
        </P>
        <WhyAI>Claude Code and Codex also work inside one folder. The prompt tells you which project the tool can see and change.</WhyAI>
      </Section>
      <Section title="Folders are a tree" keyPoint="ls shows what is inside a folder. With nothing after it, it shows where you are.">
        <Story course="02476">
          The project had <Code>data</Code>, <Code>src</Code>, <Code>models</Code>, <Code>tests</Code> and <Code>docker</Code>, each with folders inside. The
          raw images were in <Code>data/raw</Code>, the cleaned ones in <Code>data/processed</Code>.
        </Story>
        <P>
          It is the same as folders in Finder, just typed. <Code>ls</Code> lists what is in a folder. Each <Code>ls</Code> lights up the folder in the tree.
        </P>
        <Practice id="m1-tree" cwd={PROJECT} tasks={tasks.tree} chips={['ls', 'ls data']} tree />
        <WhyAI>An AI tool works on the folder it was started in and everything below it. Start it in the wrong folder and it changes the wrong project.</WhyAI>
      </Section>
      <Section title="Anatomy of a command" keyPoint="A command is a program, then options, then what to work on.">
        <Story course="02476">
          The README said <Code>conda env create --file=environment.yml</Code>. It looks cryptic, but it has the same parts as every command: a program, what to
          do, and the details.
        </Story>
        <P>Ask <Code>ls</Code> for more detail and look at the three parts.</P>
        <Practice id="m1-anatomy" cwd={PROJECT} tasks={tasks.anatomy} chips={['ls -l data']} />
        <CommandAnatomyDrawing />
        <P>
          <Code>-l</Code> means “long listing”, with sizes and dates. Things that start with a dash are <strong>options</strong>: they change how the program
          behaves. Here, <Code>help</Code> lists the commands this terminal knows.
        </P>
        <WhyAI>
          Tools show you a command before they run it. Read it in three parts: which program, which options, which files. If it names a file you don&apos;t
          expect, say no and ask why.
        </WhyAI>
      </Section>
      <Section title="Move around" keyPoint="cd .. goes up one folder. A path starting with / works from anywhere.">
        <Story course="02476">
          Run <Code>python3 src/data/make_dataset.py data/raw data/processed</Code> from inside <Code>src</Code> and it looks for{' '}
          <Code>src/src/data/make_dataset.py</Code>, which does not exist. Same command, wrong folder.
        </Story>
        <P>
          <Code>cd</Code> moves you into another folder, like double-clicking it. Watch the pin move, or tap a folder in the tree to get the command.
        </P>
        <Practice
          id="m1-move"
          cwd={PROJECT}
          tasks={tasks.move}
          chips={['cd data', 'pwd', 'cd ..', 'cd /home/student', 'cd /home/student/orders-report']}
          tree
          walker
        />
        <P>
          <Code>..</Code> means one folder up. A path that starts with <Code>/</Code> is a full address and works from anywhere. A path without it starts from
          where you are. Press Tab to complete a name: if nothing happens, it does not exist here.
        </P>
        <WhyAI>Error messages from tools are full of full addresses. Read one and you know exactly where the tool was looking.</WhyAI>
      </Section>
      <Section title="Look before you trust" keyPoint="cat, head and wc show what is in a file without opening it.">
        <Story course="02806">
          The project started from a survey file from Barcelona&apos;s open data portal: answers from 3,962 children. Step one with any data: look at the top and
          count the rows, before you trust anything built on it.
        </Story>
        <P>Do the same with the practice project&apos;s order data.</P>
        <Practice id="m1-read" cwd={PROJECT} tasks={tasks.read} chips={['cat data/nation.csv', 'head -n 3 data/orders.csv', 'wc -l data/orders.csv']} tree />
        <P>
          <Code>cat</Code> prints a whole file. <Code>head -n 3</Code> prints only the first three lines. <Code>wc -l</Code> counts lines: seven, a header and
          six orders.
        </P>
        <WhyAI>Before you trust a number in a report an AI tool built, look at the data it read. It takes ten seconds.</WhyAI>
      </Section>
      <Section
        title="When it breaks"
        keyPoint={
          <>
            When a file &ldquo;does not exist&rdquo;, run <Code>pwd</Code> and <Code>ls</Code> before changing anything else.
          </>
        }
      >
        <P>
          The most common error in any project is <Code>No such file or directory</Code>. Usually the file is there and you are in the wrong folder. This
          terminal starts in your home folder, not in the project, so each task fails first. The tree shows where the terminal looked and where the file is.
        </P>
        <Practice
          id="m1-breaks"
          cwd={HOME}
          tasks={tasks.breaks}
          chips={['python3 report.py', 'Rscript report.R', 'cd Data', 'cd orders-report', 'cd data', 'cat orders.csv']}
          tree
        />
        <P>
          From your home folder there is no <Code>report.py</Code>. <Code>Data</Code> and <Code>data</Code> are different names: capitals count. And from
          inside <Code>data</Code>, <Code>cat data/orders.csv</Code> looks for <Code>data/data/orders.csv</Code>.
        </P>
        <WhyAI>
          This is the error AI tools hit most often too. When you ask the tool or a teammate for help, paste the output of <Code>pwd</Code> with the error.
          That alone often solves it.
        </WhyAI>
      </Section>
    </Chapter>
  )
}
