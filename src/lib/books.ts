export const BOOKS = ['datavault'] as const
export type BookSlug = (typeof BOOKS)[number]

/** The book a hash path belongs to, or undefined for the bookshelf. */
export function bookOf(hashPath: string): BookSlug | undefined {
  const first = hashPath.replace(/^\//, '').split(/[/?]/)[0]
  return BOOKS.find((book) => book === first)
}

/** Links from before the bookshelf (`#/replay`) point into the Data Vault book (`#/datavault/replay`). */
export function bookRedirect(hashPath: string): string | undefined {
  const path = hashPath.startsWith('/') ? hashPath : `/${hashPath}`
  if (path === '/' || bookOf(path)) return undefined
  return `/datavault${path}`
}

export function redirectLegacyHash() {
  const target = bookRedirect(window.location.hash.replace(/^#/, ''))
  if (target) window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}#${target}`)
}
