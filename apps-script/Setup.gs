/**
 * TREND Booking — one-time bootstrap and editor-runnable tests.
 *
 * Run setup() ONCE from the Apps Script editor after pasting all files.
 * It is idempotent — running it again repairs missing pieces without
 * duplicating anything.
 */

function setup() {
  createConfigSpreadsheetIfMissing_()
  getOrCreateLabel_(CONFIG.studio24.label)
  installTrigger_()
  Logger.log(
    'Setup complete.\nConfig sheet: https://docs.google.com/spreadsheets/d/' +
      getProp_('CONFIG_SPREADSHEET_ID')
  )
}

function createConfigSpreadsheetIfMissing_() {
  const existingId = getProp_('CONFIG_SPREADSHEET_ID')
  if (existingId) {
    try {
      SpreadsheetApp.openById(existingId)
      return // already there
    } catch (err) {
      // fall through and recreate (sheet was deleted)
    }
  }
  const ss = SpreadsheetApp.create('TREND Booking Config')

  const hours = ss.getSheets()[0].setName('Hours')
  const hoursRows = [
    ['Day', 'Open', 'Close', 'Closed'],
    ['Mon', '09:00', '19:30', false],
    ['Tue', '10:00', '19:00', false],
    ['Wed', '09:00', '19:30', false],
    ['Thu', '10:00', '19:00', false],
    ['Fri', '09:00', '19:30', false],
    ['Sat', '09:00', '19:00', false],
    ['Sun', '09:00', '19:00', false],
  ]
  hours.getRange(1, 2, hoursRows.length, 2).setNumberFormat('@') // keep HH:mm as text
  hours.getRange(1, 1, hoursRows.length, 4).setValues(hoursRows)

  const overrides = ss.insertSheet('Overrides')
  overrides.getRange(1, 1, 1, 4).setValues([['Date', 'Open', 'Close', 'Closed']])
  overrides.getRange('A:C').setNumberFormat('@')

  const services = ss.insertSheet('Services')
  const serviceRows = [['Name (BG)', 'Minutes']].concat(SERVICE_MINUTES_SEED_)
  services.getRange(1, 1, serviceRows.length, 2).setValues(serviceRows)

  const log = ss.insertSheet('SyncLog')
  log.getRange(1, 1, 1, 4).setValues([['Timestamp', 'Type', 'Subject', 'Result']])

  setProp_('CONFIG_SPREADSHEET_ID', ss.getId())
}

/**
 * Base durations (max of each services.json range) plus per-variant rows for
 * services whose size/option changes the length a lot. matchService_ prefers
 * the most specific row, so "… боя за коса, на корени" resolves to 100, not the
 * 150 base. Keep in sync with src/data/services.json.
 */
const SERVICE_MINUTES_SEED_ = [
  ['Дамско подстригване', 60],
  ['Подстригване + сешоар Standard', 110],
  ['Подстригване + сешоар Premium', 120],
  ['Сешоар Standard грижа', 60],
  ['Сешоар Premium Luxury грижа', 60],
  ['Официална прическа', 210],
  ['Подстригване на бретон', 15],
  ['Преса / Маша', 75],
  ['Боядисване с Premium боя', 150],
  ['Кичури / Балеаж / Контуринг', 30],
  ['Боядисване Premium + бондинг грижа', 120],
  ['Тониране', 40],
  ['Терапия за коса с Рианон', 60],
  ['Терапия Афродита (хидратираща)', 60],
  ['Терапия Конвентина (блясък)', 40],
  ['Терапия Абунданция (изтощена коса)', 60],
  ['Почистваща терапия за коса', 20],
  ['Терапия за коса с Bond Repair', 60],
  ['Терапия за коса анти-фриз', 40],
  ['Терапия за коса с Sweet Colour', 30],
  ['Терапия за коса с Caviar Moisture', 40],
  // Coloring variants (base over-books by up to 50 min for shorter jobs).
  ['Боядисване с Premium боя на корени', 100],
  ['Боядисване с Premium боя размер S', 90],
  ['Боядисване с Premium боя размер M', 105],
  ['Боядисване с Premium боя размер L', 150],
  ['Боядисване с Premium боя размер XL', 135],
  ['Боядисване с Premium боя размер XXL', 135],
  ['Боядисване с Premium боя екстеншъни', 135],
  ['Боядисване Premium бондинг грижа на корени', 105],
  ['Боядисване Premium бондинг грижа размер S', 105],
  ['Боядисване Premium бондинг грижа размер M', 105],
  ['Боядисване Premium бондинг грижа размер L', 120],
  ['Боядисване Premium бондинг грижа размер XL', 120],
]

function installTrigger_() {
  const exists = ScriptApp.getProjectTriggers().some(function (t) {
    return t.getHandlerFunction() === 'syncStudio24Emails'
  })
  if (exists) return
  ScriptApp.newTrigger('syncStudio24Emails').timeBased().everyMinutes(5).create()
}

