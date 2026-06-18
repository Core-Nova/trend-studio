import { config } from '../config.mjs'

/** Error with an HTTP status the error handler can forward. */
function httpError(message, status) {
  return Object.assign(new Error(message), { status })
}

/**
 * Fetches the salon's rating and latest reviews from the Google Places API,
 * merging Bulgarian review text when available.
 */
export async function fetchGoogleReviews() {
  const { apiKey, placeId } = config.google
  if (!apiKey || !placeId) {
    throw httpError('Google Places API is not configured', 503)
  }

  const fields = 'rating,user_ratings_total,reviews'
  const base = 'https://maps.googleapis.com/maps/api/place/details/json'

  const [enRes, bgRes] = await Promise.all([
    fetch(`${base}?place_id=${placeId}&fields=${fields}&key=${apiKey}&language=en&reviews_sort=newest`),
    fetch(`${base}?place_id=${placeId}&fields=reviews&key=${apiKey}&language=bg&reviews_sort=newest`),
  ])

  if (!enRes.ok) throw httpError(`Places API HTTP ${enRes.status}`, 502)
  const enJson = await enRes.json()
  if (enJson.status !== 'OK') {
    throw httpError(`Places API: ${enJson.status} — ${enJson.error_message ?? ''}`, 502)
  }

  const bgJson = bgRes.ok ? await bgRes.json() : {}
  const bgByAuthor = Object.fromEntries(
    (bgJson.result?.reviews ?? []).map(r => [r.author_name, r.text])
  )

  const { rating, user_ratings_total: totalCount, reviews: raw } = enJson.result
  const reviews = (raw ?? []).map((r, i) => ({
    id: String(i + 1),
    name: r.author_name,
    rating: r.rating,
    text: { en: r.text, bg: bgByAuthor[r.author_name] ?? r.text },
    date: new Date(r.time * 1000).toISOString().split('T')[0],
  }))

  return { rating, totalCount, reviews }
}
