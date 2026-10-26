import { expect, it } from 'vitest'
import { EMAIL_HASHDIFFS } from './project'

it('includes c_email in the expected hashdiff but not in the failing stage hashdiff', () => {
  expect(EMAIL_HASHDIFFS).toHaveLength(2)
  expect(EMAIL_HASHDIFFS[0].expected).not.toBe(EMAIL_HASHDIFFS[1].expected)
  expect(EMAIL_HASHDIFFS[0].actualWithoutEmail).toBe(EMAIL_HASHDIFFS[1].actualWithoutEmail)
})
