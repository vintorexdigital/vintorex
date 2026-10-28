// Validates the service catalog and blog content. Run: npm run check
import { SERVICES, ADDONS, COMPETITOR_SOURCES, PLANS, CATEGORIES } from '../dist/js/data.js';
import { POSTS, md, toc } from '../dist/js/blog/index.js';
import { ART } from '../dist/js/service-art.js';

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

if (errs.length) { console.error('Content check failed:\n- ' + errs.join('\n- ')); process.exit(1); }
console.log(`OK: ${SERVICES.length} services, ${ADDONS.length} add-ons, ${SERVICES.reduce((a, s) => a + s.works.length, 0)} work items, ${POSTS.length} guides.`);
