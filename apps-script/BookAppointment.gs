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
 * whose description carries the Maps link and the salon phone. Everything
 * after validation runs under the script lock (shared with the Studio24
 * sync), so two writers can never book the same time.
 *
 * Retries are idempotent: if this client (same phone) already holds a website
 * booking at exactly this start, that booking is returned as a success. A
 * request that timed out in the browser but went through here therefore
 * resolves on retry instead of answering "slot taken" with the client's own
 * booking.
 *
 * The length booked is never shorter than the services sent add up to, so a
 * stale or tampered `durationMin` can't under-book the stylist.
 */

const BOOKING_LIMITS_ = { name: 80, email: 200, phone: 30, services: 12, serviceName: 160 }

function bookAppointment(body) {
  if (body.website) return { ok: true } // honeypot filled by a bot: fake success, do nothing

  const name = cleanText_(body.name, BOOKING_LIMITS_.name)
  const email = String(body.email || '').trim()
  const phone = cleanText_(body.phone, BOOKING_LIMITS_.phone)
  const phoneDigits = digits_(phone)
  const services = (Array.isArray(body.services) ? body.services : [])
    .slice(0, BOOKING_LIMITS_.services)
    .map(function (s) {
      return {
        name: cleanText_(s && s.name, BOOKING_LIMITS_.serviceName),
        minutes: clampInt_(s && s.minutes, 0, CONFIG.maxBookingMin, 0),
        priceEur: Number(s && s.priceEur) || 0,
      }
    })
    .filter(function (s) {
      return s.name
    })
  const requested = clampInt_(body.durationMin, 15, CONFIG.maxBookingMin, 0)
  const servicesMin = services.reduce(function (sum, s) {
    return sum + s.minutes
  }, 0)
  const duration = Math.min(CONFIG.maxBookingMin, Math.max(requested, servicesMin))
  const start = new Date(body.start)

  if (
    name.length < 2 ||
    email.length > BOOKING_LIMITS_.email ||
    !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ||
    phoneDigits.length < 6 ||
    phoneDigits.length > 15 ||
    !services.length ||
    !requested ||
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

  const lock = LockService.getScriptLock()
  if (!lock.tryLock(10000)) return { ok: false, error: 'busy_try_again' }
  try {
    const end = new Date(start.getTime() + duration * 60000)
    // start minute + duration, not minutesOfDay_(end): an end past midnight
    // wraps to a small number and would pass a "before closing" test.
    const startMin = minutesOfDay_(start)
    const hours = hoursForDate_(start)
    if (!hours || startMin < hours.openMin || startMin + duration > hours.closeMin) {
      return { ok: false, error: 'outside_hours' }
    }

    const conflicts = timedEvents_(start, end)
    const own = conflicts.filter(function (ev) {
      return (
        ev.getTag('source') === 'website' &&
        ev.getTag('phone') === phoneDigits &&
        ev.getStartTime().getTime() === start.getTime()
      )
    })
    if (own.length) {
      logSync_('website-booking', name + ' @ ' + body.start, 'retry — already booked')
      return { ok: true, eventId: own[0].getId(), start: body.start, durationMin: duration }
    }

    const limiter = bookingLimiter_(email, phoneDigits)
    if (!limiter.allowed) {
      logSync_('website-booking', name + ' @ ' + body.start, 'rate_limited (' + limiter.reason + ')')
      return { ok: false, error: 'rate_limited' }
    }
    if (conflicts.length) return { ok: false, error: 'slot_taken' }

    const event = getCalendar_().createEvent(name + ' — ' + summarizeServices_(services), start, end, {
      guests: email,
      sendInvites: true,
      description: buildBookingDescription_(name, email, phone, services),
      location: CONFIG.address,
    })
    event.setTag('source', 'website')
    event.setTag('phone', phoneDigits)
    limiter.record()
    logSync_('website-booking', name + ' @ ' + body.start, 'created ' + duration + 'min')
    return { ok: true, eventId: event.getId(), start: body.start, durationMin: duration }
  } finally {
    lock.releaseLock()
  }
}

/**
 * Per-client hourly limit (by email AND by phone, so swapping one doesn't
 * reset it) plus a whole-site daily cap. Call record() only after a booking
 * was created — failed attempts are free. Must run under the script lock.
 *
 * The daily counter lives in Script Properties because CacheService entries
 * expire after 6h at most.
 */
function bookingLimiter_(email, phoneDigits) {
  const cache = CacheService.getScriptCache()
  const keys = ['rl_e_' + email.toLowerCase(), 'rl_p_' + phoneDigits]
  const counts = cache.getAll(keys)
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd')
  const day = String(getProp_('WEB_BOOKINGS_DAY') || '').split('|')
  const todayCount = day[0] === today ? Number(day[1]) || 0 : 0

  const clientFull = keys.some(function (k) {
    return Number(counts[k] || 0) >= CONFIG.maxBookingsPerClientPerHour
  })
  const siteFull = todayCount >= CONFIG.maxWebsiteBookingsPerDay
  return {
    allowed: !clientFull && !siteFull,
    reason: clientFull ? 'client' : 'daily cap',
    record: function () {
      keys.forEach(function (k) {
        cache.put(k, String(Number(counts[k] || 0) + 1), 3600)
      })
      setProp_('WEB_BOOKINGS_DAY', today + '|' + (todayCount + 1))
    },
  }
}

function summarizeServices_(services) {
  return services
    .map(function (s) {
      return s.name
    })
    .join(', ')
}

function buildBookingDescription_(name, email, phone, services) {
  const svcLines = services.map(function (s) {
    const price = s.priceEur ? ', ' + s.priceEur.toFixed(2) + ' EUR' : ''
    return '• ' + s.name + ' (' + s.minutes + ' мин' + price + ')'
  })
  return ['Услуги / Services:']
    .concat(svcLines)
    .concat([
      '',
      'Клиент / Client: ' + name,
      'Тел / Tel: ' + phone,
      'Имейл / Email: ' + email,
      '',
      '📍 ' + CONFIG.mapsUrl,
      '📞 ' + CONFIG.phoneDisplay,
      '',
      'Запазено през / Booked via ' + CONFIG.website,
    ])
    .join('\n')
}
