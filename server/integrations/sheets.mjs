// Append CRM rows to Google Sheets with a service account (no user OAuth).
// Works when the admin Google account has Advanced Protection (policy_enforced).
import { createSign, createPrivateKey } from 'node:crypto';
import { readFileSync } from 'node:fs';

const SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
let cached;

function fail(status, message) { throw Object.assign(new Error(message), { status }); }

function loadKey() {
  const inline = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const file = process.env.GOOGLE_SERVICE_ACCOUNT_FILE;
  if (!inline && !file) return null;
  try {
    const raw = inline || readFileSync(file, 'utf8');
    const json = JSON.parse(raw);
    if (!json.client_email || !json.private_key) fail(500, 'Service account JSON is missing client_email or private_key.');
    return json;
  } catch (error) {
    fail(500, 'Invalid GOOGLE_SERVICE_ACCOUNT_JSON / FILE: ' + error.message);
  }
}

function b64url(input) {
  return Buffer.from(input).toString('base64url');
}

async function accessToken(key, fetchImpl = globalThis.fetch) {
  const now = Math.floor(Date.now() / 1000);
  if (cached && cached.email === key.client_email && cached.exp > now + 60) return cached.token;
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(JSON.stringify({
    iss: key.client_email,
    scope: SCOPE,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = header + '.' + claim;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(createPrivateKey(key.private_key), 'base64url');
  const res = await fetchImpl('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: unsigned + '.' + signature,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.access_token) fail(502, body.error_description || body.error || 'Google token exchange failed.');
  cached = { email: key.client_email, token: body.access_token, exp: now + Number(body.expires_in || 3600) };
  return cached.token;
}

function leadRow(at, payload) {
  return [at, 'lead', payload.id || '', payload.name || '', payload.email || '', payload.phone || '',
    payload.service || '', payload.source || '', payload.message || '', payload.stage || '', JSON.stringify(payload)];
}

function offerRow(at, payload) {
  return [at, 'offer', payload.uid || '', payload.code || '', payload.email || '', payload.name || '',
    payload.business || '', payload.goal || '', payload.service || '', payload.tier || '',
    payload.amount ?? '', payload.price ?? '', payload.total ?? '', payload.followup || '',
    payload.paid ? 1 : 0, JSON.stringify(payload)];
}

export function sheetsConfigured() {
  return Boolean(process.env.GOOGLE_SHEETS_SPREADSHEET_ID && (process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_SERVICE_ACCOUNT_FILE));
}

export async function appendEvent(event, payload, fetchImpl = globalThis.fetch) {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const tab = process.env.GOOGLE_SHEETS_TAB || 'Inbox';
  const key = loadKey();
  if (!spreadsheetId || !key) return { delivered: false, reason: 'Google Sheets service account is not configured' };
  const at = new Date().toISOString();
  const values = event.startsWith('offer') || payload.type === 'offer' ? [offerRow(at, payload)] : [leadRow(at, payload)];
  const token = await accessToken(key, fetchImpl);
  const range = encodeURIComponent(tab + '!A:P');
  const res = await fetchImpl(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
    method: 'POST',
    headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
    body: JSON.stringify({ values }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { delivered: false, status: res.status, reason: err.error?.message || 'Sheets append failed' };
  }
  return { delivered: true, status: res.status, via: 'service-account' };
}
