import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditSeo } from '../server/seo-audit.mjs';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));

test('published site passes on-page and off-page SEO setup', () => {
  const report = auditSeo(dist);
  const failed = [...report.onPage, ...report.offPage].filter(c => !c.ok).map(c => `${c.name}: ${c.detail}`);
  assert.deepEqual(failed, []);
  assert.ok(report.onPage.length >= 16);
  assert.ok(report.offPage.length >= 8);
  assert.equal(report.ok, true);
});

test('a page missing its canonical fails the on-page check', () => {
  const root = mkdtempSync(join(tmpdir(), 'vx-seo-'));
  const page = `<!doctype html><title>Short</title><h1>Hi</h1><img src="/a.png">`;
  for (const file of ['index.html', 'services/seo/index.html', 'faq/index.html', 'blog/index.html']) {
    mkdirSync(join(root, file, '..'), { recursive: true });
    writeFileSync(join(root, file), page);
  }
  writeFileSync(join(root, 'sitemap.xml'), '');
  writeFileSync(join(root, 'robots.txt'), '');
  writeFileSync(join(root, 'llms.txt'), '');
  const report = auditSeo(root, 'https://example.test');
  assert.equal(report.ok, false);
  assert.equal(report.onPage.find(c => c.name === 'Home canonical').ok, false);
  assert.equal(report.onPage.find(c => c.name === 'Home image alt text').ok, false);
  assert.equal(report.offPage.find(c => c.name === 'Google Business Profile').ok, false);
});

test('live crawl follows public links, records broken destinations and respects robots', async () => {
  const { crawlSite } = await import('../server/seo-crawl.mjs');
  const routes = {
    '/robots.txt': 'User-agent: *\nDisallow: /hidden',
    '/sitemap.xml': '<urlset><url><loc>https://example.test/</loc></url></urlset>',
    '/': '<title>Home</title><a href="/missing">Broken</a><a href="/hidden">Private</a><a href="https://other.test/">External</a>',
  };
  const result = await crawlSite('https://example.test', async url => {
    assert.equal(new URL(url).origin, 'https://example.test');
    const body = routes[new URL(url).pathname];
    return new Response(body, { status: body ? 200 : 404, headers: { 'content-type': 'text/html' } });
  });
  assert.deepEqual(result.pages.map(p => p.path), ['/', '/missing']);
  assert.deepEqual(result.pages[1].sources, ['/']);
  assert.ok(result.issues.some(i => i.path === '/missing' && i.message.includes('404')));
});
