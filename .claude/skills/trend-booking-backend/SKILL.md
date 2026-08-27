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
`{ ok:false, error:'network' }`. Booking events get the client as calendar
guest (`sendInvites: true`), description with Maps link + phone 0888 599 590,
tags `source=website` + `phone=<digits>`.

## Config spreadsheet ("TREND Booking Config", created by `setup()`)

- **Hours**: Day | Open | Close | Closed — weekly schedule, HH:mm as text
- **Overrides**: Date (yyyy-mm-dd) | Open | Close | Closed — holidays/vacations
- **Services**: Name (BG) | Minutes — durations for Studio24-synced events
  (longest-substring match); seed lives in `Setup.gs` `SERVICE_MINUTES_SEED_`
  and must stay in sync with `services.json` `minutes`
- **SyncLog**: append-only audit trail of bookings and sync actions

The owner edits the sheet, never the code; cached ~10 min (CacheService).

## Studio24 email sync

Time trigger every 5 min; processed threads get Gmail label `studio24-synced`.
Recognized subjects (from `info@studio24.bg`):

- `Нова резервация от <име> на <dd.mm.yyyy> в <hh:mm>` → creates a calendar
  event (NO guests/invites — Studio24 already confirmed), duration = sum of
  Services-tab matches per service line (`10:30Дамско подстригване ... при X - 5.11 €`)
- `Отменена резервация от <име>` → deletes the matching `source=studio24`
  event at each `dd.mm.yyyy, hh:mm` line's start time (phone must match)

When a service line matches no Services-tab row, `matchService_` returns
`{ name: null, minutes: CONFIG.defaultServiceMin }` and the booking's length is
a guess. That case is flagged three ways: `⚠️ ` prefixed on the event title, a
`60?` entry in the SyncLog breakdown, and the Gmail label
`studio24-default-time` added to the thread **in addition to**
`studio24-synced` (`handleNewReservation_` returns the flag; the search excludes
`studio24-synced`, so that label must land on every processed thread or the
sync stops being idempotent). Fix by adding the service's wording to the
Services tab.

Parsers are pure functions in `Studio24Sync.gs`; `runParserTests()` in
`Setup.gs` asserts them against real sample emails.

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
