import { Chapter } from '@/components/Chapter'
import { ChapterHeader, Code, P, Section } from '@/components/Prose'
import { Deeper } from '@/books/foundations/components/Deeper'
import { PrivateRepoDrawing } from '@/books/foundations/components/drawing/PrivateRepoDrawing'
import { ShareDrawing } from '@/books/foundations/components/drawing/ShareDrawing'
import { SortFolder } from '@/books/foundations/components/SortFolder'
import { Story } from '@/books/foundations/components/Story'
import { Practice, type Task } from '@/books/foundations/components/shell/Practice'
import { WhyAI } from '@/books/foundations/components/WhyAI'
import { createMessyFs, PROJECT } from '@/books/foundations/lib/shell/fs'
import { EMPTY_GIT, files, ignored } from '@/books/foundations/lib/shell/git'
import { aiChange, aiChanged, createShell, run, type AiScript, type Entry, type ShellState } from '@/books/foundations/lib/shell/shell'

const ran = (s: ShellState, test: (e: Entry) => boolean) => s.entries.some((e) => e.ok && test(e))
const attempted = (s: ShellState, test: (e: Entry) => boolean) => s.entries.some(test)
const command = (s: ShellState, input: string) => ran(s, (e) => e.input === input)
const read = (name: string) => (s: ShellState) => ran(s, (e) => e.command === 'cat' && e.event.kind === 'read' && e.event.path === `${PROJECT}/${name}`)

const messy = () => ({ ...createShell(PROJECT), fs: createMessyFs(), git: { ...EMPTY_GIT, uninitialized: true } })

const TIDY_SCRIPT: AiScript = {
  request: 'Get this ready to share: move the key to .env, add a .gitignore, delete report_old.py.',
  writes: {
    '.env': 'SALES_API_KEY=sk-live-7Hq2v9XbP4mN8rT1',
    '.env.example': '# Copy to .env and fill in. .env stays on your machine.\nSALES_API_KEY=',
    'config.py': 'import os\n\n# Read from .env, never typed into the code\nSALES_API_KEY = os.environ["SALES_API_KEY"]',
    '.gitignore': '# Local secrets\n.env\n# Large source exports\ndata/raw/\n# Rebuildable reports\noutput/\n# Python bytecode\n__pycache__/',
  },
  removes: ['report_old.py'],
}

const README_SCRIPT: AiScript = {
  request: 'Write a README and a requirements.txt so a teammate can run this.',
  writes: {
    'README.md':
      '# orders-report\n\n1. Install: pip install -r requirements.txt (or open report.R in RStudio)\n2. Copy .env.example to .env and fill in the key\n3. Run: python3 report.py or Rscript report.R\nThe raw export is in the team drive, in Sales/exports.',
    'requirements.txt': "# report.py uses only Python's standard library\n",
  },
}

const tidied = () => aiChange(run(messy(), 'git init'), TIDY_SCRIPT)
const documented = () => aiChange(tidied(), README_SCRIPT)
const committed = () => run(run(documented(), 'git add .'), 'git commit -m "First working version"')

