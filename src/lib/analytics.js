/**
 * Google Analytics 4 integration — gtag.js first, first-party collector fallback.
 *
 * We prefer gtag on EVERY device: when it loads, GA reports device category,
 * geography, and sessions accurately. But in the Instagram/Facebook in-app
 * browsers (and behind some blockers) gtag.js fails to load and every event is
 * silently dropped. So we buffer events until we know whether gtag.js loaded;
 * if it didn't, we fall back to posting to our own Apps Script Web App
 * (`script.google.com`, which those environments don't block), which relays to
 * GA4 via the Measurement Protocol. See apps-script/Analytics.gs.
 *
 * The collector URL defaults to the shared backend Web App (SITE.backendUrl);
 * set VITE_ANALYTICS_URL only to point it at a separate endpoint.
 *
 * Caveat: collector (fallback) events get device/geo from Apps Script's server,
 * not the visitor — so they carry a custom `device_category` param for
 * segmentation (register it as a custom dimension in GA4). Native gtag traffic
 * needs no such tag.
 */

import { SITE } from './constants'

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-MEJCZTPTG5'
// The collector is the shared backend Web App by default; set VITE_ANALYTICS_URL
// only to split analytics onto a separate endpoint.
const PROXY_URL = import.meta.env.VITE_ANALYTICS_URL || SITE.backendUrl

const SESSION_TIMEOUT_MS = 30 * 60 * 1000

let initialized = false
let mode = 'off' // 'off' | 'pending' | 'gtag' | 'proxy'
const queue = [] // events buffered until gtag's load status is known

/**
 * Best-effort device class for the custom `device_category` event param. GA4's
 * native Device category is derived from the request User-Agent, which for the
 * collector is Apps Script's server (UrlFetchApp overrides the UA), so it would
 * misreport these as desktop. This tags the real device instead.
 */
function deviceCategory() {
  const ua = navigator.userAgent
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(ua)) return 'tablet'
  if (/Mobile|iPhone|iPod|Android/i.test(ua)) return 'mobile'
  return 'desktop'
}

export function initAnalytics() {
  if (initialized) return
  initialized = true

  // No gtag id configured → collector only (or nothing).
  if (!MEASUREMENT_ID) {
    resolveMode(PROXY_URL ? 'proxy' : 'off')
    return
  }

  // Prefer gtag on every device — when it loads, GA reports device, geo, and
  // sessions accurately. Buffer events until we know it loaded; if gtag.js is
  // blocked (in-app browsers, ad blockers) fall back to the collector so the
  // events aren't lost.
  mode = 'pending'
  window.dataLayer = window.dataLayer || []
  window.gtag = function () { window.dataLayer.push(arguments) }
  window.gtag('js', new Date())
  window.gtag('config', MEASUREMENT_ID, { send_page_view: false }) // SPA: manual page_view

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
  let settled = false
  const resolve = (loaded) => {
    if (settled) return
    settled = true
    clearTimeout(timer)
    resolveMode(loaded ? 'gtag' : PROXY_URL ? 'proxy' : 'off')
  }
  script.onload = () => resolve(true)
  script.onerror = () => resolve(false) // blocked / network error
  // Backstop for requests that hang rather than erroring.
  const timer = setTimeout(() => resolve(false), 3000)
  document.head.appendChild(script)
}

/** Routes an event to gtag or the collector, buffering until gtag resolves. */
function emit(name, params) {
  if (mode === 'gtag') {
    if (window.gtag) window.gtag('event', name, params)
  } else if (mode === 'proxy') {
    sendToProxy(name, params)
  } else if (mode === 'pending') {
    queue.push({ name, params })
  }
  // 'off' → dropped
}

/** Commits the delivery mode and flushes anything buffered while pending. */
function resolveMode(next) {
  mode = next
  const buffered = queue.splice(0)
  for (const e of buffered) emit(e.name, e.params)
}

/** Reports an SPA page view. Safe to call before init / when disabled. */
export function trackPageView(path) {
  emit('page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  })
}

/** Reports a custom event (e.g. booking button click). */
export function trackEvent(name, params = {}) {
  emit(name, params)
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
          screen_resolution: `${window.screen.width}x${window.screen.height}`,
          // Register `device_category` as a custom dimension in GA4 to segment
          // mobile traffic (the native Device category can't be set server-side).
          device_category: deviceCategory(),
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
