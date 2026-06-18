import 'dotenv/config'

function env(name, fallback) {
  const val = process.env[name]
  if (!val) {
    if (fallback !== undefined) return fallback
    console.warn(`[config] Warning: ${name} is not set`)
    return ''
  }
  return val
}

export const config = {
  port: parseInt(env('PORT', '3001'), 10),
  corsOrigin: env('CORS_ORIGIN', '*').split(',').map(s => s.trim()),
  google: {
    apiKey: env('GOOGLE_PLACES_API_KEY'),
    placeId: env('GOOGLE_PLACE_ID'),
  },
  instagram: {
    accessToken: env('INSTAGRAM_ACCESS_TOKEN'),
  },
  // TTL in ms for in-memory cache
  cacheTtl: {
    reviews: 60 * 60 * 1000,    // 1 hour
    instagram: 60 * 60 * 1000,  // 1 hour
  },
  rateLimit: {
    // JSON API endpoints — generous for a small site, stops scripted abuse
    api: { windowMs: 60 * 1000, max: parseInt(env('RATE_LIMIT_API_MAX', '60'), 10) },
    // Image endpoint — a single page view loads many images
    images: { windowMs: 60 * 1000, max: parseInt(env('RATE_LIMIT_IMAGES_MAX', '300'), 10) },
  },
  images: {
    // Widths clients may request via ?w= — prevents cache-busting abuse
    allowedWidths: [320, 480, 640, 768, 1080, 1440, 1920],
    cacheDir: new URL('../.cache/images/', import.meta.url),
  },
}
