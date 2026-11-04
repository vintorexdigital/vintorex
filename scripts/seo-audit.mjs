// Prints the on-page and off-page SEO setup report. Exits 1 when a check fails.
import { fileURLToPath } from 'node:url';
import { auditSeo } from '../server/seo-audit.mjs';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const report = auditSeo(dist);
const line = c => `${c.ok ? 'ok ' : 'FAIL'}  ${c.name} — ${c.detail}`;
console.log('On-page');
for (const c of report.onPage) console.log(line(c));
console.log('\nOff-page');
for (const c of report.offPage) console.log(line(c));
console.log(`\n${report.passed}/${report.total} passed`);
if (!report.ok) process.exit(1);
