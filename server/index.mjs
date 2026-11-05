// Vintorex web server: serves dist/, the Razorpay payment API, the chat assistant and WhatsApp. `npm start`.
// Keys come from the host's environment, or from .env at the repo root.
//
//   GET  /api/payments         { enabled, keyId }; the app stays in demo mode without it
//   POST /api/payments/order   prices the cart (or the next instalment) and creates a Razorpay order
//   POST /api/payments/verify  checks the payment signature and returns signed tokens
//   GET  /api/chat             chat assistant status; POST streams an answer (see chat.mjs)
//   /api/whatsapp/*            WhatsApp Cloud API: webhook, send, templates, partner onboarding (see whatsapp/routes.mjs)
//
// Application records and sessions are stored in a private SQLite database.
// Payment tokens carry verified entitlements between checkout requests.
import './env.mjs';
import { offers, markOfferPaid, identity } from './offers.mjs';
import { inspectPublic, savePublic } from './public-download.mjs';
import { inspectMovie, streamMovie } from './uqload.mjs';
import { inspectYoutube, youtubeFile } from './youtube.mjs';
import { socialProfile } from './social-profile.mjs';
import { resolvePost, downloadFile } from './vintorent.mjs';
import { llmsTxt, llmsFullTxt } from '../dist/js/seo.js';
import { contentPage, sitemap } from './pages.mjs';
import * as Store from './store.mjs';
import { clientIp } from './client-ip.mjs';
import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { sendAsset } from './http-response.mjs';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BUSINESS } from '../dist/js/data.js';
import { priceCart, amountDue } from '../dist/js/pricing.js';
import { matchRoute, trimPath, isPrivate, canonicalPath, pageMeta } from '../dist/js/routes.js';
import { chat, chatStatus, AI_ON } from './chat.mjs';
import { whatsappRoute } from './whatsapp/routes.mjs';
import { trackSeo } from './seo-crawl.mjs';
import { startPublicAudit, getPublicAudit, cancelPublicAudit } from './seo-public-jobs.mjs';
import { auditPdf } from './seo-report-pdf.mjs';
import { auditSeo, seoReportHtml } from './seo-audit.mjs';
import { acceptN8n, handleMcp, integrationStatus, integrationsHtml } from './integrations/flow.mjs';
import { missing as whatsappMissing } from './whatsapp/config.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'dist');
const SITE = (process.env.SITE_URL || 'https://vintorex.com').replace(/\/$/, '');

const { RAZORPAY_KEY_ID: KEY_ID, RAZORPAY_KEY_SECRET: KEY_SECRET } = process.env;
const RAZORPAY_API = process.env.RAZORPAY_API_BASE || 'https://api.razorpay.com/v1';
const PORT = Number(process.env.PORT) || 5173;
// Set HOST=127.0.0.1 in production so only the reverse proxy / tunnel on this machine can connect.
// Unset, the server takes IPv6 and IPv4 together (Node's default); binding 0.0.0.0 alone left
// [::1]:PORT free, so another local server could answer "localhost" without /api/chat.
const HOST = process.env.HOST || undefined;
const PAYMENTS = Boolean(KEY_ID && KEY_SECRET);
// Membership/instalment tokens must use their own secret. Falling back to the Razorpay key
// couples payment rotation to every signed membership and widens blast radius if either leaks.
const TOKEN_KEY = process.env.PAYMENT_TOKEN_SECRET
  || (!PAYMENTS ? '' : (console.error('PAYMENT_TOKEN_SECRET is not set. Online payments are disabled until you add one (openssl rand -hex 32). Do not reuse RAZORPAY_KEY_SECRET.'), ''));
const PAYMENTS_READY = PAYMENTS && Boolean(TOKEN_KEY);
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
    type: str(i?.type, 20), ref: str(i?.ref, 100), tier: str(i?.tier, 150) || undefined,
    cycle: ['month', 'year'].includes(i?.cycle) ? i.cycle : undefined,
    qty: Number.isInteger(i?.qty) && i.qty > 0 && i.qty <= 20 ? i.qty : 1,
  }));
}

