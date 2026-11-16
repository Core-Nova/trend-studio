// @vitest-environment node
/**
 * What the calendar does when a booking is cancelled, declined or moved by
 * email.
 *
 * Nothing is sent and no Google account is involved: each test builds the
 * text of the email Studio24 or Google Calendar would send (bookingEmails.js),
 * drops it into the fake Gmail, runs the same 5-minute triggers production
 * runs — syncStudio24Emails() and syncDeclinedBookings() — and checks the
 * calendar, the slots the website offers and the SyncLog.
 *
 * A guest's RSVP is modeled the way Google does it: their answer on the
 * salon's event flips (ev.guests[i].status) and, unless they turned
 * notifications off, the salon gets a "Declined: <title> @ <when>" email.
 */
import { loadBackend } from './appsScriptHarness'
import { cancellation, datedLine, newReservation, rsvpNotice, service } from './bookingEmails'

const ISO = (s) => new Date(s).getTime()

const bookingPayload = (overrides = {}) => ({
  action: 'book',
  name: 'Maria Ivanova',
  email: 'maria@example.com',
  phone: '0888 123 456',
  start: '2026-11-04T10:30:00+02:00',
  durationMin: 60,
  services: [{ name: 'Дамско подстригване', minutes: 60, priceEur: 30 }],
  lang: 'bg',
  website: '',
  ...overrides
})

const websiteEvents = (b) => b.events.filter((ev) => ev.tags.source === 'website')
const studio24Events = (b) => b.events.filter((ev) => ev.tags.source === 'studio24')
const declineLog = (b) => b.syncLog().filter(([type]) => type === 'booking-declined')
const lastSubject = (b) => b.threads.at(-1).messages.at(-1).subject

/** Start times the website offers on `date` for a booking of `duration` minutes. */
function freeSlots(b, date, duration = 60) {
  const res = b.call('getAvailability', { duration: String(duration), days: '14' })
  const day = res.days.find((d) => d.date === date)
  return day ? day.slots.map((s) => s.label) : []
}

/**
 * A guest answers the invite: Google flips their RSVP on the salon's event
 * and, when `notify`, mails the salon "Declined: …" / "Accepted: …".
 */
function answerInvite(b, ev, { email = ev.guests[0].email, status = 'NO', notify = true } = {}) {
  ev.guests.find((g) => g.email === email).status = status
  const verb = { NO: 'Declined', YES: 'Accepted', MAYBE: 'Tentatively accepted' }[status]
  if (notify) b.deliver(rsvpNotice(ev, { verb, guest: email }))
}

