import { Chapter } from '@/components/Chapter'
import { ChapterHeader, Code, P, Section } from '@/components/Prose'
import { ApproveOrNot } from '@/books/foundations/components/ApproveOrNot'
import { Deeper } from '@/books/foundations/components/Deeper'
import { EnterDrawing } from '@/books/foundations/components/drawing/EnterDrawing'
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
        lead="Every command you type, and every command an AI tool asks to run, starts a program. See what happens when you press Enter, and how to tell if it worked."
      />
      <Section
        title="Press Enter"
        lead="orders-report has the same report twice: report.py in Python and report.R in R. Run one of them."
        keyPoint="Pressing Enter starts a program in the folder you are in."
      >
        <Practice id="m2-enter" cwd={PROJECT} tasks={tasks.enter} chips={['python3 report.py', 'Rscript report.R']} />
        <EnterDrawing />
        <P>
          <Code>python3</Code> and <Code>Rscript</Code> are programs. <Code>report.py</Code> is the argument: the file you ask them to run. The report reads the
          three CSV files in <Code>data</Code> and prints orders and revenue per nation. You don&apos;t need to read the code to run it.
        </P>
        <WhyAI>
          When Claude Code or Codex shows “Run <Code>python3 report.py</Code>?”, this is what you are approving: a program, started in a folder, with your
          permissions.
        </WhyAI>
      </Section>
      <Section
        title="Where programs live"
        lead="The shell has to find python3 before it can run it. It looks in a short list of folders called PATH."
        keyPoint="which shows the program a command name will start."
      >
        <Practice id="m2-path" cwd={PROJECT} tasks={tasks.path} chips={['which python3', 'echo $PATH']} />
        <P>
          A program is a file too. <Code>which python3</Code> prints its address, <Code>/usr/bin/python3</Code>. <Code>PATH</Code> is a list of folders separated
          by <Code>:</Code>. The shell tries them in order and runs the first match. If no folder has it, you get <Code>command not found</Code>.
        </P>
        <WhyAI>
          “It works in my terminal but not in the tool” often means the two have a different PATH, so the same name starts a different program, or none.
          <Code>which</Code> settles it.
        </WhyAI>
        <Deeper title="environment variables">
          <p>
            <Code>PATH</Code> is an environment variable: a named value every program inherits from the shell that started it. <Code>$PATH</Code> means “the value
            of PATH”. You set one for the current shell with <Code>export NAME=value</Code>. Installers often add a folder to PATH in <Code>~/.bashrc</Code> or{' '}
            <Code>~/.zshrc</Code>, which is why a new program sometimes works only after you open a new terminal.
          </p>
        </Deeper>
      </Section>
      <Section
        title="Did it work?"
        lead="Every program ends with a number, its exit code. 0 means it worked; anything else means it failed. The shell keeps the last one in $?."
        keyPoint="Exit code 0 means success. Anything else is a failure, even when nothing is printed."
      >
        <Practice id="m2-status" cwd={PROJECT} tasks={tasks.status} chips={['python3 report.py', 'echo $?', 'python3 nope.py']} />
        <P>
          <Code>echo</Code> prints what you give it, and <Code>$?</Code> is the exit code of the command before. A missing file gives 2; a command that does not
          exist gives 127. The numbers differ from program to program, but 0 always means success.
        </P>
        <WhyAI>
          AI tools, and CI later in this book, decide “passed” or “failed” from the exit code, not from what the output says. A test run that prints a lot but
          exits with 0 is green.
        </WhyAI>
        <Deeper title="output and errors">
          <p>
            A program writes to two streams: standard output (stdout) for results and standard error (stderr) for errors. Both show up in the terminal.{' '}
            <Code>python3 report.py &gt; out.txt</Code> sends stdout to a file and leaves errors on screen; <Code>2&gt; errors.txt</Code> does the same for stderr.
            That is why an error can still appear when you redirect the output.
          </p>
        </Deeper>
      </Section>
      <Section
        title="One after another"
        lead="&& joins two commands: the second runs only if the first exits with 0."
        keyPoint="a && b runs b only when a worked."
      >
        <Practice id="m2-chain" cwd={PROJECT} tasks={tasks.chain} chips={['cd data && wc -l orders.csv', 'cd .. && python3 nope.py && echo done']} />
        <P>
          Read <Code>&amp;&amp;</Code> as “and then, if that worked”. A chain stops at the first failure, so <Code>done</Code> is never printed when the report
          before it fails. Look at the exit code with <Code>echo $?</Code> after a chain: it is the code of the last part that ran.
        </P>
        <WhyAI>
          Agents chain commands a lot, for example <Code>cd app &amp;&amp; npm install &amp;&amp; npm test</Code>. Read the whole line before approving: each
          part is a separate program, and the last one only runs if all the others worked.
        </WhyAI>
      </Section>
      <Section
        title="Approve or not"
        lead="An AI tool asks to run three commands. For each, decide: run it, or look closer first?"
        keyPoint="Approve commands that read or test. Stop and check commands that delete, or download and run something."
      >
        <ApproveOrNot />
        <P>
          You don&apos;t need to know every command. Ask three questions: what program does it start, which folder does it touch, and can I undo it? If you can&apos;t
          answer, ask the tool to explain before you approve.
        </P>
        <WhyAI>
          This is what the approval prompt in Claude Code, Codex or Cursor is asking you. “Always allow” is fine for tests and reading files, and a bad idea for
          anything that deletes or installs.
        </WhyAI>
      </Section>
      <Section
        title="When it breaks"
        lead="Three errors you will see when a program does not start. Each one is about the name, not the code."
        keyPoint={<>Read <Code>command not found</Code> as “the shell found no program with that exact name on PATH”.</>}
      >
        <Practice id="m2-breaks" cwd={PROJECT} tasks={tasks.breaks} chips={['python report.py', 'which python', 'which python3', 'Python3 report.py']} />
        <P>
          On many Linux and macOS machines the program is called <Code>python3</Code>, and <Code>python</Code> does not exist. Instructions written for another
          machine often say <Code>python</Code>. <Code>which</Code> prints nothing and exits with 1 when it finds no match.
        </P>
        <P>
          Names are case sensitive: <Code>Python3</Code> is not <Code>python3</Code>. When a program does start but fails, the exit code is not 0 and the last
          lines of the output say why. Read those first.
        </P>
        <WhyAI>
          When you report a failure to the tool or a colleague, include the exact command, the last lines of output and the exit code. “It doesn&apos;t work”
          gives them nothing to go on.
        </WhyAI>
      </Section>
    </Chapter>
  )
}
