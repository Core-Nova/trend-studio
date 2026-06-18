import express from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import { existsSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

import { config } from './config.mjs'
import { requestLogger } from './middleware/logger.mjs'
import { metricsMiddleware, getMetrics } from './middleware/metrics.mjs'
import { errorHandler } from './middleware/errorHandler.mjs'
import { apiLimiter, imagesLimiter } from './middleware/rateLimit.mjs'
import { reviewsRouter } from './routes/reviews.mjs'
import { instagramRouter } from './routes/instagram.mjs'
import { imagesRouter } from './routes/images.mjs'
import { swaggerSpec } from './docs/swagger.mjs'
import { cache } from './cache.mjs'

const app = express()

// Needed so express-rate-limit sees the real client IP behind a reverse proxy
app.set('trust proxy', 1)
app.disable('x-powered-by')

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: config.corsOrigin }))
app.use(express.json({ limit: '100kb' }))
app.use(requestLogger)
app.use(metricsMiddleware)

// ── Docs ──────────────────────────────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// ── Routes (rate-limited) ─────────────────────────────────────────────────────
app.use('/api/reviews', apiLimiter, reviewsRouter)
app.use('/api/instagram', apiLimiter, instagramRouter)
app.use('/images', imagesLimiter, imagesRouter)

// ── Utility endpoints ─────────────────────────────────────────────────────────

/** @openapi
 * /health:
 *   get:
 *     summary: Health check
 *     tags: [System]
 *     responses:
 *       200:
 *         description: OK
 */
app.get('/health', (_req, res) => res.json({ status: 'ok' }))

/** @openapi
 * /api/metrics:
 *   get:
 *     summary: Request counters and cache stats
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Metrics snapshot
 */
app.get('/api/metrics', apiLimiter, (_req, res) => {
  res.json({ ...getMetrics(), cache: cache.stats() })
})

// ── Frontend static files (integrated mode) ──────────────────────────────────
const DIST_DIR = resolve(fileURLToPath(import.meta.url), '../../../dist')
if (existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR, { maxAge: '1d', etag: true }))
  app.get('*', (_req, res) => {
    res.sendFile(resolve(DIST_DIR, 'index.html'))
  })
  console.log(`  Frontend → serving from ${DIST_DIR}`)
}

// ── Error handler (must be last) ──────────────────────────────────────────────
app.use(errorHandler)

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(config.port, () => {
  console.log(`TREND backend running on http://localhost:${config.port}`)
  console.log(`  API docs → http://localhost:${config.port}/api/docs`)
  console.log(`  Health   → http://localhost:${config.port}/health`)
  console.log(`  Metrics  → http://localhost:${config.port}/api/metrics`)
})
