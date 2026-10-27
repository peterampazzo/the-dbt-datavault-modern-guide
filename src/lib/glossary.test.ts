import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CHAPTERS } from '@/chapters'
import { GLOSSARY } from './glossary'

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? sourceFiles(path) : entry.name.endsWith('.tsx') ? [path] : []
  })
}

describe('glossary and chapter quick checks', () => {
  it('links each glossary term to a registered teaching chapter', () => {
    expect(GLOSSARY.every((entry) => CHAPTERS.some((chapter) => chapter.slug === entry.chapter))).toBe(true)
  })

  it('defines every term id used in JSX', () => {
    const ids = new Set(GLOSSARY.map((entry) => entry.id))
    const uses = sourceFiles(join(process.cwd(), 'src'))
      .flatMap((path) => [...readFileSync(path, 'utf8').matchAll(/<Term\b[^>]*\bid=["']([^"']+)["']/g)])
      .map((match) => match[1])
    expect(uses.length).toBeGreaterThan(0)
    expect(uses.filter((id) => !ids.has(id as (typeof GLOSSARY)[number]['id']))).toEqual([])
  })

  it('gives every registered chapter two or three explained questions', () => {
    for (const chapter of CHAPTERS) {
      expect(chapter.quiz.length, chapter.slug).toBeGreaterThanOrEqual(2)
      expect(chapter.quiz.length, chapter.slug).toBeLessThanOrEqual(3)
      expect(chapter.quiz.every((question) => question.why.trim().length > 0), chapter.slug).toBe(true)
    }
  })
})
