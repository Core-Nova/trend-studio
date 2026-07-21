/**
 * TREND Booking — live Google reviews via the Places API (New).
 *
 * GET ?action=reviews&lang=bg
 * → { ok: true, rating: 5, count: 47,
 *     reviews: [{ author, photo, rating, text, date, time }] }   (max 5 — API limit)
 *   `date` is an ISO publish timestamp, `time` a localized "2 months ago"
 * | { ok: false, error: 'not_configured' | 'places_error' }
 *
 * Requires two Script Properties (see README step 4):
 *  - PLACES_API_KEY — Google Cloud API key with "Places API (New)" enabled
 *  - PLACE_ID       — the salon's Google place id
 * Responses are cached 6h per language, so the upstream API is hit at most
 * ~8x/day — deep inside Google's free tier. Without the key the endpoint
 * returns not_configured and the site keeps its bundled reviews.
 */

function getReviews(params) {
  const lang = params && params.lang === 'en' ? 'en' : 'bg'
  const cache = CacheService.getScriptCache()
  const cacheKey = 'reviews_' + lang
  const hit = cache.get(cacheKey)
  if (hit) return JSON.parse(hit)

  const key = getProp_('PLACES_API_KEY')
  const placeId = getProp_('PLACE_ID')
  if (!key || !placeId) return { ok: false, error: 'not_configured' }

  const url =
    'https://places.googleapis.com/v1/places/' +
    encodeURIComponent(placeId) +
    '?fields=rating,userRatingCount,reviews' +
    '&languageCode=' +
    lang +
    '&key=' +
    key
  const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true })
  if (res.getResponseCode() !== 200) {
    console.error('Places API ' + res.getResponseCode() + ': ' + res.getContentText())
    return { ok: false, error: 'places_error' }
  }

  const data = JSON.parse(res.getContentText())
  const out = {
    ok: true,
    rating: data.rating || null,
    count: data.userRatingCount || 0,
    reviews: (data.reviews || []).map(function (r) {
      const author = r.authorAttribution || {}
      return {
        author: author.displayName || '',
        photo: author.photoUri || null,
        rating: r.rating || null,
        text: (r.text && r.text.text) || '',
        date: r.publishTime || '',
        time: r.relativePublishTimeDescription || '',
      }
    }),
  }
  cache.put(cacheKey, JSON.stringify(out), CONFIG.cacheSec.reviews)
  return out
}
