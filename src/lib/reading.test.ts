import { describe, expect, it } from 'vitest'
import { CHAPTERS } from '@/chapters'
import { getFirstPathChapter, getNextPathChapter, getPathOrder, getPreviousPathChapter } from './reading'

describe('reading paths', () => {
  it('keeps the full and browse paths in chapter order', () => {
    const defaultOrder = CHAPTERS.map(({ slug }) => slug)
    expect(getPathOrder('full')).toEqual(defaultOrder)
    expect(getPathOrder('browse')).toEqual(defaultOrder)
    expect(getFirstPathChapter('full')).toBe(defaultOrder[0])
  })

  it('orders the practitioner path and exposes adjacent chapters', () => {
    expect(getPathOrder('dv-practitioner')).toEqual(['dv-names', 'dbt-primer', 'dbt', 'load-player', 'replay', 'one-lake', 'modern-way'])
    expect(getFirstPathChapter('dv-practitioner')).toBe('dv-names')
    expect(getNextPathChapter('dv-names', 'dv-practitioner')).toBe('dbt-primer')
    expect(getNextPathChapter('dbt-primer', 'dv-practitioner')).toBe('dbt')
    expect(getNextPathChapter('dbt', 'dv-practitioner')).toBe('load-player')
    expect(getNextPathChapter('load-player', 'dv-practitioner')).toBe('replay')
    expect(getNextPathChapter('replay', 'dv-practitioner')).toBe('one-lake')
    expect(getNextPathChapter('one-lake', 'dv-practitioner')).toBe('modern-way')
    expect(getNextPathChapter('modern-way', 'dv-practitioner')).toBeUndefined()
    expect(getPreviousPathChapter('dbt-primer', 'dv-practitioner')).toBe('dv-names')
    expect(getPreviousPathChapter('dbt', 'dv-practitioner')).toBe('dbt-primer')
    expect(getPreviousPathChapter('modern-way', 'dv-practitioner')).toBe('one-lake')
    expect(getPreviousPathChapter('dv-names', 'dv-practitioner')).toBeUndefined()
    expect(getPreviousPathChapter('one-lake', 'dv-practitioner')).toBe('replay')
  })

  it('uses the default chapter order to navigate refresher chapters', () => {
    expect(getPreviousPathChapter('hash-lab', 'dv-practitioner')).toBe('dbt')
    expect(getNextPathChapter('hash-lab', 'dv-practitioner')).toBe('load-player')
  })
})
