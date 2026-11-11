/**
 * Scrapes Google reviews from the public Google Maps listing
 * and writes them for the TREND Hair Boutique Studio website.
 *
 * ONE scrape updates every place the count is shown, because they used to
 * drift apart: the runtime fetch said 54 while the hero badge and the JSON-LD
 * still said 50, the number they were last hand-synced to.
 *
 *   public/reviews.json   — fetched at runtime by useReviews() (Reviews section)
 *   src/data/reviews.js   — bundled snapshot; the offline fallback, and what
 *                           the hero RatingBadge imports statically
 *   index.html            — aggregateRating in the HairSalon JSON-LD (what
 *                           Google reads for the star rich-result)
 *
 * Usage:
 *   node scripts/fetch-reviews.mjs            → updates all three
 *   node scripts/fetch-reviews.mjs --debug    → saves debug screenshots
 *
 * No API key required — uses Playwright to visit the public listing page.
 * Run in CI by the "Update Google Reviews" GitHub Action, which runs this
 * BEFORE `npm run build` so the bundle and the per-route HTML pick it up.
 */

import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { resolve } from 'path'

const MAPS_URL = 'https://www.google.com/maps/place/Hair+Boutique+Studio+TREND/@42.6945,23.3255,17z/'
const PROFILE_URL = MAPS_URL

const REVIEWS_JSON_PATH = new URL('../public/reviews.json', import.meta.url)
const REVIEWS_JS_PATH = new URL('../src/data/reviews.js', import.meta.url)
const INDEX_HTML_PATH = new URL('../index.html', import.meta.url)

// --override used to be what wrote src/data/reviews.js; that is now
// unconditional, so the flag is accepted and ignored.
const isOverride = process.argv.includes('--override')
const isDebug = process.argv.includes('--debug')

function log(...args) { console.log(...args) }

function relativeDateToAbsolute(relativeStr) {
  const now = new Date()
  const lower = (relativeStr || '').toLowerCase()
  const match = lower.match(/(\d+)\s+(day|week|month|year|ден|дни|седмиц|месец|месеца|годин)/i)
  if (!match) {
    if (/a week|седмица/i.test(lower)) { now.setDate(now.getDate() - 7); return now.toISOString().split('T')[0] }
    if (/a month|месец/i.test(lower)) { now.setMonth(now.getMonth() - 1); return now.toISOString().split('T')[0] }
    if (/a year|година/i.test(lower)) { now.setFullYear(now.getFullYear() - 1); return now.toISOString().split('T')[0] }
    return now.toISOString().split('T')[0]
  }
  const num = parseInt(match[1], 10)
  const unit = match[2]
  if (/year|годин/i.test(unit)) now.setFullYear(now.getFullYear() - num)
  else if (/month|месец|месеца/i.test(unit)) now.setMonth(now.getMonth() - num)
  else if (/week|седмиц/i.test(unit)) now.setDate(now.getDate() - num * 7)
  else if (/day|ден|дни/i.test(unit)) now.setDate(now.getDate() - num)
  return now.toISOString().split('T')[0]
}

async function debugScreenshot(page, name) {
  if (!isDebug) return
  await page.screenshot({ path: `debug-${name}.png`, fullPage: false })
  log(`  Debug screenshot: debug-${name}.png`)
}

/**
 * Reads the place's rating and review count from the header's aria-labels.
 * Google serves the page in Bulgarian from a Sofia IP even with an en-US
 * locale, so both languages and both decimal marks are accepted. Anchored,
 * and the rating needs its decimal, so a single review's "5 звезди" or the
 * histogram's "5 звезди,58 отзива" can't be mistaken for the header.
 */
export function parseHeader(labels) {
  let rating = null
  let count = null
  for (const label of labels) {
    const r = !rating && label.match(/^\s*(\d[.,]\d)\s*(?:stars?|звезд)/i)
    if (r) {
      const value = parseFloat(r[1].replace(',', '.'))
      if (value >= 1 && value <= 5) rating = value
    }
    const c = !count && label.match(/^\s*(\d[\d\s.,]*?)\s*(?:reviews?|отзив)/i)
    if (c) count = parseInt(c[1].replace(/\D/g, ''), 10) || null
  }
  return { rating, count }
}

