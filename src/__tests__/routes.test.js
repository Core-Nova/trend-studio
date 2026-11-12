import { PATHS, samePath, pathLang, stripLang, localePath } from '../lib/routes'

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

  it('treats the English URL as the same page as its PATHS entry', () => {
    expect(samePath('/en/contact/', PATHS.contact)).toBe(true)
    expect(samePath('/en/contact', PATHS.contact)).toBe(true)
    expect(samePath('/en/', PATHS.home)).toBe(true)
    expect(samePath('/en', PATHS.home)).toBe(true)
    expect(samePath('/en/book', PATHS.book)).toBe(true)
    expect(samePath('/en/gallery/', PATHS.contact)).toBe(false)
    expect(samePath('/en/', PATHS.contact)).toBe(false)
  })
})

describe('pathLang', () => {
  it('reads English from the /en prefix and Bulgarian from everything else', () => {
    expect(pathLang('/en')).toBe('en')
    expect(pathLang('/en/')).toBe('en')
    expect(pathLang('/en/gallery/')).toBe('en')
    expect(pathLang('/')).toBe('bg')
    expect(pathLang('/gallery/')).toBe('bg')
    expect(pathLang('')).toBe('bg')
  })

  it('is not fooled by a page whose name merely starts with "en"', () => {
    expect(pathLang('/english/')).toBe('bg')
    expect(pathLang('/enquiry')).toBe('bg')
    expect(stripLang('/english/')).toBe('/english/')
  })
})

describe('stripLang', () => {
  it('returns the Bulgarian path of an English URL', () => {
    expect(stripLang('/en/gallery/')).toBe('/gallery/')
    expect(stripLang('/en/')).toBe('/')
    expect(stripLang('/en')).toBe('/')
    expect(stripLang('/gallery/')).toBe('/gallery/')
  })
})

describe('localePath', () => {
  it('moves a PATHS entry into the language URL space', () => {
    expect(localePath(PATHS.gallery, 'en')).toBe('/en/gallery/')
    expect(localePath(PATHS.home, 'en')).toBe('/en/')
    expect(localePath(PATHS.book, 'en')).toBe('/en/book')
    expect(localePath(PATHS.gallery, 'bg')).toBe('/gallery/')
    expect(localePath(PATHS.home, 'bg')).toBe('/')
  })

  it('switches a page between its two URLs (the language toggle)', () => {
    expect(localePath('/en/services/', 'bg')).toBe('/services/')
    expect(localePath('/en/', 'bg')).toBe('/')
    expect(localePath('/en', 'bg')).toBe('/')
    expect(localePath('/services/', 'en')).toBe('/en/services/')
  })

  it('never doubles the prefix', () => {
    expect(localePath('/en/services/', 'en')).toBe('/en/services/')
    expect(localePath('/en/', 'en')).toBe('/en/')
  })
})
