/**
 * TREND Booking — Studio24 email sync.
 *
 * Apps Script has no "on new email" trigger, so a time-driven trigger
 * (installed by setup(), every 5 minutes) polls Gmail for mail from
 * info@studio24.bg.
 *
 * Idempotency is per MESSAGE, not per thread. Gmail threads notifications
 * with an identical subject — every "Отменена резервация от <name>" by the
 * same client, and a re-booking of the same slot — so one thread can hold an
 * old, handled message next to a new one. A thread label can't tell them
 * apart: re-running the old cancellation would delete a slot the client
 * re-booked, and excluding labeled threads skips the new message. Instead a
 * small ledger in Script Properties (S24_SYNC_STATE) records:
 *  - since:    start of the last completed scan; each run searches Gmail
 *              `after:` since − scanOverlapMin and ignores older messages
 *  - done:     ids of messages already handled inside that window
 *  - attempts: failure counts of messages being retried
 * A message that throws is retried on the next runs; after maxAttempts it is
 * given up on — its thread labeled 'studio24-failed' and the owner emailed.
 * The very first run (no ledger yet) uses the old label-based search, so
 * upgrading never replays mail the previous version already synced.
 *
 * Labels are for the owner's eyes (CONFIG.labels): 'studio24-synced' on every
 * handled thread, plus one per outcome — booked / updated / duplicate /
 * cancelled / trimmed / not-found / default-time / unrecognized / failed —
 * and 'needs-check' on anything a person should look at.
 *
 * Messages are applied in the order they were sent (not Gmail's newest-first
 * thread order), so a move — "Нова" for the new time plus "Отменена" for the
 * old one, in either order — and a cancel-then-rebook both end right even
 * when one run reads them together.
 *
 * Recognized subjects:
 *  - "Нова резервация от <name> на <dd.mm.yyyy> в <hh:mm>"  → create event, or
 *    update the client's event at that start when the services changed
 *  - "Отменена резервация от <name>"                        → delete / trim event(s)
 * Anything else is logged as 'studio24-ignored'; the first email of each new
 * booking-related kind (e.g. "Променена резервация") also emails the owner —
 * see alertUnknownBookingMail_.
 *
 * Synced events get NO guests and send NO invites — Studio24 already
 * confirmed with the client. They exist so getAvailability() sees the slot
 * as busy. Calendar writes run under the same script lock as website
 * bookings, so the two never interleave.
 */

const S24_STATE_KEY_ = 'S24_SYNC_STATE'

function syncStudio24Emails() {
  const cfg = CONFIG.studio24
  const runStart = Date.now()
  let state = loadS24State_()
  const windowStart = state.since ? state.since - cfg.scanOverlapMin * 60000 : null
  const query = windowStart
    ? 'from:' + cfg.from + ' after:' + Math.floor(windowStart / 1000)
    : 'from:' + cfg.from + ' -label:' + CONFIG.labels.studio24Synced + ' newer_than:7d'

  const pending = []
  GmailApp.search(query).forEach(function (thread) {
    thread.getMessages().forEach(function (msg) {
      if (state.done[msg.getId()]) return
      const date = msg.getDate().getTime()
      if (windowStart && date < windowStart) return // handled by an earlier run
      pending.push({ thread: thread, msg: msg, date: date })
    })
  })
  // Apply mail in the order Studio24 sent it. Gmail lists threads newest
  // first and a re-booking joins the original booking's thread, so search
  // order put "re-book 10:30" (skipped as a duplicate of the still-present
  // booking) before "cancel 10:30" — and the client's booking was deleted.
  pending.sort(function (a, b) {
    return a.date - b.date
  })

  if (pending.length) {
    const lock = LockService.getScriptLock()
    if (!lock.tryLock(20000)) return // a booking (or an overlapping run) holds it — the next run catches up
    try {
      state = loadS24State_() // re-read under the lock: an overlapping run may have handled some
      const labels = {}
      pending.forEach(function (item) {
        processS24Message_(item, state, labels)
      })
    } finally {
      lock.releaseLock()
    }
  }

  // Advance the window, but never past a message that is still being retried.
  let since = runStart
  Object.keys(state.attempts).forEach(function (id) {
    since = Math.min(since, state.attempts[id].date)
  })
  state.since = since
  const keepAfter = since - cfg.scanOverlapMin * 60000
  Object.keys(state.done).forEach(function (id) {
    if (state.done[id] < keepAfter) delete state.done[id]
  })
  saveS24State_(state)
}

