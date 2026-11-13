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

export interface HashOptions {
  alg?: HashAlg
  kind?: HashKind
  encoding?: 'utf8' | 'utf16le'
  delimiter?: string
  nullAs?: string
  quote?: string
  escape?: boolean
}

function sqlTrim(s: string) {
  return s.replace(/^ +| +$/g, '')
}

function standardise(v: Value, options: Required<Pick<HashOptions, 'delimiter' | 'nullAs' | 'quote' | 'escape'>>, useTrim = true): string {
  if (v === null || v === undefined) return options.nullAs
  let s = String(v)
  if (useTrim) s = sqlTrim(s)
  if (options.escape) {
    s = s.replace(/\\/g, '\\\\')
    if (options.quote) s = s.replaceAll(options.quote, QUOTE_REPLACEMENT)
    if (options.nullAs) s = s.replaceAll(options.nullAs, NULL_REPLACEMENT)
    if (options.delimiter) s = s.replaceAll(options.delimiter, CONCAT_REPLACEMENT)
  }
  return options.quote ? `${options.quote}${s}${options.quote}` : s
}

export function standardiseAttribute(v: Value, useTrim = true): string {
  return standardise(v, { delimiter: CONCAT, nullAs: NULL_PLACEHOLDER, quote: QUOTE, escape: true }, useTrim)
}

export function digest(input: string, alg: HashAlg, encoding: 'utf8' | 'utf16le' = 'utf8'): string {
  const bytes = encoding === 'utf8'
    ? utf8ToBytes(input)
    : Uint8Array.from({ length: input.length * 2 }, (_, index) => {
        const codeUnit = input.charCodeAt(Math.floor(index / 2))
        return index % 2 === 0 ? codeUnit & 0xff : codeUnit >>> 8
      })
  return bytesToHex(alg === 'MD5' ? md5(bytes) : sha256(bytes))
}

export function dvHash(values: Value[], opts: HashOptions = {}): HashResult {
  const alg = opts.alg ?? 'MD5'
  const kind = opts.kind ?? 'hashkey'
  const encoding = opts.encoding ?? 'utf8'
  const options = {
    delimiter: opts.delimiter ?? CONCAT,
    nullAs: opts.nullAs ?? NULL_PLACEHOLDER,
    quote: opts.quote ?? QUOTE,
    escape: opts.escape ?? true,
  }
  const parts = values.map((v) => standardise(v, options))
  const concatenated = parts.join(options.delimiter)
  const cased = kind === 'hashkey' ? concatenated.toUpperCase() : concatenated
  const cleaned = cased.replace(/[\n\t\v\r]/g, '')
  const allNullString = values.map(() => options.nullAs).join(options.delimiter)
  const allNullCased = kind === 'hashkey' ? allNullString.toUpperCase() : allNullString
  const allNull = cleaned === allNullCased.replace(/[\n\t\v\r]/g, '')
  const hash = allNull ? ZERO_KEY[alg] : digest(cleaned, alg, encoding)

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
      detail: `Each value is cast and trimmed. ${options.escape ? 'Configured delimiters, NULL text and quotes are escaped.' : 'Values are not escaped.'} ${options.quote ? 'Values are wrapped in the quote character.' : 'Values are not quoted.'} NULL becomes '${options.nullAs}'.`,
    },
    {
      id: 'concat',
      label: `Concatenate with '${options.delimiter}'`,
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
        : `${alg === 'MD5' ? '128' : '256'}-bit digest of ${encoding === 'utf8' ? 'UTF-8' : 'UTF-16LE'} bytes as a ${hash.length}-character hex string.`,
    },
  ]
  return { hash, steps, allNull }
}

export const hk = (...values: Value[]) => dvHash(values, { kind: 'hashkey' }).hash
export const hd = (...values: Value[]) => dvHash(values, { kind: 'hashdiff' }).hash
