/**
 * Generates a static index.html for each crawlable route so GitHub Pages returns
 * a 200 (not the SPA 404 fallback) with the correct per-route <title>, meta
 * description, canonical and Open Graph tags — AND real body content, so the
 * page carries its text on the first crawl instead of waiting for Google's
 * deferred JS-rendering pass.
 *
 * Browser-free by design: it clones the built dist/index.html *shell* and
 * rewrites <head> tags plus the contents of #root from src/translations and
 * src/data/services.json. No Playwright, no preview server — runs in a few ms.
 *
 * The injected markup is a plain semantic outline of what the React page shows,
 * NOT a second implementation of it. main.jsx mounts with createRoot, which
 * replaces the container's children, so visitors get the normal SPA the moment
 * the bundle boots; the static copy is what crawlers (and anyone whose JS
 * failed) see. Keep it that way: if the two ever disagree, the fix is to widen
 * the data these builders read, never to hand-write copy here.
 *
 * Also emits dist/sitemap.xml from the same ROUTES table, with <lastmod> read
 * from git history — public/sitemap.xml no longer exists, so adding a route
 * means editing ROUTES below and nothing else.
 *
 * Runs after `vite build` (see the `build` npm script).
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { execSync } from 'child_process'
import { dirname, join, sep } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { translations } from '../src/translations/index.js'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DIST = join(ROOT, 'dist')
const BASE_URL = 'https://trendbytedi.com'
const LANG = 'bg' // first-visit/crawler default (LanguageContext: localStorage || 'bg')

const seo = translations.seo
const catalog = JSON.parse(readFileSync(join(ROOT, 'src/data/services.json'), 'utf8'))

const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const escText = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
/** Author-entered strings carry real newlines (address, opening hours). */
const escLines = (s) => escText(s).replace(/\r?\n/g, '<br />')

const tr = (node) => (node && typeof node === 'object' ? node[LANG] : node)

// ---------- body builders ----------

/** Name/address/phone, repeated on every page — local search wants it consistent. */
const nap = () => `
<aside>
  <p><strong>TREND Hair Boutique Studio</strong></p>
  <p>${escLines(tr(translations.contact.addressText))}</p>
  <p><a href="tel:+359888599590">0888 599 590</a></p>
</aside>`

const servicesBody = () => {
  const out = [`<h1>${escText(tr(translations.services.title))}</h1>`]
  for (const key of Object.keys(translations.services.descriptions)) {
    out.push(`<p>${escText(tr(translations.services.descriptions[key]))}</p>`)
  }
  for (const cat of catalog.services.categories) {
    out.push(`<h2>${escText(tr(cat.name))}</h2>`, '<ul>')
    for (const item of cat.items) {
      const bits = [`<strong>${escText(tr(item.name))}</strong>`]
      if (item.duration) bits.push(escText(tr(item.duration)))
      if (item.price_eur != null) {
        const note = item.price_note ? `${tr(item.price_note)} ` : ''
        bits.push(escText(`${note}${item.price_eur.toFixed(2)} € / ${item.price_bgn.toFixed(2)} лв.`))
      }
      out.push(`<li>${bits.join(' &middot; ')}`)
      if (item.options?.length) {
        out.push('<ul>')
        for (const opt of item.options) {
          const o = [escText(tr(opt.name))]
          if (opt.duration) o.push(escText(tr(opt.duration)))
          if (opt.eur != null) o.push(escText(`${opt.eur.toFixed(2)} € / ${opt.bgn.toFixed(2)} лв.`))
          out.push(`<li>${o.join(' &middot; ')}</li>`)
        }
        out.push('</ul>')
      }
      out.push('</li>')
    }
    out.push('</ul>')
  }
  out.push(`<p>${escText(tr(catalog.price_note))}</p>`)
  return out.join('\n')
}

