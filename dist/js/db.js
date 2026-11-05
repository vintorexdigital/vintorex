// Browser view of the shared database. Cart preferences stay on this device.
import { request, changesBetween } from './shared-store.js';
import { ANNUAL_MONTHS_PAID } from './site-data.js';
import { milestoneSchedule, lineInfo as priceLine, priceCart } from './pricing.js';
export { milestoneSchedule };

const CART = 'vx_cart';
const safe = (fn, fallback) => { try { return fn(); } catch { return fallback; } };
export const uid = (prefix = '') => prefix + crypto.randomUUID().replaceAll('-', '');
export const isLocalHost = () => /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);

let state = null;
let sessionUser = null;

export function db() {
  return state;
}
export const shared = true;
let revision = 0, baseline, saving = Promise.resolve(true), generation = 0;
function install(result) {
  state = result.state;
  sessionUser = result.user ? state.users.find(user => user.id === result.user.id) || null : null;
  revision = result.revision;
  baseline = JSON.parse(JSON.stringify(state));
}
export async function refresh() {
  await saving;
  install(await request('/api/store'));
}
export function save() {
  const generationAtSave = generation;
  const captured = JSON.parse(JSON.stringify(state));
  const changes = changesBetween(baseline, captured);
  const settings = JSON.stringify(baseline.settings) !== JSON.stringify(captured.settings) ? captured.settings : undefined;
  baseline = captured;
  if (!changes.length && !settings) return saving;
  saving = saving.then(async () => {
    if (generationAtSave !== generation) return false;
    const result = await request('/api/store', { revision, changes, settings });
    revision = result.revision;
    if (JSON.stringify(state) === JSON.stringify(captured)) install(result);
    return true;
  }).catch(async error => {
    generation++;
    try { install(await request('/api/store')); } catch {}
    document.dispatchEvent(new CustomEvent('vx:save-error', { detail: error.message }));
    return false;
  });
  return saving;
}
export async function flush() {
  const ok = await saving;
  if (!ok) { saving = Promise.resolve(true); throw new Error('Changes were not saved. Review the refreshed records and try again.'); }
}
export async function authenticate(action, body) {
  await flush();
  install(await request('/api/auth/' + action, body));
  return sessionUser;
}

export async function init() {
  install(await request('/api/auth/session'));
}
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
  return authenticate('login', { email, password });
}
export async function logout() {
  await flush();
  await request('/api/auth/logout', {});
  await refresh();
}
export async function adoptUser(fields, token) {
  await flush();
  const response = await fetch('/api/auth/firebase', { method: 'POST', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-VX-Request': '1', Authorization: 'Bearer ' + token },
    body: JSON.stringify(fields) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Could not sign in.');
  install(result);
  return sessionUser;
}
export async function register(fields) {
  if (sessionUser?.role === 'admin') {
    await flush();
    const result = await request('/api/auth/create-customer', fields);
    install(result);
    return state.users.find(u => u.id === result.createdId);
  }
  return authenticate('register', fields);
}
export async function changePassword(user, next) {
  await request('/api/auth/password', { password: next });
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
// A paid online order passes the server's quote, the Razorpay payment id and the
// server-signed tokens for the membership discount and later instalments.
export async function placeOrder(user, items, couponCode, method, payPlan = 'full', { priced, paymentId, memberToken, balanceToken } = {}) {
  await flush();
  const result = await request('/api/store/checkout', { items, couponCode, payPlan, paymentId });
  install(result);
  return state.orders.find(o => o.id === result.orderId);
}

// Orders placed before milestone payments existed were paid in full.
export const orderPayments = o => o.payments || [{ label: 'Full payment', amount: o.total, paid: o.paid !== false, paidAt: o.createdAt, method: o.method }];
export const orderPaid = o => orderPayments(o).filter(p => p.paid).reduce((s, p) => s + p.amount, 0);
export const orderBalance = o => o.total - orderPaid(o);

export async function payNext(order, method, by, { paymentId, balanceToken } = {}) {
  await flush();
  const result = await request('/api/store/checkout', { orderId: order.id, paymentId, method });
  install(result);

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


export async function importBackup(backup) {
  if (sessionUser?.role !== 'admin') throw new Error('Administrator access required.');
  await flush();
  for (const name of ['services', 'plans', 'addons', 'products', 'coupons', 'posts', 'users', 'orders', 'subscriptions', 'leads', 'tickets']) {
    const incoming = backup.catalog?.[name] || backup[name];
    if (!Array.isArray(incoming)) continue;
    const destination = state.catalog[name] || state[name];
    const key = name === 'posts' ? 'slug' : name === 'coupons' ? 'code' : 'id';
    for (const value of incoming) {
      if (!value || typeof value !== 'object' || name === 'users' && value.role === 'admin') continue;
      const record = JSON.parse(JSON.stringify(value));
      delete record.pass; delete record._password;
      const index = destination.findIndex(r => r[key] === record[key]);
      if (index < 0) destination.push(record); else destination[index] = record;
    }
  }
  await save(); await flush();
}