async function scrapeReviews() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    locale: 'en-US',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
  })
  const page = await context.newPage()

  try {
    // Set consent cookies
    await context.addCookies([
      { name: 'CONSENT', value: 'PENDING+987', domain: '.google.com', path: '/' },
      { name: 'SOCS', value: 'CAISHAgCEhJnd3NfMjAyNDAxMDEtMF9SQzIaAmVuIAEaBgiA_LCzBg', domain: '.google.com', path: '/' },
    ])

    // First, accept consent by visiting the consent page directly
    log('Handling Google consent...')
    await page.goto('https://consent.google.com/save?continue=https://www.google.com/maps&gl=US&m=0&pc=m&hl=en&src=2', {
      waitUntil: 'load',
      timeout: 15000,
    }).catch(() => {})
    await page.waitForTimeout(2000)

    // Use search URL — more reliable than direct place URLs which can lose the place ID
    const searchUrl = 'https://www.google.com/maps/search/Hair+Boutique+Studio+TREND+Sofia+Bulgaria'
    log('Navigating to Google Maps search...')
    await page.goto(searchUrl, { waitUntil: 'load', timeout: 30000 })
    await page.waitForTimeout(6000)

    await debugScreenshot(page, '1-initial')

    // Check for and handle any remaining consent dialogs
    try {
      const consentBtn = await page.$('form[action*="consent"] button, button[aria-label*="Accept"], button[aria-label*="Reject"]')
      if (consentBtn) {
        await consentBtn.click()
        log('  Clicked consent button')
        await page.waitForTimeout(3000)
      }
    } catch { /* no consent dialog */ }

    // Click on the first search result to open the place panel
    try {
      const placeLink = page.locator('a[href*="maps/place"]').first()
      if (await placeLink.isVisible({ timeout: 3000 })) {
        await placeLink.click()
        log('  Clicked on search result')
        await page.waitForTimeout(4000)
      }
    } catch {
      log('  No search results to click, place may already be open')
    }

    await debugScreenshot(page, '2-page-loaded')

    const title = await page.title()
    const url = page.url()
    log(`  Page title: ${title}`)
    log(`  Page URL: ${url}`)

    // Check what's on the page
    const pageText = await page.evaluate(() => {
      return document.body?.innerText?.substring(0, 2000) || ''
    })
    if (isDebug) log(`  Page text preview: ${pageText.substring(0, 500)}`)

    // Rating and count from the place header — the .F7nice block holds
    // aria-label="4,9 звезди" and aria-label="60 отзива". Unread stays null so
    // mergeReviews() keeps the snapshot's value; there is no default (a
    // `rating = 5.0` default once published 5.0 while Google showed 4.9).
    const headerLabels = await page.evaluate(() => {
      const scope = document.querySelector('.F7nice') || document
      return [...scope.querySelectorAll('[aria-label]')].map(el => el.getAttribute('aria-label') || '')
    })
    const { rating, count: totalCount } = parseHeader(headerLabels)

    if (rating) log(`  Rating: ${rating}`)
    else console.warn('! Rating not found on the listing — keeping the snapshot value')
    if (totalCount) log(`  Total reviews: ${totalCount}`)
    else console.warn('! Review count not found on the listing — keeping the snapshot value')

    // Try to find and click the Reviews tab
    log('Looking for Reviews tab...')
    const clickedTab = await page.evaluate(() => {
      // Method 1: Find tab buttons by role
      const tabs = document.querySelectorAll('button[role="tab"]')
      for (const tab of tabs) {
        const text = (tab.textContent || '').toLowerCase()
        const label = (tab.getAttribute('aria-label') || '').toLowerCase()
        if (text.includes('review') || text.includes('отзив') || label.includes('review') || label.includes('отзив')) {
          tab.click()
          return `tab: ${text}`
        }
      }

      // Method 2: Find "Reviews" text anywhere clickable
      const allButtons = document.querySelectorAll('button, a, [role="button"]')
      for (const btn of allButtons) {
        const text = (btn.textContent || '').trim().toLowerCase()
        if ((text.includes('review') || text.includes('отзив')) && text.length < 50) {
          btn.click()
          return `button: ${text}`
        }
      }

      // Method 3: Click on the star rating area to open reviews
      const ratingArea = document.querySelector('[class*="F7nice"], [jsaction*="pane.rating"]')
      if (ratingArea) {
        ratingArea.click()
        return 'rating area'
      }

      return null
    })

    if (clickedTab) {
      log(`  Clicked: ${clickedTab}`)
      await page.waitForTimeout(4000)
    } else {
      log('  No reviews tab found')
    }

    await debugScreenshot(page, '3-reviews-open')

    // Scroll to load all reviews
    log('Scrolling reviews panel...')
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        // Find scrollable containers
        const containers = document.querySelectorAll('.m6QErb, .DxyBCb, [role="feed"], [class*="section-scrollbox"]')
        let scrolled = false
        for (const c of containers) {
          if (c.scrollHeight > c.clientHeight + 10) {
            c.scrollTop = c.scrollHeight
            scrolled = true
          }
        }
        if (!scrolled) {
          // Fallback: scroll the main content area
          const main = document.querySelector('[role="main"]')
          if (main) {
            const inner = main.querySelector('div > div')
            if (inner && inner.scrollHeight > inner.clientHeight) {
              inner.scrollTop = inner.scrollHeight
            }
          }
        }
      })
      await page.waitForTimeout(700)
    }

    // Expand truncated reviews
    const expanded = await page.evaluate(() => {
      let count = 0
      // Google Maps uses various button classes for "More"
      const btns = document.querySelectorAll('button.w8nwRe, button.M77dve, [jsaction*="review.expandReview"]')
      btns.forEach(b => { b.click(); count++ })
      // Also try generic "More" text buttons within review containers
      document.querySelectorAll('.jftiEf button, .WMbnJf button, [data-review-id] button').forEach(b => {
        const t = (b.textContent || '').toLowerCase()
        if (t === 'more' || t === 'още' || t.includes('read more')) { b.click(); count++ }
      })
      return count
    })
    if (expanded > 0) {
      log(`  Expanded ${expanded} reviews`)
      await page.waitForTimeout(1000)
    }

    await debugScreenshot(page, '4-expanded')

    // Extract reviews
    log('Extracting review data...')
    const reviews = await page.evaluate(() => {
      const results = []
      const seen = new Set()

      // Try multiple container selectors
      const selectors = ['[data-review-id]', '.jftiEf', '.WMbnJf']
      let containers = []
      for (const sel of selectors) {
        const found = document.querySelectorAll(sel)
        if (found.length > 0) { containers = found; break }
      }

      // If none found, try to find review-like structures
      if (containers.length === 0) {
        // Look for any element that has both a star rating image and text content
        const candidates = document.querySelectorAll('[role="img"][aria-label*="star"]')
        candidates.forEach(star => {
          const parent = star.closest('[class]')
          if (parent && !containers.includes(parent)) {
            const grandparent = parent.parentElement?.parentElement
            if (grandparent) containers.push(grandparent)
          }
        })
      }

      for (const c of containers) {
        try {
          // Name — grab only from the most specific element, strip metadata suffixes
          const nameEl = c.querySelector('.d4r55 span, .d4r55, .WNxzHc a, .WNxzHc button, a[href*="/contrib/"]')
          let name = nameEl?.textContent?.trim()
          if (!name || name.length < 2) continue
          // Strip "Местен гид · N отзива · N снимки" or "N отзив · N снимки" suffixes
          name = name.replace(/\s*(Местен гид|Local Guide)\s*/gi, '')
          name = name.replace(/\s*·?\s*\d+\s*(отзив[аи]?|review|снимк[аи]?|photo|contribution)s?\s*/gi, '')
          name = name.trim()
          if (!name || name.length < 2) continue
          if (seen.has(name)) continue
          seen.add(name)

          // Rating
          let starRating = 5
          const starsEl = c.querySelector('[role="img"][aria-label]')
          if (starsEl) {
            const label = starsEl.getAttribute('aria-label') || ''
            const m = label.match(/(\d)/)
            if (m) starRating = parseInt(m[1], 10)
          }

          // Text — strip trailing Google-appended metadata (Услуги..., Тип коса..., etc.)
          const textEl = c.querySelector('.wiI7pd, .MyEned, .Jtu6Td, .review-full-text')
          let text = (textEl?.textContent || '').trim()
          if (!text) continue
          // Remove trailing metadata blocks that Google appends
          text = text.replace(/Услуги\s*.*/s, '').trim()
          text = text.replace(/Services\s*.*/s, '').trim()
          text = text.replace(/Тип коса\s*.*/s, '').trim()
          text = text.replace(/Hair type\s*.*/s, '').trim()
          text = text.replace(/Специални умения\s*.*/s, '').trim()
          text = text.replace(/Special skills\s*.*/s, '').trim()
          text = text.replace(/Стилист\s*.*/s, '').trim()
          text = text.replace(/Stylist\s*.*/s, '').trim()
          if (!text) continue

          // Date
          const dateEl = c.querySelector('.rsqaWe, .dehysf')
          const dateText = (dateEl?.textContent || '').trim()

          results.push({ name, rating: starRating, text, dateText })
        } catch { /* skip */ }
      }

      return results
    })

    log(`  Found ${reviews.length} reviews`)

    if (reviews.length === 0 && isDebug) {
      // Dump some DOM structure info for debugging
      const domInfo = await page.evaluate(() => {
        const info = []
        info.push(`Total elements: ${document.querySelectorAll('*').length}`)
        info.push(`data-review-id: ${document.querySelectorAll('[data-review-id]').length}`)
        info.push(`jftiEf: ${document.querySelectorAll('.jftiEf').length}`)
        info.push(`WMbnJf: ${document.querySelectorAll('.WMbnJf').length}`)
        info.push(`wiI7pd: ${document.querySelectorAll('.wiI7pd').length}`)
        info.push(`d4r55: ${document.querySelectorAll('.d4r55').length}`)
        info.push(`role=tab buttons: ${document.querySelectorAll('button[role="tab"]').length}`)
        info.push(`star imgs: ${document.querySelectorAll('[role="img"][aria-label*="star"]').length}`)
        info.push(`star imgs BG: ${document.querySelectorAll('[role="img"][aria-label*="звезд"]').length}`)

        // List all role=tab elements
        const tabs = document.querySelectorAll('button[role="tab"]')
        tabs.forEach((t, i) => info.push(`  tab[${i}]: "${t.textContent?.trim()}" aria-label="${t.getAttribute('aria-label')}"`))

        return info.join('\n')
      })
      log(`  DOM info:\n${domInfo}`)
    }

    await browser.close()

    // Sort: highest rating first, then longest text first
    reviews.sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating
      return b.text.length - a.text.length
    })

    // Everything that loaded — mergeReviews() keeps the snapshot's older
    // reviews, and the carousel itself shows only the first 10.
    const formattedReviews = reviews.map((r, i) => ({
      id: String(i + 1),
      name: r.name,
      rating: r.rating,
      text: { en: r.text, bg: r.text },
      date: relativeDateToAbsolute(r.dateText),
    }))

    return { rating, totalCount, profileUrl: PROFILE_URL, reviews: formattedReviews }
  } catch (err) {
    await browser.close()
    throw err
  }
}

