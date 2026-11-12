/**
 * Page URLs in the form GitHub Pages serves them. Each prerendered page is a
 * directory index ("/gallery/") and the slashless form 301-redirects there, so
 * every internal link, breadcrumb and canonical points at the slashed URL —
 * a link to "/gallery" sends crawlers through a redirect and shows up in
 * Search Console as "Page with redirect".
 *
 * These are the Bulgarian (default-language) URLs. The English version of each
 * page lives under "/en" ("/en/gallery/"); get it with `localePath()`, or
 * render links with the `LangLink` atom, which does that for the current
 * language. Never hand-write an "/en/..." string.
 *
 * `/book` has no prerendered page (it is still experimental — see
 * scripts/seo-routes.mjs) and is served by the SPA fallback either way.
 */
export const PATHS = {
  home: '/',
  gallery: '/gallery/',
  about: '/about/',
  services: '/services/',
  contact: '/contact/',
  book: '/book'
}

export const DEFAULT_LANG = 'bg'
export const LANGS = ['bg', 'en']
/** URL prefix per language; the default language has none. */
const PREFIX = { bg: '', en: '/en' }

const stripSlash = (path) => {
  const p = String(path || '/')
  return p.length > 1 ? p.replace(/\/+$/, '') : p
}

/** Language a URL path belongs to: "/en" and "/en/..." are English, the rest Bulgarian. */
export const pathLang = (pathname) => (/^\/en(\/|$)/.test(String(pathname || '')) ? 'en' : DEFAULT_LANG)

/** The path without its language prefix: "/en/gallery/" → "/gallery/", "/en" → "/". */
export const stripLang = (pathname) => {
  const p = String(pathname || '/')
  if (pathLang(p) !== 'en') return p
  return p.slice(PREFIX.en.length) || '/'
}

/**
 * The same page in `lang`'s URL space. Accepts a path in either language, so it
 * serves both for building links from PATHS and for the language toggle.
 */
export const localePath = (pathname, lang) => {
  const base = stripLang(pathname)
  const prefix = PREFIX[lang] || ''
  if (!prefix) return base
  // "/en/" (not "/en") is the served URL of the English home page.
  return base === '/' ? `${prefix}/` : `${prefix}${base}`
}

/**
 * Same page, trailing slash or not, in either language. Route checks must use
 * this rather than `===`: a visitor arriving from Google is on "/contact/",
 * one following an old link on "/contact", an English one on "/en/contact/".
 */
export const samePath = (a, b) => stripSlash(stripLang(a)) === stripSlash(stripLang(b))
