import {
  getBookableCategories,
  computeTotals,
  selectionsToServices,
  isValidName,
  isValidEmail,
  isValidPhone,
} from '../lib/bookingUtils'

describe('getBookableCategories', () => {
  const categories = getBookableCategories()

  it('returns the three service categories', () => {
    expect(categories.map((c) => c.id)).toEqual([
      'haircuts-styling',
      'coloring',
      'hair-treatments',
    ])
  })

  it('every item and option carries numeric minutes', () => {
    categories.forEach((cat) => {
      cat.items.forEach((item) => {
        expect(item.minutes, `${item.key} minutes`).toBeGreaterThan(0)
        if (item.options) {
          item.options.forEach((opt) => {
            expect(opt.minutes, `${opt.key} minutes`).toBeGreaterThan(0)
          })
        }
      })
    })
  })

  it('assigns stable unique keys', () => {
    const keys = categories.flatMap((cat) =>
      cat.items.flatMap((item) => [item.key, ...(item.options || []).map((o) => o.key)])
    )
    expect(new Set(keys).size).toBe(keys.length)
  })
})

describe('computeTotals', () => {
  const categories = getBookableCategories()
  const bangsTrim = categories[0].items.find((i) => i.name.en === 'Bangs Trim')
  const womensHaircut = categories[0].items.find((i) => i.name.en === "Women's Haircut")

  it('sums minutes and prices across selections', () => {
    const totals = computeTotals([
      { item: bangsTrim, option: null },
      { item: womensHaircut, option: womensHaircut.options[0] },
    ])
    expect(totals.minutes).toBe(15 + 45)
    expect(totals.priceEur).toBeCloseTo(5.11 + 17.9)
  })

  it('uses the option values (not the item base) when an option is picked', () => {
    const premiumTrend = womensHaircut.options[2]
    const totals = computeTotals([{ item: womensHaircut, option: premiumTrend }])
    expect(totals.minutes).toBe(60)
    expect(totals.priceEur).toBeCloseTo(38.35)
  })

  it('returns zeros for an empty selection', () => {
    expect(computeTotals([])).toEqual({ minutes: 0, priceEur: 0 })
  })
})

describe('selectionsToServices', () => {
  const categories = getBookableCategories()
  const bangsTrim = categories[0].items.find((i) => i.name.en === 'Bangs Trim')
  const womensHaircut = categories[0].items.find((i) => i.name.en === "Women's Haircut")

  it('sends Bulgarian names with option suffix', () => {
    const services = selectionsToServices([
      { item: bangsTrim, option: null },
      { item: womensHaircut, option: womensHaircut.options[0] },
    ])
    expect(services).toEqual([
      { name: 'Подстригване на бретон', minutes: 15, priceEur: 5.11 },
      { name: 'Дамско подстригване — с клас Standard грижа', minutes: 45, priceEur: 17.9 },
    ])
  })
})

describe('validators', () => {
  it('validates names', () => {
    expect(isValidName('Al')).toBe(true)
    expect(isValidName('  A ')).toBe(false)
    expect(isValidName('')).toBe(false)
  })

  it('validates emails', () => {
    expect(isValidEmail('client@example.com')).toBe(true)
    expect(isValidEmail('no-at-sign')).toBe(false)
    expect(isValidEmail('a@b')).toBe(false)
  })

  it('validates phones with formatting characters', () => {
    expect(isValidPhone('0888 599 590')).toBe(true)
    expect(isValidPhone('+359 (888) 599-590')).toBe(true)
    expect(isValidPhone('12345')).toBe(false)
    expect(isValidPhone('1234567890123456')).toBe(false)
  })
})