/**
 * Run from the editor after editing the config spreadsheet (hours, overrides,
 * services) to apply the change immediately instead of waiting out the ~10-min
 * cache.
 */
function refreshConfigCache() {
  CacheService.getScriptCache().removeAll(['hoursConfig', 'servicesMap', 'servicesMap2'])
  Logger.log('Config cache cleared — the next sync / availability call re-reads the spreadsheet.')
}

// ============================ editor tests ============================

const FIXTURE_NEW_SUBJECT_ = 'Нова резервация от Pavlin Petkov на 08.07.2026 в 10:30'
const FIXTURE_NEW_BODY_ = [
  'Здравейте Теди Първанова,',
  '',
  'Hair Boutique Studio TREND получи нова онлайн резервация от Studio24.bg на 08.07.2026 в 10:30.',
  '',
  'Клиентът е Pavlin Petkov с тел. 0889 972 828 и имейл fihercho@gmail.com',
  '',
  'Избрани са следните услуги:',
  '',
  '10:30Дамско подстригване на бретон при Теди Първанова - 5.11 €',
  'Ако няма да можете да обслужите клиента, е необходимо да му позвъните възможно най-скоро и да промените или отмените запазения час.',
].join('\n')

const FIXTURE_CANCEL_BODY_ = [
  'Здравейте,',
  '',
  'Михаела Мемова с тел. 0895419189 и имейл mihaela.memova@mail.bg отмени следните услуги в Hair Boutique Studio TREND:',
  '',
  '08.07.2026, 15:30 Дамско подстригване + сешоар Standard клас грижа, на дълга коса, размер L при Теди Първанова',
  '08.07.2026, 15:30 Терапия за коса със Sweet Colour при Теди Първанова',
  'Отменените услуги са премахнати от Вашия календар и няма нужда да ги търсите и изтривате.',
  '',
  'Клиентът няма други предстоящи часове във вашия салон.',
].join('\n')

// Real cancellation that also lists a KEPT appointment under "Неотменените
// предстоящи часове" — only the cancelled service must be parsed for deletion.
const FIXTURE_CANCEL_KEEP_BODY_ = [
  'Здравейте,',
  '',
  'Scarlett Wahl с тел. 0884822121 и имейл scarlettwahl07@gmail.com отмени следните услуги в Hair Boutique Studio TREND:',
  '',
  '14.06.2026, 14:00 Дамско подстригване + сешоар с premium клас грижа, на средно дълга коса, размер M при Теди Първанова',
  'Отменените услуги са премахнати от Вашия календар и няма нужда да ги търсите и изтривате.',
  '',
  'Неотменените предстоящи часове на клиента са:',
  '',
  '14.06.2026, 14:00 официална прическа, сложен кок при Теди Първанова',
].join('\n')

// Real two-service booking: the services are concatenated (price of the first
// runs straight into the second's time — "… - 20.45 €18:10Терапия …").
const FIXTURE_MULTI_SUBJECT_ = 'Нова резервация от Мария Петрова на 03.06.2026 в 17:30'
const FIXTURE_MULTI_BODY_ = [
  'Здравейте Теди Първанова,',
  '',
  'Hair Boutique Studio TREND получи нова онлайн резервация от Studio24.bg на 03.06.2026 в 17:30.',
  '',
  'Клиентът е Мария Петрова с тел. 0898 891 045 и имейл kirila@press.bg',
  '',
  'Избрани са следните услуги:',
  '',
  '17:30Сешоар с клас premium luxury грижа, на средно дълга коса, размер M при Теди Първанова - 20.45 €18:10Терапия за коса с Рианон при Теди Първанова - 51.13 €',
  'Ако няма да можете да обслужите клиента, е необходимо да му позвъните възможно най-скоро и да промените или отмените запазения час.',
].join('\n')