const tasks: Record<string, Task[]> = {
  look: [
    { label: <>List everything in the folder, hidden files too: <Code>ls -a</Code></>, done: (s) => ran(s, (e) => e.input === 'ls -a' && e.event.kind === 'list' && e.event.path === PROJECT) },
    { label: <>Look inside <Code>output</Code>.</>, done: (s) => ran(s, (e) => e.input === 'ls output' && e.event.kind === 'list' && e.event.path === `${PROJECT}/output`) },
    { label: <>Open <Code>config.py</Code>. What is in there?</>, done: read('config.py') },
  ],
  tidy: [
    { label: <>Make the folder a repository: <Code>git init</Code>.</>, done: (s) => ran(s, (e) => e.input === 'git init' && e.output.startsWith('Initialized empty Git repository')) },
    { label: <>Ask git what it would share: <Code>git status</Code>.</>, done: (s) => ran(s, (e) => e.input === 'git status' && e.output.includes('config.py') && e.output.includes('output/')) },
    { label: <>Ask your AI tool to tidy up.</>, done: (s) => aiChanged(s, TIDY_SCRIPT) },
    {
      label: <>Run git status again: <Code>config.py</Code> is still there, but <Code>.env</Code>, output and the raw data are gone from the list.</>,
      done: (s) =>
        s.entries.some(
          (e, i) =>
            e.input === 'git status' &&
            i > s.entries.findIndex((entry) => entry.command === 'ai') &&
            e.output.includes('config.py') &&
            !e.output.includes('output/') &&
            !e.output.includes('data/raw') &&
            !e.output.includes('orders_full_export.csv') &&
            !/\t\.env\n/.test(e.output),
        ),
    },
  ],
  readme: [
    { label: <>Read the README.</>, done: read('README.md') },
    { label: <>Read <Code>requirements.txt</Code>.</>, done: read('requirements.txt') },
    { label: <>Run the report.</>, done: (s) => ran(s, (e) => e.event.kind === 'ran' && e.input === 'python3 report.py') },
  ],
  commit: [
    { label: <>Check what git would save.</>, done: (s) => ran(s, (e) => e.input === 'git status') },
    { label: <>Put the files in the next snapshot: <Code>git add .</Code>.</>, done: (s) => command(s, 'git add .') && Object.keys(files(s.fs!)).every((f) => ignored(files(s.fs!), f) || f in (s.git?.index ?? {})) },
    { label: <>Take the first snapshot with a note.</>, done: (s) => s.git?.commits.some((c) => c.message === 'First working version') ?? false },
    { label: <>List the snapshots.</>, done: (s) => ran(s, (e) => e.input === 'git log --oneline') },
  ],
  push: [
    { label: <>Try to push before git knows where to: <Code>git push</Code>.</>, done: (s) => attempted(s, (e) => e.input === 'git push' && e.output.includes('No configured push destination')) },
    { label: <>Connect the repository: <Code>git remote add origin …</Code>.</>, done: (s) => Boolean(s.git?.remote) },
    { label: <>Push: <Code>git push -u origin main</Code>.</>, done: (s) => Boolean(s.git?.pushed) },
    { label: <>Push again: nothing new, so <Code>Everything up-to-date</Code>.</>, done: (s) => ran(s, (e) => e.input === 'git push' && e.output === 'Everything up-to-date') },
  ],
  breaks: [
    { label: <>Get “not a git repository” by running <Code>git status</Code> before init.</>, done: (s) => attempted(s, (e) => e.input === 'git status' && e.output.startsWith('fatal: not a git repository')) },
    { label: <>After init, try a commit with nothing staged and read the no-commits message.</>, done: (s) => attempted(s, (e) => e.input.startsWith('git commit') && e.output.includes('nothing to commit')) },
    { label: <>After init, try <Code>git push</Code> without a remote.</>, done: (s) => attempted(s, (e) => e.input === 'git push' && e.output.includes('No configured push destination')) },
  ],
}

