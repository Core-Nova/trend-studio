// @vitest-environment node
/**
 * Indexing guarantees of scripts/seo-routes.mjs, checked on a minimal copy of
 * the built shell: canonical/sitemap/links all use the served trailing-slash
 * URL, subpages carry no homepage hreflang, and /404.html is noindex.
 */
import { applySeo, applyBody, applyNotFound, buildSitemap } from '../../scripts/seo-routes.mjs'

const SHELL = `<!doctype html>
<html lang="bg">
<head>
    <title>Home</title>
    <meta name="description" content="home" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="https://trendbytedi.com/" />
    <link rel="alternate" hreflang="en" href="https://trendbytedi.com/" />
    <link rel="alternate" hreflang="bg" href="https://trendbytedi.com/" />
    <link rel="alternate" hreflang="x-default" href="https://trendbytedi.com/" />
    <meta property="og:title" content="home" />
    <meta property="og:description" content="home" />
    <meta property="og:url" content="https://trendbytedi.com/" />
    <meta name="twitter:title" content="home" />
    <meta name="twitter:description" content="home" />
</head>
<body>
    <div id="root"></div>
</body>
</html>`

const gallery = { title: 'Галерия', description: 'Снимки', url: 'https://trendbytedi.com/gallery/' }

describe('subpage <head>', () => {
  it('points the canonical at the served URL and drops the homepage hreflang block', () => {
    const html = applySeo(SHELL, gallery)
    expect(html).toContain('<link rel="canonical" href="https://trendbytedi.com/gallery/" />')
    expect(html).toContain('<meta property="og:url" content="https://trendbytedi.com/gallery/" />')
    expect(html).not.toContain('hreflang')
    expect(html).toContain('<meta name="robots" content="index, follow" />')
  })
})

describe('static body', () => {
  it('links every page at its trailing-slash URL, never at a redirect', () => {
    const html = applyBody(SHELL, '<h1>Галерия</h1>')
    const hrefs = [...html.matchAll(/href="(\/[^"]*)"/g)].map((m) => m[1])
    expect(hrefs).toEqual(['/', '/gallery/', '/services/', '/about/', '/contact/'])
    expect(html).toMatch(/<div id="root">\s*<header>\s*<nav>/)
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
  it('lists only trailing-slash URLs', () => {
    const locs = [...buildSitemap(() => '2026-11-03').matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      (m) => m[1]
    )
    expect(locs).toEqual([
      'https://trendbytedi.com/',
      'https://trendbytedi.com/gallery/',
      'https://trendbytedi.com/services/',
      'https://trendbytedi.com/about/',
      'https://trendbytedi.com/contact/'
    ])
  })
})
