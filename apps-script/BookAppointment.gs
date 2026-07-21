/**
 * TREND Booking — booking creation.
 *
 * POST { action:'book', name, email, phone, start: ISO string, durationMin,
 *        services: [{ name, minutes, priceEur }], lang, website: '' (honeypot) }
 * → { ok: true, eventId, start, durationMin }
 * | { ok: false, error: 'invalid' | 'invalid_time' | 'outside_hours'
 *               | 'slot_taken' | 'rate_limited' | 'busy_try_again' }
 *
 * The event is created on the owner's calendar with the client as guest and
 * sendInvites: true — the client receives a real Google Calendar invite email
 * whose description carries the Maps link and the salon phone. The slot is
 * re-validated under a script lock, so two simultaneous clients can't book
 * the same time.
 */

function bookAppointment(body) {
  if (body.website) return { ok: true } // honeypot filled by a bot: fake success, do nothing

  const name = String(body.name || '').trim()
  const email = String(body.email || '').trim()
  const phone = String(body.phone || '').trim()
  const services = Array.isArray(body.services) ? body.services : []
  const duration = clampInt_(body.durationMin, 15, CONFIG.maxBookingMin, 0)
  const start = new Date(body.start)

  if (
    name.length < 2 ||
    !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ||
    digits_(phone).length < 6 ||
    digits_(phone).length > 15 ||
    !services.length ||
    !duration ||
    isNaN(start.getTime())
  ) {
    return { ok: false, error: 'invalid' }
  }
  if (
    start < new Date(Date.now() + CONFIG.minLeadMin * 60000) ||
    start > addDays_(new Date(), CONFIG.horizonDays + 1)
  ) {
    return { ok: false, error: 'invalid_time' }
  }

  // Rate limit: max 3 booking attempts per email per hour.
  const cache = CacheService.getScriptCache()
  const rlKey = 'rl_' + email.toLowerCase()
  const attempts = Number(cache.get(rlKey) || 0)
  if (attempts >= 3) return { ok: false, error: 'rate_limited' }
  cache.put(rlKey, String(attempts + 1), 3600)

  const lock = LockService.getScriptLock()
  if (!lock.tryLock(10000)) return { ok: false, error: 'busy_try_again' }
  try {
    const end = new Date(start.getTime() + duration * 60000)
    const hours = hoursForDate_(start)
    if (!hours || minutesOfDay_(start) < hours.openMin || minutesOfDay_(end) > hours.closeMin) {
      return { ok: false, error: 'outside_hours' }
    }
    const conflicts = getCalendar_()
      .getEvents(start, end)
      .filter(function (ev) {
        return !ev.isAllDayEvent()
      })
    if (conflicts.length) return { ok: false, error: 'slot_taken' }

    const svcSummary = services
      .map(function (s) {
        return s.name
      })
      .join(', ')
    const svcLines = services.map(function (s) {
      const price = s.priceEur ? ', ' + Number(s.priceEur).toFixed(2) + ' EUR' : ''
      return '• ' + s.name + ' (' + s.minutes + ' мин' + price + ')'
    })
    const description = ['Услуги / Services:']
      .concat(svcLines)
      .concat([
        '',
        'Клиент / Client: ' + name,
        'Тел / Tel: ' + phone,
        '',
        '📍 ' + CONFIG.mapsUrl,
        '📞 ' + CONFIG.phoneDisplay,
        '',
        'Запазено през / Booked via ' + CONFIG.website,
      ])
      .join('\n')

    const event = getCalendar_().createEvent(name + ' — ' + svcSummary, start, end, {
      guests: email,
      sendInvites: true,
      description: description,
      location: CONFIG.address,
    })
    event.setTag('source', 'website')
    event.setTag('phone', digits_(phone))
    logSync_('website-booking', name + ' @ ' + body.start, 'created')
    return { ok: true, eventId: event.getId(), start: body.start, durationMin: duration }
  } finally {
    lock.releaseLock()
  }
}
