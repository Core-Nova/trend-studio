/**
 * TREND Booking — web app entry points.
 *
 * Deployed as a Web App (Execute as: Me, Access: Anyone). The static site
 * calls it cross-origin, which imposes two rules:
 *  - GET for reads (?action=availability | reviews)
 *  - POST bodies must be text/plain (fetch's default for a string body) so
 *    the browser skips the CORS preflight — Apps Script cannot answer OPTIONS.
 * Responses are ContentService JSON; fetch follows the 302 redirect Apps
 * Script issues to script.googleusercontent.com automatically.
 */

function doGet(e) {
  const action = String((e && e.parameter && e.parameter.action) || '').toLowerCase()
  try {
    if (action === 'availability') return json_(getAvailability(e.parameter))
    if (action === 'reviews') return json_(getReviews(e.parameter))
    return json_({ ok: false, error: 'unknown_action' })
  } catch (err) {
    console.error(err)
    return json_({ ok: false, error: 'server_error' })
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents)
    if (body.action === 'book') return json_(bookAppointment(body))
    return json_({ ok: false, error: 'unknown_action' })
  } catch (err) {
    console.error(err)
    return json_({ ok: false, error: 'server_error' })
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  )
}
