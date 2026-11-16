# TREND Booking — Google Apps Script backend

Free serverless backend for the `/book` page on trendbytedi.com. It runs as a
Google Apps Script **Web App** under `trendstudiotedi@gmail.com` — no server,
no hosting bill. It reads/writes the owner's Google Calendar, polls Gmail for
Studio24 emails, and serves live Google reviews.

## What each file does

| File | Purpose |
|---|---|
| `appsscript.json` | Manifest: timezone `Europe/Sofia`, OAuth scopes |
| `Config.gs` | All tunables (address, phone, slot grid, lead time…) + shared helpers |
| `Router.gs` | `doGet`/`doPost` web-app entry points |
| `WorkingHours.gs` | Reads working hours + service durations from the config spreadsheet (cached 10 min) |
| `GetAvailability.gs` | `GET ?action=availability&duration=90&days=14` → free slots |
| `BookAppointment.gs` | `POST {action:'book',…}` → creates the calendar event, invites the client |
| `Studio24Sync.gs` | 5-min trigger: mirrors Studio24 booking/cancellation emails into the calendar (per-message ledger, retries, trims partial cancellations) |
| `DeclinedBookings.gs` | 5-min trigger: reads Google's "Declined: …" notifications + sweeps declined guests, deletes those bookings |
| `Analytics.gs` | `POST {action:'collect'}` GA4 proxy + `GET ?action=analytics` health check |
| `Reviews.gs` | `GET ?action=reviews&lang=bg` → live Google rating + reviews (cached 6h) |
| `Instagram.gs` | 6-hour trigger copies the latest 12 Instagram posts into the config sheet's "Instagram" tab; weekly token refresh; `GET ?action=instagram` serves the copy to the gallery page |
| `Setup.gs` | One-time `setup()` bootstrap + editor-runnable tests |

## Deployment (one time, ~10 minutes)

