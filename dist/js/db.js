// Browser-side data store. Everything lives in localStorage so the app runs on
// static hosting; swap these functions for API calls when a backend is added.
import { SERVICES, PLANS, ADDONS, PRODUCTS, COUPONS, BUSINESS, ANNUAL_MONTHS_PAID, CATALOG_VERSION } from './data.js';
import { milestoneSchedule, lineInfo as priceLine, priceCart } from './pricing.js';
export { milestoneSchedule };

const KEY = 'vx_db_v1';
const SESSION = 'vx_session';
const CART = 'vx_cart';

const safe = (fn, fallback) => { try { return fn(); } catch { return fallback; } };
export const uid = (p = '') => p + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
const daysAgo = (d, h = 10) => { const t = new Date(); t.setDate(t.getDate() - d); t.setHours(h, 0, 0, 0); return t.toISOString(); };
// Demo CRM seed and simulated checkout stay on loopback only. Live hosts fail closed.
export const isLocalHost = () => /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.hostname.endsWith('.local');

// Passwords are stored as PBKDF2-SHA256 with a per-user salt ("pbkdf2$iterations$salt$hash").
// Older accounts keep the plain SHA-256 form until their next successful sign-in upgrades it.
const PBKDF2_ITER = 150000;
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
// Admin password (PBKDF2 hash only; never commit the plain text).
const ADMIN_PASS = 'pbkdf2$150000$933421b9b953043691dbfc77927938ae$a054744ede21b5b0a217413922ea83cf9add611bdf22eff65c10ade0da2cc34d';

async function legacyHash(text) {
  return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('vx:' + text)));
}
export async function hash(text, salt = hex(crypto.getRandomValues(new Uint8Array(16))), iter = PBKDF2_ITER) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(text), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: iter }, key, 256);
  return `pbkdf2$${iter}$${salt}$${hex(bits)}`;
}
async function verify(text, stored = '') {
  if (!stored.startsWith('pbkdf2$')) return stored === await legacyHash(text);
  const [, iter, salt] = stored.split('$');
  return stored === await hash(text, salt, Number(iter));
}

let state = null;
let sessionUser = null;

export function db() {
  if (!state) state = safe(() => JSON.parse(localStorage.getItem(KEY)), null);
  return state;
}
export function save() { safe(() => localStorage.setItem(KEY, JSON.stringify(state))); }

async function sessionToken(userId, pass, salt) {
  return legacyHash(`${userId}|${pass || ''}|${salt}`);
}
function clearSession() {
  sessionUser = null;
  safe(() => localStorage.removeItem(SESSION));
}
async function openSession(u) {
  const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
  const token = await sessionToken(u.id, u.pass, salt);
  sessionUser = u;
  safe(() => localStorage.setItem(SESSION, JSON.stringify({ id: u.id, salt, token })));
  return u;
}
async function restoreSession() {
  const raw = safe(() => JSON.parse(localStorage.getItem(SESSION)), null);
  // Drop the old plain user-id session format (it allowed setting vx_session=u_admin).
  if (!raw || typeof raw !== 'object' || !raw.id || !raw.salt || !raw.token) { clearSession(); return; }
  const u = db()?.users?.find(x => x.id === raw.id);
  if (!u || u.status === 'Blocked') { clearSession(); return; }
  if (await sessionToken(u.id, u.pass, raw.salt) !== raw.token) { clearSession(); return; }
  sessionUser = u;
}

