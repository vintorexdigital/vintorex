// Vintorex web server: serves dist/, the Razorpay payment API, the chat assistant and WhatsApp. `npm start`.
// Keys come from the host's environment, or from .env at the repo root.
//
//   GET  /api/payments         { enabled, keyId }; the app stays in demo mode without it
//   POST /api/payments/order   prices the cart (or the next instalment) and creates a Razorpay order
//   POST /api/payments/verify  checks the payment signature and returns signed tokens
//   GET  /api/chat             chat assistant status; POST streams an answer (see chat.mjs)
//   /api/whatsapp/*            WhatsApp Cloud API: webhook, send, templates, partner onboarding (see whatsapp/routes.mjs)
//
// Accounts and orders live in each browser, so the server keeps no database. What it
// must remember later (a paid membership, the instalments still due) goes back to the
// browser as a token signed with PAYMENT_TOKEN_SECRET that the browser cannot alter.
import './env.mjs';
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SERVICES, ADDONS, PLANS, PRODUCTS, COUPONS, BUSINESS } from '../dist/js/data.js';
import { priceCart, amountDue } from '../dist/js/pricing.js';
import { matchRoute, trimPath, isPrivate, canonicalPath, pageMeta } from '../dist/js/routes.js';
import { chat, chatStatus, AI_ON } from './chat.mjs';
import { whatsappRoute } from './whatsapp/routes.mjs';
import { missing as whatsappMissing } from './whatsapp/config.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'dist');
const SITE = (process.env.SITE_URL || 'https://vintorex.com').replace(/\/$/, '');
const SERVICE_IDS = new Set(SERVICES.map(s => s.id));

const { RAZORPAY_KEY_ID: KEY_ID, RAZORPAY_KEY_SECRET: KEY_SECRET } = process.env;
const RAZORPAY_API = process.env.RAZORPAY_API_BASE || 'https://api.razorpay.com/v1';
const PORT = Number(process.env.PORT) || 5173;
// Set HOST=127.0.0.1 in production so only the reverse proxy / tunnel on this machine can connect.
// Unset, the server takes IPv6 and IPv4 together (Node's default); binding 0.0.0.0 alone left
// [::1]:PORT free, so another local server could answer "localhost" without /api/chat.
const HOST = process.env.HOST || undefined;
const PAYMENTS = Boolean(KEY_ID && KEY_SECRET);
const TOKEN_KEY = process.env.PAYMENT_TOKEN_SECRET || (KEY_SECRET && createHmac('sha256', KEY_SECRET).update('vintorex-token').digest('hex'));
// Prices come from the shipped catalog, never from the browser.
const CATALOG = { services: SERVICES, addons: ADDONS, plans: PLANS, products: PRODUCTS, coupons: COUPONS };
const DAY = 864e5;

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

// ---------- signed tokens ----------
function same(a, b) {
  const x = Buffer.from(String(a ?? '')), y = Buffer.from(String(b ?? ''));
  return x.length === y.length && timingSafeEqual(x, y);
}
const mac = data => createHmac('sha256', TOKEN_KEY).update(data).digest('base64url');
function sign(obj) {
  const data = Buffer.from(JSON.stringify(obj)).toString('base64url');
  return `${data}.${mac(data)}`;
}
function unsign(token, kind) {
  const [data, sig] = String(token || '').split('.');
  if (!data || !same(sig, mac(data))) return null;
  const obj = JSON.parse(Buffer.from(data, 'base64url').toString());
  return obj.k === kind && obj.exp > Date.now() ? obj : null;
}

// ---------- payments ----------
const str = (v, max = 100) => typeof v === 'string' ? v.trim().slice(0, max) : '';

function cartItems(items) {
  if (!Array.isArray(items) || !items.length || items.length > 50) return null;
  return items.map(i => ({
    type: str(i?.type, 20), ref: str(i?.ref, 80), tier: str(i?.tier, 80) || undefined,
    cycle: ['month', 'year'].includes(i?.cycle) ? i.cycle : undefined,
    qty: Number.isInteger(i?.qty) && i.qty > 0 && i.qty <= 20 ? i.qty : 1,
  }));
}

