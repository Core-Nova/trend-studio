/**
 * Runs the Apps Script backend (the exact bundle pasted into script.google.com)
 * inside a Node `vm` context against in-memory fakes of the Google services it
 * touches: CalendarApp, GmailApp, UrlFetchApp, ScriptApp, SpreadsheetApp, PropertiesService,
 * CacheService, LockService, Session, Utilities.
 *
 * The fakes model only the behaviour the backend relies on. Two choices are
 * deliberately pessimistic:
 *  - Gmail threads mail with an identical subject from the same sender into
 *    one conversation, and labels are conversation-level (a new message in a
 *    labeled thread already carries the label) — real Gmail does both for
 *    automated notifications.
 *  - `getEvents(start, end)` returns every event overlapping the range.
 *
 * The clock is virtual: `new Date()` / `Date.now()` inside the script read
 * `harness.setNow()` / `harness.advance()`, nothing else.
 */
import process from 'node:process'
import vm from 'node:vm'
import { bundle } from '../../apps-script/bundle.mjs'

// Apps Script evaluates local-time Date methods in the project timezone
// (appsscript.json). Must be set before any Date is created.
process.env.TZ = 'Europe/Sofia'
const TZ = 'Europe/Sofia'
const SOURCE = bundle()

const DEFAULT_HOURS = [
  ['Mon', '09:00', '19:30', false],
  ['Tue', '10:00', '19:00', false],
  ['Wed', '09:00', '19:30', false],
  ['Thu', '10:00', '19:00', false],
  ['Fri', '09:00', '19:30', false],
  ['Sat', '09:00', '19:00', false],
  ['Sun', '09:00', '19:00', false]
]

const pad = (n) => String(n).padStart(2, '0')

/** Subset of Utilities.formatDate's SimpleDateFormat patterns used by the backend. */
function formatDate(date, tz, pattern) {
  const ms = date.getTime()
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
      .formatToParts(ms)
      .map((p) => [p.type, p.value])
  )
  const wallAsUtc = Date.UTC(
    +parts.year,
    +parts.month - 1,
    +parts.day,
    +parts.hour,
    +parts.minute,
    +parts.second
  )
  const offset = Math.round((wallAsUtc - Math.floor(ms / 1000) * 1000) / 60000)
  const abs = Math.abs(offset)
  const xxx = (offset < 0 ? '-' : '+') + pad(Math.floor(abs / 60)) + ':' + pad(abs % 60)
  const tokens = {
    yyyy: parts.year,
    MM: parts.month,
    dd: parts.day,
    HH: parts.hour,
    mm: parts.minute,
    ss: parts.second,
    XXX: xxx
  }
  return pattern.replace(/'([^']*)'|yyyy|MM|dd|HH|mm|ss|XXX/g, (tok, literal) =>
    literal !== undefined ? literal : tokens[tok]
  )
}