export async function init() {
  if (!db()) { state = await seed(); save(); }
  else if (state.catalogVersion !== CATALOG_VERSION) { refreshCatalog(state); save(); }
  await restoreSession();
}
// Replace services, add-ons and plans with the shipped catalog; new downloads are merged in,
// coupons and all customer data are kept.
function refreshCatalog(s) {
  const clone = x => JSON.parse(JSON.stringify(x));
  Object.assign(s.catalog, { services: clone(SERVICES), addons: clone(ADDONS), plans: clone(PLANS) });
  // Keep admin price edits. Drop the old svg flag so every download uses its photograph.
  const kept = (s.catalog.products || []).map(({ img, ...p }) => p);
  const have = new Set(kept.map(p => p.id));
  s.catalog.products = [...kept, ...clone(PRODUCTS).filter(p => !have.has(p.id))];
  // Retire the published demo admin password in browsers that already stored the old data.
  const admin = (s.users || []).find(u => u.id === 'u_admin');
  if (admin) admin.pass = ADMIN_PASS;
  // Live hosts: drop seeded demo CRM that older builds put in every visitor's browser.
  if (!isLocalHost()) {
    const demoIds = new Set(['u_demo', 'u_kailash', 'u_yamuna', 'u_arjun', 'u_divya']);
    s.users = (s.users || []).filter(u => !demoIds.has(u.id));
    s.orders = (s.orders || []).filter(o => !String(o.id || '').startsWith('o_seed'));
    s.subscriptions = (s.subscriptions || []).filter(sub => !demoIds.has(sub.customerId));
    s.leads = (s.leads || []).filter(l => !demoIds.has(l.customerId) && !['demo@vintorex.com', 'kailash@idolworld.in', 'yamuna@emsolutions.in', 'arjun@kovaicafe.in', 'divya@glowclinic.in'].includes(String(l.email || '').toLowerCase()));
    s.tickets = (s.tickets || []).filter(t => !demoIds.has(t.customerId));
  }
  s.catalogVersion = CATALOG_VERSION;
}
export async function resetDemo() { state = await seed(); save(); setCart([]); }

// ---------- catalog ----------
export const catalog = () => db().catalog;
export const service = id => catalog().services.find(s => s.id === id);
export const plan = id => catalog().plans.find(p => p.id === id);
export const addon = id => catalog().addons.find(a => a.id === id);
export const product = id => catalog().products.find(p => p.id === id);
export const addonsFor = serviceId => catalog().addons.filter(a => !a.for?.length || a.for.includes(serviceId));

// Combined list price of everything a membership bundles.
export function planValue(p) {
  const tiers = (p.includes || []).map(i => { const [sid, t] = i.split(':'); return service(sid)?.tiers.find(x => x.name === t)?.price || 0; });
  const extras = (p.extras || []).map(a => addon(a)?.price || 0);
  return [...tiers, ...extras].reduce((s, v) => s + v, 0);
}

// Cost split of a tier in rupees; the last component absorbs rounding.
export function splitFor(s, tierIndex) {
  const price = s.tiers[tierIndex].price;
  const rows = s.split.map(r => ({ label: r[0], pct: r[tierIndex + 1] })).filter(r => r.pct > 0);
  let left = price;
  rows.forEach((r, i) => { r.amount = i === rows.length - 1 ? left : Math.round(price * r.pct / 100); left -= r.amount; });
  return rows;
}