describe('website booking: the client declines the invite', () => {
  // Mon 2 Nov 2026 (GMT+2); the bookings are on Wed 4 Nov.
  const NOW = '2026-11-02T08:00:00+02:00'

  it('sends the invite, then the decline removes the booking and frees the slot', () => {
    const b = loadBackend({ now: NOW })
    expect(b.call('bookAppointment', bookingPayload()).ok).toBe(true)
    const [ev] = websiteEvents(b)
    expect(ev.sendInvites).toBe(true)
    expect(ev.guests).toEqual([{ email: 'maria@example.com', status: 'INVITED' }])
    expect(freeSlots(b, '2026-11-04')).not.toContain('10:30')

    b.advance(10)
    answerInvite(b, ev)
    expect(lastSubject(b)).toBe(
      'Declined: Maria Ivanova — Дамско подстригване @ Wed 4 Nov 2026 10:30am - 11:30am (GMT+2) (trendstudiotedi@gmail.com)'
    )
    b.call('syncDeclinedBookings')

    expect(b.events).toHaveLength(0)
    expect(freeSlots(b, '2026-11-04')).toContain('10:30')
    expect(declineLog(b)).toEqual([
      ['booking-declined', expect.stringContaining('Maria Ivanova'), 'deleted (email)']
    ])
  })

  it('reads the notification of a booking on the hour ("10am - 11am")', () => {
    const b = loadBackend({ now: NOW })
    b.call('bookAppointment', bookingPayload({ start: '2026-11-04T10:00:00+02:00' }))
    const [ev] = websiteEvents(b)
    answerInvite(b, ev)
    expect(lastSubject(b)).toContain('@ Wed 4 Nov 2026 10am - 11am (GMT+2)')
    expect(b.call('parseDeclineSubject_', lastSubject(b))?.start.getTime()).toBe(ev.start)

    b.call('syncDeclinedBookings')
    expect(b.events).toHaveLength(0)
    expect(declineLog(b).map((row) => row[2])).toEqual(['deleted (email)'])
  })

  it.each([
    [
      'summer time (GMT+3)',
      '2026-10-22T10:30:00+03:00',
      'Thu 22 Oct 2026 10:30am - 11:30am (GMT+3)'
    ],
    [
      'winter time (GMT+2)',
      '2026-10-28T10:30:00+02:00',
      'Wed 28 Oct 2026 10:30am - 11:30am (GMT+2)'
    ]
  ])('reads the notification of a booking in %s', (_, start, when) => {
    const b = loadBackend({ now: '2026-10-20T08:00:00+03:00' })
    expect(b.call('bookAppointment', bookingPayload({ start })).ok).toBe(true)
    answerInvite(b, websiteEvents(b)[0])
    expect(lastSubject(b)).toContain(when)

    b.call('syncDeclinedBookings')
    expect(b.events).toHaveLength(0)
    expect(declineLog(b).map((row) => row[2])).toEqual(['deleted (email)'])
  })

  it('matches a long title that Google cut short with "..."', () => {
    const b = loadBackend({ now: NOW })
    b.call(
      'bookAppointment',
      bookingPayload({
        durationMin: 170,
        services: [
          { name: 'Подстригване + сешоар Standard', minutes: 110, priceEur: 45 },
          { name: 'Терапия за коса с Bond Repair', minutes: 60, priceEur: 40 }
        ]
      })
    )
    answerInvite(b, websiteEvents(b)[0])
    expect(lastSubject(b)).toMatch(/^Declined: Maria Ivanova — .+\.\.\. @ Wed 4 Nov 2026/)

    b.call('syncDeclinedBookings')
    expect(b.events).toHaveLength(0)
    expect(declineLog(b).map((row) => row[2])).toEqual(['deleted (email)'])
  })

  it('keeps the booking when the client changed their answer back to "yes" before the sync ran', () => {
    const b = loadBackend({ now: NOW })
    b.call('bookAppointment', bookingPayload())
    const [ev] = websiteEvents(b)
    answerInvite(b, ev) // "Declined: …"
    b.advance(2)
    answerInvite(b, ev, { status: 'YES' }) // "Accepted: …"
    b.call('syncDeclinedBookings')

    expect(websiteEvents(b)).toHaveLength(1)
    expect(declineLog(b)).toEqual([
      ['booking-declined', expect.any(String), expect.stringMatching(/^kept/)]
    ])
  })

  it.each([
    ['no notification arrives (turned off)', () => null],
    [
      'the notification is not in English',
      (ev) => ({
        from: 'maria@example.com',
        subject: `Отказано: ${ev.title} @ ср, 4 ноем 2026 10:30 – 11:30 (GMT+2)`,
        body: 'Maria Ivanova отказа поканата.'
      })
    ]
  ])('still removes a declined booking when %s', (_, notice) => {
    const b = loadBackend({ now: NOW })
    b.call('bookAppointment', bookingPayload())
    const [ev] = websiteEvents(b)
    answerInvite(b, ev, { notify: false })
    if (notice(ev)) b.deliver(notice(ev))
    b.call('syncDeclinedBookings')

    expect(b.events).toHaveLength(0)
    expect(declineLog(b).map((row) => row[2])).toEqual(['deleted (sweep)'])
  })

  it("does not cancel the client's booking when a guest the owner added declines", () => {
    const b = loadBackend({ now: NOW })
    b.call('bookAppointment', bookingPayload())
    const [ev] = websiteEvents(b)
    ev.guests.push({ email: 'stylist@example.com', status: 'YES' }) // owner invites the stylist
    answerInvite(b, ev, { email: 'stylist@example.com' })
    b.call('syncDeclinedBookings')

    expect(websiteEvents(b)).toHaveLength(1)
  })

  it('cancels the booking when the client declines, even if a guest the owner added accepted', () => {
    const b = loadBackend({ now: NOW })
    b.call('bookAppointment', bookingPayload())
    const [ev] = websiteEvents(b)
    ev.guests.push({ email: 'stylist@example.com', status: 'YES' })
    answerInvite(b, ev, { notify: false })
    b.call('syncDeclinedBookings')

    expect(b.events).toHaveLength(0)
  })

  it("removes only the declined booking — not the client's other one, nor events the website did not make", () => {
    const b = loadBackend({ now: NOW })
    b.call('bookAppointment', bookingPayload())
    b.call('bookAppointment', bookingPayload({ start: '2026-11-05T10:30:00+02:00' }))
    const [wed, thu] = websiteEvents(b)
    // Same title and time as Wednesday's, but synced from Studio24 (no guests):
    const studio24 = b.makeEvent(wed.title, new Date(wed.start), new Date(wed.end))
    studio24.tags.source = 'studio24'
    // The owner's own meeting, whose guest said no:
    const meeting = b.makeEvent(
      'Среща с доставчик',
      new Date('2026-11-04T16:00:00+02:00'),
      new Date('2026-11-04T17:00:00+02:00'),
      { guests: 'supplier@example.com' }
    )
    meeting.guests[0].status = 'NO'

    answerInvite(b, wed)
    b.call('syncDeclinedBookings')

    expect(b.events.map((ev) => ev.id).sort()).toEqual([thu.id, studio24.id, meeting.id].sort())
  })

  it('changes nothing when the trigger runs again', () => {
    const b = loadBackend({ now: NOW })
    b.call('bookAppointment', bookingPayload())
    answerInvite(b, websiteEvents(b)[0])
    for (let i = 0; i < 4; i++) {
      b.call('syncDeclinedBookings')
      b.advance(5)
    }
    expect(declineLog(b)).toHaveLength(1)
    expect(b.errors).toEqual([])
  })

  it('removes a booking the owner moved, when the client declines the updated invite', () => {
    const b = loadBackend({ now: NOW })
    b.call('bookAppointment', bookingPayload())
    const [ev] = websiteEvents(b)
    // The owner drags it to 14:30; Google mails the client the updated invite.
    ev.start = ISO('2026-11-04T14:30:00+02:00')
    ev.end = ISO('2026-11-04T15:30:00+02:00')
    expect(freeSlots(b, '2026-11-04')).toContain('10:30')
    expect(freeSlots(b, '2026-11-04')).not.toContain('14:30')

    answerInvite(b, ev)
    expect(lastSubject(b)).toContain('@ Wed 4 Nov 2026 2:30pm - 3:30pm (GMT+2)')
    b.call('syncDeclinedBookings')

    expect(b.events).toHaveLength(0)
    expect(declineLog(b).map((row) => row[2])).toEqual(['deleted (email)'])
  })

  it('gives a client who declined and books the same time again a new booking with a new invite', () => {
    const b = loadBackend({ now: NOW })
    const first = b.call('bookAppointment', bookingPayload())
    answerInvite(b, websiteEvents(b)[0])

    // Books again before the 5-minute trigger has removed the declined one.
    b.advance(2)
    const again = b.call('bookAppointment', bookingPayload())
    expect(again.ok).toBe(true)
    expect(again.eventId).not.toBe(first.eventId)
    expect(websiteEvents(b)).toEqual([
      expect.objectContaining({
        id: again.eventId,
        sendInvites: true,
        guests: [{ email: 'maria@example.com', status: 'INVITED' }]
      })
    ])

    // The earlier "Declined:" email names the same title and time; the new
    // booking must survive it.
    b.call('syncDeclinedBookings')
    expect(websiteEvents(b).map((ev) => ev.id)).toEqual([again.eventId])
  })

  it('stops blocking the slot for the next client as soon as the client declines', () => {
    const b = loadBackend({ now: NOW })
    b.call('bookAppointment', bookingPayload())
    answerInvite(b, websiteEvents(b)[0], { notify: false })

    const ana = b.call(
      'bookAppointment',
      bookingPayload({ name: 'Ana Petrova', email: 'ana@example.com', phone: '0877 000 111' })
    )
    expect(ana.ok).toBe(true)
    expect(websiteEvents(b).map((ev) => ev.guests[0].email)).toEqual(['ana@example.com'])
  })

  it('catches a second decline whose notification joins an already-processed Gmail thread', () => {
    const b = loadBackend({ now: NOW })
    b.call('bookAppointment', bookingPayload())
    answerInvite(b, websiteEvents(b)[0])
    b.call('syncDeclinedBookings')

    b.advance(30)
    b.call('bookAppointment', bookingPayload())
    answerInvite(b, websiteEvents(b)[0]) // identical subject → same thread
    b.call('syncDeclinedBookings')

    expect(b.threads).toHaveLength(1)
    expect(b.events).toHaveLength(0)
  })
})

