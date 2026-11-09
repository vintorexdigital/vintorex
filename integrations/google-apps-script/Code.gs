/**
 * Vintorex → Google Sheets bridge (Apps Script).
 *
 * Setup
 * 1. Create a Google Sheet. Rename the first tab to "Inbox" (or set SHEET_NAME below).
 * 2. Extensions → Apps Script. Paste this file. Set WEBAPP_SECRET to a random hex
 *    (openssl rand -hex 32) — the same value as GOOGLE_SHEETS_SECRET in the server .env.
 * 3. Deploy → New deployment → Type: Web app
 *      Execute as: Me
 *      Who has access: Anyone
 * 4. Copy the web app URL into GOOGLE_SHEETS_WEBAPP_URL on the Vintorex server.
 * 5. Redeploy the script after any edit (Manage deployments → Edit → New version).
 *
 * The Node server POSTs JSON with header x-vintorex-signature = HMAC-SHA256(hex) of the raw body.
 */

var SHEET_NAME = 'Inbox';
// Must match GOOGLE_SHEETS_SECRET (or N8N_WEBHOOK_SECRET) on the server. Never commit the real value.
var WEBAPP_SECRET = 'c94d62b052f6e566ae54e5d31c7ec0ecd3cdabfe4d9025253a152d4e464421ef';

var LEAD_HEADERS = ['at', 'type', 'id', 'name', 'email', 'phone', 'service', 'source', 'message', 'stage', 'raw'];
var OFFER_HEADERS = ['at', 'type', 'uid', 'code', 'email', 'name', 'business', 'goal', 'service', 'tier', 'amount', 'price', 'total', 'followup', 'paid', 'raw'];

function doGet() {
  return json_({ ok: true, service: 'vintorex-sheets', sheet: SHEET_NAME });
}

function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) || '';
    var signature = header_(e, 'x-vintorex-signature');
    if (!WEBAPP_SECRET || WEBAPP_SECRET.indexOf('REPLACE_') === 0) {
      return json_({ ok: false, error: 'WEBAPP_SECRET is not set in Apps Script.' }, 503);
    }
    if (!sameHex_(signature, hmacHex_(raw, WEBAPP_SECRET))) {
      return json_({ ok: false, error: 'Bad signature.' }, 401);
    }
    var body = JSON.parse(raw);
    var event = String(body.event || body.flow || '');
    var payload = body.payload || body;
    var sheet = openSheet_();
    if (event === 'lead.created' || event === 'lead-intake' || payload.type === 'lead') {
      ensureHeaders_(sheet, LEAD_HEADERS);
      sheet.appendRow([
        body.at || new Date().toISOString(),
        'lead',
        payload.id || '',
        payload.name || '',
        payload.email || '',
        payload.phone || '',
        payload.service || '',
        payload.source || '',
        payload.message || '',
        payload.stage || '',
        raw
      ]);
      return json_({ ok: true, written: 'lead' });
    }
    if (event === 'offer.claimed' || payload.type === 'offer') {
      ensureHeaders_(sheet, OFFER_HEADERS);
      sheet.appendRow([
        body.at || new Date().toISOString(),
        'offer',
        payload.uid || '',
        payload.code || '',
        payload.email || '',
        payload.name || '',
        payload.business || '',
        payload.goal || '',
        payload.service || '',
        payload.tier || '',
        payload.amount || '',
        payload.price || '',
        payload.total || '',
        payload.followup || '',
        payload.paid ? 1 : 0,
        raw
      ]);
      return json_({ ok: true, written: 'offer' });
    }
    ensureHeaders_(sheet, ['at', 'type', 'raw']);
    sheet.appendRow([body.at || new Date().toISOString(), event || 'unknown', raw]);
    return json_({ ok: true, written: 'raw' });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) }, 500);
  }
}

function openSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  return sheet;
}

function ensureHeaders_(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    return;
  }
  var first = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  if (String(first[0]).toLowerCase() !== String(headers[0]).toLowerCase()) {
    sheet.insertRowBefore(1);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
}

function header_(e, name) {
  var headers = (e && e.headers) || {};
  var key = Object.keys(headers).find(function (k) { return k.toLowerCase() === name.toLowerCase(); });
  return key ? String(headers[key]) : '';
}

function hmacHex_(message, secret) {
  var bytes = Utilities.computeHmacSha256Signature(message, secret);
  return bytes.map(function (b) {
    var v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

function sameHex_(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  var out = 0;
  for (var i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

function json_(obj, status) {
  var out = ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
  // Apps Script web apps ignore custom HTTP status codes for most clients; body.ok is the contract.
  return out;
}
