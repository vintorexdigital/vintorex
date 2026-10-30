// Validates the service catalog and blog content. Run: npm run check
import { SERVICES, ADDONS, COMPETITOR_SOURCES, PLANS, CATEGORIES } from '../dist/js/data.js';
import { POSTS, md, toc } from '../dist/js/blog/index.js';
import { ART } from '../dist/js/service-art.js';
import { serviceFaqs, serviceAnswer, siteFaqs } from '../dist/js/seo.js';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const errs = [];
const ids = new Set(SERVICES.map(s => s.id));
const cats = new Set(CATEGORIES.map(c => c.id));

for (const s of SERVICES) {
  if (!cats.has(s.cat)) errs.push(`${s.id}: unknown category ${s.cat}`);
  if (s.tiers.length !== 3) errs.push(`${s.id}: needs 3 tiers`);
  for (let t = 1; t <= 3; t++) {
    const sum = s.split.reduce((a, r) => a + r[t], 0);
    if (sum !== 100) errs.push(`${s.id}: split column ${t} sums to ${sum}`);
  }
  s.works.forEach(w => { if (w.length !== 4) errs.push(`${s.id}: works row "${w[0]}" has ${w.length} cells`); });
  s.competitors.forEach(c => c.src.forEach(k => { if (!COMPETITOR_SOURCES[k]) errs.push(`${s.id}: unknown source ${k}`); }));
  for (const k of ['overview', 'idealFor', 'process', 'excludes', 'term', 'delivery', 'market']) if (!s[k]) errs.push(`${s.id}: missing ${k}`);
}
for (const s of SERVICES) {
  const a = ART[s.id];
  if (!a) { errs.push(`${s.id}: missing image block in service-art.js`); continue; }
  if (a.alt.length < 40) errs.push(`${s.id}: alt text too short`);
  if (!a.keywords || a.keywords.length < 40) errs.push(`${s.id}: meta keywords too short`);
  if (a.chips.length !== 3) errs.push(`${s.id}: needs 3 image chips`);
}
for (const a of ADDONS) a.for.forEach(f => { if (!ids.has(f)) errs.push(`add-on ${a.id}: unknown service ${f}`); });
if (new Set(ADDONS.map(a => a.id)).size !== ADDONS.length) errs.push('duplicate add-on ids');
for (const p of PLANS) {
  (p.includes || []).forEach(i => { const [sid, t] = i.split(':'); if (!SERVICES.find(s => s.id === sid)?.tiers.find(x => x.name === t)) errs.push(`plan ${p.id}: bad include ${i}`); });
  (p.extras || []).forEach(e => { if (!ADDONS.find(a => a.id === e)) errs.push(`plan ${p.id}: unknown add-on ${e}`); });
}

const slugs = new Set();
for (const p of POSTS) {
  if (slugs.has(p.slug)) errs.push(`duplicate slug ${p.slug}`);
  slugs.add(p.slug);
  if (!ids.has(p.service)) errs.push(`${p.slug}: unknown service ${p.service}`);
  for (const [, href] of p.body.matchAll(/\]\((#\/[^)]+|\/blog\/[^)]+)\)/g)) {
    const m = href.match(/^#\/services\/([\w-]+)/);
    const b = href.match(/^\/blog\/([\w-]+)\/$/);
    if (m && !ids.has(m[1])) errs.push(`${p.slug}: link to unknown service ${m[1]}`);
    if (b && !POSTS.some(x => x.slug === b[1])) errs.push(`${p.slug}: link to unknown guide ${b[1]}`);
    if (!m && !b) errs.push(`${p.slug}: unsupported link ${href}`);
  }
  const html = md(p.body);
  if (/\*\*|\]\(|\|\s*---/.test(html)) errs.push(`${p.slug}: unrendered markup`);
  const text = p.body + p.faqs.flat().join(' ');
  if (/\b20[12]\d\b/.test(text)) errs.push(`${p.slug}: mentions a year`);
  if (/₹\s?\d/.test(text)) errs.push(`${p.slug}: mentions a price`);
  if (toc(p).length < 3) errs.push(`${p.slug}: fewer than 3 sections`);
}
for (const s of SERVICES) {
  const n = POSTS.filter(p => p.service === s.id).length;
  if (n < 2) errs.push(`${s.id}: only ${n} guide(s), needs at least 2`);
}

// SEO / GEO / AEO: every service has a generated static page, answer text and FAQs,
// and the published files list all of them. Skipped until `npm run build:blog` has run.
const dist = p => fileURLToPath(new URL('../dist/' + p, import.meta.url));
for (const s of SERVICES) {
  if (serviceAnswer(s).length < 80) errs.push(`${s.id}: answer text too short`);
  if (serviceFaqs(s).length < 6) errs.push(`${s.id}: needs at least 6 FAQs`);
  if (s.summary.length > 160) errs.push(`${s.id}: summary over 160 characters (used in snippets)`);
  const f = dist(`services/${s.id}/index.html`);
  if (!existsSync(f)) { errs.push(`${s.id}: static page missing, run npm run build:blog`); continue; }
  const h = readFileSync(f, 'utf8');
  if ((h.match(/<h1[ >]/g) || []).length !== 1) errs.push(`${s.id}: page needs exactly one h1`);
  for (const k of ['"@type":"Service"', '"@type":"FAQPage"', 'rel="canonical"', 'name="description"']) if (!h.includes(k)) errs.push(`${s.id}: page missing ${k}`);
  if (!readFileSync(dist('sitemap.xml'), 'utf8').includes(`/services/${s.id}/`)) errs.push(`${s.id}: not in sitemap.xml`);
  if (!readFileSync(dist('llms.txt'), 'utf8').includes(`/services/${s.id}/`)) errs.push(`${s.id}: not in llms.txt`);
}
if (siteFaqs(SERVICES).length < 8) errs.push('site FAQ list too short');
for (const f of ['faq/index.html', 'services/index.html', 'llms-full.txt', 'robots.txt']) if (!existsSync(dist(f))) errs.push(`${f} missing, run npm run build:blog`);

if (errs.length) { console.error('Content check failed:\n- ' + errs.join('\n- ')); process.exit(1); }
console.log(`OK: ${SERVICES.length} services, ${ADDONS.length} add-ons, ${SERVICES.reduce((a, s) => a + s.works.length, 0)} work items, ${POSTS.length} guides.`);
