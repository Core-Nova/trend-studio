/**
 * TREND Analytics — a first-party GA4 event relay (Measurement Protocol).
 *
 * Shares the booking Web App: Router.gs dispatches
 *   POST { action: 'collect', client_id, events: [...] }  -> collectEvents()
 *   GET  ?action=analytics                                -> analyticsHealth()
 *
 * WHY: on mobile most traffic arrives through the Instagram/Facebook in-app
 * browsers, where `googletagmanager.com/gtag/js` is routinely blocked and
 * every client-side GA event is silently dropped. `script.google.com` is not
 * blocked, so the site posts events here and we forward them to GA4 from the
 * server. See src/lib/analytics.js (the mobile path).
 *
 * SETUP — add these Script Properties (Project Settings → Script properties):
 *   GA_API_SECRET     = GA4 Admin → Data Streams → web stream → Measurement
 *                       Protocol API secrets → Create   (required)
 *   GA_MEASUREMENT_ID = G-MEJCZTPTG5   (optional; this is the default)
 * No new OAuth scope is needed — the booking project already authorizes
 * UrlFetchApp (Studio24 sync / Places reviews).
 */

var GA_ENDPOINT = 'https://www.google-analytics.com/mp/collect'
var GA_DEBUG_ENDPOINT = 'https://www.google-analytics.com/debug/mp/collect'
var DEFAULT_MEASUREMENT_ID = 'G-MEJCZTPTG5'

/** Relays { client_id, events: [{ name, params }], user_id?, timestamp_micros?, debug? } to GA4. */
function collectEvents(body) {
  if (!body || !body.client_id || !Array.isArray(body.events) || !body.events.length) {
    return { ok: false, error: 'invalid' }
  }

  var props = PropertiesService.getScriptProperties()
  var measurementId = props.getProperty('GA_MEASUREMENT_ID') || DEFAULT_MEASUREMENT_ID
  var apiSecret = props.getProperty('GA_API_SECRET')
  if (!apiSecret) return { ok: false, error: 'not_configured' }

  var payload = { client_id: String(body.client_id), events: body.events }
  if (body.user_id) payload.user_id = String(body.user_id)
  if (body.timestamp_micros) payload.timestamp_micros = body.timestamp_micros

  var base = body.debug ? GA_DEBUG_ENDPOINT : GA_ENDPOINT
  var url =
    base +
    '?measurement_id=' +
    encodeURIComponent(measurementId) +
    '&api_secret=' +
    encodeURIComponent(apiSecret)

  var res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  })

  // GA4 MP returns 204 with no body on success; only the debug endpoint returns
  // validation messages, which we echo back when the client asks (debug: true).
  if (body.debug) {
    return { ok: true, status: res.getResponseCode(), validation: res.getContentText() }
  }
  return { ok: true }
}

/** Health check for GET ?action=analytics. */
function analyticsHealth() {
  return {
    ok: true,
    service: 'trend-analytics-collector',
    configured: Boolean(PropertiesService.getScriptProperties().getProperty('GA_API_SECRET')),
  }
}
