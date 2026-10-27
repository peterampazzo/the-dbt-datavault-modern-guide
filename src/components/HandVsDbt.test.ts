import { describe, expect, it } from 'vitest'
import { PATTERNS } from './HandVsDbt'

describe('hand versus dbt dialect patterns', () => {
  it('keeps the expected highlight tags in both dialects', () => {
    const expected: Record<keyof typeof PATTERNS, string[]> = {
      hub: ['p', 'k', 's'],
      link: ['p', 'k', 's'],
      sat: ['p', 'k', 'd', 's', 'x'],
    }
    for (const [name, pattern] of Object.entries(PATTERNS) as [keyof typeof PATTERNS, (typeof PATTERNS)[keyof typeof PATTERNS]][]) {
      for (const lines of [pattern.hand, pattern.tsql]) {
        const tags = new Set(lines.map(([tag]) => tag))
        for (const tag of expected[name]) expect(tags).toContain(tag)
      }
    }
  })

  it('marks every T-SQL c_email line as an extra-column line', () => {
    for (const [tag, line] of PATTERNS.sat.tsql) {
      if (line.includes('c_email')) expect(tag).toBe('x')
    }
    expect(PATTERNS.sat.tsql.filter(([tag, line]) => tag === 'x' && line.includes('c_email')).length).toBeGreaterThan(0)
  })
})