/**
 * Rewrites ratingValue/reviewCount inside the aggregateRating object of the
 * HairSalon JSON-LD. Scoped to that one object so the sibling `review[]`
 * entries — which are hand-curated, not scraped — are left untouched. A
 * missing block warns instead of throwing: a stale rich-result is not worth
 * failing the weekly deploy over.
 */
function updateSchemaRating(data) {
  const file = fileURLToPath(INDEX_HTML_PATH)
  const html = readFileSync(file, 'utf8')
  const blockRe = /("aggregateRating"\s*:\s*\{)([^}]*)(\})/

  if (!blockRe.test(html)) {
    console.warn('! index.html: no aggregateRating block found — JSON-LD left unchanged')
    return
  }

  // A scrape that found review cards but failed to read the header can come
  // back with rating/totalCount unset — writing those would publish a "0
  // reviews" rich-result, so each field is only touched when it has a value.
  const rating = Number(data.rating)
  const count = Number(data.totalCount)

  let changed = false
  const updated = html.replace(blockRe, (whole, open, body, close) => {
    let next = body
    if (rating > 0) next = next.replace(/("ratingValue"\s*:\s*)"[^"]*"/, `$1"${rating.toFixed(1)}"`)
    if (count > 0) next = next.replace(/("reviewCount"\s*:\s*)"[^"]*"/, `$1"${count}"`)
    changed = next !== body
    return open + next + close
  })

  if (!changed) {
    log('· index.html JSON-LD already current')
    return
  }
  writeFileSync(file, updated, 'utf8')
  log(`✓ Updated index.html JSON-LD — ratingValue: ${rating.toFixed(1)}, reviewCount: ${count}`)
}

