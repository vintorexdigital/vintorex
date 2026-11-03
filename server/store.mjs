// Shared application records and opaque, server-verified sessions.
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, chmodSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { randomBytes, createHash, scryptSync, timingSafeEqual } from 'node:crypto';
import { SERVICES, ADDONS, PLANS, PRODUCTS, COUPONS, BUSINESS, CATALOG_VERSION } from '../dist/js/data.js';
import { POSTS } from '../dist/js/blog/index.js';

export const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const clone = value => JSON.parse(JSON.stringify(value));
const catalogKeys = ['services', 'addons', 'plans', 'products', 'coupons'];
export const collections = [...catalogKeys, 'posts', 'users', 'leads', 'orders', 'subscriptions', 'tickets'];
const keyOf = (collection, record) => record[collection === 'posts' ? 'slug' : collection === 'coupons' ? 'code' : 'id'];
const hashToken = token => createHash('sha256').update(token).digest('hex');
const passwordHash = password => {
  const salt = randomBytes(16).toString('hex');
  return salt + ':' + scryptSync(password, salt, 64).toString('hex');
};
function passwordMatches(password, stored = '') {
  const [salt, hex] = stored.split(':');
  if (!salt || !hex) return false;
  const expected = Buffer.from(hex, 'hex'), actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
let database;
export function openStore() {
  if (database) return database;
  const file = resolve(process.env.APP_DB_PATH || 'var/app.sqlite');
  mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
  database = new DatabaseSync(file);
  chmodSync(file, 0o600);
  database.exec(`PRAGMA busy_timeout=5000;
    PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS app (id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS credentials (id TEXT PRIMARY KEY, hash TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, userId TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS receipts (paymentId TEXT PRIMARY KEY, data TEXT NOT NULL, usedBy TEXT);`);
  const initial = {
    version: 2, catalogVersion: CATALOG_VERSION,
    catalog: { services: SERVICES, addons: ADDONS, plans: PLANS, products: PRODUCTS, coupons: COUPONS },
    posts: POSTS, users: [], leads: [], orders: [], subscriptions: [], tickets: [], activity: [],
    settings: { gst: BUSINESS.gst, businessName: BUSINESS.name, email: BUSINESS.email, phone: BUSINESS.phone, address: BUSINESS.address, gstin: '' },
    counters: { invoice: 0, ticket: 1000 },
  };
  database.prepare('INSERT OR IGNORE INTO app VALUES (1,0,?)').run(JSON.stringify(initial));
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase(), password = process.env.ADMIN_PASSWORD;
  database.exec('BEGIN IMMEDIATE');
  try {
    const state = readStore().state;
    if (!state.adminInitialized && state.users.some(u => u.role === 'admin')) {
      state.adminInitialized = true;
      writeStore(state);
    }
    if (email && password?.length >= 12 && !state.adminInitialized) {
      state.users.push({ id: 'u_admin', email, name: process.env.ADMIN_NAME || 'Administrator', role: 'admin', status: 'Active', plan: 'free', tags: [], createdAt: new Date().toISOString() });
      database.prepare('INSERT INTO credentials VALUES (?,?)').run('u_admin', passwordHash(password));
      state.adminInitialized = true;
      writeStore(state);
    }
    database.exec('COMMIT');
  } catch (error) { database.exec('ROLLBACK'); throw error; }

  return database;
}
export function readStore() {
  const row = (database || openStore()).prepare('SELECT * FROM app WHERE id=1').get();
  return { revision: row.revision, state: JSON.parse(row.data) };
}
export function writeStore(state) {
  database.prepare('UPDATE app SET data=?, revision=revision+1 WHERE id=1').run(JSON.stringify(state));
}
export function sharedCatalog() { return readStore().state.catalog; }
export function sharedSettings() { return readStore().state.settings; }
export function sessionUser(req) {
  const token = req.headers.cookie?.match(/(?:^|; )vx_session=([a-f0-9]{64})(?:;|$)/)?.[1];
  if (!token) return null;
  const db = openStore();
  const session = db.prepare('SELECT userId FROM sessions WHERE token=? AND expires>?').get(hashToken(token), Date.now());
  return session && readStore().state.users.find(u => u.id === session.userId && u.status !== 'Blocked') || null;
}
function cookie(req, res, user) {
  const token = randomBytes(32).toString('hex');
  const db = openStore();
  db.prepare('DELETE FROM sessions WHERE expires<=?').run(Date.now());
  db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(hashToken(token), user.id, Date.now() + 86400000);
  // HTTPS sites always get a Secure cookie, including deployments behind a proxy.
  const secure = req.headers.origin?.startsWith('https://') || req.socket.encrypted;
  res.setHeader('Set-Cookie', 'vx_session=' + token + '; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400' + (secure ? '; Secure' : ''));
}
export function checkMutation(req) {
  if (req.headers['x-vx-request'] !== '1') fail(403, 'Use the application to make changes.');
  if (req.headers.origin) {
    let origin;
    try { origin = new URL(req.headers.origin); } catch { fail(403, 'Invalid origin.'); }
    if (origin.host !== req.headers.host) fail(403, 'Cross-site changes are forbidden.');
  }
}
export function snapshot(user) {
  const { revision, state } = readStore();
  if (user?.role !== 'admin') {
    state.users = user ? state.users.filter(u => u.id === user.id) : [];
    for (const key of ['orders', 'subscriptions', 'tickets']) state[key] = user ? state[key].filter(r => r.customerId === user.id) : [];
    state.leads = [];
    state.activity = [];
    state.posts = state.posts.filter(p => p.published !== false);
  }
  return { revision, state, user: user || null };
}
export async function authRoute(req, res, action, body, { limit, firebaseIdentity }) {
  const db = openStore();
  if (action === 'session' && req.method === 'GET') return snapshot(sessionUser(req));
  if (req.method !== 'POST') fail(405, 'Method not allowed.');
  checkMutation(req);
  limit(req);
  if (action === 'logout') {
    const token = req.headers.cookie?.match(/(?:^|; )vx_session=([a-f0-9]{64})/)?.[1];
    if (token) db.prepare('DELETE FROM sessions WHERE token=?').run(hashToken(token));
    res.setHeader('Set-Cookie', 'vx_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
    return { ok: true };
  }
  const verified = action === 'firebase' ? await firebaseIdentity(req) : null;
  db.exec('BEGIN IMMEDIATE');
  let committed = false;
  try {
    const state = readStore().state;
    const email = String(body.email || '').trim().toLowerCase();
    let user = state.users.find(u => u.email.toLowerCase() === email);
    if (action === 'create-customer') {
      if (sessionUser(req)?.role !== 'admin') fail(403, 'Administrator access required.');
      if (user) fail(409, 'An account with this email already exists.');
      if (typeof body.password !== 'string' || body.password.length < 12 || body.password.length > 256) fail(400, 'Use a password of 12–256 characters.');
      const customer = newCustomer(state, body);
      db.prepare('INSERT INTO credentials VALUES (?,?)').run(customer.id, passwordHash(body.password));
      writeStore(state);
      db.exec('COMMIT');
      committed = true;
      return { ...snapshot(sessionUser(req)), createdId: customer.id };
    }
    if (action === 'password') {
      user = sessionUser(req);
      if (!user) fail(401, 'Sign in first.');
      if (typeof body.password !== 'string' || body.password.length < 12 || body.password.length > 256) fail(400, 'Use a password of 12–256 characters.');
      db.prepare('INSERT INTO credentials VALUES (?,?) ON CONFLICT(id) DO UPDATE SET hash=excluded.hash').run(user.id, passwordHash(body.password));
      db.prepare('DELETE FROM sessions WHERE userId=?').run(user.id);
      cookie(req, res, user);
      db.exec('COMMIT');
      committed = true;
      return { ok: true };
    }
    if (action === 'firebase') {
      const identity = verified;
      if (!identity.emailVerified) fail(403, 'Verify your Firebase email before signing in.');
      user = state.users.find(u => u.firebaseUid === identity.uid) || state.users.find(u => u.email.toLowerCase() === identity.email.toLowerCase());
      if (user?.role === 'admin') fail(403, 'Use the administrator password.');
      if (!user) user = newCustomer(state, { ...body, email: identity.email });
      user.firebaseUid = identity.uid;
    } else if (action === 'register') {
      if (user) fail(409, 'An account with this email already exists.');
      if (typeof body.password !== 'string' || body.password.length < 12 || body.password.length > 256) fail(400, 'Use a password of 12–256 characters.');
      user = newCustomer(state, body);
      db.prepare('INSERT INTO credentials VALUES (?,?)').run(user.id, passwordHash(body.password));
    } else if (action === 'login') {
      const credentials = user && db.prepare('SELECT hash FROM credentials WHERE id=?').get(user.id);
      if (typeof body.password !== 'string' || body.password.length > 256 || !passwordMatches(body.password, credentials?.hash)) fail(401, 'Email or password is incorrect.');
    } else fail(404, 'Not found.');
    if (user.status === 'Blocked') fail(403, 'This account is blocked.');
    if (action !== 'login') writeStore(state);
    cookie(req, res, user);
    db.exec('COMMIT');
    committed = true;
    return snapshot(user);
  } finally {
    if (!committed) db.exec('ROLLBACK');
  }
}
function newCustomer(state, body) {
  const email = String(body.email || '').trim().toLowerCase(), name = String(body.name || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name || name.length > 150) fail(400, 'Enter a name and valid email.');
  const user = { id: 'u_' + randomBytes(12).toString('hex'), name, email, phone: String(body.phone || '').slice(0, 40), company: String(body.company || '').slice(0, 150), role: 'customer', status: 'Active', plan: 'free', tags: [], createdAt: new Date().toISOString() };
  state.users.push(user);
  state.leads.unshift({ id: 'l_' + randomBytes(12).toString('hex'), name, email, phone: user.phone, company: user.company, customerId: user.id,
    stage: 'Qualified', source: 'Website form', service: '', message: 'Created a customer account', value: 0, budget: 0, score: 0,
    owner: '', notes: [], followUp: null, createdAt: user.createdAt });
  return user;
}
export function paymentReceipt(paymentId, data) {
  openStore().prepare('INSERT OR IGNORE INTO receipts VALUES (?,?,NULL)').run(paymentId, JSON.stringify(data));
}
export function collection(state, name) { return catalogKeys.includes(name) ? state.catalog[name] : state[name]; }
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function requireFields(record, fields) {
  for (const field of fields) if (typeof record[field] !== 'string' || !record[field].trim()) fail(400, field + ' is required.');
}
export function validateRecord(name, record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) fail(400, 'Invalid record.');
  if (JSON.stringify(record).length > 250000) fail(413, 'Record is too large.');
  const id = keyOf(name, record);
  if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(id)) fail(400, 'Use an identifier containing letters, numbers, hyphens or underscores.');
  const fields = {
    services: ['name', 'billing'], plans: ['name'], addons: ['name', 'billing'], products: ['name'],
    coupons: ['code'], posts: ['title', 'body', 'service'], users: ['name', 'email', 'role', 'status'],
    leads: ['name', 'email', 'stage'], orders: ['customerId', 'invoice', 'status'],
    subscriptions: ['customerId', 'status'], tickets: ['customerId', 'subject', 'status'],
  };
  requireFields(record, fields[name]);
  for (const [key, value] of Object.entries(record)) {
    if (['price', 'mrp', 'total', 'subtotal', 'gst', 'discount', 'pct', 'value', 'budget', 'qty', 'number'].includes(key) &&
        (typeof value !== 'number' || !Number.isFinite(value) || value < 0)) fail(400, key + ' must be a nonnegative number.');
  }
  if (name === 'orders' && !record.payments) record.payments = [{ label: 'Full payment', amount: record.total, paid: record.paid !== false, paidAt: record.createdAt, method: record.method || 'Offline' }];
  if (name === 'subscriptions' && !record.addons) record.addons = [];
  if (name === 'users' && !record.tags) record.tags = [];
  const arrays = { services: ['tiers', 'market', 'competitors', 'works', 'split', 'idealFor', 'process', 'excludes'], plans: ['features'], addons: ['for'], posts: ['takeaways', 'faqs'], users: ['tags'], leads: ['notes'], orders: ['items', 'payments'], subscriptions: ['addons'], tickets: ['messages'] };
  for (const key of arrays[name] || []) if (!Array.isArray(record[key])) fail(400, key + ' must be a list.');
  if (name === 'services') {
    if (new Set(record.tiers.map(t => t.name)).size !== record.tiers.length) fail(400, 'Service tier names must be unique.');
    if (!record.tiers.length || record.market.length !== 2) fail(400, 'Provide service tiers and two market prices.');
    for (const tier of record.tiers) {
      requireFields(tier, ['name']);
      if (tier.name.length > 150) fail(400, 'Tier names must be at most 150 characters.');
      if (!Number.isFinite(tier.price) || tier.price < 0 || !Array.isArray(tier.features)) fail(400, 'Each tier needs a price and feature list.');
    }
  }
  if (name === 'services') {
    for (const key of ['idealFor', 'excludes']) if (record[key].some(v => typeof v !== 'string')) fail(400, key + ' must contain text.');
    for (const key of ['works', 'split', 'process']) if (record[key].some(v => !Array.isArray(v))) fail(400, key + ' must contain lists.');
    if (record.competitors.some(v => !v || typeof v.name !== 'string' || typeof v.kind !== 'string' || !Array.isArray(v.src))) fail(400, 'Invalid competitor record.');
    if (!['once', 'month'].includes(record.billing)) fail(400, 'Choose one-time or monthly billing.');
  }
  if (['products', 'addons', 'plans'].includes(name) && (!Number.isFinite(record.price) || record.price < 0)) fail(400, 'Provide a nonnegative price.');
  if (name === 'tickets' && record.messages.some(m => !m || typeof m.text !== 'string' || typeof m.from !== 'string' || typeof m.staff !== 'boolean')) fail(400, 'Invalid support message.');
  if (name === 'orders') {
    if (!record.items.length || !record.payments.length) fail(400, 'Provide at least one order item and payment schedule.');
    if (record.items.some(i => !Number.isInteger(i.qty) || i.qty < 1 || !Number.isFinite(i.total) || i.total < 0)) fail(400, 'Order items need quantities and nonnegative totals.');
    if (record.payments.some(p => !Number.isFinite(p.amount) || p.amount < 0 || typeof p.paid !== 'boolean')) fail(400, 'Invalid payment schedule.');
    if (record.payments.reduce((sum, p) => sum + p.amount, 0) !== record.total) fail(400, 'Payment amounts must add up to the order total.');
    record.paid = record.payments.every(p => p.paid);
  }
  if (name === 'posts') record.minutes = Math.max(1, Math.ceil([record.body, ...(record.takeaways || []), ...(record.faqs || []).flat()].join(' ').trim().split(/\s+/).length / 200));
  if (name === 'posts' && (typeof record.excerpt !== 'string' || record.faqs.some(row => !Array.isArray(row) || row.length !== 2))) fail(400, 'Provide an excerpt and question-answer pairs.');
  if (name === 'users' && typeof record.email === 'string') record.email = record.email.trim().toLowerCase();
  if (name === 'users' && (!['admin', 'customer'].includes(record.role) || !['Active', 'Blocked'].includes(record.status) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email))) fail(400, 'Invalid account role, status or email.');
  if (name === 'coupons' && (!Number.isFinite(record.pct) || record.pct > 90)) fail(400, 'Coupon discount must be 0–90%.');
  if (name === 'plans' && (!Number.isFinite(record.price) || !Number.isFinite(record.discount) || record.discount > 50)) fail(400, 'Provide a price and a member discount up to 50%.');
  if (name === 'tickets' && !record.messages.length) fail(400, 'A ticket needs at least one message.');
}
function checkReferences(state) {
  const has = (name, id) => collection(state, name).some(r => keyOf(name, r) === id);
  for (const name of ['orders', 'subscriptions', 'tickets']) for (const record of state[name]) {
    if (!has('users', record.customerId)) fail(409, 'A related customer is missing. Remove related records first.');
    if (record.orderId && !state.orders.some(o => o.id === record.orderId && o.customerId === record.customerId)) fail(409, 'A related order is missing.');
  }
  for (const sub of state.subscriptions) {
    if (sub.plan && !has('plans', sub.plan)) fail(409, 'A subscription uses this membership plan.');
    if (sub.service && !has('services', sub.service)) fail(409, 'A subscription uses this service.');
    if (sub.addons.some(id => !has('addons', id))) fail(409, 'A subscription uses this add-on.');
  }
  for (const order of state.orders) for (const item of order.items) {
    const name = { package: 'services', plan: 'plans', addon: 'addons', product: 'products' }[item.type];
    if (!name || !has(name, item.ref)) fail(409, 'An order references a catalog record. Remove related orders first.');
  }
  for (const plan of state.catalog.plans) {
    for (const id of plan.extras || []) if (!has('addons', id)) fail(409, 'A membership plan uses this add-on.');
    for (const item of plan.includes || []) {
      const [serviceId, tier] = item.split(':');
      if (!state.catalog.services.find(s => s.id === serviceId)?.tiers.some(t => t.name === tier)) fail(409, 'A membership plan references a service package.');
    }
  }
  for (const addon of state.catalog.addons) for (const id of addon.for || []) if (!has('services', id)) fail(409, 'An add-on references this service.');
  for (const user of state.users) if (user.plan && !has('plans', user.plan)) fail(409, 'An account uses this membership plan.');
  for (const post of state.posts) if (!has('services', post.service)) fail(409, 'A guide uses this service.');
  for (const lead of state.leads) {
    if (lead.customerId && !has('users', lead.customerId)) fail(409, 'A lead references this customer.');
    if (lead.service && !has('services', lead.service)) fail(409, 'A lead references this service.');
  }
  const emails = state.users.map(u => u.email.toLowerCase());
  if (new Set(emails).size !== emails.length) fail(409, 'Email addresses must be unique.');
}
function customerChange(user, name, old, record) {
  if (name === 'leads' && !old && record) {
    record.customerId = user?.id || null;
    record.stage = 'New'; record.owner = ''; record.value = 0; record.notes = []; record.score = 0;
    return;
  }
  if (!user) fail(401, 'Sign in first.');
  if (!record || (name === 'users' ? record.id !== user.id : record.customerId !== user.id) ||
      (old && (name === 'users' ? old.id !== user.id : old.customerId !== user.id))) fail(403, 'This record belongs to another account.');
  const allowed = { users: ['name', 'email', 'phone', 'company', 'gstin', 'address', 'city'], subscriptions: ['status', 'addons'], tickets: ['messages', 'status'] }[name];
  if (name === 'tickets' && !old) {
    if (record.status !== 'Open' || record.messages.some(m => m.staff !== false)) fail(403, 'Invalid ticket.');
    return;
  }
  if (!allowed || !old) fail(403, 'Only an administrator can make this change.');
  for (const key of new Set([...Object.keys(old), ...Object.keys(record)])) {
    if (!allowed.includes(key) && !equal(old[key], record[key])) fail(403, 'Only an administrator can change ' + key + '.');
  }
  if (name === 'subscriptions' && !['Active', 'Paused', 'Cancelled'].includes(record.status)) fail(400, 'Invalid subscription status.');
  if (name === 'tickets') {
    if (!['Open', 'Closed', 'Pending'].includes(record.status) || record.messages.length < old.messages.length ||
        !equal(record.messages.slice(0, old.messages.length), old.messages) ||
        record.messages.slice(old.messages.length).some(m => m.staff !== false || m.from !== user.name || typeof m.text !== 'string')) fail(403, 'Only your own replies may be appended.');
  }
}
export function commitChanges(req, body) {
  checkMutation(req);
  const db = openStore(), user = sessionUser(req);
  if (!Array.isArray(body.changes) || body.changes.length > 1000) fail(400, 'Invalid change list.');
  db.exec('BEGIN IMMEDIATE');
  try {
    const { state, revision } = readStore();
    if (!body.changes.length && !body.settings) { db.exec('COMMIT'); return snapshot(user); }
    if (body.revision !== revision) fail(409, 'Records changed on another device. Reload and try again.');
    for (const change of body.changes) {
      const { name, id } = change;
      if (!collections.includes(name)) fail(400, 'Unknown collection.');
      const records = collection(state, name), index = records.findIndex(r => keyOf(name, r) === id), old = records[index];
      const record = change.record ? clone(change.record) : null;
      const password = record?._password;
      if (record) delete record._password;
      if (password !== undefined) {
        if (user?.role !== 'admin' || name !== 'users') fail(403, 'Administrator access required.');
        if (typeof password !== 'string' || password.length < 12 || password.length > 256) fail(400, 'Use a password of 12–256 characters.');
        db.prepare('INSERT INTO credentials VALUES (?,?) ON CONFLICT(id) DO UPDATE SET hash=excluded.hash').run(id, passwordHash(password));
        const currentToken = req.headers.cookie?.match(/(?:^|; )vx_session=([a-f0-9]{64})/)?.[1];
        if (user.id === id && currentToken) db.prepare('DELETE FROM sessions WHERE userId=? AND token<>?').run(id, hashToken(currentToken));
        else db.prepare('DELETE FROM sessions WHERE userId=?').run(id);
      }
      if (record) {
        delete record.pass;
        validateRecord(name, record);
        if (keyOf(name, record) !== id) fail(400, 'Identifiers cannot be changed.');
      } else if (!old) fail(404, 'Record not found.');
      if (user?.role !== 'admin') customerChange(user, name, old, record);
      if (name === 'users' && old?.role === 'admin' && (!record || record.role !== 'admin' || record.status === 'Blocked')) {
        if (!state.users.some(u => u.id !== id && u.role === 'admin' && u.status === 'Active')) fail(409, 'Keep at least one active administrator.');
      }
      if (name === 'subscriptions' && record?.status === 'Cancelled' && old?.plan) {
        const customer = state.users.find(u => u.id === record.customerId);
        if (customer?.plan === old.plan) { customer.plan = 'free'; delete customer.memberToken; }
      }
      if (name === 'tickets' && record && !old) {
        if (user?.role === 'admin' && Number.isSafeInteger(record.number) && record.number > 0) state.counters.ticket = Math.max(state.counters.ticket, record.number);
        else record.number = ++state.counters.ticket;
      }
      if (record) { if (index < 0) records.unshift(record); else records[index] = record; }
      else {
        records.splice(index, 1);
        if (name === 'users') {
          db.prepare('DELETE FROM sessions WHERE userId=?').run(id);
          db.prepare('DELETE FROM credentials WHERE id=?').run(id);
        }
      }
    }
    if (body.settings) {
      if (user?.role !== 'admin') fail(403, 'Administrator access required.');
      if (!Number.isFinite(body.settings.gst) || body.settings.gst < 0 || body.settings.gst > 100) fail(400, 'Invalid tax rate.');
      state.settings = body.settings;
    }
    checkReferences(state);
    state.counters.invoice = Math.max(state.counters.invoice, ...state.orders.map(order => Number(order.invoice.match(/^VX-\d{4}-(\d+)$/)?.[1]) || 0));
    state.counters.ticket = Math.max(state.counters.ticket, ...state.tickets.map(ticket => ticket.number || 0));
    state.activity.unshift({ at: new Date().toISOString(), text: (user?.name || 'Visitor') + ' saved ' + body.changes.length + ' record(s).' });
    state.activity = state.activity.slice(0, 200);
    writeStore(state);
    db.exec('COMMIT');
    return snapshot(user && state.users.find(u => u.id === user.id));
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}

export function checkout(req, body, { priceCart, demo = false }) {
  checkMutation(req);
  const user = sessionUser(req);
  if (!user) fail(401, 'Sign in first.');
  const db = openStore();
  db.exec('BEGIN IMMEDIATE');
  try {
    const { state } = readStore();
    const customer = state.users.find(u => u.id === user.id);
    let order;
    const now = new Date().toISOString();
    const receipt = body.paymentId && db.prepare('SELECT * FROM receipts WHERE paymentId=?').get(body.paymentId);
    if (receipt?.usedBy) {
      order = state.orders.find(o => o.id === receipt.usedBy && o.customerId === user.id);
      if (!order) fail(409, 'Payment already recorded.');
      db.exec('COMMIT');
      return { ...snapshot(user), orderId: order.id };
    }
    const proof = receipt && JSON.parse(receipt.data);
    if (user.role !== 'admin' && !demo && (!proof || (proof.userId ? proof.userId !== user.id : proof.account !== user.email.toLowerCase()))) fail(403, 'A verified payment for this account is required.');
    if (body.orderId) {
      order = state.orders.find(o => o.id === body.orderId && (user.role === 'admin' || o.customerId === user.id));
      const next = order?.payments.find(p => !p.paid);
      if (!next) fail(400, 'No payment is due.');
      if (user.role !== 'admin' && !demo && (proof.first !== order.paymentOrderId || proof.due !== next.amount)) fail(400, 'Payment does not match this instalment.');
      Object.assign(next, { paid: true, paidAt: now, method: user.role === 'admin' && !proof ? String(body.method || 'Offline') : demo ? 'Demo' : 'Razorpay', ref: body.paymentId || null });
      order.paid = order.payments.every(p => p.paid);
      if (proof?.balanceToken) order.balanceToken = proof.balanceToken;
      else delete order.balanceToken;
    } else {
      if (!Array.isArray(body.items) || !body.items.length || body.items.length > 100 ||
          body.items.some(i => !Number.isInteger(i.qty) || i.qty < 1 || i.qty > 20)) fail(400, 'Invalid cart.');
      const q = demo ? priceCart(body.items, { catalog: state.catalog, gstPct: state.settings.gst, memberPlanId: customer.plan, couponCode: body.couponCode }) : proof.quote;
      if (!q || q.lines.length !== body.items.length || (!demo && !sameCart(proof.items, body.items))) fail(400, 'Payment does not match this cart.');
      const milestone = demo ? body.payPlan === 'milestone' && q.milestones : proof.payPlan === 'milestone';
      const payments = (milestone ? q.milestones : [{ label: 'Full payment', amount: q.total }]).map((m, i) => ({
        label: m.label, amount: m.amount, paid: i === 0, paidAt: i === 0 ? now : null, method: i === 0 ? demo ? 'Demo' : 'Razorpay' : null,
        ...(i === 0 && body.paymentId ? { ref: body.paymentId } : {}),
      }));
      state.counters.invoice++;
      order = {
        id: 'o_' + randomBytes(12).toString('hex'), invoice: 'VX-' + new Date().getFullYear() + '-' + String(state.counters.invoice).padStart(6, '0'),
        customerId: user.id, createdAt: now, status: 'Pending', paid: payments.every(p => p.paid), method: demo ? 'Demo' : 'Razorpay', payments,
        items: q.lines.map(l => ({ type: l.type, ref: l.ref, tier: l.tier, cycle: l.cycle, qty: l.qty, title: l.info.title, unit: l.info.unit, billing: l.info.billing, total: l.total, progress: l.type === 'product' ? 100 : 0 })),
        subtotal: q.subtotal, discount: q.memberOff + q.couponOff, coupon: q.coupon?.code || null, gst: q.gst, total: q.total,
      };
      if (proof) {
        order.paymentOrderId = proof.orderId;
        if (proof.balanceToken) order.balanceToken = proof.balanceToken;
      }
      if (order.items.every(item => item.type === 'product')) order.status = 'Delivered';
      state.orders.unshift(order);
      for (const item of order.items) {
        if (item.type === 'plan' || item.type === 'package' && item.billing === 'month') {
          if (item.type === 'plan') {
            state.subscriptions.filter(s => s.customerId === user.id && s.plan && ['Active', 'Paused'].includes(s.status)).forEach(s => s.status = 'Replaced');
            customer.plan = item.ref;
            if (proof?.memberToken) customer.memberToken = proof.memberToken;
          }
          const renewal = new Date();
          renewal.setMonth(renewal.getMonth() + (item.cycle === 'year' ? 12 : 1));
          state.subscriptions.unshift({ id: 's_' + randomBytes(12).toString('hex'), customerId: user.id,
            ...(item.type === 'plan' ? { plan: item.ref } : { service: item.ref, tier: item.tier }),
            cycle: item.cycle || 'month', status: 'Active', startedAt: now, renewsAt: renewal.toISOString(), addons: [], orderId: order.id });
        }
        if (item.type === 'addon' && item.billing === 'month') {
          const sub = state.subscriptions.find(s => s.customerId === user.id && s.plan && s.status === 'Active');
          if (sub && !sub.addons.includes(item.ref)) sub.addons.push(item.ref);
        }
      }
      state.leads.filter(l => l.customerId === user.id || l.email.toLowerCase() === user.email.toLowerCase()).forEach(l => {
        l.stage = 'Won'; l.customerId = user.id; l.value = (l.value || 0) + order.total;
      });
    }
    if (receipt) db.prepare('UPDATE receipts SET usedBy=? WHERE paymentId=?').run(order.id, body.paymentId);
    state.activity.unshift({ at: now, text: user.name + ' recorded payment for ' + order.invoice });
    writeStore(state);
    db.exec('COMMIT');
    return { ...snapshot(customer), orderId: order.id };
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}

function sameCart(first, second) {
  const normalize = items => items.map(i => [i.type, i.ref, i.tier || '', i.cycle || '', i.qty || 1]);
  return equal(normalize(first || []), normalize(second || []));
}
