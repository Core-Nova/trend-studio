// @vitest-environment node
/**
 * src/data/photos.json is the one list of bundled photos: the app renders from
 * it (imageImports.js) and the build publishes each photo at /photos/<file>,
 * lists it in the static pages and the image sitemap (scripts/photos.mjs).
 * These keep the list and the files in step.
 */
import { existsSync } from 'fs'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import photos from '../data/photos.json'
import { photoMarkup, photosFor, publishedSize } from '../../scripts/photos.mjs'

const IMAGES = new URL('../assets/images/', import.meta.url)
const all = Object.entries(photos).flatMap(([folder, list]) => list.map((p) => ({ folder, ...p })))
const tr = (lang) => (node) => (node && typeof node === 'object' ? node[lang] : node)

describe('photos.json', () => {
  it('names every photo descriptively, once across all folders', () => {
    const names = all.map((p) => p.file)
    expect(new Set(names).size).toBe(names.length)
    for (const name of names) {
      // lowercase words joined by hyphens: what image search reads from a URL
      expect(name).toMatch(/^[a-z0-9]+(-[a-z0-9]+){3,}\.jpg$/)
    }
  })

  it('lists only files that exist, at their real (EXIF-rotated) size', async () => {
    for (const p of all) {
      const file = fileURLToPath(new URL(`${p.folder}/${p.file}`, IMAGES))
      expect(existsSync(file), `${p.folder}/${p.file}`).toBe(true)
      const meta = await sharp(file).metadata()
      const [w, h] = meta.orientation >= 5 ? [meta.height, meta.width] : [meta.width, meta.height]
      expect([p.width, p.height], p.file).toEqual([w, h])
    }
  })

  it('describes every photo in both languages', () => {
    for (const p of all) {
      expect(p.alt.en.trim(), p.file).not.toBe('')
      expect(p.alt.bg.trim(), p.file).not.toBe('')
      expect(p.alt.bg, p.file).toMatch(/[а-я]/i) // actually Bulgarian, not a copy of the English
    }
  })

  it('gives every Instagram photo its post, type and date, newest first', () => {
    const dates = photos.instagram.map((p) => p.date)
    expect(dates).toEqual([...dates].sort().reverse())
    for (const p of photos.instagram) {
      expect(p.shortcode).toMatch(/^[A-Za-z0-9_-]+$/)
      expect(['photo', 'carousel', 'reel']).toContain(p.type)
      expect(p.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})

describe('crawler-facing photos', () => {
  it('maps each page to the photos it shows', () => {
    expect(photosFor('/gallery')).toEqual(photos.instagram)
    expect(photosFor('/about')).toEqual(photos.salon)
    expect(photosFor('/')).toHaveLength(photos['hero-left'].length + photos['hero-right'].length + photos.gallery.length)
    expect(photosFor('/contact')).toEqual([])
  })

  it('publishes at most 1600px on the long edge, never enlarged', () => {
    expect(publishedSize({ width: 3024, height: 5363 })).toEqual({ width: 902, height: 1600 })
    expect(publishedSize({ width: 2000, height: 1333 })).toEqual({ width: 1600, height: 1066 })
    expect(publishedSize({ width: 504, height: 896 })).toEqual({ width: 504, height: 896 })
  })

  it('puts a page’s photos in <noscript>, with alt text in the page’s language', () => {
    const [first] = photos.salon
    const bg = photoMarkup('/about', tr('bg'))
    const en = photoMarkup('/about', tr('en'))
    expect(bg.startsWith('<noscript>')).toBe(true)
    expect(bg.trim().endsWith('</noscript>')).toBe(true)
    expect(bg).toContain(`src="/photos/${first.file}"`)
    expect(bg).toContain(`alt="${first.alt.bg} — TREND Hair Boutique Studio, София"`)
    expect(en).toContain(`alt="${first.alt.en} — TREND Hair Boutique Studio, Sofia"`)
    expect(bg.match(/<img /g)).toHaveLength(photos.salon.length)
    expect(photoMarkup('/services', tr('bg'))).toBe('')
  })

  it('links each Instagram photo to its post', () => {
    const html = photoMarkup('/gallery', tr('en'))
    for (const p of photos.instagram) {
      expect(html).toContain(`<a href="https://www.instagram.com/p/${p.shortcode}/"><img src="/photos/${p.file}"`)
    }
  })
})
