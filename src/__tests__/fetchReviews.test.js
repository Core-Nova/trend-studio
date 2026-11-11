// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { mergeReviews, parseHeader } from '../../scripts/fetch-reviews.mjs'

const review = (name, text, date = '2025-06-19', rating = 5) => ({
  id: '0',
  name,
  rating,
  text: { en: text, bg: text },
  date,
})

const snapshot = {
  rating: 5,
  totalCount: 54,
  profileUrl: 'https://maps.example/old',
  reviews: [review('Ann', 'Old long text from the first scrape'), review('Bob', 'Bob text')],
}

describe('mergeReviews', () => {
  it('keeps every snapshot review and puts new ones first, newest first', () => {
    const scraped = {
      rating: 5,
      totalCount: 60,
      reviews: [review('Cat', 'New', '2026-08-10'), review('Bob', 'Bob text'), review('Dan', 'Newer', '2026-10-27')],
    }
    const merged = mergeReviews(snapshot, scraped)

    expect(merged.reviews.map(r => r.name)).toEqual(['Dan', 'Cat', 'Ann', 'Bob'])
    expect(merged.reviews.map(r => r.id)).toEqual(['1', '2', '3', '4'])
    expect(merged.added).toBe(2)
    expect(merged.totalCount).toBe(60)
  })

  it('keeps the snapshot date and the longer text for a known reviewer', () => {
    const scraped = { rating: 5, totalCount: 60, reviews: [review(' ann ', 'Old long…', '2025-11-10')] }
    const [ann] = mergeReviews(snapshot, scraped).reviews

    expect(ann.date).toBe('2025-06-19')
    expect(ann.text.en).toBe('Old long text from the first scrape')
  })

  it('never shrinks the list or zeroes the header when the scrape misses them', () => {
    const merged = mergeReviews(snapshot, { rating: null, totalCount: null, reviews: [] })

    expect(merged.reviews).toHaveLength(2)
    expect(merged.rating).toBe(5)
    expect(merged.totalCount).toBe(54)
    expect(merged.profileUrl).toBe('https://maps.example/old')
  })

  it('works without a snapshot', () => {
    const merged = mergeReviews(null, { rating: 5, totalCount: 3, reviews: [review('Eve', 'Hi')] })
    expect(merged.reviews.map(r => r.name)).toEqual(['Eve'])
  })

  it('keeps highest-rated reviews first, so a new low rating does not lead the carousel', () => {
    const scraped = {
      rating: 4.9,
      totalCount: 60,
      reviews: [review('Low', 'Meh', '2026-11-01', 1), review('Four', 'Good', '2026-10-01', 4), review('New5', 'Great', '2026-09-01')],
    }
    const merged = mergeReviews(snapshot, scraped)

    expect(merged.reviews.map(r => r.name)).toEqual(['New5', 'Ann', 'Bob', 'Four', 'Low'])
    expect(merged.rating).toBe(4.9)
  })
})

describe('parseHeader', () => {
  it('reads the Bulgarian header Google serves from Sofia', () => {
    // The live .F7nice block, Nov 2026
    expect(parseHeader([' звезди', '4,9 звезди ', '60 отзива'])).toEqual({ rating: 4.9, count: 60 })
  })

  it('reads the English header, thousands separators included', () => {
    expect(parseHeader(['4.8 stars', '1,234 reviews'])).toEqual({ rating: 4.8, count: 1234 })
  })

  it('ignores single-review stars and histogram rows', () => {
    expect(parseHeader(['5 звезди', '5 звезди,58 отзива', '4 stars, 1 review'])).toEqual({ rating: null, count: null })
  })

  it('returns nulls rather than a default when nothing matches', () => {
    expect(parseHeader([])).toEqual({ rating: null, count: null })
  })
})
