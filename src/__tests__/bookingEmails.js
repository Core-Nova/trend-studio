/**
 * The emails the booking sync reads, built as plain text — what Studio24 and
 * Google Calendar send to the salon's inbox. Tests `deliver()` them into the
 * fake Gmail (appsScriptHarness.js) and run the real triggers, so nothing is
 * ever sent and every path is the one production takes. The formats follow
 * real messages (the FIXTURE_* samples in apps-script/Setup.gs).
 */

const TZ = 'Europe/Sofia'
export const OWNER_CALENDAR = 'trendstudiotedi@gmail.com'
export const STYLIST = 'Теди Първанова'

// ---------------------------------------------------------------- Studio24

/**
 * "Нова резервация" — `services` is the raw service text, one or more
 * "<HH:MM><service> при <stylist> - <price> €" runs (Studio24 glues several
 * together on one line).
 */
export const newReservation = ({ name, date, time, phone = '0889 972 828', services }) => ({
  subject: `Нова резервация от ${name} на ${date} в ${time}`,
  body: [
    `Здравейте ${STYLIST},`,
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

/** One Studio24 service run: "10:30Дамско подстригване при Теди Първанова - 30.00 €". */
export const service = (time, name, price = 30) =>
  `${time}${name} при ${STYLIST} - ${price.toFixed(2)} €`

/** One dated line of a cancellation: "08.07.2026, 10:30 <service> при Теди Първанова". */
export const datedLine = (date, time, name) => `${date}, ${time} ${name} при ${STYLIST}`

/**
 * "Отменена резервация" — `lines` are the cancelled appointments, `kept` the
 * client's remaining upcoming ones (Studio24's "Неотменените предстоящи
 * часове" section).
 */
export const cancellation = ({ name, phone = '0889 972 828', lines, kept = [] }) => ({
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

// ----------------------------------------------------------- Google Calendar

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Sofia wall clock of an instant, plus its UTC offset in hours (+2 winter, +3 summer). */
function sofia(ms) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: TZ,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    })
      .formatToParts(ms)
      .map((part) => [part.type, part.value])
  )
  const wall = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute)
  return {
    year: +p.year,
    month: +p.month - 1,
    day: +p.day,
    hour: +p.hour,
    minute: +p.minute,
    weekday: new Date(Date.UTC(+p.year, +p.month - 1, +p.day)).getUTCDay(),
    offsetH: Math.round((wall - Math.floor(ms / 60000) * 60000) / 3600000)
  }
}

/** How Google writes a time in notification subjects: "10am", "2:30pm", "12pm". */
function googleTime({ hour, minute }) {
  const h12 = hour % 12 || 12
  const suffix = hour < 12 ? 'am' : 'pm'
  return minute ? `${h12}:${String(minute).padStart(2, '0')}${suffix}` : `${h12}${suffix}`
}

/** "Wed 4 Nov 2026 10am - 11am (GMT+2)" — the owner's English, day-first locale. */
export function googleWhen(startMs, endMs) {
  const s = sofia(startMs)
  const e = sofia(endMs)
  const sign = s.offsetH < 0 ? '-' : '+'
  return (
    `${WEEKDAYS[s.weekday]} ${s.day} ${MONTHS[s.month]} ${s.year} ` +
    `${googleTime(s)} - ${googleTime(e)} (GMT${sign}${Math.abs(s.offsetH)})`
  )
}

/** Google cuts long titles in subjects and ends them with "...". */
const subjectTitle = (title) => (title.length > 60 ? title.slice(0, 57) + '...' : title)

/**
 * The notification Google Calendar mails the organizer (the salon) when a
 * guest answers an invite. `event` is a harness event ({ title, start, end }
 * in ms) — the notification always carries the event's CURRENT time, so an
 * event the owner moved is announced at its new time.
 *
 * verb: 'Declined' | 'Accepted' | 'Tentatively accepted'
 */
export function rsvpNotice(event, { verb = 'Declined', guest, guestName = guest }) {
  const when = googleWhen(event.start, event.end)
  const answer = {
    Declined: 'has declined this invitation.',
    Accepted: 'has accepted this invitation.',
    'Tentatively accepted': 'has tentatively accepted this invitation.'
  }[verb]
  return {
    from: guest,
    subject: `${verb}: ${subjectTitle(event.title)} @ ${when} (${OWNER_CALENDAR})`,
    body: [
      `${guestName} ${answer}`,
      '',
      event.title,
      `When: ${when.replace(' (GMT', ' (Eastern European Time - Sofia, GMT')}`,
      `Organizer: ${OWNER_CALENDAR}`,
      '',
      'Invitation from Google Calendar'
    ].join('\n')
  }
}