const nameKey = name => String(name || '').normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase()

/**
 * Folds a scrape into the committed snapshot instead of replacing it. Maps
 * only loads the first handful of reviews (5–10), so replacing would shrink
 * the list every week; merging lets it grow.
 *
 * - Highest rating first; within a rating, reviews new to the snapshot lead
 *   (newest first), since the carousel shows only the first 10.
 * - Known reviews (matched by reviewer name — Google allows one per person)
 *   keep their snapshot date, which was estimated when "N months ago" was
 *   more precise, and the longer text, since a scrape can miss "More".
 * - rating/totalCount fall back to the snapshot when the scrape missed them.
 */
export function mergeReviews(previous, scraped) {
  const prev = previous?.reviews ?? []
  const byName = new Map(prev.map(r => [nameKey(r.name), r]))
  const fresh = []

  for (const r of scraped.reviews) {
    const known = byName.get(nameKey(r.name))
    if (!known) {
      fresh.push(r)
      continue
    }
    known.rating = r.rating
    if ((r.text?.en || '').length > (known.text?.en || '').length) known.text = r.text
  }

  fresh.sort((a, b) => String(b.date).localeCompare(String(a.date)))
  // Highest rating first, as the scraper always did. The sort is stable, so
  // within a rating new reviews still lead and the snapshot keeps its order.
  const reviews = [...fresh, ...prev].sort((a, b) => b.rating - a.rating)

  return {
    rating: Number(scraped.rating) > 0 ? scraped.rating : previous?.rating,
    totalCount: Number(scraped.totalCount) > 0 ? scraped.totalCount : previous?.totalCount,
    profileUrl: scraped.profileUrl || previous?.profileUrl,
    reviews: reviews.map((r, i) => ({ ...r, id: String(i + 1) })),
    added: fresh.length,
  }
}

