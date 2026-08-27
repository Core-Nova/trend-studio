/**
 * TREND Booking — declined invites.
 *
 * Declining a Google Calendar invite does NOT delete the event: it only flips
 * that guest's response to "No", so the slot stays busy in getAvailability().
 * The Studio24 processor never sees it either — syncStudio24Emails() reads
 * only mail from info@studio24.bg with the "Нова/Отменена резервация"
 * subjects, so Google's own decline notification is ignored by design.
 *
 * syncDeclinedBookings() runs on its own 5-minute trigger and closes the gap
 * from both ends:
 *  1. the Gmail pass reads the "Declined: <title> @ <when>" notifications the
 *     owner receives, and
 *  2. the calendar sweep re-checks upcoming events for guests who answered
 *     "No" — locale-proof, and the backstop for any notification the Gmail
 *     pass misses (mail deleted, thread already labeled, non-English subject).
 *
 * Both delete only events tagged source=website; Studio24-synced events carry
 * no guests at all and are never touched. Whichever pass gets there first
 * wins — the other simply finds nothing.
 */

function syncDeclinedBookings() {
  syncDeclineEmails_()
  sweepDeclinedGuests_()
}

// ---------- Gmail pass ----------

/**
 * Real subject (owner's inbox, English locale):
 *   "Declined: Pavlin Petkov — Подстригване + сешоар Standard — много дъ...
 *    @ Thu 27 Aug 2026 2:30pm - 4:20pm (GMT+3) (trendstudiotedi@gmail.com)"
 *
 * The title is truncated with "..." (compared as a prefix — see titleMatches_)
 * but the start is exact. The "(GMT+3)" offset is what the time is expressed
 * in, so it is applied explicitly rather than assuming the script timezone —
 * Sofia is +3 in summer and +2 in winter.
 */
const DECLINE_SUBJECT_RE_ =
  /^Declined:\s*(.+?)\s*@\s*(.+?)\s*\((?:GMT|UTC)([+-]\d{1,2})(?::?(\d{2}))?\)/i
// "Thu 27 Aug 2026 2:30pm" (intl) and "Thu Aug 27, 2026 2:30pm" (US) — the
// token after the weekday disambiguates them, so neither can match the other.
const DECLINE_WHEN_INTL_RE_ = /^\w{3},?\s+(\d{1,2})\s+([A-Za-z]{3})[a-z]*\.?,?\s+(\d{4})\s+(\d{1,2}):(\d{2})\s*(am|pm)?/i
const DECLINE_WHEN_US_RE_ = /^\w{3},?\s+([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})\s+(\d{1,2}):(\d{2})\s*(am|pm)?/i
const MONTHS_ = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

/** Pure — exercised by runParserTests() in Setup.gs. → { title, start } | null */
function parseDeclineSubject_(subject) {
  const m = String(subject || '').match(DECLINE_SUBJECT_RE_)
  if (!m) return null

  let day, monthName, year, hour, minute, meridiem
  const intl = m[2].match(DECLINE_WHEN_INTL_RE_)
  if (intl) {
    day = +intl[1]
    monthName = intl[2]
    year = +intl[3]
    hour = +intl[4]
    minute = +intl[5]
    meridiem = intl[6]
  } else {
    const us = m[2].match(DECLINE_WHEN_US_RE_)
    if (!us) return null
    monthName = us[1]
    day = +us[2]
    year = +us[3]
    hour = +us[4]
    minute = +us[5]
    meridiem = us[6]
  }
  const month = MONTHS_.indexOf(monthName.toLowerCase().slice(0, 3))
  if (month === -1) return null
  if (meridiem) {
    const pm = meridiem.toLowerCase() === 'pm'
    if (pm && hour < 12) hour += 12
    if (!pm && hour === 12) hour = 0
  }
  const sign = m[3].charAt(0) === '-' ? -1 : 1
  const offsetMin = sign * (Math.abs(parseInt(m[3], 10)) * 60 + parseInt(m[4] || '0', 10))
  return {
    title: m[1].trim(),
    start: new Date(Date.UTC(year, month, day, hour, minute) - offsetMin * 60000)
  }
}

/**
 * Gmail truncates long titles in the subject ("… — много дъ..."), so the
 * subject title is matched as a PREFIX of the calendar title with whitespace
 * collapsed; an untruncated subject therefore compares in full.
 */
function titleMatches_(eventTitle, subjectTitle) {
  const norm = function (s) {
    return String(s).replace(/\s+/g, ' ').trim().toLowerCase()
  }
  const prefix = norm(subjectTitle.replace(/(\.{3}|…)\s*$/, ''))
  return !!prefix && norm(eventTitle).indexOf(prefix) === 0
}

function syncDeclineEmails_() {
  const label = getOrCreateLabel_(CONFIG.declineLabel)
  const threads = GmailApp.search(
    'subject:Declined -label:' + CONFIG.declineLabel + ' newer_than:7d'
  )
  threads.forEach(function (thread) {
    thread.getMessages().forEach(function (msg) {
      try {
        const p = parseDeclineSubject_(msg.getSubject())
        if (p) deleteDeclinedEvent_(p)
        // anything else with "Declined" in the subject is ignored but labeled
      } catch (err) {
        logSync_('booking-declined', msg.getSubject(), 'error: ' + String(err))
      }
    })
    thread.addLabel(label)
  })
}

function deleteDeclinedEvent_(p) {
  const probe = new Date(p.start.getTime() + 60000)
  const matches = getCalendar_()
    .getEvents(p.start, probe)
    .filter(function (ev) {
      return (
        ev.getStartTime().getTime() === p.start.getTime() &&
        ev.getTag('source') === 'website' &&
        titleMatches_(ev.getTitle(), p.title)
      )
    })
  if (!matches.length) {
    logSync_('booking-declined', p.title + ' @ ' + p.start, 'not_found')
    return
  }
  matches.forEach(function (ev) {
    ev.deleteEvent()
  })
  logSync_('booking-declined', p.title + ' @ ' + p.start, 'deleted (email)')
}

// ---------- calendar sweep ----------

function sweepDeclinedGuests_() {
  const now = new Date()
  const events = getCalendar_().getEvents(now, addDays_(now, CONFIG.horizonDays + 1))
  events.forEach(function (ev) {
    if (ev.isAllDayEvent() || ev.getTag('source') !== 'website') return
    if (!allGuestsDeclined_(ev)) return
    const label = ev.getTitle() + ' @ ' + ev.getStartTime()
    try {
      ev.deleteEvent()
      logSync_('booking-declined', label, 'deleted (sweep)')
    } catch (err) {
      logSync_('booking-declined', label, 'error: ' + String(err))
    }
  })
}

/**
 * True when the event has guests and every one of them answered "No".
 * getGuestList() excludes the owner, so an owner-only event returns false and
 * is left alone.
 */
function allGuestsDeclined_(event) {
  const guests = event.getGuestList()
  if (!guests.length) return false
  return guests.every(function (g) {
    return g.getGuestStatus() === CalendarApp.GuestStatus.NO
  })
}
