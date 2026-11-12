import { renderHook } from '@testing-library/react'
import { useGalleryPrefetch } from '../hooks/useGalleryPrefetch'
import { prefetchInstagramFeed } from '../hooks/useInstagramFeed'

vi.mock('../hooks/useInstagramFeed', () => ({ prefetchInstagramFeed: vi.fn(() => Promise.resolve()) }))
vi.mock('../pages/GalleryPage', () => ({ default: () => null }))

const setConnection = (value) =>
  Object.defineProperty(navigator, 'connection', { value, configurable: true })

/** Past the settle delay and the idle fallback, then let the dynamic imports land. */
const settle = async () => {
  await vi.advanceTimersByTimeAsync(10000)
  await vi.dynamicImportSettled()
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  setConnection(undefined)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useGalleryPrefetch', () => {
  it('prefetches the feed once the page has settled, not before', async () => {
    renderHook(() => useGalleryPrefetch(true))
    await vi.advanceTimersByTimeAsync(1000)
    expect(prefetchInstagramFeed).not.toHaveBeenCalled()

    await settle()
    expect(prefetchInstagramFeed).toHaveBeenCalledTimes(1)
  })

  it('stays out of the way on the gallery page itself', async () => {
    renderHook(() => useGalleryPrefetch(false))
    await settle()
    expect(prefetchInstagramFeed).not.toHaveBeenCalled()
  })

  it('skips data-saver and 2G connections', async () => {
    setConnection({ saveData: true })
    renderHook(() => useGalleryPrefetch(true))
    await settle()

    setConnection({ effectiveType: 'slow-2g' })
    renderHook(() => useGalleryPrefetch(true))
    await settle()
    expect(prefetchInstagramFeed).not.toHaveBeenCalled()
  })

  it('cancels when the visitor leaves before it fires', async () => {
    const { unmount } = renderHook(() => useGalleryPrefetch(true))
    unmount()
    await settle()
    expect(prefetchInstagramFeed).not.toHaveBeenCalled()
  })
})
