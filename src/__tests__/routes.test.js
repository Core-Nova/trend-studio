import { PATHS, samePath } from '../lib/routes'

describe('PATHS', () => {
  it('uses the trailing-slash URL every prerendered page is served at', () => {
    expect(PATHS.home).toBe('/')
    for (const key of ['gallery', 'about', 'services', 'contact']) {
      expect(PATHS[key]).toBe(`/${key}/`)
    }
  })
})

describe('samePath', () => {
  it('treats a trailing slash as the same page', () => {
    expect(samePath('/contact/', '/contact')).toBe(true)
    expect(samePath('/contact', PATHS.contact)).toBe(true)
    expect(samePath('/', PATHS.home)).toBe(true)
  })

  it('still tells different pages apart', () => {
    expect(samePath('/contact/', '/')).toBe(false)
    expect(samePath('/gallery/', '/gallery-old/')).toBe(false)
    expect(samePath('', '/about')).toBe(false)
  })
})
