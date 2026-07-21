/**
 * Pure helpers for the /book flow — selection model, totals, and form
 * validation. Kept out of hooks/components so they are unit-testable.
 */

import servicesData from '../data/services.json'

/**
 * Flattens services.json into selectable entries with stable keys.
 * Items with `options` require picking exactly one option (durations and
 * prices differ per option); items without options are selectable directly.
 */
export function getBookableCategories() {
  return servicesData.services.categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    items: cat.items.map((item, itemIdx) => ({
      key: `${cat.id}:${itemIdx}`,
      name: item.name,
      duration: item.duration,
      minutes: item.minutes,
      priceEur: item.price_eur,
      priceNote: item.price_note,
      options: item.options
        ? item.options.map((opt, optIdx) => ({
            key: `${cat.id}:${itemIdx}:${optIdx}`,
            name: opt.name,
            duration: opt.duration,
            minutes: opt.minutes,
            priceEur: opt.eur,
          }))
        : null,
    })),
  }))
}

/**
 * Selections: array of `{ item, option }` where `option` is null for
 * option-less items. Returns summed `{ minutes, priceEur }`.
 */
export function computeTotals(selections) {
  return selections.reduce(
    (acc, { item, option }) => {
      const source = option || item
      return {
        minutes: acc.minutes + (source.minutes || 0),
        priceEur: acc.priceEur + (source.priceEur || 0),
      }
    },
    { minutes: 0, priceEur: 0 }
  )
}

/**
 * Maps selections to the bookAppointment payload's `services` array.
 * Names are sent in Bulgarian — the owner's calendar is their work surface.
 */
export function selectionsToServices(selections) {
  return selections.map(({ item, option }) => ({
    name: option ? `${item.name.bg} — ${option.name.bg}` : item.name.bg,
    minutes: (option || item).minutes,
    priceEur: (option || item).priceEur,
  }))
}

/** '1 h 30 min' / '1 ч 30 мин' from minutes and localized unit labels. */
export function formatMinutes(minutes, hourLabel, minLabel) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h && m) return `${h} ${hourLabel} ${m} ${minLabel}`
  if (h) return `${h} ${hourLabel}`
  return `${m} ${minLabel}`
}

/**
 * Parses the availability API's 'yyyy-mm-dd' as a LOCAL date (new Date(str)
 * would treat it as UTC midnight and can shift a day in western timezones).
 */
export function dateFromYMD(ymd) {
  const [y, m, d] = String(ymd).split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function isValidName(value) {
  return String(value || '').trim().length >= 2
}

export function isValidEmail(value) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(value || '').trim())
}

export function isValidPhone(value) {
  const digits = String(value || '').replace(/\D/g, '')
  return digits.length >= 6 && digits.length <= 15
}
