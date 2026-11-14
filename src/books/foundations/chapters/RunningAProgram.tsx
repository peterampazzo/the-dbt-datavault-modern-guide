import { Chapter } from '@/components/Chapter'
import { ChapterHeader, Code, P, Section } from '@/components/Prose'
import { ApproveOrNot } from '@/books/foundations/components/ApproveOrNot'
import { Deeper } from '@/books/foundations/components/Deeper'
import { EnterDrawing } from '@/books/foundations/components/drawing/EnterDrawing'
import { Story } from '@/books/foundations/components/Story'
import { Practice, type Task } from '@/books/foundations/components/shell/Practice'
import { WhyAI } from '@/books/foundations/components/WhyAI'
import { PROJECT } from '@/books/foundations/lib/shell/fs'
import type { Entry, ShellState } from '@/books/foundations/lib/shell/shell'

const ran = (s: ShellState, test: (e: Entry) => boolean) => s.entries.some((e) => e.ok && test(e))
const status = (s: ShellState, test: (code: string) => boolean) => s.entries.some((e) => e.command === 'echo' && e.input.includes('$?') && test(e.output))
const chained = (e: Entry) => e.input.includes('&&')

const tasks: Record<string, Task[]> = {
  enter: [{ label: <>Run the report, in Python or in R.</>, done: (s) => ran(s, (e) => e.event.kind === 'ran') }],
  path: [
    { label: <>Find where <Code>python3</Code> lives.</>, done: (s) => ran(s, (e) => e.command === 'which' && e.input.includes('python3')) },
    { label: <>Print the list of folders the shell searches.</>, done: (s) => ran(s, (e) => e.command === 'echo' && e.input.includes('$PATH')) },
  ],
  status: [
    { label: <>Run the report, then print its exit code. It should be 0.</>, done: (s) => status(s, (c) => c === '0') && ran(s, (e) => e.event.kind === 'ran') },
    { label: <>Run something that fails, then print its exit code.</>, done: (s) => status(s, (c) => c !== '0') },
  ],
  chain: [
    { label: <>Go into <Code>data</Code> and count the orders, in one line.</>, done: (s) => ran(s, (e) => chained(e) && e.command === 'cd' && e.event.kind === 'read') },
    { label: <>Write a chain where the first part fails, and see that the second never runs.</>, done: (s) => s.entries.some((e) => chained(e) && !e.ok) },
  ],
  breaks: [
    { label: <>Run the report with <Code>python</Code>, read the error, then run it the way it works.</>, done: (s) => s.entries.some((e) => e.command === 'python') && ran(s, (e) => e.event.kind === 'ran') },
    { label: <>Ask <Code>which</Code> about <Code>python</Code> and about <Code>python3</Code>.</>, done: (s) => s.entries.some((e) => e.command === 'which' && /\bpython\b/.test(e.input)) && ran(s, (e) => e.command === 'which' && e.input.includes('python3')) },
    { label: <>Try <Code>Python3 report.py</Code>, with a capital P.</>, done: (s) => s.entries.some((e) => e.command === 'Python3') },
  ],
}

