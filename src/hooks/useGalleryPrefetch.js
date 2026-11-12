import { useEffect } from 'react'

/** Head start for the hero: its images and the WebGL scripts go first. */
const SETTLE_MS = 1500

const onIdle = (fn) =>
  typeof window.requestIdleCallback === 'function'
    ? window.requestIdleCallback(fn, { timeout: 4000 })
    : window.setTimeout(fn, 200)

const cancelIdle = (id) =>
  typeof window.cancelIdleCallback === 'function'
    ? window.cancelIdleCallback(id)
    : window.clearTimeout(id)

/** Data saver on, or a 2G-class connection: the visitor did not ask for this. */
const constrained = () => {
  const c = typeof navigator !== 'undefined' ? navigator.connection : null
  return Boolean(c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || '')))
}

/**
 * Gets the gallery ready while the visitor is still on another page: once the
 * page has loaded and the browser is idle, it downloads the gallery's code
 * chunk and its Instagram feed (plus the first row of post images), so
 * opening the gallery shows posts straight away instead of a spinner and
 * ~1.5 s of placeholders while the Apps Script answers.
 *
 * Runs once per page load, never on the gallery itself (the page does its own
 * loading there) and never on constrained connections. Both imports are the
 * same modules the lazy route uses, so nothing is downloaded twice.
 *
 * @param {boolean} enabled false while the gallery is the current page
 */
export const useGalleryPrefetch = (enabled) => {
  useEffect(() => {
    if (!enabled || constrained()) return
    let idleId = null
    let timerId = null

    const run = () => {
      import('../pages/GalleryPage').catch(() => {})
      import('./useInstagramFeed').then((m) => m.prefetchInstagramFeed()).catch(() => {})
    }
    const schedule = () => {
      timerId = window.setTimeout(() => {
        idleId = onIdle(run)
      }, SETTLE_MS)
    }

    if (document.readyState === 'complete') schedule()
    else window.addEventListener('load', schedule, { once: true })

    return () => {
      window.removeEventListener('load', schedule)
      if (timerId !== null) window.clearTimeout(timerId)
      if (idleId !== null) cancelIdle(idleId)
    }
  }, [enabled])
}
