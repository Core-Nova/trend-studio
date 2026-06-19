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
const HERO_RIGHT = ['1-diana.jpg', '1-story.jpg', '5-story.jpg', 'danielastory.jpg']
const GALLERY = ['1-post.jpg', '3-post.jpg', 'BS5A9854editmogi.jpg', 'evapostedit3.jpg']

const heroLeft = HERO_LEFT.map(f => variant('hero-left', f))
const heroRight = HERO_RIGHT.map(f => variant('hero-right', f))
const gallery = GALLERY.map(f => variant('gallery', f))

export const imageData = {
  hero_left: heroLeft.map(v => v.src),
  hero_right: heroRight.map(v => v.src),
  gallery: gallery.map(v => v.src),
}

const DIMENSIONS = [
  [3024, 5363], [2646, 4706], [1080, 1920], [1080, 1920],
  [2636, 4692], [2308, 4103], [2956, 5255], [1080, 1920],
  [2685, 3356], [3300, 4116], [4480, 6720], [3061, 3827],
]

const ALTS = [
  'Hair styling result at TREND Hair Boutique Studio Sofia',
  'Premium blow dry and hair styling at TREND salon Sofia',
  'Elegant hair look created at TREND Hair Boutique Studio',
  'Professional hairstyling at TREND Hair Boutique Studio Sofia',
  'Balayage and coloring result at TREND Hair Boutique Studio',
  'Hair colour transformation at TREND salon Sofia',
  'Luxury hair treatment result at TREND Hair Boutique Studio',
  'Professional hair styling session at TREND salon Sofia',
  'Hair styling and colour work by TREND Hair Boutique Studio Sofia',
  'Premium coloring and highlights at TREND salon Sofia',
  'Professional hair transformation at TREND Hair Boutique Studio',
  'Elegant styling result at TREND Hair Boutique Studio Sofia',
]

export const allImages = [...heroLeft, ...heroRight, ...gallery].map((v, i) => ({
  src: v.src,
  srcSet: v.srcSet,
  srcSetWebp: v.srcSetWebp,
  srcSetAvif: v.srcSetAvif,
  thumb: v.thumb,
  width: DIMENSIONS[i][0],
  height: DIMENSIONS[i][1],
  alt: ALTS[i],
}))

export const allImageUrls = allImages.map(img => img.src)

export const STORY_GROUPS = [
  { label: 'Hair', thumbnail: heroLeft[0].thumb, startIndex: 0 },
  { label: 'Style', thumbnail: heroRight[0].thumb, startIndex: 4 },
  { label: 'Gallery', thumbnail: gallery[0].thumb, startIndex: 8 },
]
