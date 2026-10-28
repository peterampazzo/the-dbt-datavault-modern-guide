import { useState } from 'react'
import { Chapter } from '@/components/Chapter'
import { CodeBlock } from '@/components/CodeBlock'
import { ChapterHeader, Code, Section } from '@/components/Prose'
import { Term } from '@/components/Term'
import { SNIPPETS } from '@/lib/dv/models'
import { EMAIL_HASHDIFFS } from '@/lib/primer/email-hashdiffs'
import { PRIMER } from '@/lib/primer/project'
import { cn } from '@/lib/utils'

const CHANGE_STEPS = [
  {
    title: 'Create a branch',
    description: 'Start the change on its own branch.',
  },
  {
    title: 'Add the email payload',
    description: 'Add c_email to the customer satellite payload in the model catalog.',
  },
  {
    title: 'Open a pull request',
    description: 'The pull request shows the YAML change before it reaches the shared branch.',
  },
  {
    title: 'CI catches a missing hashdiff column',
    description: 'CI compares two stage hashdiffs. The expected values differ, but the stage returns the same value for both because c_email is missing from hd_customer_n_s.',
  },
  {
    title: 'Fix the stage hashdiff',
    description: 'Add c_email to hd_customer_n_s in the stage YAML. The stage hashes now match both expected values, so CI passes.',
  },
  {
    title: 'Review the vault YAML',
    description: 'A reviewer checks that the payload and hashdiff column lists agree.',
  },
  {
    title: 'Merge and deploy',
    description: 'After merge, the deployment job builds the production target.',
  },
  {
    title: 'Revert if needed',
    description: 'A revert is a new change with its own pull request and deployment.',
  },
] as const

