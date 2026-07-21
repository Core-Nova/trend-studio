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
 * Overrides tab).
 */

function getAvailability(params) {
  const duration = clampInt_(params && params.duration, 15, CONFIG.maxBookingMin, 60)
  const daysWanted = clampInt_(params && params.days, 1, 31, CONFIG.horizonDays)
  const tz = Session.getScriptTimeZone()
  const earliest = new Date(Date.now() + CONFIG.minLeadMin * 60000)
  const rangeStart = startOfDay_(new Date())

  const events = getCalendar_().getEvents(rangeStart, addDays_(rangeStart, daysWanted))
  const busy = events
    .filter(function (ev) {
      return !ev.isAllDayEvent()
    })
    .map(function (ev) {
      return { s: ev.getStartTime().getTime(), e: ev.getEndTime().getTime() }
    })

  const days = []
  for (let i = 0; i < daysWanted; i++) {
    const day = addDays_(rangeStart, i)
    const hours = hoursForDate_(day)
    if (!hours) continue
    const slots = []
    for (let m = hours.openMin; m + duration <= hours.closeMin; m += CONFIG.slotStepMin) {
      const start = new Date(day.getTime() + m * 60000)
      if (start < earliest) continue
      const endMs = start.getTime() + duration * 60000
      const taken = busy.some(function (b) {
        return b.s < endMs && start.getTime() < b.e
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
