/**
 * TREND Booking — shared configuration and helpers.
 *
 * Everything tunable lives here. Working hours are NOT here — they live in
 * the "TREND Booking Config" spreadsheet (see WorkingHours.gs) so the owner
 * can edit them without touching code.
 */

const CONFIG = {
  salonName: 'TREND Hair Boutique Studio',
  address: '8 Tsar Kaloyan St, Mezzanine, Sofia 1000',
  phone: '+359 888 599 590',
  phoneDisplay: '0888 599 590',
  mapsUrl: 'https://maps.google.com/?q=TREND+Hair+Boutique+Studio+Tsar+Kaloyan+8+Sofia',
  website: 'https://trendbytedi.com',

  slotStepMin: 30, // slot grid granularity
  minLeadMin: 120, // can't book less than 2h ahead
  horizonDays: 14, // how far ahead slots are offered
  maxBookingMin: 480,
  defaultServiceMin: 60, // fallback for unmatched Studio24 service names

  // Website-booking abuse limits. Only bookings that actually land in the
  // calendar count, so a client who retries after "slot taken" is never
  // locked out.
  maxBookingsPerClientPerHour: 3, // per email AND per phone
  maxWebsiteBookingsPerDay: 30, // whole site — a consumer account can send ~100 invites/day

  cacheSec: { hours: 600, reviews: 21600 },

  // Gmail labels, so the owner can see in the inbox what every booking email
  // did. Labels sit on THREADS and Gmail threads mail with the same subject,
  // so one thread can carry several. setup() creates them all; a missing one
  // is created when first used. Only `studio24Synced` (first-run search) and
  // `declinesSynced` (decline-pass search) are ever read back by the code —
  // rename those two only together with their threads.
  labels: {
    // Something a person should look at; the thread's other labels say why.
    // Remove it once handled — it is added again only by a new problem.
    needsCheck: 'needs-check',

    studio24Synced: 'studio24-synced', // every Studio24 email the sync handled
    studio24Booked: 'studio24-booked', // new booking → event created
    studio24Updated: 'studio24-updated', // re-sent with other services → event updated
    studio24Duplicate: 'studio24-duplicate', // sent twice → nothing changed
    studio24Cancelled: 'studio24-cancelled', // cancellation → event deleted
    studio24Trimmed: 'studio24-trimmed', // partial cancellation → event shortened
    studio24NotFound: 'studio24-not-found', // cancellation matched no event (+ needs-check)
    // Length is a guess: a service missing from the Services tab (+ needs-check)
    // — the Gmail twin of the ⚠️ event title.
    studio24DefaultTime: 'studio24-default-time',
    // Neither a new booking nor a cancellation; nothing changed (+ needs-check
    // when it is about a booking).
    studio24Unrecognized: 'studio24-unrecognized',
    // Still threw after maxAttempts runs: NOT synced (+ needs-check; owner emailed).
    studio24Failed: 'studio24-failed',

    declinesSynced: 'declines-synced', // every "Declined: …" notification read
    declinesRemoved: 'declines-removed', // client declined → booking deleted
    declinesKept: 'declines-kept', // client answered again / another guest declined → kept
    declinesNotFound: 'declines-not-found', // no booking at that time (already removed)
    // A "Declined:" subject the parser can't read — the calendar sweep still
    // removes the booking; a run of these means Google changed its format.
    declinesUnreadable: 'declines-unreadable',
  },

  studio24: {
    from: 'info@studio24.bg',
    maxAttempts: 3,
    // Each run re-reads mail this far before the previous run started, so a
    // message Gmail indexes late is not skipped; the per-message ledger keeps
    // the overlap from processing anything twice (see Studio24Sync.gs).
    scanOverlapMin: 60,
    newSubjectRe: /^Нова резервация от (.+?) на (\d{2})\.(\d{2})\.(\d{4}) в (\d{1,2}):(\d{2})/,
    cancelSubjectRe: /^Отменена резервация от /,
  },

  // Emails about sync problems that need a human — a Studio24 mail that kept
  // failing or could not be read. Sent to the ALERT_EMAIL script property,
  // or to the script's own account when that is unset.
  alerts: { enabled: true, maxPerDay: 10 },
}

function getProp_(key) {
  return PropertiesService.getScriptProperties().getProperty(key)
}

function setProp_(key, value) {
  PropertiesService.getScriptProperties().setProperty(key, value)
}

/** Owner's main calendar unless a CALENDAR_ID script property overrides it. */
function getCalendar_() {
  const id = getProp_('CALENDAR_ID')
  return id ? CalendarApp.getCalendarById(id) : CalendarApp.getDefaultCalendar()
}

function clampInt_(value, min, max, fallback) {
  const n = parseInt(value, 10)
  if (isNaN(n)) return fallback
  return Math.max(min, Math.min(max, n))
}

function startOfDay_(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Exactly days * 24h later — fine for range bounds, NOT for calendar days. */
function addDays_(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

/**
 * Local midnight `days` calendar days after `date`'s day. Unlike addDays_ it
 * stays on midnight across a DST change (a Sofia day is 23h or 25h then).
 */
function dayAt_(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

/** `day` at a wall-clock minute of the day (540 → 09:00), DST-safe. */
function atMinute_(day, minutes) {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, minutes)
}

function minutesOfDay_(date) {
  return date.getHours() * 60 + date.getMinutes()
}

function digits_(value) {
  return String(value || '').replace(/\D/g, '')
}

/** One line of user text: control chars/newlines → spaces, collapsed, capped. */
function cleanText_(value, maxLen) {
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen)
    .trim()
}

/** Timed (non-all-day) events overlapping [start, end) — what counts as busy. */
function timedEvents_(start, end) {
  return getCalendar_()
    .getEvents(start, end)
    .filter(function (ev) {
      return !ev.isAllDayEvent()
    })
}

/** Appends one row to the SyncLog tab — the audit trail for every action. */
function logSync_(type, subject, result) {
  try {
    const ss = SpreadsheetApp.openById(getProp_('CONFIG_SPREADSHEET_ID'))
    ss.getSheetByName('SyncLog').appendRow([new Date(), type, subject, result])
  } catch (err) {
    console.error('logSync_ failed: ' + err)
  }
}

/**
 * Emails a problem that needs a human (see CONFIG.alerts). Capped per day so
 * a broken Studio24 format can't flood the inbox; never throws.
 */
function notifyOwner_(subject, lines) {
  if (!CONFIG.alerts.enabled) return
  try {
    const cache = CacheService.getScriptCache()
    const key = 'alerts_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd')
    const sent = Number(cache.get(key) || 0)
    if (sent >= CONFIG.alerts.maxPerDay) return
    cache.put(key, String(sent + 1), 21600)
    const to = getProp_('ALERT_EMAIL') || Session.getEffectiveUser().getEmail()
    const sheet = 'https://docs.google.com/spreadsheets/d/' + getProp_('CONFIG_SPREADSHEET_ID')
    GmailApp.sendEmail(to, '[TREND booking] ' + subject, lines.concat(['', 'SyncLog: ' + sheet]).join('\n'))
  } catch (err) {
    console.error('notifyOwner_ failed: ' + err)
  }
}
