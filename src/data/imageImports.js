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

const HERO_LEFT = ['1-story.jpg', '2-story.jpg', 'evastoryedit3.jpg', 'girl1-story.jpg']
const HERO_RIGHT = ['1-diana.jpg', '5-story.jpg', 'beatrice.jpg', 'elia.jpg', 'vanessa.jpg']
const GALLERY = ['evapostedit3.jpg', 'elia.jpg', 'elly.jpg', 'georgi.jpg', 'vanessa.jpg']

const heroLeft = HERO_LEFT.map(f => variant('hero-left', f))
const heroRight = HERO_RIGHT.map(f => variant('hero-right', f))
const gallery = GALLERY.map(f => variant('gallery', f))

export const imageData = {
  hero_left: heroLeft.map(v => v.src),
  hero_right: heroRight.map(v => v.src),
  gallery: gallery.map(v => v.src),
}

const DIMENSIONS = [
  // hero-left: 1-story.jpg, 2-story.jpg, evastoryedit3.jpg, girl1-story.jpg
  [3024, 5363], [2646, 4706], [1080, 1920], [1080, 1920],
  // hero-right: 1-diana.jpg, 5-story.jpg, beatrice.jpg, elia.jpg, vanessa.jpg
  [2636, 4692], [2956, 5255], [2308, 4103], [2552, 4537], [2933, 5224],
  // gallery: evapostedit3.jpg, elia.jpg, elly.jpg, georgi.jpg, vanessa.jpg
  [2153, 3827], [2552, 4537], [2410, 4284], [1888, 3356], [2933, 5224],
]

const ALTS = [
  // hero-left
  'Long brunette blowout with face-framing waves — TREND hair salon Sofia',
  'Premium silk-press blow dry on long hair — TREND Hair Boutique Studio Sofia center',
  'Balayage highlights with caramel tones on long hair — TREND Sofia hairdresser',
  'Soft beach-wave styling on layered haircut — TREND Hair Boutique Studio Sofia',
  // hero-right
  'Honey balayage and root toner colour work — TREND hair salon Sofia',
  'Hydrating REDKEN hair treatment with glossy finish — TREND Sofia',
  'Voluminous blow dry with soft waves — TREND Hair Boutique Studio Sofia',
  'Glossy hair styling with luminous finish — TREND Sofia hairdresser',
  'Sleek long hair styling with rich shine — TREND Hair Boutique Studio Sofia',
  // gallery
  'Special occasion evening hairstyle — TREND Hair Boutique Studio Sofia',
  'Glossy salon finish on long hair — TREND Sofia hairdresser',
  'Layered haircut with soft movement — TREND Hair Boutique Studio Sofia',
  'Precision haircut with modern styling — TREND Sofia salon',
  'Sleek blow dry with luminous shine — best hairdresser Sofia TREND',
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
  // Highlight ring uses girl1-story.jpg — a clean studio portrait (sleek dark
  // blowout) whose face sits in the upper-middle, so the circular center-crop
  // frames it as a face portrait.
  { label: 'Gallery', thumbnail: heroLeft[3].thumb, startIndex: 0 },
]
