import { digest, type Value } from '../dv/hash'

const trimSqlSpaces = (value: string) => value.replace(/^ +| +$/g, '')

export function legacyHash(values: Value[]) {
  const input = values.map((value) => (value === null || value === undefined ? '' : trimSqlSpaces(String(value)))).join(';').toUpperCase()
  return digest(input, 'MD5', 'utf16le')
}
