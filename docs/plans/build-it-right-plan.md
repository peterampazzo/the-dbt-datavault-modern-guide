# Build it right: full plan

Status: agreed. PR A (this move) puts the Data Vault guide at `/#/datavault/`. A module 1 prototype exists on a local branch (`proto/production-module-1`).

---

## 0. In one page

- **What:** one website, *Build it right*, that holds several books. The existing Data Vault guide becomes one book. A new book, working title *Foundations*, teaches what AI coding tools (Claude Code, Codex, Cursor, Lovable) do under the hood and how to handle the code they produce: the terminal, git, reproducible setup, CI and troubleshooting.
- **Who:** the new book is written for students who are not programmers and want to use AI tools seriously, at any university and in any degree. Technical students read the same core and open the optional "Go deeper" pages. The mentee is a reader.
- **How it feels:** nothing to install at the start. Each page has a practice terminal in the browser, a drawing that reacts to what you type, one task, a few sentences, and a "Why it matters with AI tools" box. Real setup on your own machine comes later and is optional for non-programmers.
- **Voice:** "for dummies". Every page starts from a real moment in Pietro's DTU group projects (section 2.7), says the idea in plain words with something the reader already knows (Track Changes, Google Docs version history, `report_v2_FINAL_final.xlsx`), and only then names the technical term. About 100 words of core text per page; every task can be done by tapping chips, so the book works on a phone.
- **How it is built:** the current repo is renamed to `build-it-right` and becomes one Vite app with a bookshelf at `/`, each book under its own path, and shared parts (drawing kit, practice terminal, quick checks, reading mode) used by every book.
- **Order of work:** restructure the repo with no visible change (PR A to C), then the Foundations shell and module 1 (PR D), then one PR per module. About 10 to 12 Devin sessions for the MVP book (section 10).

---

## 1. The bookshelf

### 1.1 Books

| Book | Path | Reader | Status |
|---|---|---|---|
| Foundations: shipping code in the age of AI tools (working title) | `/#/foundations/` | Non-programmers first, technical students via "Go deeper" | New |
| The dbt + Data Vault guide | `/#/datavault/` | Data and analytics engineers | Existing, unchanged content |

Later books cost little once the shared parts exist (ideas, not commitments: SQL for analysts, dbt for analysts). Foundations comes first on the shelf because it is the entry point; the Data Vault book is the natural "next book" for readers who go into data.

### 1.2 Each book stands alone

Each book has its own:

- cover, contents, part and chapter numbering, recap pages and progress;
- glossary (shared `Term` component, separate term lists);
- scope rule in `AGENTS.md` (the Data Vault rule 11 stays as strict as today; Foundations gets its own, section 2.2);
- example data. Foundations gets its own copy of the small customer/nation/orders sales data inside its own `data.ts`, so the books can change independently. The values start identical to the Data Vault dataset, which keeps a bridge for readers who move on.

The only links between books: the shelf page, and an optional "Next book" card on the last recap.

### 1.3 Shared parts

| Part | Today | Used by |
|---|---|---|
| `Chapter`, `Section`, `ChapterHeader`, pager, recap, reading mode | `src/components/` | All books |
| Drawing kit (`Card`, `Line`, `Badge`, `Mono`, `Small`, `Note`, `Drawing`) | `src/components/drawing/kit.tsx` | All books |
| Quick check, `Term`, glossary page | `src/components/` | All books, per-book term lists |
| Practice terminal (shell engine, `Terminal`, `FolderTree`, `Practice`) | prototype | Foundations; available to others |
| Learning design rules, UX audit | `docs/knowledge/` | All books |

---

## 2. The Foundations book

### 2.1 Goal

AI tools write more and more of the code. Whoever ships it still owns it. A reader who finishes the core path can open a project an AI tool made, run it, see what the tool changed, undo a bad change, explain why a check on a pull request is red, and keep secrets out of the code. They know the words to describe a problem to an engineer or to the tool.

One idea runs through the book: the tools do the same things you can do by hand.