function ChangePlayer() {
  const [step, setStep] = useState(0)
  const current = CHANGE_STEPS[step]

  return (
    <div className="space-y-4">
      <ol aria-label="Change workflow steps" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {CHANGE_STEPS.map((item, index) => (
          <li
            key={item.title}
            aria-current={step === index ? 'step' : undefined}
            className={cn(
              'rounded-lg border px-3 py-2 text-sm',
              step === index ? 'border-sky-600 bg-sky-500/10' : 'bg-card/50',
            )}
          >
            <span className="mr-1 font-mono text-xs text-foreground">{index + 1}.</span>
            {item.title === 'Open a pull request' ? <Term id="pull-request">{item.title}</Term> : item.title}
          </li>
        ))}
      </ol>
      <section aria-live="polite" aria-label={`Step ${step + 1}: ${current.title}`} className="min-h-32 border-t pt-6">
        <h3 className="font-semibold">Step {step + 1} of {CHANGE_STEPS.length} · {current.title}</h3>
        <p className="mt-2 max-w-3xl text-sm leading-6">{current.description}</p>

        {step === 0 && (
          <CodeBlock title="Terminal" code="git switch -c add-customer-email" lang="bash" />
        )}

        {step === 1 && (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <CodeBlock title={PRIMER.email_payload_before.path} code={PRIMER.email_payload_before.code} lang="yaml" />
            <CodeBlock title={PRIMER.email_payload_after.path} code={PRIMER.email_payload_after.code} lang="yaml" />
          </div>
        )}

        {step === 2 && (
          <div className="mt-4 rounded-lg border bg-background p-4">
            <p className="text-sm font-semibold">Pull request · Add customer email to the satellite payload</p>
            <p className="mt-2 text-sm leading-6">The diff is reviewable before CI builds the changed model and its downstream nodes.</p>
            <CodeBlock title={PRIMER.email_payload_after.path} code={PRIMER.email_payload_after.code} lang="yaml" />
          </div>
        )}

        {step === 3 && (
          <div className="mt-4 space-y-3">
            <CodeBlock
              title="CI · throwaway target"
              code="dbt build --select state:modified+ --defer --state prod-artifacts/ --target ci"
              lang="bash"
            />
            <div role="status" className="rounded-lg border border-red-700/50 bg-red-500/5 p-3">
              <strong className="text-red-800 dark:text-red-300">CI unit test: FAIL</strong>
              <p className="mt-1 text-sm leading-5">
                The test expects distinct stage hashdiffs, but without c_email both source rows produce {EMAIL_HASHDIFFS[0].actualWithoutEmail}.
              </p>
            </div>
            <div aria-label="Failing stage hashdiff comparison" className="rounded-lg border bg-background p-3">
              <p className="text-sm font-semibold">Failing diff · expected vs actual</p>
              <ul className="mt-2 space-y-2 text-xs">
                {EMAIL_HASHDIFFS.map((row) => (
                  <li key={row.ldts}>
                    <span className="font-mono">{row.ldts}</span>
                    <p>Expected: <code className="break-all">{row.expected}</code></p>
                    <p>Actual without c_email: <code className="break-all">{row.actualWithoutEmail}</code></p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="max-h-64 overflow-auto rounded-lg">
              <CodeBlock title={PRIMER.email_version_unit_tests.path} code={PRIMER.email_version_unit_tests.code} lang="yaml" />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="mt-4 space-y-3">
            <CodeBlock title={PRIMER.email_hashdiff_fix.path} code={PRIMER.email_hashdiff_fix.code} lang="yaml" />
            <div role="status" className="rounded-lg border border-emerald-700/50 bg-emerald-500/5 p-3">
              <strong className="text-emerald-800 dark:text-emerald-300">Fix commit · CI unit test: PASS</strong>
              <p className="mt-1 text-sm leading-5">
                With c_email in the stage hashdiff, the expected outputs are {EMAIL_HASHDIFFS[0].expected} and {EMAIL_HASHDIFFS[1].expected}; both rows now match.
              </p>
            </div>
          </div>
        )}

        {step === 5 && (
          <blockquote className="mt-4 max-w-2xl rounded-xl border border-sky-600 bg-sky-500/5 px-4 py-3 text-sm">
            “payload and hashdiff columns match”
          </blockquote>
        )}

        {step === 6 && (
          <div className="mt-4 space-y-3">
            <p className="text-sm">Merge the reviewed change; the deploy job builds the production target.</p>
            <CodeBlock title="Deployment job" code="dbt build --target prod" lang="bash" />
          </div>
        )}

        {step === 7 && (
          <div className="mt-4 space-y-3">
            <CodeBlock title="Rollback change" code="git revert <sha>" lang="bash" />
            <p className="text-sm leading-6">Open a new pull request for the revert, run checks, then deploy the reviewed result.</p>
          </div>
        )}
      </section>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50">
          Prev
        </button>
        <button type="button" onClick={() => setStep((value) => Math.min(CHANGE_STEPS.length - 1, value + 1))} disabled={step === CHANGE_STEPS.length - 1} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50">
          Next
        </button>
        <button type="button" onClick={() => setStep(0)} className="rounded-lg border px-3 py-2 text-sm">
          Reset
        </button>
      </div>
    </div>
  )
}

function Targets() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <div className="max-h-[28rem] overflow-auto rounded-xl">
        <CodeBlock title={PRIMER.profiles.path} code={PRIMER.profiles.code} lang={PRIMER.profiles.lang} />
      </div>
      <div className="space-y-3">
        {[
          ['dev', 'A developer runs and inspects changes in a personal target.'],
          ['ci', 'The pull-request workflow builds and tests in a throwaway target.'],
          ['prod', 'The deployment job builds the reviewed change against production.'],
        ].map(([target, description]) => (
          <div key={target} className="rounded-xl border bg-card/50 p-4">
            <h3 className="font-mono font-semibold">{target}</h3>
            <p className="mt-1 text-sm leading-6">{description}</p>
          </div>
        ))}
        <p className="text-sm leading-6">
          Values passed to <Code>env_var()</Code> come from the environment; this example contains no credentials. Profile output settings are adapter-specific.
        </p>
      </div>
    </div>
  )
}

function ReviewerChecklist() {
  const checks = [
    'Business keys identify the intended hub or link.',
    'The satellite hashdiff columns match its payload.',
    'rsrc and ldts are present and describe source and load time.',
    'Staging does not contain business rules.',
    'Tests cover the changed model behavior.',
    'Raw-vault models use full_refresh: false until replay is safe.',
  ]

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <ul aria-label="Vault YAML reviewer checklist" className="space-y-3">
        {checks.map((item) => (
          <li key={item} className="flex gap-3 rounded-lg border bg-card/50 p-3 text-sm leading-6">
            <span aria-hidden className="font-semibold text-emerald-800 dark:text-emerald-300">✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <div className="max-h-64 overflow-auto rounded-xl">
        <CodeBlock title="models/guide/raw_vault · dbt_project.yml" code={SNIPPETS.dbt_project_raw_vault.code} lang="yaml" />
      </div>
    </div>
  )
}

function SlimCi() {
  return (
    <div className="space-y-4">
      <CodeBlock
        title="Pull-request build · isolated target"
        code="dbt build --select state:modified+ --defer --state prod-artifacts/ --target ci"
        lang="bash"
      />
      <dl className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border bg-card/50 p-4">
          <dt className="font-mono font-semibold">state:modified+</dt>
          <dd className="mt-1 text-sm leading-6">Selects resources changed since the saved manifest and the downstream nodes marked by the trailing <Code>+</Code>.</dd>
        </div>
        <div className="rounded-lg border bg-card/50 p-4">
          <dt className="font-mono font-semibold">--defer --state prod-artifacts/</dt>
          <dd className="mt-1 text-sm leading-6">Can resolve refs for unselected upstream nodes to the saved manifest when those relations are absent from the CI target; selected changed nodes build there.</dd>
        </div>
      </dl>
      <p className="max-w-3xl text-sm leading-6">
        This can avoid rebuilding eligible unselected upstream models, so CI may do less work and finish sooner. It does not promise a fixed duration: runtime still depends on the project, data, adapter, warehouse and checks.
      </p>
      <p className="text-sm leading-6">
        See dbt’s official{' '}
        <a href="https://docs.getdbt.com/reference/node-selection/methods#the-state-method" target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-2">state selection</a>
        {' '}and{' '}
        <a href="https://docs.getdbt.com/reference/node-selection/defer" target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-2">defer</a>
        {' '}documentation for selector and reference-resolution details.
      </p>
    </div>
  )
}

export default function ModernWay() {
  return (
    <Chapter>
      <ChapterHeader
        title="Working the modern way"
        lead="Follow one customer email change from a branch through tests, review, merge and deployment."
      />

      <Section
        title="Change player"
        lead="Step through a payload change, the failing unit test, its fix and deployment; nothing advances until you choose."
        keyPoint="A reviewed, tested change moves through git and CI before it is deployed."
      >
        <p className="mb-4 max-w-[75ch]">Continuous integration and delivery (<Term id="ci-cd">CI/CD</Term>) runs checks before a reviewed change is deployed.</p>
        <ChangePlayer />
      </Section>

      <Section
        title="Targets"
        lead={<>Compare dev, ci and prod outputs, then see who runs each <Term id="target">target</Term>.</>}
        keyPoint="The target changes the connection and output location; it does not change the model's business rules."
      >
        <Targets />
      </Section>

      <Section
        title="What a reviewer checks in vault YAML"
        lead="Use this short checklist to review the keys, history fields, payload and safeguards."
        keyPoint="A satellite’s hashdiff input must match the attributes it versions."
      >
        <ReviewerChecklist />
      </Section>

      <Section
        title="Slim CI"
        lead="Read the state selector and defer flags, and see why they can reduce CI work without promising a runtime."
        keyPoint="State selection narrows the build; defer can reuse eligible unselected upstream relations from a saved manifest."
      >
        <SlimCi />
      </Section>
    </Chapter>
  )
}
