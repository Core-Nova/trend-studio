// @vitest-environment node
/**
 * Indexing guarantees of scripts/seo-routes.mjs, checked on a minimal copy of
 * the built shell: canonical/sitemap/links all use the served trailing-slash
 * URL, every page exists once per language (Bulgarian at "/x/", English at
 * "/en/x/") with a self canonical and the same reciprocal hreflang set, and
 * /404.html is noindex.
 */
import { readFileSync } from 'fs'
import {
  applySeo,
  applyLocale,
  applyBody,
  applyNotFound,
  alternatesFor,
  buildSitemap
} from '../../scripts/seo-routes.mjs'

const SHELL = `<!doctype html>
<html lang="bg">
<head>
    <title>Home</title>
    <meta name="description" content="home" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="https://trendbytedi.com/" />
    <link rel="alternate" hreflang="bg" href="https://trendbytedi.com/" />
    <link rel="alternate" hreflang="en" href="https://trendbytedi.com/en/" />
    <link rel="alternate" hreflang="x-default" href="https://trendbytedi.com/" />
    <meta property="og:title" content="home" />
    <meta property="og:description" content="home" />
    <meta property="og:url" content="https://trendbytedi.com/" />
    <meta property="og:locale" content="bg_BG" />
    <meta property="og:locale:alternate" content="en_US" />
    <meta name="twitter:title" content="home" />
    <meta name="twitter:description" content="home" />
</head>
<body>
    <div id="root"></div>
</body>
</html>`

const BASE = 'https://trendbytedi.com'
const ROUTES = ['/', '/gallery', '/services', '/about', '/contact']

const hreflangs = (html) =>
  [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)" \/>/g)].map((m) => [
    m[1],
    m[2]
  ])

const galleryIn = (lang) =>
  applySeo(SHELL, {
    title: lang === 'en' ? 'Gallery' : 'Галерия',
    description: lang === 'en' ? 'Photos' : 'Снимки',
    url: `${BASE}${lang === 'en' ? '/en' : ''}/gallery/`,
    lang,
    alternates: alternatesFor('/gallery')
  })

describe('alternatesFor', () => {
  it('pairs the Bulgarian URL with its /en/ twin and defaults to Bulgarian', () => {
    expect(alternatesFor('/gallery')).toEqual([
      { hreflang: 'bg', href: `${BASE}/gallery/` },
      { hreflang: 'en', href: `${BASE}/en/gallery/` },
      { hreflang: 'x-default', href: `${BASE}/gallery/` }
    ])
    expect(alternatesFor('/')).toEqual([
      { hreflang: 'bg', href: `${BASE}/` },
      { hreflang: 'en', href: `${BASE}/en/` },
      { hreflang: 'x-default', href: `${BASE}/` }
    ])
  })
})

