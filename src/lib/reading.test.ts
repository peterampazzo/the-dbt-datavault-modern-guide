import { describe, expect, it } from 'vitest'
import { CHAPTERS } from '@/books/datavault/chapters'
import { DATAVAULT } from '@/books/datavault/book'
import { getFirstPathChapter, getNextPathChapter, getPathOrder, getPreviousPathChapter } from './reading'

describe('reading paths', () => {
  it('keeps the full and browse paths in chapter order', () => {
    const defaultOrder = CHAPTERS.map(({ slug }) => slug)
    expect(getPathOrder(DATAVAULT, 'full')).toEqual(defaultOrder)
    expect(getPathOrder(DATAVAULT, 'browse')).toEqual(defaultOrder)
    expect(getFirstPathChapter(DATAVAULT, 'full')).toBe(defaultOrder[0])
  })

  it('orders the practitioner path and exposes adjacent chapters', () => {
    expect(getPathOrder(DATAVAULT, 'dv-practitioner')).toEqual(['dv-names', 'dbt-primer', 'dbt', 'load-player', 'replay', 'one-lake', 'modern-way', 'scheduling', 'from-sql-server', 'hash-parity', 'business-vault', 'migration-checklist'])
    expect(getFirstPathChapter(DATAVAULT, 'dv-practitioner')).toBe('dv-names')
    expect(getNextPathChapter(DATAVAULT, 'dv-names', 'dv-practitioner')).toBe('dbt-primer')
    expect(getNextPathChapter(DATAVAULT, 'dbt-primer', 'dv-practitioner')).toBe('dbt')
    expect(getNextPathChapter(DATAVAULT, 'dbt', 'dv-practitioner')).toBe('load-player')
    expect(getNextPathChapter(DATAVAULT, 'load-player', 'dv-practitioner')).toBe('replay')
    expect(getNextPathChapter(DATAVAULT, 'replay', 'dv-practitioner')).toBe('one-lake')
    expect(getNextPathChapter(DATAVAULT, 'one-lake', 'dv-practitioner')).toBe('modern-way')
    expect(getNextPathChapter(DATAVAULT, 'modern-way', 'dv-practitioner')).toBe('scheduling')
    expect(getPreviousPathChapter(DATAVAULT, 'dbt-primer', 'dv-practitioner')).toBe('dv-names')
    expect(getPreviousPathChapter(DATAVAULT, 'dbt', 'dv-practitioner')).toBe('dbt-primer')
    expect(getPreviousPathChapter(DATAVAULT, 'modern-way', 'dv-practitioner')).toBe('one-lake')
    expect(getPreviousPathChapter(DATAVAULT, 'dv-names', 'dv-practitioner')).toBeUndefined()
    expect(getPreviousPathChapter(DATAVAULT, 'one-lake', 'dv-practitioner')).toBe('replay')
    expect(getNextPathChapter(DATAVAULT, 'from-sql-server', 'dv-practitioner')).toBe('hash-parity')
    expect(getNextPathChapter(DATAVAULT, 'hash-parity', 'dv-practitioner')).toBe('business-vault')
    expect(getNextPathChapter(DATAVAULT, 'business-vault', 'dv-practitioner')).toBe('migration-checklist')
    expect(getPreviousPathChapter(DATAVAULT, 'migration-checklist', 'dv-practitioner')).toBe('business-vault')
    expect(getPreviousPathChapter(DATAVAULT, 'hash-parity', 'dv-practitioner')).toBe('from-sql-server')
  })

  it('uses the default chapter order to navigate refresher chapters', () => {
    expect(getPreviousPathChapter(DATAVAULT, 'hash-lab', 'dv-practitioner')).toBe('dbt')
    expect(getNextPathChapter(DATAVAULT, 'hash-lab', 'dv-practitioner')).toBe('load-player')
  })
})
