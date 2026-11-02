---
name: trend-booking-backend
description: Architecture and contracts of the TREND booking system — the Google Apps Script backend (availability, booking, Studio24 email sync, live reviews), its config spreadsheet, and the frontend touchpoints (/book wizard, bookingApi.js, VITE_BACKEND_URL). Use when working on booking, availability, calendar events, Studio24 sync, live Google reviews, or deploying/updating the Apps Script.
---

# TREND Booking Backend

## Architecture

```
Browser (/book wizard, GitHub Pages static site)
  └─ fetch → Google Apps Script Web App /exec  (account: trendstudiotedi@gmail.com,
                                                Execute as: Me, Access: Anyone)
       GET  ?action=availability&duration=90&days=14  → free slots
       GET  ?action=reviews&lang=bg                   → live Google reviews (6h cache)
       POST {action:'book', …}   (text/plain body — NO custom headers)
  Time trigger (5 min) → syncStudio24Emails()  — polls Gmail from info@studio24.bg
  Time trigger (5 min) → syncDeclinedBookings() — deletes bookings the client declined
  Google Sheet "TREND Booking Config" — Hours / Overrides / Services / SyncLog tabs
```

**The CORS rule that must never be broken:** Apps Script web apps cannot answer
OPTIONS preflight. GETs are fine; POSTs must send a plain string body (fetch's
default `text/plain`) with **no custom headers**. Responses arrive via a 302
redirect that `fetch` follows. `src/__tests__/bookingApi.test.js` locks this in.

## Where things live

| Piece | Path |
|---|---|
| Apps Script source (copy-pasted into script.google.com) | `apps-script/*.gs` + `appsscript.json` |
| Single-paste bundler (`node apps-script/bundle.mjs \| clip`) | `apps-script/bundle.mjs` |
| Node test harness — runs the bundle against fakes of Calendar/Gmail/Sheets/Properties/Cache/Lock with a virtual clock | `src/__tests__/appsScriptHarness.js` + `appsScript.test.js` |
| Deployment / testing / maintenance guide | `apps-script/README.md` |
| Frontend API client | `src/lib/bookingApi.js` (env: `VITE_BACKEND_URL` = the /exec URL) |
| Wizard state machine | `src/hooks/useBookingFlow.js` |
| Wizard UI (services → time → details → done) | `src/components/Booking/*` + `src/pages/BookingPage.jsx` (route `/book`) |
| Selection helpers / validators | `src/lib/bookingUtils.js` |
| Service durations (numeric `minutes` on every item AND option) | `src/data/services.json` |
| Live reviews consumer | `src/hooks/useReviews.js` (falls back to `src/data/reviews.js`) |

## API contracts

```
GET ?action=availability&duration=<min>&days=<n>
→ { ok, timezone:'Europe/Sofia', durationMin,
    days:[{ date:'yyyy-mm-dd', slots:[{ start:ISO+03:00, label:'HH:mm' }] }] }

POST { action:'book', name, email, phone, start:ISO, durationMin,
       services:[{ name (BG!), minutes, priceEur }], lang, website:'' (honeypot) }
→ { ok:true, eventId } | { ok:false, error:'invalid'|'invalid_time'|'outside_hours'
    |'slot_taken'|'rate_limited'|'busy_try_again'|'server_error' }

GET ?action=reviews&lang=<bg|en>
→ { ok, rating, count, reviews:[{ author, photo, rating, text, date:ISO, time }] }
```

The client (`bookingApi.js`) never throws — network problems become
`{ ok:false, error:'network' }`; the booking POST waits 45 s
(`BOOKING_TIMEOUT_MS`), reads 15 s. Booking events get the client as calendar
guest (`sendInvites: true`), description with Maps link + phone 0888 599 590,
tags `source=website` + `phone=<digits>`.

Booking rules (`BookAppointment.gs`):
- **Idempotent** — an existing `source=website` event with the same phone at
  the exact start is returned as `{ ok:true, eventId }`, so a retry after a
  browser timeout never answers "slot taken" with the client's own booking
- Length = max(`durationMin`, sum of `services[].minutes`)
- Hours check is `startMinute + duration <= close` — never `minutesOfDay_(end)`,
  which wraps past midnight
- `rate_limited` = 3 *successful* bookings/hour per email AND per phone, or 30
  website bookings/day site-wide (`WEB_BOOKINGS_DAY` script property — cache
  TTL caps at 6 h). Failed attempts are free
- Text is single-lined and capped (`cleanText_`, `BOOKING_LIMITS_`)

Date math: build days and slot times with `dayAt_` / `atMinute_` (wall-clock
components). `addDays_` adds 24 h and drifts an hour on DST days — use it only
for range bounds.

## Config spreadsheet ("TREND Booking Config", created by `setup()`)

- **Hours**: Day | Open | Close | Closed — weekly schedule, HH:mm as text
- **Overrides**: Date (yyyy-mm-dd) | Open | Close | Closed — holidays/vacations
- **Services**: Name (BG) | Minutes — durations for Studio24-synced events
  (longest-substring match); seed lives in `Setup.gs` `SERVICE_MINUTES_SEED_`
  and must stay in sync with `services.json` `minutes`
- **SyncLog**: append-only audit trail of bookings and sync actions

The owner edits the sheet, never the code; cached ~10 min (CacheService).

## Studio24 email sync