// ---------- auth ----------
export const currentUser = () => sessionUser;
export async function login(email, password) {
  const u = db().users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!u || !await verify(password, u.pass)) throw new Error('Email or password is incorrect.');
  if (!u.pass.startsWith('pbkdf2$')) { u.pass = await hash(password); save(); }
  if (u.status === 'Blocked') throw new Error('This account is blocked. Contact support.');
  return openSession(u);
}
export function logout() { clearSession(); }
const findUser = email => db().users.find(u => u.email.toLowerCase() === String(email).trim().toLowerCase());
export const userByEmail = findUser;
// True when the password matches the one stored in this browser (accounts made before Firebase Auth).
export async function checkPassword(email, password) {
  const u = findUser(email);
  return Boolean(u && await verify(password, u.pass));
}
function createCustomer({ name, email, phone, company, pass }) {
  const d = db();
  const u = { id: uid('u_'), role: 'customer', name: name.trim(), email: email.trim(), phone, company, pass, plan: 'free', status: 'Active', createdAt: new Date().toISOString(), tags: [] };
  d.users.push(u);
  // every signup lands in the CRM as a lead too
  addLead({ name: u.name, email: u.email, phone, company, source: 'Website form', service: '', message: 'Created a customer account', stage: 'Qualified', customerId: u.id }, false);
  logActivity(`New customer signup: ${u.name}`);
  return u;
}
// Signs in the customer record for an email that Firebase has just authenticated, creating it on first use.
// Their password lives with Firebase, so none is kept here. The admin account is never reached this way.
export async function adoptUser({ name, email, phone, company }) {
  let u = findUser(email);
  if (u?.role === 'admin') throw new Error('Use the admin sign-in for this account.');
  if (u?.status === 'Blocked') throw new Error('This account is blocked. Contact support.');
  if (!u) u = createCustomer({ name: name || String(email).split('@')[0], email, phone, company, pass: '' });
  else if (!u.pass.startsWith('pbkdf2$')) u.pass = '';
  save();
  return openSession(u);
}
// Re-bind the signed-in session after admin creates a customer (register() would otherwise steal the session).
export async function resumeSession(userId) {
  const u = db().users.find(x => x.id === userId);
  if (!u) { clearSession(); return null; }
  return openSession(u);
}
// Local-only sign-up, used when Firebase is unavailable.
export async function register({ name, email, phone, company, password }) {
  if (findUser(email)) throw new Error('An account with this email already exists.');
  const u = createCustomer({ name, email, phone, company, pass: await hash(password) });
  save();
  return openSession(u);
}
export async function changePassword(user, next) {
  user.pass = await hash(next);
  save();
  // Re-bind the session to the new password hash so a stolen old token cannot stay signed in.
  if (sessionUser?.id === user.id) await openSession(user);
}

// ---------- cart ----------
export const getCart = () => safe(() => JSON.parse(localStorage.getItem(CART)) || [], []);
export const setCart = items => { safe(() => localStorage.setItem(CART, JSON.stringify(items))); document.dispatchEvent(new Event('cart')); };
export function addToCart(item) {
  const cart = getCart();
  if (item.type === 'plan') {
    const rest = cart.filter(i => i.type !== 'plan');
    setCart([...rest, item]);
    return;
  }
  const same = cart.find(i => i.type === item.type && i.ref === item.ref && i.tier === item.tier);
  if (same) {
    if (item.type === 'product') return; // digital downloads are one per order
    same.qty += 1;
  } else cart.push({ qty: 1, ...item });
  setCart(cart);
}

// Resolve a cart line into display info and a price.
export const lineInfo = item => priceLine(item, catalog());

// Totals with member discount on one-time services, optional coupon and GST.
export const quote = (items, user, couponCode) => priceCart(items, { catalog: catalog(), gstPct: db().settings.gst, memberPlanId: user?.plan, couponCode });

// ---------- orders & subscriptions ----------
const nextInvoice = () => { const d = db(); d.counters.invoice += 1; return `VX-${new Date().getFullYear()}-${String(d.counters.invoice).padStart(4, '0')}`; };

