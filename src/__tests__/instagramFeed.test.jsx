/**
 * The gallery page's Instagram feed: posts are bundled with the site (no
 * backend), shown uncropped, and each tile links to its post.
 */
import { render, screen, within } from '@testing-library/react'
import { LanguageProvider } from '../contexts/LanguageContext'
import { InstagramFeed } from '../components/InstagramFeed/InstagramFeed'
import { instagramPosts } from '../data/imageImports'
import { trackEvent } from '../lib/analytics'
import photos from '../data/photos.json'

vi.mock('../lib/analytics', () => ({ trackEvent: vi.fn() }))

const renderFeed = (lang = 'en') => {
  localStorage.setItem('trendLang', lang)
  return render(
    <LanguageProvider>
      <InstagramFeed tag="Our Work" title="Gallery" as="h1" />
    </LanguageProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => vi.unstubAllGlobals())

describe('InstagramFeed', () => {
  it('shows every bundled post at once, without asking any server', () => {
    renderFeed()
    expect(screen.getByRole('heading', { level: 1, name: 'Gallery' })).toBeInTheDocument()
    const tiles = within(screen.getByRole('list')).getAllByRole('link')
    expect(tiles).toHaveLength(photos.instagram.length)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('links each tile to its own post, newest first', () => {
    renderFeed()
    const hrefs = within(screen.getByRole('list'))
      .getAllByRole('link')
      .map((a) => a.getAttribute('href'))
    expect(hrefs).toEqual(photos.instagram.map((p) => `https://www.instagram.com/p/${p.shortcode}/`))
    for (const a of within(screen.getByRole('list')).getAllByRole('link')) {
      expect(a).toHaveAttribute('target', '_blank')
    }
  })

  it('keeps each photo’s own shape (width/height), so nothing is cropped', () => {
    renderFeed()
    const imgs = screen.getByRole('list').querySelectorAll('img')
    photos.instagram.forEach((p, i) => {
      expect(imgs[i]).toHaveAttribute('width', String(p.width))
      expect(imgs[i]).toHaveAttribute('height', String(p.height))
    })
  })

  it('describes each post in the page’s language', () => {
    const [first] = photos.instagram
    const { unmount } = renderFeed('bg')
    expect(screen.getByAltText(`${first.alt.bg} — TREND Hair Boutique Studio, София`)).toBeInTheDocument()
    unmount()
    renderFeed('en')
    const label = first.type === 'photo' ? `Open on Instagram: ${first.alt.en}` : `Open on Instagram (${first.type}): ${first.alt.en}`
    expect(screen.getByRole('link', { name: label })).toBeInTheDocument()
  })

  it('tracks post opens and follow clicks', () => {
    renderFeed()
    const [first] = instagramPosts
    within(screen.getByRole('list')).getAllByRole('link')[0].click()
    expect(trackEvent).toHaveBeenCalledWith('select_content', {
      content_type: 'instagram_post',
      item_id: first.id,
      location: 'gallery_page'
    })

    screen.getByRole('link', { name: /Follow on Instagram/ }).click()
    expect(trackEvent).toHaveBeenCalledWith('instagram_follow_click', {
      location: 'gallery_page_follow_button',
      language: 'bg'
    })
  })
})
