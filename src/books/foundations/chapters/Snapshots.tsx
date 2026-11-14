import { Chapter } from '@/components/Chapter'
import { ChapterHeader, Code, P, Section } from '@/components/Prose'
import { Deeper } from '@/books/foundations/components/Deeper'
import { SameSetupDrawing } from '@/books/foundations/components/drawing/SameSetupDrawing'
import { TextFilesDrawing } from '@/books/foundations/components/drawing/TextFilesDrawing'
import { Practice, type Task } from '@/books/foundations/components/shell/Practice'
import { WhyAI } from '@/books/foundations/components/WhyAI'
import { PROJECT } from '@/books/foundations/lib/shell/fs'
import { aiChange, aiChanged, committedShell, type Entry, type ShellState } from '@/books/foundations/lib/shell/shell'

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
      done: (s) => Object.keys(s.git?.index ?? {}).length > 0,
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
        lead="Git keeps every saved version of your project's text files, shows what changed between them, and lets a team work on the same files. It is not new; most people just never start."
      />
      <Section
        title="Any text file"
        lead="Version control is not only for programmers. Anything stored as text can be versioned: Python and R code, settings files, even your editor's settings."
        keyPoint="If you can open it in a text editor, git can keep every version of it and show what changed."
      >
        <Practice id="m4-files" cwd={PROJECT} tasks={tasks.files} chips={['ls -a', 'cat .vscode/settings.json', 'cat .env.example']} />
        <P>
          Files whose name starts with a dot are hidden, and <Code>ls -a</Code> shows them. <Code>.vscode/settings.json</Code> is the editor&apos;s setup for
          this project, and <Code>.env.example</Code> lists the settings the report needs, without the secret values. They are text, like <Code>report.py</Code>{' '}
          and <Code>report.R</Code>, so git can keep them all.
        </P>
        <TextFilesDrawing />
        <P>
          Git is a <strong>version control</strong> system: it saves snapshots of a folder and remembers every one. It works best with text, because it can show
          the exact lines that changed. Spreadsheets, slides and images can be saved too, but git can only tell you that they changed, not what changed inside.
        </P>
        <P>
          None of this is new. Git dates from 2005, and teams have used version control since the 1970s. It looks harder than it is: day to day you need four
          commands, and they are on the next page.
        </P>
        <WhyAI>
          Everything Claude Code, Codex or Lovable produces is text: code, configuration, instructions. If it is in git, you can see what the tool did and go
          back to any earlier version.
        </WhyAI>
      </Section>
      <Section
        title="Take a snapshot"
        lead="This folder is a git repository with nothing saved yet. Save its first snapshot in two steps: choose what goes in, then commit."
        keyPoint="git add chooses what goes in the next snapshot; git commit saves it with a message."
      >
        <Practice
          id="m4-snapshot"
          cwd={PROJECT}
          tasks={tasks.snapshot}
          git
          chips={['git status', 'git add .', 'git commit -m "Add the orders report"', 'git log --oneline']}
        />
        <P>
          A <strong>repository</strong> is a folder whose history git keeps. A <strong>commit</strong> is one snapshot of it, with a message saying why. Before
          committing you <strong>stage</strong> changes with <Code>git add</Code>; <Code>git add .</Code> means everything in this folder. The panel under the
          terminal shows where each file is: changed in your folder, staged, or saved in the history.
        </P>
        <P>
          <Code>git status</Code> is the command to run when in doubt. It says what changed and what to type next.
        </P>
        <WhyAI>
          Commit before you let a tool loose. Then everything the tool does shows up as a change against a known, working snapshot, and you can always go back
          to it.
        </WhyAI>
        <Deeper title="what is inside a commit">
          <p>
            Each commit has an id (the long hexadecimal number; the first 7 characters are enough to name it), an author, a date, the message, and a pointer to
            the commit before it. That chain is the history. A good message says why, in the present tense: “Round revenue to whole euros”, not “changes”.{' '}
            <Code>git log</Code> without <Code>--oneline</Code> shows all of it.
          </p>
        </Deeper>
      </Section>
      <Section
        title="What did the tool change?"
        lead="The project has one snapshot. You ask your AI tool for a small change. Before you accept it, find out exactly what it did."
        keyPoint="git status shows which files changed; git diff shows which lines."
      >
        <Practice id="m4-diff" cwd={PROJECT} start={afterFirstSnapshot} tasks={tasks.diff} ai git chips={['git status', 'git diff', 'python3 report.py']} />
        <P>
          In a diff, lines starting with <Code>-</Code> were removed and lines starting with <Code>+</Code> were added. The tool added the title you asked for.
          It also wrapped every order price in <Code>round(...)</Code>, which you did not ask for, and the revenue per nation changed.
        </P>
        <P>
          You don&apos;t need to read Python to spot this. Read the <Code>+</Code> lines and ask: did I ask for this? Here the answer is no, and the report
          proves it. Module 6 shows how to throw a change away.
        </P>
        <WhyAI>
          Every tool shows its changes in its own way. <Code>git diff</Code> is the same everywhere and shows everything. If you can&apos;t explain a diff,
          don&apos;t commit it: ask the tool why it changed that line.
        </WhyAI>
      </Section>
      <Section
        title="Same setup everywhere"
        lead="Editor settings are text files too. Put them in the repository and every colleague, every machine and your next laptop get the same setup."
        keyPoint="Project settings in the repository travel with the code: clone it, and the editor is set up."
      >
        <Practice id="m4-setup" cwd={PROJECT} start={afterFirstSnapshot} tasks={tasks.setup} git chips={['cat .vscode/extensions.json', 'git status']} />
        <SameSetupDrawing />
        <P>
          VS Code reads <Code>.vscode/settings.json</Code> when you open the folder, so the formatting rules are the same for everyone. When it finds{' '}
          <Code>.vscode/extensions.json</Code>, it offers to install the recommended extensions: here the Python, Ruff and R ones. Cursor and other editors
          built on VS Code read the same files. RStudio keeps its project settings in a <Code>.Rproj</Code> file, which also belongs in the repository.
        </P>
        <P>
          Settings with secrets are the exception. The real key goes in <Code>.env</Code>, which stays on your machine; the repository has{' '}
          <Code>.env.example</Code>, with the names and no values, so a new machine knows what to fill in.
        </P>
        <WhyAI>
          AI tools read instruction files from the repository too: <Code>AGENTS.md</Code>, <Code>CLAUDE.md</Code>, <Code>.cursor/rules</Code>. They are text.
          Commit them, and every person and every tool on the project works by the same rules.
        </WhyAI>
        <Deeper title="personal settings and other editors">
          <p>
            Your own preferences, such as the theme and font size, are not project settings. VS Code&apos;s Settings Sync keeps them in step across your
            machines through your GitHub or Microsoft account. Some people keep them in a git repository of their own, often called dotfiles. An{' '}
            <Code>.editorconfig</Code> file sets basics such as indentation for most editors at once.
          </p>
        </Deeper>
      </Section>
      <Section
        title="When it breaks"
        lead="The AI change from before is back in your folder. Three messages you will meet in your first week with git."
        keyPoint="Read git's message to the end: it usually says what to type next."
      >
        <Practice
          id="m4-breaks"
          cwd={PROJECT}
          start={afterAiChange}
          tasks={tasks.breaks}
          git
          chips={['git commit -m "Add a title"', 'git add .env', 'git add .', 'git status']}
        />
        <P>
          <Code>no changes added to commit</Code>: you changed files but staged nothing, so there is nothing to save. Run <Code>git add</Code> first.{' '}
          <Code>nothing to commit, working tree clean</Code>: everything is already saved. That is good news.
        </P>
        <P>
          <Code>ignored by one of your .gitignore files</Code>: <Code>.gitignore</Code> lists files git must leave alone, and <Code>.env</Code> is on it.
          Don&apos;t force it in with <Code>-f</Code>. Once a key is committed it stays in the history, even after you delete the file; the only fix is to
          cancel the key and make a new one.
        </P>
        <WhyAI>
          Secrets never go in the code, the repository or the prompt. If a tool suggests pasting an API key into a file, ask it to read the key from{' '}
          <Code>.env</Code> instead, and check that <Code>.env</Code> is in <Code>.gitignore</Code>.
        </WhyAI>
      </Section>
    </Chapter>
  )
}
