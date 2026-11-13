import { describe, expect, it } from 'vitest'
import { CHAPTERS } from '@/books/datavault/chapters'
import { bookOf, bookRedirect } from './books'

describe('bookRedirect', () => {
  it('leaves the bookshelf at the root', () => {
    expect(bookRedirect('')).toBeUndefined()
    expect(bookRedirect('/')).toBeUndefined()
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
    expect(bookRedirect('/foundations')).toBeUndefined()
    expect(bookRedirect('/foundations/where-am-i/recap')).toBeUndefined()
  })
})

describe('bookOf', () => {
  it('reads the book from the first path segment', () => {
    expect(bookOf('/datavault/replay')).toBe('datavault')
    expect(bookOf('/datavault?x=1')).toBe('datavault')
    expect(bookOf('/foundations/where-am-i')).toBe('foundations')
    expect(bookOf('/')).toBeUndefined()
    expect(bookOf('')).toBeUndefined()
    expect(bookOf('/datavaults')).toBeUndefined()
  })
})