/** Run from the editor: asserts both parsers against the real sample emails. */
function runParserTests() {
  const results = []
  const check = function (label, actual, expected) {
    const pass = String(actual) === String(expected)
    results.push((pass ? 'PASS' : 'FAIL') + '  ' + label + ' → ' + actual + (pass ? '' : '  (expected: ' + expected + ')'))
  }

  const n = parseNewReservation_(FIXTURE_NEW_SUBJECT_, FIXTURE_NEW_BODY_)
  check('new.name', n.name, 'Pavlin Petkov')
  check('new.start', n.start.getTime(), new Date(2026, 6, 8, 10, 30).getTime())
  check('new.phone', n.phone, '0889 972 828')
  check('new.email', n.email, 'fihercho@gmail.com')
  check('new.services.length', n.services.length, 1)
  check('new.services[0].name', n.services[0].name, 'Дамско подстригване на бретон')
  check('new.services[0].time', n.services[0].time, '10:30')

  const c = parseCancellation_(FIXTURE_CANCEL_BODY_)
  check('cancel.phone', c.phone, '0895419189')
  check('cancel.email', c.email, 'mihaela.memova@mail.bg')
  check('cancel.items.length', c.items.length, 2)
  check('cancel.items[0].start', c.items[0].start.getTime(), new Date(2026, 6, 8, 15, 30).getTime())
  check('cancel.items[0].service', c.items[0].service, 'Дамско подстригване + сешоар Standard клас грижа, на дълга коса, размер L')
  check('cancel.uniqueStarts', uniqueStarts_(c.items).length, 1)

  // A kept appointment under "Неотменените предстоящи часове" must NOT be parsed
  // as a cancellation — only the one truly cancelled service.
  const ck = parseCancellation_(FIXTURE_CANCEL_KEEP_BODY_)
  check('cancelKeep.items.length', ck.items.length, 1)
  check('cancelKeep.items[0].service', ck.items[0].service, 'Дамско подстригване + сешоар с premium клас грижа, на средно дълга коса, размер M')

  check('serviceMinutes bangs', serviceMinutes_('Дамско подстригване на бретон'), 15)
  // Real Studio24 wording inserts descriptors ("клас", "за коса", "размер M")
  // that the old substring match missed — token matching must still resolve them.
  // The two coloring checks need the per-variant rows in the Services tab
  // (roots → 100, size M → 105); run refreshConfigCache() after adding them.
  check('serviceMinutes coloring M', serviceMinutes_('Боядисване с premium клас боя за коса, размер M'), 105)
  check('serviceMinutes coloring roots', serviceMinutes_('Боядисване с premium клас боя за коса, на корени'), 100)
  check('serviceMinutes combo', serviceMinutes_('Дамско подстригване + сешоар Standard клас грижа, на дълга коса, размер L'), 110)
  check('serviceMinutes unmatched', serviceMinutes_('Нещо съвсем непознато'), 60)

  // Two concatenated services must both be parsed, priced, and timed (regression
  // for the end-of-line anchor that used to swallow everything after service 1).
  const multi = parseNewReservation_(FIXTURE_MULTI_SUBJECT_, FIXTURE_MULTI_BODY_)
  check('multi.services.length', multi.services.length, 2)
  check('multi.services[0].name', multi.services[0].name, 'Сешоар с клас premium luxury грижа, на средно дълга коса, размер M')
  check('multi.services[0].price', multi.services[0].priceEur, 20.45)
  check('multi.services[1].name', multi.services[1].name, 'Терапия за коса с Рианон')
  check('multi.services[1].time', multi.services[1].time, '18:10')
  check('multi.services[1].price', multi.services[1].priceEur, 51.13)
  const multiTotal = multi.services.reduce(function (sum, s) { return sum + serviceMinutes_(s.name) }, 0)
  check('multi.totalMinutes', multiTotal, 120)

  Logger.log(results.join('\n'))
  if (results.some(function (r) { return r.indexOf('FAIL') === 0 })) {
    throw new Error('Parser tests failed — see log')
  }
}

/** Logs the next free 60-min slots. Safe — read-only. */
function testAvailability() {
  Logger.log(JSON.stringify(getAvailability({ duration: '60' }), null, 2))
}

/**
 * Creates a REAL event 3 days from now at the first free slot, inviting the
 * owner's own address — used once to verify the whole booking path, then
 * delete the event from the calendar.
 */
function testBookDryRun() {
  const avail = getAvailability({ duration: '30', days: '7' })
  if (!avail.days.length) throw new Error('No free slots to test with')
  const slot = avail.days[avail.days.length - 1].slots[0]
  const result = bookAppointment({
    action: 'book',
    name: 'Test Booking',
    email: Session.getEffectiveUser().getEmail(),
    phone: '0888599590',
    start: slot.start,
    durationMin: 30,
    services: [{ name: 'Тест услуга', minutes: 30, priceEur: 0 }],
    lang: 'bg',
    website: '',
  })
  Logger.log(JSON.stringify(result, null, 2))
}

/**
 * Exercises the Studio24 handlers end-to-end with the fixtures: creates the
 * synced event, then cancels it with a matching cancellation fixture.
 * Check SyncLog afterwards — expect 'created' then 'deleted'.
 */
function testStudio24Fixtures() {
  handleNewReservation_(FIXTURE_NEW_SUBJECT_, FIXTURE_NEW_BODY_)
  const cancelBody = FIXTURE_CANCEL_BODY_.replace('0895419189', '0889 972 828').replace(
    '08.07.2026, 15:30 Дамско подстригване + сешоар Standard клас грижа, на дълга коса, размер L при Теди Първанова',
    '08.07.2026, 10:30 Дамско подстригване на бретон при Теди Първанова'
  )
  handleCancellation_(cancelBody)
  Logger.log('Done — check the SyncLog tab (expect created + deleted rows).')
}