export default function ShareYourProject() {
  return (
    <Chapter>
      <ChapterHeader
        title="Share your project"
        lead="You built something with an AI tool. It works on your laptop. Now your team needs it. Where do you put it, and how?"
      />
      <Section title="Where should the code live?" keyPoint="Code goes in a git repository, which can be private. Sync folders copy files; git keeps who changed what, and why.">
        <Story course="02806">
          Three of us, one shared folder. By the end it held <Code>useful_functions.ipynb</Code> and <Code>useful_functions-2.ipynb</Code>, and they were not the same. Which one was right? Nobody could say.
        </Story>
        <P>
          The usual way to share is to zip the folder and email it, drop it in Google Drive or Dropbox, or paste the code in the group chat. Each one works for a day. Then there are three versions, a “conflicted copy”, and nobody knows who changed what.
        </P>
        <ShareDrawing />
        <P>
          A <strong>repository</strong> on GitHub (or GitLab) is a shared folder with a memory: every change has an author, a date and a note, and you can see the exact lines. And it does not have to be public. A private repository is visible only to the people you invite.
        </P>
        <Practice id="s1-look" cwd={PROJECT} start={messy} tasks={tasks.look} tree chips={['ls -a', 'ls output', 'cat config.py', 'ls data/raw']} />
        <P>That folder mixes four kinds of things: code, data, generated output, and a password. Only one of them belongs in the repository as it is.</P>
        <WhyAI>AI tools produce files fast, including copies, outputs and keys pasted into code. Before sharing, look at what is actually in the folder.</WhyAI>
        <Deeper title="Isn't GitHub public?">
          <p>
            Public and private are a setting on each repository. Private repositories are free on GitHub, and students get extras through the GitHub Student Developer Pack. Universities and companies often run their own GitHub or GitLab organisation, where repositories are private to members by default.
          </p>
        </Deeper>
      </Section>
      <Section title="Sort the folder" keyPoint="Code and settings go in git. Data goes in a data store. Output can be rebuilt. Secrets never leave your machine.">
        <Story course="02476">
          The images we trained on were 1.1 GB in 87,036 files. They did not go in git. Git held a tiny file, <Code>data.dvc</Code>, saying where the data was, and a tool called DVC downloaded it.
        </Story>
        <SortFolder />
        <P>Drive is fine for the big data, the slides and the final PDF. Code, settings and notebooks go in git.</P>
        <WhyAI>You can ask the tool to do the sorting. You still need to know what the right answer looks like, to check it.</WhyAI>
      </Section>
      <Section title="Get the secrets out" keyPoint=".gitignore lists what git must leave alone. The key goes in .env, and .env goes in .gitignore.">
        <P>
          First make the folder a repository, and ask git what it would share. Then ask your AI tool to tidy up, and ask git again.
        </P>
        <Practice
          id="s3-tidy"
          cwd={PROJECT}
          start={messy}
          tasks={tasks.tidy}
          git
          ai={TIDY_SCRIPT}
          chips={['git init', 'git status', 'cat .gitignore', 'cat config.py']}
        />
        <P>
          Before, <Code>git status</Code> listed the key, the output and the raw data. Now it lists only what should be shared. Always read this list before your first snapshot.
        </P>
        <WhyAI>
          Secrets never go in the code, the repository or the prompt. If <Code>git status</Code> shows <Code>.env</Code>, stop.
        </WhyAI>
      </Section>
      <Section title="Write down how to run it" keyPoint="A README and a list of packages turn “it works on my laptop” into “it works on yours”.">
        <Story course="02476">
          Our README began with two commands: <Code>conda env create --file=environment.yml</Code> and <Code>conda activate mlops</Code>. Anyone joining ran those, and had the same setup as everyone else.
        </Story>
        <Practice id="s4-readme" cwd={PROJECT} start={tidied} tasks={tasks.readme} git ai={README_SCRIPT} chips={['cat README.md', 'cat requirements.txt', 'python3 report.py']} />
        <P>Three steps any teammate can follow, including where the data is. Part IV shows how to pin package versions so the setup really is the same.</P>
      </Section>
      <Section title="Take the first snapshot" keyPoint="git add . then git commit saves the first version. Check git status first, every time.">
        <Practice id="s5-commit" cwd={PROJECT} start={documented} tasks={tasks.commit} git chips={['git status', 'git add .', 'git commit -m "First working version"', 'git log --oneline']} />
        <P>Module 4 explains snapshots in detail. For now: one snapshot, with a note that says what it is.</P>
      </Section>
      <Section title="Put it on GitHub, privately" keyPoint="Create a private repository, connect it with git remote add, then git push.">
        <PrivateRepoDrawing />
        <Practice
          id="s6-push"
          cwd={PROJECT}
          start={committed}
          tasks={tasks.push}
          git
          chips={['git push', 'git remote add origin https://github.com/your-team/orders-report.git', 'git push -u origin main', 'git push']}
        />
        <P>
          The first <Code>git push</Code> failed because git did not know where to send it. Once it was connected, one command shared the whole history. Your teammates now run <Code>git clone</Code> with the same address, and they get every file and every snapshot.
        </P>
        <WhyAI>Tools like Lovable or Codex can create the repository and push for you. Check it is Private before the first push. A key pushed to a public repository is found by bots within minutes.</WhyAI>
        <Deeper title="Signing in from the terminal">
          <p>GitHub no longer accepts your password in the terminal. Use the GitHub CLI (<Code>gh auth login</Code>), an SSH key, or the sign-in window VS Code opens for you.</p>
        </Deeper>
      </Section>
      <Section title="When it breaks" keyPoint="Read the first line of the error: it says what git is missing.">
        <P>Three messages you will meet the first time you share a project.</P>
        <Practice id="s7-breaks" cwd={PROJECT} start={messy} tasks={tasks.breaks} git chips={['git status', 'git init', 'git commit -m "First version"', 'git push']} />
        <P>
          <Code>not a git repository</Code>: the folder is not a repository yet, or you are in the wrong folder. Run <Code>pwd</Code>, then <Code>git init</Code>. <Code>No configured push destination</Code>: git does not know where GitHub is; add the remote. And if a key ever reaches GitHub, deleting the file is not enough. Cancel the key and make a new one.
        </P>
      </Section>
    </Chapter>
  )
}
