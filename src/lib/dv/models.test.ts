import { describe, expect, it } from 'vitest'
import { MODEL, MODELS, SNIPPETS } from './models'

describe('model snippets', () => {
  it('keeps analysis and configuration examples out of the model catalog', () => {
    expect(Object.keys(MODEL)).toEqual(MODELS.map(({ name }) => name))

    for (const [key, snippet] of Object.entries(SNIPPETS)) {
      expect(snippet.name).toBe(key)
      expect(snippet.code).toEqual(expect.any(String))
      expect(MODEL).not.toHaveProperty(snippet.name)
      expect(MODELS.some((model) => model.name === snippet.name)).toBe(false)
    }
  })
})
