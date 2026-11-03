// Shared, account-bound service claims. Keep this SQLite file outside the public site.
import { createHmac, randomBytes, randomInt, timingSafeEqual, verify } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { SERVICES, BUSINESS } from '../dist/js/data.js';

function fail(status, message) { throw Object.assign(new Error(message), { status }); }
let opening;
async function database() {
  if (!opening) opening = (async () => {
    const { DatabaseSync } = await import('node:sqlite');
    const file = process.env.OFFER_DB_PATH || 'var/offers.sqlite';
    mkdirSync(dirname(resolve(file)), { recursive: true, mode: 0o700 });
    const db = new DatabaseSync(file);
    db.exec(`PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS settings (name TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS claims (
        uid TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, email TEXT NOT NULL, name TEXT NOT NULL,
        business TEXT NOT NULL, goal TEXT NOT NULL, service TEXT NOT NULL, tier TEXT NOT NULL,
        amount INTEGER NOT NULL, price INTEGER NOT NULL, total INTEGER NOT NULL,
        created TEXT NOT NULL, followup TEXT NOT NULL, note TEXT NOT NULL DEFAULT '',
        orderId TEXT UNIQUE, paid INTEGER NOT NULL DEFAULT 0
      );`);
    db.prepare('INSERT OR IGNORE INTO settings VALUES (?,?)').run('scratch', randomBytes(32).toString('hex'));
    return db;
  })().catch(() => { opening = null; fail(503, 'Offer storage is unavailable. Please try again later.'); });
  return opening;
}
const project = 'vintorex-digital-solutions-024';
let certs, expires = 0;
async function identity(req) {
  try {
    const token = (req.headers.authorization || '').match(/^Bearer ([\w.-]+)$/)?.[1] || '';
    const [head, data, signature, extra] = token.split('.');
    if (!signature || extra !== undefined) throw Error();
    const header = JSON.parse(Buffer.from(head,'base64url'));
    const claims = JSON.parse(Buffer.from(data,'base64url'));
    const now = Date.now()/1000;
    if (header.alg !== 'RS256' || typeof header.kid !== 'string' || claims.aud !== project ||
        claims.iss !== 'https://securetoken.google.com/'+project || typeof claims.sub !== 'string' ||
        !claims.sub || claims.sub.length > 128 || !Number.isFinite(claims.exp) || claims.exp <= now ||
        !Number.isFinite(claims.iat) || claims.iat > now+60 || typeof claims.email !== 'string' || !claims.email) throw Error();
    if (Date.now() >= expires) {
      const res = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com', { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw Error();
      certs = await res.json();
      expires = Date.now() + Number(res.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1] || 60)*1000;
    }
    if (!Object.hasOwn(certs, header.kid) || !verify('RSA-SHA256', Buffer.from(head+'.'+data), certs[header.kid], Buffer.from(signature,'base64url'))) throw Error();
    return { uid: claims.sub, email: claims.email };
  } catch { fail(401, 'Sign in with your registered Firebase account to claim or pay.'); }
}
const own = (db, uid) => db.prepare('SELECT * FROM claims WHERE uid=?').get(uid);
const tag = (db, text) => createHmac('sha256', db.prepare('SELECT value FROM settings WHERE name=?').get('scratch').value).update(text).digest('hex');
const secretEqual = (a,b) => typeof a === 'string' && typeof b === 'string' && Buffer.byteLength(a) === Buffer.byteLength(b) && timingSafeEqual(Buffer.from(a),Buffer.from(b));
export function draw(db) {
  const amount = randomInt(7999, 10000);
  const code = 'VX-'+randomBytes(10).toString('hex').toUpperCase();
  return { code, amount, proof: tag(db, code+':'+amount) };
}
export function claimOffer(db, user, body) {
  const prior = own(db,user.uid);
  if (prior) return prior;
  const { code, amount, proof } = body;
  // Honour previously signed draws from the original ₹5,000 minimum.
  if (!/^VX-[A-F0-9]{20}$/.test(code) || !Number.isInteger(amount) || amount < 5000 || amount > 9999 ||
      !secretEqual(proof,tag(db,code+':'+amount))) fail(400,'Reveal a valid coupon first.');
  const service = SERVICES.find(s => s.id === body.service);
  const tier = service?.tiers.find(t => t.name === body.tier);
  const clean = (x,n) => typeof x === 'string' ? x.trim().slice(0,n) : '';
  const name = clean(body.name,90), goal = clean(body.goal,600);
  if (!tier || !name || !goal) fail(400,'Choose a service tier and enter your name and project goal.');
  const net = Math.max(0,tier.price-amount);
  const total = net + Math.round(net*BUSINESS.gst/100);
  db.prepare('INSERT OR IGNORE INTO claims (uid,code,email,name,business,goal,service,tier,amount,price,total,created,followup,paid) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(user.uid,code,user.email,name,clean(body.business,100),goal,service.id,tier.name,amount,tier.price,total,new Date().toISOString(),new Date(Date.now()+86400000).toISOString().slice(0,10),Number(total===0));
  const row = own(db,user.uid);
  if (!row) fail(409,'This coupon has already been claimed by another account.');
  return row;
}
export async function markOfferPaid(uid, orderId) {
  const db = await database();
  db.prepare('UPDATE claims SET paid=1 WHERE uid=? AND orderId=?').run(uid,orderId);
}
export async function offers(req, path, { readJson, razorpay, sign, keyId, payments, limit }) {
  const db = await database();
  if (path === '/api/offers/draw' && req.method === 'POST') { limit(req); return draw(db); }
  if (path === '/api/offers/admin') {
    if (!process.env.OFFER_ADMIN_KEY || !secretEqual(req.headers['x-offer-admin-key'],process.env.OFFER_ADMIN_KEY)) fail(403,'An offer admin key is required.');
    if (req.method === 'GET') return db.prepare('SELECT * FROM claims ORDER BY followup,created DESC').all();
    if (req.method === 'POST') {
      const {uid,followup,note} = await readJson(req);
      if (typeof uid !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(followup) || typeof note !== 'string' || note.length>2000) fail(400,'Enter a follow-up date and a note of up to 2000 characters.');
      if (!db.prepare('UPDATE claims SET followup=?, note=? WHERE uid=?').run(followup,note,uid).changes) fail(404,'Lead not found.');
      return { ok:true };
    }
    fail(405,'Method not allowed.');
  }
  const user = await identity(req);
  if (path === '/api/offers/me' && req.method === 'GET') return { claim: own(db,user.uid) || null };
  if (path === '/api/offers/claim' && req.method === 'POST') return claimOffer(db,user,await readJson(req));
  if (path !== '/api/offers/pay' || req.method !== 'POST') fail(404,'Not found.');
  const row = own(db,user.uid);
  if (!row) fail(404,'Claim your offer first.');
  if (row.paid) return { paid:true };
  if (!payments) fail(503,'Online payments are unavailable. Your claim is saved.');
  if (!row.orderId) {
    const order = await razorpay('/orders',{ amount:row.total*100,currency:'INR',receipt:row.code });
    // Only the winning order is exposed to clients, even on concurrent retries.
    db.prepare('UPDATE claims SET orderId=? WHERE uid=? AND orderId IS NULL').run(order.id,user.uid);
  }
  const id = own(db,user.uid).orderId;
  const order = await razorpay('/orders/'+encodeURIComponent(id));
  if (order.status === 'paid') { await markOfferPaid(user.uid,id); return { paid:true }; }
  return { keyId, orderId:id, amount:row.total*100,currency:'INR',
    ticket:sign({k:'ticket',o:id,offerUid:user.uid,rest:[],exp:Date.now()+7*86400000}) };
}