// A paid online order passes the server's quote, the Razorpay payment id and the
// server-signed tokens for the membership discount and later instalments.
export function placeOrder(user, items, couponCode, method, payPlan = 'full', { priced, paymentId, memberToken, balanceToken } = {}) {
  const d = db();
  const q = priced || quote(items, user, couponCode);
  if (!q.lines.length) throw new Error('Your cart is empty.');
  const now = new Date().toISOString();
  const payments = payPlan === 'milestone' && q.milestones
    ? q.milestones.map((m, i) => ({ label: m.label, amount: m.amount, paid: i === 0, paidAt: i === 0 ? now : null, method: i === 0 ? method : null }))
    : [{ label: 'Full payment', amount: q.total, paid: true, paidAt: now, method }];
  if (paymentId) payments[0].ref = paymentId;
  const order = {
    id: uid('o_'), invoice: nextInvoice(), customerId: user.id, createdAt: now,
    status: 'Pending', paid: payments.every(p => p.paid), method, payments,
    items: q.lines.map(l => ({ type: l.type, ref: l.ref, tier: l.tier, cycle: l.cycle, qty: l.qty, title: l.info.title, unit: l.info.unit, billing: l.info.billing, total: l.total, progress: l.type === 'product' ? 100 : 0 })),
    subtotal: q.subtotal, discount: q.memberOff + q.couponOff, coupon: q.coupon?.code || null, gst: q.gst, total: q.total,
  };
  if (balanceToken) order.balanceToken = balanceToken;
  if (order.items.every(i => i.type === 'product')) order.status = 'Delivered';
  d.orders.unshift(order);
  for (const i of order.items) {
    if (i.type === 'plan') {
      d.subscriptions.filter(s => s.customerId === user.id && s.status === 'Active').forEach(s => { s.status = 'Replaced'; });
      d.subscriptions.unshift({ id: uid('s_'), customerId: user.id, plan: i.ref, cycle: i.cycle || 'month', status: 'Active', startedAt: order.createdAt, renewsAt: addMonths(order.createdAt, i.cycle === 'year' ? 12 : 1), addons: [], orderId: order.id });
      user.plan = i.ref;
      if (memberToken) user.memberToken = memberToken;
    } else if (i.type === 'package' && i.billing === 'month') {
      d.subscriptions.unshift({ id: uid('s_'), customerId: user.id, service: i.ref, tier: i.tier, cycle: 'month', status: 'Active', startedAt: order.createdAt, renewsAt: addMonths(order.createdAt, 1), addons: [], orderId: order.id });
    } else if (i.type === 'addon' && i.billing === 'month') {
      const sub = activeMembership(user.id);
      if (sub && !sub.addons.includes(i.ref)) sub.addons.push(i.ref);
    }
  }
  // close the loop in the CRM
  const lead = d.leads.find(l => l.customerId === user.id || l.email.toLowerCase() === user.email.toLowerCase());
  if (lead) { lead.stage = 'Won'; lead.customerId = user.id; lead.value = (lead.value || 0) + order.total; lead.notes.unshift({ at: order.createdAt, by: 'System', text: `Placed order ${order.invoice} (${inr(order.total)})` }); }
  logActivity(`${user.name} placed ${order.invoice} for ${inr(order.total)}`);
  save();
  return order;
}

// Orders placed before milestone payments existed were paid in full.
export const orderPayments = o => o.payments || [{ label: 'Full payment', amount: o.total, paid: o.paid !== false, paidAt: o.createdAt, method: o.method }];
export const orderPaid = o => orderPayments(o).filter(p => p.paid).reduce((s, p) => s + p.amount, 0);
export const orderBalance = o => o.total - orderPaid(o);

export function payNext(order, method, by, { paymentId, balanceToken } = {}) {
  const next = orderPayments(order).find(p => !p.paid);
  if (!next) return null;
  if (!order.payments) order.payments = orderPayments(order);
  Object.assign(next, { paid: true, paidAt: new Date().toISOString(), method }, paymentId && { ref: paymentId });
  if (paymentId) { if (balanceToken) order.balanceToken = balanceToken; else delete order.balanceToken; }
  order.paid = order.payments.every(p => p.paid);
  logActivity(`${order.invoice}: ${next.label} of ${inr(next.amount)} ${by ? 'recorded by ' + by : 'paid'}`);
  save();
  return next;
}

export const activeMembership =customerId => db().subscriptions.find(s => s.customerId === customerId && s.plan && ['Active', 'Paused'].includes(s.status));

export function subscriptionMonthly(s) {
  if (s.plan) {
    const p = plan(s.plan); const base = p ? (s.cycle === 'year' ? p.price * ANNUAL_MONTHS_PAID / 12 : p.price) : 0;
    return Math.round(base + s.addons.reduce((sum, a) => sum + (addon(a)?.price || 0), 0));
  }
  return service(s.service)?.tiers.find(t => t.name === s.tier)?.price || 0;
}
export const subscriptionTitle = s => s.plan ? `${plan(s.plan)?.name || s.plan} membership` : `${service(s.service)?.name || s.service} — ${s.tier}`;