function processS24Message_(item, state, labels) {
  const cfg = CONFIG.studio24
  const msg = item.msg
  const id = msg.getId()
  if (state.done[id]) return
  const subject = msg.getSubject()
  const L = CONFIG.labels
  let outcome
  try {
    outcome = handleStudio24Message_(msg, item.thread)
  } catch (err) {
    const tries = ((state.attempts[id] && state.attempts[id].n) || 0) + 1
    if (tries < cfg.maxAttempts) {
      state.attempts[id] = { n: tries, date: msg.getDate().getTime() }
      logSync_('error', subject, 'attempt ' + tries + '/' + cfg.maxAttempts + ', will retry: ' + err)
      saveS24State_(state)
      return
    }
    logSync_('error', subject, 'gave up after ' + tries + ' attempts: ' + err)
    notifyOwner_('Studio24 email NOT synced', [
      'A Studio24 email failed ' + tries + ' times and was given up on, so the calendar may be',
      'missing this booking or cancellation. Please update the calendar by hand.',
      '',
      'Subject: ' + subject,
      'Error: ' + err,
      'Email: ' + item.thread.getPermalink(),
    ])
    outcome = [L.studio24Failed, L.needsCheck]
  }
  delete state.attempts[id]
  state.done[id] = msg.getDate().getTime()
  saveS24State_(state)

  addLabels_(item.thread, [L.studio24Synced].concat(outcome), labels)
}

/** Applies one Studio24 email. → the CONFIG.labels names saying what it did. */
function handleStudio24Message_(msg, thread) {
  const L = CONFIG.labels
  const subject = msg.getSubject()
  if (CONFIG.studio24.newSubjectRe.test(subject)) {
    return handleNewReservation_(subject, msg.getPlainBody(), thread.getPermalink())
  }
  if (CONFIG.studio24.cancelSubjectRe.test(subject)) {
    return handleCancellation_(msg.getPlainBody(), thread.getPermalink())
  }
  logSync_('studio24-ignored', subject, 'unrecognized subject, not synced')
  const aboutBooking = alertUnknownBookingMail_(subject, thread.getPermalink())
  return aboutBooking ? [L.studio24Unrecognized, L.needsCheck] : [L.studio24Unrecognized]
}

const S24_UNKNOWN_KEY_ = 'S24_UNKNOWN_KINDS'

/**
 * A Studio24 email about a booking that is neither "Нова" nor "Отменена" —
 * most likely a moved booking — changes the day without the calendar
 * knowing: the old slot stays blocked and the new one is free for the
 * website to sell. The owner is emailed the FIRST time each kind of subject
 * appears ("Променена резервация"), so they fix those bookings by hand and
 * forward a sample to get the kind supported; every instance stays in
 * SyncLog and carries the 'needs-check' label. Once per kind, so a frequent
 * kind (say, reminders) can't use up the daily alert cap that real sync
 * failures need.
 *
 * @return {boolean} whether the email is about a booking (then it needs a look)
 */
function alertUnknownBookingMail_(subject, link) {
  if (!/резерв/i.test(subject)) return false // newsletters and the like: SyncLog only
  const kind = subject.split(' от ')[0].replace(/\d+/g, '#').trim().slice(0, 60)
  let kinds
  try {
    kinds = JSON.parse(getProp_(S24_UNKNOWN_KEY_) || '[]')
  } catch (err) {
    kinds = []
  }
  if (kinds.indexOf(kind) !== -1) return true
  setProp_(S24_UNKNOWN_KEY_, JSON.stringify(kinds.concat([kind])))
  notifyOwner_('New kind of Studio24 email, not synced: "' + kind + '"', [
    'Studio24 sent a booking email the calendar sync does not understand, so the calendar',
    'was NOT changed. If it moved or changed a booking, update the calendar by hand —',
    'otherwise the website may sell the new time to someone else.',
    '',
    'You are told once per kind of email; later ones get the Gmail labels',
    '"studio24-unrecognized" and "needs-check". Forward this email to the developer so it',
    'can be supported.',
    '',
    'Subject: ' + subject,
    link ? 'Email: ' + link : '',
  ])
  return true
}