describe('Studio24: cancelled and moved bookings', () => {
  // Wed 1 July 2026 (GMT+3); the bookings are on Wed 8 / Thu 9 July.
  const NOW = '2026-07-01T09:00:00+03:00'
  const NAME = 'Pavlin Petkov'
  const BANGS = 'Дамско подстригване на бретон' // 15 min in the Services tab
  const CUT_BLOW_DRY = 'Дамско подстригване + сешоар Standard клас грижа, на дълга коса, размер L' // 110 min

  const book = (date, time, svc = BANGS) =>
    newReservation({ name: NAME, date, time, services: service(time, svc) })
  const cancel = (date, time, svc = BANGS, kept = []) =>
    cancellation({ name: NAME, lines: [datedLine(date, time, svc)], kept })
  const sync = (b) => b.call('syncStudio24Emails')
  /** Delivers mails a minute apart, the way Studio24 sends a move. */
  const deliverAll = (b, mails) =>
    mails.forEach((mail) => {
      b.deliver(mail)
      b.advance(1)
    })

  const sofia = { timeZone: 'Europe/Sofia' }
  const hm = (ms) =>
    new Date(ms).toLocaleTimeString('en-GB', { ...sofia, hour: '2-digit', minute: '2-digit' })
  const dm = (ms) =>
    new Date(ms).toLocaleDateString('en-GB', { ...sofia, day: '2-digit', month: '2-digit' })
  /** The client's synced bookings, e.g. "08/07 10:30–10:45". */
  const bookings = (b) =>
    studio24Events(b).map((ev) => `${dm(ev.start)} ${hm(ev.start)}–${hm(ev.end)}`)

  it('removes a cancelled booking and frees the slot on the website', () => {
    const b = loadBackend({ now: NOW })
    b.deliver(book('08.07.2026', '10:30'))
    sync(b)
    expect(bookings(b)).toEqual(['08/07 10:30–10:45'])
    expect(freeSlots(b, '2026-07-08', 30)).not.toContain('10:30')

    b.advance(60)
    b.deliver(cancel('08.07.2026', '10:30'))
    sync(b)
    expect(bookings(b)).toEqual([])
    expect(freeSlots(b, '2026-07-08', 30)).toContain('10:30')
  })

  it('keeps the booking when a cancellation and a re-booking of the same time are read in one run', () => {
    const b = loadBackend({ now: NOW })
    b.deliver(book('08.07.2026', '10:30'))
    sync(b)

    b.advance(60)
    deliverAll(b, [cancel('08.07.2026', '10:30'), book('08.07.2026', '10:30')])
    sync(b)

    expect(b.threads).toHaveLength(2) // the re-booking joined the first booking's thread
    expect(bookings(b)).toEqual(['08/07 10:30–10:45'])
  })

  it.each(['cancellation first', 'new booking first'])(
    'moves a booking to another day (%s, read in one run)',
    (order) => {
      const b = loadBackend({ now: NOW })
      b.deliver(book('08.07.2026', '10:30'))
      sync(b)

      b.advance(60)
      const newTime = book('09.07.2026', '12:00')
      const oldTime =
        order === 'cancellation first'
          ? cancel('08.07.2026', '10:30')
          : cancel('08.07.2026', '10:30', BANGS, [datedLine('09.07.2026', '12:00', BANGS)])
      deliverAll(b, order === 'cancellation first' ? [oldTime, newTime] : [newTime, oldTime])
      sync(b)

      expect(bookings(b)).toEqual(['09/07 12:00–12:15'])
      expect(freeSlots(b, '2026-07-08', 30)).toContain('10:30')
      expect(freeSlots(b, '2026-07-09', 30)).not.toContain('12:00')
    }
  )

  it.each(['cancellation first', 'new booking first'])(
    'moves a booking an hour later the same day, overlapping the old time (%s)',
    (order) => {
      const b = loadBackend({ now: NOW })
      b.deliver(book('08.07.2026', '10:00', CUT_BLOW_DRY))
      sync(b)
      expect(bookings(b)).toEqual(['08/07 10:00–11:50'])

      b.advance(60)
      const newTime = book('08.07.2026', '11:00', CUT_BLOW_DRY)
      const oldTime =
        order === 'cancellation first'
          ? cancel('08.07.2026', '10:00', CUT_BLOW_DRY)
          : cancel('08.07.2026', '10:00', CUT_BLOW_DRY, [
              datedLine('08.07.2026', '11:00', CUT_BLOW_DRY)
            ])
      deliverAll(b, order === 'cancellation first' ? [oldTime, newTime] : [newTime, oldTime])
      sync(b)

      expect(bookings(b)).toEqual(['08/07 11:00–12:50'])
    }
  )

  it('updates a booking Studio24 re-sends for the same time with other services', () => {
    const b = loadBackend({ now: NOW })
    b.deliver(book('08.07.2026', '10:30', BANGS))
    sync(b)

    b.advance(60)
    b.deliver(book('08.07.2026', '10:30', CUT_BLOW_DRY)) // same subject → same thread
    sync(b)

    expect(bookings(b)).toEqual(['08/07 10:30–12:20'])
    expect(studio24Events(b)[0].title).toBe(`Studio24: ${NAME} — ${CUT_BLOW_DRY}`)
    expect(b.syncLog().at(-1)).toEqual([
      'studio24-new',
      expect.any(String),
      expect.stringMatching(/^updated/)
    ])
  })

  it('changes the services at the same time when the new booking and the cancellation arrive together', () => {
    const b = loadBackend({ now: NOW })
    b.deliver(book('08.07.2026', '10:30', BANGS))
    sync(b)

    b.advance(60)
    deliverAll(b, [
      book('08.07.2026', '10:30', CUT_BLOW_DRY),
      cancel('08.07.2026', '10:30', BANGS, [datedLine('08.07.2026', '10:30', CUT_BLOW_DRY)])
    ])
    sync(b)

    expect(bookings(b)).toEqual(['08/07 10:30–12:20'])
    expect(studio24Events(b)[0].title).toBe(`Studio24: ${NAME} — ${CUT_BLOW_DRY}`)
  })

  it('still treats an identical re-send as a duplicate', () => {
    const b = loadBackend({ now: NOW })
    b.deliver(book('08.07.2026', '10:30'))
    sync(b)
    b.advance(60)
    b.deliver(book('08.07.2026', '10:30'))
    sync(b)

    expect(bookings(b)).toEqual(['08/07 10:30–10:45'])
    expect(b.syncLog().at(-1)[2]).toBe('duplicate_skipped')
  })

  it('emails the owner the first time Studio24 sends a booking email it cannot read (e.g. a moved booking)', () => {
    const b = loadBackend({ now: NOW })
    b.deliver({
      subject: 'Променена резервация от Ана Иванова',
      body: 'Ана Иванова промени часа си от 08.07.2026, 10:30 на 09.07.2026, 12:00.'
    })
    sync(b)

    expect(b.events).toHaveLength(0)
    expect(b.sent).toHaveLength(1)
    expect(b.sent[0].subject).toContain('Променена резервация')
    expect(b.sent[0].body).toContain(b.threads[0].api.getPermalink())

    // Once per kind of email; mail that is not about a booking is only logged.
    b.advance(60)
    b.deliver({ subject: 'Променена резервация от Иван Петров', body: '…' })
    b.deliver({ subject: 'Месечен бюлетин на Studio24', body: '…' })
    sync(b)
    expect(b.sent).toHaveLength(1)
    expect(b.syncLog().filter(([type]) => type === 'studio24-ignored')).toHaveLength(3)
  })
})

