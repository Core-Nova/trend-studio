import { useEffect, useState } from 'react'
import { apiEnabled, fetchInstagramFeed } from '../lib/api'

/**
 * Fetches the salon's Instagram feed from the backend.
 * Returns `null` until loaded or when unavailable — callers fall back
 * to the bundled gallery images in that case.
 */
export const useInstagramFeed = (limit = 12) => {
  const [posts, setPosts] = useState(null)

  useEffect(() => {
    if (!apiEnabled) return
    let cancelled = false
    fetchInstagramFeed(limit).then(result => {
      if (!cancelled && result) setPosts(result)
    })
    return () => { cancelled = true }
  }, [limit])

  return posts
}
