/**
 * Google Analytics 4 integration with two delivery paths:
 *
 *  - Desktop  → the standard gtag.js tag (production property `G-MEJCZTPTG5`,
 *               overridable via VITE_GA_MEASUREMENT_ID).
 *  - Mobile   → a first-party collector that relays events to GA4 server-side.
 *               Mobile traffic mostly arrives through the Instagram/Facebook
 *               in-app browsers, where gtag.js is routinely blocked and every
 *               event is silently dropped. `script.google.com` is not blocked,
 *               so posting events there recovers them. The collector shares the
 *               booking Apps Script Web App — same /exec URL, dispatched via
 *               `action: 'collect'`. See apps-script/Analytics.gs.
 *
 * The collector URL defaults to the booking URL (same Web App); set
 * VITE_ANALYTICS_URL only to point the mobile path somewhere else.
 *
 * The two paths are mutually exclusive per device, so a booking on desktop is
 * never counted twice. When the mobile collector URL is unset we fall back to
 * gtag everywhere (previous behaviour).
 */

import { SITE } from './constants'

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-MEJCZTPTG5'
// The collector is the shared backend Web App by default; set VITE_ANALYTICS_URL
// only to split analytics onto a separate endpoint.
const PROXY_URL = import.meta.env.VITE_ANALYTICS_URL || SITE.backendUrl

const SESSION_TIMEOUT_MS = 30 * 60 * 1000

let initialized = false
let mode = 'off' // 'off' | 'gtag' | 'proxy'

/** In-app browsers and phones — where gtag.js is most often blocked. */
function isMobileClient() {
  if (typeof navigator !== 'undefined') {
    if (/Android|iPhone|iPad|iPod|Instagram|FBAN|FBAV|FB_IAB|Line|Mobile/i.test(navigator.userAgent)) {
      return true
    }
  }
  if (typeof window !== 'undefined' && window.innerWidth <= 768) return true
  return false
}

export function initAnalytics() {
  if (initialized) return
  initialized = true

  // Mobile: bypass the blockable gtag script and post to our own collector.
  if (PROXY_URL && isMobileClient()) {
    mode = 'proxy'
    getClientId() // warm the persisted client id
    return
  }

  // Desktop (or no collector configured): standard gtag.js.
  if (!MEASUREMENT_ID) return
  mode = 'gtag'

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  function gtag() { window.dataLayer.push(arguments) }
  window.gtag = gtag
  gtag('js', new Date())
  // We send page_view manually on route change (SPA)
  gtag('config', MEASUREMENT_ID, { send_page_view: false })
}

/** Reports an SPA page view. Safe to call when analytics is disabled. */
export function trackPageView(path) {
  const params = {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  }
  if (mode === 'proxy') return sendToProxy('page_view', params)
  if (mode === 'gtag' && window.gtag) window.gtag('event', 'page_view', params)
}

/** Reports a custom event (e.g. booking button click). */
export function trackEvent(name, params = {}) {
  if (mode === 'proxy') return sendToProxy(name, params)
  if (mode === 'gtag' && window.gtag) window.gtag('event', name, params)
}

// --- mobile collector path ---------------------------------------------------

let memClientId = null
let memSession = null // { id, last }

/**
 * A stable GA4 client id. Reuses the gtag `_ga` cookie when present, otherwise
 * mints and persists our own so the same visitor keeps one identity. Falls
 * back to an in-memory id when storage is unavailable (private mode).
 */
function getClientId() {
  if (memClientId) return memClientId
  const fromCookie = document.cookie.match(/_ga=GA\d\.\d\.(\d+\.\d+)/)
  if (fromCookie) return (memClientId = fromCookie[1])
  const generated = `${Math.floor(Math.random() * 1e9)}.${Math.floor(Date.now() / 1000)}`
  try {
    let id = localStorage.getItem('ts_cid')
    if (!id) {
      id = generated
      localStorage.setItem('ts_cid', id)
    }
    return (memClientId = id)
  } catch {
    return (memClientId = generated)
  }
}

/** A 30-minute-rolling session id, required for GA4 to register sessions. */
function getSessionId() {
  const now = Date.now()
  try {
    const stored = JSON.parse(localStorage.getItem('ts_sid') || 'null')
    const session = stored && now - stored.last <= SESSION_TIMEOUT_MS ? stored : { id: String(now) }
    session.last = now
    localStorage.setItem('ts_sid', JSON.stringify(session))
    return session.id
  } catch {
    if (!memSession || now - memSession.last > SESSION_TIMEOUT_MS) memSession = { id: String(now) }
    memSession.last = now
    return memSession.id
  }
}

/** Fire-and-forget POST to the first-party collector. Never throws. */
function sendToProxy(name, params) {
  if (!PROXY_URL) return
  const body = JSON.stringify({
    action: 'collect',
    client_id: getClientId(),
    events: [
      {
        name,
        params: {
          page_location: window.location.href,
          page_title: document.title,
          ...params,
          session_id: getSessionId(),
          // Minimum non-zero engagement so GA4 counts an engaged session.
          engagement_time_msec: 100,
        },
      },
    ],
  })
  try {
    // no-cors + text/plain body => a "simple" request, so no CORS preflight
    // (Apps Script cannot answer OPTIONS). keepalive lets the last event send
    // during page unload. We never read the response.
    fetch(PROXY_URL, { method: 'POST', mode: 'no-cors', keepalive: true, body })
  } catch {
    /* analytics must never break the page */
  }
}
