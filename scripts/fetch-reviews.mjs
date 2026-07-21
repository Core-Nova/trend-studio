/**
 * Scrapes Google reviews from the public Google Maps listing
 * and writes them for the TREND Hair Boutique Studio website.
 *
 * Usage:
 *   node scripts/fetch-reviews.mjs              → writes public/reviews.json
 *   node scripts/fetch-reviews.mjs --override   → updates src/data/reviews.js (cached fallback)
 *   node scripts/fetch-reviews.mjs --debug      → saves debug screenshots
 *
 * No API key required — uses Playwright to visit the public listing page.
 * Run in CI by the "Update Google Reviews" GitHub Action (manual dispatch).
 */

import { chromium } from 'playwright'
import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'

const MAPS_URL = 'https://www.google.com/maps/place/Hair+Boutique+Studio+TREND/@42.6945,23.3255,17z/'
const PROFILE_URL = MAPS_URL

const REVIEWS_JSON_PATH = new URL('../public/reviews.json', import.meta.url)
const REVIEWS_JS_PATH = new URL('../src/data/reviews.js', import.meta.url)

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

    // Extract rating and count from the page
    let rating = 5.0
    let totalCount = 0

    const headerInfo = await page.evaluate(() => {
      const body = document.body?.innerText || ''

      // Look for rating pattern like "5.0" or "5,0" near "stars" or "reviews"
      let rating = null
      let count = null

      // Find elements with aria-label containing star info
      const starEls = document.querySelectorAll('[aria-label*="star"], [aria-label*="звезд"]')
      for (const el of starEls) {
        const label = el.getAttribute('aria-label') || ''
        const m = label.match(/([\d,.]+)\s*star/i)
        if (m) { rating = parseFloat(m[1].replace(',', '.')); break }
      }

      // Find review count
      const reviewPattern = /(\d+)\s*(reviews?|отзив|рецензи)/gi
      const countMatch = body.match(reviewPattern)
      if (countMatch) {
        const numMatch = countMatch[0].match(/(\d+)/)
        if (numMatch) count = parseInt(numMatch[1], 10)
      }

      return { rating, count }
    })

    if (headerInfo.rating) { rating = headerInfo.rating; log(`  Rating: ${rating}`) }
    if (headerInfo.count) { totalCount = headerInfo.count; log(`  Total reviews: ${totalCount}`) }

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

    const top10 = reviews.slice(0, 10)
    const formattedReviews = top10.map((r, i) => ({
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

try {
  log('Scraping Google reviews from Maps listing...')
  const data = await scrapeReviews()

  if (data.reviews.length === 0) {
    console.warn('No reviews extracted — keeping existing files unchanged.')
    process.exit(0)
  }

  if (isOverride) {
    const output = `// Auto-generated by scripts/fetch-reviews.mjs --override — do not edit manually
export const googleReviews = ${JSON.stringify(data, null, 2)}
`
    writeFileSync(fileURLToPath(REVIEWS_JS_PATH), output, 'utf8')
    log(`✓ Updated src/data/reviews.js — rating: ${data.rating}, count: ${data.totalCount}, reviews: ${data.reviews.length}`)
  } else {
    writeFileSync(fileURLToPath(REVIEWS_JSON_PATH), JSON.stringify(data, null, 2), 'utf8')
    log(`✓ Updated public/reviews.json — rating: ${data.rating}, count: ${data.totalCount}, reviews: ${data.reviews.length}`)
  }
} catch (err) {
  console.error('Failed to scrape reviews:', err.message)
  console.error('Keeping existing files unchanged.')
}
