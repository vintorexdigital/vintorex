// Generates static, indexable blog pages from dist/js/blog and policy pages from dist/js/policies.js:
//   dist/blog/index.html, dist/blog/<slug>/index.html, dist/<policy>/index.html, dist/sitemap.xml, dist/robots.txt
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
import { brandHead } from '../dist/js/brand.js';
import { ART, CATALOG_KEYWORDS, serviceImagePath } from '../dist/js/service-art.js';
import { esc, icon } from '../dist/js/ui.js';
import { POLICIES, policyHtml } from '../dist/js/policies.js';
import { REVIEWED, serviceBody, servicesIndexBody, faqBody, serviceSchema, serviceAnswer, serviceFaqs, siteFaqs, faqSchema, breadcrumbSchema, servicePath, fromPrice, inr, llmsTxt, llmsFullTxt } from '../dist/js/seo.js';

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
const ORG = {
  '@type': 'LocalBusiness', '@id': SITE + '/#business',
  name: BUSINESS.name, alternateName: 'Vintorex', logo: { '@type': 'ImageObject', url: SITE + '/images/vintorex-logo.png', width: 512, height: 512 }, image: SITE + '/images/vintorex-social.png', url: SITE + '/', email: BUSINESS.email, telephone: BUSINESS.phone,
  address: {
    '@type': 'PostalAddress', streetAddress: BUSINESS.postal.street, addressLocality: BUSINESS.postal.city,
    addressRegion: BUSINESS.postal.region, postalCode: BUSINESS.postal.code, addressCountry: BUSINESS.postal.country,
  },
  geo: { '@type': 'GeoCoordinates', latitude: BUSINESS.geo.lat, longitude: BUSINESS.geo.lng },
  hasMap: BUSINESS.maps,
  sameAs: [...Object.values(BUSINESS.social), BUSINESS.google],
};
const jsonLd = data => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

// Indexing directives, language/region and local signals shared by every page.
const seoHead = url => `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <link rel="alternate" hreflang="en-IN" href="${url}">
  <link rel="alternate" hreflang="x-default" href="${url}">
  <meta property="og:locale" content="en_IN">
  <meta name="geo.region" content="IN-TN">
  <meta name="geo.placename" content="Coimbatore">
  <meta name="geo.position" content="${BUSINESS.geo.lat};${BUSINESS.geo.lng}">
  <meta name="ICBM" content="${BUSINESS.geo.lat}, ${BUSINESS.geo.lng}">`;

