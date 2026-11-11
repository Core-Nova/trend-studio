/**
 * TREND Booking — Instagram feed for the gallery page.
 *
 * GET ?action=instagram
 * → { ok: true, updatedAt: ISO, posts: [{ id, type: 'photo'|'carousel'|'reel',
 *       image, caption, permalink, timestamp }] }      (newest first, max 12)
 * | { ok: false, error: 'not_configured' | 'empty' }
 *
 * The visitor's browser never talks to Instagram. syncInstagram() (6-hour
 * trigger) pulls the latest posts with the "Instagram API with Instagram
 * Login" and stores them in the config spreadsheet's "Instagram" tab; the
 * endpoint serves that copy, with CacheService in front. A failed sync keeps
 * the last good copy, so an Instagram hiccup never empties the gallery — the
 * site shows its bundled photos only when no copy exists at all.
 *
 * Instagram's CDN image URLs expire after a few days; the 6-hour sync
 * replaces them long before that.
 *
 * Needs Script Property IG_TOKEN: a long-lived Instagram User access token
 * for @trendbytedi (a Business or Creator account). refreshInstagramToken()
 * (weekly trigger) trades it for a fresh 60-day one. A token that is never
 * refreshed dies after 60 days and must be generated again — the owner is
 * emailed (at most once a day) when Instagram rejects it.
 */

const IG_ = {
  api: 'https://graph.instagram.com',
  fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp',
  maxPosts: 12,
  captionMax: 300,
  sheet: 'Instagram',
  cacheKey: 'igFeed',
  cacheSec: 3600,
}

function getInstagramFeed() {
  const cache = CacheService.getScriptCache()
  const hit = cache.get(IG_.cacheKey)
  if (hit) return JSON.parse(hit)

  const stored = readInstagramCopy_()
  if (!stored) return { ok: false, error: getProp_('IG_TOKEN') ? 'empty' : 'not_configured' }
  const out = { ok: true, updatedAt: stored.updatedAt, posts: stored.posts }
  cache.put(IG_.cacheKey, JSON.stringify(out), IG_.cacheSec)
  return out
}

/** Time-driven (every 6 h, see TRIGGERS_ in Setup.gs). Never throws. */
function syncInstagram() {
  const token = getProp_('IG_TOKEN')
  if (!token) return
  try {
    const res = igGet_('/me/media?fields=' + IG_.fields + '&limit=' + IG_.maxPosts, token)
    if (!res.ok) {
      failInstagram_('sync', res)
      return
    }
    const posts = []
    const media = res.body.data || []
    media.forEach(function (m) {
      const post = toInstagramPost_(m, token)
      if (post && posts.length < IG_.maxPosts) posts.push(post)
    })
    if (!posts.length) {
      logSync_('instagram', 'sync', 'no usable posts, kept the previous copy')
      return
    }
    const copy = { updatedAt: new Date().toISOString(), posts: posts }
    writeInstagramCopy_(copy)
    CacheService.getScriptCache().put(
      IG_.cacheKey,
      JSON.stringify({ ok: true, updatedAt: copy.updatedAt, posts: posts }),
      IG_.cacheSec
    )
  } catch (err) {
    logSync_('instagram', 'sync', 'error: ' + err)
  }
}

/** Time-driven (weekly). A long-lived token can be refreshed once it is 24 h old. */
function refreshInstagramToken() {
  const token = getProp_('IG_TOKEN')
  if (!token) return
  try {
    const res = igGet_('/refresh_access_token?grant_type=ig_refresh_token', token)
    if (!res.ok || !res.body.access_token) {
      failInstagram_('token refresh', res)
      return
    }
    setProp_('IG_TOKEN', res.body.access_token)
    setProp_('IG_TOKEN_REFRESHED', new Date().toISOString())
  } catch (err) {
    logSync_('instagram', 'token refresh', 'error: ' + err)
  }
}

// ---------- mapping (pure apart from the carousel lookup) ----------

/**
 * One API media object → the post the site renders, or null when it has no
 * usable image. A reel shows its cover (thumbnail_url); a carousel its first
 * slide — which, when that slide is a video, means asking for its children.
 * Only https URLs survive, so nothing else can reach an <img> or <a href>.
 */
