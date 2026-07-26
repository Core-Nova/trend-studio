/**
 * TREND Booking — working hours + service durations from the config
 * spreadsheet ("TREND Booking Config", created by setup() in Setup.gs).
 *
 * Tabs read here:
 *  - Hours:     Day | Open | Close | Closed   (weekly schedule, Mon..Sun)
 *  - Overrides: Date | Open | Close | Closed  (holidays/vacations, yyyy-mm-dd)
 *  - Services:  Name (BG) | Minutes           (durations for Studio24 sync)
 *
 * Everything is cached ~10 min so the owner's edits apply without redeploys.
 */

const DAY_INDEX_ = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

function loadHoursConfig_() {
  const cache = CacheService.getScriptCache()
  const hit = cache.get('hoursConfig')
  if (hit) return JSON.parse(hit)
  const ss = SpreadsheetApp.openById(getProp_('CONFIG_SPREADSHEET_ID'))
  const cfg = { weekly: readHoursTab_(ss), overrides: readOverridesTab_(ss) }
  cache.put('hoursConfig', JSON.stringify(cfg), CONFIG.cacheSec.hours)
  return cfg
}

/** → array indexed by JS getDay() (0=Sun..6=Sat) of {open, close, closed}. */
function readHoursTab_(ss) {
  const rows = ss.getSheetByName('Hours').getDataRange().getValues().slice(1)
  const weekly = []
  rows.forEach(function (row) {
    const idx = DAY_INDEX_[String(row[0]).slice(0, 3)]
    if (idx === undefined) return
    weekly[idx] = { open: cellToHHMM_(row[1]), close: cellToHHMM_(row[2]), closed: isTruthy_(row[3]) }
  })
  return weekly
}

/** → map of 'yyyy-MM-dd' → {open, close, closed}. */
function readOverridesTab_(ss) {
  const rows = ss.getSheetByName('Overrides').getDataRange().getValues().slice(1)
  const tz = Session.getScriptTimeZone()
  const overrides = {}
  rows.forEach(function (row) {
    if (!row[0]) return
    const key =
      row[0] instanceof Date
        ? Utilities.formatDate(row[0], tz, 'yyyy-MM-dd')
        : String(row[0]).trim()
    overrides[key] = { open: cellToHHMM_(row[1]), close: cellToHHMM_(row[2]), closed: isTruthy_(row[3]) }
  })
  return overrides
}

/** Returns { openMin, closeMin } (minutes since midnight) or null when closed. */
function hoursForDate_(date) {
  const cfg = loadHoursConfig_()
  const key = Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd')
  const row = cfg.overrides[key] || cfg.weekly[date.getDay()]
  if (!row || row.closed || !row.open || !row.close) return null
  return { openMin: toMin_(row.open), closeMin: toMin_(row.close) }
}

/**
 * Matches a Studio24 email service name to a Services-tab entry by WORDS:
 * an entry matches when every word of its name is present in the email's
 * service line. Punctuation (+ / , . ( ) -) is treated as a separator, so
 * descriptors Studio24 inserts — "клас", "за коса", "размер M", "на дълга
 * коса" — don't break the match the way a rigid substring test did. The most
 * specific entry (the one covering the most words) wins. Returns the matched
 * entry, or a synthetic { name: null } carrying the default duration so the
 * caller can tell "matched a 60-min service" from "matched nothing".
 */
function matchService_(emailServiceName) {
  const map = loadServicesMap_()
  const targetTokens = tokenize_(emailServiceName)
  let best = null
  map.forEach(function (entry) {
    const allPresent = entry.tokens.every(function (tok) {
      return targetTokens.indexOf(tok) !== -1
    })
    if (!allPresent) return
    if (!best || entry.tokens.length > best.tokens.length) best = entry
  })
  return best || { name: null, minutes: CONFIG.defaultServiceMin }
}

/** Duration in minutes for a Studio24 service name (see matchService_). */
function serviceMinutes_(emailServiceName) {
  return matchService_(emailServiceName).minutes
}

function loadServicesMap_() {
  const cache = CacheService.getScriptCache()
  // 'servicesMap2' — bumped from 'servicesMap' so the token-carrying shape
  // isn't read from a pre-upgrade cache entry.
  const hit = cache.get('servicesMap2')
  if (hit) return JSON.parse(hit)
  const ss = SpreadsheetApp.openById(getProp_('CONFIG_SPREADSHEET_ID'))
  const rows = ss.getSheetByName('Services').getDataRange().getValues().slice(1)
  const map = rows
    .filter(function (row) {
      return row[0] && Number(row[1]) > 0
    })
    .map(function (row) {
      return { name: normalize_(row[0]), tokens: tokenize_(row[0]), minutes: Number(row[1]) }
    })
  cache.put('servicesMap2', JSON.stringify(map), CONFIG.cacheSec.hours)
  return map
}

function normalize_(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim()
}

/** Lowercase word tokens, with +/,.()- treated as separators. */
function tokenize_(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[+\/,.()-]/g, ' ')
    .split(/\s+/)
    .filter(function (tok) {
      return tok.length > 0
    })
}

/** Accepts 'HH:mm' strings or Date cells (if Sheets coerced the value). */
function cellToHHMM_(cell) {
  if (cell instanceof Date) return Utilities.formatDate(cell, Session.getScriptTimeZone(), 'HH:mm')
  const s = String(cell || '').trim()
  return /^\d{1,2}:\d{2}$/.test(s) ? s : ''
}

function toMin_(hhmm) {
  const parts = hhmm.split(':')
  return Number(parts[0]) * 60 + Number(parts[1])
}

function isTruthy_(cell) {
  return cell === true || String(cell).toUpperCase() === 'TRUE'
}
