// Generates static, indexable blog pages from dist/js/blog:
//   dist/blog/index.html, dist/blog/<slug>/index.html, dist/sitemap.xml, dist/robots.txt
// and refreshes the LocalBusiness structured data in dist/index.html.
//
// Usage: npm run build:blog   (or SITE_URL=https://example.com npm run build:blog)
// Output is deterministic, so re-running without content changes leaves git clean.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { POSTS, postsFor, toc } from '../dist/js/blog/index.js';
import { articleHtml, postCard, postUrl } from '../dist/js/blog/render.js';
import { siteHeader, siteFooter } from '../dist/js/chrome.js';
import { SERVICES, CATEGORIES, BUSINESS } from '../dist/js/data.js';
import { esc, icon } from '../dist/js/ui.js';

const SITE = (process.env.SITE_URL || 'https://vintorex.com').replace(/\/$/, '');
const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const svc = id => SERVICES.find(s => s.id === id);

// ---------- checks: fail the build rather than publish broken pages ----------
const problems = [];
for (const s of SERVICES) if (postsFor(s.id).length < 2) problems.push(`${s.id} has fewer than 2 guides`);
for (const p of POSTS) {
  if (!svc(p.service)) problems.push(`${p.slug}: unknown service ${p.service}`);
  for (const [, id] of p.body.matchAll(/\]\(#\/services\/([\w-]+)\)/g)) if (!svc(id)) problems.push(`${p.slug}: link to unknown service ${id}`);
  if (!/^[a-z0-9-]+$/.test(p.slug)) problems.push(`${p.slug}: slug must be lowercase letters, numbers and dashes`);
}
if (new Set(POSTS.map(p => p.slug)).size !== POSTS.length) problems.push('duplicate slugs');
if (problems.length) { console.error('Blog build failed:\n- ' + problems.join('\n- ')); process.exit(1); }

// ---------- page shell ----------
const FAVICON = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='9' fill='%234b2bd6'/%3E%3Cpath d='m8 9 8 15 8-15' fill='none' stroke='%23fff' stroke-width='3.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E`;
const ORG = {
  '@type': 'LocalBusiness', '@id': SITE + '/#business',
  name: BUSINESS.name, url: SITE + '/', email: BUSINESS.email, telephone: BUSINESS.phone,
  address: {
    '@type': 'PostalAddress', streetAddress: BUSINESS.postal.street, addressLocality: BUSINESS.postal.city,
    addressRegion: BUSINESS.postal.region, postalCode: BUSINESS.postal.code, addressCountry: BUSINESS.postal.country,
  },
  geo: { '@type': 'GeoCoordinates', latitude: BUSINESS.geo.lat, longitude: BUSINESS.geo.lng },
  hasMap: BUSINESS.maps,
  sameAs: [...Object.values(BUSINESS.social), BUSINESS.google],
};
const jsonLd = data => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

function page({ path, title, description, type = 'website', body, schema = [] }) {
  const url = SITE + path;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${url}">
  <meta name="theme-color" content="#4b2bd6">
  <meta property="og:type" content="${type}">
  <meta property="og:site_name" content="${esc(BUSINESS.name)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">
  <meta name="twitter:card" content="summary">
  <link rel="icon" href="${FAVICON}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/app.css">
  ${schema.map(jsonLd).join('\n  ')}
</head>
<body>
${siteHeader({ base: '/', here: 'blog' })}
<main id="main">
${body}
</main>
${siteFooter({ base: '/' })}
<script src="/js/static.js" defer></script>
</body>
</html>
`;
}

// ---------- article pages ----------
function articlePage(p) {
  const s = svc(p.service);
  const path = postUrl(p);
  const url = SITE + path;
  return page({
    path, type: 'article',
    title: `${p.title} | ${BUSINESS.short} Blog`,
    description: p.excerpt,
    body: articleHtml(p, svc, { app: '/', url }),
    schema: [
      {
        '@context': 'https://schema.org', '@type': 'BlogPosting',
        headline: p.title, description: p.excerpt, url, mainEntityOfPage: url,
        articleSection: s.name, keywords: [s.name, ...toc(p).map(([, t]) => t)].join(', '),
        wordCount: [p.body, ...p.takeaways, ...p.faqs.flat()].join(' ').split(/\s+/).length,
        timeRequired: `PT${p.minutes}M`, inLanguage: 'en-IN',
        author: ORG, publisher: ORG,
      },
      {
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: p.faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
      },
      {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: SITE + '/blog/' },
          { '@type': 'ListItem', position: 3, name: p.title, item: url },
        ],
      },
    ],
  });
}

// ---------- blog index ----------
function indexPage() {
  const search = p => esc([p.title, p.excerpt, svc(p.service).name, p.takeaways.join(' ')].join(' ').toLowerCase());
  const body = `<section class="blog-hero"><div class="shell section">
      <p class="eyebrow"><span></span>Vintorex blog</p>
      <h1>Guides that stay useful</h1>
      <p class="lead">${POSTS.length} practical, evergreen guides — at least two for every service we offer. No fads, no fluff: principles that keep working.</p>
      <form class="blog-search" id="blog-search" role="search"><input type="search" id="blog-q" placeholder="Search guides…" aria-label="Search guides"><button class="btn primary">${icon('search')} Search</button></form>
      <p class="muted" id="blog-count" aria-live="polite"></p>
    </div></section>
    <section class="shell section">
      <nav class="chips" aria-label="Categories">${CATEGORIES.map(c => `<a class="chip" href="#${c.id}">${esc(c.name)}</a>`).join('')}</nav>
      ${CATEGORIES.map(c => `<h2 class="cat-head" id="${c.id}">${esc(c.name)} <small class="muted">${esc(c.blurb)}</small></h2>
        ${SERVICES.filter(s => s.cat === c.id).map(s => `<div class="blog-group" id="${s.id}"><div class="sec-head"><h3 class="h3"><span class="svc-ic sm">${icon(s.icon)}</span>${esc(s.name)}</h3><a class="link" href="/#/services/${s.id}">View service ${icon('arrow')}</a></div>
          <div class="cards2">${postsFor(s.id).map(p => postCard(p, s, `data-search="${search(p)}"`)).join('')}</div></div>`).join('')}`).join('')}
    </section>`;
  return page({
    path: '/blog/',
    title: `Blog — Evergreen guides on websites, SEO, social media & more | ${BUSINESS.short}`,
    description: `${POSTS.length} evergreen guides from ${BUSINESS.name} on websites, e-commerce, apps, SEO, social media, ads, email, branding, content, video, industrial design, cloud, analytics and maintenance.`,
    body,
    schema: [{
      '@context': 'https://schema.org', '@type': 'Blog', name: `${BUSINESS.short} Blog`, url: SITE + '/blog/', publisher: ORG,
      blogPost: POSTS.map(p => ({ '@type': 'BlogPosting', headline: p.title, url: SITE + postUrl(p) })),
    }],
  });
}

// ---------- write ----------
const out = (rel, text) => mkdir(dirname(join(DIST, rel)), { recursive: true }).then(() => writeFile(join(DIST, rel), text));

await rm(join(DIST, 'blog'), { recursive: true, force: true });
await out('blog/index.html', indexPage());
for (const p of POSTS) await out(`blog/${p.slug}/index.html`, articlePage(p));

const urls = ['/', '/blog/', ...POSTS.map(postUrl)];
await out('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${SITE}${u}</loc></url>`).join('\n')}
</urlset>
`);
// The app's home page carries the same business details for local search.
const appIndex = join(DIST, 'index.html');
const html = await readFile(appIndex, 'utf8');
const block = /<!-- business-jsonld -->[\s\S]*?<!-- \/business-jsonld -->/;
if (!block.test(html)) { console.error('dist/index.html is missing the business-jsonld markers'); process.exit(1); }
await writeFile(appIndex, html.replace(block, `<!-- business-jsonld -->\n  <link rel="canonical" href="${SITE}/">\n  ${jsonLd({ '@context': 'https://schema.org', ...ORG })}\n  <!-- /business-jsonld -->`));

await out('robots.txt', `User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
`);

console.log(`Built ${POSTS.length} guides + blog index, sitemap.xml (${urls.length} URLs) and robots.txt for ${SITE}`);
