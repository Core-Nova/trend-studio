/**
 * Responsive image imports via vite-imagetools.
 *
 * For every salon photo we generate two srcSets at build time — one AVIF
 * (smaller, modern) and one WebP (universal fallback) — at 480/768/1080/1600
 * widths. The active language and consumer renders a `<picture>` element with
 * an avif <source>, a webp <source>, and an <img> fallback.
 *
 * A 1080w WebP single URL doubles as the simple `src` for places where a plain
 * <img> is enough (stories viewer), and a 320w WebP feeds the highlight rings.
 */

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

const byPath = (glob, category, file) => glob[`../assets/images/${category}/${file}`]

const variant = (category, file) => ({
  src: byPath(mediumGlob, category, file),
  srcSet: byPath(srcsetWebpGlob, category, file),     // back-compat: webp srcset
  srcSetWebp: byPath(srcsetWebpGlob, category, file),
  srcSetAvif: byPath(srcsetAvifGlob, category, file),
  thumb: byPath(thumbGlob, category, file),
})

const HERO_LEFT = [
  '1-girl1-story.jpg',
  '2-linsho.jpg',
  '3-evastoryedit3.jpg',
  '4-story.jpg',
  '5-story.jpg',
  '6-story.jpg',
]
const HERO_RIGHT = [
  '1-vanessa.jpg',
  '2-linsho-3.jpg',
  '3-trend-viki.jpg',
  '4-story.jpg',
  '5-beatrice.jpg',
  '6-elia.jpg',
]
const GALLERY = [
  '2-story.jpg',
  '3-diana.jpg',
  'elly.jpg',
  'georgi.jpg',
  'linsho-1.jpg',
  'linsho-2.jpg',
  'linsho-3.jpg',
]

const heroLeft = HERO_LEFT.map(f => variant('hero-left', f))
const heroRight = HERO_RIGHT.map(f => variant('hero-right', f))
const gallery = GALLERY.map(f => variant('gallery', f))

export const imageData = {
  hero_left: heroLeft.map(v => v.src),
  hero_right: heroRight.map(v => v.src),
  gallery: gallery.map(v => v.src),
}

const DIMENSIONS = [
  // hero-left: 1-girl1-story, 2-linsho, 3-evastoryedit3, 4-story, 5-story, 6-story
  [1080, 1920], [1456, 2568], [1080, 1920], [2268, 4032], [3024, 5363], [2646, 4706],
  // hero-right: 1-vanessa, 2-linsho-3, 3-trend-viki, 4-story, 5-beatrice, 6-elia
  [2933, 5224], [2032, 3619], [1170, 2080], [2956, 5255], [2308, 4103], [2552, 4537],
  // gallery: 2-story, 3-diana, elly, georgi, linsho-1, linsho-2, linsho-3
  [2268, 4032], [2636, 4692], [2410, 4284], [1888, 3356], [1456, 2568], [1278, 2280], [2032, 3619],
]

const ALTS = [
  // hero-left
  'Soft beach-wave styling on layered haircut — TREND Hair Boutique Studio Sofia',
  'Glossy long hair with sleek luminous blowout — TREND Hair Boutique Studio Sofia',
  'Balayage highlights with caramel tones on long hair — TREND Sofia hairdresser',
  'Voluminous blow dry with soft waves — TREND Hair Boutique Studio Sofia',
  'Long brunette blowout with face-framing waves — TREND hair salon Sofia',
  'Premium silk-press blow dry on long hair — TREND Hair Boutique Studio Sofia center',
  // hero-right
  'Sleek long hair styling with rich shine — TREND Hair Boutique Studio Sofia',
  'Rich glossy hair colour with luminous shine — TREND Sofia hairdresser',
  'Elegant special-occasion hairstyle with soft volume — TREND Hair Boutique Studio Sofia',
  'Honey balayage and root toner colour work — TREND hair salon Sofia',
  'Voluminous blow dry with soft waves — TREND Hair Boutique Studio Sofia',
  'Glossy hair styling with luminous finish — TREND Sofia hairdresser',
  // gallery
  'Premium blow dry with glossy salon finish — TREND Hair Boutique Studio Sofia',
  'Honey balayage colour transformation on long hair — TREND Sofia hairdresser',
  'Glossy salon finish on long hair — TREND Sofia hairdresser',
  'Precision haircut with modern styling — TREND Sofia salon',
  'Sleek styled long hair with luminous shine — TREND Hair Boutique Studio Sofia',
  'Modern layered cut with soft movement — TREND Sofia salon',
  'Radiant glossy hair colour and styling — best hairdresser Sofia TREND',
]

const rawImages = [...heroLeft, ...heroRight, ...gallery].map((v, i) => ({
  src: v.src,
  srcSet: v.srcSet,
  srcSetWebp: v.srcSetWebp,
  srcSetAvif: v.srcSetAvif,
  thumb: v.thumb,
  width: DIMENSIONS[i][0],
  height: DIMENSIONS[i][1],
  alt: ALTS[i],
}))

const seen = new Set()
export const allImages = rawImages.filter(img => {
  if (seen.has(img.src)) return false
  seen.add(img.src)
  return true
})

export const allImageUrls = allImages.map(img => img.src)

export const STORY_GROUPS = [
  // Highlight ring uses 1-girl1-story.jpg — a clean studio portrait (sleek dark
  // blowout) whose face sits in the upper-middle, so the circular center-crop
  // frames it as a face portrait.
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
  left: { ...heroLeft[0], width: DIMENSIONS[0][0], height: DIMENSIONS[0][1], alt: ALTS[0] },
  right: {
    ...heroRight[0],
    width: DIMENSIONS[HERO_LEFT.length][0],
    height: DIMENSIONS[HERO_LEFT.length][1],
    alt: ALTS[HERO_LEFT.length],
  },
}
