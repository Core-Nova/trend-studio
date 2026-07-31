/**
 * Analytics delivery: gtag-first with a collector fallback. These tests drive
 * the load outcome directly (onload / onerror / timeout) since happy-dom never
 * actually fetches gtag.js.
 */

let lastScript

/** Fresh module (singleton mode/queue state) with the script element captured. */
async function loadAnalytics() {
  vi.resetModules()
  return await import('../lib/analytics')
}

beforeEach(() => {
  lastScript = null
  const realCreate = document.createElement.bind(document)
  vi.spyOn(document, 'createElement').mockImplementation((tag) => {
    const el = realCreate(tag)
    if (String(tag).toLowerCase() === 'script') lastScript = el
    return el
  })
  vi.spyOn(document.head, 'appendChild').mockImplementation(() => {}) // don't attach
  delete window.gtag
  window.dataLayer = undefined
  try { localStorage.clear() } catch { /* ignore */ }
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

const gtagEvents = () =>
  (window.dataLayer || []).map((a) => Array.from(a)).filter((a) => a[0] === 'event')

describe('gtag-first routing', () => {
  it('sends buffered events via gtag when gtag.js loads', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const api = await loadAnalytics()

    api.initAnalytics()
    api.trackPageView('/services') // buffered while pending
    expect(gtagEvents()).toHaveLength(0) // nothing sent yet

    lastScript.onload() // gtag.js arrives

    const events = gtagEvents()
    expect(events.some((a) => a[1] === 'page_view' && a[2].page_path === '/services')).toBe(true)
    expect(fetchMock).not.toHaveBeenCalled() // collector unused
  })

  it('falls back to the collector when gtag.js is blocked (onerror)', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const api = await loadAnalytics()

    api.initAnalytics()
    api.trackEvent('generate_lead', { location: 'hero' }) // buffered
    expect(fetchMock).not.toHaveBeenCalled()

    lastScript.onerror() // blocked → fall back and flush

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, opts] = fetchMock.mock.calls[0]
    expect(url).toMatch(/\/exec$/)
    expect(opts.method).toBe('POST')
    const body = JSON.parse(opts.body)
    expect(body.action).toBe('collect')
    expect(body.events[0].name).toBe('generate_lead')
    expect(body.events[0].params.location).toBe('hero')
    // fallback events carry the custom device tag + session id
    expect(body.events[0].params.device_category).toBeDefined()
    expect(body.events[0].params.session_id).toBeDefined()
  })

  it('falls back to the collector when gtag.js hangs (timeout)', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const api = await loadAnalytics()

    api.initAnalytics()
    api.trackPageView('/') // buffered; neither onload nor onerror fires
    expect(fetchMock).not.toHaveBeenCalled()

    vi.advanceTimersByTime(3000) // backstop timeout → collector

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).events[0].name).toBe('page_view')
  })
})
