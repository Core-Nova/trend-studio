const EXEC_URL = 'https://script.google.com/macros/s/TEST/exec'

/** Loads a fresh copy of the module with VITE_BACKEND_URL set (or not). */
async function loadApi(url = EXEC_URL) {
  vi.resetModules()
  if (url === null) vi.stubEnv('VITE_BACKEND_URL', '')
  else vi.stubEnv('VITE_BACKEND_URL', url)
  return await import('../lib/bookingApi')
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('fetchAvailability', () => {
  it('GETs the availability action with duration and days', async () => {
    const api = await loadApi()
    const payload = { ok: true, days: [] }
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => payload })
    vi.stubGlobal('fetch', fetchMock)

    const result = await api.fetchAvailability(90, 7)

    expect(result).toEqual(payload)
    const [url] = fetchMock.mock.calls[0]
    expect(url).toBe(`${EXEC_URL}?action=availability&duration=90&days=7`)
  })
})

describe('createBooking', () => {
  it('POSTs a plain string body with no custom headers (no CORS preflight)', async () => {
    const api = await loadApi()
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    vi.stubGlobal('fetch', fetchMock)

    await api.createBooking({ name: 'Test', start: '2026-07-10T10:00:00+03:00' })

    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe(EXEC_URL)
    expect(options.method).toBe('POST')
    expect(typeof options.body).toBe('string')
    expect(options.headers).toBeUndefined()
    expect(JSON.parse(options.body)).toMatchObject({ action: 'book', name: 'Test' })
  })

  it('passes backend error responses through', async () => {
    const api = await loadApi()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: false, error: 'slot_taken' }) })
    )
    expect(await api.createBooking({})).toEqual({ ok: false, error: 'slot_taken' })
  })

  it('maps fetch rejections to a network error instead of throwing', async () => {
    const api = await loadApi()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('failed')))
    expect(await api.createBooking({})).toEqual({ ok: false, error: 'network' })
  })

  it('maps non-2xx responses to a network error', async () => {
    const api = await loadApi()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }))
    expect(await api.createBooking({})).toEqual({ ok: false, error: 'network' })
  })
})

describe('when VITE_BACKEND_URL is unset', () => {
  it('falls back to the hardcoded default backend (booking stays enabled)', async () => {
    const api = await loadApi(null)
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, days: [] }) })
    vi.stubGlobal('fetch', fetchMock)

    expect(api.bookingEnabled).toBe(true)
    await api.fetchAvailability(60)
    const [url] = fetchMock.mock.calls[0]
    expect(url).toMatch(/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec\?action=availability/)
  })
})
