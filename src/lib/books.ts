export const BOOKS = ['datavault'] as const
export type BookSlug = (typeof BOOKS)[number]

/** Links from before the bookshelf (`#/replay`) point into the Data Vault book (`#/datavault/replay`). */
export function bookRedirect(hashPath: string): string | undefined {
  const path = hashPath.startsWith('/') ? hashPath : `/${hashPath}`
  const first = path.split(/[/?]/)[1]
  if ((BOOKS as readonly string[]).includes(first)) return undefined
  return `/datavault${path === '/' ? '' : path}`
}

export function redirectLegacyHash() {
  const target = bookRedirect(window.location.hash.replace(/^#/, ''))
  if (target) window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}#${target}`)
}
