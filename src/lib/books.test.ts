import { describe, expect, it } from 'vitest'
import { CHAPTERS } from '@/books/datavault/chapters'
import { bookRedirect } from './books'

describe('bookRedirect', () => {
  it('sends the old home page to the Data Vault book', () => {
    expect(bookRedirect('')).toBe('/datavault')
    expect(bookRedirect('/')).toBe('/datavault')
  })

  it('keeps every old chapter link working, with its page and query', () => {
    for (const { slug } of CHAPTERS) expect(bookRedirect(`/${slug}`)).toBe(`/datavault/${slug}`)
    expect(bookRedirect('/replay/the-replay-lab?change=new-column')).toBe('/datavault/replay/the-replay-lab?change=new-column')
    expect(bookRedirect('/glossary')).toBe('/datavault/glossary')
  })

  it('leaves book links alone', () => {
    expect(bookRedirect('/datavault')).toBeUndefined()
    expect(bookRedirect('/datavault/replay/recap')).toBeUndefined()
    expect(bookRedirect('/datavault?x=1')).toBeUndefined()
  })
})
