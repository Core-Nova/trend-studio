import { renderHook } from '@testing-library/react'

// Records each time the gallery's code chunk is actually loaded.
const { pageLoaded } = vi.hoisted(() => ({ pageLoaded: vi.fn() }))
vi.mock('../pages/GalleryPage', () => {
  pageLoaded()
  return { default: () => null }
})

let useGalleryPrefetch

const setConnection = (value) =>
  Object.defineProperty(navigator, 'connection', { value, configurable: true })

/** Past the settle delay and the idle fallback, then let the dynamic import land. */
const settle = async () => {
  await vi.advanceTimersByTimeAsync(10000)
  await vi.dynamicImportSettled()
}

beforeEach(async () => {
  vi.clearAllMocks()
  // A fresh module registry per test, so every test sees the chunk load (or not) itself.
  vi.resetModules()
  ;({ useGalleryPrefetch } = await import('../hooks/useGalleryPrefetch'))
  vi.useFakeTimers()
  setConnection(undefined)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useGalleryPrefetch', () => {
  it('loads the gallery chunk once the page has settled, not before', async () => {
    renderHook(() => useGalleryPrefetch(true))
    await vi.advanceTimersByTimeAsync(1000)
    expect(pageLoaded).not.toHaveBeenCalled()

    await settle()
    expect(pageLoaded).toHaveBeenCalledTimes(1)
  })

  it('stays out of the way on the gallery page itself', async () => {
    renderHook(() => useGalleryPrefetch(false))
    await settle()
    expect(pageLoaded).not.toHaveBeenCalled()
  })

  it('skips data-saver and 2G connections', async () => {
    setConnection({ saveData: true })
    renderHook(() => useGalleryPrefetch(true))
    await settle()

    setConnection({ effectiveType: 'slow-2g' })
    renderHook(() => useGalleryPrefetch(true))
    await settle()
    expect(pageLoaded).not.toHaveBeenCalled()
  })

  it('cancels when the visitor leaves before it fires', async () => {
    const { unmount } = renderHook(() => useGalleryPrefetch(true))
    unmount()
    await settle()
    expect(pageLoaded).not.toHaveBeenCalled()
  })
})