function loadS24State_() {
  try {
    const s = JSON.parse(getProp_(S24_STATE_KEY_) || '{}')
    return { since: s.since || null, done: s.done || {}, attempts: s.attempts || {} }
  } catch (err) {
    return { since: null, done: {}, attempts: {} }
  }
}

function saveS24State_(state) {
  setProp_(S24_STATE_KEY_, JSON.stringify(state))
}

/** Adds each named Gmail label once; `cache` reuses label objects within a run. */
function addLabels_(thread, names, cache) {
  names.forEach(function (name, i) {
    if (!name || names.indexOf(name) !== i) return
    cache[name] = cache[name] || getOrCreateLabel_(name)
    thread.addLabel(cache[name])
  })
}

// ---------- parsers (pure — exercised by runParserTests() in Setup.gs) ----------

/**
 * Subject: "Нова резервация от Pavlin Petkov на 08.07.2026 в 10:30"
 * Body:    "Клиентът е <name> с тел. <phone> и имейл <email>" + service lines
 *          like "10:30Дамско подстригване на бретон при Теди Първанова - 5.11 €"
 *
 * Multi-service bookings arrive with the services run together — the price of
 * one butts straight against the next service's time, e.g.
 *   "... при Теди Първанова - 20.45 €18:10Терапия за коса с Рианон при ..."
 * so each service is delimited by "<HH:MM> ... при <stylist>[ - <price> €]" and
 * runs up to the NEXT "HH:MM" (or the end), never to the end of the line — an
 * end-of-line anchor swallowed every service after the first.
 */
function parseNewReservation_(subject, plainBody) {
  const m = subject.match(CONFIG.studio24.newSubjectRe)
  if (!m) return null
  const start = new Date(+m[4], +m[3] - 1, +m[2], +m[5], +m[6]) // script TZ = Europe/Sofia
  const phone = (plainBody.match(/с тел\.\s*([\d\s()+-]+)/) || [])[1] || ''
  const email = (plainBody.match(/имейл\s+([^\s,]+@[^\s,]+)/) || [])[1] || ''
  const services = []
  const lineRe = /(\d{1,2}:\d{2})\s*(.+?)\s+при\s+(.+?)(?=\s*\d{1,2}:\d{2}|\s*$)/gm
  let lm
  while ((lm = lineRe.exec(plainBody)) !== null) {
    const price = lm[3].match(/-\s*([\d.,]+)\s*€/)
    services.push({
      time: lm[1],
      name: lm[2].trim(),
      priceEur: price ? parseFloat(price[1].replace(',', '.')) : null,
    })
  }
  return { name: m[1].trim(), start: start, phone: phone.trim(), email: email, services: services }
}

/**
 * Body lines: "08.07.2026, 15:30 Дамско подстригване ... при Теди Първанова".
 *
 * A cancellation email may append a "Неотменените предстоящи часове …"
 * (still-upcoming, NOT cancelled) section listing every appointment the
 * client is KEEPING. Those lines must never be read as cancellations, so the
 * body is cut at that heading: `items` is what was cancelled, `kept` what
 * remains — handleCancellation_ uses `kept` to trim a booking that was only
 * partly cancelled instead of freeing all of it.
 */
function parseCancellation_(plainBody) {
  const cut = plainBody.search(/Неотменен/)
  const body = cut === -1 ? plainBody : plainBody.slice(0, cut)
  const phone = (body.match(/с тел\.\s*([\d\s()+-]+)/) || [])[1] || ''
  const email = (body.match(/имейл\s+([^\s,]+@[^\s,]+)/) || [])[1] || ''
  return {
    phone: phone.trim(),
    email: email,
    items: parseDatedLines_(body),
    kept: cut === -1 ? [] : parseDatedLines_(plainBody.slice(cut)),
  }
}

