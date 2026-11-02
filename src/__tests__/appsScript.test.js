// @vitest-environment node
/**
 * Apps Script backend (apps-script/*.gs) — run in Node against in-memory
 * fakes (see appsScriptHarness.js). Covers what the editor-only
 * runParserTests() can't: availability, booking, and the Studio24 sync
 * end-to-end through Gmail → Calendar → SyncLog.
 */
import { loadBackend } from './appsScriptHarness'

const ISO = (s) => new Date(s).getTime()

const bookingPayload = (overrides = {}) => ({
  action: 'book',
  name: 'Maria Ivanova',
  email: 'maria@example.com',
  phone: '0888 123 456',
  start: '2026-11-04T10:00:00+02:00',
  durationMin: 60,
  services: [{ name: 'Дамско подстригване', minutes: 60, priceEur: 30 }],
  lang: 'bg',
  website: '',
  ...overrides
})

const newReservation = ({ name, date, time, phone = '0889 972 828', services }) => ({
  subject: `Нова резервация от ${name} на ${date} в ${time}`,
  body: [
    'Здравейте Теди Първанова,',
    '',
    `Hair Boutique Studio TREND получи нова онлайн резервация от Studio24.bg на ${date} в ${time}.`,
    '',
    `Клиентът е ${name} с тел. ${phone} и имейл client@example.com`,
    '',
    'Избрани са следните услуги:',
    '',
    services,
    'Ако няма да можете да обслужите клиента, е необходимо да му позвъните възможно най-скоро и да промените или отмените запазения час.'
  ].join('\n')
})

const cancellation = ({ name, phone = '0889 972 828', lines, kept = [] }) => ({
  subject: `Отменена резервация от ${name}`,
  body: [
    'Здравейте,',
    '',
    `${name} с тел. ${phone} и имейл client@example.com отмени следните услуги в Hair Boutique Studio TREND:`,
    '',
    ...lines,
    'Отменените услуги са премахнати от Вашия календар и няма нужда да ги търсите и изтривате.',
    '',
    ...(kept.length
      ? ['Неотменените предстоящи часове на клиента са:', '', ...kept]
      : ['Клиентът няма други предстоящи часове във вашия салон.'])
  ].join('\n')
})

const studio24Events = (b) => b.events.filter((ev) => ev.tags.source === 'studio24')

it('runs with the Sofia timezone the script is deployed in', () => {
  expect(new Date(2026, 6, 8, 10, 30).getTimezoneOffset()).toBe(-180)
})

describe('editor test suite (Setup.gs)', () => {
  it('runParserTests() passes against the real sample emails', () => {
    const b = loadBackend()
    try {
      b.call('runParserTests')
    } catch (err) {
      throw new Error(b.logs.join('\n'), { cause: err })
    }
  })
})

describe('getAvailability', () => {
  /** Every day once, each slot on its own date, first slot = opening time. */
  function expectWallClockGrid(b, res) {
    const dates = res.days.map((d) => d.date)
    expect(new Set(dates).size).toBe(dates.length)
    res.days.forEach((day) => {
      day.slots.forEach((slot) => {
        expect(slot.start.slice(0, 10)).toBe(day.date)
        expect(slot.start.slice(11, 16)).toBe(slot.label)
      })
    })
    // skip day 0 (lead time trims its morning)
    res.days.slice(1).forEach((day) => {
      const weekday = new Date(day.date + 'T12:00:00').getDay()
      const open = {
        0: '09:00',
        1: '09:00',
        2: '10:00',
        3: '09:00',
        4: '10:00',
        5: '09:00',
        6: '09:00'
      }[weekday]
      expect(day.slots[0].label).toBe(open)
    })
  }

  it('keeps the slot grid on Sofia wall-clock time across the October DST change', () => {
    const b = loadBackend({ now: '2026-10-22T08:00:00+03:00' })
    const res = b.call('getAvailability', { duration: '60', days: '14' })
    expect(res.ok).toBe(true)
    expect(res.days).toHaveLength(14)
    expectWallClockGrid(b, res)
    const monday = res.days.find((d) => d.date === '2026-10-26')
    expect(monday.slots[0].start).toBe('2026-10-26T09:00:00+02:00')
  })

  it('keeps the slot grid on Sofia wall-clock time across the March DST change', () => {
    const b = loadBackend({ now: '2027-03-24T08:00:00+02:00' })
    const res = b.call('getAvailability', { duration: '60', days: '14' })
    expectWallClockGrid(b, res)
    const monday = res.days.find((d) => d.date === '2027-03-29')
    expect(monday.slots[0].start).toBe('2027-03-29T09:00:00+03:00')
  })

  it('never offers a slot overlapping a timed calendar event, and ignores all-day events', () => {
    const b = loadBackend()
    b.makeEvent(
      'Client',
      new Date('2026-11-04T10:00:00+02:00'),
      new Date('2026-11-04T11:00:00+02:00')
    )
    const vacation = b.makeEvent(
      'Vacation',
      new Date('2026-11-05T00:00:00+02:00'),
      new Date('2026-11-06T00:00:00+02:00')
    )
    vacation.allDay = true

    const res = b.call('getAvailability', { duration: '60', days: '7' })
    const wed = res.days.find((d) => d.date === '2026-11-04').slots.map((s) => s.label)
    expect(wed).toContain('09:00')
    expect(wed).not.toContain('09:30')
    expect(wed).not.toContain('10:00')
    expect(wed).not.toContain('10:30')
    expect(wed).toContain('11:00')
    expect(res.days.find((d) => d.date === '2026-11-05').slots.length).toBeGreaterThan(0)
  })

  it('only offers days a booking would be accepted for', () => {
    const b = loadBackend()
    const res = b.call('getAvailability', { duration: '60', days: '31' })
    expect(res.days.length).toBeLessThanOrEqual(b.get('CONFIG.horizonDays'))
  })
})

