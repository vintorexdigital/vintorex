import { DatabaseSync } from 'node:sqlite';
import { randomBytes, createHash } from 'node:crypto';
import { mkdirSync, chmodSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { auditUrl, publicAddress } from './seo-fetch.mjs';
import { auditPublicSite } from './seo-public-crawl.mjs';
import { buildInternalIntelligence } from './seo-intelligence.mjs';

const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
let db, active = 0;
const queue = [];
const controllers = new Map();
const ttl = 24 * 60 * 60 * 1000;
const methodology = 'Audit health is our weighted pass rate across observed checks (Error weight 5, Warning 2, Notice 1). Editorial thresholds flag review opportunities. This score summarizes observed technical checks. Competitor measurements use the same page limit, but discovered sites and sampled pages differ. Content terms and cross-domain links are indexed by the project’s own crawler. Backlink observations are limited to the crawled sample.';

function database() {
  if (db) return db;
  const file = resolve(process.env.SEO_PUBLIC_DB_PATH || 'var/seo-public.sqlite');
  mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
  db = new DatabaseSync(file); chmodSync(file, 0o600);
  db.exec(`PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS audits (id TEXT PRIMARY KEY, signature TEXT NOT NULL, created INTEGER NOT NULL, status TEXT NOT NULL, data TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS audits_signature ON audits(signature, created);`);
  db.prepare("UPDATE audits SET status='failed', data=? WHERE status IN ('queued','running')").run(JSON.stringify({ error: 'The audit server restarted. Please start a new report.' }));
  return db;
}
function save(id, status, value) { database().prepare('UPDATE audits SET status=?,data=? WHERE id=?').run(status, JSON.stringify(value), id); }
export function getPublicAudit(id) {
  if (!/^[a-f0-9]{40}$/.test(id)) fail(404, 'Report not found.');
  const row = database().prepare('SELECT * FROM audits WHERE id=? AND created>?').get(id, Date.now() - ttl);
  if (!row) fail(404, 'This report is unavailable or has expired. Start a new audit.');
  const data = JSON.parse(row.data);
  if (data.report) {
    const sites = [data.report.target, ...data.report.competitors];
    // Reports created by the earlier optional integration keep their crawl evidence only.
    for (const site of sites) delete site.semrush;
    delete data.report.region;
    data.report.methodology = methodology;
    data.report.intelligence = buildInternalIntelligence(sites);
  }
  return { id, status: row.status, createdAt: new Date(row.created).toISOString(), expiresAt: new Date(row.created + ttl).toISOString(), ...data };
}
export async function startPublicAudit(body) {
  const target = auditUrl(body.url);
  if (!Array.isArray(body.competitors || []) || (body.competitors || []).length > 2) fail(400, 'Add up to two competitor websites.');
  const competitors = (body.competitors || []).filter(Boolean).map(value => auditUrl(value));
  const urls = [target, ...competitors];
  if (new Set(urls.map(url => url.hostname.replace(/^www\./, ''))).size !== urls.length) fail(400, 'Use a different domain for each competitor.');
  const maxPages = [10, 25, 40].includes(Number(body.maxPages)) ? Number(body.maxPages) : 25;
  await Promise.race([
    Promise.all(urls.map(url => publicAddress(url.hostname))),
    new Promise((_, reject) => { const timer = setTimeout(() => reject(Object.assign(new Error('Domain lookup timed out. Please try again.'), { status: 422 })), 8000); timer.unref(); }),
  ]);
  const store = database();
  store.prepare('DELETE FROM audits WHERE created<?').run(Date.now() - ttl);
  const signature = createHash('sha256').update(JSON.stringify({ version: 2, urls: urls.map(u => u.href), maxPages })).digest('hex');
  const cached = store.prepare("SELECT id FROM audits WHERE signature=? AND created>? AND status IN ('queued','running','complete') ORDER BY created DESC LIMIT 1").get(signature, Date.now() - 10 * 60 * 1000);
  if (cached && body.force !== true) return getPublicAudit(cached.id);
  if (queue.length + active >= 8) fail(503, 'The public audit queue is full. Please try again shortly.');
  const id = randomBytes(20).toString('hex');
  const input = { url: target.href, competitors: competitors.map(url => url.href), maxPages };
  const data = { input, progress: { message: 'Waiting to start the live crawl.', domains: urls.length, domainIndex: 0, pages: 0, maxPages } };
  store.prepare('INSERT INTO audits (id,signature,created,status,data) VALUES (?,?,?,?,?)').run(id, signature, Date.now(), 'queued', JSON.stringify(data));
  queue.push({ id, urls: urls.map(u => u.href), maxPages, input });
  drain();
  return getPublicAudit(id);
}
function drain() {
  while (active < 2 && queue.length) {
    const task = queue.shift(); active++;
    run(task).catch(error => {
      if (getPublicAudit(task.id).status === 'cancelled') return;
      try { save(task.id, 'failed', { error: error.message || 'The audit could not finish.' }); }
      catch { console.error('Could not persist a public SEO audit failure.'); }
    }).finally(() => { active--; drain(); });
  }
}
export function cancelPublicAudit(id) {
  const job = getPublicAudit(id);
  if (!['queued', 'running'].includes(job.status)) fail(409, 'This audit has already finished.');
  const index = queue.findIndex(task => task.id === id);
  if (index >= 0) queue.splice(index, 1);
  controllers.get(id)?.abort();
  save(id, 'cancelled', { input: job.input, error: 'Audit stopped. You can update the settings and run it again.' });
  return getPublicAudit(id);
}
async function run(task) {
  const controller = new AbortController();
  controllers.set(task.id, controller);
  try {
    const sites = [];
    for (let index = 0; index < task.urls.length; index++) {
      if (controller.signal.aborted) return;
      const url = task.urls[index];
      const progress = info => {
        if (!controller.signal.aborted) save(task.id, 'running', { input: task.input, progress: { message: 'Crawling ' + new URL(url).hostname, domains: task.urls.length, domainIndex: index, ...info } });
      };
      progress({ pages: 0, maxPages: task.maxPages });
      const site = await auditPublicSite(url, { maxPages: task.maxPages, onProgress: progress, signal: controller.signal });
      if (controller.signal.aborted) return;
      sites.push(site);
    }
    const report = { id: task.id, input: task.input, target: sites[0], competitors: sites.slice(1), finishedAt: new Date().toISOString(), methodology, intelligence: buildInternalIntelligence(sites) };
    save(task.id, 'complete', { input: task.input, report });
  } finally { controllers.delete(task.id); }
}
