import { load } from 'cheerio';
import robotsParser from 'robots-parser';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { canonicalPath, isPrivate } from '../dist/js/routes.js';

const day = 86400000;
const limit = 400;
const auditVersion = 2;
const agent = 'VintorexAudit';

export async function crawlSite(site, request = fetch) {
  const origin = new URL(site).origin;
  async function get(path) {
    const response = await request(origin + path, {
      redirect: 'manual', signal: AbortSignal.timeout(12000), headers: { 'user-agent': agent }
    });
    return response;
  }
  const pages = [];
  const issues = [];
  const queue = new Map();
  const titles = new Map();
  const descriptions = new Map();
  const issue = (path, severity, message) => issues.push({ path, severity, message });
  const robotsResponse = await get('/robots.txt');
  if (!robotsResponse.ok && robotsResponse.status !== 404) throw Error('Could not read robots.txt (HTTP ' + robotsResponse.status + ').');
  const robots = robotsParser(origin + '/robots.txt', robotsResponse.ok ? await robotsResponse.text() : '');
  function enqueue(href, base, parent) {
    let url;
    try { url = new URL(href, origin + base); } catch { return; }
    const path = url.pathname;
    // Cloudflare rewrites mailto links into fragment payloads decoded in the browser.
    if (path === '/cdn-cgi/l/email-protection' && /^#(?:[a-f0-9]{2}){2,}$/i.test(url.hash)) return;
    if (url.origin !== origin || url.search || /^\/\/|^\/api(?:\/|$)/i.test(path) || isPrivate(path) ||
        /\.[a-z0-9]{1,7}$/i.test(path) && !/\.html?$/i.test(path) || robots.isAllowed(origin + path, agent) === false) return;
    if (!queue.has(path)) queue.set(path, new Set());
    if (parent) queue.get(path).add(parent);
  }
  enqueue('/', '/', null);
  const sitemap = await get('/sitemap.xml');
  const mapped = new Set();
  if (sitemap.ok) {
    const xml = load(await sitemap.text(), { xmlMode: true });
    for (const loc of xml('url > loc').map((_, el) => xml(el).text()).get()) {
      enqueue(loc, '/', null);
      mapped.add(loc);
    }
  }
  if (!mapped.size) issue('/sitemap.xml', 'Error', 'Publish a readable URL sitemap.');
  for (const [path] of queue) {
    if (pages.length >= limit) break;
    const page = { path, status: null, title: '' };
    pages.push(page);
    try {
      const start = Date.now();
      const res = await get(path);
      page.status = res.status;
      page.responseMs = Date.now() - start;
      if (!res.ok) {
        const location = res.headers.get('location');
        if (location && res.status < 400) enqueue(location, path, path);
        issue(path, res.status >= 400 ? 'Error' : 'Warning', location ? 'Update links to the final destination: ' + location : 'Repair the HTTP ' + res.status + ' response or remove links to this page.');
        await res.body?.cancel();
        continue;
      }
      if (!res.headers.get('content-type')?.includes('text/html')) { await res.body?.cancel(); continue; }
      const html = await res.text();
      const $ = load(html);
      page.title = $('title').first().text().trim();
      const description = $('meta[name="description" i]').attr('content')?.trim();
      for (const [value, index, label] of [[page.title, titles, 'title'], [description, descriptions, 'meta description']]) {
        if (!value) issue(path, 'Error', 'Add a descriptive ' + label + '.');
        else if (index.has(value)) issue(path, 'Warning', 'Write a unique ' + label + '. Also used on ' + index.get(value));
        else index.set(value, path);
      }
      const canonical = $('link[rel~="canonical" i]').attr('href');
      const expected = origin + canonicalPath(path);
      const canonicalMatches = canonical && new URL(canonical, origin + path).href === expected;
      if (!canonicalMatches) issue(path, 'Warning', 'Review the canonical URL: ' + (canonical || 'missing'));
      if ($('h1').length !== 1) issue(path, 'Warning', 'Use one main heading. Found ' + $('h1').length + '.');
      if ($('img:not([alt])').length) issue(path, 'Warning', 'Add alt attributes to ' + $('img:not([alt])').length + ' images.');
      if (!$('meta[name="viewport" i]').length) issue(path, 'Warning', 'Add a mobile viewport declaration.');
      if (!$('html').attr('lang')) issue(path, 'Warning', 'Declare the document language.');
      if (!mapped.has(canonicalMatches ? expected : origin + path)) issue(path, 'Notice', 'Review this page for inclusion in the sitemap.');
      if (/noindex|\bnone\b/i.test(($('meta[name="robots" i]').attr('content') || '') + ' ' + (res.headers.get('x-robots-tag') || ''))) issue(path, 'Warning', 'Review the directive preventing indexing.');
      if ($('[src^="http://"]').length) issue(path, 'Warning', 'Serve embedded resources over HTTPS.');
      if (page.responseMs > 1500) issue(path, 'Warning', 'Investigate slow server response (' + page.responseMs + ' ms).');
      for (const node of $('script[type="application/ld+json"]')) {
        try { JSON.parse($(node).text()); } catch { issue(path, 'Error', 'Correct invalid JSON-LD.'); break; }
      }
      for (const el of $('a[href]')) enqueue($(el).attr('href'), path, path);
    } catch { issue(path, 'Error', 'Page retrieval or HTML analysis failed. Check this URL.'); }
  }
  for (const page of pages) {
    page.sources = [...queue.get(page.path)].filter(source => source !== page.path);
    if (!page.sources.length && page.path !== '/' && mapped.has(origin + page.path) && queue.size === pages.length)
      issue(page.path, 'Notice', 'No crawled page links here. Review internal navigation.');
  }
  return { pages, issues, discovered: queue.size };
}

export function trackSeo(site) {
  const folder = dirname(resolve(process.env.APP_DB_PATH || 'var/app.sqlite'));
  mkdirSync(folder, { recursive: true });
  const db = new DatabaseSync(resolve(folder, 'seo-history.sqlite'));
  db.exec('CREATE TABLE IF NOT EXISTS crawl (started INTEGER PRIMARY KEY, result TEXT NOT NULL)');
  const latest = () => db.prepare('SELECT * FROM crawl ORDER BY started DESC LIMIT 1').get();
  let running = false;
  async function tick() {
    if (running) return;
    const previous = latest();
    const saved = previous && JSON.parse(previous.result);
    const delay = saved?.error ? 3600000 : day;
    if (saved?.version === auditVersion && Date.now() - previous.started < delay) return;
    running = true;
    const started = Date.now();
    try {
      let result;
      try { result = await crawlSite(site); } catch (e) { result = { error: e.message }; }
      db.prepare('INSERT INTO crawl VALUES (?, ?)').run(started, JSON.stringify({ ...result, version: auditVersion }));
      db.exec('DELETE FROM crawl WHERE started NOT IN (SELECT started FROM crawl ORDER BY started DESC LIMIT 30)');
    } catch (e) { console.error('SEO history:', e.message); } finally { running = false; }
  }
  setInterval(tick, 60000).unref();
  void tick();
  return (selected) => {
    const history = db.prepare("SELECT started, json_array_length(result,'$.pages') pages, json_array_length(result,'$.issues') issues, json_extract(result,'$.error') error FROM crawl ORDER BY started DESC").all();
    const run = selected ? db.prepare('SELECT * FROM crawl WHERE started=?').get(Number(selected)) : latest();
    return { running, history, result: run && JSON.parse(run.result), started: run?.started };
  };
}
