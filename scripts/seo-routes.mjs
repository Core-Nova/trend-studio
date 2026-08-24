/**
 * Generates a static index.html for each crawlable route so GitHub Pages returns
 * a 200 (not the SPA 404 fallback) with the correct per-route <title>, meta
 * description, canonical and Open Graph tags.
 *
 * Browser-free by design: it clones the built dist/index.html *shell* (empty
 * #root) and only rewrites <head> tags from the SEO strings in
 * src/translations/index.js. No Playwright, no preview server — runs in a few ms,
 * so it doesn't slow the deploy.
 *
 * What this is NOT: it does not prerender page BODY content. The generated files
 * exist purely so crawlers get a real page (200 + right canonical/title). Real
 * visitors still load the same shell and boot the SPA — React mounts into the
 * empty #root and renders normally, so the live experience is unchanged.
 *
 * Runs after `vite build` (see the `build` npm script). Adding/removing a route?
 * Update ROUTES below AND public/sitemap.xml.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { translations } from '../src/translations/index.js'

const DIST = fileURLToPath(new URL('../dist', import.meta.url))
const BASE_URL = 'https://trendbytedi.com'
const LANG = 'bg' // first-visit/crawler default (LanguageContext: localStorage || 'bg')

const seo = translations.seo
const pick = (t, d) => ({ title: t[LANG], description: d[LANG] })

// route path → { title, description }. The homepage (/) is left as the shell's
// own <head> (already 200 with home meta). "/book" is excluded: it redirects to
// Studio24, so there is nothing of ours to index there.
const ROUTES = {
  '/gallery': pick(seo.galleryTitle, seo.galleryDescription),
  '/services': pick(seo.servicesTitle, seo.servicesDescription),
  '/about': pick(seo.aboutTitle, seo.aboutDescription),
  '/contact': pick(seo.contactTitle, seo.contactDescription),
}

const escAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const escText = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Replace the captured (prefix)(value)(suffix) inner value, failing loudly if
 *  the tag isn't present (guards against Vite changing its HTML output format). */
const swap = (html, re, value, label) => {
  if (!re.test(html)) throw new Error(`seo-routes: expected <head> tag not found: ${label}`)
  return html.replace(re, (_m, p1, p2) => `${p1}${value}${p2}`)
}

/** Rewrite <head> SEO tags of the shell for one route. Pure — no IO. */
export const applySeo = (html, { title, description, url }) => {
  const t = escText(title)
  const ta = escAttr(title)
  const d = escAttr(description)

  if (!/<title>[\s\S]*?<\/title>/.test(html)) throw new Error('seo-routes: <title> not found')
  let h = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${t}</title>`)

  // Suffix captures only the closing quote so this matches regardless of how the
  // tag is closed ('>' from a browser-serialized shell, ' />' from Vite's HTML).
  h = swap(h, /(<meta name="description" content=")[^"]*(")/, d, 'meta description')
  h = swap(h, /(<meta property="og:description" content=")[^"]*(")/, d, 'og:description')
  h = swap(h, /(<meta name="twitter:description" content=")[^"]*(")/, d, 'twitter:description')
  h = swap(h, /(<meta property="og:title" content=")[^"]*(")/, ta, 'og:title')
  h = swap(h, /(<meta name="twitter:title" content=")[^"]*(")/, ta, 'twitter:title')
  h = swap(h, /(<link rel="canonical" href=")[^"]*(")/, url, 'canonical')
  h = swap(h, /(<meta property="og:url" content=")[^"]*(")/, url, 'og:url')
  return h
}

const main = () => {
  const shell = readFileSync(join(DIST, 'index.html'), 'utf8')
  for (const [route, meta] of Object.entries(ROUTES)) {
    // Trailing slash: Pages serves this file at "/gallery/" and 301s the
    // slashless form to it, so the canonical must match the served URL.
    const html = applySeo(shell, { ...meta, url: `${BASE_URL}${route}/` })
    const file = join(DIST, route.replace(/^\//, ''), 'index.html')
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, html)
    console.log(`  ${route.padEnd(10)} → dist${route}/index.html`)
  }
  console.log(`\n✓ generated ${Object.keys(ROUTES).length} crawlable route pages`)
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main()
