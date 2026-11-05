import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';
import { publicAuditShell } from '../server/seo-public-view.mjs';
import { auditPublicSite } from '../server/seo-public-crawl.mjs';
import { buildInternalIntelligence } from '../server/seo-intelligence.mjs';
import { csvDocument, filterPages } from '../dist/js/seo-audit-data.js';

test('CSV safely preserves quotes, newlines, Unicode and numeric values', () => {
  const csv = csvDocument(['URL', 'Evidence'], [['https://example.com/', 'Tamil தமிழ், "quoted"\nnext line'], ['=HYPERLINK("bad")', -4], [' \t+SUM(A1)', null]]);
  assert.ok(csv.startsWith('\uFEFF"URL","Evidence"\r\n'));
  assert.ok(csv.includes('"Tamil தமிழ், ""quoted""\nnext line"'));
  assert.ok(csv.includes('"\'=HYPERLINK(""bad"")","-4"'));
  assert.ok(csv.includes('"\' \t+SUM(A1)",""'));
  assert.equal(filterPages({ pages: [{ url: 'https://example.com/', status: 200, indexable: true }, { url: 'https://example.com/broken', status: 404 }] }, { status: 'failed' }).length, 1);
});

async function fixture() {
  const request = async url => {
    const { origin, pathname, hostname } = new URL(url);
    const ok = pathname === '/' || pathname === '/about';
    const body = ok ? `<html lang="en"><head><title>${hostname === 'example.com' ? 'Website design' : 'Hosting automation'}</title><meta name="description" content="Source description"><link rel="canonical" href="${url}"></head><body><h1>${hostname === 'example.com' ? 'Website design' : 'Hosting automation'}</h1><p>Useful source content.</p><a href="${origin}/about">About</a><a href="https://example.com/">Example business</a><img src="/image.jpg"></body></html>` : '';
    return { url, status: ok ? 200 : 404, ok, text: body, bytes: body.length, responseMs: 120, redirects: [], headers: new Headers({ 'content-type': 'text/html' }) };
  };
  const target = await auditPublicSite('https://example.com/', { request, maxPages: 10 });
  const competitor = await auditPublicSite('https://competitor.com/', { request, maxPages: 10 });
  const id = 'a'.repeat(40);
  return { id, status: 'complete', expiresAt: new Date(Date.now() + 86400000).toISOString(), report: { id, target, competitors: [competitor], finishedAt: new Date().toISOString(), methodology: 'Measured source checks.', intelligence: buildInternalIntelligence([target, competitor]) } };
}