1. Open [script.google.com](https://script.google.com) **logged in as
   trendstudiotedi@gmail.com** → **New project** → name it `TREND Booking`.
2. Paste the code — two equally valid ways (all `.gs` files share one global
   scope, so the file split is purely organizational):
   - **Single paste (fastest):** in this repo run
     `node apps-script/bundle.mjs | clip` — the whole backend is now on your
     clipboard — then paste it over the default `Code.gs`.
   - **File-by-file (tidier):** Editor → ➕ next to Files → Script → same name
     (e.g. `Config`) → paste each file's contents.

   Either way, also enable Project Settings (⚙) → **"Show appsscript.json
   manifest file in editor"** and paste `appsscript.json` over the manifest —
   it sets the Europe/Sofia timezone and the OAuth scopes (Gmail uses the full
   `https://mail.google.com/` scope because the built-in GmailApp service
   rejects granular scopes when they're declared in the manifest).
3. In the editor pick the function **`setup`** in the toolbar dropdown →
   **Run** → approve the permission screen (Calendar, Gmail, Sheets).
   This creates the **TREND Booking Config** spreadsheet (pre-filled working
   hours + service durations), the Gmail labels (see [Gmail labels](#gmail-labels)),
   and the triggers
   (`syncStudio24Emails` and `syncDeclinedBookings` every 5 min,
   `syncInstagram` every 6 h, `refreshInstagramToken` weekly). The execution
   log prints the spreadsheet link.
   *(Optional)* Script Property `ALERT_EMAIL` — where sync-problem alerts go
   (default: the script's own account).
4. *(Optional — live reviews)* In [console.cloud.google.com](https://console.cloud.google.com)
   create a project → enable **Places API (New)** → create an **API key**
   (needs a billing account; usage at our volume stays inside the free tier).
   Find the salon's Place ID with Google's
   [Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id).
   In Apps Script → Project Settings → **Script Properties** add
   `PLACES_API_KEY` and `PLACE_ID`. Skipping this step is fine — the site
   keeps its bundled reviews.
4b. *(Gallery — Instagram feed)* Until this is done the gallery shows the
   bundled salon photos.
   1. Make **@trendbytedi** a **Business** or **Creator** account (Instagram
      app → Settings → Account type and tools — free, one minute). Personal
      accounts have no API.
   2. At [developers.facebook.com](https://developers.facebook.com) create an
      app (type **Business**) → add the **Instagram** product → **API setup
      with Instagram login** → add @trendbytedi under *Instagram testers* and
      accept the invite in the Instagram app.
   3. In that same API setup page **Generate token** for @trendbytedi (it asks
      to log in to Instagram). That is a long-lived token (60 days).
   4. Apps Script → Project Settings → **Script Properties** → add `IG_TOKEN`
      = the token → run **`setup`** again: it adds the Instagram triggers and
      fills the feed straight away.
   The weekly trigger keeps the token alive. If Instagram ever rejects it
   (password change, app removed, 60 days without a refresh), you get an
   email, the gallery keeps its last copy, and step 3–4 fixes it.
5. **Deploy** → **New deployment** → type **Web app** →
   Execute as: **Me** · Who has access: **Anyone** → Deploy → copy the
   `https://script.google.com/macros/s/…/exec` URL.
6. In this repo: create `.env.local` with
   `VITE_BACKEND_URL=<the /exec URL>` → `npm run deploy`.

## Updating the script later

Edit the code in the Apps Script editor (or re-paste — `node
apps-script/bundle.mjs | clip` again), then
**Deploy → Manage deployments → ✏ → Version: New version → Deploy**.
The `/exec` URL stays the same. (A brand-new deployment would mint a new URL
and break the site until `VITE_BACKEND_URL` is updated.) A new Gmail label is
created the first time it is used; run `setup()` once more to see them all in
Gmail straight away — it only creates what's missing.

Power option: [`clasp`](https://github.com/google/clasp) (`npm i -g
@google/clasp`, `clasp login`, `clasp clone <scriptId>` into a scratch dir)
pushes these files from the command line instead of pasting — entirely
optional.

## Changing working hours / holidays / service durations

Edit the **TREND Booking Config** spreadsheet — never the code:

- **Hours** — weekly schedule (`Open`/`Close` as `HH:mm` text, `Closed` TRUE/FALSE)
- **Overrides** — specific dates (`2026-12-24`): shorter hours or `Closed` TRUE for holidays/vacation
- **Services** — Bulgarian service name → minutes; used to size Studio24-synced
  events (a row matches when all its words appear in the email's service
  line; the row with the most words wins)
- **SyncLog** — read-only audit trail of every booking/sync action

Changes apply within ~10 minutes (cache TTL).

## How the Studio24 sync behaves

- **Each email is handled once, in the order it was sent.** Gmail groups mail
  with the same subject into one thread — every "Отменена резервация от
  <name>" by the same client, and a re-booking of the same slot — so the sync
  tracks individual messages (Script Property `S24_SYNC_STATE`), not threads,
  and sorts them by date before applying them. Labels are only for you to look
  at.
- **Moves work in either order.** A moved booking arrives as a new booking for
  the new time plus a cancellation of the old one; the calendar ends up with
  just the new time whichever comes first. A booking re-sent for the same time
  with other services updates the event.
- **Length = until Studio24's last service ends.** Studio24 gives each service
  its own start time; the event runs to the last one's start + its minutes in
  the Services tab.
- **Partial cancellations trim instead of delete.** If the client keeps a
  service inside the cancelled booking (the "Неотменените предстоящи часове"
  list), the event is shortened to what they kept.
- **Errors are retried** on the next 3 runs. If it still fails, the thread gets
  `studio24-failed` and you get an email — fix that booking by hand.
- **Unreadable service lines still block the slot** for the default 60 min,
  with ⚠️ in the title, and you get an email.
- **Unknown Studio24 emails** (anything that isn't a new booking or a
  cancellation) are logged as `studio24-ignored` in SyncLog. If the subject is
  about a booking ("…резервация…", e.g. a reschedule), you also get an email
  the first time each kind appears — the calendar was NOT changed, so fix
  those bookings by hand and forward one to get the kind supported.

## Gmail labels

Every booking email the sync reads gets labels saying what it did, so the
inbox doubles as the log (SyncLog has the details). **`needs-check` is the one
to watch**: it marks every email a person should look at — the thread's other
labels say why. Remove it once you've handled it; only a new problem adds it
back. Labels belong to a whole Gmail conversation, and Gmail groups emails
with the same subject (e.g. every cancellation by one client), so one
conversation can carry several.

| Label | What happened | What to do |
|---|---|---|
| `needs-check` | Something below that needs a person | Look, fix, remove the label |
| `studio24-synced` | Any Studio24 email the sync handled | — |
| `studio24-booked` | New booking → calendar event created | — |
| `studio24-updated` | Booking re-sent with other services → event updated | — |
| `studio24-duplicate` | Same booking sent twice → nothing changed | — |
| `studio24-cancelled` | Cancellation → event deleted | — |
| `studio24-trimmed` | Part of a booking cancelled → event shortened to what's kept | — |
| `studio24-not-found` | Cancellation matched no calendar event (+ `needs-check`) | Make sure the slot is free in the calendar |
| `studio24-default-time` | A service isn't in the Services tab, so the length is a guess (+ `needs-check`) | Fix the event's length; add the service to the Services tab |
| `studio24-unrecognized` | Neither a new booking nor a cancellation → nothing changed (+ `needs-check` if it's about a booking) | If it moved a booking, fix the calendar by hand |
| `studio24-failed` | Kept failing → NOT synced (+ `needs-check`, you're emailed) | Update the calendar by hand |
| `declines-synced` | Any "Declined: …" email the sync read | — |
| `declines-removed` | The client declined → website booking deleted | — |
| `declines-kept` | Booking kept: the client answered "Yes" again, or a guest you added declined | — |
| `declines-not-found` | No booking at that time (already removed) | — |
| `declines-unreadable` | A "Declined:" subject in a format the sync can't read; the booking is still removed by the calendar check | Many of these = tell the developer |

The names are in `CONFIG.labels` (`Config.gs`). To rename one, rename it in
Gmail and in `CONFIG.labels` together — except `studio24-synced` and
`declines-synced`, which the sync searches by: renaming those makes it re-read
older emails once.

## How declined invites behave

- A website booking is removed when its **client** answers "No" to the
  invite — read from the event's guest list every 5 minutes, using Google's
  "Declined: …" email only to find the booking faster. If the client switches
  back to "Yes" before then, the booking stays; a guest you added yourself
  (e.g. a stylist) declining never cancels it.
- A client who declined and books the same time again gets a new booking and
  a new invite.
- To cancel a website booking yourself, delete the event in Google Calendar
  (let it email the guest). If you move it, Google sends the client the
  updated invite; nothing else is needed.

## Testing

**In Node (no Google account needed):** `npx vitest run
src/__tests__/appsScript.test.js src/__tests__/bookingSync.test.js` runs the
exact bundle against in-memory fakes of Calendar, Gmail, Sheets, etc. —
availability (incl. DST changes), booking rules, the Studio24 sync end to end,
and `runParserTests()`. `bookingSync.test.js` drives cancellations, declined
invites and moved bookings purely through email text: it builds what Studio24
and Google Calendar would send (`bookingEmails.js`), drops it into the fake
inbox and checks the calendar — no email is ever sent. Run both before every
re-paste.

From the Apps Script editor (pick function → Run → View → Logs):

- `runParserTests()` — asserts the Studio24 email parsers against real sample
  emails; throws on failure.
- `testAvailability()` — logs the computed free slots (read-only).
- `testBookDryRun()` — creates a REAL event at the first free slot ~in a week,
  invites the owner's own email. Verify the invite arrives and the event looks
  right (Maps link + phone in description), then delete it from the calendar.
- `testStudio24Fixtures()` — runs the new-reservation fixture (creates a
  synced event for 08.07.2026 10:30) then a matching cancellation (deletes
  it). Check the SyncLog tab: expect `created`, `deleted`, and one
  `not_found` row (the second cancelled service has no synced event — that's
  the expected log-only path).

From a terminal:

```bash
curl -L "<exec-url>?action=availability&duration=60"
curl -L "<exec-url>?action=reviews&lang=bg"
curl -L -d '{"action":"book","name":"Test","email":"you@example.com","phone":"0888599590","start":"2026-07-15T11:00:00+03:00","durationMin":30,"services":[{"name":"Тест","minutes":30,"priceEur":0}],"lang":"bg","website":""}' "<exec-url>"
```

(`-L` matters — Apps Script answers via a 302 redirect.)

## API contracts

```
GET ?action=availability&duration=<min>&days=<n>
→ { ok, timezone:'Europe/Sofia', durationMin,
    days:[{ date:'2026-07-10', slots:[{ start:'2026-07-10T09:00:00+03:00', label:'09:00' }] }] }

POST (text/plain body!)
{ action:'book', name, email, phone, start:ISO, durationMin,
  services:[{ name, minutes, priceEur }], lang, website:'' }
→ { ok:true, eventId, start, durationMin }
| { ok:false, error:'invalid'|'invalid_time'|'outside_hours'|'slot_taken'
             |'rate_limited'|'busy_try_again'|'server_error' }

GET ?action=reviews&lang=<bg|en>
→ { ok, rating, count,
    reviews:[{ author, photo, rating, text, date: ISO, time: 'преди месец' }] }
| { ok:false, error:'not_configured'|'places_error' }

GET ?action=instagram
→ { ok, updatedAt: ISO,
    posts:[{ id, type:'photo'|'carousel'|'reel', image: https URL (a reel's cover,
             a carousel's first slide), caption (trailing hashtags dropped, ≤300),
             permalink, timestamp }] }          newest first, at most 12
| { ok:false, error:'not_configured'   (no IG_TOKEN)
                  |'empty' }           (token saved, no successful sync yet)
```

## Quotas & caveats (consumer Gmail account)

- Calendar invites to external guests: ~100/day — far above salon volume.
- Gmail read/label: effectively unlimited at our polling rate.
- Google may put calendar invites from unknown senders in spam — the site's
  success screen tells clients to check there.
- The web app URL is public. Protections: honeypot field, max 3 bookings/hour
  per email and per phone, max 30 website bookings/day for the whole site
  (`CONFIG` in `Config.gs`), length caps on every text field, slot
  re-validation under a script lock, and everything is logged to SyncLog.
- A repeat of the same booking (same phone, same start) returns the booking
  already made instead of "slot taken" — so a client whose browser timed out
  can simply press Confirm again.
