import { renderHook, render, screen, waitFor, within } from '@testing-library/react'
import { LanguageProvider } from '../contexts/LanguageContext'
import {
  useInstagramFeed,
  normalizePosts,
  prefetchInstagramFeed,
  FALLBACK_POSTS,
  MAX_POSTS
} from '../hooks/useInstagramFeed'
import { InstagramFeed } from '../components/InstagramFeed/InstagramFeed'
import { fetchInstagramFeed } from '../lib/bookingApi'
import { trackEvent } from '../lib/analytics'

vi.mock('../lib/bookingApi', () => ({ fetchInstagramFeed: vi.fn() }))
vi.mock('../lib/analytics', () => ({ trackEvent: vi.fn() }))

const CDN = 'https://scontent.cdninstagram.com/v/'
const post = (id, overrides = {}) => ({
  id,
  type: 'photo',
  image: `${CDN}${id}.jpg`,
  caption: `Caption ${id}`,
  permalink: `https://www.instagram.com/p/${id}/`,
  timestamp: '2026-11-01T10:00:00+0000',
  ...overrides
})
const LIVE = {
  ok: true,
  updatedAt: '2026-11-03T08:00:00Z',
  posts: [post('A'), post('B', { type: 'reel' })]
}

beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
  localStorage.setItem('trendLang', 'en')
})

describe('normalizePosts', () => {
  it('drops anything that is not an https image and an https link', () => {
    const out = normalizePosts([
      post('ok'),
      post('http', { image: 'http://example.com/x.jpg' }),
      post('js', { permalink: 'javascript:alert(1)' }),
      null
    ])
    expect(out.map((p) => p.id)).toEqual(['ok'])
  })

  it('caps the feed and coerces unknown types to photo', () => {
    const out = normalizePosts(
      Array.from({ length: 20 }, (_, i) => post(`p${i}`, { type: 'story' }))
    )
    expect(out).toHaveLength(MAX_POSTS)
    expect(out.every((p) => p.type === 'photo')).toBe(true)
  })
})

describe('useInstagramFeed', () => {
  it('serves the live feed and caches it for the tab', async () => {
    fetchInstagramFeed.mockResolvedValue(LIVE)
    const { result } = renderHook(() => useInstagramFeed())
    expect(result.current.status).toBe('loading')

    await waitFor(() => expect(result.current.status).toBe('live'))
    expect(result.current.posts.map((p) => p.id)).toEqual(['A', 'B'])

    const again = renderHook(() => useInstagramFeed())
    expect(again.result.current.status).toBe('live')
    expect(fetchInstagramFeed).toHaveBeenCalledTimes(1)
  })

  it('falls back to the bundled photos while the feed is not connected', async () => {
    fetchInstagramFeed.mockResolvedValue({ ok: false, error: 'not_configured' })
    const { result } = renderHook(() => useInstagramFeed())
    await waitFor(() => expect(result.current.status).toBe('fallback'))
    expect(result.current.posts).toBe(FALLBACK_POSTS)
    expect(FALLBACK_POSTS.length).toBeGreaterThan(0)
    expect(FALLBACK_POSTS.every((p) => p.permalink === 'https://instagram.com/trendbytedi')).toBe(
      true
    )
  })

  it('falls back when the backend is unreachable or returns no usable posts', async () => {
    fetchInstagramFeed.mockResolvedValue({ ok: false, error: 'network' })
    const down = renderHook(() => useInstagramFeed())
    await waitFor(() => expect(down.result.current.status).toBe('fallback'))

    fetchInstagramFeed.mockResolvedValue({
      ok: true,
      posts: [post('x', { image: 'http://insecure' })]
    })
    const junk = renderHook(() => useInstagramFeed())
    await waitFor(() => expect(junk.result.current.status).toBe('fallback'))
  })

  it('remembers "no feed" for the tab, but retries after a network failure', async () => {
    fetchInstagramFeed.mockResolvedValue({ ok: false, error: 'not_configured' })
    const first = renderHook(() => useInstagramFeed())
    await waitFor(() => expect(first.result.current.status).toBe('fallback'))

    // Straight to the bundled photos: no placeholders, no second request.
    const second = renderHook(() => useInstagramFeed())
    expect(second.result.current.status).toBe('fallback')
    expect(fetchInstagramFeed).toHaveBeenCalledTimes(1)

    sessionStorage.clear()
    fetchInstagramFeed.mockResolvedValue({ ok: false, error: 'network' })
    const down = renderHook(() => useInstagramFeed())
    await waitFor(() => expect(down.result.current.status).toBe('fallback'))
    fetchInstagramFeed.mockResolvedValue(LIVE)
    const retry = renderHook(() => useInstagramFeed())
    expect(retry.result.current.status).toBe('loading')
    await waitFor(() => expect(retry.result.current.status).toBe('live'))
  })

  it('asks again once a "no feed" answer is older than 5 minutes', async () => {
    sessionStorage.setItem(
      'trend:instagram-feed',
      JSON.stringify({ at: Date.now() - 6 * 60 * 1000, posts: [] })
    )
    fetchInstagramFeed.mockResolvedValue(LIVE)
    const { result } = renderHook(() => useInstagramFeed())
    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('live'))
  })

  it('refetches once the cached copy is older than 30 minutes', async () => {
    sessionStorage.setItem(
      'trend:instagram-feed',
      JSON.stringify({ at: Date.now() - 31 * 60 * 1000, posts: [post('old')] })
    )
    fetchInstagramFeed.mockResolvedValue(LIVE)
    const { result } = renderHook(() => useInstagramFeed())
    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.posts.map((p) => p.id)).toEqual(['A', 'B']))
  })
})

