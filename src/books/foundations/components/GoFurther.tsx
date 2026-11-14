const LINKS = [
  {
    name: 'The Missing Semester of Your CS Education (MIT)',
    href: 'https://missing.csail.mit.edu/',
    description: 'the shell, git and tools most courses skip',
  },
  {
    name: 'Software Carpentry: Version Control with Git',
    href: 'https://swcarpentry.github.io/git-novice/',
    description: 'git for researchers, step by step',
  },
  {
    name: 'Happy Git and GitHub for the useR',
    href: 'https://happygitwithr.com/',
    description: 'git and GitHub from RStudio',
  },
  {
    name: 'What They Forgot to Teach You About R',
    href: 'https://rstats.wtf/',
    description: 'projects, paths and a setup that travels',
  },
  {
    name: 'CodeRefinery lessons',
    href: 'https://coderefinery.org/lessons/',
    description: 'collaborating with git, reproducible research',
  },
]

export function GoFurther() {
  return (
    <section aria-labelledby="go-further-heading" className="mx-auto max-w-3xl">
      <h2 id="go-further-heading" className="mb-3 text-lg font-semibold">
        Go further
      </h2>
      <ul className="divide-y rounded-xl border">
        {LINKS.map(({ name, href, description }) => (
          <li key={href} className="p-4">
            <a href={href} target="_blank" rel="noreferrer" className="font-medium underline-offset-4 hover:underline">
              {name}
            </a>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
