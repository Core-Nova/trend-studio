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
| `Studio24Sync.gs` | 5-min trigger: mirrors Studio24 booking/cancellation emails into the calendar |
| `Reviews.gs` | `GET ?action=reviews&lang=bg` → live Google rating + reviews (cached 6h) |
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
   hours + service durations), the `studio24-synced` Gmail label, and the
   5-minute sync trigger. The execution log prints the spreadsheet link.
4. *(Optional — live reviews)* In [console.cloud.google.com](https://console.cloud.google.com)
   create a project → enable **Places API (New)** → create an **API key**
   (needs a billing account; usage at our volume stays inside the free tier).
   Find the salon's Place ID with Google's
   [Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id).
   In Apps Script → Project Settings → **Script Properties** add
   `PLACES_API_KEY` and `PLACE_ID`. Skipping this step is fine — the site
   keeps its bundled reviews.
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
and break the site until `VITE_BACKEND_URL` is updated.)

Power option: [`clasp`](https://github.com/google/clasp) (`npm i -g
@google/clasp`, `clasp login`, `clasp clone <scriptId>` into a scratch dir)
pushes these files from the command line instead of pasting — entirely
optional.

## Changing working hours / holidays / service durations

Edit the **TREND Booking Config** spreadsheet — never the code:

- **Hours** — weekly schedule (`Open`/`Close` as `HH:mm` text, `Closed` TRUE/FALSE)
- **Overrides** — specific dates (`2026-12-24`): shorter hours or `Closed` TRUE for holidays/vacation
- **Services** — Bulgarian service name → minutes; used to size Studio24-synced
  events (matching is "longest name contained in the email's service line")
- **SyncLog** — read-only audit trail of every booking/sync action

Changes apply within ~10 minutes (cache TTL).

## Testing

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
```

## Quotas & caveats (consumer Gmail account)

- Calendar invites to external guests: ~100/day — far above salon volume.
- Gmail read/label: effectively unlimited at our polling rate.
- Google may put calendar invites from unknown senders in spam — the site's
  success screen tells clients to check there.
- The web app URL is public. Protections: honeypot field, 3 attempts/hour per
  email rate limit, slot re-validation under a script lock, and everything is
  logged to SyncLog.