Time trigger every 5 min. **Idempotency is per message, not per thread**:
Gmail threads identical subjects (every `Отменена резервация от <име>` by one
client; a re-booking of the same slot), so a thread mixes handled and new
messages. The ledger in Script Property `S24_SYNC_STATE` holds `since` (last
scan start; the search is `from:info@studio24.bg after:<since − 60 min>`, and
older messages are skipped), `done` (message ids in that window) and
`attempts` (retry counts). With no ledger yet (first run after upgrading) the
old `-label:studio24-synced newer_than:7d` search is used once. Labels are
cosmetic now: `studio24-synced` (handled), `studio24-default-time` (length
guessed), `studio24-failed` (gave up after `maxAttempts` = 3 runs; the owner is
emailed via `notifyOwner_`). Calendar writes run under the script lock shared
with `bookAppointment`; if it's busy the run skips and the next one catches up.

Recognized subjects (from `info@studio24.bg`):

- `Нова резервация от <име> на <dd.mm.yyyy> в <hh:mm>` → creates a calendar
  event (NO guests/invites — Studio24 already confirmed). `planStudio24Event_`
  ends it when the LAST service ends: each line's own Studio24 time
  (`18:10Терапия…`) + its Services-tab minutes (an untimed line follows the
  previous one). Dedupe = same phone + exact same start. No parseable service
  lines → still created, default length, ⚠️, owner emailed
- `Отменена резервация от <име>` → for each cancelled `dd.mm.yyyy, hh:mm` line,
  `findCancelledEvents_` picks the client's `source=studio24` event: exact
  start → the one running at that time → their only one that day (owner moved
  it). Lines under `Неотменените предстоящи часове` are `kept`: if any fall
  inside the event it is **trimmed** to them (`trimToKept_`), else deleted
- Anything else → SyncLog `studio24-ignored` (how a new mail type shows up)

When a service line matches no Services-tab row, `matchService_` returns
`{ name: null, minutes: CONFIG.defaultServiceMin }` and the booking's length is
a guess. That case is flagged three ways: `⚠️ ` prefixed on the event title, a
`60?` entry in the SyncLog breakdown, and the Gmail label
`studio24-default-time`. Fix by adding the service's wording to the Services
tab.

Parsers are pure functions in `Studio24Sync.gs`; `runParserTests()` in
`Setup.gs` asserts them against real sample emails, and
`src/__tests__/appsScript.test.js` runs it (plus the end-to-end sync,
availability and booking cases) in Node — run it before every re-paste.

## Declined invites

Declining a Google Calendar invite does **not** delete the event — it only sets
that guest's response to "No", and the slot stays busy in availability. Nothing
in the Studio24 email sync catches this (it reads only `info@studio24.bg` mail).
`DeclinedBookings.gs` → `syncDeclinedBookings()` runs on its own 5-min trigger
and closes the gap from both ends:

1. **Gmail pass** — reads the owner's `Declined: <title> @ Thu 27 Aug 2026
   2:30pm - 4:20pm (GMT+3)` notifications (label `declines-synced` marks
   processed threads). The title is truncated with `...` so it is prefix-matched;
   the start is exact and uses the subject's own GMT offset (Sofia is +3 summer,
   +2 winter). `parseDeclineSubject_` is pure — `runParserTests()` covers it.
   Non-English subjects don't parse — the sweep is the backstop.
2. **Calendar sweep** — deletes upcoming `source=website` events where **every**
   guest answered "No" (`getGuestList()` excludes the owner).

Both log `booking-declined` to SyncLog, tagged `(email)` or `(sweep)`. Studio24
events have no guests, so they are never affected. Worst-case lag before the
slot frees up: one trigger cycle.

## Script Properties (Apps Script → Project Settings)

- `CONFIG_SPREADSHEET_ID` — set by `setup()`
- `CALENDAR_ID` — optional; default is the account's main calendar
- `PLACES_API_KEY`, `PLACE_ID` — optional; enables live reviews
- `ALERT_EMAIL` — optional; where `notifyOwner_` sends sync-problem alerts
  (default: the script's own account; max 10/day)
- `S24_SYNC_STATE`, `WEB_BOOKINGS_DAY` — written by the script; deleting
  `S24_SYNC_STATE` makes the next run fall back to the label-based search

## Updating the deployed script

Edit code in the Apps Script editor (or re-paste from `apps-script/`), then
**Deploy → Manage deployments → ✏ → New version**. The /exec URL is stable;
a brand-NEW deployment would mint a different URL, which would need updating in
`SITE.backendUrl` (`src/lib/constants.js`, the hardcoded default).

## Gotchas

- The /exec URL is `SITE.backendUrl` (`src/lib/constants.js`): a hardcoded
  public default, overridable via `VITE_BACKEND_URL`. It is always set, so
  `bookingEnabled` is true; the `<Unavailable />` fallback only shows if the
  default is ever blanked. Live reviews still fall back to bundled data on fetch
  failure.
- Service durations exist in TWO places: `services.json` (`minutes`) drives
  the wizard; the Services sheet tab drives Studio24 sync. Update both.
- All-day calendar events are IGNORED by availability — vacations go in the
  Overrides tab, not the calendar.
- Consumer-Gmail quota: ~100 external calendar invites/day.
- Adding a time-driven handler means adding it to `TRIGGERS_` in `Setup.gs` AND
  re-running `setup()` in the editor — deploying a new version does not install
  triggers.