const aboutBody = () => {
  const a = translations.about
  const out = [
    `<h1>${escText(tr(translations.nav.about))}</h1>`,
    `<p>${escText(tr(a.paragraph1))}</p>`,
    `<p>${escText(tr(a.paragraph2))}</p>`,
    '<ul>',
    `<li>${escText(tr(a.feature1))}</li>`,
    `<li>${escText(tr(a.feature2))}</li>`,
    `<li>${escText(tr(a.feature3))}</li>`,
    '</ul>',
    `<h2>${escText(tr(a.productsTitle))}</h2>`,
  ]
  for (const p of a.products || []) {
    out.push(`<h3>${escText(p.name)}</h3>`, `<p>${escText(tr(p.desc))}</p>`)
  }
  return out.join('\n')
}

const contactBody = () => {
  const c = translations.contact
  return [
    `<h1>${escText(tr(c.title))}</h1>`,
    `<h2>${escText(tr(c.address))}</h2>`,
    `<p>${escLines(tr(c.addressText))}</p>`,
    `<h2>${escText(tr(c.phone))}</h2>`,
    '<p><a href="tel:+359888599590">0888 599 590</a></p>',
    `<h2>${escText(tr(c.email))}</h2>`,
    '<p><a href="mailto:trendstudiotedi@gmail.com">trendstudiotedi@gmail.com</a></p>',
    `<h2>${escText(tr(c.hours))}</h2>`,
    `<p>${escLines(tr(c.hoursText))}</p>`,
  ].join('\n')
}

const galleryBody = () =>
  [
    `<h1>${escText(tr(translations.gallery.title))}</h1>`,
    `<p>${escText(tr(translations.gallery.followText))}</p>`,
  ].join('\n')

/**
 * The home <h1> in React is the logo image plus an sr-only line; the static
 * copy spells it out as text so the most-linked URL is not the one page with
 * nothing to crawl. Section order mirrors HomePage.jsx.
 */
const homeBody = () => {
  const out = [
    '<h1>TREND Hair Boutique Studio</h1>',
    `<p>${escText(tr(translations.hero.subtitle))}</p>`,
    `<p>${escText(tr(translations.hero.tagline))}</p>`,
    `<h2>${escText(tr(translations.nav.about))}</h2>`,
    `<p>${escText(tr(translations.about.paragraph1))}</p>`,
    `<h2>${escText(tr(translations.services.title))}</h2>`,
    '<ul>',
  ]
  for (const cat of catalog.services.categories) out.push(`<li>${escText(tr(cat.name))}</li>`)
  out.push('</ul>', `<h2>${escText(tr(translations.contact.title))}</h2>`)
  return out.join('\n')
}

/** Unused until `/book` leaves the experimental flag — see the ROUTES note. */
const bookingBody = () => {
  const b = translations.booking
  const out = [
    `<h1>${escText(tr(b.title))}</h1>`,
    `<p>${escText(tr(b.servicesHint))}</p>`,
    `<h2>${escText(tr(translations.services.title))}</h2>`,
    '<ul>',
  ]
  for (const cat of catalog.services.categories) out.push(`<li>${escText(tr(cat.name))}</li>`)
  out.push('</ul>')
  return out.join('\n')
}

// ---------- routes ----------

// One table drives prerendering AND the sitemap. `sources` are the files whose
// last commit date becomes <lastmod>. The homepage keeps the shell's own <head>
// (already correct) and only gets a body — `self: true` writes it back to
// dist/index.html instead of a subdirectory. dist/404.html is deliberately left
// as the bare shell: it is the SPA deep-link fallback, and home copy under an
// arbitrary URL is exactly the duplicate Google should not see.
const ROUTES = {
  '/': {
    title: seo.title[LANG],
    description: seo.description[LANG],
    body: homeBody,
    self: true,
    sources: ['src/pages/HomePage.jsx', 'src/components', 'index.html'],
    changefreq: 'weekly',
    priority: '1.0',
  },
  '/gallery': {
    title: seo.galleryTitle[LANG],
    description: seo.galleryDescription[LANG],
    body: galleryBody,
    sources: ['src/pages/GalleryPage.jsx', 'src/data/imageImports.js'],
    changefreq: 'weekly',
    priority: '0.8',
  },
  '/services': {
    title: seo.servicesTitle[LANG],
    description: seo.servicesDescription[LANG],
    body: servicesBody,
    sources: ['src/pages/ServicesPage.jsx', 'src/data/services.json'],
    changefreq: 'monthly',
    priority: '0.9',
  },
  '/about': {
    title: seo.aboutTitle[LANG],
    description: seo.aboutDescription[LANG],
    body: aboutBody,
    sources: ['src/pages/AboutPage.jsx'],
    changefreq: 'monthly',
    priority: '0.7',
  },
  '/contact': {
    title: seo.contactTitle[LANG],
    description: seo.contactDescription[LANG],
    body: contactBody,
    sources: ['src/pages/ContactPage.jsx'],
    changefreq: 'monthly',
    priority: '0.8',
  },
  // '/book' is deliberately absent. The in-site wizard is still behind the
  // `?experimental=booking` opt-in, so an ordinary visit — Googlebot included —
  // hits window.location.replace() out to Studio24 (BookingPage.jsx). Listing a
  // URL that immediately redirects off-domain is worse than not listing it.
  // When the wizard ships to everyone, add it back with `body: bookingBody`
  // (already written below) and priority 0.9 — it is the highest-intent page.
}

