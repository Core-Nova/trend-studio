/**
 * Pure helpers over src/data/photos.json, shared by the app (imageImports.js)
 * and the build scripts (scripts/photos.mjs, seo-routes.mjs) — no Vite-only
 * syntax here, so Node can import it as-is.
 *
 * photos.json is the single list of every bundled photo: one array per folder
 * under src/assets/images/, each entry { file, width, height, alt: { en, bg } }
 * (Instagram posts add shortcode/type/date). File names are descriptive and
 * unique across folders, because the build also publishes every photo at a
 * stable, crawlable URL: /photos/<file> (see scripts/photos.mjs).
 */

/** Appended to every description: who and where. An { en, bg } node. */
export const ALT_SUFFIX = {
  en: 'TREND Hair Boutique Studio, Sofia',
  bg: 'TREND Hair Boutique Studio, София',
}

/** The photo's description in `lang`, plus who and where — the full alt text. */
export const photoAlt = (photo, lang) =>
  `${photo.alt[lang] || photo.alt.en} — ${ALT_SUFFIX[lang] || ALT_SUFFIX.en}`

/** Where the build publishes a photo under its own name (dist/photos/<file>). */
export const PHOTO_URL_PATH = '/photos/'
export const photoPath = (photo) => `${PHOTO_URL_PATH}${photo.file}`

export const INSTAGRAM_PROFILE = 'https://www.instagram.com/trendbytedi/'
export const instagramPermalink = (shortcode) => `https://www.instagram.com/p/${shortcode}/`
