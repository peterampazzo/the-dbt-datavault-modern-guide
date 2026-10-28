import { useEffect, useState } from 'react'
import type { ThemedToken } from 'shiki/core'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

type Lang = 'sql' | 'yaml' | 'bash'

let highlighterPromise: Promise<import('shiki/core').HighlighterCore> | null = null
function getHighlighter() {
  highlighterPromise ??= (async () => {
    const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] = await Promise.all([
      import('shiki/core'),
      import('shiki/engine/javascript'),
    ])
    return createHighlighterCore({
      themes: [import('shiki/themes/github-light-default.mjs'), import('shiki/themes/github-dark-default.mjs')],
      langs: [import('shiki/langs/sql.mjs'), import('shiki/langs/yaml.mjs'), import('shiki/langs/bash.mjs')],
      engine: createJavaScriptRegexEngine(),
    })
  })()
  return highlighterPromise
}

interface Props {
  code: string
  lang?: Lang
  title?: string
  highlight?: number[]
  onLineClick?: (line: number) => void
  className?: string
}

export function CodeBlock({ code, lang = 'sql', title, highlight = [], onLineClick, className }: Props) {
  const [tokens, setTokens] = useState<ThemedToken[][] | null>(null)

  useEffect(() => {
    let alive = true
    getHighlighter().then((h) => {
      if (!alive) return
      const res = h.codeToTokens(code, {
        lang,
        themes: { light: 'github-light-default', dark: 'github-dark-default' },
      })
      // github-light comment grey drops below 4.5:1 on highlighted lines
      for (const line of res.tokens)
        for (const t of line) {
          const style = t.htmlStyle as Record<string, string> | undefined
          if (style?.color?.toLowerCase() === '#6e7781') style.color = '#57606a'
        }
      setTokens(res.tokens)
    })
    return () => {
      alive = false
    }
  }, [code, lang])

  const lines = tokens ?? code.split('\n').map((l) => [{ content: l, offset: 0 } as ThemedToken])
  const hl = new Set(highlight)

  return (
    <div className={cn('overflow-hidden rounded-xl border bg-card/60 text-[13px] leading-5 shadow-sm', className)}>
      {title && (
        <div className="flex items-center gap-2 border-b px-4 py-2 font-mono text-xs text-muted-foreground">
          <span className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-rose-400/70" />
            <span className="size-2.5 rounded-full bg-amber-400/70" />
            <span className="size-2.5 rounded-full bg-emerald-400/70" />
          </span>
          {title}
        </div>
      )}
      <pre tabIndex={0} className="overflow-x-auto py-3 font-mono outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
        {lines.map((line, i) => {
          const n = i + 1
          const on = hl.has(n)
          return (
            <motion.div
              key={i}
              onClick={onLineClick ? () => onLineClick(n) : undefined}
              className={cn(
                'relative flex pr-4',
                on && 'border-l border-sky-400 bg-sky-500/10',
                onLineClick && 'cursor-pointer hover:bg-muted/60',
              )}
            >
              <span className={cn('w-10 shrink-0 select-none pr-3 text-right', on ? 'text-foreground/80' : 'text-muted-foreground')}>{n}</span>
              <span className="whitespace-pre">
                {line.map((t, j) => (
                  <span key={j} className="shiki-token" style={t.htmlStyle as React.CSSProperties}>
                    {t.content}
                  </span>
                ))}
                {line.length === 0 && ' '}
              </span>
            </motion.div>
          )
        })}
      </pre>
    </div>
  )
}
