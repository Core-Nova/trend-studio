/**
 * Prerenders each SPA route to a static HTML file so GitHub Pages serves it with
 * a 200 status instead of the SPA 404 fallback.
 *
 * Why this exists:
 *   GitHub Pages serves static files only. With no file at dist/services/index.html,
 *   a request for /services returns dist/404.html WITH a 404 status. Browsers ignore
 *   the status and boot the SPA, but Googlebot reads the 404 and refuses to index the
 *   page. Emitting a real dist/<route>/index.html makes the server return 200 and lets
 *   crawlers read fully-rendered HTML (per-route <title>/meta included).
 *
 * How:
 *   Serves the freshly built dist/ via Vite's preview server, drives the already-present
 *   Playwright Chromium to each route, waits for the router to paint, and snapshots the
 *   rendered DOM. dist/404.html is left as the shell copy — the genuine catch-all for
 *   unknown URLs.
 *
 * Runs after `vite build` in the `build` npm script. No extra dependency (Playwright is
 * already a devDependency used by scripts/fetch-reviews.mjs).
 */

import { preview } from 'vite'
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const DIST = fileURLToPath(new URL('../dist', import.meta.url))
const PORT = 5099

// Keep in sync with the <Route> table in src/App.jsx. The "*" catch-all is
// intentionally excluded — unknown URLs are handled by dist/404.html.
const ROUTES = ['/', '/gallery', '/services', '/about', '/contact', '/book']

function outFile(route) {
  const clean = route.replace(/^\/+|\/+$/g, '')
  return clean === '' ? join(DIST, 'index.html') : join(DIST, clean, 'index.html')
}

async function main() {
  const server = await preview({
    preview: { port: PORT, strictPort: true, host: '127.0.0.1' },
  })

  // Respect a non-root base (VITE_BASE_PATH) so the preview URLs resolve correctly.
  const base = (server.config.base || '/').replace(/\/$/, '')
  const origin = `http://127.0.0.1:${PORT}`

  const browser = await chromium.launch()
  const page = await browser.newPage()

  const rendered = []
  try {
    for (const route of ROUTES) {
      const url = origin + base + route
      await page.goto(url, { waitUntil: 'load', timeout: 30000 })
      // Wait until the lazy-route Suspense fallback has cleared AND the router has
      // painted real content into <main>. HomePage is eager (no .page-loading), so
      // this resolves as soon as its content mounts.
      await page.waitForFunction(
        () => {
          const loading = document.querySelector('.page-loading')
          const main = document.querySelector('#main-content')
          return !loading && main && main.children.length > 0
        },
        null,
        { timeout: 25000 }
      )
      // Small settle for any synchronous post-mount DOM/head writes (usePageSEO).
      await page.waitForTimeout(300)
      const html = await page.content()
      rendered.push([route, html])
      console.log(`  prerendered ${route.padEnd(10)} ${(html.length / 1024).toFixed(0)} KB`)
    }
  } finally {
    await browser.close()
    await new Promise((resolve) => server.httpServer.close(resolve))
  }

  // Write only after every route captured, so serving order never affects output.
  for (const [route, html] of rendered) {
    const file = outFile(route)
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, html)
  }
  console.log(`\n✓ prerendered ${rendered.length} routes → dist/`)
}

main().catch((err) => {
  console.error('prerender failed:', err)
  process.exit(1)
})
