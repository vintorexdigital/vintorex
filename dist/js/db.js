// Browser-side data store. Everything lives in localStorage so the app runs on
// static hosting; swap these functions for API calls when a backend is added.
import { SERVICES, PLANS, ADDONS, PRODUCTS, COUPONS, BUSINESS, ANNUAL_MONTHS_PAID } from './data.js';

const KEY = 'vx_db_v1';
const SESSION = 'vx_session';
const CART = 'vx_cart';

const safe = (fn, fallback) => { try { return fn(); } catch { return fallback; } };
export const uid = (p = '') => p + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
const daysAgo = (d, h = 10) => { const t = new Date(); t.setDate(t.getDate() - d); t.setHours(h, 0, 0, 0); return t.toISOString(); };

export async function hash(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('vx:' + text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

let state = null;

export function db() {
  if (!state) state = safe(() => JSON.parse(localStorage.getItem(KEY)), null);
  return state;
}
export function save() { safe(() => localStorage.setItem(KEY, JSON.stringify(state))); }

export async function init() {
  if (db()) return;
  state = await seed();
  save();
}
export async function resetDemo() { state = await seed(); save(); setCart([]); }

// ---------- catalog ----------
export const catalog = () => db().catalog;
export const service = id => catalog().services.find(s => s.id === id);
export const plan = id => catalog().plans.find(p => p.id === id);
export const addon = id => catalog().addons.find(a => a.id === id);
export const product = id => catalog().products.find(p => p.id === id);

// ---------- auth ----------
export const currentUser = () => {
  const id = safe(() => localStorage.getItem(SESSION), null);
  return id ? db().users.find(u => u.id === id) || null : null;
};
export async function login(email, password) {
  const u = db().users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!u || u.pass !== await hash(password)) throw new Error('Email or password is incorrect.');
  if (u.status === 'Blocked') throw new Error('This account is blocked. Contact support.');
  safe(() => localStorage.setItem(SESSION, u.id));
  return u;
}
export function logout() { safe(() => localStorage.removeItem(SESSION)); }
export async function register({ name, email, phone, company, password }) {
  const d = db();
  if (d.users.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) throw new Error('An account with this email already exists.');
  const u = { id: uid('u_'), role: 'customer', name: name.trim(), email: email.trim(), phone, company, pass: await hash(password), plan: 'free', status: 'Active', createdAt: new Date().toISOString(), tags: [] };
  d.users.push(u);
  // every signup lands in the CRM as a lead too
  addLead({ name: u.name, email: u.email, phone, company, source: 'Website form', service: '', message: 'Created a customer account', stage: 'Qualified', customerId: u.id }, false);
  logActivity(`New customer signup: ${u.name}`);
  save();
  safe(() => localStorage.setItem(SESSION, u.id));
  return u;
}
export async function changePassword(user, next) { user.pass = await hash(next); save(); }

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
export function lineInfo(item) {
  if (item.type === 'package') {
    const s = service(item.ref); const t = s?.tiers.find(t => t.name === item.tier);
    if (!s || !t) return null;
    return { title: `${s.name} — ${t.name}`, unit: t.price, billing: s.billing, kind: 'Service' };
  }
  if (item.type === 'addon') {
    const a = addon(item.ref); if (!a) return null;
    return { title: a.name, unit: a.price, billing: a.billing, kind: 'Add-on' };
  }
  if (item.type === 'product') {
    const p = product(item.ref); if (!p) return null;
    return { title: p.name, unit: p.price, billing: 'once', kind: 'Download' };
  }
  if (item.type === 'plan') {
    const p = plan(item.ref); if (!p) return null;
    const annual = item.cycle === 'year';
    return { title: `${p.name} plan (${annual ? 'annual' : 'monthly'})`, unit: annual ? p.price * ANNUAL_MONTHS_PAID : p.price, billing: annual ? 'year' : 'month', kind: 'Membership' };
  }
  return null;
}

// Totals with member discount on one-time services, optional coupon and GST.
export function quote(items, user, couponCode) {
  const lines = items.map(i => ({ ...i, info: lineInfo(i) })).filter(l => l.info);
  const planInCart = lines.find(l => l.type === 'plan');
  const memberPlan = plan(planInCart?.ref || user?.plan || 'free');
  const memberPct = memberPlan?.discount || 0;
  let subtotal = 0, memberOff = 0;
  for (const l of lines) {
    l.total = l.info.unit * l.qty;
    subtotal += l.total;
    if (memberPct && l.type === 'package' && l.info.billing === 'once') memberOff += Math.round(l.total * memberPct / 100);
  }
  const coupon = couponCode ? catalog().coupons.find(c => c.code === couponCode.trim().toUpperCase() && c.active !== false) : null;
  const couponOff = coupon ? Math.round((subtotal - memberOff) * coupon.pct / 100) : 0;
  const taxable = subtotal - memberOff - couponOff;
  const gstPct = db().settings.gst;
  const gst = Math.round(taxable * gstPct / 100);
  return { lines, subtotal, memberPct, memberOff, coupon, couponOff, taxable, gstPct, gst, total: taxable + gst };
}

// ---------- orders & subscriptions ----------
const nextInvoice = () => { const d = db(); d.counters.invoice += 1; return `VX-${new Date().getFullYear()}-${String(d.counters.invoice).padStart(4, '0')}`; };

export function placeOrder(user, items, couponCode, method) {
  const d = db();
  const q = quote(items, user, couponCode);
  if (!q.lines.length) throw new Error('Your cart is empty.');
  const order = {
    id: uid('o_'), invoice: nextInvoice(), customerId: user.id, createdAt: new Date().toISOString(),
    status: 'Pending', paid: true, method,
    items: q.lines.map(l => ({ type: l.type, ref: l.ref, tier: l.tier, cycle: l.cycle, qty: l.qty, title: l.info.title, unit: l.info.unit, billing: l.info.billing, total: l.total, progress: l.type === 'product' ? 100 : 0 })),
    subtotal: q.subtotal, discount: q.memberOff + q.couponOff, coupon: q.coupon?.code || null, gst: q.gst, total: q.total,
  };
  if (order.items.every(i => i.type === 'product')) order.status = 'Delivered';
  d.orders.unshift(order);
  for (const i of order.items) {
    if (i.type === 'plan') {
      d.subscriptions.filter(s => s.customerId === user.id && s.status === 'Active').forEach(s => { s.status = 'Replaced'; });
      d.subscriptions.unshift({ id: uid('s_'), customerId: user.id, plan: i.ref, cycle: i.cycle || 'month', status: 'Active', startedAt: order.createdAt, renewsAt: addMonths(order.createdAt, i.cycle === 'year' ? 12 : 1), addons: [], orderId: order.id });
      user.plan = i.ref;
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

export const activeMembership = customerId => db().subscriptions.find(s => s.customerId === customerId && s.plan && ['Active', 'Paused'].includes(s.status));

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
  const users = [
    { id: 'u_admin', role: 'admin', name: 'Ranjith Kumar', email: 'admin@vintorex.com', phone: BUSINESS.phone, pass: await hash('admin123'), status: 'Active', createdAt: daysAgo(400), tags: [] },
    { id: 'u_demo', role: 'customer', name: 'Siva Prakash', email: 'demo@vintorex.com', phone: '+91 98430 11223', company: 'Prakash Textiles', pass: await hash('demo123'), plan: 'premium', status: 'Active', createdAt: daysAgo(150), tags: ['Retail'] },
    { id: 'u_kailash', role: 'customer', name: 'Kailash', email: 'kailash@idolworld.in', phone: '+91 94422 55110', company: 'The World of Idols', pass: await hash('demo123'), plan: 'elite', status: 'Active', createdAt: daysAgo(170), tags: ['E-commerce'] },
    { id: 'u_yamuna', role: 'customer', name: 'Yamuna', email: 'yamuna@emsolutions.in', phone: '+91 99940 33442', company: 'Electrical & Mechanical Solutions', pass: await hash('demo123'), plan: 'free', status: 'Active', createdAt: daysAgo(120), tags: ['Industrial'] },
    { id: 'u_arjun', role: 'customer', name: 'Arjun Menon', email: 'arjun@kovaicafe.in', phone: '+91 90030 77881', company: 'Kovai Café', pass: await hash('demo123'), plan: 'premium', status: 'Active', createdAt: daysAgo(75), tags: ['F&B'] },
    { id: 'u_divya', role: 'customer', name: 'Divya Ramesh', email: 'divya@glowclinic.in', phone: '+91 98940 66120', company: 'Glow Skin Clinic', pass: await hash('demo123'), plan: 'free', status: 'Active', createdAt: daysAgo(30), tags: ['Healthcare'] },
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
    version: 1,
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
