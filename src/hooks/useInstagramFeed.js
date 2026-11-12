import { useEffect, useState } from 'react'
import { fetchInstagramFeed } from '../lib/bookingApi'
import { allImages } from '../data/imageImports'
import { SITE } from '../lib/constants'

export const MAX_POSTS = 12
const CACHE_KEY = 'trend:instagram-feed'
const CACHE_MS = 30 * 60 * 1000
const NO_FEED_MS = 5 * 60 * 1000
/** Tiles loaded eagerly (the first desktop row); the rest are lazy. */
export const EAGER_POSTS = 4
const POST_TYPES = ['photo', 'carousel', 'reel']

const isHttps = (url) => typeof url === 'string' && url.startsWith('https://')

/**
 * Keeps only posts the gallery can render safely: an https image and an
 * https link (the backend already filters, but this is what reaches <img> and
 * <a href>, so it is checked again here).
 */
export function normalizePosts(posts) {
  if (!Array.isArray(posts)) return []
  return posts
    .filter((p) => p && isHttps(p.image) && isHttps(p.permalink))
    .slice(0, MAX_POSTS)
    .map((p) => ({
      id: String(p.id),
      type: POST_TYPES.includes(p.type) ? p.type : 'photo',
      image: p.image,
      caption: typeof p.caption === 'string' ? p.caption : '',
      permalink: p.permalink
    }))
}

/**
 * The bundled salon photos dressed as posts — shown until the Instagram feed
 * is connected, and whenever the backend can't be reached. They keep their
 * AVIF/WebP srcsets and link to the profile. No caption: the alt texts are
 * English-only, and the overlay would show them on the Bulgarian site too.
 */
export const FALLBACK_POSTS = allImages.slice(0, MAX_POSTS).map((img, i) => ({
  id: `local-${i}`,
  type: 'photo',
  image: img.src,
  srcSetWebp: img.srcSetWebp,
  srcSetAvif: img.srcSetAvif,
  width: img.width,
  height: img.height,
  alt: img.alt || '',
  caption: '',
  permalink: SITE.instagramUrl
}))

const FALLBACK = { status: 'fallback', posts: FALLBACK_POSTS }

/**
 * The tab's cached answer, or null when there is none or it has expired. A
 * "no feed" answer from the backend is cached too (for NO_FEED_MS only), so a
 * visitor who was already told the feed is not connected gets the bundled
 * photos at once instead of placeholders for another round trip.
 */
function readCache() {
  try {
    const hit = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null')
    if (!hit || !Array.isArray(hit.posts)) return null
    const age = Date.now() - hit.at
    if (hit.posts.length && age < CACHE_MS) {
      const posts = normalizePosts(hit.posts)
      if (posts.length) return { status: 'live', posts }
    }
    if (!hit.posts.length && age < NO_FEED_MS) return FALLBACK
  } catch {
    // blocked storage or bad JSON — just fetch
  }
  return null
}

function writeCache(posts) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), posts }))
  } catch {
    // storage full or blocked — the feed still renders
  }
}

let inflight = null

/**
 * One request per tab at a time: the idle prefetch and the gallery page
 * mounting moments later share the same promise instead of asking twice.
 * Never rejects (fetchInstagramFeed resolves to { ok: false } on failure).
 */
function loadFeed() {
  if (!inflight) {
    inflight = fetchInstagramFeed()
      .then((res) => {
        const posts = res && res.ok ? normalizePosts(res.posts) : []
        if (posts.length) {
          writeCache(posts)
          return { status: 'live', posts }
        }
        // Remember "no feed", but not a network failure — that one may be a
        // blip, and the next visit to the gallery should simply try again.
        if (res && res.error !== 'network') writeCache([])
        return FALLBACK
      })
      .finally(() => {
        inflight = null
      })
  }
  return inflight
}

const warmImage = (src) => {
  const img = new Image()
  img.referrerPolicy = 'no-referrer' // must match the tile's <img> to share its cache entry
  img.decoding = 'async'
  img.src = src
}

/**
 * Fetch the feed ahead of the visit (called on idle from any other page, see
 * useGalleryPrefetch) so the gallery opens with posts instead of placeholders,
 * and warm the first row's images — the ones the page loads eagerly. The
 * bundled fallback photos need no warming: they are same-origin srcsets.
 */
export function prefetchInstagramFeed() {
  if (readCache()) return Promise.resolve()
  return loadFeed().then(({ status, posts }) => {
    if (status === 'live') posts.slice(0, EAGER_POSTS).forEach((p) => warmImage(p.image))
  })
}

/**
 * The gallery's posts.
 *
 * @returns {{ status: 'loading' | 'live' | 'fallback', posts: Array<{
 *   id: string, type: 'photo' | 'carousel' | 'reel', image: string,
 *   caption: string, permalink: string,
 *   srcSetWebp?: string, srcSetAvif?: string, width?: number, height?: number, alt?: string
 * }> }}
 *   `live` = the Instagram feed (from the Apps Script copy; cached for the tab
 *   for 30 min, so moving around the site doesn't refetch, and usually already
 *   prefetched on idle from the page the visitor came from). `fallback` = the
 *   feed is not set up, empty or unreachable, and `posts` are FALLBACK_POSTS.
 *   `loading` has no posts — render placeholders.
 */
export const useInstagramFeed = () => {
  const [state, setState] = useState(() => readCache() || { status: 'loading', posts: [] })
  const needsFetch = state.status === 'loading'

  useEffect(() => {
    if (!needsFetch) return
    let cancelled = false
    loadFeed().then((next) => {
      if (!cancelled) setState(next)
    })
    return () => {
      cancelled = true
    }
  }, [needsFetch])

  return state
}
