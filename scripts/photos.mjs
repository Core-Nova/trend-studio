/**
 * The site's photos as crawlers and image search see them.
 *
 * In the app every photo is a vite-imagetools <picture> (AVIF/WebP srcsets,
 * hashed file names) that only exists once JavaScript has run. This module
 * gives each photo a second, crawler-facing life, all from src/data/photos.json:
 *
 *  - writePublicPhotos(): dist/photos/<file> — one JPEG per photo, at most
 *    1600px, under its descriptive name at a URL that never changes between
 *    deploys. This is what the image sitemap, the static pages and the
 *    JSON-LD point at.
 *  - photoMarkup(): the photos of a route as plain <img> tags with alt text in
 *    the page's language, for the static body seo-routes.mjs prerenders —
 *    inside <noscript>, so crawlers that don't run JavaScript (most AI
 *    crawlers) read them while real visitors never download them twice.
 *  - photosFor(): which photos each route shows — also the sitemap's
 *    <image:image> entries.
 */

import { readFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { ALT_SUFFIX, photoPath, instagramPermalink } from '../src/lib/photos.js'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const MAX_EDGE = 1600

export const photoSets = JSON.parse(readFileSync(join(ROOT, 'src/data/photos.json'), 'utf8'))

/** The photo folders each route renders (see HomePage, GalleryPage, AboutPage). */
export const PAGE_PHOTOS = {
  '/': ['hero-left', 'hero-right', 'gallery'],
  '/gallery': ['instagram'],
  '/about': ['salon'],
}

export const photosFor = (route) => (PAGE_PHOTOS[route] || []).flatMap((folder) => photoSets[folder])

/** Size of the published JPEG: the original scaled to fit MAX_EDGE, never enlarged. */
export const publishedSize = ({ width, height }) => {
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const escText = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * A route's photos for the prerendered body. `tr` picks the page's language
 * out of an { en, bg } node (as every body builder does). Instagram photos
 * link to their post; the others carry their description as a caption.
 */
export const photoMarkup = (route, tr) => {
  const photos = photosFor(route)
  if (!photos.length) return ''
  const figures = photos.map((photo) => {
    const { width, height } = publishedSize(photo)
    const alt = `${tr(photo.alt)} — ${tr(ALT_SUFFIX)}`
    const img = `<img src="${photoPath(photo)}" alt="${escAttr(alt)}" width="${width}" height="${height}" loading="lazy" />`
    const body = photo.shortcode ? `<a href="${instagramPermalink(photo.shortcode)}">${img}</a>` : img
    return `<figure>${body}<figcaption>${escText(tr(photo.alt))}</figcaption></figure>`
  })
  return `<noscript>\n${figures.join('\n')}\n</noscript>`
}

/**
 * Writes dist/photos/<file> for every photo in photos.json. sharp is imported
 * here, not at the top, so the tests that only build markup never load it.
 */
export const writePublicPhotos = async (distDir) => {
  const { default: sharp } = await import('sharp')
  const outDir = join(distDir, 'photos')
  mkdirSync(outDir, { recursive: true })
  const all = Object.entries(photoSets).flatMap(([folder, photos]) => photos.map((p) => ({ folder, ...p })))
  const names = new Set()
  for (const photo of all) {
    if (names.has(photo.file)) throw new Error(`photos: two photos are named ${photo.file}`)
    names.add(photo.file)
    await sharp(join(ROOT, 'src/assets/images', photo.folder, photo.file))
      .rotate() // bake in the EXIF orientation
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(join(outDir, photo.file))
  }
  return all.length
}
