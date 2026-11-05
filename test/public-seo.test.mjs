import test from 'node:test';
import assert from 'node:assert/strict';
import { auditUrl, publicAddress } from '../server/seo-fetch.mjs';
import { auditPublicSite } from '../server/seo-public-crawl.mjs';
import { extractContentTerms, buildInternalIntelligence } from '../server/seo-intelligence.mjs';
import { auditPdf } from '../server/seo-report-pdf.mjs';
import { seoReportHtml, auditSeo } from '../server/seo-audit.mjs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

test('public audits reject local destinations and DNS answers on every supported input form', async () => {
  for (const url of ['http://127.0.0.1', 'http://2130706433', 'http://[::1]', 'http://localhost', 'http://app.local', 'file:///etc/passwd', 'https://user:password@example.com', 'https://example.com:8443']) {
    assert.throws(() => auditUrl(url), { status: 422 }, url);
  }
  assert.equal(auditUrl('example.com/page?token=secret#fragment').href, 'https://example.com/page');
  assert.equal(await publicAddress('example.com', async () => [{ address: '93.184.216.34' }]), '93.184.216.34');
  for (const address of ['127.0.0.1', '169.254.169.254', '10.0.0.1', '192.168.1.1', '100.64.0.1', '::ffff:127.0.0.1']) {
    await assert.rejects(publicAddress('example.com', async () => [{ address }]), { status: 422 });
  }
  await assert.rejects(publicAddress('example.com', async () => [{ address: '93.184.216.34' }, { address: '10.1.1.1' }]), { status: 422 });
});
const origin = 'https://example.com';
const routes = {
  '/robots.txt': 'User-agent: *\nDisallow: /hidden\nUser-agent: OAI-SearchBot\nDisallow: /',
  '/sitemap.xml': '<urlset><url><loc>https://example.com/</loc></url><url><loc>https://example.com/about</loc></url><url><loc>https://example.com/hidden</loc></url></urlset>',
  '/': '<html lang="en"><head><title>Example business homepage title</title><meta name="description" content="A real description observed from a page."><meta name="viewport" content="width=device-width"><link rel="canonical" href="https://example.com/"><script type="application/ld+json">{invalid}</script></head><body><h1>Example</h1><p>Live source words.</p><a href="/about">About</a><a href="/missing">Broken</a><a href="/hidden">Hidden</a><a href="http://127.0.0.1/private">External</a><img src="/missing.jpg"></body></html>',
  '/about': '<html lang="en"><head><title>Example business homepage title</title><meta name="description" content="A real description observed from a page."></head><body><h1>About</h1><p>About this business.</p><a href="/">Home</a></body></html>',
};
async function fakeRequest(url, options = {}) {
  assert.equal(new URL(url).origin, origin);
  assert.notEqual(new URL(url).pathname, '/hidden');
  const body = routes[new URL(url).pathname];
  return { url, status: body ? 200 : 404, ok: Boolean(body), text: body || '', bytes: body?.length || 0, headers: new Headers({ 'content-type': new URL(url).pathname.endsWith('.xml') ? 'application/xml' : 'text/html' }), responseMs: 121, redirects: [] };
}
test('live audit follows links and sitemaps, respects robots, and preserves measured evidence', async () => {
  const result = await auditPublicSite(origin, { request: fakeRequest, maxPages: 10 });
  assert.equal(result.coverage.htmlPages, 2);
  assert.equal(result.coverage.crawled, 3);
  assert.equal(result.summary.averageResponseMs, 121);
  assert.ok(result.checks.every(check => typeof check.passed === 'boolean'));
  assert.ok(result.issues.some(issue => issue.code === 'broken-internal-link' && issue.evidence.includes('/missing')));
  assert.ok(result.issues.some(issue => issue.code === 'unique-title'));
  assert.ok(result.issues.some(issue => issue.code === 'schema-valid'));
  assert.ok(result.issues.some(issue => issue.code === 'image-alt'));
  assert.ok(result.issues.some(issue => issue.code === 'asset-response'));
  assert.equal(result.crawlerAccess.find(bot => bot.name === 'OAI-SearchBot').allowed, false);
  assert.equal(result.pages.find(page => page.path === '/about').canonical, null);
  assert.ok(result.summary.health >= 0 && result.summary.health < 100);
});
test('blocked or failed crawls produce unavailable health instead of a synthetic score', async () => {
  const result = await auditPublicSite(origin, { request: async url => ({ ...await fakeRequest(url), status: 503, ok: false }) });
  assert.equal(result.summary, null);
  assert.ok(result.error.includes('robots.txt'));
});
test('internal content analysis derives measured topic gaps and backlinks from source evidence', () => {
  assert.equal(extractContentTerms('Website website and design.')[0].count, 2);
  const own = { url: 'https://example.com/', finishedAt: '2026-11-04T10:00:00.000Z', pages: [{
    url: 'https://example.com/', wordCount: 3, title: 'Website design', description: '', h1: ['Website design'],
    contentTerms: extractContentTerms('Website design website'), outboundLinks: [{ url: 'https://unrelated.com/', anchor: 'Other', rel: '' }],
  }] };
  const competitor = { url: 'https://competitor.com/', finishedAt: own.finishedAt, pages: [{
    url: 'https://competitor.com/', wordCount: 4, title: 'Hosting automation', description: '', h1: ['Hosting'],
    contentTerms: extractContentTerms('Hosting automation hosting'), outboundLinks: [
      { url: 'https://example.com/', anchor: 'Example studio', rel: 'nofollow' },
      { url: 'https://example.com/', anchor: 'Repeated link', rel: '' },
    ],
  }] };
  const index = buildInternalIntelligence([own, competitor]);
  assert.equal(index.documents, 2);
  assert.equal(index.sites[0].observedBacklinks.length, 1);
  assert.equal(index.sites[0].referringDomains, 1);
  assert.equal(index.sites[0].observedBacklinks[0].source, 'https://competitor.com/');
  assert.equal(index.sites[0].observedBacklinks[0].rel, 'nofollow');
  assert.equal(index.sites[0].observedBacklinks[0].observedAt, own.finishedAt);
  assert.ok(index.topicGaps.some(gap => gap.term === 'hosting' && gap.occurrences === 2));
  assert.ok(!index.topicGaps.some(gap => gap.term === 'website'));
  assert.equal(buildInternalIntelligence([own]).sites[0].observedBacklinks.length, 0);
});
test('older crawl reports can be indexed internally using their retained metadata', () => {
  const index = buildInternalIntelligence([{ url: 'https://example.com/', finishedAt: '2026-11-04T10:00:00.000Z', pages: [
    { url: 'https://example.com/', wordCount: 4, title: 'Useful legacy guide', h1: ['Legacy guide'], description: 'Useful content' },
  ] }]);
  assert.ok(index.sites[0].topics.some(topic => topic.term === 'legacy'));
  assert.equal(index.sites[0].bodyIndexedPages, 0);
});
test('public report offers the audit form and a downloadable PDF from saved evidence', async () => {
  const html = seoReportHtml(auditSeo(fileURLToPath(new URL('../dist/', import.meta.url))));
  assert.ok(html.includes('id="audit-form"'));
  assert.ok(html.includes('/js/seo-audit.js'));
  assert.ok(html.includes('No sign-in required'));
  assert.ok(!html.includes('Semrush'));
  assert.ok(!html.includes('name="region"'));
  const site = await auditPublicSite(origin, { request: fakeRequest, maxPages: 10 });
  const pdf = await auditPdf({ id: 'sample', target: site, competitors: [site], finishedAt: new Date().toISOString(), methodology: 'Source measurements with a weighted pass rate.' });
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
  assert.ok(pdf.length > 4000);
});

