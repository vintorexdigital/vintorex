import { load } from 'cheerio';
import robotsParser from 'robots-parser';
import { createHash } from 'node:crypto';
import { setTimeout as pause } from 'node:timers/promises';
import { auditUrl, fetchAudit } from './seo-fetch.mjs';
import { extractContentTerms } from './seo-intelligence.mjs';
import { isPrivate } from '../dist/js/routes.js';

const agent = 'VintorexAudit';
export const auditGroups = ['Crawlability', 'Metadata', 'Content', 'Internal links', 'Structured data', 'International SEO', 'HTTPS', 'Performance', 'Social sharing'];
const absolute = (value, base) => { if (!value) return null; try { return new URL(value, base).href; } catch { return null; } };
const text = ($, selector) => $(selector).first().text().replace(/\s+/g, ' ').trim();

export async function auditPublicSite(input, { maxPages = 25, request = fetchAudit, onProgress = () => {}, signal } = {}) {
  const startedAt = new Date().toISOString();
  const stop = signal ? AbortSignal.any([signal, AbortSignal.timeout(90000)]) : AbortSignal.timeout(90000);
  let target = auditUrl(input), origin = target.origin, robots, robotsInfo;
  const pages = [], checks = [], mapped = new Set(), queue = new Map(), assets = new Set();
  const add = (url, code, group, label, passed, evidence, recommendation, severity = 'Warning') =>
    checks.push({ url, code, group, label, passed: Boolean(passed), evidence, recommendation, severity });
  try {
    const response = await request(origin + '/robots.txt', { signal: stop });
    if (!response.ok && response.status !== 404) throw Error('robots.txt returned HTTP ' + response.status + '.');
    const final = new URL(response.url);
    if (final.hostname.replace(/^www\./, '') === target.hostname.replace(/^www\./, '')) {
      origin = final.origin; target = new URL(target.pathname, origin);
    }
    robots = robotsParser(origin + '/robots.txt', response.ok ? response.text : '');
    robotsInfo = { url: response.url, status: response.status, available: response.ok };
    add(response.url, 'robots-file', 'Crawlability', 'Readable robots.txt', response.ok, 'HTTP ' + response.status, 'Publish robots.txt to explain crawler access rules.', 'Notice');
  } catch (error) {
    return { url: target.href, startedAt, finishedAt: new Date().toISOString(), error: 'Crawl could not start. ' + error.message, pages, checks, issues: [], summary: null };
  }
  function enqueue(value, base, source = null, depth = 0) {
    const href = absolute(value, base);
    if (!href) return;
    const url = new URL(href);
    if (url.origin !== origin || url.search || isPrivate(url.pathname) || /^\/api(?:\/|$)|^\/cdn-cgi\//i.test(url.pathname) ||
        /\.[a-z0-9]{1,7}$/i.test(url.pathname) && !/\.html?$/i.test(url.pathname) || queue.size >= 1500) return;
    url.hash = '';
    if (robots.isAllowed(url.href, agent) === false) return;
    if (!queue.has(url.href)) queue.set(url.href, { sources: new Set(), depth });
    if (source && source !== url.href) queue.get(url.href).sources.add(source);
  }
  enqueue(target.href, origin);
  enqueue(origin + '/', origin);
  const sitemapQueue = [...new Set([origin + '/sitemap.xml', ...(robots.getSitemaps() || []).filter(url => absolute(url, origin)?.startsWith(origin + '/'))])];
  const sitemapSeen = new Set();
  for (let i = 0; i < sitemapQueue.length && sitemapSeen.size < 4 && !stop.aborted; i++) {
    const url = sitemapQueue[i];
    if (sitemapSeen.has(url) || new URL(url).origin !== origin || robots.isAllowed(url, agent) === false) continue;
    sitemapSeen.add(url);
    try {
      const response = await request(url, { signal: stop });
      if (!response.ok) continue;
      const $ = load(response.text, { xmlMode: true });
      for (const node of $('sitemap > loc').slice(0, 4)) {
        const child = absolute($(node).text().trim(), url);
        if (child && new URL(child).origin === origin) sitemapQueue.push(child);
      }
      for (const node of $('url > loc').slice(0, 1500)) {
        const href = absolute($(node).text().trim(), url);
        if (href && new URL(href).origin === origin) { mapped.add(href); enqueue(href, url); }
      }
    } catch {}
  }
  add(origin + '/sitemap.xml', 'sitemap', 'Crawlability', 'Readable XML sitemap', mapped.size > 0, mapped.size + ' same-site URLs listed across ' + sitemapSeen.size + ' sitemap requests.', 'Publish an XML sitemap containing canonical public URLs.', 'Warning');
  const bots = ['Googlebot', 'OAI-SearchBot', 'ChatGPT-User', 'Google-Extended', 'PerplexityBot', 'ClaudeBot'];
  const crawlerAccess = bots.map(name => ({ name, allowed: robots.isAllowed(origin + '/', name) !== false }));
  for (const [url, entry] of queue) {
    if (pages.length >= maxPages || stop.aborted) break;
    if (pages.length) {
      try { await pause(Math.max(150, (robots.getCrawlDelay(agent) || 0) * 1000), undefined, { signal: stop }); }
      catch { break; }
    }
    const page = { url, path: new URL(url).pathname, status: null, title: '', description: '', h1: [], wordCount: null, images: 0, missingAlt: 0, internalLinks: 0, externalLinks: 0, depth: entry.depth, sources: [] };
    pages.push(page);
    onProgress({ url, pages: pages.length, maxPages });
    try {
      const response = await request(url, { signal: stop });
      Object.assign(page, { finalUrl: response.url, status: response.status, responseMs: response.responseMs, bytes: response.bytes, redirects: response.redirects });
      add(url, 'http-status', 'Crawlability', 'Successful page response', response.ok, 'HTTP ' + response.status, 'Repair the response or update links to a working destination.', 'Error');
      add(url, 'redirects', 'Crawlability', 'Direct URL without redirects', !response.redirects.length, response.redirects.length + ' redirect(s). Final URL ' + response.url, 'Link directly to the final canonical URL.', 'Notice');
      if (!response.ok) continue;
      if (new URL(response.url).origin !== origin) { add(url, 'scope', 'Crawlability', 'Page remains on the audited site', false, response.url, 'Review cross-domain redirects. This destination was excluded from HTML analysis.'); continue; }
      const isHtml = /text\/html|application\/xhtml\+xml/i.test(response.headers.get('content-type') || '');
      add(url, 'html', 'Crawlability', 'Page serves HTML', isHtml, response.headers.get('content-type') || 'Content type missing.', 'Use text/html for web pages.', 'Notice');
      if (!isHtml) continue;
      const $ = load(response.text);
      page.title = text($, 'title');
      page.description = $('meta[name="description" i]').first().attr('content')?.trim() || '';
      page.h1 = $('h1').map((_, el) => $(el).text().trim()).get();
      const body = $('body').clone(); body.find('script,style,noscript,nav,footer,header').remove();
      const content = body.text().replace(/\s+/g, ' ').trim();
      page.wordCount = content ? content.split(/\s+/u).length : 0;
      page.contentTerms = extractContentTerms([page.title, page.description, content].join(' '));
      page.outboundLinks = [];
      page.contentHash = createHash('sha256').update(content.toLowerCase()).digest('hex');
      const canonicalTags = $('link[rel~="canonical" i]');
      page.canonical = absolute(canonicalTags.first().attr('href'), response.url);
      const directives = ($('meta[name="robots" i]').attr('content') || '') + ' ' + (response.headers.get('x-robots-tag') || '');
      page.indexable = !/\bnoindex\b|\bnone\b/i.test(directives);
      add(url, 'indexable', 'Crawlability', 'Page permits indexing', page.indexable, directives.trim() || 'No blocking robots directive observed.', 'Remove noindex only if this page should be indexed.', 'Warning');
      add(url, 'title', 'Metadata', 'Page title exists', Boolean(page.title), page.title || 'No title found.', 'Add a unique title describing the page.', 'Error');
      if (page.title) add(url, 'title-length', 'Metadata', 'Title length review', page.title.length >= 25 && page.title.length <= 65, page.title.length + ' characters. Length thresholds are editorial heuristics.', 'Review search snippet clarity and potential truncation.', 'Notice');
      add(url, 'description', 'Metadata', 'Meta description exists', Boolean(page.description), page.description || 'No meta description found.', 'Write a unique summary for this page.', 'Warning');
      if (page.description) add(url, 'description-length', 'Metadata', 'Description length review', page.description.length >= 70 && page.description.length <= 170, page.description.length + ' characters. Length thresholds are editorial heuristics.', 'Review the summary for relevance and concision.', 'Notice');
      add(url, 'h1', 'Content', 'One main heading', page.h1.length === 1, page.h1.length + ' H1 headings.', 'Use one descriptive main heading.', 'Warning');
      const headings = $('h1,h2,h3,h4,h5,h6').map((_, el) => Number(el.tagName.slice(1))).get();
      add(url, 'heading-order', 'Content', 'Heading hierarchy', headings.every((level, i) => !i || level <= headings[i - 1] + 1), headings.map(n => 'H' + n).join(', ') || 'No headings.', 'Arrange headings in a logical hierarchy.', 'Notice');
      add(url, 'content-length', 'Content', 'Content depth review', page.wordCount >= 200, page.wordCount + ' source-HTML words. Short pages may be appropriate for their purpose.', 'Review whether the page answers the visitor’s main questions.', 'Notice');
      add(url, 'canonical', 'Metadata', 'Single valid canonical URL', canonicalTags.length === 1 && /^https?:\/\//.test(page.canonical || ''), page.canonical || 'No canonical found.', 'Provide one absolute canonical URL.', 'Warning');
      if (page.canonical) add(url, 'canonical-target', 'Metadata', 'Canonical matches the fetched page', page.canonical.replace(/\/$/, '') === response.url.replace(/\/$/, ''), page.canonical, 'Review whether the canonical points to the intended preferred page.', 'Notice');
      add(url, 'sitemap-member', 'Crawlability', 'Canonical URL appears in the sitemap', mapped.has(page.canonical || url), page.canonical || url, 'Include indexable canonical pages in the sitemap.', 'Notice');
      add(url, 'viewport', 'Content', 'Mobile viewport declaration', Boolean($('meta[name="viewport" i]').attr('content')), $('meta[name="viewport" i]').attr('content') || 'Missing.', 'Declare width=device-width. This check does not measure mobile usability.', 'Warning');
      add(url, 'language', 'International SEO', 'Document language declared', Boolean($('html').attr('lang')), $('html').attr('lang') || 'Missing.', 'Set an appropriate lang attribute on the HTML element.', 'Notice');
      const alternates = $('link[rel~="alternate"][hreflang]');
      page.hreflang = alternates.map((_, el) => ({ language: $(el).attr('hreflang'), url: absolute($(el).attr('href'), response.url) })).get();
      if (alternates.length) add(url, 'hreflang', 'International SEO', 'Valid hreflang declarations', page.hreflang.every(a => /^(?:x-default|[a-z]{2,3}(?:-[a-z0-9]{2,8})*)$/i.test(a.language) && /^https?:/.test(a.url || '')), page.hreflang.length + ' alternates.', 'Use valid language-region codes and public absolute URLs. Reciprocal links outside the sample are unverified.', 'Warning');
      page.images = $('img').length; page.missingAlt = $('img:not([alt])').length;
      if (page.images) {
        add(url, 'image-alt', 'Content', 'Images have alt attributes', !page.missingAlt, page.missingAlt + ' of ' + page.images + ' images missing an alt attribute.', 'Describe meaningful images and use empty alt text for decorative images.', 'Warning');
        const missingDimensions = $('img').filter((_, el) => !$(el).attr('width') || !$(el).attr('height')).length;
        add(url, 'image-dimensions', 'Performance', 'Image dimensions declared', !missingDimensions, missingDimensions + ' images without width or height attributes.', 'Reserve image space using HTML dimensions or an equivalent CSS aspect ratio.', 'Notice');
      }
      const scripts = $('script[type="application/ld+json"]');
      page.schemaTypes = [];
      let validSchema = true;
      function schemaTypes(value) {
        if (!value || typeof value !== 'object') return;
        if (value['@type']) page.schemaTypes.push(...[value['@type']].flat());
        for (const nested of Object.values(value)) if (typeof nested === 'object') for (const node of [nested].flat()) schemaTypes(node);
      }
      for (const el of scripts) {
        try { schemaTypes(JSON.parse($(el).text())); } catch { validSchema = false; }
      }
      add(url, 'schema-present', 'Structured data', 'Structured data detected', scripts.length > 0, [...new Set(page.schemaTypes)].join(', ') || 'No JSON-LD detected.', 'Add appropriate structured data when relevant. JSON-LD presence does not establish rich-result eligibility.', 'Notice');
      if (scripts.length) add(url, 'schema-valid', 'Structured data', 'JSON-LD parses successfully', validSchema, validSchema ? 'All JSON-LD blocks parsed.' : 'Invalid JSON-LD found.', 'Correct the JSON syntax and validate with Google’s Rich Results Test.', 'Error');
      add(url, 'https', 'HTTPS', 'Page uses HTTPS', response.url.startsWith('https://'), response.url, 'Serve the public site securely over HTTPS.', 'Error');
      if (response.url.startsWith('https://')) add(url, 'hsts', 'HTTPS', 'HSTS response header', Boolean(response.headers.get('strict-transport-security')), response.headers.get('strict-transport-security') || 'Not observed.', 'Review HSTS once HTTPS is correctly deployed across the site.', 'Notice');
      const mixed = $('[src^="http://"],link[rel="stylesheet"][href^="http://"]').length;
      if (response.url.startsWith('https://')) add(url, 'mixed-content', 'HTTPS', 'Embedded resources use HTTPS', !mixed, mixed + ' insecure embedded resources.', 'Replace insecure resource URLs with HTTPS.', 'Warning');
      add(url, 'server-response', 'Performance', 'Server response time review', response.responseMs <= 1500, response.responseMs + ' ms to response headers, measured from the audit server.', 'Investigate hosting, application processing and caching. This is not a Core Web Vitals measurement.', 'Warning');
      add(url, 'html-size', 'Performance', 'HTML response size review', response.bytes <= 300000, response.bytes + ' decompressed bytes.', 'Review excessive inline scripts, styles and document markup.', 'Notice');
      const og = ['og:title', 'og:description', 'og:image', 'og:url'].filter(key => !$('meta[property="' + key + '"]').attr('content'));
      add(url, 'open-graph', 'Social sharing', 'Open Graph preview metadata', !og.length, og.length ? 'Missing ' + og.join(', ') : 'Title, description, image and URL found.', 'Provide complete social sharing metadata.', 'Notice');
      add(url, 'twitter-card', 'Social sharing', 'Social card declaration', Boolean($('meta[name="twitter:card"]').attr('content')), $('meta[name="twitter:card"]').attr('content') || 'Missing.', 'Declare a suitable social card format.', 'Notice');
      const links = $('a[href]');
      let emptyAnchors = 0;
      for (const el of links) {
        const link = $(el), href = absolute(link.attr('href'), response.url);
        if (!href || !/^https?:/.test(href)) continue;
        const destination = new URL(href);
        if (!link.text().trim() && !link.attr('aria-label') && !link.find('img[alt]').length) emptyAnchors++;
        if (destination.origin === origin) { page.internalLinks++; enqueue(href, response.url, url, entry.depth + 1); }
        else {
          page.externalLinks++;
          if (page.outboundLinks.length < 300 && !destination.username && !destination.password) {
            destination.search = ''; destination.hash = '';
            page.outboundLinks.push({ url: destination.href, anchor: link.text().trim().slice(0, 160), rel: (link.attr('rel') || '').slice(0, 100) });
          }
        }
      }
      add(url, 'anchor-text', 'Internal links', 'Links have accessible text', !emptyAnchors, emptyAnchors + ' links with no visible text, labelled image or aria-label.', 'Use descriptive anchor text or an accessible label.', 'Notice');
      for (const el of $('img[src],script[src],link[rel="stylesheet"][href]')) {
        const node = $(el), href = absolute(node.attr('src') || node.attr('href'), response.url);
        if (href && new URL(href).origin === origin && !new URL(href).search && !isPrivate(new URL(href).pathname)) assets.add(href);
      }
    } catch (error) {
      page.error = error.message;
      add(url, 'retrieval', 'Crawlability', 'Page can be retrieved', false, error.message, 'Check access rules, TLS, redirects and server availability.', 'Error');
    }
  }
  for (const page of pages) page.sources = [...queue.get(page.url).sources];
  for (const key of ['title', 'description', 'contentHash']) {
    const seen = new Map();
    for (const page of pages.filter(p => p[key])) {
      const value = page[key].toLowerCase();
      const previous = seen.get(value);
      add(page.url, 'unique-' + key, key === 'contentHash' ? 'Content' : 'Metadata', 'Unique ' + (key === 'contentHash' ? 'main source content' : key), !previous, previous ? 'Also found on ' + previous : 'Unique within the crawled sample.', 'Review duplicate content and consolidate or differentiate pages.', key === 'contentHash' ? 'Warning' : 'Notice');
      if (!previous) seen.set(value, page.url);
    }
  }
  for (const page of pages) {
    if (page.status >= 400) for (const source of page.sources) add(source, 'broken-internal-link', 'Internal links', 'Internal destination responds successfully', false, page.url + ' returned HTTP ' + page.status, 'Repair or replace the link to this destination.', 'Error');
    if (page.status >= 200 && page.status < 300 && page.url !== origin + '/' && !page.sources.length)
      add(page.url, 'inbound-links', 'Internal links', 'Incoming internal links observed', false, 'No incoming links in the crawled sample.', 'Review internal navigation. Pages outside this sample may link here.', 'Notice');
  }
  const checkedAssets = [];
  for (const url of [...assets].slice(0, 8)) {
    if (stop.aborted || robots.isAllowed(url, agent) === false) continue;
    try {
      const asset = await request(url, { signal: stop, method: 'HEAD' });
      checkedAssets.push({ url, status: asset.status });
      // Some hosts disable HEAD. Such responses do not establish that an asset is broken.
      if (![405, 501].includes(asset.status)) add(url, 'asset-response', 'Performance', 'Sampled resource responds successfully', asset.ok, 'HTTP ' + asset.status + ' from a HEAD request.', 'Repair this image, script or stylesheet URL, or remove its reference.', 'Warning');
    } catch { checkedAssets.push({ url, status: null }); }
  }
  const htmlPages = pages.filter(p => p.wordCount !== null);
  const groups = auditGroups.map(name => {
    const list = checks.filter(c => c.group === name), failed = list.filter(c => !c.passed);
    return { name, checked: list.length, passed: list.length - failed.length, findings: failed.length };
  });
  const weights = { Error: 5, Warning: 2, Notice: 1 };
  const totalWeight = checks.reduce((sum, check) => sum + weights[check.severity], 0);
  const failedWeight = checks.filter(c => !c.passed).reduce((sum, check) => sum + weights[check.severity], 0);
  const issues = checks.filter(c => !c.passed);
  return {
    error: htmlPages.length ? undefined : 'No HTML pages were evaluated. Review robots rules, server responses and crawl coverage.',
    url: target.href, startedAt, finishedAt: new Date().toISOString(), pages, checks, issues, groups, robots: robotsInfo, crawlerAccess,
    coverage: { limit: maxPages, discovered: queue.size, crawled: pages.length, htmlPages: htmlPages.length, sitemapUrls: mapped.size, truncated: queue.size > pages.length, timedOut: stop.aborted, assetUrlsDiscovered: assets.size, assetsChecked: checkedAssets },
    summary: htmlPages.length ? {
      health: Math.round(100 * (1 - failedWeight / Math.max(1, totalWeight))),
      passed: checks.length - issues.length, checks: checks.length, errors: issues.filter(i => i.severity === 'Error').length, warnings: issues.filter(i => i.severity === 'Warning').length, notices: issues.filter(i => i.severity === 'Notice').length,
      indexablePages: htmlPages.filter(p => p.indexable).length, averageResponseMs: Math.round(htmlPages.reduce((sum, p) => sum + p.responseMs, 0) / htmlPages.length),
      averageWords: Math.round(htmlPages.reduce((sum, p) => sum + p.wordCount, 0) / htmlPages.length), missingAlt: htmlPages.reduce((sum, p) => sum + p.missingAlt, 0),
    } : null,
  };
}
