#!/usr/bin/env node
/**
 * Concatenates every .gs file into one stream so the whole backend can be
 * pasted into a single Apps Script file (all files share global scope, so
 * the file split is purely organizational).
 *
 * Windows:  node apps-script/bundle.mjs | clip
 * macOS:    node apps-script/bundle.mjs | pbcopy
 *
 * Then paste ONCE into the default Code.gs at script.google.com.
 * appsscript.json must still be pasted separately (it's the manifest).
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = dirname(fileURLToPath(import.meta.url))
const FILES = [
  'Config.gs',
  'Router.gs',
  'WorkingHours.gs',
  'GetAvailability.gs',
  'BookAppointment.gs',
  'Studio24Sync.gs',
  'DeclinedBookings.gs',
  'Analytics.gs',
  'Reviews.gs',
  'Setup.gs'
]

let out = '// TREND Booking — single-file bundle generated from apps-script/*.gs\n'
out += '// Regenerate with: node apps-script/bundle.mjs\n'
for (const file of FILES) {
  out += `\n// ${'═'.repeat(20)} ${file} ${'═'.repeat(20)}\n\n`
  out += readFileSync(join(dir, file), 'utf8')
}
process.stdout.write(out)
