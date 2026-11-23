/**
 * Responsive image imports via vite-imagetools.
 *
 * Every photo is listed once in ./photos.json (file name, size, EN/BG alt) —
 * add or remove photos there, plus the file under src/assets/images/<folder>/.
 * For each one we generate two srcSets at build time — AVIF (smaller, modern)
 * and WebP (universal fallback) — at 480/768/1080/1600 widths, rendered as a
 * `<picture>` by ResponsiveImage.
 *
 * A 1080w WebP single URL doubles as the simple `src` for places where a plain
 * <img> is enough (stories viewer), and a 320w WebP feeds the highlight rings.
 */

import photos from './photos.json'
import { photoAlt, instagramPermalink } from '../lib/photos'

const srcsetAvifGlob = import.meta.glob('../assets/images/**/*.{jpg,png}', {
  eager: true,
  import: 'default',
  query: { format: 'avif', w: '480;768;1080;1600', as: 'srcset' },
})

const srcsetWebpGlob = import.meta.glob('../assets/images/**/*.{jpg,png}', {
  eager: true,
  import: 'default',
  query: { format: 'webp', w: '480;768;1080;1600', as: 'srcset' },
})

const mediumGlob = import.meta.glob('../assets/images/**/*.{jpg,png}', {
  eager: true,
  import: 'default',
  query: { format: 'webp', w: '1080' },
})

const thumbGlob = import.meta.glob('../assets/images/**/*.{jpg,png}', {
  eager: true,
  import: 'default',
  query: { format: 'webp', w: '320' },
})

/**
 * One photo with its responsive variants. `alt` is the English text (kept for
 * callers without a language); `alts` holds both — render `alts[lang]`.
 */
const load = (folder) =>
  photos[folder].map((photo) => {
    const key = `../assets/images/${folder}/${photo.file}`
    if (!mediumGlob[key]) throw new Error(`photos.json lists a missing image: ${folder}/${photo.file}`)
    const alts = { en: photoAlt(photo, 'en'), bg: photoAlt(photo, 'bg') }
    return {
      file: photo.file,
      src: mediumGlob[key],
      srcSet: srcsetWebpGlob[key], // back-compat: webp srcset
      srcSetWebp: srcsetWebpGlob[key],
      srcSetAvif: srcsetAvifGlob[key],
      thumb: thumbGlob[key],
      width: photo.width,
      height: photo.height,
      alt: alts.en,
      alts,
      description: photo.alt, // { en, bg } without the salon suffix — for captions
    }
  })

const heroLeft = load('hero-left')
const heroRight = load('hero-right')
const gallery = load('gallery')

export const imageData = {
  hero_left: heroLeft.map((v) => v.src),
  hero_right: heroRight.map((v) => v.src),
  gallery: gallery.map((v) => v.src),
}

const seen = new Set()
export const allImages = [...heroLeft, ...heroRight, ...gallery].filter((img) => {
  if (seen.has(img.src)) return false
  seen.add(img.src)
  return true
})

export const allImageUrls = allImages.map((img) => img.src)

export const STORY_GROUPS = [
  // Highlight ring uses the first hero photo — a clean studio portrait (sleek
  // dark hair, blunt fringe) whose face sits in the upper-middle, so the
  // circular center-crop frames it as a face portrait.
  { label: 'Gallery', thumbnail: heroLeft[0].thumb, startIndex: 0 },
]

/**
 * First visible image of each desktop hero column, with full responsive
 * metadata. The Hero renders these as the eager LCP preview under the WebGL
 * canvas — deriving them here (instead of indexing into `allImages`, whose
 * layout shifts when arrays are reordered or deduped) keeps the right column
 * from ever painting a left-column image before the slider takes over.
 */
export const heroPreviews = {
  left: heroLeft[0],
  right: heroRight[0],
}

/**
 * The gallery page's Instagram feed — a snapshot of the salon's posts bundled
 * with the site (newest first), so it needs no backend and every photo is
 * served from trendbytedi.com under a descriptive name. Each links to its post.
 */
export const instagramPosts = load('instagram').map((img, i) => ({
  ...img,
  id: photos.instagram[i].shortcode,
  type: photos.instagram[i].type,
  date: photos.instagram[i].date,
  permalink: instagramPermalink(photos.instagram[i].shortcode),
}))

/** The studio itself — the owner's photos from the Google Maps listing. */
export const salonPhotos = load('salon')
