import { Router } from 'express'
import { config } from '../config.mjs'
import { cache } from '../cache.mjs'
import { fetchGoogleReviews } from '../services/googleReviews.mjs'

export const reviewsRouter = Router()

const CACHE_KEY = 'google_reviews'

/**
 * @openapi
 * /api/reviews:
 *   get:
 *     summary: Google Reviews for TREND Hair Boutique Studio
 *     description: Returns rating, total count, and up to 5 reviews from Google Places. Results are cached for 1 hour.
 *     tags: [Reviews]
 *     responses:
 *       200:
 *         description: Review data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cached:
 *                   type: boolean
 *                 rating:
 *                   type: number
 *                 totalCount:
 *                   type: integer
 *                 reviews:
 *                   type: array
 *       502:
 *         description: Upstream Google Places error
 *       503:
 *         description: API not configured
 */
reviewsRouter.get('/', async (req, res, next) => {
  try {
    const cached = cache.get(CACHE_KEY)
    if (cached) return res.json({ cached: true, ...cached })

    const data = await fetchGoogleReviews()
    cache.set(CACHE_KEY, data, config.cacheTtl.reviews)
    res.json({ cached: false, ...data })
  } catch (err) {
    next(err)
  }
})