async function loadSnapshot() {
  try {
    const mod = await import(`${REVIEWS_JS_PATH.href}?t=${Date.now()}`)
    return mod.googleReviews ?? null
  } catch (err) {
    console.warn(`! Could not read src/data/reviews.js (${err.message}) — starting from the scrape alone`)
    return null
  }
}

// Imported by tests for mergeReviews() — only scrape when run as a script.
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])

async function main() {
  try {
    log('Scraping Google reviews from Maps listing...')
    const scraped = await scrapeReviews()

    if (scraped.reviews.length === 0 && !(Number(scraped.totalCount) > 0)) {
      console.warn('Nothing read from the listing — keeping existing files unchanged.')
      process.exit(0)
    }

    if (isOverride) log('Note: --override is now the default; the flag is ignored.')

    const { added, ...data } = mergeReviews(await loadSnapshot(), scraped)
    const summary = `rating: ${data.rating}, count: ${data.totalCount}, reviews: ${data.reviews.length} (${added} new)`

    writeFileSync(fileURLToPath(REVIEWS_JSON_PATH), JSON.stringify(data, null, 2), 'utf8')
    log(`✓ Updated public/reviews.json — ${summary}`)

    const output = `// Auto-generated by scripts/fetch-reviews.mjs — do not edit manually
export const googleReviews = ${JSON.stringify(data, null, 2)}
`
    writeFileSync(fileURLToPath(REVIEWS_JS_PATH), output, 'utf8')
    log(`✓ Updated src/data/reviews.js — ${summary}`)

    updateSchemaRating(data)
  } catch (err) {
    console.error('Failed to scrape reviews:', err.message)
    console.error('Keeping existing files unchanged.')
  }
}

if (isMain) await main()