function addMonths(iso, n) { const d = new Date(iso); d.setMonth(d.getMonth() + n); return d.toISOString(); }

// ---------- leads ----------
export function scoreLead(l) {
  let s = 10;
  if (l.phone) s += 15;
  if (l.company) s += 10;
  if (l.service) s += 15;
  if (l.message && l.message.length > 30) s += 10;
  const b = Number(l.budget) || 0;
  s += b >= 100000 ? 30 : b >= 30000 ? 20 : b >= 10000 ? 10 : 0;
  if (['Referral', 'Walk-in', 'Free audit'].includes(l.source)) s += 10;
  return Math.min(100, s);
}
export function addLead(data, persist = true) {
  const d = db();
  const lead = { id: uid('l_'), stage: 'New', owner: 'Ranjith Kumar', value: Number(data.budget) || 0, createdAt: new Date().toISOString(), notes: [], followUp: null, ...data };
  lead.score = scoreLead(lead);
  d.leads.unshift(lead);
  logActivity(`New lead from ${lead.source}: ${lead.name}`);
  if (persist) save();
  return lead;
}

// ---------- tickets ----------
export function openTicket(user, subject, body, orderId) {
  const t = { id: uid('t_'), number: ++db().counters.ticket, customerId: user.id, subject, orderId: orderId || null, status: 'Open', priority: 'Normal', createdAt: new Date().toISOString(), messages: [{ at: new Date().toISOString(), from: user.name, staff: false, text: body }] };
  db().tickets.unshift(t);
  logActivity(`Ticket #${t.number} opened by ${user.name}`);
  save();
  return t;
}

export function logActivity(text) { db().activity.unshift({ at: new Date().toISOString(), text }); db().activity.length = Math.min(db().activity.length, 200); }

export const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');