async function razorpay(path, body) {
  let res, data;
  try {
    res = await fetch(RAZORPAY_API + path, {
      method: body === undefined ? 'GET' : 'POST',
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
async function createOrder(body, user) {
  if (!user) throw new HttpError(401, 'Sign in before starting checkout.');
  const customer = { name: str(body.customer?.name), email: str(body.customer?.email, 120), phone: str(body.customer?.phone, 20) };
  const account = user.email.toLowerCase();
  let due, quote = null, ticket, notes;
  if (body.balanceToken) {
    const bal = unsign(body.balanceToken, 'balance');
    if (!bal?.rest.length || (bal.userId ? bal.userId !== user.id : bal.account !== undefined && bal.account !== account)) throw new HttpError(400, 'This instalment can’t be paid online. Please contact us to pay it.');
    due = bal.rest[0].amount;
    ticket = { due, userId: user.id, first: bal.first, rest: bal.rest.slice(1) };
    notes = { type: 'instalment', instalment: bal.rest[0].label, first_order: bal.first };
  } else {
    const items = cartItems(body.items);
    if (!items) throw new HttpError(400, 'Your cart is empty.');
    // The member discount needs proof of a paid membership on this account.
    const member = unsign(body.memberToken, 'member');
    quote = priceCart(items, { catalog: Store.sharedCatalog(), gstPct: Store.sharedSettings().gst, memberPlanId: user.plan || (member && member.email === account ? member.plan : 'free'), couponCode: str(body.coupon, 100) });
    if (quote.lines.length !== items.length) throw new HttpError(400, 'Some items in your cart are no longer sold. Remove them and try again.');
    const payPlan = body.payPlan === 'milestone' && quote.milestones ? 'milestone' : 'full';
    due = amountDue(quote, payPlan);
    const plan = quote.lines.find(l => l.type === 'plan');
    ticket = {
      quote, items, payPlan, due, userId: user.id,
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
async function verifyPayment(body) {
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = body;
  const expected = createHmac('sha256', KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
  const t = unsign(body.ticket, 'ticket');
  if (typeof orderId !== 'string' || typeof paymentId !== 'string' || !same(signature, expected) || t?.o !== orderId) {
    throw new HttpError(400, 'The payment could not be verified.');
  }
  // A replay of the same proof must yield the same entitlement expiry.
  const issued = t.exp - 7 * DAY;
  const out = { ok: true, paymentId };
  if (t.plan) out.memberToken = sign({ k: 'member', email: t.account, plan: t.plan.id, exp: issued + (t.plan.cycle === 'year' ? 372 : 38) * DAY });
  if (t.rest.length) out.balanceToken = sign({ k: 'balance', userId: t.userId, account: t.account, first: t.first || orderId, rest: t.rest, exp: issued + 730 * DAY });
  if (t.offerUid) {
    const order = await razorpay('/orders/' + encodeURIComponent(orderId));
    if (order.status !== 'paid') throw new HttpError(409, 'Payment is processing. Return to your saved offer to check its status.');
    await markOfferPaid(t.offerUid, orderId);
  }
  if (!t.offerUid) Store.paymentReceipt(paymentId, { userId: t.userId, account: t.account, orderId, first: t.first, quote: t.quote, items: t.items, payPlan: t.payPlan, due: t.due, memberToken: out.memberToken, balanceToken: out.balanceToken });
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

// At most 30 new orders per visitor every 10 minutes.
const hits = new Map();
function rateLimit(req, group = 'payments', maximum = 30) {
  const ip = group + ':' + clientIp(req);
  const now = Date.now(), h = hits.get(ip);
  if (hits.size > 10000) hits.clear();
  if (!h || now - h.start > 10 * 60e3) hits.set(ip, { start: now, n: 1 });
  else if (++h.n > maximum) throw new HttpError(429, 'Too many requests. Please wait a few minutes.');
}

async function readRaw(req, limit) {
  const chunks = []; let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > limit) throw new HttpError(413, 'Request too large.');
    chunks.push(c);
  }
  return Buffer.concat(chunks);
}
async function readJson(req) {
  if (!String(req.headers['content-type']).startsWith('application/json')) throw new HttpError(415, 'Expected JSON.');
  const chunks = []; let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > (req.url.startsWith('/api/store') ? 2097152 : 32768)) throw new HttpError(413, 'Request too large.');
    chunks.push(c);
  }
  let body;
  try { body = JSON.parse(Buffer.concat(chunks).toString()); } catch { throw new HttpError(400, 'Invalid JSON.'); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'Invalid request.');
  return body;
}

async function api(req, pathname) {
  if (pathname === '/api/payments' && req.method === 'GET') return PAYMENTS_READY ? { enabled: true, keyId: KEY_ID } : { enabled: false };
  const route = { '/api/payments/order': 'order', '/api/payments/verify': 'verify' }[pathname];
  if (!route) throw new HttpError(404, 'Not found.');
  if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed.');
  if (!PAYMENTS_READY) throw new HttpError(503, 'Online payments are not set up.');
  if (route === 'order') { rateLimit(req); return createOrder(await readJson(req), Store.sessionUser(req)); }
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
  if (path === '/') return html;
  html = html.replace(/<!-- seo-noscript -->[\s\S]*?<!-- \/seo-noscript -->/, '');
  if (path === null) return html.replace(/<title>[^<]*<\/title>/, '<title>Page not found · Vintorex</title>');
  const canonical = SITE + canonicalPath(path);
  set(/(<link rel="canonical" href=")[^"]*(")/, canonical);
  set(/(<link rel="alternate" hreflang="[^"]*" href=")[^"]*(")/g, canonical);
  set(/(<meta property="og:url" content=")[^"]*(")/, canonical);
  const meta = pageMeta(path, Store.sharedCatalog().services);
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
  html = html.replace(/<h1 class="boot-tag">[^<]*<\/h1>/, () => meta ? '<h1 class="boot-tag">' + escAttr(meta.title) + '</h1>' : '<p class="boot-tag">Digital Solutions</p>');
  if (meta && !isPrivate(path)) {
    html = html.replace('<div id="toasts"', () => '<noscript><main><p>' + escAttr(meta.description) + '</p><a href="/services/">Browse services and prices</a></main></noscript><div id="toasts"');
  }
  return html;
}

function taggedHtml(html) {
  const hosts = {
    'script-src': ['https://www.googletagmanager.com'],
    'img-src': ['https://*.google-analytics.com', 'https://www.googletagmanager.com'],
    'connect-src': ['https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://www.googletagmanager.com'],
  };
  html = html.replace(/(<meta http-equiv="Content-Security-Policy" content=")([^"]+)/i, (_, prefix, policy) =>
    prefix + policy.split(';').map(directive => {
      const sources = directive.trim().split(/\s+/);
      for (const host of hosts[sources[0]] || []) if (!sources.includes(host)) sources.push(host);
      return sources.join(' ');
    }).join('; '));
  return Buffer.from(html.replace('</head>', '<!-- Google tag (gtag.js) -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=G-J1MD2VBT33"></script>\n<script src="/js/google-tag.js"></script>\n</head>'));
}

async function serveApp(req, res, pathname, search) {
  const path = trimPath(pathname);
  const route = matchRoute(path);
  if (route && path !== pathname) { res.writeHead(301, { Location: path + search }); return res.end(); }
  const known = Boolean(route) && (!route.pattern.startsWith('/services/:id') || Store.sharedCatalog().services.some(s => s.id === route.params.id));
  if (!known && !(req.headers.accept || '').includes('text/html')) throw new HttpError(404, 'Not found.');
  const shell = shellFor(await readFile(join(DIST, 'index.html'), 'utf8'), known ? path : null);
  const html = known && !isPrivate(path) ? taggedHtml(shell) : Buffer.from(shell);
  sendAsset(req, res, known ? 200 : 404, {
    'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache',
    ...(!known || isPrivate(path) ? { 'X-Robots-Tag': 'noindex, nofollow' } : {}),
  }, html.length, () => Readable.from([html]));
}

// Pages of the app (routes.js) are answered with the app shell, so any of them can be opened, shared or reloaded at its own
// address. An address that is no page gets the shell too, with a 404 status and noindex, and the app shows its "not found"
// page. Requests for files such as scripts and images still get a plain 404.
async function serveStatic(req, res, pathname, search) {
  if (pathname === '/llms.txt' || pathname === '/llms-full.txt') {
    const { state } = Store.readStore();
    const services = state.catalog.services;
    const summary = pathname === '/llms-full.txt' ? llmsFullTxt(SITE, services)
      : llmsTxt(SITE, services, state.posts.filter(p => p.published !== false));
    const body = Buffer.from(summary);
    return sendAsset(req, res, 200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' }, body.length, () => Readable.from([body]));
  }
  if (pathname === '/sitemap.xml') {
    const xml = Buffer.from(await sitemap(SITE, join(DIST, 'sitemap.xml')));
    return sendAsset(req, res, 200, { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'no-cache' }, xml.length, () => Readable.from([xml]));
  }
  const content = await contentPage(pathname, SITE, join(DIST, 'index.html'));
  if (content) {
    const html = content.status === 200 ? taggedHtml(content.html) : Buffer.from(content.html);
    return sendAsset(req, res, content.status, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' }, html.length, () => Readable.from([html]));
  }
  if (/^\/services\/[^/]+\/?$/.test(pathname)) return serveApp(req, res, pathname, search);
  if (['/instagram-downloader', '/instagram-downloader/', '/instagram-downloader/index.html', '/vintorent/', '/vintorent/index.html'].includes(pathname)) {
    res.writeHead(301, { Location: '/vintorent' + search });
    return res.end();
  }
  if (pathname === '/vintorent') pathname = '/vintorent/index.html';
  if (pathname === '/offer/' || pathname === '/offer/index.html') {
    res.writeHead(301, { Location: '/offer' + search });
    return res.end();
  }
  if (pathname === '/offer') pathname = '/offer/index.html';
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
  if (type.startsWith('text/html')) {
    const html = taggedHtml(await readFile(file, 'utf8'));
    return sendAsset(req, res, 200, { 'Content-Type': type, 'Cache-Control': 'no-cache' }, html.length, () => Readable.from([html]));
  }
  sendAsset(req, res, 200, {
    'Content-Type': type,
    'Cache-Control': type.startsWith('image/') || type.startsWith('font/') ? 'public, max-age=86400' : 'no-cache',
    ETag: `W/"${info.size}-${info.mtimeMs}"`,
  }, info.size, () => createReadStream(file));
}

const send = (res, status, body) => {
  const payload = Buffer.from(JSON.stringify(body));
  sendAsset(res.req, res, status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, payload.length, () => Readable.from([payload]));
};

createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
  try {
    if (!req.url.startsWith('/') || req.url.startsWith('//')) throw new HttpError(400, 'Invalid request target.');
    const url = new URL(req.url, 'http://localhost');
    const { pathname, search } = url;
    if (pathname === '/api/vintorent/public') {
      rateLimit(req,'public-download',40);
      if (req.method === 'POST') return send(res,200,await inspectPublic((await readJson(req))?.url));
      if (req.method === 'GET') return await savePublic(url.searchParams.get('url'),req,res);
      throw new HttpError(405,'Method not allowed.');
    }
    if (pathname === '/api/vintorent/source') {
      if (req.method !== 'POST') throw new HttpError(405,'Method not allowed.');
      rateLimit(req,'source-inspect',12);
      return send(res,200,await inspectMovie((await readJson(req))?.url));
    }
    if (pathname.startsWith('/api/vintorent/source/')) {
      if (req.method !== 'GET') throw new HttpError(405,'Method not allowed.');
      rateLimit(req,'source-download',20);
      return await streamMovie(pathname.slice('/api/vintorent/source/'.length),req,res);
    }
    if (pathname === '/api/vintorent/youtube') {
      if (req.method !== 'POST') throw new HttpError(405,'Method not allowed.');
      rateLimit(req,'youtube-inspect',12);
      return send(res,200,await inspectYoutube((await readJson(req))?.url));
    }
    if (pathname.startsWith('/api/vintorent/youtube/')) {
      if (req.method !== 'GET') throw new HttpError(405,'Method not allowed.');
      rateLimit(req,'youtube-download',10);
      const [,id,quality] = pathname.match(/^\/api\/vintorent\/youtube\/([\w-]+)\/(\w+)$/) || [];
      if (!id) throw new HttpError(400,'Invalid download link.');
      return await youtubeFile(id,quality,res);
    }
    if (pathname === '/api/vintorent/profile') {
      if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed.');
      rateLimit(req, 'social-profile', 60);
      const {url, list, cursor} = await readJson(req);
      return send(res, 200, await socialProfile(url, list, cursor));
    }
    if (pathname === '/api/vintorent') {
      if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed.');
      rateLimit(req, 'vintorent', 20);
      return send(res, 200, await resolvePost((await readJson(req))?.url));
    }
    if (pathname.startsWith('/api/vintorent/file/')) {
      if (req.method !== 'GET') throw new HttpError(405, 'Method not allowed.');
      rateLimit(req, 'vintorent-files', 60);
      return await downloadFile(pathname.slice('/api/vintorent/file/'.length), res);
    }
    if (pathname.startsWith('/api/auth/')) return send(res, 200, await Store.authRoute(req, res, pathname.slice(10), req.method === 'GET' ? {} : await readJson(req), { limit: req => rateLimit(req, 'auth', 20), firebaseIdentity: identity }));
    if (pathname === '/api/store') {
      if (req.method === 'GET') return send(res, 200, Store.snapshot(Store.sessionUser(req)));
      if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed.');
      rateLimit(req, 'records', Store.sessionUser(req)?.role === 'admin' ? 300 : 40);
      return send(res, 200, Store.commitChanges(req, await readJson(req)));
    }
    if (pathname === '/api/store/checkout') {
      if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed.');
      rateLimit(req);
      return send(res, 200, Store.checkout(req, await readJson(req), { priceCart,
        demo: process.env.ALLOW_DEMO_CHECKOUT === '1' && ['localhost', '127.0.0.1', '[::1]'].includes(new URL('http://' + req.headers.host).hostname) && ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress) }));
    }
    if (pathname.startsWith('/api/offers/')) return send(res, 200, await offers(req, pathname, {readJson, razorpay, sign, keyId:KEY_ID, payments:PAYMENTS_READY, limit:rateLimit}));
    if (pathname === '/api/chat') return await chatRoute(req, res);
    if (pathname === '/api/whatsapp' || pathname.startsWith('/api/whatsapp/')) return await whatsappRoute(req, res, pathname, url.searchParams);
    if (pathname === '/api/seo/audits') {
      if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed.');
      Store.checkMutation(req);
      rateLimit(req, 'public-seo-start', 4);
      return send(res, 202, await startPublicAudit(await readJson(req)));
    }
    if (/^\/api\/seo\/audits\/[a-f0-9]{40}\/cancel$/.test(pathname)) {
      if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed.');
      Store.checkMutation(req);
      rateLimit(req, 'public-seo-cancel', 30);
      return send(res, 200, cancelPublicAudit(pathname.split('/')[4]));
    }
    if (pathname.startsWith('/api/seo/audits/')) {
      if (req.method !== 'GET' && req.method !== 'HEAD') throw new HttpError(405, 'Method not allowed.');
      const match = pathname.match(/^\/api\/seo\/audits\/([a-f0-9]{40})(\/report\.pdf)?$/);
      if (!match) throw new HttpError(404, 'Report not found.');
      const job = getPublicAudit(match[1]);
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      if (!match[2]) return send(res, 200, job);
      rateLimit(req, 'public-seo-pdf', 20);
      if (job.status !== 'complete') throw new HttpError(409, 'The report is still being prepared.');
      const pdf = await auditPdf(job.report);
      res.writeHead(200, { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="vintorex-seo-audit-' + job.id.slice(0, 8) + '.pdf"', 'Content-Length': pdf.length, 'Cache-Control': 'no-store' });
      return res.end(req.method === 'HEAD' ? undefined : pdf);
    }
    if (pathname === '/api/seo') {
      if (req.method !== 'GET') throw new HttpError(405, 'Method not allowed.');
      return send(res, 200, auditSeo(DIST));
    }
    if (pathname === '/api/mcp') {
      if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed.');
      rateLimit(req, 'mcp', 60);
      const out = await handleMcp(req, await readJson(req));
      if (!out) { res.writeHead(202); return res.end(); }
      return send(res, 200, out);
    }
    if (pathname === '/api/integrations/n8n') {
      if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed.');
      rateLimit(req, 'n8n', 60);
      const raw = await readRaw(req, 1 << 20);
      return send(res, 200, acceptN8n(raw, req.headers['x-vintorex-signature']));
    }
    if (pathname === '/api/integrations') {
      if (req.method !== 'GET') throw new HttpError(405, 'Method not allowed.');
      return send(res, 200, integrationStatus());
    }
    if (pathname.startsWith('/api/')) return send(res, 200, await api(req, pathname));
    if (pathname === '/seo-audit/') { res.writeHead(301, { Location: '/seo-audit' + search }); return res.end(); }
    if (pathname === '/integrations/' ) { res.writeHead(301, { Location: '/integrations' + search }); return res.end(); }
    if (pathname === '/integrations') {
      if (req.method !== 'GET' && req.method !== 'HEAD') throw new HttpError(405, 'Method not allowed.');
      const html = Buffer.from(integrationsHtml());
      return sendAsset(req, res, 200, {
        'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow',
      }, html.length, () => Readable.from([html]));
    }
    if (pathname === '/seo-audit') {
      if (req.method !== 'GET' && req.method !== 'HEAD') throw new HttpError(405, 'Method not allowed.');
      const html = taggedHtml(seoReportHtml());
      return sendAsset(req, res, 200, {
        'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow',
      }, html.length, () => Readable.from([html]));
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') throw new HttpError(405, 'Method not allowed.');
    await serveStatic(req, res, pathname, search);
  } catch (err) {
    if (!err.status) console.error(err);
    if (res.headersSent) return res.end();
    send(res, err.status || 500, { error: err.status ? err.message : 'Something went wrong. Please try again.' });
  }
}).on('error', err => {
  if (err.code !== 'EADDRINUSE') throw err;
  console.error(`Port ${PORT} is already in use, so this server did not start: another process, probably an old copy of this server, is listening there. Find it with: sudo ss -ltnp | grep ${PORT}`);
  process.exit(1);
}).listen(PORT, HOST, () => {
  trackSeo(SITE);
  if (PAYMENTS_READY) checkRazorpay();
  const mode = PAYMENTS_READY ? `on, ${KEY_ID.startsWith('rzp_live_') ? 'LIVE' : 'test'} key`
    : PAYMENTS ? 'off (set PAYMENT_TOKEN_SECRET — openssl rand -hex 32)'
    : 'off (set RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET and PAYMENT_TOKEN_SECRET)';
  const assistant = AI_ON ? 'on (Cloudflare Workers AI)' : 'search-only (set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN)';
  const wa = whatsappMissing();
  const whatsapp = wa.send.length ? `off (set ${wa.send.join(', ')})` : `on${wa.webhook.length ? `, webhook off (set ${wa.webhook.join(', ')})` : ''}${wa.api.length ? `, API off (set ${wa.api.join(', ')})` : ''}`;
  const links = integrationStatus().configured;
  const integrations = links.mcpKey ? 'MCP on' : 'MCP off (set INTEGRATIONS_API_KEY)';
  console.log(`Vintorex on http://localhost:${PORT} · Razorpay payments ${mode} · chat assistant ${assistant} · WhatsApp ${whatsapp} · integrations ${integrations}${links.n8nWebhook ? ', n8n on' : ''}`);
});
