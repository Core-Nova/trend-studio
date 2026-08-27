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

  cacheSec: { hours: 600, reviews: 21600 },

  studio24: {
    from: 'info@studio24.bg',
    label: 'studio24-synced',
    // Added ALONGSIDE `label` when a booking's length fell back to
    // defaultServiceMin because a service name wasn't in the Services tab —
    // the Gmail-side twin of the UNMATCHED_PREFIX_ event-title marker, so the
    // threads whose times need checking by hand are one click away.
    defaultTimeLabel: 'studio24-default-time',
    newSubjectRe: /^Нова резервация от (.+?) на (\d{2})\.(\d{2})\.(\d{4}) в (\d{1,2}):(\d{2})/,
    cancelSubjectRe: /^Отменена резервация от /,
  },

  // Gmail label for processed Google Calendar "Declined: …" notifications
  // (see DeclinedBookings.gs).
  declineLabel: 'declines-synced',
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

function addDays_(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

function minutesOfDay_(date) {
  return date.getHours() * 60 + date.getMinutes()
}

function digits_(value) {
  return String(value || '').replace(/\D/g, '')
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
