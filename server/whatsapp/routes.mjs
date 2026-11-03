// HTTP routes for WhatsApp, mounted by server/index.mjs for every /api/whatsapp/* path.
//
//   GET  /api/whatsapp                      { enabled, ... } what is configured (no key needed)
//   GET  /api/whatsapp/webhook              Meta's verification handshake
//   POST /api/whatsapp/webhook              inbound messages and statuses (X-Hub-Signature-256 checked)
//
// Everything below needs the header  x-api-key: <WHATSAPP_API_KEY>
//   POST /api/whatsapp/send/{text,template,media,buttons,list,cta,location}
//   GET|POST|DELETE /api/whatsapp/templates     list, create (goes for review), delete by ?name=
//   GET  /api/whatsapp/phone                    quality rating, messaging tier, verified name
//   POST /api/whatsapp/partner/onboard          finish a client's Embedded Signup (code → webhooks → register → credit line)
//   POST /api/whatsapp/partner/credit-line      share our credit line with a client WABA
//   POST /api/whatsapp/partner/invite           { name, days? } → a signed link to /connect-whatsapp for one client
//
// The client's page (/connect-whatsapp) has no key; it carries a signed invite instead:
//   GET  /api/whatsapp/signup?invite=…          { appId, configId, graphVersion, name } to start Embedded Signup
//   POST /api/whatsapp/signup                   { invite, code, wabaId, phoneNumberId } finishes onboarding
//
// Send, template and phone calls take an optional phoneNumberId / wabaId to act on a client's number or account.
import { createHash, createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { config, missing } from './config.mjs';
import { WhatsAppClient, WhatsAppError, exchangeCode, subscribeApp, registerPhone, shareCreditLine } from './client.mjs';
import { verifySignature, parseWebhook, SeenCache, bus } from './webhook.mjs';
import './handlers.mjs';
import { clientIp } from '../client-ip.mjs';

const seen = new SeenCache();

function reply(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(type === 'application/json' ? JSON.stringify(body) : body);
}

async function readBody(req, limit) {
  const chunks = []; let size = 0;
  for await (const c of req) {
    if ((size += c.length) > limit) throw new WhatsAppError('Request too large.', { status: 413 });
    chunks.push(c);
  }
  return Buffer.concat(chunks);
}

async function readJson(req) {
  if (!String(req.headers['content-type']).startsWith('application/json')) throw new WhatsAppError('Expected JSON.', { status: 415 });
  try {
    const body = JSON.parse((await readBody(req, 1 << 20)).toString() || '{}');
    if (body && typeof body === 'object' && !Array.isArray(body)) return body;
  } catch (err) { if (err instanceof WhatsAppError) throw err; }
  throw new WhatsAppError('Invalid JSON.', { status: 400 });
}

// Hashing first makes the comparison constant-time whatever the lengths.
const digest = s => createHash('sha256').update(String(s)).digest();
function authorised(req) {
  return Boolean(config.apiKey) && timingSafeEqual(digest(req.headers['x-api-key'] || ''), digest(config.apiKey));
}

// ---------- webhook ----------
function verifyHandshake(res, query) {
  const token = query.get('hub.verify_token');
  if (query.get('hub.mode') === 'subscribe' && token && config.verifyToken && digest(token).equals(digest(config.verifyToken))) {
    return reply(res, 200, String(query.get('hub.challenge')), 'text/plain');
  }
  reply(res, 403, 'Forbidden', 'text/plain');
}

async function receive(req, res) {
  const raw = await readBody(req, 2 << 20);
  if (!verifySignature(raw, req.headers['x-hub-signature-256'], config.appSecret)) {
    console.warn('WhatsApp webhook rejected: bad signature');
    return reply(res, 401, 'Unauthorized', 'text/plain');
  }
  let payload;
  try { payload = JSON.parse(raw.toString('utf8')); } catch { return reply(res, 400, 'Bad request', 'text/plain'); }
  let events;
  try { events = parseWebhook(payload); } catch { return reply(res, 400, 'Invalid webhook payload', 'text/plain'); }
  // Answer first: Meta retries when a 200 is slow.
  reply(res, 200, 'ok', 'text/plain');
  setImmediate(() => {
    for (const evt of events) {
      const key = evt.id ? `${evt.kind}:${evt.id}:${evt.status || ''}` : null;
      if (key && seen.has(key)) continue;
      if (key) seen.add(key);
      try { bus.emit(evt.kind, evt); } catch (err) { console.error('WhatsApp handler error', err); }
    }
    // Hand every event to another backend too, if asked. Prefer FORWARD_WEBHOOK_SECRET so the sink can authenticate us.
    if (config.forwardUrl && events.length) {
      const headers = { 'Content-Type': 'application/json' };
      if (config.forwardSecret) headers.Authorization = 'Bearer ' + config.forwardSecret;
      else console.warn('FORWARD_WEBHOOK_URL is set without FORWARD_WEBHOOK_SECRET; the receiving URL is not authenticated.');
      fetch(config.forwardUrl, {
        method: 'POST', headers, signal: AbortSignal.timeout(10000),
        body: JSON.stringify({ events: events.map(({ raw, ...e }) => e) }),
      }).catch(err => console.error('WhatsApp forward failed:', err.message));
    }
  });
}

// ---------- API ----------
const clientFor = b => new WhatsAppClient({ phoneNumberId: b.phoneNumberId, wabaId: b.wabaId });
const need = (b, ...keys) => { for (const k of keys) if (!b[k]) throw new WhatsAppError(`${k} is required`, { status: 400 }); };

const SEND = {
  text: b => clientFor(b).sendText(b.to, b.text, b),
  template: b => (need(b, 'name'), clientFor(b).sendTemplate(b.to, b.name, b.language || 'en', b)),
  media: b => {
    const fn = { image: 'sendImage', document: 'sendDocument', video: 'sendVideo', audio: 'sendAudio', sticker: 'sendSticker' }[b.type];
    if (!fn) throw new WhatsAppError('type must be image, document, video, audio or sticker', { status: 400 });
    return clientFor(b)[fn](b.to, b, { replyTo: b.replyTo });
  },
  buttons: b => clientFor(b).sendButtons(b.to, b, { replyTo: b.replyTo }),
  list: b => clientFor(b).sendList(b.to, b, { replyTo: b.replyTo }),
  cta: b => clientFor(b).sendCtaUrl(b.to, b),
  location: b => clientFor(b).sendLocation(b.to, b),
};

// Body: { code, wabaId, phoneNumberId, pin, currency? } from the client's finished Embedded Signup.
// The code lasts 30 seconds, so the browser should post it as soon as it arrives. The business token is
// used for this onboarding only and is never stored; later calls use the System User token.
async function onboard(b) {
  need(b, 'code', 'wabaId', 'phoneNumberId', 'pin');
  const gaps = missing().partner;
  if (gaps.length) throw new WhatsAppError(`Partner onboarding needs ${gaps.join(', ')}`, { status: 503 });
  const token = await exchangeCode(String(b.code));
  const done = { wabaId: b.wabaId, phoneNumberId: b.phoneNumberId };
  await subscribeApp(b.wabaId, token); done.webhooks = 'subscribed';
  await registerPhone(b.phoneNumberId, b.pin, token); done.phone = 'registered';
  if (config.creditLineId) { await shareCreditLine(b.wabaId, b.currency || 'INR'); done.creditLine = 'shared'; }
  else done.creditLine = 'skipped (WHATSAPP_CREDIT_LINE_ID not set: the client must add a payment method)';
  return done;
}

// ---------- client invites ----------
// A signed, expiring token naming the client, so a page without the API key can still onboard them.
// Signed with a key derived from WHATSAPP_API_KEY: rotating the API key voids every open invite.
const inviteMac = data => createHmac('sha256', createHmac('sha256', config.apiKey).update('whatsapp-invite').digest()).update(data).digest('base64url');
function makeInvite(name, days) {
  const data = Buffer.from(JSON.stringify({ n: name, exp: Date.now() + days * 864e5 })).toString('base64url');
  return `${data}.${inviteMac(data)}`;
}
function readInvite(token) {
  const [data, sig] = String(token || '').split('.');
  if (!data || !sig || !config.apiKey || !digest(sig).equals(digest(inviteMac(data)))) return null;
  try { const v = JSON.parse(Buffer.from(data, 'base64url').toString()); return v.exp > Date.now() ? v : null; } catch { return null; }
}
const badInvite = () => new WhatsAppError('This invite link is invalid or has expired. Ask Vintorex for a new one.', { status: 403 });

// At most 20 signup requests per visitor every 10 minutes.
const hits = new Map();
function limit(req) {
  const ip = clientIp(req);
  const now = Date.now(), h = hits.get(ip);
  if (hits.size > 10000) hits.clear();
  if (!h || now - h.start > 600e3) hits.set(ip, { start: now, n: 1 });
  else if (++h.n > 20) throw new WhatsAppError('Too many attempts. Please wait a few minutes.', { status: 429 });
}

async function signup(req, res, query) {
  limit(req);
  const gaps = missing().signup;
  if (gaps.length) throw new WhatsAppError('Client signup is not set up yet.', { status: 503 });
  if (req.method === 'GET') {
    const invite = readInvite(query.get('invite'));
    if (!invite) throw badInvite();
    return reply(res, 200, { name: invite.n, appId: config.appId, configId: config.signupConfigId, graphVersion: config.graphVersion });
  }
  if (req.method !== 'POST') throw new WhatsAppError('Method not allowed.', { status: 405 });
  const b = await readJson(req);
  const invite = readInvite(b.invite);
  if (!invite) throw badInvite();
  need(b, 'code', 'wabaId', 'phoneNumberId');
  // The client never needs the two-step PIN, so we choose it. It is not stored: to change it later, set a new one in WhatsApp Manager.
  const done = await onboard({ ...b, pin: String(randomInt(100000, 1000000)) });
  console.log(`WhatsApp client "${invite.n}" onboarded: WABA ${done.wabaId}, phone number ${done.phoneNumberId}`);
  reply(res, 200, { ok: true, ...done });
}

async function api(req, res, route, query) {
  if (!authorised(req)) return reply(res, 401, { error: 'Unauthorized' });
  const m = req.method;
  let out;
  if (route.startsWith('send/') && m === 'POST' && Object.hasOwn(SEND, route.slice(5))) out = await SEND[route.slice(5)](await readJson(req));
  else if (route === 'templates' && m === 'GET') out = await clientFor({ wabaId: query.get('wabaId') }).listTemplates({ status: query.get('status') || undefined });
  else if (route === 'templates' && m === 'POST') { const b = await readJson(req); out = await clientFor(b).createTemplate(b.template || b); }
  else if (route === 'templates' && m === 'DELETE') out = await clientFor({ wabaId: query.get('wabaId') }).deleteTemplate(query.get('name'));
  else if (route === 'phone' && m === 'GET') out = await clientFor({ phoneNumberId: query.get('phoneNumberId') }).getPhoneNumberInfo();
  else if (route === 'partner/onboard' && m === 'POST') out = await onboard(await readJson(req));
  else if (route === 'partner/invite' && m === 'POST') {
    const b = await readJson(req); need(b, 'name');
    const days = Math.min(Math.max(Number(b.days) || 7, 1), 30);
    out = { url: `${process.env.SITE_URL || 'https://vintorex.com'}/connect-whatsapp?invite=${makeInvite(String(b.name).slice(0, 80), days)}`, expiresInDays: days };
  }
  else if (route === 'partner/credit-line' && m === 'POST') { const b = await readJson(req); need(b, 'wabaId'); out = await shareCreditLine(b.wabaId, b.currency || 'INR'); }
  else return reply(res, 404, { error: 'Not found.' });
  reply(res, 200, out);
}

export async function whatsappRoute(req, res, pathname, query) {
  const route = pathname.replace(/^\/api\/whatsapp\/?/, '');
  try {
    if (route === '') {
      const gaps = missing();
      return reply(res, 200, { enabled: !gaps.send.length, send: !gaps.send.length, webhook: !gaps.webhook.length, api: !gaps.api.length, partner: !gaps.partner.length, signup: !gaps.signup.length, bot: config.bot, graphVersion: config.graphVersion });
    }
    if (route === 'webhook') {
      if (req.method === 'GET') return verifyHandshake(res, query);
      if (req.method === 'POST') return await receive(req, res);
      return reply(res, 405, { error: 'Method not allowed.' });
    }
    if (route === 'signup') return await signup(req, res, query);
    await api(req, res, route, query);
  } catch (err) {
    if (res.headersSent) return res.end();
    if (!(err instanceof WhatsAppError)) { console.error('WhatsApp route', err); return reply(res, 500, { error: 'Something went wrong.' }); }
    const status = err.status >= 400 && err.status < 600 ? err.status : 502;
    reply(res, status, { error: err.message, code: err.code, subcode: err.subcode, details: err.details, fbtraceId: err.fbtraceId });
  }
}
