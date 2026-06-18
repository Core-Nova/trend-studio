import { Router } from 'express'
import { config } from '../config.mjs'
import { cache } from '../cache.mjs'
import { fetchInstagramFeed } from '../services/instagramFeed.mjs'

export const instagramRouter = Router()

const CACHE_KEY = 'instagram_feed'

/**
 * @openapi
 * /api/instagram:
 *   get:
 *     summary: Instagram feed for TREND Hair Boutique Studio
 *     description: Returns the latest posts from the salon's Instagram account. Results are cached for 1 hour.
 *     tags: [Instagram]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Number of posts to return (max 30)
 *     responses:
 *       200:
 *         description: Instagram posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cached:
 *                   type: boolean
 *                 posts:
 *                   type: array
 *       502:
 *         description: Upstream Instagram API error
 *       503:
 *         description: Access token not configured
 */
instagramRouter.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit ?? '12', 10) || 12, 30)
    const cacheKey = `${CACHE_KEY}_${limit}`

    const cached = cache.get(cacheKey)
    if (cached) return res.json({ cached: true, ...cached })

    const data = await fetchInstagramFeed(limit)
    cache.set(cacheKey, data, config.cacheTtl.instagram)
    res.json({ cached: false, ...data })
  } catch (err) {
    next(err)
  }
})
