import { config } from '../config.mjs'

function httpError(message, status) {
  return Object.assign(new Error(message), { status })
}

// Fields to request from the Instagram Graph API
const FIELDS = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp'

/**
 * Fetches the latest posts from the salon's Instagram account.
 * Returns IMAGE and CAROUSEL_ALBUM posts plus VIDEO posts that have a
 * thumbnail, normalized to a shape the frontend can render directly.
 */
export async function fetchInstagramFeed(limit = 12) {
  const { accessToken } = config.instagram
  if (!accessToken) {
    throw httpError('Instagram access token is not configured', 503)
  }

  const url = `https://graph.instagram.com/me/media?fields=${FIELDS}&limit=${limit}&access_token=${accessToken}`
  const res = await fetch(url)
  const json = await res.json()

  if (!res.ok || json.error) {
    throw httpError(json.error?.message ?? `Instagram API HTTP ${res.status}`, 502)
  }

  const posts = (json.data ?? [])
    .map(p => ({
      id: p.id,
      caption: p.caption ?? '',
      mediaUrl: p.media_type === 'VIDEO' ? p.thumbnail_url : p.media_url,
      permalink: p.permalink,
      timestamp: p.timestamp,
    }))
    .filter(p => Boolean(p.mediaUrl))

  return { posts }
}