describe('prefetchInstagramFeed', () => {
  it('lets the gallery open with posts and no request of its own', async () => {
    fetchInstagramFeed.mockResolvedValue(LIVE)
    await prefetchInstagramFeed()

    const { result } = renderHook(() => useInstagramFeed())
    expect(result.current.status).toBe('live')
    expect(result.current.posts.map((p) => p.id)).toEqual(['A', 'B'])
    expect(fetchInstagramFeed).toHaveBeenCalledTimes(1)
  })

  it('shares one request with a gallery that mounts while it is in flight', async () => {
    let answer
    fetchInstagramFeed.mockReturnValue(new Promise((resolve) => (answer = resolve)))
    const prefetching = prefetchInstagramFeed()
    const { result } = renderHook(() => useInstagramFeed())
    expect(result.current.status).toBe('loading')

    answer(LIVE)
    await prefetching
    await waitFor(() => expect(result.current.status).toBe('live'))
    expect(fetchInstagramFeed).toHaveBeenCalledTimes(1)
  })

  it('does nothing when the tab already has an answer', async () => {
    fetchInstagramFeed.mockResolvedValue(LIVE)
    await prefetchInstagramFeed()
    await prefetchInstagramFeed()
    expect(fetchInstagramFeed).toHaveBeenCalledTimes(1)
  })
})

describe('InstagramFeed', () => {
  const renderFeed = () =>
    render(
      <LanguageProvider>
        <InstagramFeed tag="Our Work" title="Gallery" as="h1" />
      </LanguageProvider>
    )

  it('shows placeholders, then one link per post to that post on Instagram', async () => {
    fetchInstagramFeed.mockResolvedValue(LIVE)
    renderFeed()

    expect(screen.getByRole('heading', { level: 1, name: 'Gallery' })).toBeInTheDocument()
    const grid = screen.getByRole('list')
    expect(grid).toHaveAttribute('aria-busy', 'true')

    const photo = await screen.findByRole('link', { name: 'Open on Instagram: Caption A' })
    expect(photo).toHaveAttribute('href', 'https://www.instagram.com/p/A/')
    expect(photo).toHaveAttribute('target', '_blank')
    expect(
      screen.getByRole('link', { name: 'Open on Instagram (reel): Caption B' })
    ).toBeInTheDocument()
    expect(within(grid).getAllByRole('link')).toHaveLength(2)
    expect(grid).toHaveAttribute('aria-busy', 'false')
  })

  it('tracks post opens and follow clicks', async () => {
    fetchInstagramFeed.mockResolvedValue(LIVE)
    renderFeed()
    ;(await screen.findByRole('link', { name: /Caption A/ })).click()
    expect(trackEvent).toHaveBeenCalledWith('select_content', {
      content_type: 'instagram_post',
      item_id: 'A',
      location: 'gallery_page',
      feed: 'live'
    })

    screen.getByRole('link', { name: /Follow on Instagram/ }).click()
    expect(trackEvent).toHaveBeenCalledWith('share', {
      method: 'instagram',
      location: 'gallery_page',
      link: 'follow_button'
    })
  })

  it('renders the bundled photos, labelled by their alt text, when the feed is unavailable', async () => {
    fetchInstagramFeed.mockResolvedValue({ ok: false, error: 'not_configured' })
    renderFeed()
    await waitFor(() => expect(screen.getByRole('list')).toHaveAttribute('aria-busy', 'false'))
    const links = within(screen.getByRole('list')).getAllByRole('link')
    expect(links).toHaveLength(FALLBACK_POSTS.length)
    expect(links[0]).toHaveAccessibleName(`Open on Instagram: ${FALLBACK_POSTS[0].alt}`)
  })
})