// ---------- seed ----------
async function seed() {
  const clone = x => JSON.parse(JSON.stringify(x));
  const admin = { id: 'u_admin', role: 'admin', name: 'Ranjith Kumar', email: 'admin@vintorex.com', phone: BUSINESS.phone, pass: ADMIN_PASS, status: 'Active', createdAt: daysAgo(400), tags: [] };
  // Live hosts get a clean catalog only — no demo customers, leads, phones or password hashes for visitors.
  if (!isLocalHost()) {
    return {
      version: 1, catalogVersion: CATALOG_VERSION,
      settings: { gst: BUSINESS.gst, businessName: BUSINESS.name, email: BUSINESS.email, phone: BUSINESS.phone, gstin: '', address: BUSINESS.address },
      counters: { invoice: 0, ticket: 1000 },
      catalog: { services: clone(SERVICES), plans: clone(PLANS), addons: clone(ADDONS), products: clone(PRODUCTS), coupons: clone(COUPONS).map(c => ({ ...c, active: true })) },
      users: [admin], orders: [], subscriptions: [], leads: [], tickets: [], activity: [],
    };
  }
  const users = [
    admin,
    { id: 'u_demo', role: 'customer', name: 'Siva Prakash', email: 'demo@vintorex.com', phone: '+91 98430 11223', company: 'Prakash Textiles', pass: await legacyHash('demo123'), plan: 'premium', status: 'Active', createdAt: daysAgo(150), tags: ['Retail'] },
    { id: 'u_kailash', role: 'customer', name: 'Kailash', email: 'kailash@idolworld.in', phone: '+91 94422 55110', company: 'The World of Idols', pass: await legacyHash('demo123'), plan: 'elite', status: 'Active', createdAt: daysAgo(170), tags: ['E-commerce'] },
    { id: 'u_yamuna', role: 'customer', name: 'Yamuna', email: 'yamuna@emsolutions.in', phone: '+91 99940 33442', company: 'Electrical & Mechanical Solutions', pass: await legacyHash('demo123'), plan: 'free', status: 'Active', createdAt: daysAgo(120), tags: ['Industrial'] },
    { id: 'u_arjun', role: 'customer', name: 'Arjun Menon', email: 'arjun@kovaicafe.in', phone: '+91 90030 77881', company: 'Kovai Café', pass: await legacyHash('demo123'), plan: 'premium', status: 'Active', createdAt: daysAgo(75), tags: ['F&B'] },
    { id: 'u_divya', role: 'customer', name: 'Divya Ramesh', email: 'divya@glowclinic.in', phone: '+91 98940 66120', company: 'Glow Skin Clinic', pass: await legacyHash('demo123'), plan: 'free', status: 'Active', createdAt: daysAgo(30), tags: ['Healthcare'] },
  ];
  const mkOrder = (n, cust, days, items, status, coupon) => {
    const subtotal = items.reduce((s, i) => s + i.unit * (i.qty || 1), 0);
    const discount = coupon ? Math.round(subtotal * 0.1) : 0;
    const gst = Math.round((subtotal - discount) * 0.18);
    return { id: 'o_seed' + n, invoice: `VX-2026-${String(n).padStart(4, '0')}`, customerId: cust, createdAt: daysAgo(days), status, paid: true, method: 'UPI',
      items: items.map(i => ({ qty: 1, progress: status === 'Delivered' ? 100 : i.progress ?? 40, total: i.unit * (i.qty || 1), ...i })), subtotal, discount, coupon: coupon || null, gst, total: subtotal - discount + gst };
  };
  const orders = [
    mkOrder(12, 'u_divya', 2, [{ type: 'package', ref: 'web-design', tier: 'Growth', title: 'Website Design & Development — Growth', unit: 27999, billing: 'once', progress: 15 }], 'In progress'),
    mkOrder(11, 'u_demo', 9, [{ type: 'addon', ref: 'landing-page', title: 'Landing Page', unit: 4999, billing: 'once', progress: 70 }, { type: 'product', ref: 'social-templates', title: 'Social Media Template Pack (60)', unit: 499, billing: 'once', progress: 100 }], 'Review'),
    mkOrder(10, 'u_arjun', 18, [{ type: 'package', ref: 'video', tier: '8 Reels', title: 'Reels & Video Production — 8 Reels', unit: 10999, billing: 'once', progress: 55 }], 'In progress'),
    mkOrder(9, 'u_arjun', 75, [{ type: 'plan', ref: 'premium', cycle: 'month', title: 'Premium Growth plan (monthly)', unit: 19999, billing: 'month' }, { type: 'package', ref: 'branding', tier: 'Brand Kit', title: 'Digital Branding — Brand Kit', unit: 14999, billing: 'once' }], 'Delivered', 'WELCOME10'),
    mkOrder(8, 'u_yamuna', 110, [{ type: 'package', ref: 'industrial-design', tier: 'Catalogue', title: 'Industrial & Product Design — Catalogue', unit: 9999, billing: 'once' }, { type: 'package', ref: 'web-design', tier: 'Starter', title: 'Website Design & Development — Starter', unit: 14999, billing: 'once' }], 'Delivered'),
    mkOrder(7, 'u_kailash', 160, [{ type: 'package', ref: 'ecommerce', tier: 'Growth', title: 'E-commerce Store — Growth', unit: 74999, billing: 'once' }, { type: 'plan', ref: 'elite', cycle: 'month', title: 'Elite Scale plan (monthly)', unit: 44999, billing: 'month' }], 'Delivered'),
    mkOrder(6, 'u_demo', 145, [{ type: 'plan', ref: 'premium', cycle: 'month', title: 'Premium Growth plan (monthly)', unit: 19999, billing: 'month' }, { type: 'package', ref: 'web-design', tier: 'Growth', title: 'Website Design & Development — Growth', unit: 27999, billing: 'once' }], 'Delivered'),
    mkOrder(5, 'u_demo', 40, [{ type: 'product', ref: 'seo-checklist', title: 'Local SEO Checklist 2026', unit: 199, billing: 'once' }], 'Delivered'),
  ];
  // Divya's website is being paid in milestones: advance paid, two instalments due.
  orders[0].payments = milestoneSchedule(orders[0].total).map((m, i) => ({ label: m.label, amount: m.amount, paid: i === 0, paidAt: i === 0 ? orders[0].createdAt : null, method: i === 0 ? 'UPI' : null }));
  orders[0].paid = false;
  const sub = (id, cust, extra, days) => ({ id, customerId: cust, cycle: 'month', status: 'Active', startedAt: daysAgo(days), renewsAt: addMonths(daysAgo(days % 30), 1), addons: [], ...extra });
  const subscriptions = [
    sub('s_1', 'u_demo', { plan: 'premium', addons: ['gbp'], orderId: 'o_seed6' }, 145),
    sub('s_2', 'u_kailash', { plan: 'elite', addons: ['extra-reels', 'priority'], orderId: 'o_seed7' }, 160),
    sub('s_3', 'u_arjun', { plan: 'premium', orderId: 'o_seed9' }, 75),
    sub('s_4', 'u_kailash', { service: 'maintenance', tier: 'Pro' }, 120),
    sub('s_5', 'u_yamuna', { service: 'seo', tier: 'Local' }, 100),
  ];
  const L = (name, company, email, phone, source, service, budget, stage, days, message) => {
    const l = { id: uid('l_'), name, company, email, phone, source, service, budget, value: budget, stage, owner: 'Ranjith Kumar', createdAt: daysAgo(days, 9 + (days % 8)), message, notes: [], followUp: ['New', 'Contacted', 'Qualified', 'Proposal'].includes(stage) ? daysAgo(-((days % 5) + 1)) : null };
    l.score = scoreLead(l);
    return l;
  };
  const leads = [
    L('Karthik S', 'KS Motors', 'karthik@ksmotors.in', '+91 98422 10001', 'Google Ads', 'ecommerce', 150000, 'Proposal', 4, 'Need an online store for spare parts with 800+ SKUs and GST invoices.'),
    L('Priya Natarajan', 'Natarajan Silks', 'priya@nsilks.com', '+91 98943 20002', 'Instagram', 'social-media', 35000, 'Qualified', 3, 'Looking for Instagram reels and ads before wedding season.'),
    L('Mohammed Irfan', '', 'irfan.m@gmail.com', '+91 90251 30003', 'WhatsApp', 'web-design', 15000, 'New', 1, 'Simple website for my tuition centre.'),
    L('Lakshmi Devi', 'LD Organics', 'hello@ldorganics.in', '+91 97900 40004', 'Free audit', 'seo', 30000, 'Contacted', 2, 'Our site is not showing on Google for "organic store coimbatore".'),
    L('Vignesh R', 'Rapid Logistics', 'vignesh@rapidlog.in', '+91 99520 50005', 'Referral', 'mobile-app', 300000, 'Qualified', 6, 'Driver tracking app with admin dashboard.'),
    L('Anitha K', 'Little Steps Preschool', 'anitha@littlesteps.in', '+91 98657 60006', 'Website form', 'branding', 15000, 'New', 0, 'Rebranding our preschool — logo and brochures.'),
    L('Suresh Babu', 'SB Pumps', 'suresh@sbpumps.com', '+91 94431 70007', 'Walk-in', 'industrial-design', 30000, 'Proposal', 9, '3D renders and a product catalogue for 12 pump models.'),
    L('Nandhini', 'Bloom Florist', 'bloom@florist.in', '+91 90039 80008', 'Service quote', 'advertising', 20000, 'Contacted', 5, 'Run Google ads for same-day flower delivery.'),
    L('Rahul Jain', 'Jain Jewellers', 'rahul@jainjewels.in', '+91 98420 90009', 'Google Ads', 'ecommerce', 400000, 'Lost', 22, 'Went with an in-house team.'),
    L('Kavya Shree', 'FitHub Gym', 'kavya@fithub.in', '+91 97151 10010', 'Instagram', 'video', 11000, 'New', 0, 'Need 8 reels per month.'),
    L('Senthil Kumar', 'SK Hardware', 'senthil@skhardware.in', '+91 95008 11011', 'Free audit', 'maintenance', 5000, 'Contacted', 7, 'WordPress site keeps going down.'),
    L('Siva Prakash', 'Prakash Textiles', 'demo@vintorex.com', '+91 98430 11223', 'Referral', 'web-design', 50000, 'Won', 150, 'Converted to Premium Growth.'),
    L('Kailash', 'The World of Idols', 'kailash@idolworld.in', '+91 94422 55110', 'Google Ads', 'ecommerce', 120000, 'Won', 170, 'Converted — e-commerce + Elite plan.'),
    L('Yamuna', 'Electrical & Mechanical Solutions', 'yamuna@emsolutions.in', '+91 99940 33442', 'Website form', 'industrial-design', 25000, 'Won', 120, 'Catalogue + website.'),
    L('Arjun Menon', 'Kovai Café', 'arjun@kovaicafe.in', '+91 90030 77881', 'Instagram', 'social-media', 20000, 'Won', 80, 'Converted to Premium Growth.'),
    L('Divya Ramesh', 'Glow Skin Clinic', 'divya@glowclinic.in', '+91 98940 66120', 'Google Ads', 'web-design', 28000, 'Won', 32, 'Growth website.'),
  ];
  const custByEmail = Object.fromEntries(users.map(u => [u.email, u.id]));
  leads.forEach(l => { if (custByEmail[l.email]) l.customerId = custByEmail[l.email]; });
  leads[0].notes.push({ at: daysAgo(2), by: 'Ranjith Kumar', text: 'Sent proposal for E-commerce Growth + 3 months SEO.' });
  leads[4].notes.push({ at: daysAgo(5), by: 'Ranjith Kumar', text: 'Discovery call done. Wants iOS too.' });

  const tickets = [
    { id: 't_1', number: 1003, customerId: 'u_demo', subject: 'Change banner on landing page', orderId: 'o_seed11', status: 'Open', priority: 'Normal', createdAt: daysAgo(1), messages: [{ at: daysAgo(1), from: 'Siva Prakash', staff: false, text: 'Can we use the Diwali offer banner instead of the current one?' }] },
    { id: 't_2', number: 1002, customerId: 'u_kailash', subject: 'Payment gateway settlement delay', orderId: 'o_seed7', status: 'Pending', priority: 'High', createdAt: daysAgo(4), messages: [{ at: daysAgo(4), from: 'Kailash', staff: false, text: 'Razorpay settlements are taking 5 days.' }, { at: daysAgo(3), from: 'Ranjith Kumar', staff: true, text: 'We have raised it with Razorpay and enabled instant settlements on your account. Waiting for their confirmation.' }] },
    { id: 't_3', number: 1001, customerId: 'u_arjun', subject: 'Logo files in SVG', orderId: 'o_seed9', status: 'Closed', priority: 'Low', createdAt: daysAgo(60), messages: [{ at: daysAgo(60), from: 'Arjun Menon', staff: false, text: 'Please share the SVG logo.' }, { at: daysAgo(59), from: 'Ranjith Kumar', staff: true, text: 'Uploaded to your Downloads tab.' }] },
  ];

  return {
    version: 1, catalogVersion: CATALOG_VERSION,
    settings: { gst: BUSINESS.gst, businessName: BUSINESS.name, email: BUSINESS.email, phone: BUSINESS.phone, gstin: '33XXXXX0000X1Z5', address: BUSINESS.address },
    counters: { invoice: 12, ticket: 1003 },
    catalog: { services: clone(SERVICES), plans: clone(PLANS), addons: clone(ADDONS), products: clone(PRODUCTS), coupons: clone(COUPONS).map(c => ({ ...c, active: true })) },
    users, orders, subscriptions, leads, tickets,
    activity: [
      { at: daysAgo(0, 9), text: 'New lead from Website form: Anitha K' },
      { at: daysAgo(0, 8), text: 'New lead from Instagram: Kavya Shree' },
      { at: daysAgo(1), text: 'Ticket #1003 opened by Siva Prakash' },
      { at: daysAgo(2), text: 'Divya Ramesh placed VX-2026-0012' },
    ],
  };
}