function parseDatedLines_(text) {
  const items = []
  const lineRe = /(\d{2})\.(\d{2})\.(\d{4}),\s*(\d{1,2}):(\d{2})\s+(.+?)\s+при\s+/g
  let m
  while ((m = lineRe.exec(text)) !== null) {
    items.push({
      start: new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5]),
      service: m[6].trim(),
    })
  }
  return items
}

/**
 * How long a Studio24 booking keeps the stylist busy. Studio24 gives each
 * service its own start ("17:30Сешоар … 18:10Терапия …"), scheduled back to
 * back with ITS durations, so the event runs until the LAST service ends: its
 * Studio24 start + its Services-tab length. Summing the lengths instead
 * over-booked whenever our length for an earlier service was longer than
 * Studio24's (above: 120 min instead of 100). A service without a usable time
 * starts when the previous one ends, so a booking with no times at all is
 * the plain sum; no service lines at all → one default-length block.
 *
 * → { end, minutes, usedDefault, breakdown }  ("60+60", "60?" = guessed)
 */
function planStudio24Event_(p) {
  const startMs = p.start.getTime()
  const day = startOfDay_(p.start)
  const matches = p.services.map(function (s) {
    return matchService_(s.name)
  })
  let cursor = startMs
  let endMs = startMs
  p.services.forEach(function (s, i) {
    const hm = /^(\d{1,2}):(\d{2})$/.exec(s.time || '')
    const at = hm ? atMinute_(day, +hm[1] * 60 + +hm[2]).getTime() : null
    const serviceStart = at !== null && at >= startMs ? at : cursor
    const serviceEnd = serviceStart + matches[i].minutes * 60000
    cursor = Math.max(cursor, serviceEnd)
    endMs = Math.max(endMs, serviceEnd)
  })
  if (!p.services.length) endMs = startMs + CONFIG.defaultServiceMin * 60000
  const minutes = Math.min(CONFIG.maxBookingMin, Math.round((endMs - startMs) / 60000))
  return {
    end: new Date(startMs + minutes * 60000),
    minutes: minutes,
    usedDefault:
      !p.services.length ||
      matches.some(function (m) {
        return m.name === null
      }),
    breakdown: p.services.length
      ? matches
          .map(function (m) {
            return m.name ? String(m.minutes) : m.minutes + '?'
          })
          .join('+')
      : CONFIG.defaultServiceMin + '?',
  }
}

// ---------- handlers ----------

// Prefixed onto the event title when a booking's duration fell back to the
// default because a service name wasn't found in the Services tab — a visual
// cue in Google Calendar to check/adjust the length by hand.
const UNMATCHED_PREFIX_ = '⚠️ '

/**
 * Creates the calendar event for one "Нова резервация" mail.
 *
 * When the subject parses but no service line does (Studio24 changed its
 * format), the event is still created — default length, ⚠️ title — and the
 * owner is emailed: a booking that never reaches the calendar is a slot the
 * website would sell twice.
 *
 * @return {string[]} labels (CONFIG.labels): booked | updated | duplicate,
 *   plus default-time + needs-check when the length is a guess (a service
 *   missing from the Services tab, or no service lines at all).
 */
