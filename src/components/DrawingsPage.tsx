import { HubLinkSatDrawing } from '@/components/sketch/HubLinkSatDrawing'

export function DrawingsPage() {
  return (
    <article className="mx-auto max-w-[48rem]">
      <header className="mx-auto mb-10 max-w-[40rem]">
        <h1 className="font-serif text-4xl font-semibold tracking-tight">Drawing styles</h1>
        <p className="mt-3 font-serif text-[1.2rem] leading-8 text-muted-foreground">
          The same drawing in two styles. Both are SVG written in code, use the theme colours and keep their labels as real text.
        </p>
      </header>
      <figure className="mb-14">
        <figcaption className="mx-auto mb-3 max-w-[40rem] text-sm font-medium">A · Clean</figcaption>
        <HubLinkSatDrawing variant="clean" />
      </figure>
      <figure className="mb-14">
        <figcaption className="mx-auto mb-3 max-w-[40rem] text-sm font-medium">B · Sketchy</figcaption>
        <HubLinkSatDrawing variant="sketchy" />
      </figure>
    </article>
  )
}