// ---------- head rewriting ----------

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

/**
 * Put the static outline inside #root. createRoot() clears the container on
 * mount, so this never fights React — it is simply what exists until then.
 * Pure — no IO.
 */
export const applyBody = (html, markup) => {
  const re = /(<div id="root">)([\s\S]*?)(<\/div>)/
  if (!re.test(html)) throw new Error('seo-routes: <div id="root"> not found')
  return html.replace(
    re,
    (_m, open, _inner, close) => `${open}\n<main>\n${markup}\n${nap()}\n</main>\n${close}`
  )
}

// ---------- sitemap ----------

const today = () => new Date().toISOString().slice(0, 10)

/** Last commit date (YYYY-MM-DD) touching any of `paths`, or null. */
const gitDate = (paths) => {
  try {
    const args = paths.map((p) => JSON.stringify(p)).join(' ')
    const out = execSync(`git log -1 --format=%cs -- ${args}`, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    return out.trim() || null
  } catch {
    return null
  }
}

const repoDate = () => gitDate([]) || today()

export const buildSitemap = (lastmodFor) => {
  const urls = Object.entries(ROUTES).map(([route, meta]) => {
    const loc = route === '/' ? `${BASE_URL}/` : `${BASE_URL}${route}/`
    return [
      '  <url>',
      `    <loc>${loc}</loc>`,
      `    <lastmod>${lastmodFor(route, meta)}</lastmod>`,
      `    <changefreq>${meta.changefreq}</changefreq>`,
      `    <priority>${meta.priority}</priority>`,
      '  </url>',
    ].join('\n')
  })
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`
}

// ---------- main ----------

const main = () => {
  const shell = readFileSync(join(DIST, 'index.html'), 'utf8')
  let prerendered = 0

  for (const [route, meta] of Object.entries(ROUTES)) {
    if (!meta.body) continue
    // Trailing slash: Pages serves this file at "/gallery/" and 301s the
    // slashless form to it, so the canonical must match the served URL.
    // The shell's <head> already IS the homepage's — hand-written, bilingual,
    // and better than anything assembled from a single-language seo.* string.
    // Home therefore gets a body only; every other route gets both.
    const withHead = meta.self
      ? shell
      : applySeo(shell, { ...meta, url: `${BASE_URL}${route}/` })
    const html = applyBody(withHead, meta.body())
    const file = meta.self
      ? join(DIST, 'index.html')
      : join(DIST, route.replace(/^\//, ''), 'index.html')
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, html)
    prerendered++
    console.log(`  ${route.padEnd(10)} → dist/${file.slice(DIST.length + 1).split(sep).join('/')}`)
  }

  // A shallow CI checkout has no history to date individual files against, so
  // the tip commit stands in rather than emitting today's date for everything.
  const fallback = repoDate()
  const sitemap = buildSitemap((_route, meta) => gitDate(meta.sources) || fallback)
  writeFileSync(join(DIST, 'sitemap.xml'), sitemap)

  console.log(`\n✓ generated ${prerendered} crawlable route pages + sitemap.xml`)
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main()