describe('bookAppointment', () => {
  it('creates the event with the client invited and the slot re-checked', () => {
    const b = loadBackend()
    const res = b.call('bookAppointment', bookingPayload())
    expect(res).toMatchObject({ ok: true, durationMin: 60 })
    expect(b.events).toHaveLength(1)
    const ev = b.events[0]
    expect(ev.start).toBe(ISO('2026-11-04T10:00:00+02:00'))
    expect(ev.end).toBe(ISO('2026-11-04T11:00:00+02:00'))
    expect(ev.guests.map((g) => g.email)).toEqual(['maria@example.com'])
    expect(ev.sendInvites).toBe(true)
    expect(ev.tags).toEqual({ source: 'website', phone: '0888123456' })
  })

  it('rejects a booking that runs past closing even when its end wraps past midnight', () => {
    const b = loadBackend()
    // Tue closes 19:00; 18:00 + 8h ends at 02:00, which is "earlier" than 19:00
    const res = b.call(
      'bookAppointment',
      bookingPayload({ start: '2026-11-03T18:00:00+02:00', durationMin: 480 })
    )
    expect(res).toEqual({ ok: false, error: 'outside_hours' })
    expect(b.events).toHaveLength(0)
  })

  it('answers a retry of a booking that already went through with the same event, not "slot taken"', () => {
    const b = loadBackend()
    const first = b.call('bookAppointment', bookingPayload())
    const retry = b.call('bookAppointment', bookingPayload())
    expect(retry).toMatchObject({ ok: true, eventId: first.eventId })
    expect(b.events).toHaveLength(1)
  })

  it('still reports "slot taken" to a different client', () => {
    const b = loadBackend()
    b.call('bookAppointment', bookingPayload())
    const other = b.call(
      'bookAppointment',
      bookingPayload({ email: 'ana@example.com', phone: '0877 000 111' })
    )
    expect(other).toEqual({ ok: false, error: 'slot_taken' })
  })

  it('books at least as long as the selected services add up to', () => {
    const b = loadBackend()
    const res = b.call(
      'bookAppointment',
      bookingPayload({
        durationMin: 30,
        services: [
          { name: 'Дамско подстригване', minutes: 60, priceEur: 30 },
          { name: 'Тониране', minutes: 40, priceEur: 20 }
        ]
      })
    )
    expect(res).toMatchObject({ ok: true, durationMin: 100 })
    expect(b.events[0].end - b.events[0].start).toBe(100 * 60000)
  })

  it('does not lock out a client who retries after "slot taken"', () => {
    const b = loadBackend()
    b.makeEvent(
      'Busy',
      new Date('2026-11-04T09:00:00+02:00'),
      new Date('2026-11-04T13:00:00+02:00')
    )
    for (const hour of ['10', '11', '12']) {
      const res = b.call(
        'bookAppointment',
        bookingPayload({ start: `2026-11-04T${hour}:00:00+02:00` })
      )
      expect(res.error).toBe('slot_taken')
    }
    expect(
      b.call('bookAppointment', bookingPayload({ start: '2026-11-04T14:00:00+02:00' })).ok
    ).toBe(true)
  })

  it('limits successful bookings per client per hour, by email and by phone', () => {
    const b = loadBackend()
    for (const hour of ['10', '11', '12']) {
      expect(
        b.call('bookAppointment', bookingPayload({ start: `2026-11-04T${hour}:00:00+02:00` })).ok
      ).toBe(true)
    }
    const sameEmail = b.call(
      'bookAppointment',
      bookingPayload({ start: '2026-11-04T14:00:00+02:00', phone: '0877 000 111' })
    )
    expect(sameEmail).toEqual({ ok: false, error: 'rate_limited' })
    const samePhone = b.call(
      'bookAppointment',
      bookingPayload({ start: '2026-11-04T15:00:00+02:00', email: 'other@example.com' })
    )
    expect(samePhone).toEqual({ ok: false, error: 'rate_limited' })

    b.advance(61)
    expect(
      b.call('bookAppointment', bookingPayload({ start: '2026-11-04T16:00:00+02:00' })).ok
    ).toBe(true)
  })

  it('caps how many website bookings the whole site can make in a day', () => {
    const b = loadBackend()
    const cap = b.get('CONFIG.maxWebsiteBookingsPerDay')
    let made = 0
    for (let i = 0; made < cap; i++) {
      const day = 4 + Math.floor(i / 9)
      const hour = 10 + (i % 9)
      const res = b.call(
        'bookAppointment',
        bookingPayload({
          start: `2026-11-${String(day).padStart(2, '0')}T${hour}:00:00+02:00`,
          email: `c${i}@example.com`,
          phone: `0888 000 ${String(i).padStart(3, '0')}`
        })
      )
      if (res.ok) made++
      else expect(res.error).not.toBe('rate_limited')
    }
    const over = b.call(
      'bookAppointment',
      bookingPayload({
        start: '2026-11-10T10:00:00+02:00',
        email: 'late@example.com',
        phone: '0899 999 999'
      })
    )
    expect(over).toEqual({ ok: false, error: 'rate_limited' })
  })

  it('keeps free text short and on one line in the event title', () => {
    const b = loadBackend()
    const res = b.call(
      'bookAppointment',
      bookingPayload({ name: 'Maria\nIvanova ' + 'x'.repeat(500) })
    )
    expect(res.ok).toBe(true)
    const name = b.events[0].title.split(' — ')[0]
    expect(name).not.toMatch(/\n/)
    expect(name.length).toBeLessThanOrEqual(80)
  })

  it('fakes success for bots that fill the honeypot', () => {
    const b = loadBackend()
    expect(b.call('bookAppointment', bookingPayload({ website: 'http://spam' }))).toEqual({
      ok: true
    })
    expect(b.events).toHaveLength(0)
  })
})