function page({ path, title, description, keywords = '', type = 'website', image = '', imageAlt = '', body, schema = [], here = 'blog' }) {
  const url = SITE + path;
  const ogImg = image || (SITE + '/images/vintorex-social.png');
  const ogImgAlt = imageAlt || 'Vintorex brand logo';
  const photo = /\.jpe?g($|\?)/i.test(ogImg);
  const kw = keywords || 'digital marketing blog, web development guides, seo playbooks, coimbatore business growth, ecommerce tips, ai automation guides';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; frame-src https://www.google.com; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="keywords" content="${esc(kw)}">
  <link rel="canonical" href="${url}">
  ${seoHead(url)}
  ${brandHead()}
  <meta property="og:type" content="${type}">
  <meta property="og:site_name" content="Vintorex">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${esc(ogImg)}">
  <meta property="og:image:type" content="${photo ? 'image/jpeg' : 'image/png'}">
  <meta property="og:image:width" content="${photo ? '1600' : '1200'}">
  <meta property="og:image:height" content="${photo ? '900' : '630'}">
  <meta property="og:image:alt" content="${esc(ogImgAlt)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${esc(ogImg)}">
  <meta name="twitter:image:alt" content="${esc(ogImgAlt)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/app.css">
  ${schema.map(jsonLd).join('\n  ')}
</head>
<body>
${siteHeader({ base: '/', here })}
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
  const art = ART[s.id] || {};
  const keywords = p.keywords || [art.keywords, p.title, 'Coimbatore digital marketing', 'Vintorex guide'].filter(Boolean).join(', ');
  const image = `${SITE}${p.image || `/images/blog/${p.slug}.jpg`}`;
  const imageAlt = p.imageAlt || (art.alt ? `${art.alt}. Guide: ${p.title}` : p.title);
  return page({
    path, type: 'article',
    title: `${p.title} | ${BUSINESS.short} Blog`,
    description: p.excerpt,
    keywords,
    image,
    imageAlt,
    body: articleHtml(p, svc, { app: '/', url }),
    schema: [
      {
        '@context': 'https://schema.org', '@type': 'BlogPosting',
        headline: p.title, description: p.excerpt, image, url, mainEntityOfPage: url,
        articleSection: s.name, keywords,
        wordCount: [p.body, ...p.takeaways, ...p.faqs.flat()].join(' ').split(/\s+/).length,
        timeRequired: `PT${p.minutes}M`, inLanguage: 'en-IN',
        datePublished: REVIEWED.iso, dateModified: REVIEWED.iso,
        about: { '@type': 'Service', name: s.name, url: SITE + servicePath(s.id) },
        speakable: { '@type': 'SpeakableSpecification', cssSelector: ['.post-head h1', '.post-head .lead', '.takeaways'] },
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
    keywords: `${CATALOG_KEYWORDS}, digital marketing blog coimbatore, vintorex guides`,
    image: `${SITE}/images/vintorex-social.png`,
    imageAlt: 'Vintorex brand logo',
    body,
    schema: [{
      '@context': 'https://schema.org', '@type': 'Blog', name: `${BUSINESS.short} Blog`, url: SITE + '/blog/', publisher: ORG,
      blogPost: POSTS.map(p => ({ '@type': 'BlogPosting', headline: p.title, url: SITE + postUrl(p) })),
    }],
  });
}

// ---------- policy pages ----------
const policyPage = p => page({
  path: p.path, here: '',
  title: `${p.title} | ${BUSINESS.name}`,
  description: p.description,
  keywords: `vintorex ${p.title.toLowerCase()}, ${p.label.toLowerCase()}, vintorex digital solutions policies`,
  body: policyHtml(p),
  schema: [{ '@context': 'https://schema.org', '@type': 'WebPage', name: p.title, url: SITE + p.path, publisher: ORG }],
});

// ---------- write ----------
const out = (rel, text) => mkdir(dirname(join(DIST, rel)), { recursive: true }).then(() => writeFile(join(DIST, rel), text));

await rm(join(DIST, 'blog'), { recursive: true, force: true });
await out('blog/index.html', indexPage());
for (const p of POSTS) await out(`blog/${p.slug}/index.html`, articlePage(p));
for (const p of POLICIES) await out(`${p.slug}/index.html`, policyPage(p));

// ---------- service pages, services index and FAQ ----------
const ORG_ID = ORG['@id'];
const servicesIndex = () => page({
  path: '/services/', here: '/services',
  title: `Digital Services & Prices in Coimbatore | ${BUSINESS.short}`,
  description: `${SERVICES.length} digital services with published prices from ${inr(Math.min(...SERVICES.map(fromPrice)))} (excl. GST): websites, e-commerce, apps, SEO, social media, ads, branding, cloud and AI automation in Coimbatore.`,
  keywords: CATALOG_KEYWORDS,
  body: servicesIndexBody(SERVICES),
  schema: [
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Digital services and prices in Coimbatore', url: SITE + '/services/', dateModified: REVIEWED.iso, publisher: { '@id': ORG_ID } },
    { '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: SERVICES.map((s, i) => ({ '@type': 'ListItem', position: i + 1, name: s.name, url: SITE + servicePath(s.id) })) },
    breadcrumbSchema(SITE, [['Home', '/'], ['Services', '/services/']]),
  ],
});
const servicePage = s => page({
  path: servicePath(s.id), here: '/services',
  title: `${s.name} in Coimbatore: Prices from ${inr(fromPrice(s))} | ${BUSINESS.short}`,
  description: serviceAnswer(s).split('. ')[0] + '. Compare packages, what is included and market prices.',
  keywords: [s.name, `${s.name} coimbatore`, `${s.name} price`, `${s.name} cost india`, cat(s)?.name, 'Vintorex'].filter(Boolean).join(', '),
  image: SITE + serviceImagePath(s.id),
  imageAlt: ART[s.id]?.alt || s.name,
  body: serviceBody(s),
  schema: [
    serviceSchema(s, SITE, ORG_ID),
    faqSchema(serviceFaqs(s)),
    { '@context': 'https://schema.org', '@type': 'WebPage', url: SITE + servicePath(s.id), name: s.name, dateModified: REVIEWED.iso, inLanguage: 'en-IN', speakable: { '@type': 'SpeakableSpecification', cssSelector: ['.post-head h1', '.answer p'] }, isPartOf: { '@id': SITE + '/#website' } },
    breadcrumbSchema(SITE, [['Home', '/'], ['Services', '/services/'], [s.name, servicePath(s.id)]]),
  ],
});
const SITE_FAQS = siteFaqs(SERVICES, SITE);
const faqPage = () => page({
  path: '/faq/', here: '/faq',
  title: `FAQ: Services, Prices & Payments | ${BUSINESS.name}`,
  description: 'Answers about Vintorex Digital Solutions in Coimbatore: what we do, where we are, how much services cost, GST, payment methods, instalments and the free audit.',
  body: faqBody(SITE_FAQS),
  schema: [faqSchema(SITE_FAQS), breadcrumbSchema(SITE, [['Home', '/'], ['FAQ', '/faq/']])],
});
const cat = s => CATEGORIES.find(c => c.id === s.cat);

await out('services/index.html', servicesIndex());
for (const s of SERVICES) await out(`services/${s.id}/index.html`, servicePage(s));
await out('faq/index.html', faqPage());

// ---------- sitemap, robots and llms.txt ----------
const urls = ['/', '/services/', ...SERVICES.map(s => servicePath(s.id)), '/faq/', '/blog/', ...POSTS.map(postUrl), ...POLICIES.map(p => p.path)];
const priority = u => u === '/' ? '1.0' : u === '/services/' || u.startsWith('/services/') ? '0.9' : u === '/faq/' || u === '/blog/' ? '0.8' : u.startsWith('/blog/') ? '0.7' : '0.3';
await out('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${SITE}${u}</loc><lastmod>${REVIEWED.iso}</lastmod><priority>${priority(u)}</priority></url>`).join('\n')}
</urlset>
`);
await out('llms.txt', llmsTxt(SITE, SERVICES, POSTS));
await out('llms-full.txt', llmsFullTxt(SITE, SERVICES));

// ---------- home page (the app shell): title, schema and no-JavaScript content ----------
const appIndex = join(DIST, 'index.html');
const HOME_TITLE = 'Vintorex Digital Solutions: Web Design, SEO & AI Services in Coimbatore';
const noscript = `<!-- seo-noscript -->
  <noscript>
    <main style="max-width:860px;margin:0 auto;padding:24px;font-family:system-ui,sans-serif;line-height:1.55">
      <h1>${esc(BUSINESS.name)}: digital marketing, web development and AI services in Coimbatore</h1>
      <p>${esc(`${SERVICES.length} services with published prices from ${inr(Math.min(...SERVICES.map(fromPrice)))} (excluding 18% GST): websites, online stores, mobile apps, SEO, social media, ads, branding, cloud hosting, analytics and AI automation.`)}</p>
      <p>The online shop, customer dashboard and checkout need JavaScript. The pages below work without it.</p>
      <ul>${SERVICES.map(s => `<li><a href="${servicePath(s.id)}">${esc(s.name)}</a>: from ${inr(fromPrice(s))}${s.billing === 'month' ? '/month' : ''}</li>`).join('')}</ul>
      <p><a href="/services/">All services and prices</a> · <a href="/faq/">FAQ</a> · <a href="/blog/">Guides</a> · <a href="/privacy-policy/">Privacy</a> · <a href="/terms/">Terms</a></p>
      <p>${esc(BUSINESS.address)} · <a href="tel:+918667209838">${esc(BUSINESS.phone)}</a> · <a href="mailto:${BUSINESS.email}">${esc(BUSINESS.email)}</a></p>
    </main>
  </noscript>
  <!-- /seo-noscript -->`;
const WEBSITE = {
  '@context': 'https://schema.org', '@type': 'WebSite', '@id': SITE + '/#website', url: SITE + '/', name: BUSINESS.name, alternateName: 'Vintorex',
  inLanguage: 'en-IN', publisher: { '@id': ORG_ID },
};
const HOME_SCHEMA = [
  { '@context': 'https://schema.org', ...ORG, '@type': ['LocalBusiness', 'ProfessionalService'], priceRange: `${inr(Math.min(...SERVICES.map(fromPrice)))}+`, areaServed: [{ '@type': 'City', name: 'Coimbatore' }, { '@type': 'Country', name: 'India' }], currenciesAccepted: 'INR', paymentAccepted: 'UPI, RuPay, Visa, Mastercard, Net Banking',
    hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Vintorex services', itemListElement: SERVICES.map(s => ({ '@type': 'Offer', url: SITE + servicePath(s.id), price: fromPrice(s), priceCurrency: 'INR', itemOffered: { '@type': 'Service', name: s.name, description: s.summary } })) } },
  WEBSITE,
];
let html = await readFile(appIndex, 'utf8');
html = html.replace(/<!-- brand-meta -->[\s\S]*?<!-- \/brand-meta -->/, `<!-- brand-meta -->\n  ${brandHead()}\n  <!-- /brand-meta -->`)
  .replace(/(<meta (?:property="og:(?:image|url)"|name="twitter:image") content=")[^"]+(">)/g, (match, prefix, suffix) => prefix + SITE + (match.includes('og:url') ? '/' : '/images/vintorex-social.png') + suffix)
  .replace(/<title>[^<]*<\/title>/, `<title>${esc(HOME_TITLE)}</title>`)
  .replace(/<noscript>Please enable[^<]*<\/noscript>/, noscript)
  .replace(/<!-- seo-noscript -->[\s\S]*?<!-- \/seo-noscript -->/, noscript);
const block = /<!-- business-jsonld -->[\s\S]*?<!-- \/business-jsonld -->/;
if (!block.test(html)) { console.error('dist/index.html is missing the business-jsonld markers'); process.exit(1); }
await writeFile(appIndex, html.replace(block, `<!-- business-jsonld -->\n  <link rel="canonical" href="${SITE}/">\n  ${seoHead(SITE + '/')}\n  ${HOME_SCHEMA.map(jsonLd).join('\n  ')}\n  <!-- /business-jsonld -->`));

// Explicitly welcome search and AI crawlers; keep the payment API out of indexes.
const BOTS = ['Googlebot', 'Bingbot', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'anthropic-ai', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot', 'Applebot-Extended', 'CCBot', 'Bytespider', 'Amazonbot', 'meta-externalagent', 'DuckAssistBot', 'cohere-ai'];
await out('robots.txt', `# Vintorex Digital Solutions: public pages are open to search engines and AI assistants.
# Site map for AI assistants: ${SITE}/llms.txt

User-agent: *
Disallow: /api/

${BOTS.map(b => `User-agent: ${b}\nAllow: /\nDisallow: /api/\n`).join('\n')}
Sitemap: ${SITE}/sitemap.xml
`);

console.log(`Built ${POSTS.length} guides, ${SERVICES.length} service pages, services index, FAQ, ${POLICIES.length} policy pages, sitemap.xml (${urls.length} URLs), robots.txt, llms.txt and llms-full.txt for ${SITE}`);