function handleNewReservation_(subject, plainBody, link) {
  const L = CONFIG.labels
  const p = parseNewReservation_(subject, plainBody)
  if (!p) {
    logSync_('studio24-new', subject, 'parse_failed')
    return [L.needsCheck]
  }
  const phone = digits_(p.phone)
  const plan = planStudio24Event_(p)
  const guessed = plan.usedDefault ? [L.studio24DefaultTime, L.needsCheck] : []
  const names = p.services
    .map(function (s) {
      return s.name
    })
    .join(', ')
  const title = (plan.usedDefault ? UNMATCHED_PREFIX_ : '') + 'Studio24: ' + p.name + (names ? ' — ' + names : '')
  const description = buildStudio24Description_(p)

  // Same client at the same start is the same booking — one person can't sit
  // in two chairs. Same services = Studio24 sent it twice: skip (and keep any
  // length the owner fixed by hand). Other services = the booking was changed
  // and re-sent: the newest email wins; skipping it kept the old length.
  // (Any overlap used to count, which dropped a second, real booking by the
  // same client whenever our length estimate for the first ran into it.)
  const existing = getCalendar_()
    .getEvents(p.start, new Date(p.start.getTime() + 60000))
    .filter(function (ev) {
      return (
        ev.getStartTime().getTime() === p.start.getTime() &&
        ev.getTag('source') === 'studio24' &&
        ev.getTag('phone') === phone
      )
    })[0]
  if (existing && existing.getTitle() === title) {
    logSync_('studio24-new', p.name + ' @ ' + p.start, 'duplicate_skipped')
    return [L.studio24Duplicate]
  }
  if (existing) {
    existing.setTime(p.start, plan.end)
    existing.setTitle(title)
    existing.setDescription(description)
    logSync_(
      'studio24-new',
      p.name + ' @ ' + p.start,
      'updated to ' + plan.minutes + 'min [' + plan.breakdown + '] (re-sent with other services)'
    )
    return [L.studio24Updated].concat(guessed)
  }

  const event = getCalendar_().createEvent(title, p.start, plan.end, {
    description: description,
    location: CONFIG.address,
  })
  event.setTag('source', 'studio24')
  event.setTag('phone', phone)
  logSync_(
    'studio24-new',
    p.name + ' @ ' + p.start,
    'created ' + plan.minutes + 'min [' + plan.breakdown + ']' + (p.services.length ? '' : ' no service lines parsed')
  )
  if (!p.services.length) {
    notifyOwner_('Studio24 booking with unreadable services', [
      'The services in this Studio24 booking could not be read, so it was blocked in the',
      'calendar for the default ' + CONFIG.defaultServiceMin + ' minutes. Please check its length.',
      '',
      'Subject: ' + subject,
      link ? 'Email: ' + link : '',
    ])
  }
  return [L.studio24Booked].concat(guessed)
}

/**
 * Applies one "Отменена резервация" mail. For each cancelled start, finds the
 * client's synced event (see findCancelledEvents_). If the client keeps other
 * services inside that event ("Неотменените…"), the event is trimmed to just
 * those; otherwise it is deleted.
 *
 * @return {string[]} labels (CONFIG.labels): cancelled and/or trimmed; a
 *   start that matched no event adds not-found + needs-check, an unreadable
 *   email needs-check.
 */
function handleCancellation_(plainBody, link) {
  const L = CONFIG.labels
  const p = parseCancellation_(plainBody)
  const phone = digits_(p.phone)
  const outcome = []
  if (!p.items.length) {
    logSync_('studio24-cancel', p.phone || '(no phone)', 'parse_failed, no cancelled lines found')
    notifyOwner_('Studio24 cancellation could not be read', [
      'A Studio24 cancellation listed no appointment lines that could be read, so nothing',
      'was removed from the calendar. Please delete the cancelled booking by hand.',
      '',
      link ? 'Email: ' + link : '',
    ])
    return [L.needsCheck]
  }
  const cancelledNames = p.items
    .map(function (item) {
      return item.service
    })
    .join(', ')
  const seen = {}
  uniqueStarts_(p.items).forEach(function (start) {
    const keptSameDay = p.kept.some(function (k) {
      return startOfDay_(k.start).getTime() === startOfDay_(start).getTime()
    })
    const events = findCancelledEvents_(start, phone, keptSameDay).filter(function (ev) {
      return !seen[ev.getId()]
    })
    if (!events.length) {
      logSync_('studio24-cancel', String(start), 'not_found')
      outcome.push(L.studio24NotFound, L.needsCheck)
      return
    }
    events.forEach(function (ev) {
      seen[ev.getId()] = true
      const evStart = ev.getStartTime().getTime()
      const evEnd = ev.getEndTime().getTime()
      // A kept service stays in THIS event only if no other event of the
      // client starts at its time. A move an hour later arrives as "Нова
      // 11:00" + "Отменена 10:00, keeping 11:00": the new booking is already
      // its own event, and trimming the old one onto it blocked it twice.
      const kept = p.kept.filter(function (k) {
        const t = k.start.getTime()
        return t >= evStart && t < evEnd && !clientEventStartsAt_(k.start, phone, ev.getId())
      })
      const label = ev.getTitle() + ' @ ' + ev.getStartTime()
      if (kept.length) {
        trimToKept_(ev, kept, cancelledNames)
        logSync_('studio24-cancel', label, 'trimmed to kept: ' + ev.getTitle())
        outcome.push(L.studio24Trimmed)
      } else {
        ev.deleteEvent()
        logSync_('studio24-cancel', label, 'deleted')
        outcome.push(L.studio24Cancelled)
      }
    })
  })
  return outcome
}

