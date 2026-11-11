import { useEffect, useState } from 'react'
import { fetchInstagramFeed } from '../lib/bookingApi'
import { allImages } from '../data/imageImports'
import { SITE } from '../lib/constants'

export const MAX_POSTS = 12
const CACHE_KEY = 'trend:instagram-feed'
const CACHE_MS = 30 * 60 * 1000
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

function readCache() {
  try {
    const hit = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null')
    if (hit && Date.now() - hit.at < CACHE_MS && Array.isArray(hit.posts) && hit.posts.length) {
      return normalizePosts(hit.posts)
    }
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

/**
 * The gallery's posts.
 *
 * @returns {{ status: 'loading' | 'live' | 'fallback', posts: Array<{
 *   id: string, type: 'photo' | 'carousel' | 'reel', image: string,
 *   caption: string, permalink: string,
 *   srcSetWebp?: string, srcSetAvif?: string, width?: number, height?: number, alt?: string
 * }> }}
 *   `live` = the Instagram feed (from the Apps Script copy; cached for the tab
 *   for 30 min, so moving around the site doesn't refetch). `fallback` = the
 *   feed is not set up, empty or unreachable, and `posts` are FALLBACK_POSTS.
 *   `loading` has no posts — render placeholders.
 */
export const useInstagramFeed = () => {
  const [state, setState] = useState(() => {
    const cached = readCache()
    return cached ? { status: 'live', posts: cached } : { status: 'loading', posts: [] }
  })
  const needsFetch = state.status === 'loading'

  useEffect(() => {
    if (!needsFetch) return
    let cancelled = false
    fetchInstagramFeed().then((res) => {
      if (cancelled) return
      const posts = res && res.ok ? normalizePosts(res.posts) : []
      if (posts.length) {
        writeCache(posts)
        setState({ status: 'live', posts })
      } else {
        setState({ status: 'fallback', posts: FALLBACK_POSTS })
      }
    })
    return () => {
      cancelled = true
    }
  }, [needsFetch])

  return state
}
