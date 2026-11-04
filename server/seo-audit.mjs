// On-page and off-page SEO setup check for the published site.
// On-page: titles, descriptions, headings, canonicals, Open Graph, structured data, alt text, sitemap.
// Off-page: the signals this site controls — identity, citations (name, address, phone), social profiles,
// Google Business Profile, crawler access and the plain-text map for assistants.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { publicAuditShell } from './seo-public-view.mjs';
import { BUSINESS } from '../dist/js/data.js';

const PAGES = [
  ['Home', 'index.html', '/'],
  ['SEO service', 'services/seo/index.html', '/services/seo/'],
  ['FAQ', 'faq/index.html', '/faq/'],
  ['Blog', 'blog/index.html', '/blog/'],
];

const decode = value => String(value || '')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const attr = (html, re) => decode(html.match(re)?.[1] || '');
const esc = value => String(value).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

export function auditSeo(dist, site = 'https://vintorex.com') {
  const checks = [];
  const add = (group, name, ok, detail) => checks.push({ group, name, ok: Boolean(ok), detail });
  const read = rel => {
    const file = join(dist, rel);
    return existsSync(file) ? readFileSync(file, 'utf8') : null;
  };
  const sitemap = read('sitemap.xml') || '';
  const robots = read('robots.txt') || '';
  const llms = read('llms.txt') || '';

  for (const [label, file, path] of PAGES) {
    const html = read(file);
    if (!html) { add('on-page', `${label} page`, false, `${file} is missing. Run npm run build:blog.`); continue; }
    const title = attr(html, /<title>([^<]*)<\/title>/);
    const description = attr(html, /<meta name="description" content="([^"]*)"/);
    const canonical = attr(html, /<link rel="canonical" href="([^"]+)"/);
    const h1 = html.match(/<h1[\s>]/g) || [];
    const images = [...html.matchAll(/<img\b[^>]*>/gi)].map(m => m[0]);
    const missingAlt = images.filter(tag => !/\salt=(?:"[^"]*"|'[^']*')/.test(' ' + tag)).length;
    add('on-page', `${label} title`, title.length >= 15 && title.length <= 80, title ? `${title.length} characters` : 'missing');
    add('on-page', `${label} description`, description.length >= 50 && description.length <= 320, description ? `${description.length} characters` : 'missing');
    add('on-page', `${label} heading`, h1.length === 1, `${h1.length} h1`);
    add('on-page', `${label} canonical`, canonical === site + path, canonical || 'missing');
    add('on-page', `${label} Open Graph`, ['og:title', 'og:description', 'og:image', 'og:url'].every(p => html.includes(`property="${p}"`)), 'title, description, image, url');
    add('on-page', `${label} structured data`, html.includes('application/ld+json'), 'JSON-LD');
    add('on-page', `${label} image alt text`, images.length > 0 && missingAlt === 0, missingAlt ? `${missingAlt} image${missingAlt === 1 ? '' : 's'} without alt` : `${images.length} images`);
    const loc = path === '/' ? `${site}/` : `${site}${path}`;
    add('on-page', `${label} in sitemap`, sitemap.includes(loc), loc);
  }

  const home = read('index.html') || '';
  const seoPage = read('services/seo/index.html') || '';
  add('off-page', 'Business name, address and phone', [BUSINESS.name, BUSINESS.postal.street, BUSINESS.phone, BUSINESS.email].every(part => home.includes(part)), BUSINESS.address);
  add('off-page', 'Google Business Profile', home.includes(BUSINESS.google) && home.includes(BUSINESS.maps), BUSINESS.google);
  for (const [network, url] of Object.entries(BUSINESS.social)) {
    add('off-page', `${network} profile`, url.startsWith('https://') && home.includes(url), url);
  }
  add('off-page', 'Profiles in structured data', home.includes('"sameAs"') && Object.values(BUSINESS.social).every(url => home.includes(url)) && home.includes(BUSINESS.google), 'sameAs');
  add('off-page', 'WhatsApp contact', home.includes(BUSINESS.whatsapp), BUSINESS.whatsapp);
  add('off-page', 'Assistant map', llms.includes(BUSINESS.name) && llms.includes(BUSINESS.phone) && llms.includes('/services/seo'), `${site}/llms.txt`);
  add('off-page', 'Crawlers can read public pages', robots.includes('Sitemap:') && !/Disallow:\s*\/services/.test(robots) && !/Disallow:\s*\/blog/.test(robots), 'robots.txt allows /services and /blog');
  add('off-page', 'Private pages stay out of search', ['/api/', '/admin', '/account', '/cart', '/checkout'].every(p => robots.includes(`Disallow: ${p}`)), 'api, admin, account, cart, checkout');
  add('off-page', 'Outbound competitor links are nofollow', /rel="noopener nofollow"/.test(seoPage), 'service comparison sources');

  const onPage = checks.filter(c => c.group === 'on-page');
  const offPage = checks.filter(c => c.group === 'off-page');
  return {
    ok: checks.every(c => c.ok),
    onPage,
    offPage,
    passed: checks.filter(c => c.ok).length,
    total: checks.length,
  };
}