describe('Gmail labels: each email shows what it did', () => {
  const NOW = '2026-07-01T09:00:00+03:00'
  const NAME = 'Pavlin Petkov'
  const BANGS = 'Дамско подстригване на бретон'
  const book = (time, svc = BANGS) =>
    newReservation({ name: NAME, date: '08.07.2026', time, services: service(time, svc) })
  const cancel = (time, kept = []) =>
    cancellation({ name: NAME, lines: [datedLine('08.07.2026', time, BANGS)], kept })
  const sync = (b) => b.call('syncStudio24Emails')
  /** Labels on the Gmail thread that holds `subject` (labels are per thread). */
  const labelsOf = (b, subject) =>
    [...b.threads.find((t) => t.messages.some((m) => m.subject === subject)).labels].sort()

  it('Studio24 bookings: booked, then duplicate and updated as the same subject comes again', () => {
    const b = loadBackend({ now: NOW })
    const mail = book('10:30')
    b.deliver(mail)
    sync(b)
    expect(labelsOf(b, mail.subject)).toEqual(['studio24-booked', 'studio24-synced'])

    b.advance(60)
    b.deliver(mail) // sent twice
    sync(b)
    b.advance(60)
    b.deliver(book('10:30', 'Тониране')) // same subject, other services
    sync(b)
    expect(labelsOf(b, mail.subject)).toEqual([
      'studio24-booked',
      'studio24-duplicate',
      'studio24-synced',
      'studio24-updated'
    ])
  })

  it('Studio24 cancellations: cancelled, trimmed, and not-found (needs a check)', () => {
    const b = loadBackend({ now: '2026-06-01T09:00:00+03:00' })
    b.deliver({ subject: b.get('FIXTURE_MULTI_SUBJECT_'), body: b.get('FIXTURE_MULTI_BODY_') })
    b.deliver(book('10:30'))
    sync(b)

    b.advance(60)
    const whole = cancel('10:30')
    const partial = cancellation({
      name: 'Мария Петрова',
      phone: '0898 891 045',
      lines: [datedLine('03.06.2026', '18:10', 'Терапия за коса с Рианон')],
      kept: [
        datedLine(
          '03.06.2026',
          '17:30',
          'Сешоар с клас premium luxury грижа, на средно дълга коса, размер M'
        )
      ]
    })
    const unknown = cancellation({
      name: 'Ана Иванова',
      phone: '0877 111 222',
      lines: [datedLine('09.07.2026', '12:00', BANGS)]
    })
    ;[whole, partial, unknown].forEach((mail) => b.deliver(mail))
    sync(b)

    expect(labelsOf(b, whole.subject)).toEqual(['studio24-cancelled', 'studio24-synced'])
    expect(labelsOf(b, partial.subject)).toEqual(['studio24-synced', 'studio24-trimmed'])
    expect(labelsOf(b, unknown.subject)).toEqual([
      'needs-check',
      'studio24-not-found',
      'studio24-synced'
    ])
  })

  it('Studio24 problems all carry needs-check: guessed length, unreadable, unrecognized, failed', () => {
    const b = loadBackend({ now: NOW })
    const guessed = book('10:30', 'Нещо съвсем непознато')
    const unreadable = cancellation({ name: 'Ана Иванова', lines: [] })
    const moved = { subject: 'Променена резервация от Ана Иванова', body: '…' }
    const newsletter = { subject: 'Месечен бюлетин на Studio24', body: '…' }
    ;[guessed, unreadable, moved, newsletter].forEach((mail) => b.deliver(mail))
    sync(b)

    expect(labelsOf(b, guessed.subject)).toEqual([
      'needs-check',
      'studio24-booked',
      'studio24-default-time',
      'studio24-synced'
    ])
    expect(labelsOf(b, unreadable.subject)).toEqual(['needs-check', 'studio24-synced'])
    expect(labelsOf(b, moved.subject)).toEqual([
      'needs-check',
      'studio24-synced',
      'studio24-unrecognized'
    ])
    expect(labelsOf(b, newsletter.subject)).toEqual(['studio24-synced', 'studio24-unrecognized'])

    b.failures.createEvent = 99
    const failing = book('15:00')
    b.deliver(failing)
    for (let i = 0; i < b.get('CONFIG.studio24.maxAttempts'); i++) {
      b.advance(5)
      sync(b)
    }
    expect(labelsOf(b, failing.subject)).toEqual([
      'needs-check',
      'studio24-failed',
      'studio24-synced'
    ])
  })

  it('needs-check comes back only with a new problem once the owner removes it', () => {
    const b = loadBackend({ now: NOW })
    b.deliver(book('10:30'))
    b.deliver(book('12:00'))
    sync(b)
    const thread = () => b.threads.find((t) => t.key.includes('Отменена'))

    b.advance(60)
    b.deliver(cancel('09:00')) // no booking at 09:00
    sync(b)
    expect(thread().labels.has('needs-check')).toBe(true)
    thread().labels.delete('needs-check') // the owner checked it

    b.advance(60)
    b.deliver(cancel('10:30', [datedLine('08.07.2026', '12:00', BANGS)])) // same subject → same thread
    sync(b)
    expect(thread().labels.has('needs-check')).toBe(false)
    expect(thread().labels.has('studio24-cancelled')).toBe(true)
  })

  it('decline notifications: removed, kept, not-found, unreadable — and unrelated mail only marked read', () => {
    const b = loadBackend({ now: '2026-11-02T08:00:00+02:00' })
    b.call('bookAppointment', bookingPayload())
    b.call('bookAppointment', bookingPayload({ start: '2026-11-05T10:30:00+02:00' }))
    const [wed, thu] = websiteEvents(b)
    answerInvite(b, wed)
    answerInvite(b, thu)
    answerInvite(b, thu, { status: 'YES' }) // changed their mind
    const gone = rsvpNotice(
      {
        title: 'Ana Petrova — Тониране',
        start: ISO('2026-11-06T12:00:00+02:00'),
        end: ISO('2026-11-06T13:00:00+02:00')
      },
      { guest: 'ana@example.com' }
    )
    const oddFormat = {
      from: 'ana@example.com',
      subject: 'Declined: Ana Petrova @ 06.11.2026 12:00',
      body: ''
    }
    const bank = { from: 'bank@example.com', subject: 'Your card payment was declined', body: '' }
    ;[gone, oddFormat, bank].forEach((mail) => b.deliver(mail))
    b.call('syncDeclinedBookings')

    const declined = (ev) => rsvpNotice(ev, { guest: 'maria@example.com' }).subject
    expect(labelsOf(b, declined(wed))).toEqual(['declines-removed', 'declines-synced'])
    expect(labelsOf(b, declined(thu))).toEqual(['declines-kept', 'declines-synced'])
    expect(labelsOf(b, gone.subject)).toEqual(['declines-not-found', 'declines-synced'])
    expect(labelsOf(b, oddFormat.subject)).toEqual(['declines-synced', 'declines-unreadable'])
    expect(labelsOf(b, bank.subject)).toEqual(['declines-synced'])
  })

  it('setup() creates every label up front', () => {
    const b = loadBackend()
    b.call('setup')
    expect(b.gmailLabels()).toEqual(Object.values(b.get('CONFIG.labels')).sort())
  })
})
