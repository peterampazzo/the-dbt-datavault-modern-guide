import { Chapter } from '@/components/Chapter'
import { ChapterHeader, Code, P, Section } from '@/components/Prose'
import { Deeper } from '@/books/foundations/components/Deeper'
import { SameSetupDrawing } from '@/books/foundations/components/drawing/SameSetupDrawing'
import { TextFilesDrawing } from '@/books/foundations/components/drawing/TextFilesDrawing'
import { Problem } from '@/books/foundations/components/Problem'
import { Practice, type Task } from '@/books/foundations/components/shell/Practice'
import { WhyAI } from '@/books/foundations/components/WhyAI'
import { PROJECT } from '@/books/foundations/lib/shell/fs'
import { files, ignored } from '@/books/foundations/lib/shell/git'
import { FS, aiChange, aiChanged, committedShell, type Entry, type ShellState } from '@/books/foundations/lib/shell/shell'

const ran = (s: ShellState, test: (e: Entry) => boolean) => s.entries.some((e) => e.ok && test(e))
const gitSaid = (s: ShellState, sub: string, text: string) => s.entries.some((e) => e.command === 'git' && e.input.includes(sub) && e.output.includes(text))
const read = (name: string) => (s: ShellState) => ran(s, (e) => e.command === 'cat' && e.input.includes(name))

const afterFirstSnapshot = () => committedShell(PROJECT)
const afterAiChange = () => aiChange(committedShell(PROJECT))

const tasks: Record<string, Task[]> = {
  files: [
    {
      label: <>List every file, the hidden ones too.</>,
      done: (s) => ran(s, (e) => e.command === 'ls' && /\s-\w*a/.test(e.input)),
    },
    {
      label: (
        <>
          Print the editor settings in <Code>.vscode/settings.json</Code>.
        </>
      ),
      done: read('.vscode/settings.json'),
    },
    {
      label: (
        <>
          Print <Code>.env.example</Code>, the settings file without the secret.
        </>
      ),
      done: read('.env.example'),
    },
  ],
  snapshot: [
    {
      label: <>See what git has not saved yet.</>,
      done: (s) => ran(s, (e) => e.input.startsWith('git status')),
    },
    {
      label: <>Stage everything for the first snapshot.</>,
      done: (s) => {
        const work = files(s.fs ?? FS)
        return Object.keys(work).every((f) => ignored(work, f) || f in (s.git?.index ?? {}))
      },
    },
    {
      label: <>Take the snapshot, with a message.</>,
      done: (s) => (s.git?.commits.length ?? 0) > 0,
    },
    {
      label: <>List the history.</>,
      done: (s) => ran(s, (e) => e.input.startsWith('git log')),
    },
  ],
  diff: [
    {
      label: <>Ask your AI tool to add a title to the report.</>,
      done: aiChanged,
    },
    {
      label: <>See which files it changed.</>,
      done: (s) => gitSaid(s, 'status', 'modified:'),
    },
    {
      label: <>Show the changed lines and find the one you did not ask for.</>,
      done: (s) => gitSaid(s, 'diff', 'round(float'),
    },
    {
      label: <>Run the Python report and compare the revenue.</>,
      done: (s) => ran(s, (e) => e.event.kind === 'ran' && e.output.startsWith('Orders and revenue')),
    },
  ],
  setup: [
    {
      label: <>Print the extensions this project recommends.</>,
      done: read('.vscode/extensions.json'),
    },
    {
      label: <>Check that the settings are in the snapshot: git has nothing left to save.</>,
      done: (s) => gitSaid(s, 'status', 'working tree clean'),
    },
  ],
  breaks: [
    {
      label: <>Commit before staging, and read what git says.</>,
      done: (s) => gitSaid(s, 'commit', 'no changes added to commit'),
    },
    {
      label: (
        <>
          Try to stage <Code>.env</Code>.
        </>
      ),
      done: (s) => gitSaid(s, 'add', 'ignored by one of your .gitignore files'),
    },
    {
      label: <>Stage and commit the change, then commit again.</>,
      done: (s) => gitSaid(s, 'commit', 'nothing to commit, working tree clean'),
    },
  ],
}