async function razorpay(path, body) {
  let res, data;
  try {
    res = await fetch(RAZORPAY_API + path, {
      method: 'POST',
      headers: { Authorization: 'Basic ' + Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64'), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    data = await res.json().catch(() => ({}));
  } catch (err) { console.error('Razorpay', err.message); }
  if (!res?.ok) {
    if (res) console.error('Razorpay', res.status, data.error?.description || data);
    // 503, not 502: Cloudflare replaces a 502 from the origin with its own page, which hid this message from customers.
    throw new HttpError(503, 'The payment service is unavailable. Please try again in a moment, or contact us on WhatsApp.');
  }
  return data;
}

// Body: { customer: { name, email, phone }, account, and either
//   items, coupon, payPlan ('full' | 'milestone'), memberToken   (a cart), or
//   balanceToken                                                 (the next instalment) }
async function createOrder(body) {
  const customer = { name: str(body.customer?.name), email: str(body.customer?.email, 120), phone: str(body.customer?.phone, 20) };
  const account = str(body.account, 120).toLowerCase();
  let due, quote = null, ticket, notes;
  if (body.balanceToken) {
    const bal = unsign(body.balanceToken, 'balance');
    if (!bal?.rest.length) throw new HttpError(400, 'This instalment can’t be paid online. Please contact us to pay it.');
    due = bal.rest[0].amount;
    ticket = { first: bal.first, rest: bal.rest.slice(1) };
    notes = { type: 'instalment', instalment: bal.rest[0].label, first_order: bal.first };
  } else {
    const items = cartItems(body.items);
    if (!items) throw new HttpError(400, 'Your cart is empty.');
    // The member discount needs proof of a paid membership on this account.
    const member = unsign(body.memberToken, 'member');
    quote = priceCart(items, { catalog: CATALOG, gstPct: BUSINESS.gst, memberPlanId: member && member.email === account ? member.plan : 'free', couponCode: str(body.coupon, 40) });
    if (quote.lines.length !== items.length) throw new HttpError(400, 'Some items in your cart are no longer sold. Remove them and try again.');
    const payPlan = body.payPlan === 'milestone' && quote.milestones ? 'milestone' : 'full';
    due = amountDue(quote, payPlan);
    const plan = quote.lines.find(l => l.type === 'plan');
    ticket = {
      plan: plan && { id: plan.ref, cycle: plan.cycle === 'year' ? 'year' : 'month' },
      rest: payPlan === 'milestone' ? quote.milestones.slice(1).map(({ label, amount }) => ({ label, amount })) : [],
    };
    notes = { type: 'order', items: quote.lines.map(l => `${l.qty} × ${l.info.title}`).join('; ').slice(0, 250), pay_plan: payPlan, coupon: quote.coupon?.code };
  }
  if (!(due >= 1)) throw new HttpError(400, 'Nothing to pay.');
  const order = await razorpay('/orders', {
    amount: Math.round(due * 100), currency: 'INR',
    receipt: 'vx_' + Date.now().toString(36) + randomBytes(4).toString('hex'),
    notes: Object.fromEntries(Object.entries({ ...notes, name: customer.name, email: customer.email, phone: customer.phone, account }).filter(([, v]) => v)),
  });
  return {
    keyId: KEY_ID, orderId: order.id, amount: order.amount, currency: order.currency, due, quote,
    ticket: sign({ k: 'ticket', o: order.id, account, ...ticket, exp: Date.now() + 7 * DAY }),
  };
}

// Body: Razorpay's handler response plus the ticket from createOrder.
function verifyPayment(body) {
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = body;
  const expected = createHmac('sha256', KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
  const t = unsign(body.ticket, 'ticket');
  if (typeof orderId !== 'string' || typeof paymentId !== 'string' || !same(signature, expected) || t?.o !== orderId) {
    throw new HttpError(400, 'The payment could not be verified.');
  }
  const out = { ok: true, paymentId };
  if (t.plan) out.memberToken = sign({ k: 'member', email: t.account, plan: t.plan.id, exp: Date.now() + (t.plan.cycle === 'year' ? 372 : 38) * DAY });
  if (t.rest.length) out.balanceToken = sign({ k: 'balance', first: t.first || orderId, rest: t.rest, exp: Date.now() + 730 * DAY });
  return out;
}

// At start-up, a read-only call that tells whether Razorpay accepts the keys, so a wrong or rotated secret shows
// in the log (journalctl -u vintorex) instead of only as failed checkouts.
async function checkRazorpay() {
  try {
    const res = await fetch(RAZORPAY_API + '/orders?count=1', { headers: { Authorization: 'Basic ' + Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64') }, signal: AbortSignal.timeout(15000) });
    if (res.ok) return console.log('Razorpay accepted the API keys.');
    const data = await res.json().catch(() => ({}));
    console.error(`Razorpay REJECTED the API keys (${res.status}: ${data.error?.description || 'no detail'}). Checkout will fail until RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on this server match a key pair in the Razorpay Dashboard.`);
  } catch (err) { console.error('Razorpay could not be reached to check the keys:', err.message); }
}

const clientIp = req => req.headers['x-forwarded-for']?.split(',').pop().trim() || req.socket.remoteAddress;

// At most 30 new orders per visitor every 10 minutes.
const hits = new Map();
function rateLimit(req) {
  const ip = clientIp(req);
  const now = Date.now(), h = hits.get(ip);
  if (hits.size > 10000) hits.clear();
  if (!h || now - h.start > 10 * 60e3) hits.set(ip, { start: now, n: 1 });
  else if (++h.n > 30) throw new HttpError(429, 'Too many payment attempts. Please wait a few minutes.');
}

async function readJson(req) {
  if (!String(req.headers['content-type']).startsWith('application/json')) throw new HttpError(415, 'Expected JSON.');
  const chunks = []; let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > 32768) throw new HttpError(413, 'Request too large.');
    chunks.push(c);
  }
  let body;
  try { body = JSON.parse(Buffer.concat(chunks).toString()); } catch { throw new HttpError(400, 'Invalid JSON.'); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'Invalid request.');
  return body;
}

async function api(req, pathname) {
  if (pathname === '/api/payments' && req.method === 'GET') return PAYMENTS ? { enabled: true, keyId: KEY_ID } : { enabled: false };
  const route = { '/api/payments/order': 'order', '/api/payments/verify': 'verify' }[pathname];
  if (!route) throw new HttpError(404, 'Not found.');
  if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed.');
  if (!PAYMENTS) throw new HttpError(503, 'Online payments are not set up.');
  if (route === 'order') { rateLimit(req); return createOrder(await readJson(req)); }
  return verifyPayment(await readJson(req));
}

// Answers stream as server-sent events. Closing the tab stops the model mid-answer.
async function chatRoute(req, res) {
  if (req.method === 'GET') return send(res, 200, chatStatus());
  if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed.');
  const stop = new AbortController();
  res.on('close', () => stop.abort());
  const events = chat(await readJson(req), { ip: clientIp(req), signal: stop.signal });
  res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store, no-transform', 'X-Accel-Buffering': 'no' });
  for await (const event of events) res.write(`data: ${JSON.stringify(event)}\n\n`);
  res.end();
}

// ---------- static files ----------
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.pdf': 'application/pdf',
};

const escAttr = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// The shell's head describes the home page. For another page give it that page's own address, title and description,
// so shared links and crawlers that do not run scripts get the right ones, and keep private and missing pages out of
// search. The app does the same when it moves between pages (main.js). `path` is null for an address that is no page.
function shellFor(html, path) {
  const set = (re, value) => { html = html.replace(re, (m, before, after) => before + escAttr(value) + after); };
  if (path === null || isPrivate(path)) set(/(<meta name="robots" content=")[^"]*(")/, 'noindex, nofollow');
  if (path === null || path === '/') return html;
  const canonical = SITE + canonicalPath(path);
  set(/(<link rel="canonical" href=")[^"]*(")/, canonical);
  set(/(<link rel="alternate" hreflang="[^"]*" href=")[^"]*(")/g, canonical);
  set(/(<meta property="og:url" content=")[^"]*(")/, canonical);
  const meta = pageMeta(path, SERVICES);
  if (meta) {
    const title = `${meta.title} · ${BUSINESS.short}`;
    set(/(<title>)[^<]*(<\/title>)/, title);
    set(/(<meta property="og:title" content=")[^"]*(")/, title);
    set(/(<meta name="twitter:title" content=")[^"]*(")/, title);
    set(/(<meta property="og:description" content=")[^"]*(")/, meta.description);
    set(/(<meta name="twitter:description" content=")[^"]*(")/, meta.description);
    // The app falls back to the shared description (main.js), so keep it beside this page's own.
    html = html.replace(/<meta name="description" content="([^"]*)">/, (m, shared) => `<meta name="description" content="${escAttr(meta.description)}" data-default="${shared}">`);
  }
  return html;
}

// Pages of the app (routes.js) are answered with the app shell, so any of them can be opened, shared or reloaded at its own
// address. An address that is no page gets the shell too, with a 404 status and noindex, and the app shows its "not found"
// page. Requests for files such as scripts and images still get a plain 404.
async function serveApp(req, res, pathname, search) {
  const path = trimPath(pathname);
  const route = matchRoute(path);
  if (route && path !== pathname) { res.writeHead(301, { Location: path + search }); return res.end(); }
  const known = Boolean(route) && (route.pattern !== '/services/:id/packages' || SERVICE_IDS.has(route.params.id));
  if (!known && !(req.headers.accept || '').includes('text/html')) throw new HttpError(404, 'Not found.');
  const html = Buffer.from(shellFor(await readFile(join(DIST, 'index.html'), 'utf8'), known ? path : null));
  res.writeHead(known ? 200 : 404, {
    'Content-Type': 'text/html; charset=utf-8', 'Content-Length': html.length, 'Cache-Control': 'no-cache',
    ...(!known || isPrivate(path) ? { 'X-Robots-Tag': 'noindex, nofollow' } : {}),
  });
  res.end(req.method === 'HEAD' ? undefined : html);
}

async function serveStatic(req, res, pathname, search) {
  let rel;
  try { rel = decodeURIComponent(pathname); } catch { throw new HttpError(400, 'Bad request.'); }
  // Nothing outside dist/ and no dotfiles.
  if (rel.includes('\0') || rel.split('/').some(seg => seg.startsWith('.'))) throw new HttpError(404, 'Not found.');
  let file = join(DIST, normalize(rel));
  if (file !== DIST && !file.startsWith(DIST + sep)) throw new HttpError(404, 'Not found.');
  let info = await stat(file).catch(() => null);
  if (info?.isDirectory()) {
    if (!pathname.endsWith('/')) { res.writeHead(301, { Location: pathname + '/' + search }); return res.end(); }
    file = join(file, 'index.html');
    info = await stat(file).catch(() => null);
  }
  if (!info?.isFile()) return serveApp(req, res, pathname, search);
  const type = TYPES[extname(file).toLowerCase()] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': info.size, 'Cache-Control': type.startsWith('image/') || type.startsWith('font/') ? 'public, max-age=86400' : 'no-cache' });
  if (req.method === 'HEAD') return res.end();
  createReadStream(file).on('error', () => res.destroy()).pipe(res);
}

const send = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
};

createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
  const { pathname, search } = new URL(req.url, 'http://localhost');
  try {
    if (pathname === '/api/chat') return await chatRoute(req, res);
    if (pathname === '/api/whatsapp' || pathname.startsWith('/api/whatsapp/')) return await whatsappRoute(req, res, pathname, new URL(req.url, 'http://localhost').searchParams);
    if (pathname.startsWith('/api/')) return send(res, 200, await api(req, pathname));
    if (req.method !== 'GET' && req.method !== 'HEAD') throw new HttpError(405, 'Method not allowed.');
    await serveStatic(req, res, pathname, search);
  } catch (err) {
    if (!err.status) console.error(err);
    if (res.headersSent) return res.end();
    send(res, err.status || 500, { error: err.status ? err.message : 'Something went wrong. Please try again.' });
  }
}).listen(PORT, HOST, () => {
  if (PAYMENTS) checkRazorpay();
  const mode = PAYMENTS ? `on, ${KEY_ID.startsWith('rzp_live_') ? 'LIVE' : 'test'} key` : 'off (set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET)';
  const assistant = AI_ON ? 'on (Cloudflare Workers AI)' : 'search-only (set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN)';
  const wa = whatsappMissing();
  const whatsapp = wa.send.length ? `off (set ${wa.send.join(', ')})` : `on${wa.webhook.length ? `, webhook off (set ${wa.webhook.join(', ')})` : ''}${wa.api.length ? `, API off (set ${wa.api.join(', ')})` : ''}`;
  console.log(`Vintorex on http://localhost:${PORT} · Razorpay payments ${mode} · chat assistant ${assistant} · WhatsApp ${whatsapp}`);
});
