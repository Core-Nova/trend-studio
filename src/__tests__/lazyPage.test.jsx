/**
 * A tab left open across a deploy asks for chunk files the deploy deleted.
 * lazyPage reloads once (fresh HTML → new chunks) instead of crashing into the
 * ErrorBoundary, and only lets the error through if it fails again right after.
 */
import { Suspense, createElement } from 'react'
import { render, screen } from '@testing-library/react'
import { lazyPage } from '../lib/lazyPage'
import { ErrorBoundary } from '../components/ErrorBoundary'

const staleChunk = () =>
  Promise.reject(new TypeError('Failed to fetch dynamically imported module: /assets/ServicesPage-old.js'))

const renderPage = (lazyComponent) =>
  render(
    <ErrorBoundary>
      <Suspense fallback={<p>loading</p>}>{createElement(lazyComponent)}</Suspense>
    </ErrorBoundary>
  )

let reload

beforeEach(() => {
  sessionStorage.clear()
  reload = vi.spyOn(window.location, 'reload').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {}) // React logs caught errors
})

afterEach(() => vi.restoreAllMocks())

it('renders the page when its chunk loads', async () => {
  const Page = lazyPage(() => Promise.resolve({ default: () => <h1>Services</h1> }))
  renderPage(Page)
  expect(await screen.findByRole('heading', { name: 'Services' })).toBeInTheDocument()
  expect(reload).not.toHaveBeenCalled()
})

it('reloads instead of showing the error screen when the chunk is gone', async () => {
  renderPage(lazyPage(staleChunk))
  await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1))
  expect(screen.getByText('loading')).toBeInTheDocument()
  expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
})

it('shows the error screen if the chunk still fails right after that reload', async () => {
  sessionStorage.setItem('trend:stale-chunk-reload', String(Date.now() - 2000))
  renderPage(lazyPage(staleChunk))
  expect(await screen.findByText('Something went wrong')).toBeInTheDocument()
  expect(reload).not.toHaveBeenCalled()
})

it('reloads again for a later deploy', async () => {
  sessionStorage.setItem('trend:stale-chunk-reload', String(Date.now() - 60_000))
  renderPage(lazyPage(staleChunk))
  await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1))
})