export function loadBackend({
  now = '2026-11-02T08:00:00+02:00',
  hours = DEFAULT_HOURS,
  overrides = [],
  services
} = {}) {
  const clock = { now: new Date(now).getTime() }
  class FakeDate extends Date {
    constructor(...args) {
      if (args.length === 0) super(clock.now)
      else super(...args)
    }
    static now() {
      return clock.now
    }
  }

  // ---------- SpreadsheetApp ----------
  const sheets = {
    Hours: [['Day', 'Open', 'Close', 'Closed'], ...hours],
    Overrides: [['Date', 'Open', 'Close', 'Closed'], ...overrides],
    Services: null, // filled from the script's own SERVICE_MINUTES_SEED_ below
    SyncLog: [['Timestamp', 'Type', 'Subject', 'Result']]
  }
  const sheetApi = (name) => ({
    getDataRange: () => ({ getValues: () => sheets[name].map((row) => row.slice()) }),
    appendRow: (row) => sheets[name].push(row),
    getRange: (r, c) => ({
      getValue: () => (sheets[name][r - 1] && sheets[name][r - 1][c - 1]) ?? '',
      setValue: (v) => {
        while (sheets[name].length < r) sheets[name].push([])
        sheets[name][r - 1][c - 1] = v
      }
    })
  })
  const spreadsheet = {
    getId: () => 'sheet-1',
    getSheetByName: (name) => (sheets[name] ? sheetApi(name) : null),
    insertSheet: (name) => {
      sheets[name] = sheets[name] || []
      return sheetApi(name)
    }
  }

  // ---------- UrlFetchApp ----------
  // Tests script the outside world with `harness.http = (url) => ({ code, body })`;
  // every request is recorded in `fetched`.
  const fetched = []
  const web = {
    handler: () => {
      throw new Error('fake UrlFetchApp: no http handler set')
    }
  }
  const UrlFetchApp = {
    fetch: (url, opts = {}) => {
      fetched.push({ url, opts })
      const { code = 200, body = {} } = web.handler(url, opts)
      const text = typeof body === 'string' ? body : JSON.stringify(body)
      return { getResponseCode: () => code, getContentText: () => text }
    }
  }

  // ---------- ScriptApp (time-driven triggers) ----------
  const triggers = []
  const ScriptApp = {
    getProjectTriggers: () => triggers.map((t) => ({ getHandlerFunction: () => t.fn })),
    newTrigger: (fn) => {
      const t = { fn }
      const clock = {
        everyMinutes: (n) => ((t.every = { minutes: n }), clock),
        everyHours: (n) => ((t.every = { hours: n }), clock),
        everyDays: (n) => ((t.every = { days: n }), clock),
        create: () => (triggers.push(t), t)
      }
      return { timeBased: () => clock }
    }
  }

  // ---------- CalendarApp ----------
  const events = []
  let eventSeq = 0
  const failures = { createEvent: 0 }
  function makeEvent(title, start, end, opts = {}) {
    const ev = {
      id: 'ev' + ++eventSeq,
      title,
      start: start.getTime(),
      end: end.getTime(),
      tags: {},
      description: opts.description || '',
      location: opts.location || '',
      sendInvites: Boolean(opts.sendInvites),
      allDay: false,
      guests: opts.guests
        ? String(opts.guests)
            .split(',')
            .map((email) => ({ email: email.trim(), status: 'INVITED' }))
        : []
    }
    ev.api = {
      getId: () => ev.id,
      getTitle: () => ev.title,
      setTitle: (t) => ((ev.title = t), ev.api),
      getStartTime: () => new FakeDate(ev.start),
      getEndTime: () => new FakeDate(ev.end),
      setTime: (s, e) => ((ev.start = s.getTime()), (ev.end = e.getTime()), ev.api),
      getTag: (key) => (key in ev.tags ? ev.tags[key] : null),
      setTag: (key, value) => ((ev.tags[key] = String(value)), ev.api),
      getDescription: () => ev.description,
      setDescription: (d) => ((ev.description = d), ev.api),
      isAllDayEvent: () => ev.allDay,
      getGuestList: () =>
        ev.guests.map((g) => ({ getEmail: () => g.email, getGuestStatus: () => g.status })),
      deleteEvent: () => {
        const i = events.indexOf(ev)
        if (i !== -1) events.splice(i, 1)
      }
    }
    events.push(ev)
    return ev
  }
  const calendar = {
    createEvent: (title, start, end, opts) => {
      if (failures.createEvent > 0) {
        failures.createEvent--
        throw new Error('Service invoked too many times: calendar')
      }
      return makeEvent(title, start, end, opts).api
    },
    getEvents: (start, end) =>
      events
        .filter((ev) => ev.start < end.getTime() && start.getTime() < ev.end)
        .sort((a, b) => a.start - b.start)
        .map((ev) => ev.api)
  }

  // ---------- GmailApp ----------
  const threads = []
  const labels = {}
  const sent = []
  let mailSeq = 0
  const label = (name) => labels[name] || (labels[name] = { getName: () => name })
  const messageApi = (thread, m) => ({
    getId: () => m.id,
    getSubject: () => m.subject,
    getPlainBody: () => m.body,
    getFrom: () => m.from,
    getDate: () => new FakeDate(m.date),
    getThread: () => thread.api
  })
  function matches(thread, m, query) {
    return query.split(/\s+/).every((term) => {
      let mm
      if ((mm = term.match(/^from:(.+)$/))) return m.from === mm[1]
      if ((mm = term.match(/^-label:(.+)$/))) return !thread.labels.has(mm[1])
      if ((mm = term.match(/^label:(.+)$/))) return thread.labels.has(mm[1])
      if ((mm = term.match(/^newer_than:(\d+)d$/))) return m.date >= clock.now - +mm[1] * 86400000
      if ((mm = term.match(/^after:(\d+)$/))) return m.date >= +mm[1] * 1000
      if ((mm = term.match(/^subject:(.+)$/)))
        return m.subject.toLowerCase().includes(mm[1].toLowerCase())
      throw new Error('fake GmailApp.search: unsupported term ' + term)
    })
  }
  function deliver({ subject, body, from = 'info@studio24.bg' }) {
    const key = from + '|' + subject
    let thread = threads.find((t) => t.key === key)
    if (!thread) {
      thread = { key, id: 't' + ++mailSeq, messages: [], labels: new Set() }
      thread.api = {
        getId: () => thread.id,
        getMessages: () => thread.messages.map((m) => messageApi(thread, m)),
        addLabel: (l) => (thread.labels.add(l.getName()), thread.api),
        getLabels: () => [...thread.labels].map(label),
        getPermalink: () => 'https://mail.google.com/mail/u/0/#all/' + thread.id,
        getFirstMessageSubject: () => thread.messages[0].subject
      }
      threads.push(thread)
    }
    const msg = { id: 'm' + ++mailSeq, subject, body, from, date: clock.now }
    thread.messages.push(msg)
    return { thread, msg }
  }
  const GmailApp = {
    search: (query) =>
      threads.filter((t) => t.messages.some((m) => matches(t, m, query))).map((t) => t.api),
    getUserLabelByName: (name) => labels[name] || null,
    createLabel: (name) => label(name),
    sendEmail: (to, subject, body) => sent.push({ to, subject, body })
  }

  // ---------- PropertiesService / CacheService / LockService ----------
  const props = new Map()
  const scriptProperties = {
    getProperty: (k) => (props.has(k) ? props.get(k) : null),
    setProperty: (k, v) => (props.set(k, String(v)), scriptProperties),
    deleteProperty: (k) => (props.delete(k), scriptProperties),
    getProperties: () => Object.fromEntries(props)
  }
  const cacheStore = new Map()
  const cacheGet = (k) => {
    const hit = cacheStore.get(k)
    if (!hit || hit.exp <= clock.now) return null
    return hit.value
  }
  const scriptCache = {
    get: cacheGet,
    getAll: (keys) =>
      Object.fromEntries(keys.filter((k) => cacheGet(k) !== null).map((k) => [k, cacheGet(k)])),
    put: (k, v, ttl = 600) => {
      if (k.length > 250) throw new Error('cache key too long')
      cacheStore.set(k, { value: String(v), exp: clock.now + Math.min(ttl, 21600) * 1000 })
    },
    remove: (k) => cacheStore.delete(k),
    removeAll: (keys) => keys.forEach((k) => cacheStore.delete(k))
  }
  const lock = { busy: false, held: false }
  const scriptLock = {
    tryLock: () => {
      if (lock.busy) return false
      lock.held = true
      return true
    },
    waitLock: () => {
      if (lock.busy) throw new Error('Lock timeout')
      lock.held = true
    },
    releaseLock: () => {
      lock.held = false
    },
    hasLock: () => lock.held
  }

  const logs = []
  const errors = []
  const sandbox = {
    Date: FakeDate,
    console: {
      log: (...a) => logs.push(a.join(' ')),
      info: (...a) => logs.push(a.join(' ')),
      warn: (...a) => logs.push(a.join(' ')),
      error: (...a) => errors.push(a.join(' '))
    },
    Logger: { log: (s) => logs.push(String(s)) },
    Session: {
      getScriptTimeZone: () => TZ,
      getEffectiveUser: () => ({ getEmail: () => 'owner@example.com' })
    },
    Utilities: { formatDate, sleep: () => {} },
    PropertiesService: { getScriptProperties: () => scriptProperties },
    CacheService: { getScriptCache: () => scriptCache },
    LockService: { getScriptLock: () => scriptLock },
    SpreadsheetApp: { openById: () => spreadsheet, create: () => spreadsheet },
    CalendarApp: {
      getDefaultCalendar: () => calendar,
      getCalendarById: () => calendar,
      GuestStatus: { YES: 'YES', NO: 'NO', MAYBE: 'MAYBE', INVITED: 'INVITED', OWNER: 'OWNER' }
    },
    GmailApp,
    UrlFetchApp,
    ScriptApp,
    ContentService: {
      createTextOutput: (s) => ({
        setMimeType() {
          return this
        },
        getContent: () => s
      }),
      MimeType: { JSON: 'application/json' }
    }
  }
  const ctx = vm.createContext(sandbox)
  vm.runInContext(SOURCE, ctx, { filename: 'apps-script-bundle.gs' })

  sheets.Services = [
    ['Name (BG)', 'Minutes'],
    ...(services || vm.runInContext('SERVICE_MINUTES_SEED_', ctx))
  ]
  scriptProperties.setProperty('CONFIG_SPREADSHEET_ID', 'sheet-1')

  return {
    /** Calls a top-level function of the script. */
    call: (name, ...args) => ctx[name](...args),
    /** Evaluates an expression in the script's global scope (reaches top-level consts). */
    get: (expr) => vm.runInContext(expr, ctx),
    setNow: (iso) => (clock.now = new Date(iso).getTime()),
    advance: (minutes) => (clock.now += minutes * 60000),
    deliver,
    threads,
    events,
    makeEvent,
    failures,
    sent,
    lock,
    props,
    sheets,
    /** Answers the script's UrlFetchApp calls: (url, opts) => ({ code, body }). */
    set http(handler) {
      web.handler = handler
    },
    fetched,
    triggers,
    /** SyncLog rows without the header, as [type, subject, result]. */
    syncLog: () => sheets.SyncLog.slice(1).map((row) => row.slice(1)),
    logs,
    errors
  }
}