function toInstagramPost_(m, token) {
  if (!m || !m.id) return null
  const type = m.media_type === 'VIDEO' ? 'reel' : m.media_type === 'CAROUSEL_ALBUM' ? 'carousel' : 'photo'
  let image = type === 'reel' ? m.thumbnail_url : m.media_url
  if (type === 'carousel' && (!isHttpsUrl_(image) || isVideoUrl_(image))) image = carouselCover_(m.id, token)
  if (!isHttpsUrl_(image) || isVideoUrl_(image) || !isHttpsUrl_(m.permalink)) return null
  return {
    id: String(m.id),
    type: type,
    image: image,
    caption: cleanCaption_(m.caption),
    permalink: m.permalink,
    timestamp: m.timestamp || '',
  }
}

function carouselCover_(id, token) {
  const res = igGet_('/' + encodeURIComponent(id) + '/children?fields=media_type,media_url,thumbnail_url', token)
  const first = res.ok && res.body.data && res.body.data[0]
  if (!first) return null
  return first.media_type === 'VIDEO' ? first.thumbnail_url : first.media_url
}

/**
 * The caption the tile shows: a trailing block of hashtags dropped (it is for
 * Instagram's search, not for reading — a trailing @mention stays, it is
 * usually part of the sentence), whitespace collapsed, capped.
 */
function cleanCaption_(caption) {
  let text = String(caption || '')
  text = text.replace(/(?:\s*#[^\s#]+)+\s*$/, '')
  text = text.replace(/\s+/g, ' ').trim()
  if (text.length > IG_.captionMax) text = text.slice(0, IG_.captionMax - 1).trim() + '…'
  return text
}

function isHttpsUrl_(url) {
  return typeof url === 'string' && /^https:\/\/[^\s"'<>]+$/.test(url)
}

function isVideoUrl_(url) {
  return /\.mp4(?:[?#]|$)/i.test(String(url || ''))
}

// ---------- plumbing ----------

/** GET against graph.instagram.com → { ok, code, body }. The token rides in the query. */
function igGet_(path, token) {
  const sep = path.indexOf('?') === -1 ? '?' : '&'
  const res = UrlFetchApp.fetch(IG_.api + path + sep + 'access_token=' + encodeURIComponent(token), {
    muteHttpExceptions: true,
  })
  let body = {}
  try {
    body = JSON.parse(res.getContentText() || '{}')
  } catch (err) {
    body = {}
  }
  return { ok: res.getResponseCode() === 200 && !body.error, code: res.getResponseCode(), body: body }
}

/**
 * Logs a failed call and, when Instagram rejected the token (error 190 —
 * expired, revoked, or the password changed), emails the owner once a day:
 * nothing but a new token fixes that.
 */
function failInstagram_(what, res) {
  const err = (res.body && res.body.error) || {}
  logSync_('instagram', what, 'failed (' + res.code + '): ' + (err.message || 'no details'))
  if (err.code !== 190) return
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd')
  if (getProp_('IG_ALERTED_DAY') === today) return
  setProp_('IG_ALERTED_DAY', today)
  notifyOwner_('Instagram feed needs a new token', [
    'Instagram no longer accepts the saved access token, so the gallery keeps showing',
    'its last copy of the feed and stops updating.',
    '',
    'Generate a new long-lived token for @trendbytedi and save it in Apps Script →',
    'Project Settings → Script Properties as IG_TOKEN (see apps-script/README.md).',
    '',
    'Instagram said: ' + (err.message || 'no details'),
  ])
}

function readInstagramCopy_() {
  const ss = SpreadsheetApp.openById(getProp_('CONFIG_SPREADSHEET_ID'))
  const sheet = ss.getSheetByName(IG_.sheet)
  if (!sheet) return null
  try {
    const copy = JSON.parse(String(sheet.getRange(1, 1).getValue() || ''))
    return copy && copy.posts && copy.posts.length ? copy : null
  } catch (err) {
    return null
  }
}

/** A1 holds the whole copy as JSON (a cell takes 50k characters; 12 posts are ~12k). */
function writeInstagramCopy_(copy) {
  const ss = SpreadsheetApp.openById(getProp_('CONFIG_SPREADSHEET_ID'))
  const sheet = ss.getSheetByName(IG_.sheet) || ss.insertSheet(IG_.sheet)
  sheet.getRange(1, 1).setValue(JSON.stringify(copy))
  sheet.getRange(2, 1).setValue('Written by syncInstagram() — do not edit. Updated ' + copy.updatedAt)
}
