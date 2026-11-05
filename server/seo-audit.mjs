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

export function seoReportHtml() { return publicAuditShell(); }