test('workspace supports report investigation, exports, sharing, history, fresh rescans and cancellation', async t => {
  const completed = await fixture(), queuedId = 'b'.repeat(40);
  const { window, document } = parseHTML(publicAuditShell());
  const location = { origin: 'https://vintorex.test', pathname: '/seo-audit', search: '', hash: '#audit-' + completed.id };
  const storage = new Map(), calls = [], downloads = [];
  let copied, scan = 'complete';
  const form = document.querySelector('form');
  form.elements = Object.fromEntries([...form.querySelectorAll('[name]')].map(el => [el.name, el]));
  // Linkedom supplies DOM events; these native browser-only capabilities are adapters.
  const selectProto = Object.getPrototypeOf(form.elements.maxPages);
  const selectValue = Object.getOwnPropertyDescriptor(selectProto, 'value');
  Object.defineProperty(selectProto, 'value', { configurable: true, get: selectValue.get, set(value) { for (const option of this.querySelectorAll('option')) option.selected = option.value === value; } });
  t.after(() => Object.defineProperty(selectProto, 'value', selectValue));
  form.reset = () => { for (const input of form.querySelectorAll('input')) input.value = ''; form.elements.maxPages.value = '25'; };
  const dialog = document.querySelector('dialog');
  dialog.showModal = () => { dialog.open = true; }; dialog.close = () => { dialog.open = false; };
  const originals = new Map();
  const globals = {
    window, document, location,
    history: { replaceState(_state, _unused, url) { location.hash = url.startsWith('#') ? url : ''; } },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    navigator: { clipboard: { writeText: async text => { copied = text; } } },
    FormData: class {
      constructor(element) { this.fields = [...element.querySelectorAll('[name]')].map(field => [field.name, field.value]); }
      [Symbol.iterator]() { return this.fields[Symbol.iterator](); }
    },
    fetch: async (url, options = {}) => {
      calls.push({ url, ...options });
      const data = url.endsWith('/cancel') ? { id: queuedId, status: 'cancelled', input: { url: 'https://example.com/', competitors: [], maxPages: 10 }, error: 'Audit stopped.' } :
        options.method === 'POST' ? { id: queuedId, status: 'queued' } : scan === 'complete' ? completed : { id: queuedId, status: 'running', progress: { pages: 1, maxPages: 10 } };
      return { ok: true, json: async () => data };
    },
  };
  for (const [key, val] of Object.entries(globals)) { originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: val }); }
  const oldCreate = URL.createObjectURL, oldRevoke = URL.revokeObjectURL;
  URL.createObjectURL = blob => { downloads.push(blob); return 'blob:test'; }; URL.revokeObjectURL = () => {};
  t.after(() => { window.dispatchEvent(new window.Event('pagehide')); URL.createObjectURL = oldCreate; URL.revokeObjectURL = oldRevoke; for (const [key, descriptor] of originals) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } });
  const $ = selector => document.querySelector(selector);
  const click = selector => { assert.ok($(selector), selector); $(selector).click(); };
  const until = async predicate => { for (let i = 0; i < 100; i++) { if (predicate()) return; await new Promise(resolve => setTimeout(resolve, 5)); } assert.fail('Workspace did not reach expected state: ' + $('#workspace-feedback').textContent + ' ' + $('#audit-error').textContent); };
  await import('../dist/js/seo-audit.js?workspace-test');
  await until(() => $('#report-status').textContent === 'Report ready' || !$('#audit-error').hidden);
  assert.equal($('#audit-error').hidden, true, $('#audit-error').textContent);
  assert.equal($('#report-heading').textContent, 'example.com');
  assert.equal($('#download-report').getAttribute('href'), '/api/seo/audits/' + completed.id + '/report.pdf');
  click('#tab-issues');
  const total = document.querySelectorAll('tbody tr').length;
  assert.ok(total > 0);
  click('[data-review]');
  assert.ok(JSON.parse(storage.get('vx_seo_review_' + completed.id)).length === 1);
  const review = $('[data-filter="review"]'); review.value = 'reviewed'; review.dispatchEvent(new window.Event('input'));
  assert.equal(document.querySelectorAll('tbody tr').length, 1);
  click('#export-csv');
  assert.ok((await downloads[0].text()).includes('Reviewed'));
  click('#tab-pages'); click('[data-inspect]');
  assert.equal(dialog.open, true); assert.ok(dialog.textContent.includes('Website design')); click('[data-close-dialog]'); assert.equal(dialog.open, false);
  click('#tab-content');
  const kind = $('[data-filter="kind"]'); kind.value = 'gaps'; kind.dispatchEvent(new window.Event('input'));
  assert.ok($('#view-content').textContent.includes('hosting'));
  click('#tab-competitors'); assert.ok($('#view-content').textContent.includes('competitor.com'));
  click('#tab-links'); assert.ok($('#view-content').textContent.includes('Example business'));
  click('#tab-access'); assert.ok($('#view-content').textContent.includes('Googlebot'));
  click('#share-report'); await until(() => Boolean(copied)); assert.equal(copied, 'https://vintorex.test/seo-audit#audit-' + completed.id);
  click('#tab-reports'); assert.ok($('[data-history-open]'));
  click('[data-history-remove]'); assert.equal($('[data-history-open]'), null);
  scan = 'running'; click('#run-again');
  await until(() => $('#report-status').textContent === 'Scanning');
  const post = calls.find(call => call.url === '/api/seo/audits');
  assert.equal(JSON.parse(post.body).force, true);
  assert.equal(JSON.parse(post.body).url, 'https://example.com/');
  assert.equal($('#download-report').hidden, true);
  click('#cancel-audit'); await until(() => $('#report-status').textContent === 'Scan stopped');
  assert.equal($('#audit-submit').disabled, false);
  assert.ok(calls.some(call => call.url.endsWith('/' + queuedId + '/cancel') && call.method === 'POST'));
  click('#new-audit');
  form.elements.url.value = '  example.com  ';
  form.elements.competitor1.value = ' competitor.com ';
  form.elements.maxPages.value = '40';
  form.dispatchEvent(new window.Event('submit', { cancelable: true }));
  await until(() => $('#report-status').textContent === 'Scanning');
  const submission = JSON.parse(calls.findLast(call => call.url === '/api/seo/audits').body);
  assert.deepEqual(submission, { url: 'example.com', competitors: ['competitor.com'], maxPages: 40, force: false });
  click('#cancel-audit'); await until(() => $('#report-status').textContent === 'Scan stopped');
});