test('existing report databases remain readable after removing the optional integration', async t => {
  const file = join(mkdtempSync(join(tmpdir(), 'vx-internal-seo-')), 'reports.sqlite');
  const previous = process.env.SEO_PUBLIC_DB_PATH;
  process.env.SEO_PUBLIC_DB_PATH = file;
  t.after(() => { if (previous === undefined) delete process.env.SEO_PUBLIC_DB_PATH; else process.env.SEO_PUBLIC_DB_PATH = previous; });
  const db = new DatabaseSync(file);
  db.exec('CREATE TABLE audits (id TEXT PRIMARY KEY,signature TEXT NOT NULL,created INTEGER NOT NULL,status TEXT NOT NULL,data TEXT NOT NULL,provider INTEGER NOT NULL DEFAULT 0)');
  const site = await auditPublicSite(origin, { request: fakeRequest, maxPages: 10 });
  site.semrush = { overview: { organicKeywords: 123 } };
  const id = 'c'.repeat(40);
  db.prepare('INSERT INTO audits VALUES (?,?,?,?,?,?)').run(id, 'legacy', Date.now(), 'complete', JSON.stringify({ report: { id, target: site, competitors: [], methodology: 'Legacy methodology', region: 'in' } }), 1);
  db.close();
  const { getPublicAudit, cancelPublicAudit } = await import('../server/seo-public-jobs.mjs');
  const job = getPublicAudit(id);
  assert.equal(job.status, 'complete');
  assert.equal(job.report.target.semrush, undefined);
  assert.equal(job.report.region, undefined);
  assert.ok(job.report.intelligence.sites[0].topics.length > 0);
  assert.ok(job.report.methodology.includes('own crawler'));
  assert.throws(() => cancelPublicAudit(id), { status: 409 });
  const queuedId = 'd'.repeat(40), input = { url: origin + '/', competitors: [], maxPages: 10 };
  const pending = new DatabaseSync(file);
  pending.prepare('INSERT INTO audits (id,signature,created,status,data) VALUES (?,?,?,?,?)').run(queuedId, 'pending', Date.now(), 'queued', JSON.stringify({ input }));
  pending.close();
  const cancelled = cancelPublicAudit(queuedId);
  assert.equal(cancelled.status, 'cancelled');
  assert.deepEqual(cancelled.input, input);
  assert.equal(getPublicAudit(queuedId).status, 'cancelled');
  assert.throws(() => cancelPublicAudit(queuedId), { status: 409 });
});