| What the tool does | What is happening | Part |
|---|---|---|
| Claude Code, Codex CLI or Cursor asks "Run `npm test`?" | A program running commands in a terminal, in a folder | I. The terminal |
| Lovable "syncs to GitHub"; Codex opens a pull request | Commits on a branch in a git repository | II. Git |
| "It works in the preview but not on my laptop" | Another machine with different versions and settings | III. Reproducible setup |
| A red cross appears on the AI's pull request | CI ran the same commands on someone else's machine | IV. Automation |
| The tool goes in circles fixing its own bug | Nobody read the first error | V. Troubleshooting |

### 2.2 Scope rule

Every page must teach the shell, git, a reproducible setup, CI, or how to troubleshoot one of them, and say why it matters when an AI tool does the work. No page teaches how to prompt a specific tool, compares tools, or teaches Python or R syntax: tools change fast, the ideas underneath do not. Link out instead.

| In scope | Out of scope |
|---|---|
| Shell: folders, files, running a program, PATH, environment, exit codes | Prompting guides, tool comparisons, pricing |
| Git: commits, diffs, branches, PRs, undo | Cloud, Kubernetes, infrastructure as code |
| Lockfiles (uv, renv), one-command run, containers, config and secrets | Writing Python or R, web frameworks, databases |
| GitHub Actions: checks on PRs, scheduled jobs | Deployment beyond GitHub Pages |
| Troubleshooting each of the above | Company specific material |

### 2.3 Readers

| Reader | Starts with | Path |
|---|---|---|
| S1 Non-programmer student (main) | Excel, maybe a statistics course, has tried ChatGPT or Lovable. Any OS. | Core pages; "Bring it home" optional |
| S2 Technical student (BSc or MSc) | Python or R from a course, an IDE or RStudio | Core plus "Go deeper", "Bring it home", broken labs |
| S3 The mentee | Like S1 | Like S1, as a reader |

### 2.4 Page template

Every section page has the same shape, so an interrupted reader always knows where they are:

0. **From DTU:** a short box with a real moment from Pietro's 02806 or 02476 project (`Story` component), linking the repository.
1. Title, then the idea in one or two plain sentences.
2. Task list (one to three tasks) and the practice terminal, with the reacting drawing beside it on wide screens and below it on phones.
3. Three to five sentences.
4. **Why it matters with AI tools:** one short box tying the page to what the reader will see in Claude Code, Codex, Cursor or Lovable.
5. **Go deeper** (collapsed by default, a new `Deeper` component): details for S2. Collapsed content is still in the page for search and screen readers. The learning design rule "content visible by default" applies to the core; this is an explicit, labelled exception to be added to `learning-design.md`.
6. Key point.

Each chapter ends with "When it breaks" (two or three real errors and how to read them) and the optional quick check on its recap page.

### 2.5 House rules for AI-written code

The book's practical takeaway, one or two rules per part, collected on a printable cheat sheet at the end:

1. Know where it runs: which folder, which machine. Run `pwd` before you trust an error. (I)
2. Read a command before you approve it. `rm -rf`, `curl ... | sh` and `sudo` get a second look. (I)
3. Everything lives in git. Commit before you let a tool loose. (II)
4. Small changes, one idea each. If you can't explain the diff, don't merge it. (II)
5. Pin versions: a lockfile in the repo makes every machine install the same thing. (III)
6. Secrets never go in the code, the repo or the prompt. (III)
7. Every change goes through CI, the AI's included. Green is the minimum, not the proof. (IV)
8. When it breaks, read the first error yourself, then give the tool the error, the command and what you expected. (V)

### 2.6 The running project

`orders-report`: three small CSVs (customers, nations, orders) and the same report twice, `report.py` and `report.R`, printing orders and revenue per nation. The reader picks Python or R once; the choice is remembered. Revenue is business data on purpose: when an AI edit moves the number, any reader sees why it matters. The DTU projects are the story (section 2.7); `orders-report` stays the hands-on project.

What the project contains as the book goes on (in the practice terminal first; in the real template repo from "Bring it home"):

