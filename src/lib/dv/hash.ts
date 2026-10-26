import { md5 } from '@noble/hashes/legacy.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js'

/**
 * A TypeScript re-implementation of datavault4dbt's default hash macro
 * (macros/supporting/hash.sql + hash_standardization.sql) with the package defaults:
 * concat_string '||', null_placeholder_string '^^', quote '"', trimmed inputs,
 * case-insensitive hashkeys and case-sensitive hashdiffs.
 */

export type HashAlg = 'MD5' | 'SHA256'
export type HashKind = 'hashkey' | 'hashdiff'

export const CONCAT = '||'
export const NULL_PLACEHOLDER = '^^'
export const QUOTE = '"'
const CONCAT_REPLACEMENT = 'dv4dbt-concat-replacement'
const NULL_REPLACEMENT = 'dv4dbt-null-replacement'
const QUOTE_REPLACEMENT = 'dv4dbt-quote-replacement'

export type Value = string | number | null | undefined

export const ZERO_KEY: Record<HashAlg, string> = { MD5: '0'.repeat(32), SHA256: '0'.repeat(64) }
export const ERROR_KEY: Record<HashAlg, string> = { MD5: 'f'.repeat(32), SHA256: 'f'.repeat(64) }

export interface HashStep {
  id: 'input' | 'standardise' | 'concat' | 'case' | 'clean' | 'hash'
  label: string
  value: string
  detail: string
}

export interface HashResult {
  hash: string
  steps: HashStep[]
  allNull: boolean
}

function sqlTrim(s: string) {
  return s.replace(/^ +| +$/g, '')
}

export function standardiseAttribute(v: Value, useTrim = true): string {
  if (v === null || v === undefined) return NULL_PLACEHOLDER
  let s = String(v)
  if (useTrim) s = sqlTrim(s)
  s = s
    .replace(/\\/g, '\\\\')
    .replaceAll(QUOTE, QUOTE_REPLACEMENT)
    .replaceAll(NULL_PLACEHOLDER, NULL_REPLACEMENT)
    .replaceAll(CONCAT, CONCAT_REPLACEMENT)
  return `${QUOTE}${s}${QUOTE}`
}

export function digest(input: string, alg: HashAlg): string {
  const bytes = utf8ToBytes(input)
  return bytesToHex(alg === 'MD5' ? md5(bytes) : sha256(bytes))
}

export function dvHash(values: Value[], opts: { alg?: HashAlg; kind?: HashKind } = {}): HashResult {
  const alg = opts.alg ?? 'MD5'
  const kind = opts.kind ?? 'hashkey'
  const parts = values.map((v) => standardiseAttribute(v))
  const concatenated = parts.join(CONCAT)
  const cased = kind === 'hashkey' ? concatenated.toUpperCase() : concatenated
  const cleaned = cased.replace(/[\n\t\v\r]/g, '')
  const allNullString = values.map(() => NULL_PLACEHOLDER).join(CONCAT)
  const allNull = cleaned === allNullString
  const hash = allNull ? ZERO_KEY[alg] : digest(cleaned, alg)

  const steps: HashStep[] = [
    {
      id: 'input',
      label: 'Input columns',
      value: values.map((v) => (v === null || v === undefined ? 'NULL' : JSON.stringify(String(v)))).join(', '),
      detail: 'The raw business key (hashkey) or payload (hashdiff) columns, in the order listed in YAML.',
    },
    {
      id: 'standardise',
      label: 'Cast, trim, escape, quote',
      value: parts.join('  '),
      detail: `Each value is CAST to STRING, TRIMmed, delimiters inside the data are replaced and the result is wrapped in quotes. NULL becomes '${NULL_PLACEHOLDER}'.`,
    },
    {
      id: 'concat',
      label: `Concatenate with '${CONCAT}'`,
      value: concatenated,
      detail: 'Column order matters: the same values in a different order give a different hash.',
    },
    {
      id: 'case',
      label: kind === 'hashkey' ? 'UPPER (hashkeys are case-insensitive)' : 'Keep case (hashdiffs are case-sensitive)',
      value: cased,
      detail:
        kind === 'hashkey'
          ? "'alice' and 'ALICE' identify the same business object."
          : "A change from 'alice' to 'Alice' is a real payload change and creates a new satellite version.",
    },
    {
      id: 'clean',
      label: 'Strip \\n \\t \\v \\r',
      value: cleaned,
      detail: allNull
        ? 'Every input is NULL: NULLIF turns the string into NULL and the zero key is used instead.'
        : 'Control characters are removed so invisible differences do not change the hash.',
    },
    {
      id: 'hash',
      label: `${alg} → hex`,
      value: hash,
      detail: allNull
        ? `All-NULL input maps to the unknown key ${ZERO_KEY[alg].slice(0, 8)}…, the same key the ghost record uses.`
        : `${alg === 'MD5' ? '128' : '256'}-bit digest as a ${hash.length}-character hex string.`,
    },
  ]
  return { hash, steps, allNull }
}

export const hk = (...values: Value[]) => dvHash(values, { kind: 'hashkey' }).hash
export const hd = (...values: Value[]) => dvHash(values, { kind: 'hashdiff' }).hash