export default function RunningAProgram() {
  return (
    <Chapter>
      <ChapterHeader
        title="Running a program"
        lead="Every command you type, and every command an AI tool asks to run, starts a program. The program runs, then reports back whether it worked. Learn to read that, and to decide what to approve."
      />
      <Section title="Press Enter" keyPoint="Pressing Enter starts a program in the folder you are in.">
        <Story course="02476">
          The same project ran in three places: on each student&apos;s laptop, inside a Docker container in the cloud, and on GitHub for every pull request.
          Every time, it started the same way: a program, given a file to run.
        </Story>
        <P>
          Pressing Enter is like double-clicking an app: it starts a program. The practice project has the same report twice, in Python and in R. Run either.
        </P>
        <Practice id="m2-enter" cwd={PROJECT} tasks={tasks.enter} chips={['python3 report.py', 'Rscript report.R']} />
        <EnterDrawing />
        <P>
          <Code>python3</Code> and <Code>Rscript</Code> are the programs; <Code>report.py</Code> is the file you hand them. The report reads the three files in{' '}
          <Code>data</Code> and prints orders and revenue per country. You don&apos;t need to read the code to run it.
        </P>
        <WhyAI>
          When Claude Code or Codex asks “Run <Code>python3 report.py</Code>?”, this is what you approve: a program, started in a folder, allowed to do what
          you can do.
        </WhyAI>
      </Section>
      <Section title="Where programs live" keyPoint="which shows the program a name will start.">
        <Story course="02476">
          The project&apos;s Makefile says <Code>python3</Code>. The Docker start script in the same project says <Code>python</Code>. Both were right, each on
          its own machine. Which name works depends on what that machine has installed.
        </Story>
        <P>
          Your computer keeps a short list of folders where programs live, called <strong>PATH</strong>. Ask where <Code>python3</Code> is.
        </P>
        <Practice id="m2-path" cwd={PROJECT} tasks={tasks.path} chips={['which python3', 'echo $PATH']} />
        <P>
          A program is a file too: <Code>which python3</Code> prints its address. The computer looks through the PATH folders in order and runs the first match.
          No match means <Code>command not found</Code>.
        </P>
        <WhyAI>
          “It works in my terminal but not in the tool” often means the two look in different folders. <Code>which</Code> settles it.
        </WhyAI>
        <Deeper title="environment variables">
          <p>
            <Code>PATH</Code> is an environment variable: a named value every program inherits from the shell that started it. <Code>$PATH</Code> means “the value
            of PATH”. You set one for the current shell with <Code>export NAME=value</Code>. Installers often add a folder to PATH in <Code>~/.bashrc</Code> or{' '}
            <Code>~/.zshrc</Code>, which is why a new program sometimes works only after you open a new terminal.
          </p>
        </Deeper>
      </Section>
      <Section title="Did it work?" keyPoint="0 means it worked. Any other number means it failed, even if nothing was printed.">
        <Story course="02476">
          The project&apos;s Docker start script begins with a check: if nobody said what to run, print <Code>No argument supplied</Code> and exit with 1. That 1
          is how the script tells the computer “I failed”.
        </Story>
        <P>
          Every program ends by handing back a number, its <strong>exit code</strong>. 0 means it worked; anything else means it failed. <Code>echo $?</Code>{' '}
          shows the last one.
        </P>
        <Practice id="m2-status" cwd={PROJECT} tasks={tasks.status} chips={['python3 report.py', 'echo $?', 'python3 nope.py']} />
        <P>A missing file gives 2, a command that does not exist gives 127. The other numbers vary, but 0 always means success.</P>
        <WhyAI>
          AI tools, and the automatic checks later in this book, decide “passed” or “failed” from this number, not from what the output says.
        </WhyAI>
        <Deeper title="output and errors">
          <p>
            A program writes to two streams: standard output (stdout) for results and standard error (stderr) for errors. Both show up in the terminal.{' '}
            <Code>python3 report.py &gt; out.txt</Code> sends stdout to a file and leaves errors on screen; <Code>2&gt; errors.txt</Code> does the same for stderr.
            That is why an error can still appear when you redirect the output.
          </p>
        </Deeper>
      </Section>
      <Section title="One after another" keyPoint="a && b runs b only if a worked.">
        <Story course="02476">
          <Code>make data</Code> first installed the packages, and only then built the dataset. If installing failed, there was no point carrying on.
        </Story>
        <P>
          <Code>&amp;&amp;</Code> joins two commands and means “and then, if that worked”. Try one chain that works and one that stops early.
        </P>
        <Practice id="m2-chain" cwd={PROJECT} tasks={tasks.chain} chips={['cd data && wc -l orders.csv', 'cd .. && python3 nope.py && echo done']} />
        <P>
          The chain stops at the first failure, so <Code>done</Code> is never printed.
        </P>
        <WhyAI>
          AI tools chain a lot, for example <Code>cd app &amp;&amp; npm install &amp;&amp; npm test</Code>. Each part is a separate program: read the whole line
          before you approve.
        </WhyAI>
      </Section>
      <Section title="Approve or not" keyPoint="Approve commands that read or test. Stop and check commands that delete, or download and run something.">
        <Story course="02476">
          The project had a <Code>make clean</Code> command that deletes files. Useful and harmless there, but you would want to know what it deletes before
          letting anyone, or any tool, run it.
        </Story>
        <P>An AI tool asks to run three commands. For each one, decide: run it, or look closer first?</P>
        <ApproveOrNot />
        <P>
          You don&apos;t need to know every command. Ask three questions: which program, which folder, and can I undo it? If you can&apos;t answer, ask the tool
          to explain first.
        </P>
        <WhyAI>
          This is what the approval prompt in Claude Code, Codex or Cursor is asking. “Always allow” is fine for tests and reading files, and a bad idea for
          anything that deletes or installs.
        </WhyAI>
      </Section>
      <Section
        title="When it breaks"
        keyPoint={
          <>
            <Code>command not found</Code> means no program with that exact name was found.
          </>
        }
      >
        <P>
          Remember <Code>python3</Code> in one file and <Code>python</Code> in the other? On many laptops only one of them exists. Try both, and a capital P.
        </P>
        <Practice id="m2-breaks" cwd={PROJECT} tasks={tasks.breaks} chips={['python report.py', 'python3 report.py', 'which python', 'which python3', 'Python3 report.py']} />
        <P>
          <Code>which</Code> prints nothing when it finds no match. Capitals count: <Code>Python3</Code> is not <Code>python3</Code>. When a program does start
          but fails, the last lines of its output say why. Read those first.
        </P>
        <WhyAI>
          When you report a failure to the tool or a teammate, include the exact command, the last lines of output and the exit code. “It doesn&apos;t work”
          gives them nothing to go on.
        </WhyAI>
      </Section>
    </Chapter>
  )
}
