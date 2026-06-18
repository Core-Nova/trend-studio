/**
 * Tiny client for the TREND backend (backend/server).
 *
 * The backend is optional: in production the site is deployed statically,
 * so every consumer must handle `null` results and fall back to bundled data.
 */

const resolveApiUrl = () => {
  const envVal = import.meta.env.VITE_API_URL
  // Explicitly set (even to "") — use it; "" means same-origin relative paths
  if (envVal !== undefined) return envVal || ''
  // Dev default
  if (import.meta.env.DEV) return 'http://localhost:3001'
  // Production without VITE_API_URL — no backend
  return null
}

const API_URL = resolveApiUrl()

export const apiEnabled = API_URL !== null

async function getJson(path, { timeout = 4000 } = {}) {
  if (!API_URL) return null
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(`${API_URL}${path}`, { signal: controller.signal })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/** Latest Instagram posts, or null when the backend is unreachable/unconfigured. */
export async function fetchInstagramFeed(limit = 12) {
  const data = await getJson(`/api/instagram?limit=${limit}`)
  return data?.posts?.length ? data.posts : null
}

/** Live Google reviews, or null when the backend is unreachable/unconfigured. */
export async function fetchGoogleReviews() {
  const data = await getJson('/api/reviews')
  return data?.reviews?.length ? data : null
}
