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
 *     owner receives, to find the booking each one names, and
 *  2. the calendar sweep re-checks every upcoming website booking — locale-
 *     proof, and the backstop for any notification the Gmail pass misses
 *     (notifications off, thread already labeled, non-English subject).
 *
 * Either way the event's own guest list decides, never the email: a booking
 * is removed only while its CLIENT's answer is "No" (clientDeclined_). By the
 * time the trigger runs the client may have switched back to "Yes", and the
 * guest who declined may be someone the owner added (a stylist) — deleting on
 * the email alone freed booked slots in both cases.
 *
 * Only events tagged source=website are touched; Studio24-synced events carry
 * no guests at all. Whichever pass gets there first wins — the other simply
 * finds nothing. bookAppointment() also clears a declined booking it finds in
 * the slot being booked (see there).
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
 * but the start is exact. Google drops ":00" on the hour ("10am - 11am"), so
 * the minutes are optional. The "(GMT+3)" offset is what the time is expressed
 * in, so it is applied explicitly rather than assuming the script timezone —
 * Sofia is +3 in summer and +2 in winter.
 */
const DECLINE_SUBJECT_RE_ =
  /^Declined:\s*(.+?)\s*@\s*(.+?)\s*\((?:GMT|UTC)([+-]\d{1,2})(?::?(\d{2}))?\)/i
// "Thu 27 Aug 2026 2:30pm" (intl) and "Thu Aug 27, 2026 2:30pm" (US) — the
// token after the weekday disambiguates them, so neither can match the other.
const DECLINE_WHEN_INTL_RE_ =
  /^\w{3},?\s+(\d{1,2})\s+([A-Za-z]{3})[a-z]*\.?,?\s+(\d{4})\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i
const DECLINE_WHEN_US_RE_ =
  /^\w{3},?\s+([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i
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
    minute = intl[5]
    meridiem = intl[6]
  } else {
    const us = m[2].match(DECLINE_WHEN_US_RE_)
    if (!us) return null
    monthName = us[1]
    day = +us[2]
    year = +us[3]
    hour = +us[4]
    minute = us[5]
    meridiem = us[6]
  }
  // A bare "10" is no time Google writes: it is "10am" or "10:00".
  if (minute === undefined && !meridiem) return null
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
    start: new Date(Date.UTC(year, month, day, hour, +(minute || 0)) - offsetMin * 60000),
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

/**
 * Labels each thread (CONFIG.labels) 'declines-synced' — the marker this
 * search skips — plus what its notification did: removed / kept / not-found,
 * or unreadable for a "Declined:" subject in a format the parser doesn't
 * know. Other mail that merely says "declined" (a bank, say) gets only the
 * marker.
 */
function syncDeclineEmails_() {
  const L = CONFIG.labels
  const cache = {}
  const threads = GmailApp.search('subject:Declined -label:' + L.declinesSynced + ' newer_than:7d')
  threads.forEach(function (thread) {
    const names = [L.declinesSynced]
    thread.getMessages().forEach(function (msg) {
      const subject = msg.getSubject()
      try {
        const p = parseDeclineSubject_(subject)
        if (p) names.push(removeDeclinedFromEmail_(p))
        else if (/^Declined:/i.test(subject)) names.push(L.declinesUnreadable)
      } catch (err) {
        logSync_('booking-declined', subject, 'error: ' + String(err))
      }
    })
    addLabels_(thread, names, cache)
  })
}

/**
 * Removes the website booking a "Declined:" notification names — if its
 * client still says no. → the label for what happened.
 */
function removeDeclinedFromEmail_(p) {
  const L = CONFIG.labels
  const what = p.title + ' @ ' + p.start
  const named = getCalendar_()
    .getEvents(p.start, new Date(p.start.getTime() + 60000))
    .filter(function (ev) {
      return (
        ev.getStartTime().getTime() === p.start.getTime() &&
        ev.getTag('source') === 'website' &&
        titleMatches_(ev.getTitle(), p.title)
      )
    })
  if (!named.length) {
    logSync_('booking-declined', what, 'not_found')
    return L.declinesNotFound
  }
  const declined = named.filter(clientDeclined_)
  if (!declined.length) {
    logSync_('booking-declined', what, 'kept — the client has not declined (answered again, or another guest declined)')
    return L.declinesKept
  }
  declined.forEach(function (ev) {
    removeDeclinedBooking_(ev, 'email')
  })
  return L.declinesRemoved
}

// ---------- calendar sweep ----------

function sweepDeclinedGuests_() {
  const now = new Date()
  const events = getCalendar_().getEvents(now, addDays_(now, CONFIG.horizonDays + 1))
  events.forEach(function (ev) {
    if (ev.isAllDayEvent() || ev.getTag('source') !== 'website') return
    if (!clientDeclined_(ev)) return
    try {
      removeDeclinedBooking_(ev, 'sweep')
    } catch (err) {
      logSync_('booking-declined', ev.getTitle() + ' @ ' + ev.getStartTime(), 'error: ' + String(err))
    }
  })
}

// ---------- shared ----------

/**
 * True when the booking's client answered "No". The client is the guest the
 * booking was made for (tag `email`, set by bookAppointment); a guest the
 * owner added later never cancels it, and neither does their acceptance keep
 * a declined booking alive. Bookings made before that tag existed fall back
 * to "every guest declined". getGuestList() excludes the owner, so an
 * owner-only event is never a decline.
 */
function clientDeclined_(event) {
  const guests = event.getGuestList()
  if (!guests.length) return false
  const isNo = function (g) {
    return g.getGuestStatus() === CalendarApp.GuestStatus.NO
  }
  const client = String(event.getTag('email') || '').toLowerCase()
  const match = client
    ? guests.filter(function (g) {
        return String(g.getEmail()).toLowerCase() === client
      })
    : []
  return match.length ? isNo(match[0]) : guests.every(isNo)
}

/** Deletes a declined website booking and logs it; `via` = email | sweep | rebooked. */
function removeDeclinedBooking_(event, via) {
  const label = event.getTitle() + ' @ ' + event.getStartTime()
  event.deleteEvent()
  logSync_('booking-declined', label, 'deleted (' + via + ')')
}
