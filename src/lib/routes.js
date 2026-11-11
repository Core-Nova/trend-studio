/**
 * Page URLs in the form GitHub Pages serves them. Each prerendered page is a
 * directory index ("/gallery/") and the slashless form 301-redirects there, so
 * every internal link, breadcrumb and canonical points at the slashed URL —
 * a link to "/gallery" sends crawlers through a redirect and shows up in
 * Search Console as "Page with redirect".
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

const stripSlash = (path) => {
  const p = String(path || '/')
  return p.length > 1 ? p.replace(/\/+$/, '') : p
}

/**
 * Same page, trailing slash or not. Route checks must use this rather than
 * `===`: a visitor arriving from Google is on "/contact/", one following an
 * old link on "/contact".
 */
export const samePath = (a, b) => stripSlash(a) === stripSlash(b)