export default function Snapshots() {
  return (
    <Chapter>
      <ChapterHeader
        title="Snapshots"
        lead="A folder full of separate copies cannot tell you which version is right. Git keeps each version with who changed it, when and why."
      />
      <Section title="Any text file" keyPoint="If you can open it in a text editor, git can keep every version of it and show what changed.">
        <Problem>
          A folder has <Code>analysis_final.R</Code> and <Code>analysis_final_v2.R</Code>, and they do not match. The filenames cannot tell you which lines changed.
        </Problem>
        <P>
          <strong>Git</strong> is like Google Docs version history, for a whole folder. It works for anything stored as text: Python and R code, settings files,
          even your editor&apos;s settings. Look at the hidden settings files in the practice project.
        </P>
        <Practice id="m4-files" cwd={PROJECT} tasks={tasks.files} chips={['ls -a', 'cat .vscode/settings.json', 'cat .env.example']} />
        <P>
          Names that start with a dot are hidden; <Code>ls -a</Code> shows them. <Code>.vscode/settings.json</Code> is the editor&apos;s setup for this project.{' '}
          <Code>.env.example</Code> lists the settings the report needs, without the secret values. All text, so git can keep them.
        </P>
        <TextFilesDrawing />
        <P>
          Spreadsheets, slides and images can be saved too, but git can only say that they changed, not what changed inside. None of this is new: git is from
          2005. It looks harder than it is. Day to day you need four commands, on the next page.
        </P>
        <WhyAI>Everything Claude Code, Codex or Lovable produces is text. If it is in git, you can see what the tool did and go back to any earlier version.</WhyAI>
      </Section>
      <Section title="Take a snapshot" keyPoint="git add chooses what goes in the snapshot; git commit saves it with a note.">
        <Problem>
          You have made a change to <Code>report.R</Code> and want a record before starting another one. A short note should explain the change.
        </Problem>
        <P>
          Saving a snapshot is like sending a parcel: put things in the box (<Code>git add</Code>), then seal it and write a label (<Code>git commit</Code>).
          This folder has nothing saved yet.
        </P>
        <Practice
          id="m4-snapshot"
          cwd={PROJECT}
          tasks={tasks.snapshot}
          git
          chips={['git status', 'git add .', 'git commit -m "Add the orders report"', 'git log --oneline']}
        />
        <P>
          A snapshot is called a <strong>commit</strong>. Putting files in the box is called <strong>staging</strong>; <Code>git add .</Code> means everything
          here. A folder whose history git keeps is a <strong>repository</strong>. The panel under the terminal shows where each file is.
        </P>
        <P>
          When in doubt, run <Code>git status</Code>. It says what changed and what to type next.
        </P>
        <WhyAI>Commit before you let a tool loose. Then everything it does shows up as a change against a version you know works.</WhyAI>
        <Deeper title="what is inside a commit">
          <p>
            Each commit has an id (the long hexadecimal number; the first 7 characters are enough to name it), an author, a date, the message, and a pointer to
            the commit before it. That chain is the history. A good message says why, in the present tense: “Round revenue to whole euros”, not “changes”.{' '}
            <Code>git log</Code> without <Code>--oneline</Code> shows all of it.
          </p>
        </Deeper>
      </Section>
      <Section title="What did the tool change?" keyPoint="git status shows which files changed; git diff shows which lines.">
        <Problem>
          Your AI tool changed <Code>report.py</Code>, and the revenue moved. You need to see which lines changed before you accept the edit.
        </Problem>
        <P>
          You have one snapshot. Now ask your AI tool for a small change, then look at exactly what it did, like Track Changes in Word.
        </P>
        <Practice id="m4-diff" cwd={PROJECT} start={afterFirstSnapshot} tasks={tasks.diff} ai git chips={['git status', 'git diff', 'python3 report.py']} />
        <P>
          Lines starting with <Code>-</Code> were removed, lines starting with <Code>+</Code> were added. The tool added the title you asked for. It also wrapped
          every price in <Code>round(...)</Code>, which you did not ask for, and the revenue changed.
        </P>
        <P>
          You don&apos;t need to read Python to spot this. Read the <Code>+</Code> lines and ask: did I ask for this? A later module shows how to throw a change
          away.
        </P>
        <WhyAI>
          Every tool shows its changes its own way. <Code>git diff</Code> is the same everywhere and shows everything. If you can&apos;t explain a line,
          don&apos;t commit it: ask the tool why.
        </WhyAI>
      </Section>
      <Section title="Same setup everywhere" keyPoint="Settings in the repository travel with the code: get the project, get the setup.">
        <Problem>
          A teammate opens <Code>orders-report</Code> on a new laptop and gets different editor settings. The project needs to carry the setup and list the packages it uses.
        </Problem>
        <P>
          Editor settings are text files too. Put them in the repository and every teammate, every machine and your next laptop get the same setup.
        </P>
        <Practice id="m4-setup" cwd={PROJECT} start={afterFirstSnapshot} tasks={tasks.setup} git chips={['cat .vscode/extensions.json', 'git status']} />
        <SameSetupDrawing />
        <P>
          VS Code reads <Code>.vscode/settings.json</Code> when you open the folder, and offers to install the extensions listed in{' '}
          <Code>.vscode/extensions.json</Code>. Cursor reads the same files. RStudio keeps its project settings in a <Code>.Rproj</Code> file, which belongs in
          the repository too.
        </P>
        <P>
          Secrets are the exception. The real key goes in <Code>.env</Code>, which stays on your machine. The repository gets <Code>.env.example</Code>: the names,
          no values.
        </P>
        <WhyAI>
          AI tools read instruction files from the repository too: <Code>AGENTS.md</Code>, <Code>CLAUDE.md</Code>, <Code>.cursor/rules</Code>. Commit them, and
          every person and every tool works by the same rules.
        </WhyAI>
        <Deeper title="personal settings and other editors">
          <p>
            Your own preferences, such as the theme and font size, are not project settings. VS Code&apos;s Settings Sync keeps them in step across your
            machines through your GitHub or Microsoft account. Some people keep them in a git repository of their own, often called dotfiles. An{' '}
            <Code>.editorconfig</Code> file sets basics such as indentation for most editors at once.
          </p>
        </Deeper>
      </Section>
      <Section title="When it breaks" keyPoint="Read git's message to the end: it usually says what to type next.">
        <Problem>
          You try to commit the report before staging it, or accidentally try to stage <Code>.env</Code>. Read the exact message before deciding what to do.
        </Problem>
        <P>The tool&apos;s change is back in your folder. Here are three messages you will meet in your first week with git.</P>
        <Practice
          id="m4-breaks"
          cwd={PROJECT}
          start={afterAiChange}
          tasks={tasks.breaks}
          git
          chips={['git commit -m "Add a title"', 'git add .env', 'git add .', 'git status']}
        />
        <P>
          <Code>no changes added to commit</Code>: nothing is in the box yet. Run <Code>git add</Code> first. <Code>nothing to commit, working tree clean</Code>:
          everything is saved. Good news.
        </P>
        <P>
          <Code>ignored by one of your .gitignore files</Code>: <Code>.gitignore</Code> lists files git must leave alone, and <Code>.env</Code> is on it.
          Don&apos;t force it in. Once a key is committed it stays in the history, even after you delete the file. The only fix is to cancel the key and make a
          new one.
        </P>
        <WhyAI>
          Secrets never go in the code, the repository or the prompt. If a tool pastes an API key into a file, ask it to read the key from <Code>.env</Code>{' '}
          instead.
        </WhyAI>
      </Section>
    </Chapter>
  )
}