| After | The project has |
|---|---|
| Part I | data, `report.py`, `report.R`, `README.md`, `tests/` |
| Part II | a git history, `.gitignore`, a branch and a merged PR |
| Part III | `pyproject.toml` + `uv.lock` or `renv.lock`; `Makefile` (`make run`, `make test`); `.env.example`; a `Dockerfile` (Go deeper) |
| Part IV | `.github/workflows/ci.yml`, tests and lint as required checks, a scheduled run publishing the report |
| Part V | nothing new: broken copies to fix |

### 2.7 The story

The book follows Pietro through two real DTU group projects, both public on GitHub. They show the same student before and after, and their histories already hold the problems the book solves. Teammates are never named; they are "a teammate".

- **02806 Social Data Analysis and Visualization** (spring 2021, 3 students, [repo](https://github.com/peterampazzo/dtu-02806)): notebooks, 6 commits all on a single day, `useful_functions.ipynb` next to `useful_functions-2.ipynb`, a two-line `requirements.txt`, setup living in Deepnote. The "before".
- **02476 Machine Learning Operations** (January 2022, 4 students, two weeks, [repo](https://github.com/peterampazzo/dtu-02476)): 210 commits, 22 pull requests, one branch per feature, pre-commit hooks, a lint check on every PR, pinned `requirements.txt` and `environment.yml`, `.env.example`, Docker images built by GitHub Actions and run on Google Cloud. The "after".

The five things the book teaches, each with the real moment that opens it:

| Part | Problem | Real moment |
|---|---|---|
| I. Work on a codebase (terminal) | "I've got the project. Where is everything and how do I run it?" | `python3 src/data/make_dataset.py data/raw data/processed` only works from the top folder; the Makefile says `python3`, the Docker script says `python` |
| II. Check other people's code (git) | "A teammate, or the AI, changed it and the number moved. What changed? Do I accept it?" | `useful_functions-2.ipynb`; the commit "Fixing accuracy calculations"; one branch and PR per feature |
| III. Test it automatically (CI) | "Every push must still work, without me checking by hand." | lint check on every PR; "fixed isort-black conflict" and "Revert 'set isort with black profile'" |
| IV. Same setup everywhere | "It works on my laptop, not on yours." | the commit "add google-cloud to requirements.txt"; `.env.example` with `WANDB_API=` and `GC_KEY=` |
| V. Run it remotely (Docker) | "It has to run on a server, not my laptop." | 87,000 training images; `train.dockerfile` built by GitHub Actions and run on Google Cloud; "fix docker file", "fix entrypoint filename" |

Troubleshooting stays a "When it breaks" page at the end of every module, plus the labs at the end.

---

## 3. Modules

Times are core-path estimates. **MVP** marks the first release. For each module: the task in the practice terminal, the drawing, why it matters with AI tools, what goes into "Go deeper", and "When it breaks".

### Part I. The terminal

**1. Where am I?** (8 min, MVP, prototype built)
- Task: `pwd`, `ls`, `ls data`, `cd data`, `cd ..`, `cat`, `head`, `wc -l`.
- Drawings: the prompt part by part (built); folder tree with a moving "you are here" pin and a relative/absolute route finder (built); anatomy of a command (built).
- Why it matters: an agent runs every command inside a folder. Most "file not found" errors mean the wrong folder.
- Go deeper: hidden files and `ls -la`, `~` and `/` in detail, Tab completion tips.
- When it breaks: wrong folder, wrong case (`Data` vs `data`), path doubled from inside the folder (built).

**2. Running a program** (10 min, MVP)
- Task: run the report in Python or R; see output and an error; check `$?`; `which python3`; run two commands with `&&`.
- Drawing: what happens when you press Enter (split the line, find the program on PATH, run it, get an exit code). The same picture with an AI agent pressing Enter.
- Interactive "Approve or not": three commands an agent asks to run (`make test`, `rm -rf data`, `curl ... | sh`); the reader decides which ones deserve a second look and gets feedback.
- Why it matters: this is what the approval prompt in Claude Code, Codex or Cursor is asking.
- Go deeper: stdout vs stderr, `>` and `2>`, environment variables and `export`.
- When it breaks: `command not found`, `python` vs `python3`, non-zero exit codes.

**3. Text is the interface** (8 min)
- Task: `head` the orders, `grep` one nation, count with `wc -l`, one pipe.
- Drawing: a pipe, each program passing text to the next.
- Why it matters: check data and logs yourself before asking the tool, and paste the right three lines, not three hundred.
- Go deeper: `sort`, `uniq`, redirects, your first script with `set -euo pipefail`.
- When it breaks: a pipe that prints nothing, quoting.

### Part II. Git

**4. Snapshots** (12 min, MVP)
- Opening idea: version control works for any text file, not only code: Python and R, settings files without secrets (`.env.example`), and editor settings (`.vscode/settings.json`, `.vscode/extensions.json`). It shows what changed, keeps every version and lets a group work on the same files. It is old, proven practice that most people never start because it looks complicated.
- Task: `ls -a` and `cat` the hidden settings files; `git status`, `git add`, `git commit`, `git log --oneline`. Then a simulated "the tool changed 2 files" event; the reader uses `git status` and `git diff` to see what changed and spots that the revenue line was edited.
- Same setup everywhere: editor settings in the repo give every colleague, every machine and a new laptop the same setup (VS Code and its forks read `.vscode/`; RStudio uses `.Rproj`). AI instruction files (`AGENTS.md`, `CLAUDE.md`) are versioned the same way.
- Drawing: any text file goes into the history and `git diff` shows the changed lines; one repository giving three machines the same setup, with `.env` staying local. A live panel under the terminal shows folder, staged and history.
- Why it matters: commit before the tool edits, and `git diff` shows exactly what it did.
- Go deeper: `.gitignore`, writing a good commit message, `git show`.
- When it breaks: "nothing to commit", a file not staged, a data file committed by mistake.

**5. Drafts and approvals** (10 min, MVP)
- Task: `git switch -c`, commit on the branch, a drawn pull request with the diff and a review comment, merge. One scripted conflict where the reader picks a side.
- Drawing: a branch is a draft; a PR is the approval step before it joins `main`.
- Why it matters: Lovable and Codex work through branches and PRs. The PR is where a person signs off.
- Go deeper: merge vs rebase in one picture, reading a conflict marker, branch protection.
- When it breaks: committing on `main` by mistake, a conflict.

**6. Undo without fear** (8 min, MVP)
- Task: another simulated AI edit breaks the report; the reader throws it away with `git restore`, then undoes a committed change with `git revert`.
- Drawing: restore (not yet committed) vs revert (a new commit that undoes an old one).
- Why it matters: one command to throw away a bad AI change.
- Go deeper: `reset`, `reflog`, why you don't rewrite a shared branch.
- When it breaks: "your local changes would be overwritten", detached HEAD.

**Bring it home** (10 min, optional for S1, required for S2)
- Open a terminal on your own machine: Terminal on macOS, the terminal on Linux, Ubuntu under WSL on Windows. Install git and uv or R. Clone the `orders-report` template, commit, push. Same commands as the practice terminal.
- When it breaks: WSL not enabled, `git` asks for a username, push rejected (authentication).

### Part III. Test it automatically (CI)

**11. CI is a terminal somewhere else** (10 min, MVP)
- Task: push in the practice terminal; a drawn runner checks out the last commit on a fresh machine, runs `make test`, and shows the log step by step and a green or red check on the PR. A file that was never committed makes CI fail even though it works locally.
- Drawing: push, fresh machine, steps in order, first failure stops it, status on the PR.
- Why it matters: the same check runs on your changes and the AI's.
- Go deeper: reading `ci.yml`, `astral-sh/setup-uv` and `r-lib/actions`.
- When it breaks: the failing step, "works locally" because of an uncommitted file.

**12. Checks that stop bad changes** (8 min)
- Task: an AI edit changes the revenue number; all checks stay green; the reader adds one test (filled in for them) and sees the next run catch it.
- Drawing: a required check as a gate before merge.
- Why it matters: tests are how you tell the tool what "correct" means.
- Go deeper: pytest and ruff, or testthat and lintr; pre-commit; Dependabot.

**13. Scheduled jobs** (6 min)
- Task: the report runs every morning at 07:00 and publishes to Pages; the reader reads one scheduled run's log.
- Drawing: a calendar trigger instead of a push.
- Go deeper: artifacts, secrets in CI.

### Part IV. Same setup everywhere

**7. Works on my machine** (10 min, MVP)
- Task: three drawn machines (the AI tool's sandbox, your laptop, CI) install the project; without a lockfile they get different versions and one fails; add the lockfile and all three match.
- Drawing: same code, different machines, with and without a lockfile.
- Why it matters: every AI tool runs your code on a machine you don't see.
- Go deeper: uv, `uv.lock`, `.python-version`; renv, `renv.lock`, pinning R.
- When it breaks: "No module named ...", "there is no package called ...", a lockfile out of date.

**8. One command to run it** (6 min)
- Task: `make run`, `make test`; read the README section that says how to run the project.
- Drawing: one command, three callers (you, the AI, CI).
- Why it matters: tell the tool "run `make test`" instead of hoping it guesses.
- Go deeper: writing a `Makefile` target.
- When it breaks: "No rule to make target", tabs vs spaces.

**9. Config and secrets** (6 min, MVP)
- Task: the report reads a currency from an environment variable; an AI edit pasted an API key into `report.py`; the reader moves it to `.env`, checks `.gitignore`, and sees the drawn "pushed = public" consequence.
- Drawing: where things live: code in git, settings in environment variables, secrets outside both and outside the prompt.
- Why it matters: AI tools often paste a key into the code to make it work; once pushed, it is public.
- Go deeper: secrets in CI, rotating a leaked key.
- When it breaks: a variable that is set in one terminal but not another.

### Part V. Run it remotely

**10. Containers: a box that runs anywhere** (8 min, MVP)
- Task: a drawing-led page with a three-step stepper (recipe, box, run), then `docker run` in the practice terminal starting the report in a simulated container that has its own Python and R, whatever the laptop has.
- Drawing: image vs container; the same container on your laptop, a server and the cloud, the idea behind the hosted previews AI app builders show you.
- Why it matters: "it runs in the container" is the strongest version of "it runs on every machine".
- Go deeper: a `Dockerfile` for the report (`python` or `rocker/r-ver` base), mounting the data folder, devcontainers.
- When it breaks: "No such file" inside the container because the data folder was not mounted.

**10b. Built by CI, run in the cloud** (8 min)
- Task: a drawn pipeline: push, GitHub Actions builds the image, stores it in a registry, a cloud machine runs it with secrets from its own settings, not from the repo.
- Drawing: laptop to registry to cloud.
- Why it matters: this is what "deploy" means when an AI tool offers to do it.
- Go deeper: registries, tags, passing secrets to a container.
- When it breaks: the image builds but the container exits at once (read its logs).

### Part VI. Troubleshooting

**14. A method for when it breaks** (8 min, MVP)
- Task: a red run; the reader clicks the line that explains the failure, reproduces it in the practice terminal, fixes it, and writes a three-line problem report from a template (what I ran, what happened, what I expected).
- Drawing: the loop: read the first error, reproduce, shrink, compare with what worked.
- Why it matters: the same three lines are a good prompt and a good message to an engineer.
- Go deeper: `git bisect`.

**15. Broken labs** (open ended, mostly S2): five broken copies of `orders-report`, each a mess an AI tool can leave behind:
- runs in the tool, not on your laptop: missing package, no lockfile;
- a hard-coded API key committed to the repo;
- `Data/orders.csv` vs `data/orders.csv`: passes on macOS, fails on Linux CI;
- the revenue number changed and every check is green: no test covered it;
- `command not found` after an install (PATH).

**Cheat sheet:** the eight house rules on one page, printable.

MVP: modules 1, 2, 4, 5, 6, 11, 7, 9, 10, 14 (the core of every part, in reading order), plus "Bring it home". About 95 minutes of core reading.

Module numbers are ids, not reading order: after Part II comes Automation (11 to 13), then Same setup everywhere (7 to 9), then Run it remotely (10, 10b). A failing check that turns out to be a missing package is what leads from CI into setup.

---

## 4. The practice terminal

A TypeScript simulation, like the Data Vault engine: no backend, no real shell, pure functions with unit tests. The module 1 engine exists (`src/lib/shell/`, 9 tests).

| Layer | Commands and behaviour | Needed by |
|---|---|---|
| Shell core (built) | `pwd`, `ls [-l]`, `cd`, `cat`, `head`, `wc -l`, `python3`, `Rscript`, `help`, `clear`; Tab completion, history, per-page saved state; errors in the real wording | 1 |
| Shell, more | `$?`, `which`, `echo`, `export`, `&&`, `grep`, a single pipe, `>` | 2, 3 |
| Git | `init`, `status`, `add`, `commit`, `log --oneline`, `diff`, `restore`, `switch -c`, `branch`, `merge` (fast-forward and one scripted conflict), `revert`. Commits are snapshots of the virtual filesystem. | 4 to 6 |
| Scripted events | "The tool changed N files": a fixed edit applied to the filesystem with a visible banner, never a real AI | 4, 6, 9, 12 |
| Setup | `make run`, `make test`, `uv sync` / `renv::restore()` against a modelled lockfile and three machines | 7 to 9 |
| CI runner | replays `make test` on a fresh copy of the last commit (not the working folder), producing a step log and a status | 11 to 15 |

Rules: commands outside the lesson reply "not in this lesson yet"; tasks check the result, not the keystrokes; motion starts only from the reader and respects reduced motion; every reacting drawing has a text equivalent for screen readers.

---

## 5. Site and repo structure

### 5.1 One app, not a workspace

The earlier draft proposed a pnpm workspace with one app per book. One Vite app is simpler for one maintainer: one build, one deploy, one test suite, and shared components without packaging. Books are lazy-loaded, so a Foundations reader never downloads DuckDB-WASM or React Flow. A workspace can still come later if a book needs its own dependencies.

```
src/
  shelf/                 landing page, book registry
  books/
    datavault/           chapters, glossary, dataset, engine, models (moved with git mv)
    foundations/         chapters, glossary, data.ts, house rules
  components/            shared: Chapter, Section, drawing kit, QuickCheck, Term, Deeper
  lib/shell/             practice terminal engine
  lib/ci/                CI runner simulation
docs/
  knowledge/             shared rules (learning design, UX audit) + datavault knowledge
  books/foundations/     scope, sources, house rules
```

### 5.2 Routes

- `/#/` the shelf.
- `/#/datavault/<chapter>/<section>` and `/#/foundations/<chapter>/<section>`; `about` and `glossary` per book.
- Old links keep working: any `/#/<old-chapter-slug>/...` redirects to `/#/datavault/<old-chapter-slug>/...`. A test checks every chapter slug.
- Saved progress keeps its key (`dv-guide-progress`), so no Data Vault reader loses their place. Foundations uses its own keys.

### 5.3 Rename and deploy

1. You rename the repo on GitHub (Settings → General → Repository name → `build-it-right`; my token isn't an admin). GitHub redirects the old URL.
2. PR A updates `package.json` name, README, links, and the Cloudflare project name if you want a new `*.pages.dev` address (optional; the existing one keeps working).
3. CI, preview deploys per PR and release-to-production stay as they are: still one `dist/`.

### 5.4 Tests

- Unit: shell engine, git simulation, CI runner, per-book glossary checks.
- e2e: helpers take a book (`open(page, 'foundations', slug)`); the existing suite runs against `/datavault/`; the axe WCAG 2.2 AA and the overflow/motion audit run on every book. New specs: practice terminal by keyboard only, chips on a phone viewport, reduced motion, saved state after reload, legacy redirects.

---

## 6. PR sequence

Each PR is based on the previous one and merged in order. Lint, unit tests, build and e2e green in every PR.

| PR | Content | Visible change |
|---|---|---|
| A | Move the Data Vault book into `src/books/datavault/` with `git mv`; book-aware routes; legacy redirects; rename references to `build-it-right` | URLs gain `/datavault/`, old ones redirect |
| B | Shelf landing page and book registry; per-book header, about and glossary | New landing page |
| C | Shared `Deeper` component and the learning design rule for it; per-book scope rules in `AGENTS.md` | None |
| D | Foundations shell: cover, contents, data, glossary, house-rules page; practice terminal from the prototype with its tests; module 1 | Foundations book with one module |
| E onward | One PR per module in MVP order: 2, 4, a rewrite of 1, 2 and 4 around the DTU story, 5, 6, Bring it home, 11, 7, 9, 10, 14; then 3, 8, 10, 12, 13, 15 and the cheat sheet | One module each |

The `orders-report` template repo (public, with Python and R, `Makefile`, lockfiles, CI) is created alongside "Bring it home".

---

## 7. Writing

- Chapters stay TSX like the Data Vault book. The earlier MDX idea is dropped: the mentee is a reader, not an author, and one format keeps the rules and tests uniform.
- Voice: plain English, short sentences, no jargon before it is defined. Real moment first, familiar comparison second, technical term last.
- Every term is defined at first use and added to the Foundations glossary.
- Every page is checked against the learning design success criteria S1 to S7 and the UX audit before its PR.

---

## 8. Sources and licensing

Syllabus and "Go deeper" links; our text and exercises are written fresh around `orders-report`.

- DTU MLOps (Apache 2.0): command line, package manager, git, Docker, config files, debugging, unit testing, GitHub Actions, pre-commit. Credited in a NOTICE file if we adapt any exercise.
- Software Carpentry, The Unix Shell (CC BY 4.0): pacing model for Part I.
- MIT, The Missing Semester of Your CS Education.
- Pro Git (Chacon and Straub).
- uv, renv and r-lib/actions documentation.
- Claude Code, Codex, Cursor and Lovable docs only as links, for the mapping in section 2.1.

Case studies ("In a real repo"): the-dbt-datavault-modern-guide (PR flow, CI, preview deploys, releases) and vm-infra (pinned commits, encrypted secrets, guardrails).

---

## 9. Risks

| Risk | Mitigation |
|---|---|
| The simulated terminal drifts from real behaviour | Error messages copied from real tools and checked in tests; "Bring it home" moves readers to the real thing |
| Tool names in the copy go stale | Only in the "Why it matters" boxes and section 2.1; the engine and tasks stay generic ("your AI tool") |
| The git simulation grows into a full git | Fixed command list in section 4; anything else replies "not in this lesson yet" |
| Moving the Data Vault book breaks links or progress | Redirect test for every old slug; progress key unchanged |
| Non-programmers find the later parts too technical | Core pages stay drawing-led with one task; code goes to "Go deeper" |

---

## 10. Effort

Rough, in Devin sessions: PR A to C one to two; PR D one (most of it exists); Parts I and II two to three (git simulation is the biggest piece); Part III one to two; Part IV and V two (CI runner); review and polish one. About 10 to 12 sessions for the MVP, plus your review time per PR.

---

## 11. Decided

- One site, *Build it right*, with separate books; the Data Vault guide becomes one book, content unchanged.
- Foundations is for non-programmer students first; technical students get "Go deeper". Python and R are run, not taught. The mentee is a reader.
- AI tools are the reason for the book, not a topic in it: no tool-specific prompting.
- No install to start; real machine from "Bring it home", optional for non-programmers: Linux and macOS natively, Windows through WSL. No Codespaces.
- Keep this repo and rename it `build-it-right`. Case studies: the Data Vault guide and vm-infra.

## 12. Open questions

1. Book title: *Foundations: shipping code in the age of AI tools*, or something else?
2. MVP set as in section 3, or smaller for a first release?
3. Simulated AI change: generic ("your AI tool changed 2 files", recommended) or a named tool?
4. Should the Cloudflare address change with the rename, or stay as it is?
