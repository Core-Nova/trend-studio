/**
 * Google Analytics 4 integration. Enabled by default — production property
 * `G-MEJCZTPTG5` is used unless VITE_GA_MEASUREMENT_ID overrides it.
 */

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-MEJCZTPTG5'

let initialized = false

export function initAnalytics() {
  if (!MEASUREMENT_ID || initialized) return
  initialized = true

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
  if (!initialized || !window.gtag) return
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  })
}

/** Reports a custom event (e.g. booking button click). */
export function trackEvent(name, params = {}) {
  if (!initialized || !window.gtag) return
  window.gtag('event', name, params)
}