/**
 * The synced event(s) a cancelled line refers to, most precise rule first:
 *  1. starts exactly at the cancelled time (same phone, when one is known)
 *  2. the client's only event running at that time — a later service of a
 *     multi-service booking was cancelled, so it starts mid-event
 *  3. the client's only event that day, when they keep nothing else that day
 *     — the owner dragged the event to another time by hand
 * Rules 2–3 need the phone; without it only an exact start is trusted.
 */
function findCancelledEvents_(start, phone, keptSameDay) {
  const day = startOfDay_(start)
  const sameDay = getCalendar_()
    .getEvents(day, dayAt_(day, 1))
    .filter(function (ev) {
      return ev.getTag('source') === 'studio24' && (!phone || ev.getTag('phone') === phone)
    })
  const t = start.getTime()
  const exact = sameDay.filter(function (ev) {
    return ev.getStartTime().getTime() === t
  })
  if (exact.length || !phone) return exact
  const running = sameDay.filter(function (ev) {
    return ev.getStartTime().getTime() <= t && t < ev.getEndTime().getTime()
  })
  if (running.length) return running.length === 1 ? running : []
  return sameDay.length === 1 && !keptSameDay ? sameDay : []
}

/** True when the client has a synced event, other than `exceptId`, starting exactly at `start`. */
function clientEventStartsAt_(start, phone, exceptId) {
  if (!phone) return false
  return getCalendar_()
    .getEvents(start, new Date(start.getTime() + 60000))
    .some(function (ev) {
      return (
        ev.getId() !== exceptId &&
        ev.getStartTime().getTime() === start.getTime() &&
        ev.getTag('source') === 'studio24' &&
        ev.getTag('phone') === phone
      )
    })
}

/** Shrinks a partly cancelled booking to the services the client kept. */
function trimToKept_(ev, kept, cancelledNames) {
  const matches = kept.map(function (k) {
    return matchService_(k.service)
  })
  const startMs = Math.min.apply(
    null,
    kept.map(function (k) {
      return k.start.getTime()
    })
  )
  const endMs = Math.max.apply(
    null,
    kept.map(function (k, i) {
      return k.start.getTime() + matches[i].minutes * 60000
    })
  )
  ev.setTime(new Date(startMs), new Date(endMs))

  const title = ev.getTitle()
  const base = (title.indexOf(UNMATCHED_PREFIX_) === 0 ? title.slice(UNMATCHED_PREFIX_.length) : title).split(' — ')[0]
  const usedDefault = matches.some(function (m) {
    return m.name === null
  })
  const keptNames = kept
    .map(function (k) {
      return k.service
    })
    .join(', ')
  ev.setTitle((usedDefault ? UNMATCHED_PREFIX_ : '') + base + ' — ' + keptNames)
  ev.setDescription((ev.getDescription() || '') + '\n\nОтменени през Studio24: ' + cancelledNames)
}

function buildStudio24Description_(p) {
  return ['Резервация през Studio24', '', 'Услуги:']
    .concat(
      p.services.map(function (s) {
        return '• ' + s.time + ' ' + s.name + (s.priceEur ? ' — ' + s.priceEur.toFixed(2) + ' €' : '')
      })
    )
    .concat(['', 'Клиент: ' + p.name, 'Тел: ' + p.phone, 'Имейл: ' + p.email])
    .join('\n')
}

function uniqueStarts_(items) {
  const seen = {}
  const starts = []
  items.forEach(function (item) {
    const key = String(item.start.getTime())
    if (seen[key]) return
    seen[key] = true
    starts.push(item.start)
  })
  return starts
}

function getOrCreateLabel_(name) {
  return GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name)
}
