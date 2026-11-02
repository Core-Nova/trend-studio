/**
 * TREND Booking — free-slot computation.
 *
 * GET ?action=availability&duration=<minutes>&days=<n>
 * → { ok: true, timezone: 'Europe/Sofia', durationMin,
 *     days: [{ date: '2026-07-10',
 *              slots: [{ start: '2026-07-10T09:00:00+03:00', label: '09:00' }] }] }
 *
 * A slot is offered when the whole [start, start+duration) window fits inside
 * that day's working hours (spreadsheet), doesn't intersect any timed calendar
 * event, and starts at least CONFIG.minLeadMin from now. All timed events
 * count as busy — website bookings, Studio24-synced ones, and anything the
 * owner adds by hand. All-day events are ignored (vacations belong in the
 * Overrides tab). `days` is capped at CONFIG.horizonDays — bookAppointment()
 * rejects anything later, so offering it would only produce errors.
 *
 * Days and slot times are built from wall-clock components (dayAt_ /
 * atMinute_), never by adding 24h: on the two DST days a year that drifted
 * the whole grid an hour and filed slots under the wrong date.
 */

function getAvailability(params) {
  const duration = clampInt_(params && params.duration, 15, CONFIG.maxBookingMin, 60)
  const daysWanted = clampInt_(params && params.days, 1, CONFIG.horizonDays, CONFIG.horizonDays)
  const tz = Session.getScriptTimeZone()
  const earliest = Date.now() + CONFIG.minLeadMin * 60000
  const today = startOfDay_(new Date())

  const busy = timedEvents_(today, dayAt_(today, daysWanted)).map(function (ev) {
    return { s: ev.getStartTime().getTime(), e: ev.getEndTime().getTime() }
  })

  const days = []
  for (let i = 0; i < daysWanted; i++) {
    const day = dayAt_(today, i)
    const hours = hoursForDate_(day)
    if (!hours) continue
    const slots = []
    for (let m = hours.openMin; m + duration <= hours.closeMin; m += CONFIG.slotStepMin) {
      const start = atMinute_(day, m)
      const startMs = start.getTime()
      if (startMs < earliest) continue
      const endMs = startMs + duration * 60000
      const taken = busy.some(function (b) {
        return b.s < endMs && startMs < b.e
      })
      if (taken) continue
      slots.push({
        start: Utilities.formatDate(start, tz, "yyyy-MM-dd'T'HH:mm:ssXXX"),
        label: Utilities.formatDate(start, tz, 'HH:mm'),
      })
    }
    if (slots.length) {
      days.push({ date: Utilities.formatDate(day, tz, 'yyyy-MM-dd'), slots: slots })
    }
  }
  return { ok: true, timezone: tz, durationMin: duration, days: days }
}
