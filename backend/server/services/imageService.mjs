import { createReadStream, statSync, mkdirSync, existsSync } from 'fs'
import { join, extname, resolve, basename } from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { config } from '../config.mjs'

// Source images live in the frontend's asset tree
const IMAGES_ROOT = resolve(
  fileURLToPath(import.meta.url),
  '../../../../src/assets/images'
)

const CACHE_DIR = fileURLToPath(config.images.cacheDir)
mkdirSync(CACHE_DIR, { recursive: true })

export const ALLOWED_CATEGORIES = new Set(['hero-left', 'hero-right', 'gallery'])
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const ALLOWED_FORMATS = new Set(['webp', 'jpeg', 'avif'])

export const MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
}

function httpError(message, status) {
  return Object.assign(new Error(message), { status })
}

/**
 * Validates the request and returns the absolute path of the source image.
 * Throws a 400/404 httpError on invalid input.
 */
export function resolveSourceImage(category, filename) {
  if (!ALLOWED_CATEGORIES.has(category)) {
    throw httpError(`Unknown category. Allowed: ${[...ALLOWED_CATEGORIES].join(', ')}`, 400)
  }
  const ext = extname(filename).toLowerCase()
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw httpError('Unsupported file type', 400)
  }

  // basename() strips any path segments; then verify containment as belt-and-braces
  const filePath = join(IMAGES_ROOT, category, basename(filename))
  if (!filePath.startsWith(IMAGES_ROOT)) {
    throw httpError('Invalid path', 400)
  }
  if (!existsSync(filePath)) {
    throw httpError('Image not found', 404)
  }
  return filePath
}

/**
 * Returns { path, mime, stat } for the requested image, resized/transcoded
 * if `width` or `format` are given. Resized variants are cached on disk so
 * sharp only runs once per variant.
 */
export async function getImageVariant(category, filename, { width, format } = {}) {
  const sourcePath = resolveSourceImage(category, filename)
  const sourceExt = extname(filename).toLowerCase()

  // No transformation requested — serve the original
  if (!width && !format) {
    return { path: sourcePath, mime: MIME[sourceExt], stat: statSync(sourcePath) }
  }

  if (width && !config.images.allowedWidths.includes(width)) {
    throw httpError(`Unsupported width. Allowed: ${config.images.allowedWidths.join(', ')}`, 400)
  }
  const fmt = format ?? 'webp'
  if (!ALLOWED_FORMATS.has(fmt)) {
    throw httpError(`Unsupported format. Allowed: ${[...ALLOWED_FORMATS].join(', ')}`, 400)
  }

  const outExt = fmt === 'jpeg' ? '.jpg' : `.${fmt}`
  const cacheName = `${category}__${basename(filename, extname(filename))}__w${width ?? 'orig'}${outExt}`
  const cachePath = join(CACHE_DIR, cacheName)

  // Re-generate if missing or the source changed since the variant was made
  const sourceStat = statSync(sourcePath)
  let needsBuild = true
  if (existsSync(cachePath)) {
    needsBuild = statSync(cachePath).mtimeMs < sourceStat.mtimeMs
  }

  if (needsBuild) {
    let pipeline = sharp(sourcePath).rotate() // respect EXIF orientation
    if (width) pipeline = pipeline.resize({ width, withoutEnlargement: true })
    pipeline = fmt === 'jpeg'
      ? pipeline.jpeg({ quality: 80, mozjpeg: true })
      : fmt === 'avif'
        ? pipeline.avif({ quality: 60 })
        : pipeline.webp({ quality: 80 })
    await pipeline.toFile(cachePath)
  }

  return { path: cachePath, mime: MIME[outExt], stat: statSync(cachePath) }
}

/** Streams a previously resolved image variant with cache headers. */
export function streamImage(res, req, { path, mime, stat }) {
  const etag = `"${stat.size}-${stat.mtimeMs}"`
  if (req.headers['if-none-match'] === etag) {
    res.status(304).end()
    return
  }
  res.setHeader('Content-Type', mime)
  res.setHeader('Content-Length', stat.size)
  res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=3600')
  res.setHeader('ETag', etag)
  createReadStream(path).pipe(res)
}
