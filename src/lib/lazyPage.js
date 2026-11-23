import { lazy } from 'react'

const RELOAD_KEY = 'trend:stale-chunk-reload'
// A second failure this soon after our own reload is not a stale tab — the
// chunk is really broken — so let the ErrorBoundary show it instead of looping.
const RELOAD_GUARD_MS = 10_000

/**
 * React.lazy for route pages that survives a deploy.
 *
 * Every deploy (each push to main, and the Monday reviews refresh) replaces
 * the site wholesale, so the hashed chunk files an open tab knows about are
 * deleted. Without this, a visitor who opened the site before a deploy and
 * then clicks through to a page they haven't loaded yet gets a failed
 * `import()` and the "Something went wrong" screen. Instead we reload once:
 * the URL already points at the page they asked for, and the fresh HTML
 * references the new chunks. Until the reload happens the import stays
 * pending, so they see the Suspense loader rather than an error flash.
 */
export function lazyPage(factory) {
  return lazy(() =>
    factory().catch((error) => {
      if (reloadOnce()) return new Promise(() => {})
      throw error
    })
  )
}

/**
 * Reloads the page unless we already did so within RELOAD_GUARD_MS. Returns
 * whether it reloaded. Without sessionStorage there is no loop guard, so it
 * never reloads and the error surfaces as before.
 */
export function reloadOnce(now = Date.now()) {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY))
    if (last && now - last < RELOAD_GUARD_MS) return false
    sessionStorage.setItem(RELOAD_KEY, String(now))
  } catch {
    return false
  }
  window.location.reload()
  return true
}
