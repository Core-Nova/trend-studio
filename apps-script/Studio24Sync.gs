/**
 * TREND Booking — Studio24 email sync.
 *
 * Apps Script has no "on new email" trigger, so a time-driven trigger
 * (installed by setup(), every 5 minutes) polls Gmail for mail from
 * info@studio24.bg. Processed threads get the 'studio24-synced' label and are
 * never handled twice; failures are labeled too (no retry loops) and show up
 * in the SyncLog tab of the config spreadsheet.
 *
 * Two email shapes are recognized by subject:
 *  - "Нова резервация от <name> на <dd.mm.yyyy> в <hh:mm>"  → create event
 *  - "Отменена резервация от <name>"                        → delete event(s)
 *
 * Synced events get NO guests and send NO invites — Studio24 already
 * confirmed with the client. They exist so getAvailability() sees the slot
 * as busy. Durations come from the Services tab (longest matching Bulgarian
 * name), falling back to CONFIG.defaultServiceMin per service.
 */

function syncStudio24Emails() {
  const label = getOrCreateLabel_(CONFIG.studio24.label)
  const threads = GmailApp.search(
    'from:' + CONFIG.studio24.from + ' -label:' + CONFIG.studio24.label + ' newer_than:7d'
  )
  threads.forEach(function (thread) {
    thread.getMessages().forEach(function (msg) {
      try {
        const subject = msg.getSubject()
        if (CONFIG.studio24.newSubjectRe.test(subject)) {
          handleNewReservation_(msg.getSubject(), msg.getPlainBody())
        } else if (CONFIG.studio24.cancelSubjectRe.test(subject)) {
          handleCancellation_(msg.getPlainBody())
        }
        // other Studio24 mail (reminders etc.) is ignored but still labeled
      } catch (err) {
        logSync_('error', msg.getSubject(), String(err))
      }
    })
    thread.addLabel(label)
  })
}

// ---------- parsers (pure — exercised by runParserTests() in Setup.gs) ----------

/**
 * Subject: "Нова резервация от Pavlin Petkov на 08.07.2026 в 10:30"
 * Body:    "Клиентът е <name> с тел. <phone> и имейл <email>" + service lines
 *          like "10:30Дамско подстригване на бретон при Теди Първанова - 5.11 €"
 */
function parseNewReservation_(subject, plainBody) {
  const m = subject.match(CONFIG.studio24.newSubjectRe)
  if (!m) return null
  const start = new Date(+m[4], +m[3] - 1, +m[2], +m[5], +m[6]) // script TZ = Europe/Sofia
  const phone = (plainBody.match(/с тел\.\s*([\d\s()+-]+)/) || [])[1] || ''
  const email = (plainBody.match(/имейл\s+([^\s,]+@[^\s,]+)/) || [])[1] || ''
  const services = []
  const lineRe = /(\d{1,2}:\d{2})\s*(.+?)\s+при\s+.*?(?:\s*-\s*([\d.,]+)\s*€)?\s*$/gm
  let lm
  while ((lm = lineRe.exec(plainBody)) !== null) {
    services.push({
      time: lm[1],
      name: lm[2].trim(),
      priceEur: lm[3] ? parseFloat(lm[3].replace(',', '.')) : null,
    })
  }
  return { name: m[1].trim(), start: start, phone: phone.trim(), email: email, services: services }
}

/** Body lines: "08.07.2026, 15:30 Дамско подстригване ... при Теди Първанова" */
function parseCancellation_(plainBody) {
  const phone = (plainBody.match(/с тел\.\s*([\d\s()+-]+)/) || [])[1] || ''
  const email = (plainBody.match(/имейл\s+([^\s,]+@[^\s,]+)/) || [])[1] || ''
  const items = []
  const lineRe = /(\d{2})\.(\d{2})\.(\d{4}),\s*(\d{1,2}):(\d{2})\s+(.+?)\s+при\s+/g
  let m
  while ((m = lineRe.exec(plainBody)) !== null) {
    items.push({
      start: new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5]),
      service: m[6].trim(),
    })
  }
  return { phone: phone.trim(), email: email, items: items }
}

// ---------- handlers ----------

function handleNewReservation_(subject, plainBody) {
  const p = parseNewReservation_(subject, plainBody)
  if (!p || !p.services.length) {
    logSync_('studio24-new', subject, 'parse_failed')
    return
  }
  const duration = Math.min(
    CONFIG.maxBookingMin,
    p.services.reduce(function (sum, s) {
      return sum + serviceMinutes_(s.name)
    }, 0) || CONFIG.defaultServiceMin
  )
  const end = new Date(p.start.getTime() + duration * 60000)

  // Dedupe: skip if an overlapping studio24 event for the same phone exists.
  const dupe = getCalendar_()
    .getEvents(p.start, end)
    .some(function (ev) {
      return ev.getTag('source') === 'studio24' && ev.getTag('phone') === digits_(p.phone)
    })
  if (dupe) {
    logSync_('studio24-new', p.name, 'duplicate_skipped')
    return
  }

  const serviceNames = p.services
    .map(function (s) {
      return s.name
    })
    .join(', ')
  const event = getCalendar_().createEvent(
    'Studio24: ' + p.name + ' — ' + serviceNames,
    p.start,
    end,
    { description: buildStudio24Description_(p), location: CONFIG.address }
  )
  event.setTag('source', 'studio24')
  event.setTag('phone', digits_(p.phone))
  logSync_('studio24-new', p.name + ' @ ' + p.start, 'created')
}

function handleCancellation_(plainBody) {
  const p = parseCancellation_(plainBody)
  uniqueStarts_(p.items).forEach(function (start) {
    const probe = new Date(start.getTime() + 60000)
    const matches = getCalendar_()
      .getEvents(start, probe)
      .filter(function (ev) {
        return (
          ev.getStartTime().getTime() === start.getTime() &&
          ev.getTag('source') === 'studio24' &&
          (!p.phone || ev.getTag('phone') === digits_(p.phone))
        )
      })
    if (matches.length) {
      matches.forEach(function (ev) {
        ev.deleteEvent()
      })
      logSync_('studio24-cancel', String(start), 'deleted')
    } else {
      logSync_('studio24-cancel', String(start), 'not_found')
    }
  })
}

function buildStudio24Description_(p) {
  return [
    'Резервация през Studio24',
    '',
    'Услуги:',
  ]
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