function crawlHtml(state) {
  if (!state) return '';
  const { running, history, result, started } = state;
  const date = time => new Date(time).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  const historyRows = history.map(run => `<li><a href="/seo-audit?run=${run.started}">${date(run.started)}</a> · ${run.error ? 'Crawl failed' : run.pages + ' pages · ' + run.issues + ' findings'}</li>`).join('');
  let detail = running ? '<p>A crawl is in progress. Refresh to see its results.</p>' : '';
  if (result?.error) detail += `<p>Crawl failed. ${esc(result.error)} The scheduler retries in one hour.</p>`;
  if (result?.pages) {
    const rows = ['Error', 'Warning', 'Notice'].flatMap(level => result.issues.filter(i => i.severity === level)).map(i => `<tr><td>${esc(i.severity)}</td><td>${esc(i.path)}</td><td>${esc(i.message)}</td></tr>`).join('');
    const previous = history.find(run => run.started < started && !run.error);
    const delta = result.issues.length - (previous?.issues || 0);
    detail += `<h3>Report from ${date(started)}</h3><p>${result.pages.length} of ${result.discovered} discovered URLs crawled · ${result.issues.length} findings${previous ? ' · ' + (delta > 0 ? '+' : '') + delta + ' since the previous successful crawl' : ''}.</p>
    <h3>Findings</h3>${rows ? '<div class="table-wrap scroll"><table class="table"><thead><tr><th>Priority</th><th>Page</th><th>Suggested action</th></tr></thead><tbody>' + rows + '</tbody></table></div>' : '<p>No issues found by these checks.</p>'}
    <details><summary>Crawled URLs and incoming links</summary><ul>${result.pages.map(p => `<li>${esc(p.path)} · HTTP ${esc(p.status ?? 'unavailable')} · ${esc(p.title)}<br>Linked from: ${esc(p.sources.join(', ') || 'No referring page found')}</li>`).join('')}</ul></details>`;
  }
  return `<section class="card pad"><h2>Live site crawl</h2><p>Vintorex checks its public pages daily, following its sitemap and internal links. Each crawl covers up to 400 URLs. The most recent 30 runs are kept.</p>${detail}
  <h3>Crawl history</h3>${historyRows ? '<ul>' + historyRows + '</ul>' : '<p>The first report will appear here when the crawl finishes.</p>'}</section>`;
}

export function seoReportHtml(report, state) {
  const rows = list => list.map(c => `<tr><td>${c.ok ? '<span class="yes" aria-label="Pass">✓</span>' : '<span class="no" aria-label="Fail">—</span>'}</td><td>${esc(c.name)}</td><td>${esc(c.detail)}</td></tr>`).join('');
  const block = (title, list) => `<section class="card pad"><h2>${esc(title)}</h2><p class="muted">${list.filter(c => c.ok).length} of ${list.length} checks passed.</p><div class="table-wrap scroll"><table class="table"><thead><tr><th></th><th>Check</th><th>Detail</th></tr></thead><tbody>${rows(list)}</tbody></table></div></section>`;
  return publicAuditShell(`
    ${crawlHtml(state)}
    <h2>Published site setup</h2>
    <p class="lead">${report.passed} of ${report.total} published-site checks passed.</p>
    <div class="cards2">${block('On-page', report.onPage)}${block('Off-page', report.offPage)}</div>
  `);
}