describe('subpage <head>', () => {
  it('points the canonical at the served URL in its own language', () => {
    const bg = galleryIn('bg')
    expect(bg).toContain(`<link rel="canonical" href="${BASE}/gallery/" />`)
    expect(bg).toContain(`<meta property="og:url" content="${BASE}/gallery/" />`)
    expect(bg).toContain('<html lang="bg">')
    expect(bg).toContain('<meta property="og:locale" content="bg_BG" />')
    expect(bg).toContain('<meta property="og:locale:alternate" content="en_US" />')
    expect(bg).toContain('<title>Галерия</title>')
    expect(bg).toContain('<meta name="robots" content="index, follow" />')

    const en = galleryIn('en')
    expect(en).toContain(`<link rel="canonical" href="${BASE}/en/gallery/" />`)
    expect(en).toContain(`<meta property="og:url" content="${BASE}/en/gallery/" />`)
    expect(en).toContain('<html lang="en">')
    expect(en).toContain('<meta property="og:locale" content="en_US" />')
    expect(en).toContain('<meta property="og:locale:alternate" content="bg_BG" />')
    expect(en).toContain('<title>Gallery</title>')
  })

  it('carries the page own reciprocal hreflang set, never the homepage block', () => {
    const expected = [
      ['bg', `${BASE}/gallery/`],
      ['en', `${BASE}/en/gallery/`],
      ['x-default', `${BASE}/gallery/`]
    ]
    // Identical on both versions: each names itself and the other.
    expect(hreflangs(galleryIn('bg'))).toEqual(expected)
    expect(hreflangs(galleryIn('en'))).toEqual(expected)
  })

  it('fails the build when a language tag is missing from the shell', () => {
    const noLocale = SHELL.replace(/.*og:locale" .*\n/, '')
    expect(() => applyLocale(noLocale, { lang: 'en', alternates: alternatesFor('/') })).toThrow(
      /og:locale/
    )
  })
})

describe('homepage <head>', () => {
  it('keeps the hand-written Bulgarian head and only sets the language tags', () => {
    const html = applyLocale(SHELL, { lang: 'bg', alternates: alternatesFor('/') })
    expect(html).toContain('<title>Home</title>')
    expect(html).toContain(`<link rel="canonical" href="${BASE}/" />`)
    expect(hreflangs(html)).toEqual([
      ['bg', `${BASE}/`],
      ['en', `${BASE}/en/`],
      ['x-default', `${BASE}/`]
    ])
  })

  it('index.html already declares /en/ as its English alternate (dev and 404 shell)', () => {
    const shell = readFileSync(new URL('../../index.html', import.meta.url), 'utf8')
    expect(hreflangs(shell)).toEqual([
      ['bg', `${BASE}/`],
      ['en', `${BASE}/en/`],
      ['x-default', `${BASE}/`]
    ])
    expect(shell).toContain('<html lang="bg">')
    expect(shell).toContain('<meta property="og:locale" content="bg_BG" />')
  })
})

describe('static body', () => {
  const pageHrefs = (html) => [...html.matchAll(/href="(\/[^"]*)"/g)].map((m) => m[1])

  it('links every page at its trailing-slash URL, never at a redirect', () => {
    const html = applyBody(SHELL, '<h1>Галерия</h1>')
    expect(pageHrefs(html)).toEqual(['/', '/gallery/', '/services/', '/about/', '/contact/'])
    expect(html).toMatch(/<div id="root">\s*<header>\s*<nav>/)
  })

  it('keeps English pages inside /en/ and cross-links the two versions of the page', () => {
    const en = applyBody(SHELL, '<h1>Gallery</h1>', { lang: 'en', route: '/gallery' })
    expect(pageHrefs(en)).toEqual([
      '/en/',
      '/en/gallery/',
      '/en/services/',
      '/en/about/',
      '/en/contact/',
      '/gallery/'
    ])
    expect(en).toContain('<a href="/gallery/" hreflang="bg" lang="bg">BG</a>')
    expect(en).toContain('>Gallery</a>')
    expect(en).toContain('8 Tsar Kaloyan')

    const bg = applyBody(SHELL, '<h1>Галерия</h1>', { lang: 'bg', route: '/gallery' })
    expect(pageHrefs(bg).at(-1)).toBe('/en/gallery/')
    expect(bg).toContain('>Галерия</a>')
  })
})

describe('404.html', () => {
  it('is noindex and claims no canonical or alternates', () => {
    const html = applyNotFound(SHELL)
    expect(html).toContain('<meta name="robots" content="noindex, follow" />')
    expect(html).not.toContain('rel="canonical"')
    expect(html).not.toContain('hreflang')
    expect(html).toContain('<div id="root"></div>')
  })
})

describe('sitemap', () => {
  const xml = buildSitemap(() => '2026-11-03')
  const entries = xml.split('<url>').slice(1)

  it('lists both language URLs of every route, trailing slash only, and no /book', () => {
    const locs = entries.map((e) => e.match(/<loc>([^<]+)<\/loc>/)[1])
    expect(locs).toEqual(
      ROUTES.flatMap((r) => {
        const path = r === '/' ? '/' : `${r}/`
        return [`${BASE}${path}`, `${BASE}/en${path}`]
      })
    )
    expect(xml).not.toContain('book')
  })

  it('gives every entry the full xhtml:link alternate set, itself included', () => {
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"')
    for (const entry of entries) {
      const loc = entry.match(/<loc>([^<]+)<\/loc>/)[1]
      const links = [
        ...entry.matchAll(/<xhtml:link rel="alternate" hreflang="([^"]+)" href="([^"]+)" \/>/g)
      ].map((m) => [m[1], m[2]])
      const bgUrl = loc.replace(`${BASE}/en/`, `${BASE}/`)
      const enUrl = bgUrl.replace(`${BASE}/`, `${BASE}/en/`)
      expect(links).toEqual([
        ['bg', bgUrl],
        ['en', enUrl],
        ['x-default', bgUrl]
      ])
    }
  })
})