describe('syncStudio24Emails', () => {
  const NOW = '2026-07-01T09:00:00+03:00'

  it('mirrors a new reservation into a busy calendar event without inviting anyone', () => {
    const b = loadBackend({ now: NOW })
    b.deliver({ subject: b.get('FIXTURE_NEW_SUBJECT_'), body: b.get('FIXTURE_NEW_BODY_') })
    b.call('syncStudio24Emails')

    expect(b.events).toHaveLength(1)
    const ev = b.events[0]
    expect(ev.title).toBe('Studio24: Pavlin Petkov — Дамско подстригване на бретон')
    expect(ev.start).toBe(ISO('2026-07-08T10:30:00+03:00'))
    expect(ev.end - ev.start).toBe(15 * 60000)
    expect(ev.guests).toEqual([])
    expect(ev.tags).toEqual({ source: 'studio24', phone: '0889972828' })
    expect([...b.threads[0].labels]).toEqual(['studio24-synced'])
  })

  it('handles each message once, however often the trigger runs', () => {
    const b = loadBackend({ now: NOW })
    b.deliver({ subject: b.get('FIXTURE_NEW_SUBJECT_'), body: b.get('FIXTURE_NEW_BODY_') })
    for (let i = 0; i < 4; i++) {
      b.call('syncStudio24Emails')
      b.advance(5)
    }
    expect(b.events).toHaveLength(1)
    expect(b.syncLog().filter(([type]) => type === 'studio24-new')).toHaveLength(1)
  })

  it("runs a multi-service booking until Studio24's last service ends", () => {
    const b = loadBackend({ now: '2026-06-01T09:00:00+03:00' })
    b.deliver({ subject: b.get('FIXTURE_MULTI_SUBJECT_'), body: b.get('FIXTURE_MULTI_BODY_') })
    b.call('syncStudio24Emails')
    const ev = b.events[0]
    // 17:30 blow dry (Studio24 gives it 40 min) → 18:10 Rhiannon treatment (60 min) → 19:10
    expect(ev.start).toBe(ISO('2026-06-03T17:30:00+03:00'))
    expect(ev.end).toBe(ISO('2026-06-03T19:10:00+03:00'))
  })

  it('treats repeat mail from the same client in one Gmail thread as new messages, not replays', () => {
    const b = loadBackend({ now: NOW })
    const name = 'Pavlin Petkov'
    const bangs = '10:30Дамско подстригване на бретон при Теди Първанова - 5.11 €'
    const booking = newReservation({ name, date: '08.07.2026', time: '10:30', services: bangs })
    const other = newReservation({
      name,
      date: '09.07.2026',
      time: '12:00',
      services: bangs.replace('10:30', '12:00')
    })

    b.deliver(booking)
    b.deliver(other)
    b.call('syncStudio24Emails')
    expect(studio24Events(b)).toHaveLength(2)

    // cancels the 8 July one…
    b.advance(5)
    b.deliver(
      cancellation({
        name,
        lines: ['08.07.2026, 10:30 Дамско подстригване на бретон при Теди Първанова']
      })
    )
    b.call('syncStudio24Emails')
    expect(studio24Events(b).map((ev) => ev.start)).toEqual([ISO('2026-07-09T12:00:00+03:00')])

    // …re-books the same slot (identical subject → lands in the first thread)…
    b.advance(5)
    b.deliver(booking)
    b.call('syncStudio24Emails')
    expect(studio24Events(b)).toHaveLength(2)

    // …then cancels 9 July (identical subject → lands in the first cancellation's thread)
    b.advance(5)
    b.deliver(
      cancellation({
        name,
        lines: ['09.07.2026, 12:00 Дамско подстригване на бретон при Теди Първанова'],
        kept: ['08.07.2026, 10:30 Дамско подстригване на бретон при Теди Първанова']
      })
    )
    b.call('syncStudio24Emails')

    expect(b.threads).toHaveLength(3)
    expect(studio24Events(b).map((ev) => ev.start)).toEqual([ISO('2026-07-08T10:30:00+03:00')])
  })

  it('retries a message that failed and syncs it once the error clears', () => {
    const b = loadBackend({ now: NOW })
    b.failures.createEvent = 1
    b.deliver({ subject: b.get('FIXTURE_NEW_SUBJECT_'), body: b.get('FIXTURE_NEW_BODY_') })

    b.call('syncStudio24Emails')
    expect(b.events).toHaveLength(0)
    b.advance(5)
    b.call('syncStudio24Emails')
    expect(b.events).toHaveLength(1)
    expect(b.sent).toHaveLength(0)
  })

  it('gives up after repeated failures, labels the thread and emails an alert', () => {
    const b = loadBackend({ now: NOW })
    b.failures.createEvent = 99
    b.deliver({ subject: b.get('FIXTURE_NEW_SUBJECT_'), body: b.get('FIXTURE_NEW_BODY_') })
    const attempts = b.get('CONFIG.studio24.maxAttempts')
    for (let i = 0; i < attempts + 2; i++) {
      b.call('syncStudio24Emails')
      b.advance(5)
    }
    expect(b.syncLog().filter(([type]) => type === 'error')).toHaveLength(attempts)
    expect(b.threads[0].labels.has('studio24-failed')).toBe(true)
    expect(b.sent).toHaveLength(1)
    expect(b.sent[0].to).toBe('owner@example.com')
    expect(b.sent[0].body).toContain(b.threads[0].api.getPermalink())
  })

  it('keeps the services a client did not cancel instead of freeing the whole slot', () => {
    const b = loadBackend({ now: '2026-06-01T09:00:00+03:00' })
    const name = 'Scarlett Wahl'
    b.deliver(
      newReservation({
        name,
        phone: '0884822121',
        date: '14.06.2026',
        time: '14:00',
        services:
          '14:00Дамско подстригване + сешоар с premium клас грижа, на средно дълга коса, размер M при Теди Първанова - 40.00 €' +
          '14:00официална прическа, сложен кок при Теди Първанова - 60.00 €'
      })
    )
    b.call('syncStudio24Emails')
    expect(b.events).toHaveLength(1)

    b.advance(5)
    b.deliver({
      subject: `Отменена резервация от ${name}`,
      body: b.get('FIXTURE_CANCEL_KEEP_BODY_')
    })
    b.call('syncStudio24Emails')

    expect(b.events).toHaveLength(1)
    const ev = b.events[0]
    expect(ev.title).toBe('Studio24: Scarlett Wahl — официална прическа, сложен кок')
    expect(ev.start).toBe(ISO('2026-06-14T14:00:00+03:00'))
    expect(ev.end).toBe(ISO('2026-06-14T17:30:00+03:00')) // updo = 210 min
    expect(b.syncLog().at(-1)[2]).toMatch(/^trimmed/)
  })

  it('cancelling the second service of a booking shortens the event to the first', () => {
    const b = loadBackend({ now: '2026-06-01T09:00:00+03:00' })
    b.deliver({ subject: b.get('FIXTURE_MULTI_SUBJECT_'), body: b.get('FIXTURE_MULTI_BODY_') })
    b.call('syncStudio24Emails')

    b.advance(5)
    b.deliver(
      cancellation({
        name: 'Мария Петрова',
        phone: '0898 891 045',
        lines: ['03.06.2026, 18:10 Терапия за коса с Рианон при Теди Първанова'],
        kept: [
          '03.06.2026, 17:30 Сешоар с клас premium luxury грижа, на средно дълга коса, размер M при Теди Първанова'
        ]
      })
    )
    b.call('syncStudio24Emails')

    expect(b.events).toHaveLength(1)
    expect(b.events[0].start).toBe(ISO('2026-06-03T17:30:00+03:00'))
    expect(b.events[0].end).toBe(ISO('2026-06-03T18:30:00+03:00'))
  })

  it('finds a cancelled booking the owner moved by hand', () => {
    const b = loadBackend({ now: NOW })
    b.deliver({ subject: b.get('FIXTURE_NEW_SUBJECT_'), body: b.get('FIXTURE_NEW_BODY_') })
    b.call('syncStudio24Emails')
    b.events[0].start += 60 * 60000 // dragged from 10:30 to 11:30
    b.events[0].end += 60 * 60000

    b.advance(5)
    b.deliver(
      cancellation({
        name: 'Pavlin Petkov',
        lines: ['08.07.2026, 10:30 Дамско подстригване на бретон при Теди Първанова']
      })
    )
    b.call('syncStudio24Emails')
    expect(b.events).toHaveLength(0)
  })

  it("never deletes another client's booking at the cancelled time", () => {
    const b = loadBackend({ now: NOW })
    b.deliver({ subject: b.get('FIXTURE_NEW_SUBJECT_'), body: b.get('FIXTURE_NEW_BODY_') })
    b.call('syncStudio24Emails')

    b.advance(5)
    b.deliver(
      cancellation({
        name: 'Някой Друг',
        phone: '0877 111 222',
        lines: ['08.07.2026, 10:30 Дамско подстригване на бретон при Теди Първанова']
      })
    )
    b.call('syncStudio24Emails')
    expect(b.events).toHaveLength(1)
    expect(b.syncLog().at(-1)[2]).toBe('not_found')
  })

  it('still blocks the slot when the service lines cannot be read', () => {
    const b = loadBackend({ now: NOW })
    b.deliver(
      newReservation({
        name: 'Ана Иванова',
        date: '08.07.2026',
        time: '11:00',
        services: 'Нов формат без часове'
      })
    )
    b.call('syncStudio24Emails')

    expect(b.events).toHaveLength(1)
    const ev = b.events[0]
    expect(ev.title.startsWith('⚠️ ')).toBe(true)
    expect(ev.end - ev.start).toBe(b.get('CONFIG.defaultServiceMin') * 60000)
    expect(b.threads[0].labels.has('studio24-default-time')).toBe(true)
    expect(b.sent).toHaveLength(1)
  })

  it('logs Studio24 mail it does not recognize so new mail types get noticed', () => {
    const b = loadBackend({ now: NOW })
    b.deliver({ subject: 'Променена резервация от Ана Иванова', body: '…' })
    b.call('syncStudio24Emails')
    expect(b.syncLog()).toEqual([
      ['studio24-ignored', 'Променена резервация от Ана Иванова', expect.any(String)]
    ])
    expect(b.events).toHaveLength(0)
  })

  it('waits for a website booking that holds the lock, then catches up', () => {
    const b = loadBackend({ now: NOW })
    b.deliver({ subject: b.get('FIXTURE_NEW_SUBJECT_'), body: b.get('FIXTURE_NEW_BODY_') })
    b.lock.busy = true
    b.call('syncStudio24Emails')
    expect(b.events).toHaveLength(0)

    b.lock.busy = false
    b.advance(5)
    b.call('syncStudio24Emails')
    expect(b.events).toHaveLength(1)
  })
})
