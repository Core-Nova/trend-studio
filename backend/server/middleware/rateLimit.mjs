import rateLimit from 'express-rate-limit'
import { config } from '../config.mjs'

const common = {
  standardHeaders: 'draft-7', // RateLimit-* headers
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
}

/** Limiter for JSON API routes (/api/*). */
export const apiLimiter = rateLimit({
  ...common,
  windowMs: config.rateLimit.api.windowMs,
  max: config.rateLimit.api.max,
})

/** More generous limiter for image serving — one page view fetches many images. */
export const imagesLimiter = rateLimit({
  ...common,
  windowMs: config.rateLimit.images.windowMs,
  max: config.rateLimit.images.max,
})
